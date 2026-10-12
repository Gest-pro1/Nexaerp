"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Plus,
  Wallet,
  X,
} from "lucide-react";

type CashierScreenProps = {
  operatorName: string;
};

type CashierDialog = "open" | "withdrawal" | "supply" | "close" | null;
type CashMovementType = "withdrawal" | "supply";

type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  createdAt: Date;
};

type CashierClosing = {
  id: string;
  closedAt: Date;
  operatorName: string;
  openingAmount: number;
  expectedAmount: number;
  countedAmount: number;
  difference: number;
  movements: CashMovement[];
};

const QUICK_AMOUNTS = [50, 100, 150, 200];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function CashierScreen({ operatorName }: CashierScreenProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialog, setDialog] = useState<CashierDialog>(null);
  const [openingAmount, setOpeningAmount] = useState("");
  const [countedAmount, setCountedAmount] = useState("");
  const [operationAmount, setOperationAmount] = useState("");
  const [operationReason, setOperationReason] = useState("");
  const [openedAt, setOpenedAt] = useState<Date | null>(null);
  const [activeMovements, setActiveMovements] = useState<CashMovement[]>([]);
  const [closings, setClosings] = useState<CashierClosing[]>([]);
  const [operationError, setOperationError] = useState("");

  const openingCash = parseAmount(openingAmount);
  const withdrawalTotal = activeMovements
    .filter((movement) => movement.type === "withdrawal")
    .reduce((total, movement) => total + movement.amount, 0);
  const supplyTotal = activeMovements
    .filter((movement) => movement.type === "supply")
    .reduce((total, movement) => total + movement.amount, 0);
  const expectedCash = openingCash + supplyTotal - withdrawalTotal;
  const countedCash = parseAmount(countedAmount);
  const difference = countedCash - expectedCash;
  const dialogTitle =
    dialog === "withdrawal"
      ? "Registrar Sangria (Retirada)"
      : dialog === "supply"
        ? "Registrar Suprimento (Troco)"
        : dialog === "close"
          ? "Fechamento de Caixa"
          : "Abertura de Caixa para Vendas de Hoje";

  function closeDialog() {
    setDialog(null);
    setOperationAmount("");
    setOperationReason("");
    setOperationError("");
  }

  function handleOpenCashier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOpenedAt(new Date());
    setIsOpen(true);
    setDialog(null);
  }

  function handleCloseCashier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (openedAt) {
      const closedAt = new Date();
      setClosings((history) => [
        {
          id: `${openedAt.getTime()}-${closedAt.getTime()}`,
          closedAt,
          operatorName,
          openingAmount: openingCash,
          expectedAmount: expectedCash,
          countedAmount: countedCash,
          difference,
          movements: [...activeMovements],
        },
        ...history,
      ]);
    }
    setIsOpen(false);
    setOpeningAmount("");
    setCountedAmount("");
    setOpenedAt(null);
    setActiveMovements([]);
    setDialog(null);
  }

  function handleOperation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseAmount(operationAmount);
    const reason = operationReason.trim();
    if (amount <= 0 || !reason) {
      setOperationError("Informe um valor maior que zero e o motivo da movimentação.");
      return;
    }

    const movement: CashMovement = {
      id: `${Date.now()}-${activeMovements.length}`,
      type: dialog === "withdrawal" ? "withdrawal" : "supply",
      amount,
      reason,
      createdAt: new Date(),
    };
    setActiveMovements((current) => [...current, movement]);
    closeDialog();
  }

  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialog(null);
        setOperationAmount("");
        setOperationReason("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold leading-7 text-blue-800">
            Controle de Turno &amp; Fechamento de Caixa
          </h1>
          <p className="text-[11px] text-slate-500">
            Abertura de caixa, sangrias de segurança, suprimento de troco e conferência de valores.
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Dados e movimentações aguardam integração com o back-end.
          </p>
        </div>
        {isOpen && (
          <button
            type="button"
            onClick={() => setDialog("close")}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          >
            <LockKeyhole aria-hidden="true" className="size-3.5" />
            Fechar Caixa
          </button>
        )}
      </div>

      {isOpen ? (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-400 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <LockKeyhole aria-hidden="true" className="size-5 text-emerald-600" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-800">Turno em Operação</h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                    Caixa Aberto
                  </span>
                </div>
                <p className="text-[10px] text-emerald-700">
                  Operador: {operatorName}
                  {openedAt && ` · Abertura às ${formatDate(openedAt)}`}
                </p>
              </div>
            </div>
            <p className="text-right text-[11px] text-slate-600">
              Fundo de Troco Inicial
              <span className="block text-sm font-bold text-emerald-600">{formatCurrency(openingCash)}</span>
            </p>
          </section>

          <section aria-label="Resumo do turno" className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Lucro Total" amount={0} note="Vendas totais" color="emerald" />
            <SummaryCard label="Vendas em Pix" amount={0} note="Creditado em conta" color="orange" />
            <SummaryCard label="Cartões (Débito / Crédito)" amount={0} note="Transações via maquininha" color="blue" />
            <SummaryCard label="Lançado na Caderneta" amount={0} note="A receber na caderneta" color="orange" />
          </section>

        </>
      ) : (
        <section className="flex min-h-25 flex-col items-center justify-center gap-1 rounded-lg border border-orange-400 bg-white px-4 py-4 text-center shadow-sm">
          <LockKeyhole aria-hidden="true" className="size-5 text-orange-500" />
          <h2 className="text-sm font-semibold text-blue-800">O caixa está fechado no momento</h2>
          <p className="text-[10px] text-slate-500">
            Abra o turno informando o fundo de troco inicial para registrar as vendas.
          </p>
          <button
            type="button"
            onClick={() => setDialog("open")}
            className="mt-1 inline-flex h-8 items-center gap-2 rounded-md bg-emerald-600 px-4 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Wallet aria-hidden="true" className="size-3.5" />
            Abrir Caixa Agora
          </button>
        </section>
      )}

      {isOpen && (
        <section aria-label="Movimentações do caixa" className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <OperationCard
            title="Sangrias Registradas no Turno"
            movementCount={activeMovements.filter((movement) => movement.type === "withdrawal").length}
            amount={withdrawalTotal}
            type="withdrawal"
            onClick={() => setDialog("withdrawal")}
          />
          <OperationCard
            title="Suprimento de Troco no Turno"
            movementCount={activeMovements.filter((movement) => movement.type === "supply").length}
            amount={supplyTotal}
            type="supply"
            onClick={() => setDialog("supply")}
          />
        </section>
      )}

      <section className="overflow-hidden rounded-lg bg-white shadow-sm" aria-labelledby="cashier-history-heading">
        <h2 id="cashier-history-heading" className="px-4 py-3 text-[13px] font-semibold text-slate-700">
          Histórico de Fechamento de Caixa
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5 text-left text-[10px]">
            <thead className="border-y border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                {["Turno / Data", "Operador(a)", "Fundo Uni.", "Vendas Totais", "Gaveta Esperada", "Contagem Física", "Diferença", "Status"].map((column) => (
                  <th key={column} className="px-4 py-2 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {closings.length > 0 ? closings.map((closing) => (
                <tr key={closing.id} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-4 py-2">{formatDate(closing.closedAt)}</td>
                  <td className="px-4 py-2">{closing.operatorName}</td>
                  <td className="px-4 py-2">{formatCurrency(closing.openingAmount)}</td>
                  <td className="px-4 py-2">{formatCurrency(0)}</td>
                  <td className="px-4 py-2">{formatCurrency(closing.expectedAmount)}</td>
                  <td className="px-4 py-2">{formatCurrency(closing.countedAmount)}</td>
                  <td className={`px-4 py-2 ${closing.difference === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatCurrency(closing.difference)}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px]">Fechado</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-9 text-center text-[11px] text-slate-500">
                    Nenhum fechamento de caixa registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-[10px] text-slate-500">
          <span>{closings.length} fechamento(s)</span>
          <div className="flex gap-2">
            <button type="button" disabled className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50">
              Anterior
            </button>
            <button type="button" disabled className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50">
              Próximo
            </button>
          </div>
        </div>
      </section>

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cashier-dialog-title"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 bg-blue-800 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                {dialog === "withdrawal" ? (
                  <ArrowUpRight aria-hidden="true" className="size-4 text-orange-400" />
                ) : dialog === "supply" ? (
                  <ArrowDownLeft aria-hidden="true" className="size-4 text-emerald-400" />
                ) : (
                  <LockKeyhole aria-hidden="true" className="size-4 text-orange-400" />
                )}
                <div>
                  <h2 id="cashier-dialog-title" className="text-sm font-semibold">{dialogTitle}</h2>
                  {dialog === "close" && (
                    <p className="text-[9px] text-blue-100">Conferência da gaveta física e consolidação do turno.</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Fechar janela"
                className="rounded p-1 text-blue-100 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </header>

            {dialog === "open" ? (
              <form onSubmit={handleOpenCashier} className="space-y-4 p-4">
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <p className="flex items-center gap-2 text-[11px] font-semibold text-blue-800">
                    <CalendarClock aria-hidden="true" className="size-4" />
                    Abertura de Caixa para Vendas de Hoje
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-blue-700">
                    Se houver um caixa anterior pendente, ele deverá ser fechado antes da abertura do novo turno.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-[10px]">
                  <p>
                    <span className="block text-slate-500">Data da Abertura</span>
                    <span className="font-medium text-slate-700">Hoje ({formatDate(new Date())})</span>
                  </p>
                  <p>
                    <span className="block text-slate-500">Operador responsável</span>
                    <span className="font-medium text-slate-700">{operatorName}</span>
                  </p>
                </div>
                <fieldset>
                  <legend className="mb-1.5 text-[11px] font-semibold text-slate-700">Fundo Inicial de Troco</legend>
                  <div className="flex items-center rounded-md border border-emerald-500 px-3 focus-within:ring-2 focus-within:ring-emerald-100">
                    <span className="mr-2 text-sm text-slate-400">R$</span>
                    <input
                      autoFocus
                      required
                      min="0"
                      step="0.01"
                      type="number"
                      value={openingAmount}
                      onChange={(event) => setOpeningAmount(event.target.value)}
                      aria-label="Fundo inicial de troco"
                      placeholder="0,00"
                      className="h-10 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {QUICK_AMOUNTS.map((amount, index) => (
                      <button
                        key={amount}
                        type="button"
                        aria-pressed={openingAmount === String(amount)}
                        onClick={() => setOpeningAmount(String(amount))}
                        className={`rounded-md border px-2 py-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${openingAmount === String(amount) ? "border-emerald-600 bg-emerald-600 font-semibold text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                      >
                        {formatCurrency(amount)}
                        <span className="block text-[9px] opacity-70">{index + 1}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-2">
                  <button type="submit" className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                    <LockKeyhole aria-hidden="true" className="size-3.5" />
                    Abrir Caixa e Iniciar Vendas
                    <kbd className="rounded bg-emerald-700 px-1.5 py-0.5 text-[9px]">Enter</kbd>
                  </button>
                  <button type="button" onClick={closeDialog} className="h-9 w-full rounded-md bg-slate-50 text-[11px] font-medium text-slate-600 hover:bg-slate-100">
                    Cancelar e Retornar ao PDV
                    <kbd className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[9px]">Esc</kbd>
                  </button>
                </div>
              </form>
            ) : dialog === "close" ? (
              <form onSubmit={handleCloseCashier} className="space-y-3 p-4">
                <section aria-label="Vendas do turno por meio de pagamento">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold text-slate-700">Vendas do Turno por Meio de Pagamento</h3>
                    <span className="text-[9px] text-slate-400">0 vendas realizadas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <PaymentSummary icon={<Banknote aria-hidden="true" className="size-3" />} label="Dinheiro" amount={0} />
                    <PaymentSummary icon={<Banknote aria-hidden="true" className="size-3" />} label="Pix" amount={0} />
                    <PaymentSummary icon={<CreditCard aria-hidden="true" className="size-3" />} label="Cartões" amount={0} />
                    <PaymentSummary icon={<Wallet aria-hidden="true" className="size-3" />} label="Caderneta" amount={0} />
                  </div>
                </section>
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="text-slate-600">Faturamento Total do Turno</span>
                  <strong className="text-slate-700">{formatCurrency(0)}</strong>
                </div>
                <div className="rounded-md border border-slate-200 p-3">
                  <h3 className="text-[10px] font-semibold text-slate-700">Composição do Dinheiro Esperado na Gaveta</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-slate-500">
                    <p>Fundo Inicial: <strong className="text-slate-700">{formatCurrency(openingCash)}</strong></p>
                    <p>Vendas em Espécie: <strong className="text-slate-700">{formatCurrency(0)}</strong></p>
                    <p>Suprimentos: <strong className="text-emerald-700">{formatCurrency(supplyTotal)}</strong></p>
                    <p>Sangrias: <strong className="text-orange-700">{formatCurrency(withdrawalTotal)}</strong></p>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-[10px] font-semibold text-slate-700">
                    <span>Saldo Físico esperado na Gaveta</span>
                    <span>{formatCurrency(expectedCash)}</span>
                  </div>
                </div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Total na Gaveta (Cédulas + Moedas)
                  <span className="mt-1 flex items-center rounded-md border border-slate-300 px-3 focus-within:ring-2 focus-within:ring-blue-100">
                    <span className="mr-2 text-sm text-slate-400">R$</span>
                    <input
                      autoFocus
                      required
                      min="0"
                      step="0.01"
                      type="number"
                      value={countedAmount}
                      onChange={(event) => setCountedAmount(event.target.value)}
                      aria-label="Total contado na gaveta"
                      placeholder="0,00"
                      className="h-10 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                    />
                  </span>
                </label>
                {countedAmount !== "" && (
                  <p
                    role="status"
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[10px] ${difference === 0 ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700"}`}
                  >
                    {difference === 0 ? <CheckCircle2 aria-hidden="true" className="size-3.5" /> : <AlertCircle aria-hidden="true" className="size-3.5" />}
                    {difference === 0 ? "Caixa Exato: a contagem confere com o esperado." : `Diferença de ${formatCurrency(difference)} em relação ao valor esperado.`}
                  </p>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={closeDialog} className="rounded-md px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2">
                    <LockKeyhole aria-hidden="true" className="size-3.5" />
                    Confirmar e Encerrar Caixa
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOperation} className="space-y-3 p-4">
                <label className="block text-[11px] font-medium text-slate-700">
                  {dialog === "withdrawal" ? "Valor da Retirada (R$)" : "Valor do Suprimento de Troco (R$)"}
                  <input
                    autoFocus
                    required
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={operationAmount}
                    onChange={(event) => setOperationAmount(event.target.value)}
                    aria-label="Valor da movimentação"
                    placeholder="0,00"
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-[11px] font-medium text-slate-700">
                  Motivo / Justificativa
                  <textarea
                    required
                    rows={2}
                    value={operationReason}
                    onChange={(event) => setOperationReason(event.target.value)}
                    placeholder={dialog === "withdrawal" ? "Ex.: retirada para cofre ou pagamento de fornecedor" : "Ex.: aporte para troco"}
                    className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-[11px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                {operationError && (
                  <p role="alert" className="text-[10px] text-rose-700">{operationError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeDialog} className="rounded-md px-3 py-2 text-[11px] text-slate-600 hover:bg-slate-100">
                    Cancelar
                  </button>
                  <button type="submit" className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${dialog === "withdrawal" ? "bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-500" : "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"}`}>
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                    Confirmar {dialog === "withdrawal" ? "Sangria" : "Suprimento"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  note,
  color,
}: {
  label: string;
  amount: number;
  note: string;
  color: "emerald" | "orange" | "blue";
}) {
  const colors = {
    emerald: "text-emerald-600",
    orange: "text-orange-600",
    blue: "text-blue-700",
  };

  return (
    <article className="rounded-lg bg-white px-3 py-2.5 shadow-sm">
      <h2 className="text-[11px] font-medium text-slate-600">{label}</h2>
      <p className={`mt-1 font-mono text-xl font-bold leading-6 ${colors[color]}`}>{formatCurrency(amount)}</p>
      <p className={`mt-1 text-[9px] ${colors[color]}`}>{note}</p>
    </article>
  );
}

function OperationCard({
  title,
  movementCount,
  amount,
  type,
  onClick,
}: {
  title: string;
  movementCount: number;
  amount: number;
  type: "withdrawal" | "supply";
  onClick: () => void;
}) {
  const isWithdrawal = type === "withdrawal";
  const Icon = isWithdrawal ? ArrowUpRight : ArrowDownLeft;

  return (
    <article className={`overflow-hidden rounded-lg border bg-white shadow-sm ${isWithdrawal ? "border-orange-200" : "border-emerald-200"}`}>
      <button
        type="button"
        onClick={onClick}
        className={`w-full p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 ${isWithdrawal ? "hover:bg-orange-50 focus-visible:ring-orange-400" : "hover:bg-emerald-50 focus-visible:ring-emerald-400"}`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <Icon aria-hidden="true" className={`size-3.5 ${isWithdrawal ? "text-orange-600" : "text-emerald-600"}`} />
            {title}
          </span>
          <Plus aria-hidden="true" className="size-3.5 text-slate-500" />
        </span>
        <span className="mt-2 flex items-center justify-between rounded border border-slate-200 px-2 py-1 text-[9px] text-slate-500">
          {movementCount} {movementCount === 1 ? "movimentação" : "movimentações"}
          <span className={`font-semibold ${isWithdrawal ? "text-orange-600" : "text-emerald-600"}`}>{formatCurrency(amount)}</span>
        </span>
      </button>
    </article>
  );
}

function PaymentSummary({
  icon,
  label,
  amount,
}: {
  icon: ReactNode;
  label: string;
  amount: number;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-2 text-[9px]">
      <p className="flex items-center gap-1 text-slate-600">{icon}{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-slate-700">{formatCurrency(amount)}</p>
      <p className="text-slate-400">0 venda(s)</p>
    </div>
  );
}
