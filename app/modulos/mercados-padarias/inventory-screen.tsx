"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Barcode,
  Calendar,
  CheckCircle2,
  CircleX,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  calculateSalePrice,
  computeInventoryMetrics,
  EMPTY_INVENTORY_PRODUCTS,
  EMPTY_INVENTORY_SUPPLIERS,
  formatExpirationDate,
  generateEan13,
  getExpirationStatus,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  isLowStock,
  type InventoryProduct,
  type InventorySupplier,
  type InventoryUnit,
} from "@/lib/market-inventory";

type InventoryScreenProps = {
  initialProducts?: InventoryProduct[];
  initialSuppliers?: InventorySupplier[];
  onSaveProduct?: (product: InventoryProduct) => void | Promise<void>;
  onDeleteProduct?: (productId: string) => void | Promise<void>;
  onSaveSupplier?: (supplier: InventorySupplier) => void | Promise<void>;
};

type ProductModalMode = "create" | "edit" | null;
type SupplierModalMode = "create" | "edit" | null;

type ProductFormState = {
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
  supplierName: string;
};

type SupplierFormState = {
  name: string;
  document: string;
  representative: string;
  contact: string;
  email: string;
  notes: string;
};

const EMPTY_PRODUCT_FORM: ProductFormState = {
  barcode: "7921223330139",
  description: "",
  category: "Mercearia",
  unit: "UN",
  unitCost: "",
  suggestedMargin: "35",
  salePrice: "",
  currentStock: "0",
  minStock: "0",
  expirationDate: "",
  supplierName: "",
};

