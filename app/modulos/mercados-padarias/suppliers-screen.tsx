"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  CircleX,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  BRAZILIAN_STATES,
  EMPTY_INVENTORY_PRODUCTS,
  EMPTY_INVENTORY_SUPPLIERS,
  type InventoryProduct,
  type InventorySupplier,
} from "@/lib/market-inventory";

export interface SuppliersScreenProps {
  initialSuppliers?: InventorySupplier[];
  suppliers?: InventorySupplier[];
  products?: InventoryProduct[];
  onSaveSupplier?: (supplier: InventorySupplier, isEdit: boolean) => void;
  onDeleteSupplier?: (supplierId: string) => void;
}

interface SupplierFormDraft {
  id?: string;
  name: string;
  document: string;
  representative: string;
  contact: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  notes: string;
}

const SUPPLIER_ACCENT_COLORS = [
  "#203f9f",
  "#008f58",
  "#ff8d28",
  "#6155f5",
  "#0088ff",
  "#008f7a",
];

function createEmptySupplierDraft(): SupplierFormDraft {
  return {
    name: "",
    document: "",
    representative: "",
    contact: "",
    email: "",
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "RS",
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
    cep: supplier.cep ?? "",
    street: supplier.street ?? "",
    number: supplier.number ?? "",
    neighborhood: supplier.neighborhood ?? "",
    city: supplier.city ?? "",
    state: supplier.state ?? "RS",
    notes: supplier.notes,
  };
}

