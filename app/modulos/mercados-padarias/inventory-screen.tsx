"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Barcode,
  CalendarClock,
  CircleX,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  applyStockMovement,
  calculateSalePrice,
  computeInventoryMetrics,
  EMPTY_INVENTORY_PRODUCTS,
  EMPTY_INVENTORY_SUPPLIERS,
  generateEan13,
  getExpirationStatus,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  isLowStock,
  type InventoryProduct,
  type InventorySupplier,
  type InventoryUnit,
  type StockMovementRecord,
  type StockMovementType,
} from "@/lib/market-inventory";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}

export interface InventoryScreenProps {
  initialProducts?: InventoryProduct[];
  products?: InventoryProduct[];
  initialSuppliers?: InventorySupplier[];
  suppliers?: InventorySupplier[];
  referenceDate?: Date;
  onSaveProduct?: (product: InventoryProduct, isEdit: boolean) => void;
  onDeleteProduct?: (productId: string) => void;
  onMoveStock?: (
    updatedProduct: InventoryProduct,
    movement: StockMovementRecord,
  ) => void;
  onSaveSupplier?: (supplier: InventorySupplier, isEdit: boolean) => void;
}

interface ProductFormDraft {
  id?: string;
  code: string;
  barcode: string;
  description: string;
  category: string;
  unit: InventoryUnit;
  unitCost: string;
  suggestedMargin: string;
  salePrice: string;
  currentStock: string;
  minStock: string;
  expirationDate: string;
  supplierId: string;
  active: boolean;
}

interface SupplierFormDraft {
  id?: string;
  name: string;
  document: string;
  representative: string;
  contact: string;
  email: string;
  notes: string;
}

function createEmptyProductDraft(
  defaultSupplierId = "",
  nextCodeNumber = 1001,
): ProductFormDraft {
  return {
    code: String(nextCodeNumber),
    barcode: "7891000100103",
    description: "",
    category: INVENTORY_CATEGORIES[0],
    unit: "UN",
    unitCost: "",
    suggestedMargin: "35",
    salePrice: "",
    currentStock: "",
    minStock: "",
    expirationDate: "",
    supplierId: defaultSupplierId,
    active: true,
  };
}

function productToDraft(
  product: InventoryProduct,
  suppliers: InventorySupplier[],
): ProductFormDraft {
  const matchedSupplier =
    suppliers.find((s) => s.id === product.supplierId) ??
    suppliers.find((s) => s.name === product.supplierName);

  return {
    id: product.id,
    code: product.code ?? "1001",
    barcode: product.barcode,
    description: product.description,
    category: product.category,
    unit: product.unit,
    unitCost: String(product.unitCost),
    suggestedMargin: String(product.suggestedMargin),
    salePrice: String(product.salePrice),
    currentStock: String(product.currentStock),
    minStock: String(product.minStock),
    expirationDate: product.expirationDate,
    supplierId: matchedSupplier?.id ?? "",
    active: product.active !== false,
  };
}

function createEmptySupplierDraft(): SupplierFormDraft {
  return {
    name: "",
    document: "",
    representative: "",
    contact: "",
    email: "",
    notes: "",
  };
}

function supplierToDraft(supplier: InventorySupplier): SupplierFormDraft {
  return {
    id: supplier.id,
    name: supplier.name,
    document: supplier.document,
    representative: supplier.representative,
    contact: supplier.contact,
    email: supplier.email,
    notes: supplier.notes,
  };
}

function formatDateDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function InventoryScreen({
  initialProducts = EMPTY_INVENTORY_PRODUCTS,
  products: controlledProducts,
  initialSuppliers = EMPTY_INVENTORY_SUPPLIERS,
  suppliers: controlledSuppliers,
  referenceDate,
  onSaveProduct,
  onDeleteProduct,
  onMoveStock,
  onSaveSupplier,
}: InventoryScreenProps) {
  const [internalProducts, setInternalProducts] =
    useState<InventoryProduct[]>(initialProducts);
  const [internalSuppliers, setInternalSuppliers] =
    useState<InventorySupplier[]>(initialSuppliers);

  const products = controlledProducts ?? internalProducts;
  const suppliers = controlledSuppliers ?? internalSuppliers;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productDraft, setProductDraft] = useState<ProductFormDraft>(() =>
    createEmptyProductDraft(suppliers[0]?.id ?? "", 1001 + products.length),
  );
  const [productError, setProductError] = useState<string | null>(null);

  // Quick Supplier modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState<SupplierFormDraft>(
    createEmptySupplierDraft,
  );
  const [supplierError, setSupplierError] = useState<string | null>(null);

  // Stock Movement modal state (Movimentar Estoque)
  const [movingProduct, setMovingProduct] = useState<InventoryProduct | null>(
    null,
  );
  const [movementType, setMovementType] = useState<StockMovementType>("entry");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementCost, setMovementCost] = useState("");
  const [movementReason, setMovementReason] = useState("");
  const [movementError, setMovementError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deletingProduct, setDeletingProduct] =
    useState<InventoryProduct | null>(null);

  const productDialogTitleId = useId();
  const supplierDialogTitleId = useId();
  const movementDialogTitleId = useId();
  const deleteDialogTitleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deletingProduct) {
        setDeletingProduct(null);
      } else if (movingProduct) {
        setMovingProduct(null);
        setMovementError(null);
      } else if (isSupplierModalOpen) {
        setIsSupplierModalOpen(false);
        setSupplierError(null);
      } else if (isProductModalOpen) {
        setIsProductModalOpen(false);
        setProductError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    deletingProduct,
    isProductModalOpen,
    isSupplierModalOpen,
    movingProduct,
  ]);

  const metrics = useMemo(
    () => computeInventoryMetrics(products, referenceDate),
    [products, referenceDate],
  );

  const categoriesOptions = useMemo(() => {
    const dynamic = new Set<string>(INVENTORY_CATEGORIES);
    for (const item of products) {
      if (item.category.trim()) dynamic.add(item.category.trim());
    }
    return Array.from(dynamic);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      return (
        product.description.toLowerCase().includes(query) ||
        product.barcode.toLowerCase().includes(query) ||
        (product.code ?? "").toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.supplierName.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  const handleOpenNewProduct = () => {
    setProductDraft(
      createEmptyProductDraft(suppliers[0]?.id ?? "", 1001 + products.length),
    );
    setProductError(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: InventoryProduct) => {
    setProductDraft(productToDraft(product, suppliers));
    setProductError(null);
    setIsProductModalOpen(true);
  };

  const handleOpenMoveStock = (product: InventoryProduct) => {
    setMovingProduct(product);
    setMovementType("entry");
    setMovementQuantity("");
    setMovementCost(String(product.unitCost));
    setMovementReason("");
    setMovementError(null);
  };

  const handleOpenNewSupplier = () => {
    setSupplierDraft(createEmptySupplierDraft());
    setSupplierError(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplierByName = (
    supplierName: string,
    supplierId?: string,
  ) => {
    const found =
      (supplierId ? suppliers.find((s) => s.id === supplierId) : undefined) ??
      suppliers.find((s) => s.name === supplierName);

    if (found) {
      setSupplierDraft(supplierToDraft(found));
    } else {
      setSupplierDraft({
        ...createEmptySupplierDraft(),
        name: supplierName,
      });
    }
    setSupplierError(null);
    setIsSupplierModalOpen(true);
  };

  const handleCostOrMarginChange = (
    nextCostRaw: string,
    nextMarginRaw: string,
  ) => {
    const parsedCost = Number(nextCostRaw.replace(",", "."));
    const parsedMargin = Number(nextMarginRaw.replace(",", "."));
    const autoSale =
      parsedCost > 0
        ? String(
            calculateSalePrice(
              parsedCost,
              Number.isFinite(parsedMargin) ? parsedMargin : 0,
            ),
          )
        : "";

    setProductDraft((current) => ({
      ...current,
      unitCost: nextCostRaw,
      suggestedMargin: nextMarginRaw,
      salePrice: autoSale || current.salePrice,
    }));
  };

  const handleSaveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const description = productDraft.description.trim();
    const barcode = productDraft.barcode.trim();
    const code = productDraft.code.trim() || "1001";
    const unitCost = Number(productDraft.unitCost.replace(",", "."));
    const suggestedMargin = Number(
      productDraft.suggestedMargin.replace(",", "."),
    );
    const salePrice = Number(productDraft.salePrice.replace(",", "."));
    const currentStock = Number(productDraft.currentStock.replace(",", "."));
    const minStock = Number(productDraft.minStock.replace(",", "."));

    if (!description) {
      setProductError("Informe o nome / descrição do produto.");
      return;
    }

    if (!Number.isFinite(salePrice) || salePrice <= 0) {
      setProductError("Informe um preço de venda válido maior que zero.");
      return;
    }

    const selectedSupplier = suppliers.find(
      (s) => s.id === productDraft.supplierId,
    );
    const isEdit = Boolean(productDraft.id);

    const savedProduct: InventoryProduct = {
      id: productDraft.id ?? `prod-${Date.now()}`,
      code,
      barcode: barcode || generateEan13(),
      description,
      category: productDraft.category || INVENTORY_CATEGORIES[0],
      unit: productDraft.unit,
      unitCost: Number.isFinite(unitCost) && unitCost >= 0 ? unitCost : 0,
      suggestedMargin: Number.isFinite(suggestedMargin) ? suggestedMargin : 0,
      salePrice,
      currentStock: Number.isFinite(currentStock) ? currentStock : 0,
      minStock: Number.isFinite(minStock) && minStock >= 0 ? minStock : 0,
      expirationDate: productDraft.expirationDate.trim(),
      supplierId: selectedSupplier?.id,
      supplierName: selectedSupplier?.name ?? "Sem fornecedor",
      active: productDraft.active,
    };

    if (!controlledProducts) {
      setInternalProducts((current) =>
        isEdit
          ? current.map((item) =>
              item.id === savedProduct.id ? savedProduct : item,
            )
          : [savedProduct, ...current],
      );
    }

    onSaveProduct?.(savedProduct, isEdit);
    setIsProductModalOpen(false);
    setProductError(null);
  };

  const handleConfirmMoveStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!movingProduct) return;

    const parsedQty = Number(movementQuantity.replace(",", "."));
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setMovementError("Informe uma quantidade válida maior que zero.");
      return;
    }

    const parsedCost = Number(movementCost.replace(",", "."));
    const updatedProduct = applyStockMovement(movingProduct, {
      type: movementType,
      quantity: parsedQty,
      unitCost:
        movementType === "entry" && Number.isFinite(parsedCost) && parsedCost > 0
          ? parsedCost
          : undefined,
    });

    const record: StockMovementRecord = {
      id: `mov-${Date.now()}`,
      productId: movingProduct.id,
      productName: movingProduct.description,
      type: movementType,
      quantity: parsedQty,
      unitCost:
        movementType === "entry" && Number.isFinite(parsedCost) && parsedCost > 0
          ? parsedCost
          : undefined,
      reason: movementReason.trim() || "Movimentação manual",
      createdAt: new Date().toLocaleString("pt-BR"),
      previousStock: movingProduct.currentStock,
      newStock: updatedProduct.currentStock,
    };

    if (!controlledProducts) {
      setInternalProducts((current) =>
        current.map((item) =>
          item.id === updatedProduct.id ? updatedProduct : item,
        ),
      );
    }

    onSaveProduct?.(updatedProduct, true);
    onMoveStock?.(updatedProduct, record);
    setMovingProduct(null);
    setMovementError(null);
  };

  const handleSaveSupplier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = supplierDraft.name.trim();
    if (!trimmedName) {
      setSupplierError("Informe o nome ou razão social do fornecedor.");
      return;
    }

    const isEdit = Boolean(supplierDraft.id);
    const savedSupplier: InventorySupplier = {
      id: supplierDraft.id ?? `sup-${Date.now()}`,
      name: trimmedName,
      document: supplierDraft.document.trim(),
      representative: supplierDraft.representative.trim(),
      contact: supplierDraft.contact.trim(),
      email: supplierDraft.email.trim(),
      notes: supplierDraft.notes.trim(),
    };

    if (!controlledSuppliers) {
      setInternalSuppliers((current) =>
        isEdit
          ? current.map((item) =>
              item.id === savedSupplier.id ? savedSupplier : item,
            )
          : [...current, savedSupplier],
      );
    }

    if (isEdit && !controlledProducts) {
      setInternalProducts((current) =>
        current.map((product) =>
          product.supplierId === savedSupplier.id
            ? { ...product, supplierName: savedSupplier.name }
            : product,
        ),
      );
    }

    if (isProductModalOpen) {
      setProductDraft((current) => ({
        ...current,
        supplierId: savedSupplier.id,
      }));
    }

    onSaveSupplier?.(savedSupplier, isEdit);
    setIsSupplierModalOpen(false);
    setSupplierError(null);
  };

  const handleConfirmDeleteProduct = () => {
    if (!deletingProduct) return;
    const targetId = deletingProduct.id;

    if (!controlledProducts) {
      setInternalProducts((current) =>
        current.filter((item) => item.id !== targetId),
      );
    }

    onDeleteProduct?.(targetId);
    setDeletingProduct(null);
  };

  const metricCards = [
    {
      id: "total-items",
      title: "Total de Itens",
      value: String(metrics.totalItems),
      subtitle: "Produtos ativos no catálogo",
      accentColor: "#0088ff",
      icon: Package,
    },
    {
      id: "low-stock",
      title: "Estoque Baixo",
      value: String(metrics.lowStockCount),
      subtitle: "Abaixo do estoque mínimo",
      accentColor: "#ff8d28",
      icon: AlertTriangle,
    },
    {
      id: "expiring-soon",
      title: "Validade Próxima",
      value: String(metrics.expiringSoonCount),
      subtitle: "Vencem nos próximos 30 dias",
      accentColor: "#ffcc00",
      icon: CalendarClock,
    },
    {
      id: "expired",
      title: "Produtos Vencidos",
      value: String(metrics.expiredCount),
      subtitle: "Exigem retirada imediata",
      accentColor: "#ff383c",
      icon: CircleX,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-5">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-black">
            Gestão de Estoque
          </h1>
          <p className="text-[13px] text-black/60">
            Controle por categoria, posição do estoque e cadastro de produtos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewProduct}
          className="inline-flex h-[41px] items-center gap-2 rounded-[8px] bg-[#203f9f] px-4 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#193382]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Novo Produto</span>
        </button>
      </header>

      {/* 4 Summary Metric Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="relative min-h-[121px] overflow-hidden rounded-[8px] bg-white p-4 pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
            >
              <div
                className="absolute inset-y-0 left-0 w-[9px]"
                style={{ backgroundColor: card.accentColor }}
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[12px] font-semibold text-black/60">
                    {card.title}
                  </h2>
                  <p className="mt-1.5 text-[22px] font-semibold leading-none text-black">
                    {card.value}
                  </p>
                  <p className="mt-3 text-[11px] font-medium text-black/45">
                    {card.subtitle}
                  </p>
                </div>

                <div
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px]"
                  style={{
                    backgroundColor: `${card.accentColor}26`,
                    color: card.accentColor,
                  }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Search & Category Filter Bar */}
      <section className="flex flex-col gap-3 rounded-[8px] border border-black/10 bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nome, código de barras, código interno ou fornecedor..."
            aria-label="Buscar produtos no estoque"
            className="h-[42px] w-full rounded-[10px] border border-black/20 bg-white pl-10 pr-4 text-[14px] text-black placeholder:text-black/45 focus:border-[#203f9f] focus:outline-none"
          />
        </div>

        <select
          aria-label="Filtrar por categoria"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="h-[42px] min-w-[205px] rounded-[10px] border border-black/20 bg-[#f0f2f5] px-3.5 text-[14px] font-medium text-black/80 focus:border-[#203f9f] focus:outline-none"
        >
          <option value="">Todas as Categorias</option>
          {categoriesOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </section>

      {/* Inventory Products Table */}
      <section className="overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-black">
            Produtos em Estoque
          </h2>
          <span className="text-[12px] font-semibold text-black/60">
            {filteredProducts.length} item(ns)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-black/10 bg-[#f8f9fb] text-[12px] font-semibold text-black">
                <th className="px-5 py-3">Descrição / Código</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Custo Uni.</th>
                <th className="px-4 py-3">Preço Venda</th>
                <th className="px-4 py-3">Estoque Atual</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-[13px]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-[13px] text-black/50"
                  >
                    Nenhum produto cadastrado no estoque.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const lowStock = isLowStock(product);
                  const expiration = getExpirationStatus(
                    product.expirationDate,
                    referenceDate,
                  );

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-black/[0.015]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-black">
                            {product.description}
                          </p>
                          {product.active === false && (
                            <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold text-black/60">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-black/55">
                          <Barcode className="h-3.5 w-3.5 text-black/45" />
                          <span>{product.barcode}</span>
                          {product.code && (
                            <span className="text-black/40">
                              • Cód. {product.code}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-[6px] border border-black/15 bg-[#f0f2f5] px-2.5 py-1 text-[11px] font-semibold text-black/75">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-black/65">
                        {formatCurrency(product.unitCost)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-black">
                        {formatCurrency(product.salePrice)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black">
                            {product.currentStock} {product.unit.toLowerCase()}
                          </span>
                          {lowStock && (
                            <span className="inline-flex items-center rounded-[5px] bg-[#ff383c]/20 px-2 py-0.5 text-[11px] font-semibold text-[#ff383c]">
                              Baixo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-black/75">
                            {expiration.formattedDate}
                          </span>
                          {expiration.status === "expiring-soon" &&
                            expiration.label && (
                              <span className="inline-flex items-center rounded-[5px] bg-[#ffcc00]/35 px-2 py-0.5 text-[10px] font-semibold text-[#9a6700]">
                                {expiration.label}
                              </span>
                            )}
                          {expiration.status === "expired" &&
                            expiration.label && (
                              <span className="inline-flex items-center rounded-[5px] bg-[#ff383c]/20 px-2 py-0.5 text-[10px] font-semibold text-[#ff383c]">
                                {expiration.label}
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditSupplierByName(
                              product.supplierName,
                              product.supplierId,
                            )
                          }
                          aria-label={`Editar fornecedor ${product.supplierName}`}
                          className="inline-flex items-center gap-1.5 font-medium text-black/70 transition-colors hover:text-[#203f9f]"
                        >
                          <span>{product.supplierName}</span>
                          <Pencil className="h-3.5 w-3.5 text-black/45" />
                        </button>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(product)}
                            aria-label={`Editar produto ${product.description}`}
                            title="Editar Produto"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/65 transition-colors hover:bg-black/5 hover:text-[#203f9f]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMoveStock(product)}
                            aria-label={`Movimentar estoque ${product.description}`}
                            title="Movimentar Estoque"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/65 transition-colors hover:bg-[#008f58]/10 hover:text-[#008f58]"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            aria-label={`Excluir produto ${product.description}`}
                            title="Excluir Produto"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/65 transition-colors hover:bg-[#ff383c]/10 hover:text-[#ff383c]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-5 py-3 text-[12px] text-black/60">
          <span>0 de {filteredProducts.length} linha(s) selecionadas</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="h-7 rounded-[4px] border border-black/10 bg-[#f0f2f5] px-3 text-[12px] font-medium text-black/60 disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled
              className="h-7 rounded-[4px] border border-black/10 bg-[#f0f2f5] px-3 text-[12px] font-medium text-black/60 disabled:opacity-60"
            >
              Próximo
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Cadastrar / Editar Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={productDialogTitleId}
            className="w-full max-w-[491px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2
                  id={productDialogTitleId}
                  className="text-[20px] font-bold text-black"
                >
                  {productDraft.id ? "Editar Produto" : "Cadastrar Produto"}
                </h2>
                <p className="text-[12px] text-black/55">
                  Código de barras, preços e quantidade em estoque do item.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProductModalOpen(false);
                  setProductError(null);
                }}
                aria-label="Fechar modal de produto"
                className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleSaveProduct}
              className="max-h-[82vh] space-y-3.5 overflow-y-auto px-5 py-4"
            >
              {/* EAN-13 Box */}
              <div className="rounded-[10px] border border-black/15 bg-[#f8f9fb] p-3">
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-black">
                  <Barcode className="h-4 w-4 text-black/70" />
                  <span>Código de Barras (EAN - 13)</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Código de Barras (EAN - 13)"
                    value={productDraft.barcode}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        barcode: event.target.value,
                      }))
                    }
                    className="h-[38px] flex-1 rounded-[8px] border border-black/20 bg-white px-3 text-[13px] font-semibold text-black focus:border-[#203f9f] focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setProductDraft((current) => ({
                        ...current,
                        barcode: generateEan13(),
                      }))
                    }
                    className="inline-flex h-[38px] items-center gap-1.5 rounded-[8px] border border-black/20 bg-white px-3 text-[12px] font-semibold text-black transition-colors hover:bg-black/5"
                  >
                    <Barcode className="h-3.5 w-3.5" />
                    <span>Gerar EAN</span>
                  </button>
                </div>
              </div>

              {/* Nome do Produto / Descrição + Código Interno */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-8">
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Descrição / Nome do Produto *
                  </label>
                  <input
                    type="text"
                    aria-label="Descrição"
                    value={productDraft.description}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Ex: Café Torrado e Moído 500g"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Código *
                  </label>
                  <input
                    type="text"
                    aria-label="Código Interno"
                    value={productDraft.code}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    placeholder="Ex: 1001"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Categoria & Unidade de Medida */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Categoria *
                  </label>
                  <select
                    aria-label="Categoria"
                    value={productDraft.category}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  >
                    {categoriesOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Unidade de Medida *
                  </label>
                  <select
                    aria-label="Unidade de Medida"
                    value={productDraft.unit}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        unit: event.target.value as InventoryUnit,
                      }))
                    }
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  >
                    {INVENTORY_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custo Unitário, Margem Sugerida, Preço de Venda */}
              <div className="grid grid-cols-1 gap-2.5 rounded-[10px] border border-black/15 bg-[#f8f9fb] p-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-black">
                    Custo Unitário (R$)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label="Custo Unitário (R$)"
                    value={productDraft.unitCost}
                    onChange={(event) =>
                      handleCostOrMarginChange(
                        event.target.value,
                        productDraft.suggestedMargin,
                      )
                    }
                    placeholder="0,00"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-2.5 text-[13px] font-medium text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#008f58]">
                    Margem Sugerida (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    aria-label="Margem Sugerida (%)"
                    value={productDraft.suggestedMargin}
                    onChange={(event) =>
                      handleCostOrMarginChange(
                        productDraft.unitCost,
                        event.target.value,
                      )
                    }
                    placeholder="35"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-2.5 text-[13px] font-semibold text-[#008f58] focus:border-[#008f58] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#203f9f]">
                    Preço de Venda (R$)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label="Preço de Venda (R$)"
                    value={productDraft.salePrice}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        salePrice: event.target.value,
                      }))
                    }
                    placeholder="0,00"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-2.5 text-[13px] font-semibold text-[#203f9f] focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Estoque Atual & Estoque Mínimo */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Estoque Atual *
                  </label>
                  <input
                    type="number"
                    step="1"
                    aria-label="Estoque Atual"
                    value={productDraft.currentStock}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        currentStock: event.target.value,
                      }))
                    }
                    placeholder="0"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Estoque Mínimo (Alerta) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    aria-label="Estoque Mínimo (Alerta)"
                    value={productDraft.minStock}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        minStock: event.target.value,
                      }))
                    }
                    placeholder="10"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Data de Validade & Fornecedor */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Data de Validade
                  </label>
                  <input
                    type="text"
                    aria-label="Data de Validade"
                    value={productDraft.expirationDate}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        expirationDate: formatDateDigits(event.target.value),
                      }))
                    }
                    placeholder="dd/mm/aaaa"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-black">
                      Fornecedor
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenNewSupplier}
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#203f9f] hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Novo</span>
                    </button>
                  </div>

                  <select
                    aria-label="Fornecedor"
                    value={productDraft.supplierId}
                    onChange={(event) =>
                      setProductDraft((current) => ({
                        ...current,
                        supplierId: event.target.value,
                      }))
                    }
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  >
                    <option value="">Sem fornecedor</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Produto Ativo Toggle */}
              <div className="flex items-center justify-between rounded-[10px] border border-black/15 bg-[#f8f9fb] px-3.5 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-black">
                    Produto Ativo
                  </p>
                  <p className="text-[11px] text-black/55">
                    Produtos inativos não aparecem na frente de caixa.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={productDraft.active}
                  aria-label="Produto Ativo"
                  onClick={() =>
                    setProductDraft((curr) => ({
                      ...curr,
                      active: !curr.active,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    productDraft.active ? "bg-[#008f58]" : "bg-black/25"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      productDraft.active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {productError && (
                <p className="text-[12px] font-medium text-[#ff383c]">
                  {productError}
                </p>
              )}

              <footer className="flex items-center justify-end gap-4 border-t border-black/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setProductError(null);
                  }}
                  className="text-[14px] font-semibold text-black/60 transition-colors hover:text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-[36px] items-center gap-2 rounded-[8px] bg-[#008f58] px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
                >
                  <span>Salvar no Estoque</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Movimentar Estoque (Entrada / Saída / Ajuste) */}
      {movingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={movementDialogTitleId}
            className="w-full max-w-[445px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2
                  id={movementDialogTitleId}
                  className="text-[20px] font-bold text-black"
                >
                  Movimentar Estoque
                </h2>
                <p className="text-[12px] text-black/55">
                  Registre entradas de mercadorias, baixas manuais ou ajuste por contagem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMovingProduct(null);
                  setMovementError(null);
                }}
                aria-label="Fechar modal de movimentação"
                className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleConfirmMoveStock}
              className="space-y-4 px-5 py-4"
            >
              {/* Product Banner */}
              <div className="rounded-[10px] border border-black/15 bg-[#f8f9fb] p-3">
                <p className="text-[14px] font-bold text-black">
                  {movingProduct.description}
                </p>
                <p className="mt-0.5 text-[12px] text-black/60">
                  Estoque atual: {movingProduct.currentStock}{" "}
                  {movingProduct.unit.toLowerCase()} - custo atual{" "}
                  {formatCurrency(movingProduct.unitCost)}
                </p>
              </div>

              {/* Tipo de Movimentação 3-Tab Selector */}
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-black">
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "entry", label: "Entrada" },
                      { id: "exit", label: "Saída" },
                      { id: "adjustment", label: "Ajuste (contagem)" },
                    ] as const
                  ).map((tab) => {
                    const active = movementType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMovementType(tab.id)}
                        className={`h-[34px] rounded-[8px] border text-[12px] font-semibold transition-colors ${
                          active
                            ? "border-[#008f58] bg-[#008f58]/15 text-[#008f58]"
                            : "border-black/20 bg-white text-black/70 hover:bg-black/5"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  {movementType === "entry"
                    ? "Quantidade Recebida"
                    : movementType === "exit"
                      ? "Quantidade Retirada"
                      : "Quantidade Contada"}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  aria-label="Quantidade da Movimentação"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(e.target.value)}
                  placeholder={
                    movementType === "adjustment" ? "Ex: 24" : "Ex: 12"
                  }
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              {/* Purchase Unit Cost (only for Entrada) */}
              {movementType === "entry" && (
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Custo Unitário da Compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label="Custo Unitário da Compra"
                    value={movementCost}
                    onChange={(e) => setMovementCost(e.target.value)}
                    placeholder="Ex: 4,90"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-black/50">
                    Fica gravado nesta entrada e atualiza o preço de custo do produto
                  </p>
                </div>
              )}

              {/* Motivo */}
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  Motivo
                </label>
                <input
                  type="text"
                  aria-label="Motivo da Movimentação"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: compra do fornecedor, quebra, perda"
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              {movementError && (
                <p className="text-[12px] font-medium text-[#ff383c]">
                  {movementError}
                </p>
              )}

              <button
                type="submit"
                className="h-[40px] w-full rounded-[8px] bg-[#008f58] text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
              >
                Confirmar Movimentação
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Fornecedor (Quick Modal from Inventory) */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={supplierDialogTitleId}
            className="w-full max-w-[421px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <h2
                id={supplierDialogTitleId}
                className="text-[18px] font-bold text-black"
              >
                {supplierDraft.id
                  ? "Editar Fornecedor"
                  : "Cadastrar Novo Fornecedor"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setIsSupplierModalOpen(false);
                  setSupplierError(null);
                }}
                aria-label="Fechar modal de fornecedor"
                className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleSaveSupplier}
              className="space-y-3.5 px-5 py-4"
            >
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  Nome / Razão Social *
                </label>
                <input
                  type="text"
                  aria-label="Nome / Razão Social"
                  value={supplierDraft.name}
                  onChange={(event) =>
                    setSupplierDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ex: JDE Jacobs Douwe"
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    CNPJ / CPF
                  </label>
                  <input
                    type="text"
                    aria-label="CNPJ / CPF"
                    value={supplierDraft.document}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({
                        ...current,
                        document: event.target.value,
                      }))
                    }
                    placeholder="00.000.000/0000-00"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Vendedor / Representante
                  </label>
                  <input
                    type="text"
                    aria-label="Vendedor / Representante"
                    value={supplierDraft.representative}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({
                        ...current,
                        representative: event.target.value,
                      }))
                    }
                    placeholder="Nome do contato"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Contato (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    aria-label="Contato (WhatsApp)"
                    value={supplierDraft.contact}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({
                        ...current,
                        contact: event.target.value,
                      }))
                    }
                    placeholder="(11) 98451-6521"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    E-mail
                  </label>
                  <input
                    type="email"
                    aria-label="E-mail"
                    value={supplierDraft.email}
                    onChange={(event) =>
                      setSupplierDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="pedidos@fornecedor.com.br"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  Observações (Prazo, dia de visita)
                </label>
                <input
                  type="text"
                  aria-label="Observações (Prazo, dia de visita)"
                  value={supplierDraft.notes}
                  onChange={(event) =>
                    setSupplierDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Ex: Entrega toda quarta-feira, boleto 28 dias"
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              {supplierError && (
                <p className="text-[12px] font-medium text-[#ff383c]">
                  {supplierError}
                </p>
              )}

              <footer className="flex items-center justify-end gap-4 border-t border-black/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSupplierModalOpen(false);
                    setSupplierError(null);
                  }}
                  className="text-[14px] font-semibold text-black/60 transition-colors hover:text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[34px] rounded-[8px] bg-[#008f58] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#007a4b]"
                >
                  {supplierDraft.id ? "Salvar Alterações" : "Salvar Fornecedor"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Produto */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
            className="w-full max-w-[333px] rounded-[15px] bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff383c]/10 text-[#ff383c]">
              <CircleX className="h-8 w-8" />
            </div>

            <h2
              id={deleteDialogTitleId}
              className="text-[20px] font-semibold text-black"
            >
              Excluir Produto
            </h2>

            <p className="mt-2 text-[13px] leading-snug text-black/60">
              Atenção: Todos os dados desse produto serão perdidos. Confirmar exclusão?
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="h-[33px] min-w-[115px] rounded-[8px] border border-black/30 bg-[#d9d9d9]/40 px-4 text-[14px] font-semibold text-black/60 transition-colors hover:bg-black/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="h-[33px] min-w-[115px] rounded-[8px] bg-[#ff383c] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#e0282c]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
