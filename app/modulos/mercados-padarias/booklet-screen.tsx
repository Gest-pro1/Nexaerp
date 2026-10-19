"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  FileSignature,
  FileText,
  Pencil,
  Printer,
  QrCode,
  Receipt,
  Search,
  ShieldCheck,
  SquarePen,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  BOOKLET_DUE_OPTIONS,
  calculateLimitUtilization,
  computeBookletMetrics,
  EMPTY_BOOKLET_CUSTOMERS,
  extractDueDayLabel,
  formatBookletPaymentMethod,
  type BookletCustomer,
  type BookletEntry,
  type BookletPaymentMethod,
} from "@/lib/market-booklet";

type BookletScreenProps = {
  operatorName?: string;
  companyName?: string;
  initialCustomers?: BookletCustomer[];
  onSaveCustomer?: (customer: BookletCustomer) => void | Promise<void>;
  onReceivePayment?: (
    customerId: string,
    amount: number,
    method: BookletPaymentMethod,
  ) => void | Promise<void>;
};

type CustomerModalMode = "create" | "edit" | null;
type TermFormat = "a4" | "80mm";

type CustomerFormState = {
  name: string;
  phone: string;
  cpf: string;
  rg: string;
  creditLimit: string;
  dueDay: string;
  notes: string;
};