const EMPTY_SUPPLIER_FORM: SupplierFormState = {
  name: "",
  document: "",
  representative: "",
  contact: "",
  email: "",
  notes: "",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function parseNumberInput(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export default function InventoryScreen({
  initialProducts = EMPTY_INVENTORY_PRODUCTS,
  initialSuppliers = EMPTY_INVENTORY_SUPPLIERS,
  onSaveProduct,
  onDeleteProduct,
  onSaveSupplier,
}: InventoryScreenProps) {
  const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [productModalMode, setProductModalMode] = useState<ProductModalMode>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);

  const [supplierModalMode, setSupplierModalMode] = useState<SupplierModalMode>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierOriginalName, setEditingSupplierOriginalName] = useState<string>("");
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(EMPTY_SUPPLIER_FORM);

  const [productToDelete, setProductToDelete] = useState<InventoryProduct | null>(null);

  const metrics = useMemo(() => computeInventoryMetrics(products), [products]);

  const availableCategories = useMemo(() => {
    const customCategories = products
      .map((item) => item.category.trim())
      .filter((category) => category.length > 0 && !INVENTORY_CATEGORIES.includes(category));
    return [...INVENTORY_CATEGORIES, ...Array.from(new Set(customCategories))];
  }, [products]);

  const availableSupplierNames = useMemo(() => {
    const namesFromSuppliers = suppliers.map((s) => s.name.trim()).filter(Boolean);
    const namesFromProducts = products.map((p) => p.supplierName.trim()).filter(Boolean);
    return Array.from(new Set([...namesFromSuppliers, ...namesFromProducts]));
  }, [suppliers, products]);

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
        product.supplierName.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  useEffect(() => {
    if (!productModalMode && !supplierModalMode && !productToDelete) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (supplierModalMode) {
        setSupplierModalMode(null);
        setEditingSupplierId(null);
        setEditingSupplierOriginalName("");
        return;
      }
      if (productToDelete) {
        setProductToDelete(null);
        return;
      }
      if (productModalMode) {
        setProductModalMode(null);
        setEditingProductId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [productModalMode, supplierModalMode, productToDelete]);

  function openCreateProductModal() {
    setEditingProductId(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      barcode: generateEan13(),
    });
    setProductModalMode("create");
  }

  function openEditProductModal(product: InventoryProduct) {
    setEditingProductId(product.id);
    setProductForm({
      barcode: product.barcode,
      description: product.description,
      category: product.category,
      unit: product.unit,
      unitCost: String(product.unitCost),
      suggestedMargin: String(product.suggestedMargin),
      salePrice: String(product.salePrice),
      currentStock: String(product.currentStock),
      minStock: String(product.minStock),
      expirationDate: formatExpirationDate(product.expirationDate) === "—"
        ? ""
        : formatExpirationDate(product.expirationDate),
      supplierName: product.supplierName,
    });
    setProductModalMode("edit");
  }

  function closeProductModal() {
    setProductModalMode(null);
    setEditingProductId(null);
  }

  function handleUnitCostChange(value: string) {
    const cost = parseNumberInput(value);
    const margin = parseNumberInput(productForm.suggestedMargin);
    const calculatedSale = cost > 0 ? String(calculateSalePrice(cost, margin)) : "";
    setProductForm((prev) => ({
      ...prev,
      unitCost: value,
      salePrice: calculatedSale,
    }));
  }

  function handleMarginChange(value: string) {
    const cost = parseNumberInput(productForm.unitCost);
    const margin = parseNumberInput(value);
    const calculatedSale = cost > 0 ? String(calculateSalePrice(cost, margin)) : prevSalePrice(productForm.salePrice);
    setProductForm((prev) => ({
      ...prev,
      suggestedMargin: value,
      salePrice: cost > 0 ? calculatedSale : prev.salePrice,
    }));
  }

  function prevSalePrice(value: string) {
    return value;
  }

  function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const description = productForm.description.trim();
    if (!description) return;

    const unitCost = parseNumberInput(productForm.unitCost);
    const suggestedMargin = parseNumberInput(productForm.suggestedMargin);
    const salePrice =
      productForm.salePrice.trim() !== ""
        ? parseNumberInput(productForm.salePrice)
        : calculateSalePrice(unitCost, suggestedMargin);
    const currentStock = parseNumberInput(productForm.currentStock);
    const minStock = parseNumberInput(productForm.minStock);
    const supplierName = productForm.supplierName.trim() || "Não informado";
    const matchedSupplier = suppliers.find(
      (s) => s.name.toLowerCase() === supplierName.toLowerCase(),
    );

    const savedProduct: InventoryProduct = {
      id: editingProductId ?? `prod-${Date.now()}`,
      barcode: productForm.barcode.trim() || generateEan13(),
      description,
      category: productForm.category || "Mercearia",
      unit: productForm.unit,
      unitCost,
      suggestedMargin,
      salePrice,
      currentStock,
      minStock,
      expirationDate: productForm.expirationDate.trim(),
      supplierId: matchedSupplier?.id,
      supplierName,
    };

    if (productModalMode === "edit" && editingProductId) {
      setProducts((current) =>
        current.map((item) => (item.id === editingProductId ? savedProduct : item)),
      );
    } else {
      setProducts((current) => [savedProduct, ...current]);
    }

    void onSaveProduct?.(savedProduct);
    closeProductModal();
  }

  function openCreateSupplierModal() {
    setEditingSupplierId(null);
    setEditingSupplierOriginalName("");
    setSupplierForm(EMPTY_SUPPLIER_FORM);
    setSupplierModalMode("create");
  }

  function openEditSupplierModal(supplierName: string, supplierId?: string) {
    const existing = suppliers.find(
      (item) =>
        (supplierId && item.id === supplierId) ||
        item.name.toLowerCase() === supplierName.trim().toLowerCase(),
    );

    if (existing) {
      setEditingSupplierId(existing.id);
      setEditingSupplierOriginalName(existing.name);
      setSupplierForm({
        name: existing.name,
        document: existing.document,
        representative: existing.representative,
        contact: existing.contact,
        email: existing.email,
        notes: existing.notes,
      });
    } else {
      setEditingSupplierId(`sup-${Date.now()}`);
      setEditingSupplierOriginalName(supplierName);
      setSupplierForm({
        ...EMPTY_SUPPLIER_FORM,
        name: supplierName === "Não informado" ? "" : supplierName,
      });
    }

    setSupplierModalMode("edit");
  }

  function closeSupplierModal() {
    setSupplierModalMode(null);
    setEditingSupplierId(null);
    setEditingSupplierOriginalName("");
  }

  function handleSaveSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = supplierForm.name.trim();
    const contact = supplierForm.contact.trim();
    if (!name || !contact) return;

    const savedSupplier: InventorySupplier = {
      id: editingSupplierId ?? `sup-${Date.now()}`,
      name,
      document: supplierForm.document.trim(),
      representative: supplierForm.representative.trim(),
      contact,
      email: supplierForm.email.trim(),
      notes: supplierForm.notes.trim(),
    };

    setSuppliers((current) => {
      const exists = current.some((item) => item.id === savedSupplier.id);
      if (exists) {
        return current.map((item) => (item.id === savedSupplier.id ? savedSupplier : item));
      }
      return [...current, savedSupplier];
    });

    if (supplierModalMode === "edit" && editingSupplierOriginalName) {
      setProducts((current) =>
        current.map((product) =>
          product.supplierId === savedSupplier.id ||
          product.supplierName.toLowerCase() === editingSupplierOriginalName.toLowerCase()
            ? { ...product, supplierId: savedSupplier.id, supplierName: savedSupplier.name }
            : product,
        ),
      );
    }

    if (productModalMode) {
      setProductForm((prev) => ({
        ...prev,
        supplierName: savedSupplier.name,
      }));
    }

    void onSaveSupplier?.(savedSupplier);
    closeSupplierModal();
  }

  function handleConfirmDeleteProduct() {
    if (!productToDelete) return;
    const deletedId = productToDelete.id;
    setProducts((current) => current.filter((item) => item.id !== deletedId));
    void onDeleteProduct?.(deletedId);
    setProductToDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold leading-7 text-blue-800">Gestão de Estoque</h1>
          <p className="text-[11px] text-slate-500">
            Controle de mercadorias e cadastro de parceiros comerciais.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-800">
            <Package aria-hidden="true" className="size-4 text-orange-500" />
            <span>Produtos em Estoque</span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateProductModal}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" className="size-4" />
          Novo Produto
        </button>
      </div>

      <section
        aria-label="Indicadores de estoque"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <article className="flex min-h-[96px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-700">Total de Itens</h2>
          <p className="my-1 text-2xl font-bold leading-7 text-emerald-600">
            {metrics.totalItems}
          </p>
          <p className="text-[11px] text-slate-400">Produtos no catálogo</p>
        </article>

        <article className="flex min-h-[96px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-700">Estoque Baixo</h2>
          <p className="my-1 text-2xl font-bold leading-7 text-amber-700">
            {metrics.lowStockCount}
          </p>
          <p className="text-[11px] text-slate-400">Abaixo do estoque mínimo</p>
        </article>

        <article className="flex min-h-[96px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-700">Validade Próxima</h2>
          <p className="my-1 text-2xl font-bold leading-7 text-slate-800">
            {metrics.expiringSoonCount}
          </p>
          <p className="text-[11px] text-slate-400">Vencem em até 30 dias</p>
        </article>

        <article className="flex min-h-[96px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-700">Produtos Vencidos</h2>
          <p className="my-1 text-2xl font-bold leading-7 text-blue-700">
            {metrics.expiredCount}
          </p>
          <p className="text-[11px] text-slate-400">Remover do balcão</p>
        </article>
      </section>

      <section
        aria-label="Filtros de busca e categoria"
        className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <label className="flex h-10 flex-1 items-center gap-2.5 rounded-lg border border-slate-200 bg-[#f3f4f6]/60 px-3 text-slate-400 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nome, código de barras ou fornecedor..."
            aria-label="Buscar por nome, código de barras ou fornecedor"
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          aria-label="Filtrar por categoria"
          className="h-10 rounded-lg border border-slate-200 bg-[#f3f4f6]/60 px-3 text-xs text-slate-600 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-52"
        >
          <option value="">Todas as Categorias</option>
          {availableCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </section>

      <section
        className="overflow-hidden rounded-xl bg-white shadow-sm"
        aria-labelledby="inventory-table-heading"
      >
        <h2
          id="inventory-table-heading"
          className="px-5 py-3.5 text-sm font-semibold text-slate-700"
        >
          Histórico Detalhado de Vendas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[11px]">
            <thead className="border-y border-slate-200 bg-slate-50/70 text-slate-600">
              <tr>
                <th className="px-5 py-2.5 font-medium">Descrição / Código</th>
                <th className="px-4 py-2.5 font-medium">Categoria</th>
                <th className="px-4 py-2.5 font-medium">Custo Uni.</th>
                <th className="px-4 py-2.5 font-medium">Preço Venda</th>
                <th className="px-4 py-2.5 font-medium">Estoque Atual</th>
                <th className="px-4 py-2.5 font-medium">Validade</th>
                <th className="px-4 py-2.5 font-medium">Fornecedor</th>
                <th className="px-5 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const lowStock = isLowStock(product);
                  const expiration = getExpirationStatus(product.expirationDate);

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-2.5">
                        <span className="block font-semibold text-slate-800">
                          {product.description}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <Barcode aria-hidden="true" className="size-3 shrink-0" />
                          {product.barcode}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                        {product.category}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                        {formatCurrency(product.unitCost)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-emerald-600">
                        {formatCurrency(product.salePrice)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              lowStock ? "text-orange-600" : "text-slate-800"
                            }`}
                          >
                            {product.currentStock} {product.unit}
                          </span>
                          {lowStock && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                              Baixo
                            </span>
                          )}
                        </div>
                        <span className="block text-[9px] text-slate-400">
                          Min: {product.minStock}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className="block text-slate-700">{expiration.formattedDate}</span>
                        {expiration.label && (
                          <span
                            className={`block text-[9px] font-semibold ${
                              expiration.status === "expired"
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {expiration.label}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="inline-flex items-center gap-1.5 text-slate-700">
                          <span>{product.supplierName}</span>
                          <button
                            type="button"
                            onClick={() =>
                              openEditSupplierModal(product.supplierName, product.supplierId)
                            }
                            aria-label={`Editar fornecedor ${product.supplierName}`}
                            className="rounded p-0.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <Pencil aria-hidden="true" className="size-3" />
                          </button>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-2.5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(product)}
                            aria-label={`Editar produto ${product.description}`}
                            className="rounded p-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <Pencil aria-hidden="true" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            aria-label={`Excluir produto ${product.description}`}
                            className="rounded p-1 text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs text-slate-500">
                    Nenhum produto cadastrado no estoque.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-[10px] text-slate-500">
          <span>0 de {filteredProducts.length} linha(s) selecionadas</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="rounded border border-slate-200 px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled
              className="rounded border border-slate-200 px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      </section>

      {productModalMode && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProductModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 bg-[#153488] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <Package aria-hidden="true" className="size-4.5 text-orange-400" />
                <h2 id="product-modal-title" className="text-sm font-semibold">
                  {productModalMode === "edit" ? "Editar Produto" : "Cadastrar Produto"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeProductModal}
                aria-label="Fechar modal de produto"
                className="rounded p-1 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </header>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 p-5">
              <div className="rounded-lg border border-blue-200 bg-slate-50/70 p-3">
                <label
                  htmlFor="product-barcode-input"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-900"
                >
                  <Barcode aria-hidden="true" className="size-4 text-blue-700" />
                  Código de Barras (EAN - 13)
                </label>
                <div className="flex gap-2">
                  <input
                    id="product-barcode-input"
                    type="text"
                    value={productForm.barcode}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, barcode: event.target.value }))
                    }
                    className="h-9 min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm((prev) => ({ ...prev, barcode: generateEan13() }))
                    }
                    className="shrink-0 rounded-md border border-blue-200 bg-white px-3 text-[11px] font-semibold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Gerar EAN
                  </button>
                </div>
              </div>

              <label className="block text-[11px] font-semibold text-slate-700">
                Descrição *
                <input
                  required
                  type="text"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Ex: Café torrado e Moído"
                  className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Categoria
                  <select
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 bg-white px-2.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  Unidade de Medida
                  <select
                    value={productForm.unit}
                    onChange={(event) =>
                      setProductForm((prev) => ({
                        ...prev,
                        unit: event.target.value as InventoryUnit,
                      }))
                    }
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 bg-white px-2.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {INVENTORY_UNITS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Custo Unitário (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.unitCost}
                    onChange={(event) => handleUnitCostChange(event.target.value)}
                    placeholder="0,00"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  Margem Sugerida (%)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={productForm.suggestedMargin}
                    onChange={(event) => handleMarginChange(event.target.value)}
                    placeholder="35"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-semibold text-emerald-600 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  Preço de Venda (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.salePrice}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, salePrice: event.target.value }))
                    }
                    placeholder="0,00"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 bg-blue-50/50 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Estoque Atual ({productForm.unit})
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.currentStock}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, currentStock: event.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  Estoque Mínimo
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.minStock}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, minStock: event.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr]">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Data de Validade
                  <span className="mt-1 flex h-9 items-center rounded-md border border-blue-200 px-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <input
                      type="text"
                      value={productForm.expirationDate}
                      onChange={(event) =>
                        setProductForm((prev) => ({
                          ...prev,
                          expirationDate: event.target.value,
                        }))
                      }
                      placeholder="DD/MM/AAAA"
                      className="min-w-0 flex-1 bg-transparent text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    <Calendar aria-hidden="true" className="size-3.5 shrink-0 text-slate-500" />
                  </span>
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="product-supplier-input"
                      className="text-[11px] font-semibold text-slate-700"
                    >
                      Fornecedor
                    </label>
                    <button
                      type="button"
                      onClick={openCreateSupplierModal}
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-800 focus-visible:outline-none focus-visible:underline"
                    >
                      <Plus aria-hidden="true" className="size-3" />
                      Novo
                    </button>
                  </div>
                  <input
                    id="product-supplier-input"
                    list="inventory-suppliers-list"
                    type="text"
                    value={productForm.supplierName}
                    onChange={(event) =>
                      setProductForm((prev) => ({ ...prev, supplierName: event.target.value }))
                    }
                    placeholder="Selecione ou insira um novo fornecedor"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <datalist id="inventory-suppliers-list">
                    {availableSupplierNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  Salvar no Estoque
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {supplierModalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeSupplierModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-modal-title"
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 bg-[#153488] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <Truck aria-hidden="true" className="size-4.5 text-orange-400" />
                <h2 id="supplier-modal-title" className="text-sm font-semibold">
                  {supplierModalMode === "edit"
                    ? "Editar Fornecedor"
                    : "Cadastrar Novo Fornecedor"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSupplierModal}
                aria-label="Fechar modal de fornecedor"
                className="rounded p-1 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </header>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 p-5">
              <label className="block text-[11px] font-semibold text-slate-700">
                Nome / Razão Social *
                <input
                  required
                  type="text"
                  value={supplierForm.name}
                  onChange={(event) =>
                    setSupplierForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ex: Distribuidora Express"
                  className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  CNPJ / CPF
                  <input
                    type="text"
                    value={supplierForm.document}
                    onChange={(event) =>
                      setSupplierForm((prev) => ({ ...prev, document: event.target.value }))
                    }
                    placeholder="Ex: 45.997.418/0001-53"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  Representante / Vendedor
                  <input
                    type="text"
                    value={supplierForm.representative}
                    onChange={(event) =>
                      setSupplierForm((prev) => ({
                        ...prev,
                        representative: event.target.value,
                      }))
                    }
                    placeholder="Ex: Carlos"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.85fr_1.15fr]">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Contato *
                  <input
                    required
                    type="text"
                    value={supplierForm.contact}
                    onChange={(event) =>
                      setSupplierForm((prev) => ({ ...prev, contact: event.target.value }))
                    }
                    placeholder="Ex: (11) 98451-6521"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  E-mail
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(event) =>
                      setSupplierForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="Ex: pedidos@express.com.br"
                    className="mt-1 h-9 w-full rounded-md border border-blue-200 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <label className="block text-[11px] font-semibold text-slate-700">
                Observações
                <textarea
                  rows={3}
                  value={supplierForm.notes}
                  onChange={(event) =>
                    setSupplierForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Ex: Entregas terças e sextas pela manhã. Pedido mínimo de R$ 300,00."
                  className="mt-1 w-full resize-y rounded-md border border-blue-200 px-3 py-2 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeSupplierModal}
                  className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  {supplierModalMode === "edit" ? "Salvar Alterações" : "Salvar Fornecedor"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProductToDelete(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full text-red-500">
              <CircleX aria-hidden="true" className="size-8 stroke-[1.75]" />
            </div>
            <h2 id="delete-product-title" className="text-base font-bold text-slate-900">
              Excluir Produto
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Atenção: Todos os dados desse produto serão perdidos. Confirmar exclusão?
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="rounded-lg bg-red-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
