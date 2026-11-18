"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  ViewColumnsIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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
    barcode: "7921223330129",
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
      title: "Itens Cadastrados",
      value: String(metrics.totalItems),
      subtitle: "Produtos no catálogo",
      colorClass: "text-[#008f58]",
    },
    {
      id: "low-stock",
      title: "Estoque Baixo",
      value: String(metrics.lowStockCount),
      subtitle: "Abaixo do estoque mínimo",
      colorClass: "text-[#9a3412]",
    },
    {
      id: "expiring-soon",
      title: "Validade Próxima",
      value: String(metrics.expiringSoonCount),
      subtitle: "Vencem em até 30 dias",
      colorClass: "text-slate-800",
    },
    {
      id: "expired",
      title: "Produtos Vencidos",
      value: String(metrics.expiredCount),
      subtitle: "Remover do balcão",
      colorClass: "text-[#203f9f]",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4">
      {/* Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#203f9f]">
            Gestão de Estoque
          </h1>
          <p className="text-[11px] text-slate-400">
            Controle por categoria, posição do estoque e cadastro de produtos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewProduct}
          className="inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#008f58] px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#007a4b]"
        >
          <PlusIcon className="h-4 w-4 stroke-[2.5]" />
          <span>Novo Produto</span>
        </button>
      </header>

      {/* 4 Clean White Metric Cards (Screenshot 110154.png) */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => (
          <article
            key={card.id}
            className="flex min-h-[100px] flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <h2 className="text-[12px] font-semibold text-slate-700">
              {card.title}
            </h2>
            <p className={`my-1 text-[22px] font-bold ${card.colorClass}`}>
              {card.value}
            </p>
            <p className="text-[11px] text-slate-400">{card.subtitle}</p>
          </article>
        ))}
      </section>

      {/* Search & Category Filter Bar */}
      <section className="flex flex-col gap-3 rounded-[10px] border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nome, código ou código de barras..."
            aria-label="Buscar produtos no estoque"
            className="h-[38px] w-full rounded-[8px] border border-slate-200 bg-[#f3f4f6] pl-10 pr-4 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          aria-label="Filtrar por categoria"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="h-[38px] min-w-[180px] rounded-[8px] border border-slate-200 bg-[#f3f4f6] px-3 text-[12px] font-medium text-slate-700 focus:border-[#203f9f] focus:bg-white focus:outline-none"
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
      <section className="overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="sr-only">Produtos em Estoque</div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8fafc] text-[11px] font-semibold text-slate-600">
                <th className="px-5 py-3">Descrição / Código</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Custo</th>
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Margem</th>
                <th className="px-4 py-3">Estoque</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-[12px] text-slate-400"
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
                  const marginPct =
                    product.unitCost > 0
                      ? (
                          ((product.salePrice - product.unitCost) /
                            product.salePrice) *
                          100
                        ).toFixed(1)
                      : product.suggestedMargin.toFixed(1);

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800">
                            {product.description}
                          </p>
                          {product.active === false && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {product.code ?? "1001"} - {product.barcode}
                        </p>
                      </td>

                      <td className="px-4 py-2.5 text-[11px] font-medium text-slate-700">
                        {product.category}
                      </td>

                      <td className="px-4 py-2.5 text-slate-600">
                        {formatCurrency(product.unitCost)}
                      </td>

                      <td className="px-4 py-2.5 font-bold text-[#0f766e]">
                        {formatCurrency(product.salePrice)}
                      </td>

                      <td className="px-4 py-2.5 font-semibold text-slate-700">
                        {marginPct}%
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              lowStock ? "text-[#ff6b00]" : "text-slate-800"
                            }`}
                          >
                            {product.currentStock} {product.unit.toLowerCase()}
                          </span>
                          {lowStock && (
                            <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-[#d97706]">
                              Baixo
                            </span>
                          )}
                        </div>
                        <span className="block text-[9px] text-slate-400">
                          Mín: {product.minStock}
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-600">
                            {expiration.formattedDate}
                          </span>
                          {expiration.status === "expiring-soon" &&
                            expiration.label && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                                {expiration.label}
                              </span>
                            )}
                          {expiration.status === "expired" &&
                            expiration.label && (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600">
                                {expiration.label}
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditSupplierByName(
                              product.supplierName,
                              product.supplierId,
                            )
                          }
                          aria-label={`Editar fornecedor ${product.supplierName}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-[#203f9f]"
                        >
                          <span>{product.supplierName}</span>
                          <PencilSquareIcon className="h-3 w-3 text-slate-400" />
                        </button>
                      </td>

                      <td className="px-5 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(product)}
                            aria-label={`Editar produto ${product.description}`}
                            title="Editar Produto"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#203f9f]"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenMoveStock(product)}
                            aria-label={`Movimentar estoque ${product.description}`}
                            title="Movimentar Estoque"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-emerald-50 hover:text-[#008f58]"
                          >
                            <CubeIcon className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            aria-label={`Excluir produto ${product.description}`}
                            title="Excluir Produto"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <TrashIcon className="h-4 w-4" />
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
          <span>0 de {filteredProducts.length} linha(s) selecionadas</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="h-7 rounded-[4px] border border-slate-200 bg-slate-50 px-3 text-[11px] font-medium text-slate-400"
            >
              Anterior
            </button>
            <button
              type="button"
              className="h-7 rounded-[4px] border border-slate-200 bg-slate-100 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
            >
              Próximo
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Novo Produto / Editar Produto (Screenshots 110203.png & 110210.png) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={productDialogTitleId}
            className="w-full max-w-[490px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h2
                  id={productDialogTitleId}
                  className="text-[18px] font-bold text-slate-900"
                >
                  {productDraft.id ? "Editar Produto" : "Cadastrar Produto"}
                </h2>
                <p className="text-[11px] text-slate-400">
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
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleSaveProduct}
              className="max-h-[82vh] space-y-3 overflow-y-auto px-5 pb-5"
            >
              {/* EAN-13 Box */}
              <div className="rounded-[10px] border border-blue-200/80 bg-[#f8fafc] p-3">
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#153488]">
                  <ViewColumnsIcon className="h-4 w-4 text-[#153488]" />
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
                    className="h-[34px] flex-1 rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setProductDraft((current) => ({
                        ...current,
                        barcode: generateEan13(),
                      }))
                    }
                    className="inline-flex h-[34px] items-center rounded-[6px] border border-blue-300 bg-white px-3 text-[11px] font-bold text-[#153488] transition-colors hover:bg-blue-50"
                  >
                    Gerar EAN
                  </button>
                </div>
              </div>

              {/* Nome do Produto & Código */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-8">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Nome do Produto *
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
                    placeholder="Ex: Café torrado e Moído"
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Categoria & Unidade de Medida */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Categoria
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  >
                    {categoriesOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Unidade de Medida
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  >
                    {INVENTORY_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preço de Custo, Margem Sugerida, Preço de Venda */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Preço de Custo (R$)
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-2.5 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-2.5 text-[12px] font-semibold text-[#008f58] focus:border-[#008f58] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Preço de Venda (R$)
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
                    className="h-[36px] w-full rounded-[6px] border border-blue-200 bg-blue-50/40 px-2.5 text-[12px] font-semibold text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Estoque Atual & Estoque Mínimo */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Estoque Atual (UN)
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Estoque Mínimo
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
                    placeholder="0"
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Data de Validade & Fornecedor */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                    Data de Validade
                  </label>
                  <div className="relative">
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
                      placeholder="DD/MM/AAAA"
                      className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white pl-3 pr-8 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:outline-none"
                    />
                    <CalendarDaysIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                <div className="sm:col-span-7">
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-800">
                      Fornecedor
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenNewSupplier}
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#203f9f] hover:underline"
                    >
                      <PlusIcon className="h-3 w-3" />
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
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
              <div className="flex items-center justify-between rounded-[8px] border border-slate-200 bg-[#f8fafc] px-3 py-2">
                <div>
                  <p className="text-[11px] font-bold text-slate-800">
                    Produto Ativo
                  </p>
                  <p className="text-[10px] text-slate-400">
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
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    productDraft.active ? "bg-[#0f766e]" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      productDraft.active ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {productError && (
                <p className="text-[11px] font-medium text-rose-600">
                  {productError}
                </p>
              )}

              <footer className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setProductError(null);
                  }}
                  className="text-[12px] font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  aria-label="Salvar no Estoque"
                  className="inline-flex h-[34px] items-center gap-1.5 rounded-[6px] bg-[#0f766e] px-4 text-[12px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Salvar Produto</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Movimentar Estoque (Screenshots 110221.png, 110227.png, 110232.png) */}
      {movingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={movementDialogTitleId}
            className="w-full max-w-[420px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h2
                  id={movementDialogTitleId}
                  className="text-[18px] font-bold text-slate-900"
                >
                  Movimentar Estoque
                </h2>
                <p className="text-[11px] text-slate-400">
                  Registre entradas de mercadorias, baixas manuais ou ajuste por
                  contagem.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMovingProduct(null);
                  setMovementError(null);
                }}
                aria-label="Fechar modal de movimentação"
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleConfirmMoveStock}
              className="space-y-3.5 px-5 pb-5"
            >
              {/* Product Banner */}
              <div className="rounded-[8px] border border-slate-200 bg-[#f8fafc] px-3 py-2.5">
                <p className="text-[12px] font-bold text-slate-800">
                  {movingProduct.description}
                </p>
                <p className="text-[10px] text-slate-500">
                  Estoque atual: {movingProduct.currentStock}{" "}
                  {movingProduct.unit.toLowerCase()} - custo atual{" "}
                  {formatCurrency(movingProduct.unitCost)}
                </p>
              </div>

              {/* Tipo de Movimentação */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-800">
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
                        className={`h-[32px] rounded-[6px] border text-[11px] font-semibold transition-colors ${
                          active
                            ? "border-[#0f766e] bg-[#e6f9f1] text-[#0f766e]"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                  {movementType === "entry"
                    ? "Quantidade Recebida"
                    : movementType === "exit"
                      ? "Quantidade a Baixar"
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
                  className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#0f766e] focus:outline-none"
                />
              </div>

              {/* Purchase Unit Cost (only for Entrada) */}
              {movementType === "entry" && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#0f766e] focus:outline-none"
                  />
                  <p className="mt-1 text-[9px] text-slate-400">
                    Fica gravado nesta entrada e atualiza o preço de custo do
                    produto
                  </p>
                </div>
              )}

              {/* Motivo */}
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                  Motivo
                </label>
                <input
                  type="text"
                  aria-label="Motivo da Movimentação"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: compra do fornecedor, quebra, perda"
                  className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                />
              </div>

              {movementError && (
                <p className="text-[11px] font-medium text-rose-600">
                  {movementError}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[6px] bg-[#0f766e] text-[12px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>Confirmar Movimentação</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar / Editar Fornecedor (Quick Modal from Inventory) */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={supplierDialogTitleId}
            className="w-full max-w-[421px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2
                id={supplierDialogTitleId}
                className="text-[16px] font-bold text-slate-900"
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
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleSaveSupplier}
              className="space-y-3.5 px-5 py-4"
            >
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-slate-800">
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
                  className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-800">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-800">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-800">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-800">
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
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-slate-800">
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
                  className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              {supplierError && (
                <p className="text-[11px] font-medium text-rose-600">
                  {supplierError}
                </p>
              )}

              <footer className="flex items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSupplierModalOpen(false);
                    setSupplierError(null);
                  }}
                  className="text-[12px] font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[34px] rounded-[6px] bg-[#0f766e] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#0d645d]"
                >
                  {supplierDraft.id ? "Salvar Alterações" : "Salvar Fornecedor"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Produto (Screenshot 110215.png) */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
            className="w-full max-w-[333px] rounded-[14px] bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-rose-500">
              <XCircleIcon className="h-9 w-9 stroke-[1.5]" />
            </div>

            <h2
              id={deleteDialogTitleId}
              className="text-[16px] font-bold text-slate-900"
            >
              Excluir Produto
            </h2>

            <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
              Atenção: Todos os dados desse produto serão perdidos. Confirmar
              exclusão?
            </p>

            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="text-[12px] font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="h-[32px] rounded-[6px] bg-[#ef4444] px-5 text-[12px] font-semibold text-white transition-colors hover:bg-rose-600"
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