const EMPTY_CUSTOMER_FORM: CustomerFormState = {
  name: "",
  phone: "",
  cpf: "",
  rg: "",
  creditLimit: "0,00",
  dueDay: "Todo dia 05",
  notes: "",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function parseNumberInput(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const fallback = value.replace(",", ".").trim();
  const parsed = Number(fallback);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  const parsedNormalized = Number(normalized);
  return Number.isFinite(parsedNormalized) && parsedNormalized >= 0 ? parsedNormalized : 0;
}

function formatDateTime(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

function formatLongDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function BookletScreen({
  operatorName = "João Silva",
  companyName = "Mercadinho & Conveniência Amabily",
  initialCustomers = EMPTY_BOOKLET_CUSTOMERS,
  onSaveCustomer,
  onReceivePayment,
}: BookletScreenProps) {
  const [customers, setCustomers] = useState<BookletCustomer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyActiveDebt, setOnlyActiveDebt] = useState(false);

  const [customerModalMode, setCustomerModalMode] = useState<CustomerModalMode>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(EMPTY_CUSTOMER_FORM);

  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<BookletPaymentMethod>("pix");

  const [statementCustomerId, setStatementCustomerId] = useState<string | null>(null);

  const [termCustomerId, setTermCustomerId] = useState<string | null>(null);
  const [termFormat, setTermFormat] = useState<TermFormat>("a4");
  const [printTwoCopies, setPrintTwoCopies] = useState(true);

  const metrics = useMemo(() => computeBookletMetrics(customers), [customers]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers.filter((customer) => {
      if (onlyActiveDebt && customer.balance <= 0) {
        return false;
      }

      if (!query) return true;

      return (
        customer.name.toLowerCase().includes(query) ||
        customer.cpf.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
      );
    });
  }, [customers, searchQuery, onlyActiveDebt]);

  const editingCustomer = useMemo(
    () => customers.find((item) => item.id === editingCustomerId) ?? null,
    [customers, editingCustomerId],
  );

  const paymentCustomer = useMemo(
    () => customers.find((item) => item.id === paymentCustomerId) ?? null,
    [customers, paymentCustomerId],
  );

  const statementCustomer = useMemo(
    () => customers.find((item) => item.id === statementCustomerId) ?? null,
    [customers, statementCustomerId],
  );

  const termCustomer = useMemo(
    () => customers.find((item) => item.id === termCustomerId) ?? null,
    [customers, termCustomerId],
  );

  useEffect(() => {
    if (
      !customerModalMode &&
      !paymentCustomerId &&
      !statementCustomerId &&
      !termCustomerId
    ) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (termCustomerId) {
          setTermCustomerId(null);
          return;
        }
        if (paymentCustomerId) {
          setPaymentCustomerId(null);
          return;
        }
        if (customerModalMode) {
          setCustomerModalMode(null);
          setEditingCustomerId(null);
          return;
        }
        if (statementCustomerId) {
          setStatementCustomerId(null);
        }
        return;
      }

      if (
        termCustomerId &&
        (event.key === "p" || event.key === "P") &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        window.print?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customerModalMode, paymentCustomerId, statementCustomerId, termCustomerId]);

  function openCreateCustomerModal() {
    setEditingCustomerId(null);
    setCustomerForm(EMPTY_CUSTOMER_FORM);
    setCustomerModalMode("create");
  }

  function openEditCustomerModal(customer: BookletCustomer) {
    setEditingCustomerId(customer.id);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      cpf: customer.cpf,
      rg: customer.rg,
      creditLimit: customer.creditLimit.toFixed(2).replace(".", ","),
      dueDay: customer.dueDay || "Todo dia 05",
      notes: customer.notes,
    });
    setCustomerModalMode("edit");
  }

  function closeCustomerModal() {
    setCustomerModalMode(null);
    setEditingCustomerId(null);
  }

  function handleSaveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = customerForm.name.trim();
    const phone = customerForm.phone.trim();
    const cpf = customerForm.cpf.trim();
    if (!name || !phone || !cpf) return;

    const creditLimit = parseNumberInput(customerForm.creditLimit);

    if (customerModalMode === "edit" && editingCustomer) {
      const updatedCustomer: BookletCustomer = {
        ...editingCustomer,
        name,
        phone,
        cpf,
        rg: customerForm.rg.trim(),
        creditLimit,
        dueDay: customerForm.dueDay,
        notes: customerForm.notes.trim(),
      };

      setCustomers((current) =>
        current.map((item) => (item.id === editingCustomer.id ? updatedCustomer : item)),
      );
      void onSaveCustomer?.(updatedCustomer);
      closeCustomerModal();
      return;
    }

    const nextCode = String(customers.length + 1).padStart(4, "0");
    const newCustomer: BookletCustomer = {
      id: `cust-${Date.now()}`,
      code: nextCode,
      name,
      phone,
      cpf,
      rg: customerForm.rg.trim(),
      creditLimit,
      balance: 0,
      dueDay: customerForm.dueDay,
      notes: customerForm.notes.trim(),
      createdAt: formatLongDate(new Date()),
      entries: [],
    };

    setCustomers((current) => [newCustomer, ...current]);
    void onSaveCustomer?.(newCustomer);
    closeCustomerModal();
    setTermFormat("a4");
    setTermCustomerId(newCustomer.id);
  }

  function openPaymentModal(customer: BookletCustomer) {
    setPaymentCustomerId(customer.id);
    setPaymentAmount(
      customer.balance > 0 ? customer.balance.toFixed(2).replace(".", ",") : "0,00",
    );
    setPaymentMethod("pix");
  }

  function closePaymentModal() {
    setPaymentCustomerId(null);
    setPaymentAmount("");
  }

  function handleConfirmPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentCustomer) return;

    const amount = parseNumberInput(paymentAmount);
    if (amount <= 0) return;

    const nextBalance = Math.max(0, Number((paymentCustomer.balance - amount).toFixed(2)));
    const methodLabel = formatBookletPaymentMethod(paymentMethod);
    const newEntry: BookletEntry = {
      id: `entry-${Date.now()}`,
      type: "payment",
      description: `Pagamento recebido no balcão via ${methodLabel}`,
      dateTime: formatDateTime(new Date()),
      operatorName,
      amount,
      balanceAfter: nextBalance,
      paymentMethod,
    };

    setCustomers((current) =>
      current.map((item) =>
        item.id === paymentCustomer.id
          ? {
              ...item,
              balance: nextBalance,
              entries: [newEntry, ...item.entries],
            }
          : item,
      ),
    );

    void onReceivePayment?.(paymentCustomer.id, amount, paymentMethod);
    closePaymentModal();
  }

  function openTermModal(customer: BookletCustomer) {
    setTermFormat("a4");
    setTermCustomerId(customer.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold leading-7 text-blue-800">Gestão da Caderneta</h1>
          <p className="text-[11px] text-slate-500">
            Controle de contas a receber, histórico por cliente, quitação no balcão e cobranças
            automáticas.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateCustomerModal}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0d9f6e] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <UserPlus aria-hidden="true" className="size-4" />
          Novo Cliente
        </button>
      </div>

      <section
        aria-label="Indicadores da caderneta"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <article className="flex min-h-[96px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-xs font-medium text-slate-600">Total a Receber na Caderneta</h2>
          <p className="my-1 font-mono text-2xl font-bold leading-7 text-emerald-600">
            {formatCurrency(metrics.totalReceivable)}
          </p>
          <p className="text-[11px] text-slate-400">
            {metrics.activeDebtCount} clientes com débitos ativos
          </p>
        </article>

        <article className="flex min-h-[96px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-xs font-medium text-slate-600">Limite de Crédito Concedido</h2>
          <p className="my-1 font-mono text-2xl font-bold leading-7 text-[#9a3412]">
            {formatCurrency(metrics.totalCreditLimit)}
          </p>
          <p className="text-[11px] text-slate-400">
            Taxa de comprometimento {metrics.commitmentRate}%
          </p>
        </article>

        <article className="flex min-h-[96px] flex-col justify-between rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-xs font-medium text-slate-600">Clientes Cadastrados</h2>
          <p className="my-1 font-mono text-2xl font-bold leading-7 text-blue-800">
            {metrics.totalCustomers}
          </p>
          <p className="text-[11px] text-slate-400">{metrics.upToDateCount} clientes em dia</p>
        </article>
      </section>

      <section
        aria-label="Busca e filtro da caderneta"
        className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <label className="flex h-10 flex-1 items-center gap-2.5 rounded-lg border border-slate-200 bg-[#f3f4f6]/60 px-3 text-slate-400 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar clientes por nome ou CPF..."
            aria-label="Buscar clientes por nome ou CPF"
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <button
          type="button"
          aria-pressed={onlyActiveDebt}
          onClick={() => setOnlyActiveDebt((prev) => !prev)}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            onlyActiveDebt
              ? "border-amber-400 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-[#f3f4f6]/60 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertCircle aria-hidden="true" className="size-4 text-amber-500" />
          Dívida Ativa ({metrics.activeDebtCount})
        </button>
      </section>

      {filteredCustomers.length > 0 ? (
        <section
          aria-label="Lista de clientes na caderneta"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredCustomers.map((customer) => {
            const hasDebt = customer.balance > 0;
            const utilization = calculateLimitUtilization(
              customer.balance,
              customer.creditLimit,
            );

            return (
              <article
                key={customer.id}
                className={`flex flex-col justify-between rounded-xl border-l-[6px] bg-white p-4 shadow-sm ${
                  hasDebt ? "border-l-[#9a3412]" : "border-l-emerald-500"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-xs font-bold text-slate-900">
                        {customer.name}
                      </h3>
                      {hasDebt ? (
                        <span className="rounded-full border border-orange-200 bg-orange-50/70 px-2 py-0.5 text-[9px] font-semibold text-[#9a3412]">
                          Com Débito
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
                          Em Dia
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[9px] text-slate-400">
                      CPF: {customer.cpf} | {customer.phone}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(customer.balance)}
                    </p>
                    <p className="text-[9px] text-slate-400">Saldo Devedor</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(Math.max(utilization, 0), 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-medium text-slate-500">
                    <span>Limite: {formatCurrency(customer.creditLimit)}</span>
                    <span className="font-semibold text-slate-600">{utilization}% utilizado</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openPaymentModal(customer)}
                      aria-label={`Receber de ${customer.name}`}
                      className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Receber
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatementCustomerId(customer.id)}
                      aria-label={`Extrato de ${customer.name}`}
                      className="rounded-lg bg-slate-200/80 px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-xs transition-colors hover:bg-slate-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Extrato
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditCustomerModal(customer)}
                      aria-label={`Editar caderneta de ${customer.name}`}
                      className="rounded-lg border border-emerald-500 p-1.5 text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Pencil aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openTermModal(customer)}
                      aria-label={`Imprimir termo de ${customer.name}`}
                      className="rounded-lg border border-amber-400 p-1.5 text-amber-500 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Printer aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-xl bg-white px-5 py-12 text-center shadow-sm">
          <p className="text-xs text-slate-500">
            Nenhum cliente cadastrado na caderneta.
          </p>
        </section>
      )}

      {customerModalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCustomerModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-modal-title"
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 bg-[#153488] px-5 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                {customerModalMode === "edit" ? (
                  <SquarePen aria-hidden="true" className="size-4.5 text-orange-400" />
                ) : (
                  <UserPlus aria-hidden="true" className="size-4.5 text-orange-400" />
                )}
                <h2 id="customer-modal-title" className="text-sm font-semibold">
                  {customerModalMode === "edit"
                    ? "Editar Caderneta"
                    : "Cadastrar Cliente na Caderneta"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCustomerModal}
                aria-label="Fechar modal de cliente"
                className="rounded p-1 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </header>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 p-5">
              {customerModalMode === "edit" && editingCustomer && (
                <div className="-mt-2 text-right text-[10px] text-slate-500">
                  Saldo Devedor Atual:{" "}
                  <strong className="font-bold text-[#9a3412]">
                    {formatCurrency(editingCustomer.balance)}
                  </strong>
                </div>
              )}

              <label className="block text-[11px] font-semibold text-slate-700">
                Nome Completo / Apelido *
                <input
                  required
                  type="text"
                  value={customerForm.name}
                  onChange={(event) =>
                    setCustomerForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ex: Manoel das Frutas"
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-slate-50/70 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-[11px] font-semibold text-slate-700">
                WhatsApp (Com DDD) *
                <input
                  required
                  type="text"
                  value={customerForm.phone}
                  onChange={(event) =>
                    setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="Ex: (83) 99485-6521"
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-slate-50/70 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  CPF *
                  <input
                    required
                    type="text"
                    value={customerForm.cpf}
                    onChange={(event) =>
                      setCustomerForm((prev) => ({ ...prev, cpf: event.target.value }))
                    }
                    placeholder="000.000.000-00"
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-slate-50/70 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  RG (Opcional)
                  <input
                    type="text"
                    value={customerForm.rg}
                    onChange={(event) =>
                      setCustomerForm((prev) => ({ ...prev, rg: event.target.value }))
                    }
                    placeholder="EX: 12.345.678"
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-slate-50/70 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Limite Autorizado (R$) *
                  <input
                    required
                    type="text"
                    value={customerForm.creditLimit}
                    onChange={(event) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        creditLimit: event.target.value,
                      }))
                    }
                    placeholder="0,00"
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-slate-50/70 px-3 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-[11px] font-semibold text-slate-700">
                  Vencimento / Acerto
                  <select
                    value={customerForm.dueDay}
                    onChange={(event) =>
                      setCustomerForm((prev) => ({ ...prev, dueDay: event.target.value }))
                    }
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-slate-50/70 px-2.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    {BOOKLET_DUE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-[11px] font-semibold text-slate-700">
                Observações/Pessoas Autorizadas
                <textarea
                  rows={3}
                  value={customerForm.notes}
                  onChange={(event) =>
                    setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Ex: Paga todo dia 05 após aposentadoria"
                  className="mt-1 w-full resize-y rounded-md border border-slate-300 bg-slate-50/70 px-3 py-2 text-xs font-normal text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCustomerModal}
                  className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  {customerModalMode === "edit" ? "Salvar Alterações" : "Salvar e Gerar Termo"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {paymentCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePaymentModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 bg-[#153488] px-5 py-3.5 text-white">
              <div>
                <p className="text-[11px] text-blue-200">Receber Pagamento</p>
                <h2 id="payment-modal-title" className="text-sm font-bold">
                  {paymentCustomer.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                aria-label="Fechar modal de pagamento"
                className="rounded p-1 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </header>

            <form onSubmit={handleConfirmPayment} className="space-y-4 p-5">
              <div className="-mt-2 text-right text-[10px] text-slate-500">
                Saldo Devedor Atual:{" "}
                <strong className="font-bold text-[#9a3412]">
                  {formatCurrency(paymentCustomer.balance)}
                </strong>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700">Dívida Total em Aberto:</p>
                <p className="mt-0.5 text-lg font-bold text-[#b45309]">
                  {formatCurrency(paymentCustomer.balance)}
                </p>
              </div>

              <label className="block text-[11px] font-semibold text-slate-700">
                Valor a Pagar / Abater (R$)
                <input
                  required
                  type="text"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="0,00"
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-slate-50/70 px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <fieldset>
                <legend className="mb-1.5 text-[11px] font-semibold text-slate-700">
                  Meio de Recebimento
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    aria-pressed={paymentMethod === "pix"}
                    onClick={() => setPaymentMethod("pix")}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      paymentMethod === "pix"
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode aria-hidden="true" className="size-3.5" />
                    Pix
                  </button>
                  <button
                    type="button"
                    aria-pressed={paymentMethod === "cash"}
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      paymentMethod === "cash"
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CircleDollarSign aria-hidden="true" className="size-3.5" />
                    Dinheiro
                  </button>
                  <button
                    type="button"
                    aria-pressed={paymentMethod === "debit"}
                    onClick={() => setPaymentMethod("debit")}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      paymentMethod === "debit"
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard aria-hidden="true" className="size-3.5" />
                    Débito
                  </button>
                </div>
              </fieldset>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {statementCustomer && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setStatementCustomerId(null);
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="statement-drawer-title"
            className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 bg-[#153488] px-5 py-4 text-white">
              <div>
                <p className="text-xs font-bold text-orange-400">Caderneta Digital</p>
                <h2 id="statement-drawer-title" className="mt-0.5 text-base font-bold">
                  {statementCustomer.name}
                </h2>
                <p className="mt-0.5 text-[11px] text-blue-100">
                  Whatsapp: {statementCustomer.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatementCustomerId(null)}
                aria-label="Fechar extrato"
                className="rounded p-1 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X aria-hidden="true" className="size-4.5" />
              </button>
            </header>

            <div className="border-b border-emerald-200 bg-emerald-50/70 px-5 py-4">
              <p className="text-sm font-bold text-emerald-800">Saldo Devedor Atual:</p>
              <p className="text-lg font-bold text-emerald-700">
                {formatCurrency(statementCustomer.balance)}
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-700/80">
                Limite total: {formatCurrency(statementCustomer.creditLimit)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 border-b border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => openPaymentModal(statementCustomer)}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-blue-400 bg-white px-2 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                <DollarSign aria-hidden="true" className="size-3" />
                Receber Pagamento
              </button>
              <button
                type="button"
                onClick={() => openEditCustomerModal(statementCustomer)}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-orange-300 bg-white px-2 text-[10px] font-semibold text-[#9a3412] transition-colors hover:bg-orange-50"
              >
                <Pencil aria-hidden="true" className="size-3" />
                Editar Caderneta
              </button>
              <button
                type="button"
                onClick={() => window.print?.()}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-emerald-400 bg-white px-2 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                <Printer aria-hidden="true" className="size-3" />
                Imprimir Extrato
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <h3 className="mb-3 text-xs font-semibold text-slate-600">
                Histórico de Lançamentos na Caderneta
              </h3>

              {statementCustomer.entries.length > 0 ? (
                <ul className="space-y-2.5">
                  {statementCustomer.entries.map((entry) => {
                    const isPayment = entry.type === "payment";
                    return (
                      <li
                        key={entry.id}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${
                          isPayment
                            ? "border-emerald-400 bg-emerald-50/50"
                            : "border-slate-200 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                              isPayment
                                ? "border-emerald-500 text-emerald-600"
                                : "border-[#9a3412] text-[#9a3412]"
                            }`}
                          >
                            {isPayment ? (
                              <ArrowDownLeft aria-hidden="true" className="size-3.5" />
                            ) : (
                              <ArrowUpRight aria-hidden="true" className="size-3.5" />
                            )}
                          </span>
                          <div>
                            <p className="text-[11px] font-bold text-slate-800">
                              {entry.description}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              {entry.dateTime} . Op: {entry.operatorName}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`text-xs font-bold ${
                              isPayment ? "text-emerald-700" : "text-[#9a3412]"
                            }`}
                          >
                            {isPayment ? "-" : "+"}
                            {formatCurrency(entry.amount)}
                          </p>
                          <p className="mt-1 text-[9px] font-medium text-slate-600">
                            Saldo : {formatCurrency(entry.balanceAfter)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-8 text-center text-xs text-slate-400">
                  Nenhum lançamento registrado para este cliente.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}

      {termCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTermCustomerId(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="term-modal-title"
            className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <header className="bg-[#153488] text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <FileSignature aria-hidden="true" className="size-6 text-orange-400" />
                  <div>
                    <h2 id="term-modal-title" className="text-base font-bold leading-5">
                      Termo de Abertura da Caderneta
                    </h2>
                    <p className="mt-0.5 text-[10px] text-blue-100">
                      <span className="font-semibold text-orange-400">Cliente:</span>{" "}
                      {termCustomer.name}{" "}
                      <span className="ml-2 font-semibold text-orange-400">Limite:</span>{" "}
                      {formatCurrency(termCustomer.creditLimit)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={termFormat === "a4"}
                    onClick={() => setTermFormat("a4")}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
                      termFormat === "a4"
                        ? "border-white/60 bg-white/15 text-white"
                        : "border-white/25 text-blue-100 hover:bg-white/10"
                    }`}
                  >
                    <FileText aria-hidden="true" className="size-3.5 text-orange-400" />
                    Folha A4
                  </button>
                  <button
                    type="button"
                    aria-pressed={termFormat === "80mm"}
                    onClick={() => setTermFormat("80mm")}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
                      termFormat === "80mm"
                        ? "border-white/60 bg-white/15 text-white"
                        : "border-white/25 text-blue-100 hover:bg-white/10"
                    }`}
                  >
                    <Receipt aria-hidden="true" className="size-3.5 text-blue-200" />
                    Bobina 80mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setTermCustomerId(null)}
                    aria-label="Fechar termo"
                    className="ml-1 rounded p-1 text-blue-100 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 border-t border-white/15 px-5 py-2 text-[11px] text-blue-100">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck aria-hidden="true" className="size-4 text-orange-400" />
                  Documento Jurídico &amp; Comercial Válido
                </span>
                {termFormat === "a4" && (
                  <label className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={printTwoCopies}
                      onChange={(event) => setPrintTwoCopies(event.target.checked)}
                      className="size-3.5 rounded accent-orange-500"
                    />
                    <span>Imprimir duas vias na folha</span>
                  </label>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
              {termFormat === "a4" ? (
                <div className="mx-auto max-w-2xl space-y-4 rounded-lg bg-white p-6 text-slate-800 shadow-sm">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-300 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{companyName}</h3>
                      <p className="text-[10px] font-semibold text-slate-700">
                        Amabily Comércio Varejista Ltda
                      </p>
                      <p className="text-[10px] text-slate-500">
                        CNPJ: 18.421.902/0001-34 | IE: 109.832.441.110
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Rua Floriano Peixoto, 450 - Centro - Ingá - Fone/WhatsApp: (83) 98765-4321
                      </p>
                    </div>
                    <span className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-700">
                      Caderneta Nº {termCustomer.code}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-300 py-2.5 text-center">
                    <h4 className="text-xs font-bold text-slate-900">
                      Termo de Abertura e Adesão de Conta na Caderneta
                    </h4>
                    <p className="text-[9px] text-slate-500">
                      Autorização de Limite de Crédito Rotativo e Venda a Prazo no Balcão
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-300 p-4">
                    <h5 className="mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2 text-[10px] font-semibold uppercase text-slate-600">
                      <User aria-hidden="true" className="size-3.5 text-slate-500" />
                      1. DADOS CADASTRAIS DO(A) CLIENTE / TITULAR
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div>
                        <span className="block text-slate-500">Nome Completo:</span>
                        <strong className="text-xs text-slate-800">{termCustomer.name}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-500">CPF:</span>
                        <strong className="text-xs text-slate-800">{termCustomer.cpf}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-500">WhatsApp / Telefone:</span>
                        <strong className="text-xs text-slate-800">{termCustomer.phone}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-500">RG:</span>
                        <strong className="text-xs text-slate-800">
                          {termCustomer.rg || "Não informado"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-300 p-4">
                    <h5 className="mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2 text-[10px] font-semibold uppercase text-slate-600">
                      <CreditCard aria-hidden="true" className="size-3.5 text-slate-500" />
                      2. CONDIÇÕES COMERCIAIS DO CRÉDITO APROVADO
                    </h5>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="rounded-lg border border-emerald-500/60 p-2.5">
                        <span className="block text-[9px] font-medium uppercase text-slate-500">
                          LIMITE DE CRÉDITO APROVADO
                        </span>
                        <strong className="mt-0.5 block text-xs font-bold text-emerald-600">
                          {formatCurrency(termCustomer.creditLimit)}
                        </strong>
                      </div>
                      <div className="rounded-lg border border-emerald-500/60 p-2.5">
                        <span className="block text-[9px] font-medium uppercase text-slate-500">
                          DIA DO VENCIMENTO
                        </span>
                        <strong className="mt-0.5 block text-xs font-bold text-slate-800">
                          {extractDueDayLabel(termCustomer.dueDay)}
                        </strong>
                      </div>
                      <div className="rounded-lg border border-emerald-500/60 p-2.5">
                        <span className="block text-[9px] font-medium uppercase text-slate-500">
                          MEIOS DE QUITAÇÃO ACEITOS
                        </span>
                        <strong className="mt-0.5 block text-[11px] font-bold text-slate-800">
                          Dinheiro no caixa, Pix ou Débito
                        </strong>
                      </div>
                    </div>
                    <div className="mt-2.5 rounded-lg border border-slate-300 px-3 py-2 text-[10px] text-slate-600">
                      <span className="font-semibold">Observações/Pessoas Autorizadas:</span>{" "}
                      {termCustomer.notes || "Nenhuma observação registrada"}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-300 p-4">
                    <h5 className="mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2 text-[10px] font-semibold uppercase text-slate-600">
                      <ShieldCheck aria-hidden="true" className="size-3.5 text-slate-500" />
                      3. CLÁUSULAS E TERMOS DO ACORDO
                    </h5>
                    <div className="space-y-2 text-[10px] leading-4 text-slate-600">
                      <p>
                        <strong>Cláusula 1ª (Concessão de Limite):</strong> O ESTABELECIMENTO
                        concede ao(à) CLIENTE o crédito rotativo estipulado neste termo para
                        aquisição exclusiva de produtos de consumo de primeira necessidade nas
                        dependências do comércio.
                      </p>
                      <p>
                        <strong>Cláusula 2ª (Registro das Compras):</strong> A cada compra a prazo
                        efetuada, o sistema informatizado emitirá o respectivo cupom detalhado de
                        itens e registrará o débito correspondente na caderneta digital, cujo
                        extrato poderá ser consultado ou solicitado a qualquer momento via WhatsApp
                        ou balcão.
                      </p>
                      <p>
                        <strong>Cláusula 3ª (Reconhecimento da Dívida):</strong> O(A) CLIENTE
                        reconhece expressamente como dívida líquida, certa e exigível todos os
                        valores oriundos das retiradas de mercadorias lançadas em seu nome ou por
                        pessoas sob sua expressa autorização.
                      </p>
                      <p>
                        <strong>Cláusula 4ª (Pontualidade e Bloqueio):</strong> O pagamento
                        integral ou amortização do saldo devedor deverá ocorrer até a data
                        acordada. A ausência de pagamento sem prévia repactuação acarretará a
                        imediata suspensão de novas compras a prazo até a quitação.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] text-slate-600">
                    <span>
                      <strong>Localidade:</strong> Centro
                    </span>
                    <span>
                      <strong>Data:</strong> {termCustomer.createdAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-6 text-center text-[10px]">
                    <div className="border-t border-slate-400 pt-2">
                      <strong className="block text-slate-800">{termCustomer.name}</strong>
                      <span className="text-slate-500">
                        Assinatura do(a) Titular da Conta (Cliente)
                      </span>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <strong className="block text-slate-800">{companyName}</strong>
                      <span className="text-slate-500">
                        Pelo Estabelecimento Credor (Responsável)
                      </span>
                    </div>
                  </div>

                  {printTwoCopies && (
                    <div className="border-t-2 border-blue-500 pt-2 text-center text-[9px] text-slate-400">
                      [ 1 Via: Arquivo do Estabelecimento comercial | 2 Via: Titular do Crédito ]
                    </div>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-[320px] rounded-lg bg-white p-5 font-mono text-[10px] leading-4 text-slate-800 shadow-sm">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase">{companyName}</p>
                    <p>Amabily Comércio Varejista Ltda</p>
                    <p>CNPJ: 18.421.902/0001-34</p>
                    <p>Rua Floriano Peixoto, 450 - Centro - Ingá/PB</p>
                    <p>Tel: (83) 98765-4321</p>
                  </div>

                  <div className="my-3 border-y border-dashed border-slate-400 py-2 text-center">
                    <p className="font-bold">TERMO DE ADESÃO DA CADERNETA</p>
                    <p>CONTA Nº {termCustomer.code}</p>
                  </div>

                  <div className="space-y-0.5">
                    <p>
                      <strong>CLIENTE:</strong> {termCustomer.name}
                    </p>
                    <p>
                      <strong>FONE:</strong> {termCustomer.phone}
                    </p>
                    <p>
                      <strong>CPF:</strong> {termCustomer.cpf}
                    </p>
                  </div>

                  <div className="my-3 space-y-0.5 border-y border-dashed border-slate-400 py-2">
                    <p>
                      <strong>LIMITE AUTORIZADO:</strong>{" "}
                      {formatCurrency(termCustomer.creditLimit)}
                    </p>
                    <p>
                      <strong>VENCIMENTO:</strong> {extractDueDayLabel(termCustomer.dueDay)}
                    </p>
                    <p>
                      <strong>CHAVE PIX:</strong> 18421902000134
                    </p>
                  </div>

                  <p className="text-[9px] leading-3.5 text-slate-700">
                    O(A) titular declara ter ciência e reconhece expressamente como dívida líquida
                    e certa todas as mercadorias retiradas na modalidade caderneta até o limite
                    fixado, comprometendo-se ao pagamento pontual na data acordada.
                  </p>

                  <div className="mt-6 space-y-6 border-t border-dashed border-slate-400 pt-6 text-center">
                    <div className="border-t border-slate-600 pt-1">
                      <p className="font-bold">{termCustomer.name}</p>
                      <p className="text-[8px] uppercase text-slate-500">ASSINATURA DO CLIENTE</p>
                    </div>
                    <div className="border-t border-slate-600 pt-1">
                      <p className="font-bold">{companyName}</p>
                      <p className="text-[8px] uppercase text-slate-500">
                        VISTO DO ESTABELECIMENTO
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-500">{termCustomer.createdAt}</p>
                  </div>
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
              <p className="text-[10px] text-slate-400">
                Dica: Pressione{" "}
                <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-slate-600">
                  P
                </kbd>{" "}
                para imprimir diretamente ou{" "}
                <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-slate-600">
                  ESC
                </kbd>{" "}
                para fechar.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTermCustomerId(null)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => window.print?.()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <Printer aria-hidden="true" className="size-3.5" />
                  Imprimir Termo
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
