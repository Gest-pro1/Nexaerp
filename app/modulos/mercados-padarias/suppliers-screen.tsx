"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircleIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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
    state: "PB",
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
    state: supplier.state ?? "PB",
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
  const [cityFilter, setCityFilter] = useState("");
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

  const citiesOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of suppliers) {
      if (s.city?.trim()) {
        set.add(s.city.trim());
      }
    }
    return Array.from(set);
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (cityFilter && (supplier.city ?? "") !== cityFilter) {
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
  }, [cityFilter, searchQuery, suppliers]);

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
      accentColor: "#0f766e",
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
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#203f9f]">
            Fornecedores
          </h1>
          <p className="text-[11px] text-slate-400">
            Cadastro de fornecedores e itens vinculados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewSupplier}
          className="inline-flex h-[36px] items-center gap-1.5 rounded-[8px] bg-[#0f766e] px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
        >
          <PlusIcon className="h-4 w-4 stroke-[2.5]" />
          <span>Novo Fornecedor</span>
        </button>
      </header>

      {/* Search & Filter Bar (Screenshot 110123.png) */}
      <section className="flex flex-col gap-3 rounded-[10px] border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por nome ou CNPJ..."
            aria-label="Buscar fornecedores"
            className="h-[38px] w-full rounded-[8px] border border-slate-200 bg-[#f3f4f6] pl-10 pr-4 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          aria-label="Filtrar por Cidade"
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
          className="h-[38px] min-w-[175px] rounded-[8px] border border-slate-200 bg-[#f3f4f6] px-3 text-[12px] font-medium text-slate-700 focus:border-[#203f9f] focus:bg-white focus:outline-none"
        >
          <option value="">Todas as Cidades</option>
          {citiesOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </section>

      {/* Supplier Cards Grid (Screenshot 110123.png) */}
      {filteredSuppliers.length === 0 ? (
        <section className="flex min-h-[240px] flex-col items-center justify-center rounded-[12px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <TruckIcon className="mb-2.5 h-10 w-10 text-slate-300" />
          <h2 className="text-[15px] font-bold text-slate-800">
            Nenhum fornecedor cadastrado.
          </h2>
          <p className="mt-1 max-w-md text-[11px] text-slate-400">
            Cadastre seus fornecedores e atacadistas para vincular produtos no
            estoque e acompanhar contatos comerciais.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSuppliers.map((supplier) => {
            const linkedCount = linkedProductCounts[supplier.id] ?? 0;
            const locationLabel =
              supplier.city && supplier.state
                ? `${supplier.city}/${supplier.state}`
                : supplier.city || supplier.state || "Porto Alegre/RS";

            return (
              <article
                key={supplier.id}
                className="flex min-h-[190px] overflow-hidden rounded-[10px] border border-slate-200/80 border-l-[6px] border-l-[#0f766e] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-[13px] font-bold text-slate-900">
                          {supplier.name}
                        </h2>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          CNPJ: {supplier.document || "98.765.432/0001-10"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSupplier(supplier)}
                          aria-label={`Editar fornecedor ${supplier.name}`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#203f9f]"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSupplier(supplier)}
                          aria-label={`Excluir fornecedor ${supplier.name}`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1 text-[11px] text-slate-500">
                      <p>Contato: {supplier.representative || "Não informado"}</p>
                      <div className="flex items-center gap-1.5">
                        <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span>{supplier.contact || "Sem telefone"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span className="truncate">
                          {supplier.email || "Sem e-mail"}
                        </span>
                      </div>
                      <p className="pt-0.5 text-[10px] text-slate-400">
                        {locationLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      PRODUTOS VINCULADOS
                    </span>
                    <span className="text-[11px] font-bold text-slate-800">
                      {linkedCount}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Modal: Novo Fornecedor / Editar Fornecedor (Screenshots 110132.png & 110145.png) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="w-full max-w-[445px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h2
                  id={modalTitleId}
                  className="text-[18px] font-bold text-slate-900"
                >
                  {supplierDraft.id
                    ? "Editar Fornecedor"
                    : "Cadastrar Fornecedor"}
                </h2>
                <p className="text-[11px] text-slate-400">
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
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleSaveSupplier}
              className="max-h-[82vh] space-y-3 overflow-y-auto px-5 pb-5"
            >
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                  Nome/Razão Social
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
                  placeholder="EX: Distribuidora Central Ltda"
                  className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-[#f8fafc] px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                    placeholder="00.000.000/0000-00"
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-[#f8fafc] px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                    placeholder="Ex: João"
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                    placeholder="(00) 00000-0000"
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-[#f8fafc] px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                    placeholder="contato@fornecedor.com"
                    className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                  />
                </div>
              </div>

              {/* Section: Localização */}
              <div className="pt-1">
                <h3 className="mb-2 text-[12px] font-bold text-slate-800">
                  Localização
                </h3>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                      className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                      placeholder="Ex: José Bonifácio"
                      className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                      placeholder="Ex: 101"
                      className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                      placeholder="Ex: Vila Nova"
                      className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-800">
                      Cidade
                    </label>
                    <div className="relative">
                      <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
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
                        placeholder="Ingá"
                        className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white pl-8 pr-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                      className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 focus:border-[#0f766e] focus:outline-none"
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
                <label className="mb-1 block text-[11px] font-semibold text-slate-800">
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
                  placeholder="Ex: Prazo de pagamento 30 dias"
                  className="h-[36px] w-full rounded-[6px] border border-slate-300 bg-white px-3 text-[12px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
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
                    setIsModalOpen(false);
                    setSupplierError(null);
                  }}
                  className="text-[12px] font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-[34px] items-center gap-1.5 rounded-[6px] bg-[#0f766e] px-4 text-[12px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Salvar Fornecedor</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Fornecedor (Screenshot 110138.png) */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={deleteTitleId}
            className="w-full max-w-[333px] rounded-[14px] bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-rose-500">
              <XCircleIcon className="h-9 w-9 stroke-[1.5]" />
            </div>
            <h2
              id={deleteTitleId}
              className="text-[16px] font-bold text-slate-900"
            >
              Excluir Fornecedor
            </h2>
            <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
              Atenção: Deseja excluir{" "}
              <strong className="text-slate-800">
                {deletingSupplier.name}
              </strong>
              ? Os produtos vinculados continuam cadastrados.
            </p>
            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setDeletingSupplier(null)}
                className="text-[12px] font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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
