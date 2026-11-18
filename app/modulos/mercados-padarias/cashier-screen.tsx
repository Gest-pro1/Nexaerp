"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownCircleIcon,
  ArrowDownLeftIcon,
  ArrowUpCircleIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  LockClosedIcon,
  PlusIcon,
  QrCodeIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}

const QUICK_OPENING_AMOUNTS: { amount: number; shortcut: string }[] = [
  { amount: 50, shortcut: "1" },
  { amount: 100, shortcut: "2" },
  { amount: 150, shortcut: "3" },
  { amount: 200, shortcut: "4" },
];

export type CashierMovementType = "withdrawal" | "supply" | "sale";

export interface CashierMovement {
  id: string;
  type: CashierMovementType;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface ShiftSalesSummary {
  cashSales: number;
  pixSales: number;
  cardSales: number;
  bookletSales: number;
  salesCount: number;
}

export interface CashierClosingRecord {
  id: string;
  closedAt: string;
  shiftTimeRange?: string;
  operatorName: string;
  terminalName?: string;
  initialFund: number;
  totalSales: number;
  expectedDrawer: number;
  physicalCount: number;
  difference: number;
  statusLabel?: "Aberto" | "Fechado";
  notes?: string;
  movements: CashierMovement[];
}

export interface CashierScreenProps {
  operatorName?: string;
  initialIsOpen?: boolean;
  initialFundAmount?: number;
  initialShiftSales?: ShiftSalesSummary;
  shiftSales?: ShiftSalesSummary;
  initialClosings?: CashierClosingRecord[];
  initialPendingPreviousShift?: boolean;
  onShiftStatusChange?: (isOpen: boolean) => void;
}

const DEFAULT_SHIFT_SALES: ShiftSalesSummary = {
  cashSales: 0,
  pixSales: 0,
  cardSales: 0,
  bookletSales: 0,
  salesCount: 0,
};

export default function CashierScreen({
  operatorName = "João Silva",
  initialIsOpen = false,
  initialFundAmount = 0,
  initialShiftSales = DEFAULT_SHIFT_SALES,
  shiftSales: controlledShiftSales,
  initialClosings = [],
  initialPendingPreviousShift = false,
  onShiftStatusChange,
}: CashierScreenProps) {
  const shiftSales = controlledShiftSales ?? initialShiftSales;

  const [isCashierOpen, setIsCashierOpen] = useState(initialIsOpen);
  const [openedAtTime, setOpenedAtTime] = useState("13:36:05 (05/03/2026)");
  const [initialFund, setInitialFund] = useState(initialFundAmount);

  // Open cashier modal & 2-step routine state
  const [isOpenModalVisible, setIsOpenModalVisible] = useState(false);
  const [hasPendingPreviousShift, setHasPendingPreviousShift] = useState(
    initialPendingPreviousShift,
  );
  const [previousShiftCountInput, setPreviousShiftCountInput] =
    useState("300.00");
  const [openingFundInput, setOpeningFundInput] = useState("100.00");

  // Movements (Sangria / Suprimento) state
  const [movements, setMovements] = useState<CashierMovement[]>([]);
  const [activeMovementModal, setActiveMovementModal] = useState<
    "withdrawal" | "supply" | null
  >(null);
  const [movementAmountInput, setMovementAmountInput] = useState("");
  const [movementReasonInput, setMovementReasonInput] = useState("");
  const [movementError, setMovementError] = useState<string | null>(null);

  // Close cashier modal state
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [countedDrawerInput, setCountedDrawerInput] = useState("0.00");
  const [closingNotesInput, setClosingNotesInput] = useState("");

  // History of closings & Movimentações do Caixa modal
  const [closingHistory, setClosingHistory] =
    useState<CashierClosingRecord[]>(initialClosings);
  const [viewingClosingMovements, setViewingClosingMovements] =
    useState<CashierClosingRecord | null>(null);

  const openDialogTitleId = useId();
  const movementDialogTitleId = useId();
  const closeDialogTitleId = useId();
  const historyMovementsTitleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (viewingClosingMovements) {
        setViewingClosingMovements(null);
      } else if (activeMovementModal) {
        setActiveMovementModal(null);
        setMovementError(null);
      } else if (isCloseModalVisible) {
        setIsCloseModalVisible(false);
      } else if (isOpenModalVisible) {
        setIsOpenModalVisible(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeMovementModal,
    isCloseModalVisible,
    isOpenModalVisible,
    viewingClosingMovements,
  ]);

  const withdrawals = useMemo(
    () => movements.filter((item) => item.type === "withdrawal"),
    [movements],
  );

  const supplies = useMemo(
    () => movements.filter((item) => item.type === "supply"),
    [movements],
  );

  const totalWithdrawals = useMemo(
    () => withdrawals.reduce((sum, item) => sum + item.amount, 0),
    [withdrawals],
  );

  const totalSupplies = useMemo(
    () => supplies.reduce((sum, item) => sum + item.amount, 0),
    [supplies],
  );

  const expectedCashInDrawer = useMemo(
    () =>
      initialFund + shiftSales.cashSales + totalSupplies - totalWithdrawals,
    [initialFund, shiftSales.cashSales, totalSupplies, totalWithdrawals],
  );

  const totalSoldInShift = useMemo(
    () =>
      shiftSales.cashSales +
      shiftSales.pixSales +
      shiftSales.cardSales +
      shiftSales.bookletSales,
    [shiftSales],
  );

  const parsedCountedDrawer = useMemo(() => {
    const normalized = countedDrawerInput.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [countedDrawerInput]);

  const drawerDifference = useMemo(
    () => Number((parsedCountedDrawer - expectedCashInDrawer).toFixed(2)),
    [parsedCountedDrawer, expectedCashInDrawer],
  );

  const formattedTodayDate = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `Hoje (${day}/${month}/${year})`;
  }, []);