export default function SuppliersScreen({
  initialSuppliers = EMPTY_INVENTORY_SUPPLIERS,
  suppliers: controlledSuppliers,
  products = EMPTY_INVENTORY_PRODUCTS,
  onSaveSupplier,
  onDeleteSupplier,
}: SuppliersScreenProps) {
  const [internalSuppliers, setInternalSuppliers] =
    useState<InventorySupplier[]>(initialSuppliers);
  const suppliers = controlledSuppliers ?? internalSuppliers;

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState<SupplierFormDraft>(
    createEmptySupplierDraft,
  );
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [deletingSupplier, setDeletingSupplier] =
    useState<InventorySupplier | null>(null);

  const modalTitleId = useId();
  const deleteTitleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deletingSupplier) {
        setDeletingSupplier(null);
      } else if (isModalOpen) {
        setIsModalOpen(false);
        setSupplierError(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deletingSupplier, isModalOpen]);

  const linkedProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of products) {
      if (product.supplierId) {
        counts[product.supplierId] = (counts[product.supplierId] ?? 0) + 1;
      } else if (product.supplierName) {
        const match = suppliers.find(
          (s) => s.name.toLowerCase() === product.supplierName.toLowerCase(),
        );
        if (match) {
          counts[match.id] = (counts[match.id] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [products, suppliers]);

  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (stateFilter && (supplier.state ?? "") !== stateFilter) {
        return false;
      }
      if (!query) return true;
      return (
        supplier.name.toLowerCase().includes(query) ||
        supplier.document.toLowerCase().includes(query) ||
        supplier.representative.toLowerCase().includes(query) ||
        supplier.contact.toLowerCase().includes(query) ||
        supplier.email.toLowerCase().includes(query) ||
        (supplier.city ?? "").toLowerCase().includes(query)
      );
    });
  }, [searchQuery, stateFilter, suppliers]);

  const handleOpenNewSupplier = () => {
    setSupplierDraft(createEmptySupplierDraft());
    setSupplierError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: InventorySupplier) => {
    setSupplierDraft(supplierToDraft(supplier));
    setSupplierError(null);
    setIsModalOpen(true);
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
      cep: supplierDraft.cep.trim(),
      street: supplierDraft.street.trim(),
      number: supplierDraft.number.trim(),
      neighborhood: supplierDraft.neighborhood.trim(),
      city: supplierDraft.city.trim(),
      state: supplierDraft.state.trim() || "RS",
      notes: supplierDraft.notes.trim(),
      accentColor:
        SUPPLIER_ACCENT_COLORS[suppliers.length % SUPPLIER_ACCENT_COLORS.length],
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

    onSaveSupplier?.(savedSupplier, isEdit);
    setIsModalOpen(false);
    setSupplierError(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingSupplier) return;
    const targetId = deletingSupplier.id;

    if (!controlledSuppliers) {
      setInternalSuppliers((current) =>
        current.filter((item) => item.id !== targetId),
      );
    }

    onDeleteSupplier?.(targetId);
    setDeletingSupplier(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-black">
            Fornecedores
          </h1>
          <p className="text-[13px] text-black/60">
            Cadastro de fornecedores e itens vinculados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewSupplier}
          className="inline-flex h-[41px] items-center gap-2 rounded-[8px] bg-[#203f9f] px-4 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#193382]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Novo Fornecedor</span>
        </button>
      </header>

      {/* Search & Filter Bar */}
      <section className="flex flex-col gap-3 rounded-[8px] border border-black/10 bg-white p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar fornecedor por razão social, CNPJ, contato ou cidade..."
            aria-label="Buscar fornecedores"
            className="h-[42px] w-full rounded-[10px] border border-black/20 bg-white pl-10 pr-4 text-[14px] text-black placeholder:text-black/45 focus:border-[#203f9f] focus:outline-none"
          />
        </div>

        <select
          aria-label="Filtrar por UF"
          value={stateFilter}
          onChange={(event) => setStateFilter(event.target.value)}
          className="h-[42px] min-w-[180px] rounded-[10px] border border-black/20 bg-[#f0f2f5] px-3.5 text-[14px] font-medium text-black/80 focus:border-[#203f9f] focus:outline-none"
        >
          <option value="">Todos os Estados (UF)</option>
          {BRAZILIAN_STATES.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </section>

      {/* Supplier Cards Grid */}
      {filteredSuppliers.length === 0 ? (
        <section className="flex min-h-[260px] flex-col items-center justify-center rounded-[12px] border border-black/10 bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#203f9f]/10 text-[#203f9f]">
            <Truck className="h-6 w-6" />
          </div>
          <h2 className="text-[18px] font-semibold text-black">
            Nenhum fornecedor cadastrado.
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-black/55">
            Cadastre seus fornecedores e atacadistas para vincular produtos no estoque e acompanhar contatos comerciais.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSuppliers.map((supplier, index) => {
            const accentColor =
              supplier.accentColor ??
              SUPPLIER_ACCENT_COLORS[index % SUPPLIER_ACCENT_COLORS.length];
            const linkedCount = linkedProductCounts[supplier.id] ?? 0;
            const locationLabel =
              supplier.city && supplier.state
                ? `${supplier.city}/${supplier.state}`
                : supplier.city || supplier.state || "Localização não informada";

            return (
              <article
                key={supplier.id}
                className="relative flex min-h-[214px] overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              >
                {/* Left Accent Bar */}
                <div
                  className="w-[9px] shrink-0"
                  style={{ backgroundColor: accentColor }}
                />

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-[16px] font-semibold leading-tight text-black">
                          {supplier.name}
                        </h2>
                        <p className="mt-1 text-[12px] font-medium text-black/55">
                          CNPJ: {supplier.document || "Não informado"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSupplier(supplier)}
                          aria-label={`Editar fornecedor ${supplier.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/60 transition-colors hover:bg-black/5 hover:text-[#203f9f]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSupplier(supplier)}
                          aria-label={`Excluir fornecedor ${supplier.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/60 transition-colors hover:bg-[#ff383c]/10 hover:text-[#ff383c]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[12px] text-black/75">
                      <p className="font-medium text-black/80">
                        Contato: {supplier.representative || "Não informado"}
                      </p>
                      <div className="flex items-center gap-2 text-black/65">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-black/45" />
                        <span>{supplier.contact || "Sem telefone"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-black/65">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-black/45" />
                        <span className="truncate">
                          {supplier.email || "Sem e-mail"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-black/65">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-black/45" />
                        <span>{locationLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">
                      PRODUTOS VINCULADOS
                    </span>
                    <span className="rounded-full bg-[#203f9f]/10 px-2.5 py-0.5 text-[13px] font-bold text-[#203f9f]">
                      {linkedCount}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Modal: Cadastrar / Editar Fornecedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="w-full max-w-[533px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2
                  id={modalTitleId}
                  className="text-[20px] font-bold text-black"
                >
                  {supplierDraft.id
                    ? "Editar Fornecedor"
                    : "Cadastrar Fornecedor"}
                </h2>
                <p className="text-[12px] text-black/55">
                  Dados de contato e faturamento do fornecedor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
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
              className="max-h-[82vh] space-y-3.5 overflow-y-auto px-5 py-4"
            >
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  Nome/Razão Social *
                </label>
                <input
                  type="text"
                  aria-label="Nome/Razão Social"
                  value={supplierDraft.name}
                  onChange={(e) =>
                    setSupplierDraft((curr) => ({
                      ...curr,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ex: Bebida Sul Atacado"
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    aria-label="CNPJ"
                    value={supplierDraft.document}
                    onChange={(e) =>
                      setSupplierDraft((curr) => ({
                        ...curr,
                        document: e.target.value,
                      }))
                    }
                    placeholder="00.000.000/0001-00"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Pessoa de contato
                  </label>
                  <input
                    type="text"
                    aria-label="Pessoa de contato"
                    value={supplierDraft.representative}
                    onChange={(e) =>
                      setSupplierDraft((curr) => ({
                        ...curr,
                        representative: e.target.value,
                      }))
                    }
                    placeholder="Ex: Fernanda Lopes"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Telefone
                  </label>
                  <input
                    type="text"
                    aria-label="Telefone"
                    value={supplierDraft.contact}
                    onChange={(e) =>
                      setSupplierDraft((curr) => ({
                        ...curr,
                        contact: e.target.value,
                      }))
                    }
                    placeholder="(51) 99123-4567"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
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
                    onChange={(e) =>
                      setSupplierDraft((curr) => ({
                        ...curr,
                        email: e.target.value,
                      }))
                    }
                    placeholder="pedidos@fornecedor.com.br"
                    className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                  />
                </div>
              </div>

              {/* Section: Localização */}
              <div className="border-t border-black/10 pt-3">
                <h3 className="mb-2.5 text-[14px] font-bold text-black">
                  Localização
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[12px] font-semibold text-black">
                      CEP
                    </label>
                    <input
                      type="text"
                      aria-label="CEP"
                      value={supplierDraft.cep}
                      onChange={(e) =>
                        setSupplierDraft((curr) => ({
                          ...curr,
                          cep: e.target.value,
                        }))
                      }
                      placeholder="00000-000"
                      className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="mb-1 block text-[12px] font-semibold text-black">
                      Rua
                    </label>
                    <input
                      type="text"
                      aria-label="Rua"
                      value={supplierDraft.street}
                      onChange={(e) =>
                        setSupplierDraft((curr) => ({
                          ...curr,
                          street: e.target.value,
                        }))
                      }
                      placeholder="Ex: Av. Assis Brasil"
                      className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[12px] font-semibold text-black">
                      Número
                    </label>
                    <input
                      type="text"
                      aria-label="Número"
                      value={supplierDraft.number}
                      onChange={(e) =>
                        setSupplierDraft((curr) => ({
                          ...curr,
                          number: e.target.value,
                        }))
                      }
                      placeholder="1200"
                      className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="mb-1 block text-[12px] font-semibold text-black">
                      Bairro
                    </label>
                    <input
                      type="text"
                      aria-label="Bairro"
                      value={supplierDraft.neighborhood}
                      onChange={(e) =>
                        setSupplierDraft((curr) => ({
                          ...curr,
                          neighborhood: e.target.value,
                        }))
                      }
                      placeholder="Distrito Industrial"
                      className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-8">
                    <label className="mb-1 block text-[12px] font-semibold text-black">
                      Cidade
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
                      <input
                        type="text"
                        aria-label="Cidade"
                        value={supplierDraft.city}
                        onChange={(e) =>
                          setSupplierDraft((curr) => ({
                            ...curr,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Porto Alegre"
                        className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white pl-9 pr-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[12px] font-semibold text-black">
                      UF
                    </label>
                    <select
                      aria-label="UF"
                      value={supplierDraft.state}
                      onChange={(e) =>
                        setSupplierDraft((curr) => ({
                          ...curr,
                          state: e.target.value,
                        }))
                      }
                      className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#203f9f] focus:outline-none"
                    >
                      {BRAZILIAN_STATES.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  Observações
                </label>
                <input
                  type="text"
                  aria-label="Observações"
                  value={supplierDraft.notes}
                  onChange={(e) =>
                    setSupplierDraft((curr) => ({
                      ...curr,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Prazo de entrega, dias de visita, condições..."
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
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
                    setIsModalOpen(false);
                    setSupplierError(null);
                  }}
                  className="text-[15px] font-semibold text-black/60 transition-colors hover:text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[36px] rounded-[8px] bg-[#008f58] px-5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
                >
                  Salvar Fornecedor
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Fornecedor */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteTitleId}
            className="w-full max-w-[333px] rounded-[15px] bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff383c]/10 text-[#ff383c]">
              <CircleX className="h-8 w-8" />
            </div>
            <h2
              id={deleteTitleId}
              className="text-[20px] font-semibold text-black"
            >
              Excluir Fornecedor
            </h2>
            <p className="mt-2 text-[13px] leading-snug text-black/60">
              Atenção: Deseja excluir {deletingSupplier.name}? Os produtos vinculados continuam cadastrados.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                className="h-[33px] min-w-[115px] rounded-[8px] border border-black/30 bg-[#d9d9d9]/40 px-4 text-[14px] font-semibold text-black/60 transition-colors hover:bg-black/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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
