"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Eye,
  Lock,
  Plus,
  QrCode,
  ShieldAlert,
  User,
  X,
} from "lucide-react";

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
  operatorName: string;
  initialFund: number;
  totalSales: number;
  expectedDrawer: number;
  physicalCount: number;
  difference: number;
  notes?: string;
  movements: CashierMovement[];
}

export interface CashierScreenProps {
  operatorName?: string;
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
  initialShiftSales = DEFAULT_SHIFT_SALES,
  shiftSales: controlledShiftSales,
  initialClosings = [],
  initialPendingPreviousShift = false,
  onShiftStatusChange,
}: CashierScreenProps) {
  const shiftSales = controlledShiftSales ?? initialShiftSales;

  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [openedAtTime, setOpenedAtTime] = useState("08:00");
  const [initialFund, setInitialFund] = useState(0);

  // Open cashier modal & 2-step routine state
  const [isOpenModalVisible, setIsOpenModalVisible] = useState(false);
  const [hasPendingPreviousShift, setHasPendingPreviousShift] = useState(
    initialPendingPreviousShift,
  );
  const [previousShiftCountInput, setPreviousShiftCountInput] =
    useState("250.00");
  const [openingFundInput, setOpeningFundInput] = useState("0.00");

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
    return `${day}/${month}/${year}`;
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
    const safeCount = Number.isFinite(counted) && counted >= 0 ? counted : 250;
    const prevRecord: CashierClosingRecord = {
      id: `close-prev-${Date.now()}`,
      closedAt: "Ontem, 22:15",
      operatorName,
      initialFund: 100,
      totalSales: 150,
      expectedDrawer: 250,
      physicalCount: safeCount,
      difference: Number((safeCount - 250).toFixed(2)),
      movements: [
        {
          id: "m-prev-1",
          type: "sale",
          amount: 150,
          reason: "Vendas em dinheiro do turno anterior",
          createdAt: "Ontem, 18:30",
        },
      ],
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
    const createdAt = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}/${now.getFullYear()}, ${String(now.getHours()).padStart(
      2,
      "0",
    )}:${String(now.getMinutes()).padStart(2, "0")}`;

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
      operatorName,
      initialFund,
      totalSales: totalSoldInShift,
      expectedDrawer: expectedCashInDrawer,
      physicalCount: parsedCountedDrawer,
      difference: drawerDifference,
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
    <div className="mx-auto flex w-full max-w-[1250px] flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-black">
            Controle de Turno &amp; Fechamento de Caixa
          </h1>
          <p className="text-[13px] text-black/60">
            Abertura de caixa, sangrias de segurança, suprimento de troco e conciliação de valores.
          </p>
        </div>

        {isCashierOpen && (
          <button
            type="button"
            onClick={handleOpenCloseCashierModal}
            className="inline-flex h-[41px] items-center gap-2 rounded-[8px] bg-[#008f58] px-4 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
          >
            <Lock className="h-4 w-4" />
            <span>Fechar Caixa</span>
          </button>
        )}
      </header>

      {/* Closed Cashier Banner vs Open Cashier Dashboard */}
      {!isCashierOpen ? (
        <section className="flex min-h-[259px] flex-col items-center justify-center rounded-[15px] border border-[#ff8d28] bg-white px-6 py-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="mb-3.5 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#ff8d28]/25 text-[#ff8d28]">
            <Lock className="h-6 w-6 stroke-[2.2]" />
          </div>

          <h2 className="text-[20px] font-semibold text-black">
            O caixa está fechado no momento
          </h2>
          <p className="mt-1 max-w-md text-[12px] font-semibold text-[#ff8d28]">
            Abra o turno informando o fundo de troco inicial para registrar vendas.
          </p>

          <button
            type="button"
            onClick={handleOpenCashierModal}
            className="mt-5 inline-flex h-[41px] items-center justify-center rounded-[8px] bg-[#008f58] px-6 text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
          >
            Abrir Caixa Agora
          </button>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Active Shift Status Card */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-[#008f58] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3.5">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[8px] bg-[#008f58]/20 text-[#008f58]">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-[18px] font-semibold text-black">
                    Turno em Operação
                  </h2>
                  <span className="rounded-[8px] bg-[#008f58]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#008f58]">
                    Caixa Aberto
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] font-medium text-black/60">
                  Operador: {operatorName} &nbsp;&nbsp; Abertura às{" "}
                  {openedAtTime}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="block text-[12px] font-semibold text-black/55">
                Fundo de Troco Inicial
              </span>
              <span className="text-[20px] font-semibold text-black">
                {formatCurrency(initialFund)}
              </span>
            </div>
          </section>

          {/* 4 Payment Method Summary Cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Lucro Total / Vendas no Turno */}
            <article className="relative min-h-[121px] overflow-hidden rounded-[8px] bg-white p-4 pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
              <div className="absolute inset-y-0 left-0 w-[9px] bg-[#008f58]" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[12px] font-semibold text-black/60">
                    Lucro Total
                  </h3>
                  <p className="mt-1.5 text-[20px] font-semibold text-black">
                    {formatCurrency(totalSoldInShift)}
                  </p>
                </div>
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#34c759]/20 text-[#008f58]">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-black/45">
                Soma de todos os meios no turno
              </p>
            </article>

            {/* Vendas em Pix */}
            <article className="relative min-h-[121px] overflow-hidden rounded-[8px] bg-white p-4 pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
              <div className="absolute inset-y-0 left-0 w-[9px] bg-[#ff8d28]" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[12px] font-semibold text-black/60">
                    Vendas em Pix
                  </h3>
                  <p className="mt-1.5 text-[20px] font-semibold text-black">
                    {formatCurrency(shiftSales.pixSales)}
                  </p>
                </div>
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#ff8d28]/25 text-[#ff8d28]">
                  <QrCode className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-black/45">
                Cai direto na conta bancária
              </p>
            </article>

            {/* Cartões (Débito / Crédito) */}
            <article className="relative min-h-[121px] overflow-hidden rounded-[8px] bg-white p-4 pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
              <div className="absolute inset-y-0 left-0 w-[9px] bg-[#0088ff]" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[12px] font-semibold text-black/60">
                    Cartões (Débito / Crédito)
                  </h3>
                  <p className="mt-1.5 text-[20px] font-semibold text-black">
                    {formatCurrency(shiftSales.cardSales)}
                  </p>
                </div>
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#0088ff]/20 text-[#0088ff]">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-black/45">
                Conferir comprovantes da maquininha
              </p>
            </article>

            {/* Lançado na Caderneta */}
            <article className="relative min-h-[121px] overflow-hidden rounded-[8px] bg-white p-4 pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
              <div className="absolute inset-y-0 left-0 w-[9px] bg-[#ac7f5e]" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[12px] font-semibold text-black/60">
                    Lançado na Caderneta
                  </h3>
                  <p className="mt-1.5 text-[20px] font-semibold text-black">
                    {formatCurrency(shiftSales.bookletSales)}
                  </p>
                </div>
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-[#ac7f5e]/25 text-[#ac7f5e]">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-black/45">
                Vendas a prazo no turno
              </p>
            </article>
          </section>

          {/* Sangria & Suprimento Cards */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Sangrias Card */}
            <button
              type="button"
              onClick={() => handleOpenMovementModal("withdrawal")}
              className="flex min-h-[113px] flex-col justify-between rounded-[8px] border border-black/10 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:border-[#cb6f00]/50"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2 text-[#cb6f00]">
                  <ArrowDownCircle className="h-5 w-5" />
                  <span className="text-[14px] font-semibold">
                    Sangrias Registradas no Turno
                  </span>
                </div>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#cb6f00]/10 text-[#cb6f00]">
                  <Plus className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-3 flex w-full items-baseline justify-between">
                <span className="text-[22px] font-semibold text-[#cb6f00]">
                  -{formatCurrency(totalWithdrawals)}
                </span>
                <span className="text-[12px] font-medium text-black/45">
                  {withdrawals.length}{" "}
                  {withdrawals.length === 1 ? "movimentação" : "movimentações"}
                </span>
              </div>
            </button>

            {/* Suprimento Card */}
            <button
              type="button"
              onClick={() => handleOpenMovementModal("supply")}
              className="flex min-h-[113px] flex-col justify-between rounded-[8px] border border-black/10 bg-white p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:border-[#008f58]/50"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2 text-[#008f58]">
                  <ArrowUpCircle className="h-5 w-5" />
                  <span className="text-[14px] font-semibold">
                    Suprimento de Troco no Turno
                  </span>
                </div>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#008f58]/10 text-[#008f58]">
                  <Plus className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-3 flex w-full items-baseline justify-between">
                <span className="text-[22px] font-semibold text-[#008f58]">
                  +{formatCurrency(totalSupplies)}
                </span>
                <span className="text-[12px] font-medium text-black/45">
                  {supplies.length}{" "}
                  {supplies.length === 1 ? "movimentação" : "movimentações"}
                </span>
              </div>
            </button>
          </section>
        </div>
      )}

      {/* Closing History Table */}
      <section className="overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-black">
            Histórico de Fechamento de Caixa
          </h2>
          <span className="text-[12px] font-semibold text-black/60">
            {closingHistory.length} fechamento(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead>
              <tr className="border-b border-black/10 bg-[#f8f9fb] text-[12px] font-semibold text-black">
                <th className="px-5 py-3">Turno / Data</th>
                <th className="px-4 py-3">Operador(a)</th>
                <th className="px-4 py-3">Fundo Uni.</th>
                <th className="px-4 py-3">Vendas Totais</th>
                <th className="px-4 py-3">Gaveta Esperada</th>
                <th className="px-4 py-3">Contagem Física</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-[13px]">
              {closingHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-9 text-center text-[13px] text-black/50"
                  >
                    Nenhum fechamento de caixa registrado.
                  </td>
                </tr>
              ) : (
                closingHistory.map((record) => {
                  const isExact = Math.abs(record.difference) < 0.01;
                  const isShort = record.difference < -0.01;

                  return (
                    <tr key={record.id} className="hover:bg-black/[0.015]">
                      <td className="px-5 py-3 font-medium text-black/80">
                        {record.closedAt}
                      </td>
                      <td className="px-4 py-3 font-semibold text-black">
                        {record.operatorName}
                      </td>
                      <td className="px-4 py-3 text-black/75">
                        {formatCurrency(record.initialFund)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#008f58]">
                        {formatCurrency(record.totalSales)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-black">
                        {formatCurrency(record.expectedDrawer)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-black">
                        {formatCurrency(record.physicalCount)}
                      </td>
                      <td className="px-4 py-3">
                        {isExact ? (
                          <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#34c759]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#008f58]">
                            ✓ Caixa Exato
                          </span>
                        ) : isShort ? (
                          <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#ff383c]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#ff383c]">
                            Falta ({formatCurrency(record.difference)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#0088ff]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#0088ff]">
                            Sobra (+{formatCurrency(record.difference)})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingClosingMovements(record)}
                          aria-label={`Ver movimentações do turno ${record.closedAt}`}
                          title="Ver movimentações do caixa"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-black/60 transition-colors hover:bg-[#203f9f]/10 hover:text-[#203f9f]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-5 py-3 text-[12px] text-black/60">
          <span>0 de {closingHistory.length} linha(s) selecionadas</span>

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

      {/* Modal 1: Rotina Diária de Caixa (Etapa 1: Caixa Pendente / Etapa 2: Abertura Hoje) */}
      {isOpenModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={openDialogTitleId}
            className="w-full max-w-[445px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            {/* Clean White Header with Step Indicator */}
            <header className="flex items-start justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2
                  id={openDialogTitleId}
                  className="text-[20px] font-bold leading-tight text-black"
                >
                  Rotina Diária de Caixa
                </h2>
                <p className="mt-0.5 text-[12px] text-black/60">
                  {hasPendingPreviousShift
                    ? "Etapa 1 de 2: Fechamento pendente do turno anterior."
                    : "Etapa 2 de 2: Abertura de Caixa para Vendas."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      hasPendingPreviousShift
                        ? "bg-[#203f9f] text-white"
                        : "bg-[#008f58]/20 text-[#008f58]"
                    }`}
                  >
                    1
                  </span>
                  <span className="text-black/30">→</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      !hasPendingPreviousShift
                        ? "bg-[#203f9f] text-white"
                        : "bg-black/10 text-black/50"
                    }`}
                  >
                    2
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpenModalVisible(false)}
                  aria-label="Fechar modal"
                  className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {hasPendingPreviousShift ? (
              <form
                onSubmit={handleClosePreviousPendingShift}
                className="space-y-4 p-5"
              >
                <div className="flex items-start gap-2.5 rounded-[10px] border border-[#ff8d28] bg-[#ff8d28]/10 p-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#cb6f00]" />
                  <div>
                    <p className="text-[13px] font-bold text-[#cb6f00]">
                      Caixa do dia anterior ainda aberto!
                    </p>
                    <p className="text-[11px] text-black/70">
                      Confirme a contagem física do turno anterior antes de abrir o caixa de hoje.
                    </p>
                  </div>
                </div>

                <div className="rounded-[10px] border border-black/10 bg-[#f8f9fb] p-3 text-[12px] space-y-1.5">
                  <p className="font-bold text-black">
                    Resumo das Vendas do Turno Anterior
                  </p>
                  <div className="flex justify-between text-black/70">
                    <span>Fundo Inicial de Troco</span>
                    <span className="font-semibold">R$ 100,00</span>
                  </div>
                  <div className="flex justify-between text-black/70">
                    <span>Vendas em Dinheiro</span>
                    <span className="font-semibold">R$ 150,00</span>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-1.5 font-bold text-black">
                    <span>Saldo Esperado em Dinheiro</span>
                    <span>R$ 250,00</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-black">
                    Dinheiro Contado na Gaveta (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={previousShiftCountInput}
                    onChange={(e) => setPreviousShiftCountInput(e.target.value)}
                    className="h-[42px] w-full rounded-[8px] border border-black/25 bg-white px-3 text-[15px] font-bold text-black focus:border-[#008f58] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="h-[42px] w-full rounded-[8px] bg-[#008f58] text-[14px] font-semibold text-white hover:bg-[#007a4b]"
                >
                  Fechar Caixa do Dia Anterior
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleConfirmOpenCashier}
                className="space-y-4 p-5"
              >
                {/* Info Box */}
                <div className="rounded-[12px] border border-[#0088ff] bg-[#0088ff]/10 p-3.5">
                  <p className="text-[13px] font-semibold text-[#203f9f]">
                    Abertura de Caixa para Vendas de Hoje
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#203f9f]">
                    Informe o valor em dinheiro disponível na gaveta para troco no início deste turno.
                  </p>
                </div>

                {/* Date & Operator */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[10px] border border-black/10 bg-[#f0f2f5] p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-black/55">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Data de Abertura</span>
                    </div>
                    <p className="mt-1 text-[13px] font-semibold text-black">
                      {formattedTodayDate}
                    </p>
                  </div>

                  <div className="rounded-[10px] border border-black/10 bg-[#f0f2f5] p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-black/55">
                      <User className="h-3.5 w-3.5" />
                      <span>Operador responsável</span>
                    </div>
                    <p className="mt-1 text-[13px] font-semibold text-black">
                      {operatorName}
                    </p>
                  </div>
                </div>

                {/* Initial Fund Input */}
                <div>
                  <label className="mb-1.5 block text-[14px] font-semibold text-black">
                    Fundo Inicial de Troco:
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-black/45">
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
                      className="h-[46px] w-full rounded-[10px] border border-black/25 bg-white pl-11 pr-4 text-[18px] font-semibold text-black focus:border-[#008f58] focus:outline-none"
                    />
                  </div>

                  {/* Quick Amount Pills */}
                  <div className="mt-2.5 grid grid-cols-4 gap-2">
                    {QUICK_OPENING_AMOUNTS.map(({ amount, shortcut }) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setOpeningFundInput(amount.toFixed(2))}
                        className="flex h-[28px] items-center justify-center gap-1 rounded-[5px] border border-black/20 bg-[#f0f2f5] text-[11px] font-semibold text-black/75 transition-colors hover:bg-black/10"
                      >
                        <span>R$ {amount},00</span>
                        <span className="text-[10px] text-black/45">
                          [{shortcut}]
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-1">
                  <button
                    type="submit"
                    className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#008f58] text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
                  >
                    <span>Abrir Caixa e Iniciar Vendas</span>
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px]">
                      [Enter]
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpenModalVisible(false)}
                    className="flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-black/10 bg-[#f0f2f5] text-[13px] font-semibold text-black/65 transition-colors hover:bg-black/10"
                  >
                    <span>Cancelar e Retornar ao PDV</span>
                    <span className="text-[11px] text-black/45">[Esc]</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Registrar Sangria / Suprimento (Nodes 1164:2873 & 1165:3182) */}
      {activeMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={movementDialogTitleId}
            className="w-full max-w-[443px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2
                  id={movementDialogTitleId}
                  className="text-[18px] font-bold text-black"
                >
                  {activeMovementModal === "withdrawal"
                    ? "Registrar Sangria (Retirada)"
                    : "Registrar Suprimento (Entrada de Troco)"}
                </h2>
                <p className="mt-0.5 text-[12px] text-black/55">
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
                className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleConfirmMovement}
              className="space-y-4 px-5 py-4"
            >
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
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
                  className="h-[42px] w-full rounded-[8px] border border-black/25 bg-white px-3 text-[16px] font-semibold text-black focus:border-[#008f58] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  Descrição / Motivo *
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
                      ? "Ex: Depósito bancário, pagamento fornecedor..."
                      : "Ex: Troco adicional em moedas e notas..."
                  }
                  className="h-[42px] w-full rounded-[8px] border border-black/25 bg-white px-3 text-[13px] text-black placeholder:text-black/40 focus:border-[#008f58] focus:outline-none"
                />
              </div>

              {movementError && (
                <p className="text-[12px] font-medium text-[#ff383c]">
                  {movementError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMovementModal(null);
                    setMovementError(null);
                  }}
                  className="text-[14px] font-semibold text-black/55 hover:text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-[38px] rounded-[8px] bg-[#008f58] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#007a4b]"
                >
                  {activeMovementModal === "withdrawal"
                    ? "Confirmar Sangria"
                    : "Confirmar Suprimento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Fechamento de Caixa (Node 1146:2822) */}
      {isCloseModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={closeDialogTitleId}
            className="w-full max-w-[465px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2
                  id={closeDialogTitleId}
                  className="text-[20px] font-bold leading-tight text-black"
                >
                  Fechamento de Caixa
                </h2>
                <p className="mt-0.5 text-[12px] text-black/55">
                  Conferência da gaveta física e consolidação de todos os meios de pagamento do turno.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCloseModalVisible(false)}
                aria-label="Fechar modal"
                className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form
              onSubmit={handleConfirmCloseCashier}
              className="max-h-[82vh] space-y-3.5 overflow-y-auto px-5 py-4"
            >
              {/* Total Vendido Card */}
              <div className="flex items-center justify-between rounded-[10px] border border-black/15 bg-[#f8f9fb] px-4 py-3">
                <div>
                  <span className="block text-[12px] font-bold text-black/60">
                    Total Vendido
                  </span>
                  <span className="text-[11px] text-black/45">
                    {shiftSales.salesCount} venda(s) realizadas
                  </span>
                </div>
                <span className="text-[20px] font-bold text-[#008f58]">
                  {formatCurrency(totalSoldInShift)}
                </span>
              </div>

              {/* Payment Method Breakdown */}
              <div className="space-y-1.5 rounded-[10px] border border-black/10 bg-white p-3 text-[12px]">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-black/50">
                  Recebimento por Forma de Pagamento
                </p>
                <div className="flex justify-between text-black/75">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5 text-[#ff8d28]" />
                    Pix
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(shiftSales.pixSales)}
                  </span>
                </div>
                <div className="flex justify-between text-black/75">
                  <span className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-[#008f58]" />
                    Dinheiro
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(shiftSales.cashSales)}
                  </span>
                </div>
                <div className="flex justify-between text-black/75">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-[#0088ff]" />
                    Cartões (Débito / Crédito)
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(shiftSales.cardSales)}
                  </span>
                </div>
                <div className="flex justify-between text-black/75">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#ac7f5e]" />
                    Caderneta
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(shiftSales.bookletSales)}
                  </span>
                </div>
              </div>

              {/* Drawer Summary */}
              <div className="space-y-1.5 rounded-[10px] border border-black/15 bg-[#f8f9fb] p-3.5 text-[12px]">
                <div className="flex items-center justify-between text-black/65">
                  <span>Fundo de troco abertura</span>
                  <span className="font-semibold text-black">
                    {formatCurrency(initialFund)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-black/65">
                  <span>(+) Vendas em dinheiro</span>
                  <span className="font-semibold text-[#008f58]">
                    +{formatCurrency(shiftSales.cashSales)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-black/65">
                  <span>(+) Suprimentos</span>
                  <span className="font-semibold text-[#008f58]">
                    +{formatCurrency(totalSupplies)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-black/65">
                  <span>(-) Sangrias</span>
                  <span className="font-semibold text-[#cb6f00]">
                    -{formatCurrency(totalWithdrawals)}
                  </span>
                </div>

                <div className="my-2 border-t border-black/10" />

                <div className="flex items-center justify-between pt-0.5 text-[13px] font-bold text-black">
                  <span>Dinheiro esperado na gaveta</span>
                  <span className="text-[15px]">
                    {formatCurrency(expectedCashInDrawer)}
                  </span>
                </div>
              </div>

              {/* Physical Count Input */}
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-black">
                  Valor contado na gaveta (R$) *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-black/45">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label="Total contado na gaveta"
                    value={countedDrawerInput}
                    onChange={(event) =>
                      setCountedDrawerInput(event.target.value)
                    }
                    className="h-[44px] w-full rounded-[10px] border border-black/25 bg-white pl-10 pr-4 text-[17px] font-semibold text-black focus:border-[#008f58] focus:outline-none"
                  />
                </div>
              </div>

              {/* Reconciliation Status Alert */}
              {Math.abs(drawerDifference) < 0.01 ? (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-[#008f58] bg-[#34c759]/15 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#008f58]" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#008f58]">
                      Caixa Exato
                    </p>
                    <p className="text-[11px] font-medium text-[#008f58]/90">
                      A contagem confere perfeitamente com as movimentações.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-[#ff383c]/40 bg-[#ff383c]/10 p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#ff383c]" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#ff383c]">
                      {drawerDifference < 0
                        ? "Falta de caixa"
                        : "Sobra de caixa"}
                      : {formatCurrency(drawerDifference)}
                    </p>
                    <p className="text-[11px] font-medium text-[#ff383c]/90">
                      Confira novamente as notas e moedas antes de confirmar o encerramento.
                    </p>
                  </div>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-black/75">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  aria-label="Observações do fechamento"
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  placeholder="Alguma observação sobre o turno..."
                  className="h-[38px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] text-black focus:border-[#008f58] focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCloseModalVisible(false)}
                  className="text-[14px] font-semibold text-black/60 transition-colors hover:text-black"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="inline-flex h-[40px] items-center gap-2 rounded-[8px] bg-[#008f58] px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
                >
                  <Lock className="h-4 w-4" />
                  <span>Confirmar e Encerrar Caixa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Movimentações do Caixa (Node 1373:3645 - Triggered by Eye Icon) */}
      {viewingClosingMovements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={historyMovementsTitleId}
            className="w-full max-w-[445px] overflow-hidden rounded-[15px] bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-black/10 px-5 py-4">
              <div>
                <h2
                  id={historyMovementsTitleId}
                  className="text-[20px] font-bold text-black"
                >
                  Movimentações do Caixa
                </h2>
                <p className="text-[12px] text-black/55">
                  Vendas, sangrias e suprimentos registrados ({viewingClosingMovements.closedAt}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingClosingMovements(null)}
                aria-label="Fechar modal de movimentações"
                className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="max-h-[65vh] space-y-2.5 overflow-y-auto px-5 py-4">
              {viewingClosingMovements.movements.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-black/50">
                  Nenhuma sangria ou suprimento registrado neste turno.
                </p>
              ) : (
                viewingClosingMovements.movements.map((mov) => {
                  const isWithdrawal = mov.type === "withdrawal";
                  const isSupply = mov.type === "supply";
                  return (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between rounded-[10px] border border-black/10 bg-[#f8f9fb] p-3 text-[13px]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isWithdrawal
                                ? "bg-[#cb6f00]/15 text-[#cb6f00]"
                                : isSupply
                                  ? "bg-[#008f58]/15 text-[#008f58]"
                                  : "bg-[#203f9f]/15 text-[#203f9f]"
                            }`}
                          >
                            {isWithdrawal
                              ? "Sangria"
                              : isSupply
                                ? "Suprimento"
                                : "Venda"}
                          </span>
                          <span className="font-semibold text-black">
                            {mov.reason}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-black/50">
                          {mov.createdAt}
                        </p>
                      </div>

                      <span
                        className={`text-[14px] font-bold ${
                          isWithdrawal ? "text-[#cb6f00]" : "text-[#008f58]"
                        }`}
                      >
                        {isWithdrawal ? "-" : "+"}
                        {formatCurrency(mov.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <footer className="border-t border-black/10 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setViewingClosingMovements(null)}
                className="h-[40px] w-full rounded-[8px] bg-[#008f58] text-[14px] font-semibold text-white transition-colors hover:bg-[#007a4b]"
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