  const handleOpenCashierModal = () => {
    setOpeningFundInput("0.00");
    setIsOpenModalVisible(true);
  };

  const handleClosePreviousPendingShift = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const counted = Number(previousShiftCountInput.replace(",", "."));
    const safeCount = Number.isFinite(counted) && counted >= 0 ? counted : 300;
    const prevRecord: CashierClosingRecord = {
      id: `close-prev-${Date.now()}`,
      closedAt: "29/10/2026",
      shiftTimeRange: "07:05 - 18:00",
      operatorName: "João Silva",
      terminalName: "Caixa 01",
      initialFund: 300,
      totalSales: 0,
      expectedDrawer: 300,
      physicalCount: safeCount,
      difference: Number((safeCount - 300).toFixed(2)),
      statusLabel: "Fechado",
      movements: [],
    };
    setClosingHistory((curr) => [prevRecord, ...curr]);
    setHasPendingPreviousShift(false);
  };

  const handleConfirmOpenCashier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = openingFundInput.replace(",", ".");
    const parsed = Number(normalized);
    const validFund = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    setInitialFund(validFund);
    setOpenedAtTime(`${hours}:${minutes}`);
    setMovements([]);
    setIsCashierOpen(true);
    setIsOpenModalVisible(false);
    onShiftStatusChange?.(true);
  };

  const handleOpenMovementModal = (type: "withdrawal" | "supply") => {
    setMovementAmountInput("");
    setMovementReasonInput("");
    setMovementError(null);
    setActiveMovementModal(type);
  };

  const handleConfirmMovement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeMovementModal) return;

    const parsedAmount = Number(movementAmountInput.replace(",", "."));
    const trimmedReason = movementReasonInput.trim();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMovementError("Informe um valor válido maior que zero.");
      return;
    }

    if (!trimmedReason) {
      setMovementError("Informe o motivo ou justificativa da movimentação.");
      return;
    }

    const now = new Date();
    const createdAt = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const newMovement: CashierMovement = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: activeMovementModal,
      amount: parsedAmount,
      reason: trimmedReason,
      createdAt,
    };

    setMovements((current) => [...current, newMovement]);
    setActiveMovementModal(null);
    setMovementAmountInput("");
    setMovementReasonInput("");
    setMovementError(null);
  };

  const handleOpenCloseCashierModal = () => {
    setCountedDrawerInput(expectedCashInDrawer.toFixed(2));
    setClosingNotesInput("");
    setIsCloseModalVisible(true);
  };

  const handleConfirmCloseCashier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const now = new Date();
    const datePart = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}/${now.getFullYear()}`;
    const timePart = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;

    const newRecord: CashierClosingRecord = {
      id: `${Date.now()}`,
      closedAt: `${datePart}, ${timePart}`,
      shiftTimeRange: `${openedAtTime} - ${timePart}`,
      operatorName,
      terminalName: "Caixa 01",
      initialFund,
      totalSales: totalSoldInShift,
      expectedDrawer: expectedCashInDrawer,
      physicalCount: parsedCountedDrawer,
      difference: drawerDifference,
      statusLabel: "Fechado",
      notes: closingNotesInput.trim() || undefined,
      movements: [...movements],
    };

    setClosingHistory((current) => [newRecord, ...current]);
    setIsCloseModalVisible(false);
    setIsCashierOpen(false);
    setInitialFund(0);
    setMovements([]);
    onShiftStatusChange?.(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#203f9f]">
            Controle de Turno &amp; Fechamento de Caixa
          </h1>
          <p className="text-[11px] text-slate-400">
            Abertura de caixa, sangrias de segurança, suprimento de troco e
            conciliação de valores.
          </p>
        </div>

        {isCashierOpen && (
          <button
            type="button"
            onClick={handleOpenCloseCashierModal}
            className="inline-flex h-[36px] items-center gap-2 rounded-[8px] bg-[#008f58] px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#007a4b]"
          >
            <LockClosedIcon className="h-4 w-4" />
            <span>Fechar Caixa</span>
          </button>
        )}
      </header>

      {/* Closed Cashier Banner vs Open Cashier Dashboard */}
      {!isCashierOpen ? (
        <section className="flex min-h-[195px] flex-col items-center justify-center rounded-[12px] border border-[#ff8d28] bg-white px-6 py-7 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mb-2.5 text-[#ff8d28]">
            <LockClosedIcon className="mx-auto h-8 w-8 stroke-[1.8]" />
          </div>

          <h2 className="text-[18px] font-bold text-[#203f9f]">
            O caixa está fechado no momento
          </h2>
          <p className="mt-0.5 max-w-md text-[11px] font-medium text-[#ff8d28]">
            Abra o turno informando o fundo de troco inicial para registrar
            vendas.
          </p>

          <button
            type="button"
            onClick={handleOpenCashierModal}
            className="mt-4 inline-flex h-[36px] items-center justify-center rounded-[8px] bg-[#008f58] px-5 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#007a4b]"
          >
            Abrir Caixa Agora
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-3.5">
          {/* Active Shift Status Card */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-[#008f58] bg-white px-5 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#008f58]">
                <LockClosedIcon className="h-6 w-6 stroke-[1.8]" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[16px] font-bold text-slate-900">
                    Turno em Operação
                  </h2>
                  <span className="rounded-full border border-[#008f58]/40 bg-[#e6f9f1] px-2.5 py-0.5 text-[10px] font-semibold text-[#008f58]">
                    Caixa Aberto
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-[#008f58]">
                  Operador: {operatorName} &nbsp;•&nbsp; Abertura às{" "}
                  {openedAtTime}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-[11px] font-semibold text-slate-600">
                Fundo de Troco Inicial
              </span>
              <span className="text-[16px] font-bold text-[#008f58]">
                {formatCurrency(initialFund)}
              </span>
            </div>
          </section>

          {/* 4 Payment Method Summary Cards (Clean White Cards - Screenshot 105815.png) */}
          <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <article className="flex min-h-[104px] flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h3 className="text-[12px] font-semibold text-slate-700">
                Lucro Total
              </h3>
              <p className="my-1 font-mono text-[22px] font-bold text-[#008f58]">
                {formatCurrency(totalSoldInShift)}
              </p>
              <p className="text-[11px] font-medium text-[#008f58]">
                Vendas totais
              </p>
            </article>

            <article className="flex min-h-[104px] flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h3 className="text-[12px] font-semibold text-slate-700">
                Vendas em Pix
              </h3>
              <p className="my-1 font-mono text-[22px] font-bold text-[#ff6b00]">
                {formatCurrency(shiftSales.pixSales)}
              </p>
              <p className="text-[11px] font-medium text-[#ff6b00]">
                Creditado em conta
              </p>
            </article>

            <article className="flex min-h-[104px] flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h3 className="text-[12px] font-semibold text-slate-700">
                Cartões (Débito / Crédito)
              </h3>
              <p className="my-1 font-mono text-[22px] font-bold text-[#153488]">
                {formatCurrency(shiftSales.cardSales)}
              </p>
              <p className="text-[11px] font-medium text-[#153488]">
                Transações via maquininha
              </p>
            </article>

            <article className="flex min-h-[104px] flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h3 className="text-[12px] font-semibold text-slate-700">
                Lançado na Caderneta
              </h3>
              <p className="my-1 font-mono text-[22px] font-bold text-[#9a3412]">
                {formatCurrency(shiftSales.bookletSales)}
              </p>
              <p className="text-[11px] font-medium text-[#9a3412]">
                A receber na caderneta
              </p>
            </article>
          </section>

          {/* Sangria & Suprimento Cards (Screenshot 105815.png) */}
          <section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {/* Sangrias Card */}
            <button
              type="button"
              onClick={() => handleOpenMovementModal("withdrawal")}
              className="flex flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-[#ff8d28]"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                  <ArrowUpRightIcon className="h-4 w-4 text-[#ff6b00]" />
                  <span>Sangrias Registradas no Turno</span>
                </div>
                <span className="text-[#ff6b00]">
                  <PlusIcon className="h-4 w-4 stroke-[2.5]" />
                </span>
              </div>

              <div className="mt-2.5 flex w-full items-center justify-between rounded-[6px] border border-amber-300 bg-amber-50/40 px-3 py-1.5">
                <span className="text-[11px] font-medium text-slate-600">
                  {withdrawals.length}{" "}
                  {withdrawals.length === 1 ? "movimentação" : "movimentações"}
                </span>
                <span className="text-[12px] font-bold text-[#cb6f00]">
                  -{formatCurrency(totalWithdrawals)}
                </span>
              </div>
            </button>

            {/* Suprimento Card */}
            <button
              type="button"
              onClick={() => handleOpenMovementModal("supply")}
              className="flex flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:border-[#008f58]"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
                  <ArrowDownLeftIcon className="h-4 w-4 text-[#008f58]" />
                  <span>Suprimento de Troco no Turno</span>
                </div>
                <span className="text-[#008f58]">
                  <PlusIcon className="h-4 w-4 stroke-[2.5]" />
                </span>
              </div>

              <div className="mt-2.5 flex w-full items-center justify-between rounded-[6px] border border-emerald-400 bg-emerald-50/30 px-3 py-1.5">
                <span className="text-[11px] font-medium text-slate-600">
                  {supplies.length}{" "}
                  {supplies.length === 1 ? "movimentação" : "movimentações"}
                </span>
                <span className="text-[12px] font-bold text-[#008f58]">
                  +{formatCurrency(totalSupplies)}
                </span>
              </div>
            </button>
          </section>
        </div>
      )}

      {/* Closing History Table (Screenshots 105807.png & 105815.png) */}
      <section className="overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-[14px] font-bold text-slate-800">
            Histórico de Fechamento de Caixa
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            {closingHistory.length} fechamento(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8fafc] text-[11px] font-semibold text-slate-600">
                <th className="px-5 py-2.5">Turno / Data</th>
                <th className="px-4 py-2.5">Operador (a)</th>
                <th className="px-4 py-2.5">Fundo Uni.</th>
                <th className="px-4 py-2.5">Vendas Totais</th>
                <th className="px-4 py-2.5">Gaveta Esperada</th>
                <th className="px-4 py-2.5">Contagem Física</th>
                <th className="px-4 py-2.5">Diferença</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px]">
              {closingHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-9 text-center text-[12px] text-slate-400"
                  >
                    Nenhum fechamento de caixa registrado.
                  </td>
                </tr>
              ) : (
                closingHistory.map((record) => {
                  const isExact = Math.abs(record.difference) < 0.01;
                  const isShort = record.difference < -0.01;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <span className="block font-bold text-slate-800">
                          {record.closedAt}
                        </span>
                        {record.shiftTimeRange && (
                          <span className="text-[10px] text-slate-400">
                            {record.shiftTimeRange}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-slate-800">
                          {record.operatorName}
                        </span>
                        {record.terminalName && (
                          <span className="text-[10px] text-slate-400">
                            {record.terminalName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatCurrency(record.initialFund)}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#008f58]">
                        {formatCurrency(record.totalSales)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatCurrency(record.expectedDrawer)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatCurrency(record.physicalCount)}
                      </td>
                      <td className="px-4 py-3">
                        {isExact ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-[#008f58]">
                            Exato (R$ 0,00)
                          </span>
                        ) : isShort ? (
                          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-600">
                            {formatCurrency(record.difference)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
                            +{formatCurrency(record.difference)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                            record.statusLabel === "Aberto"
                              ? "border-emerald-200 bg-emerald-50 text-[#008f58]"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {record.statusLabel ?? "Fechado"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingClosingMovements(record)}
                          aria-label={`Ver movimentações do turno ${record.closedAt}`}
                          title="Ver movimentações do caixa"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#203f9f]"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
          <span>0 de {closingHistory.length} linha(s) selecionadas</span>

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

      {/* Modal 1: Rotina Diária de Caixa (Screenshots 105824.png & 105832.png) */}
      {isOpenModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={openDialogTitleId}
            className="w-full max-w-[445px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h2
                  id={openDialogTitleId}
                  className="text-[18px] font-bold leading-tight text-slate-900"
                >
                  Rotina Diária de Caixa
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Etapa 1 de 2: Abertura de Caixa para Vendas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      hasPendingPreviousShift
                        ? "border-[#ff6b00] text-[#ff6b00]"
                        : "border-[#ff6b00] bg-[#ff6b00] text-white"
                    }`}
                  >
                    1
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-slate-600">
                    2
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpenModalVisible(false)}
                  aria-label="Fechar modal"
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </header>

            {hasPendingPreviousShift ? (
              <form
                onSubmit={handleClosePreviousPendingShift}
                className="space-y-3.5 px-5 pb-5"
              >
                <div className="flex items-start gap-2.5 rounded-[8px] border border-[#ff8d28] bg-[#fffbeb] p-3">
                  <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
                  <div>
                    <p className="text-[12px] font-bold text-[#d97706]">
                      Caixa do dia anterior ainda aberto!
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-slate-600">
                      Para iniciar as vendas de hoje, é obrigatório encerrar o
                      caixa anterior aberto em{" "}
                      <strong className="text-[#d97706]">
                        29/10/2026 às 07:05
                      </strong>{" "}
                      pelo operador <strong>João Silva</strong>.
                    </p>
                  </div>
                </div>

                <div className="rounded-[8px] border border-slate-200 bg-white p-3.5 text-[11px] space-y-2">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Resumo das Vendas do Turno</span>
                    <span>Total: R$ 0,00</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-y border-slate-100 py-2 text-[10px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Dinheiro:</span>
                      <strong className="text-slate-800">R$ 0,00</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pix Recebido:</span>
                      <strong className="text-slate-800">R$ 0,00</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartões (C/D):</span>
                      <strong className="text-slate-800">R$ 0,00</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Caderneta Lançada:</span>
                      <strong className="text-slate-800">R$ 0,00</strong>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700">
                    Fundo Inicial de Troco:
                  </p>
                  <div className="flex items-center justify-between rounded-[6px] border border-[#00a86b]/40 bg-[#e6f9f1] px-3 py-2 text-[11px] font-bold text-[#008f58]">
                    <span>Saldo Esperado em Dinheiro:</span>
                    <span>R$ 300,00</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-700">
                    Dinheiro Contado na Gaveta
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={previousShiftCountInput}
                      onChange={(e) =>
                        setPreviousShiftCountInput(e.target.value)
                      }
                      className="h-[40px] w-full rounded-[8px] border border-slate-300 bg-white pl-9 pr-3 text-[15px] font-bold text-slate-800 focus:border-[#008f58] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#008f58] text-[13px] font-semibold text-white hover:bg-[#007a4b]"
                >
                  <LockClosedIcon className="h-4 w-4" />
                  <span>Fechar Caixa do Dia Anterior</span>
                  <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                    Enter
                  </kbd>
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleConfirmOpenCashier}
                className="space-y-3.5 px-5 pb-5"
              >
                <div className="rounded-[8px] border border-[#3b82f6]/40 bg-[#eff6ff] p-3">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#1e40af]">
                    <LockClosedIcon className="h-4 w-4" />
                    <span>Abertura de Caixa para Vendas de Hoje</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-[#1e40af]">
                    O caixa anterior está devidamente encerrado. Informe o valor
                    físico de moedas e cédulas (fundo de troco) para liberar o
                    balcão.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-[8px] border border-slate-200 bg-white p-2.5 text-[11px]">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500">
                      Data de Abertura
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-800">
                      <ClockIcon className="h-3.5 w-3.5 text-[#ff6b00]" />
                      {formattedTodayDate}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500">
                      Operador responsável
                    </span>
                    <span className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-800">
                      <UserIcon className="h-3.5 w-3.5 text-[#203f9f]" />
                      {operatorName}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-slate-700">
                    Fundo Inicial de Troco:
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      aria-label="Fundo inicial de troco"
                      value={openingFundInput}
                      onChange={(event) =>
                        setOpeningFundInput(event.target.value)
                      }
                      className="h-[42px] w-full rounded-[8px] border border-[#008f58] bg-white pl-10 pr-3 text-[16px] font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="mt-2.5 grid grid-cols-4 gap-2">
                    {QUICK_OPENING_AMOUNTS.map(({ amount, shortcut }) => {
                      const isPicked =
                        Number(openingFundInput.replace(",", ".")) === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setOpeningFundInput(amount.toFixed(2))}
                          className={`flex h-[42px] flex-col items-center justify-center rounded-[8px] border text-[11px] font-semibold transition-colors ${
                            isPicked
                              ? "border-[#008f58] bg-[#008f58] text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>R$ {amount},00</span>
                          <span
                            className={`mt-0.5 rounded px-1 text-[9px] ${
                              isPicked
                                ? "bg-white/20 text-white"
                                : "border border-slate-200 text-slate-400"
                            }`}
                          >
                            {shortcut}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    className="flex h-[40px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#008f58] text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#007a4b]"
                  >
                    <LockClosedIcon className="h-4 w-4" />
                    <span>Abrir Caixa e Iniciar Vendas</span>
                    <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                      Enter
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpenModalVisible(false)}
                    className="flex h-[36px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span>Cancelar e Retornar ao PDV</span>
                    <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400">
                      Esc
                    </kbd>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Sangria de Caixa / Suprimento de Caixa (Screenshots 105844.png & 105851.png) */}
      {activeMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={movementDialogTitleId}
            className="w-full max-w-[420px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between px-5 pt-5 pb-2">
              <div>
                <h2
                  id={movementDialogTitleId}
                  className="text-[18px] font-bold text-slate-900"
                >
                  {activeMovementModal === "withdrawal"
                    ? "Registrar Sangria (Retirada)"
                    : "Registrar Suprimento (Entrada de Troco)"}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {activeMovementModal === "withdrawal"
                    ? "Retire dinheiro do caixa registrando o motivo."
                    : "Adicione dinheiro ao caixa registrando o motivo."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveMovementModal(null);
                  setMovementError(null);
                }}
                aria-label="Fechar modal"
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </header>

            <form
              onSubmit={handleConfirmMovement}
              className="space-y-3.5 px-5 py-4"
            >
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-slate-800">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  aria-label="Valor da movimentação"
                  value={movementAmountInput}
                  onChange={(event) =>
                    setMovementAmountInput(event.target.value)
                  }
                  placeholder="0,00"
                  className="h-[40px] w-full rounded-[8px] border border-slate-300 bg-white px-3 text-[14px] font-medium text-slate-800 focus:border-[#0f766e] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-slate-800">
                  Descrição *
                </label>
                <input
                  type="text"
                  aria-label="Motivo / Justificativa"
                  value={movementReasonInput}
                  onChange={(event) =>
                    setMovementReasonInput(event.target.value)
                  }
                  placeholder={
                    activeMovementModal === "withdrawal"
                      ? "Ex: depósito bancário"
                      : "Ex: Troco adicional"
                  }
                  className="h-[40px] w-full rounded-[8px] border border-slate-300 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                />
              </div>

              {movementError && (
                <p className="text-[11px] font-medium text-rose-600">
                  {movementError}
                </p>
              )}

              <button
                type="submit"
                className="mt-1 inline-flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#0f766e] text-[13px] font-semibold text-white transition-colors hover:bg-[#0d645d]"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>
                  {activeMovementModal === "withdrawal"
                    ? "Confirmar Sangria"
                    : "Confirmar Suprimento"}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Fechamento de Caixa (Screenshot 105837.png) */}
      {isCloseModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={closeDialogTitleId}
            className="w-full max-w-[440px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h2
                  id={closeDialogTitleId}
                  className="text-[18px] font-bold leading-tight text-slate-900"
                >
                  Fechamento de Caixa
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Conferência da gaveta física e consolidação de todos os meios
                  de pagamento do turno.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCloseModalVisible(false)}
                aria-label="Fechar modal"
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleConfirmCloseCashier}
              className="max-h-[82vh] space-y-3 overflow-y-auto px-5 pb-5"
            >
              {/* Total Vendido Card */}
              <div className="rounded-[8px] border border-slate-200 bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500">
                      Total Vendido
                    </span>
                    <strong className="text-[18px] font-bold text-slate-900">
                      {formatCurrency(totalSoldInShift)}
                    </strong>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {shiftSales.salesCount} vendas realizadas
                  </span>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-2.5 space-y-1.5 text-[11px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    RECEBIMENTO POR FORMA DE PAGAMENTO
                  </p>
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <QrCodeIcon className="h-3.5 w-3.5 text-[#008f58]" />
                      Pix
                    </span>
                    <strong className="font-semibold">
                      {formatCurrency(shiftSales.pixSales)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <BanknotesIcon className="h-3.5 w-3.5 text-[#ff6b00]" />
                      Dinheiro
                    </span>
                    <strong className="font-semibold">
                      {formatCurrency(shiftSales.cashSales)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <CreditCardIcon className="h-3.5 w-3.5 text-[#153488]" />
                      Cartões
                    </span>
                    <strong className="font-semibold">
                      {formatCurrency(shiftSales.cardSales)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <BookOpenIcon className="h-3.5 w-3.5 text-[#9a3412]" />
                      Caderneta
                    </span>
                    <strong className="font-semibold">
                      {formatCurrency(shiftSales.bookletSales)}
                    </strong>
                  </div>
                </div>

                {/* Drawer Summary */}
                <div className="mt-2.5 border-t border-slate-100 pt-2.5 space-y-1 text-[10px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Fundo de troco (abertura)</span>
                    <span>{formatCurrency(initialFund)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vendas em dinheiro</span>
                    <span>{formatCurrency(shiftSales.cashSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Suprimentos</span>
                    <span>+{formatCurrency(totalSupplies)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sangrias</span>
                    <span>-{formatCurrency(totalWithdrawals)}</span>
                  </div>

                  <div className="flex justify-between pt-1.5 text-[11px] font-bold text-[#0f766e]">
                    <span>Dinheiro esperado na gaveta</span>
                    <span>{formatCurrency(expectedCashInDrawer)}</span>
                  </div>
                </div>
              </div>

              {/* Physical Count Input */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-slate-800">
                  Valor contado na gaveta (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  aria-label="Total contado na gaveta"
                  value={countedDrawerInput}
                  onChange={(event) =>
                    setCountedDrawerInput(event.target.value)
                  }
                  className="h-[40px] w-full rounded-[8px] border border-slate-300 bg-white px-3 text-[15px] font-semibold text-slate-800 focus:border-[#0f766e] focus:outline-none"
                />
              </div>

              {/* Reconciliation Status Alert */}
              {Math.abs(drawerDifference) < 0.01 ? (
                <div className="flex items-center gap-2 rounded-[8px] border border-[#00a86b] bg-[#e6f9f1] px-3 py-2 text-[10px]">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-[#008f58]" />
                  <p className="text-slate-700">
                    <strong className="font-bold text-[#008f58]">
                      Caixa Exato:
                    </strong>{" "}
                    A contagem confere perfeitamente com as movimentações.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-[8px] border border-rose-300 bg-rose-50 px-3 py-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <ExclamationCircleIcon className="h-4 w-4 shrink-0 text-rose-600" />
                    <p className="text-slate-700">
                      <strong className="font-bold text-rose-600">
                        {drawerDifference < 0
                          ? "Falta de caixa:"
                          : "Sobra de caixa:"}
                      </strong>{" "}
                      Falta dinheiro na gaveta em relação ao registrado no
                      sistema.
                    </p>
                  </div>
                  <strong className="shrink-0 font-bold text-rose-600">
                    {formatCurrency(drawerDifference)}
                  </strong>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-slate-800">
                  Observações
                </label>
                <input
                  type="text"
                  aria-label="Observações do fechamento"
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  placeholder="Opcional"
                  className="h-[38px] w-full rounded-[8px] border border-slate-300 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-[#0f766e] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#0f766e] text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
              >
                <LockClosedIcon className="h-4 w-4" />
                <span>Confirmar e Encerrar Caixa</span>
                <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                  Enter
                </kbd>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Movimentações do Caixa (Screenshot 105755.png) */}
      {viewingClosingMovements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={historyMovementsTitleId}
            className="w-full max-w-[445px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between px-5 pt-5 pb-3">
              <div>
                <h2
                  id={historyMovementsTitleId}
                  className="text-[18px] font-bold text-slate-900"
                >
                  Movimentações do Caixa
                </h2>
                <p className="text-[11px] text-slate-400">
                  Vendas, sangrias e suprimentos registrados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingClosingMovements(null)}
                aria-label="Fechar modal de movimentações"
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>

            <div className="max-h-[62vh] overflow-y-auto px-5 py-2">
              <div className="divide-y divide-slate-100 rounded-[10px] border border-slate-200 bg-white">
                {viewingClosingMovements.movements.length === 0 ? (
                  <p className="py-8 text-center text-[12px] text-slate-400">
                    Nenhuma movimentação registrada neste turno.
                  </p>
                ) : (
                  viewingClosingMovements.movements.map((mov) => {
                    const isWithdrawal = mov.type === "withdrawal";
                    const isSupply = mov.type === "supply";
                    return (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between px-3.5 py-2.5 text-[12px]"
                      >
                        <div className="flex items-center gap-2.5">
                          {isWithdrawal ? (
                            <ArrowDownCircleIcon className="h-5 w-5 shrink-0 text-rose-500" />
                          ) : isSupply ? (
                            <ArrowUpCircleIcon className="h-5 w-5 shrink-0 text-[#008f58]" />
                          ) : (
                            <DocumentTextIcon className="h-5 w-5 shrink-0 text-[#008f58]" />
                          )}
                          <div>
                            <p className="font-bold text-slate-800">
                              {isWithdrawal
                                ? "Sangria"
                                : isSupply
                                  ? "Suprimento"
                                  : mov.reason}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {mov.createdAt}
                              {isWithdrawal || isSupply
                                ? ` - ${mov.reason}`
                                : ""}{" "}
                              - Operador: {viewingClosingMovements.operatorName}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[12px] font-bold ${
                            isWithdrawal ? "text-rose-500" : "text-slate-800"
                          }`}
                        >
                          {isWithdrawal ? "-" : ""}
                          {formatCurrency(mov.amount)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <footer className="px-5 py-4">
              <button
                type="button"
                onClick={() => setViewingClosingMovements(null)}
                className="h-[40px] w-full rounded-[8px] bg-[#008f58] text-[13px] font-semibold text-white transition-colors hover:bg-[#007a4b]"
              >
                Fechar Movimentações do Caixa
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
