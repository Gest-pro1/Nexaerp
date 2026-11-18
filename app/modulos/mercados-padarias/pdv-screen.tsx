"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  BanknotesIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  PrinterIcon,
  QrCodeIcon,
  ShoppingCartIcon,
  TrashIcon,
  ViewColumnsIcon,
  WalletIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  EMPTY_POS_CART,
  formatPosPaymentMethod,
  type PosCartItem,
  type PosCompletedSale,
  type PosPaymentLaunch,
  type PosPaymentMethod,
  type PosProduct,
} from "@/lib/market-pos";
import {
  EMPTY_BOOKLET_CUSTOMERS,
  type BookletCustomer,
} from "@/lib/market-booklet";
import {
  DEFAULT_STORE_SETTINGS,
  type StoreGeneralSettings,
} from "@/lib/market-settings";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}

const MODAL_PAYMENT_OPTIONS: {
  id: PosPaymentMethod;
  label: string;
  shortcut: string;
  icon: typeof BanknotesIcon;
}[] = [
  { id: "cash", label: "Dinheiro", shortcut: "F6", icon: CurrencyDollarIcon },
  { id: "pix", label: "Pix", shortcut: "F7", icon: QrCodeIcon },
  { id: "credit", label: "Crédito", shortcut: "F8", icon: CreditCardIcon },
  { id: "debit", label: "Débito", shortcut: "F9", icon: WalletIcon },
  { id: "booklet", label: "Caderneta", shortcut: "F10", icon: BookOpenIcon },
];

const FOOTER_PAYMENT_OPTIONS: {
  id: PosPaymentMethod;
  label: string;
  shortcut: string;
  icon: typeof BanknotesIcon;
}[] = [
  { id: "cash", label: "Dinheiro", shortcut: "F6", icon: CurrencyDollarIcon },
  { id: "pix", label: "Pix", shortcut: "F7", icon: QrCodeIcon },
  { id: "credit", label: "Crédito", shortcut: "F8", icon: CreditCardIcon },
  { id: "booklet", label: "Caderneta", shortcut: "F9", icon: BookOpenIcon },
];

export interface PdvScreenProps {
  operatorName?: string;
  terminalName?: string;
  isCashierOpen?: boolean;
  initialCatalog?: PosProduct[];
  catalog?: PosProduct[];
  initialCart?: PosCartItem[];
  bookletCustomers?: BookletCustomer[];
  storeSettings?: StoreGeneralSettings;
  onRequestOpenCashier?: () => void;
  onRequestCloseCashier?: () => void;
  onFinishSale?: (payload: {
    items: PosCartItem[];
    paymentMethod: PosPaymentMethod;
    payments: PosPaymentLaunch[];
    total: number;
    isNonFiscal: boolean;
    completedSale: PosCompletedSale;
  }) => void;
}

export default function PdvScreen({
  operatorName = "João",
  terminalName = "Caixa 01",
  isCashierOpen = true,
  initialCatalog = [],
  catalog: controlledCatalog,
  initialCart = EMPTY_POS_CART,
  bookletCustomers = EMPTY_BOOKLET_CUSTOMERS,
  storeSettings = DEFAULT_STORE_SETTINGS,
  onRequestOpenCashier,
  onRequestCloseCashier,
  onFinishSale,
}: PdvScreenProps) {
  const catalog = controlledCatalog ?? initialCatalog;

  const [searchAndBarcodeQuery, setSearchAndBarcodeQuery] = useState("");
  const [inputQuantity, setInputQuantity] = useState(1);

  const [cart, setCart] = useState<PosCartItem[]>(initialCart);
  const [lastScannedItem, setLastScannedItem] = useState<{
    product: PosProduct;
    quantity: number;
  } | null>(null);

  const [selectedPayment, setSelectedPayment] =
    useState<PosPaymentMethod>("cash");

  // Payment Modal State (Pagamento da Venda)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNonFiscal, setIsNonFiscal] = useState(false);
  const [launchedPayments, setLaunchedPayments] = useState<PosPaymentLaunch[]>(
    [],
  );
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [cashReceivedInput, setCashReceivedInput] = useState("");
  const [creditInstallments, setCreditInstallments] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Completed Sale Receipt Modal State
  const [completedSaleReceipt, setCompletedSaleReceipt] =
    useState<PosCompletedSale | null>(null);

  const paymentModalTitleId = useId();
  const receiptModalTitleId = useId();

  const activeCatalog = useMemo(
    () => catalog.filter((item) => item.active !== false),
    [catalog],
  );

  const filteredProducts = useMemo(() => {
    const q = searchAndBarcodeQuery.trim().toLowerCase();
    if (!q) return activeCatalog;
    return activeCatalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q) ||
        (item.code ?? "").toLowerCase().includes(q) ||
        (item.category ?? "").toLowerCase().includes(q),
    );
  }, [activeCatalog, searchAndBarcodeQuery]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const subtotalAmount = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.product.unitPrice * item.quantity,
        0,
      ),
    [cart],
  );

  const discountTotalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.discount, 0),
    [cart],
  );

  const totalAmount = useMemo(
    () =>
      Math.max(0, Number((subtotalAmount - discountTotalAmount).toFixed(2))),
    [subtotalAmount, discountTotalAmount],
  );

  const paidSoFar = useMemo(
    () =>
      Number(
        launchedPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2),
      ),
    [launchedPayments],
  );

  const remainingAmount = useMemo(
    () => Math.max(0, Number((totalAmount - paidSoFar).toFixed(2))),
    [totalAmount, paidSoFar],
  );

  const parsedCurrentPaymentAmount = useMemo(() => {
    const val = Number(paymentAmountInput.replace(",", "."));
    return Number.isFinite(val) && val > 0 ? Number(val.toFixed(2)) : 0;
  }, [paymentAmountInput]);

  const parsedCashReceived = useMemo(() => {
    const val = Number(cashReceivedInput.replace(",", "."));
    return Number.isFinite(val) && val > 0 ? Number(val.toFixed(2)) : 0;
  }, [cashReceivedInput]);

  const changeAmount = useMemo(() => {
    if (selectedPayment !== "cash") return 0;
    const effectiveCashToPay = Math.min(
      parsedCurrentPaymentAmount,
      remainingAmount,
    );
    return Math.max(
      0,
      Number((parsedCashReceived - effectiveCashToPay).toFixed(2)),
    );
  }, [
    parsedCashReceived,
    parsedCurrentPaymentAmount,
    remainingAmount,
    selectedPayment,
  ]);

  const selectedCustomer = useMemo(
    () =>
      bookletCustomers.find((c) => c.id === selectedCustomerId) ??
      bookletCustomers[0] ??
      null,
    [bookletCustomers, selectedCustomerId],
  );

  const filteredBookletCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return bookletCustomers;
    return bookletCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cpf.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [bookletCustomers, customerSearchQuery]);

  const handleAddProductToCart = (product: PosProduct, qty = 1) => {
    const safeQty = Math.max(1, qty);
    setLastScannedItem({ product, quantity: safeQty });
    setCart((current) => {
      const existingIndex = current.findIndex(
        (item) => item.product.id === product.id,
      );
      if (existingIndex === -1) {
        return [...current, { product, quantity: safeQty, discount: 0 }];
      }
      return current.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + safeQty }
          : item,
      );
    });
  };

  const handleUndoLastScanned = () => {
    if (!lastScannedItem) return;
    const targetId = lastScannedItem.product.id;
    const removeQty = lastScannedItem.quantity;

    setCart((current) =>
      current
        .map((item) =>
          item.product.id === targetId
            ? { ...item, quantity: item.quantity - removeQty }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
    setLastScannedItem(null);
  };

  const handleBarcodeOrSearchEnter = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    const matchedProduct =
      activeCatalog.find(
        (product) =>
          product.barcode === trimmed ||
          product.code === trimmed ||
          product.name.toLowerCase() === trimmed.toLowerCase(),
      ) ?? filteredProducts[0];

    if (!matchedProduct) return;

    handleAddProductToCart(matchedProduct, inputQuantity);
    setSearchAndBarcodeQuery("");
    setInputQuantity(1);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleOpenPaymentModal = (initialMethod?: PosPaymentMethod) => {
    if (cart.length === 0) return;
    const method = initialMethod ?? selectedPayment;
    setSelectedPayment(method);
    setLaunchedPayments([]);
    const formattedTotal = totalAmount.toFixed(2).replace(".", ",");
    setPaymentAmountInput(formattedTotal);
    setCashReceivedInput(formattedTotal);
    setCreditInstallments(1);
    setSelectedCustomerId(bookletCustomers[0]?.id ?? "");
    setIsCustomerDropdownOpen(false);
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handleSelectMethodInsideModal = (method: PosPaymentMethod) => {
    setSelectedPayment(method);
    setPaymentError(null);
    const formattedRem = remainingAmount.toFixed(2).replace(".", ",");
    setPaymentAmountInput(formattedRem);
    if (method === "cash") {
      setCashReceivedInput(formattedRem);
    }
  };

  const handleRemoveLaunchedPayment = (launchId: string) => {
    const nextPayments = launchedPayments.filter((p) => p.id !== launchId);
    setLaunchedPayments(nextPayments);
    const nextPaid = nextPayments.reduce((s, p) => s + p.amount, 0);
    const nextRem = Math.max(0, Number((totalAmount - nextPaid).toFixed(2)));
    const formattedRem = nextRem.toFixed(2).replace(".", ",");
    setPaymentAmountInput(formattedRem);
    setCashReceivedInput(formattedRem);
  };

  const handleConfirmOrLaunchPayment = () => {
    setPaymentError(null);

    if (remainingAmount <= 0) {
      return;
    }

    const amountToApply = parsedCurrentPaymentAmount;
    if (amountToApply <= 0) {
      setPaymentError("Informe um valor válido maior que zero.");
      return;
    }

    if (amountToApply > remainingAmount + 0.01) {
      setPaymentError(
        "O valor do pagamento não pode exceder o saldo restante.",
      );
      return;
    }

    if (selectedPayment === "cash" && parsedCashReceived < amountToApply) {
      setPaymentError(
        "O valor recebido em dinheiro é menor que o valor lançado.",
      );
      return;
    }

    if (selectedPayment === "booklet") {
      if (!selectedCustomer) {
        setPaymentError("Selecione um cliente da caderneta para continuar.");
        return;
      }
      const availableCredit = Math.max(
        0,
        selectedCustomer.creditLimit - selectedCustomer.balance,
      );
      if (amountToApply > availableCredit + 0.01) {
        setPaymentError(
          `Limite insuficiente na caderneta de ${selectedCustomer.name} (Disponível: ${formatCurrency(availableCredit)}).`,
        );
        return;
      }
    }

    const newLaunch: PosPaymentLaunch = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      method: selectedPayment,
      amount: Math.min(amountToApply, remainingAmount),
      installments:
        selectedPayment === "credit" ? creditInstallments : undefined,
      receivedAmount:
        selectedPayment === "cash" ? parsedCashReceived : undefined,
      changeAmount: selectedPayment === "cash" ? changeAmount : undefined,
      customerId:
        selectedPayment === "booklet" ? selectedCustomer?.id : undefined,
      customerName:
        selectedPayment === "booklet" ? selectedCustomer?.name : undefined,
    };

    const updatedLaunches = [...launchedPayments, newLaunch];
    const nextPaid = Number(
      updatedLaunches.reduce((s, p) => s + p.amount, 0).toFixed(2),
    );
    const nextRemaining = Math.max(
      0,
      Number((totalAmount - nextPaid).toFixed(2)),
    );

    if (nextRemaining > 0.009) {
      setLaunchedPayments(updatedLaunches);
      const formattedRem = nextRemaining.toFixed(2).replace(".", ",");
      setPaymentAmountInput(formattedRem);
      setCashReceivedInput(formattedRem);
      return;
    }

    const saleNumber = String(Math.floor(1000 + Math.random() * 9000));
    const completedSale: PosCompletedSale = {
      id: `sale-${Date.now()}`,
      saleCode: `#VD-${saleNumber}`,
      dateTime: new Date().toLocaleString("pt-BR"),
      operatorName,
      terminalName,
      isNonFiscal,
      items: [...cart],
      subtotal: subtotalAmount,
      discountTotal: discountTotalAmount,
      total: totalAmount,
      payments: updatedLaunches,
      protocolNumber: `453851823165161321305165135135165151651651515`,
    };

    onFinishSale?.({
      items: cart,
      paymentMethod: updatedLaunches[0]?.method ?? selectedPayment,
      payments: updatedLaunches,
      total: totalAmount,
      isNonFiscal,
      completedSale,
    });

    setCart([]);
    setLastScannedItem(null);
    setIsPaymentModalOpen(false);
    setLaunchedPayments([]);
    setCompletedSaleReceipt(completedSale);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setIsNonFiscal((curr) => !curr);
        return;
      }

      if (event.key === "Escape") {
        if (completedSaleReceipt) {
          setCompletedSaleReceipt(null);
          return;
        }
        if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
          setPaymentError(null);
          return;
        }
      }

      if (event.key === "F6") {
        event.preventDefault();
        if (isPaymentModalOpen) handleSelectMethodInsideModal("cash");
        else setSelectedPayment("cash");
      } else if (event.key === "F7") {
        event.preventDefault();
        if (isPaymentModalOpen) handleSelectMethodInsideModal("pix");
        else setSelectedPayment("pix");
      } else if (event.key === "F8") {
        event.preventDefault();
        if (isPaymentModalOpen) handleSelectMethodInsideModal("credit");
        else setSelectedPayment("credit");
      } else if (event.key === "F9") {
        event.preventDefault();
        if (isPaymentModalOpen) handleSelectMethodInsideModal("debit");
        else setSelectedPayment("booklet");
      } else if (event.key === "F10") {
        event.preventDefault();
        if (isPaymentModalOpen) handleSelectMethodInsideModal("booklet");
        else setSelectedPayment("booklet");
      } else if (event.key === "F5") {
        event.preventDefault();
        if (!isPaymentModalOpen && cart.length > 0) {
          handleOpenPaymentModal();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const isPartialLaunch =
    parsedCurrentPaymentAmount > 0 &&
    parsedCurrentPaymentAmount < remainingAmount - 0.009;

  return (
    <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_375px]">
      {/* Left Area: Status Card, Scanner Banner, Search Bar & Product Grid */}
      <div className="flex flex-col gap-3">
        {/* Card 1: Cashier Status Header Card */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  isCashierOpen ? "bg-[#00a86b]" : "bg-[#ff8d28]"
                }`}
              />
              <strong className="font-bold text-slate-900">
                {isCashierOpen ? "Caixa Aberto Hoje" : "Caixa Fechado"}
              </strong>
              <span>•</span>
              <span>Aberto às 07:55 ({operatorName})</span>
              <span>•</span>
              <strong className="font-semibold text-slate-800">
                Fundo: R$ 100,00
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  isCashierOpen
                    ? onRequestCloseCashier?.()
                    : onRequestOpenCashier?.()
                }
                className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <LockClosedIcon className="h-3 w-3 text-slate-600" />
                <span>{isCashierOpen ? "Fechar Caixa" : "Abrir Caixa"}</span>
                <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-bold text-slate-500">
                  F4
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof document !== "undefined") {
                    if (!document.fullscreenElement) {
                      document.documentElement
                        .requestFullscreen?.()
                        .catch(() => {});
                    } else {
                      document.exitFullscreen?.().catch(() => {});
                    }
                  }
                }}
                className="inline-flex h-[26px] items-center gap-1.5 rounded-full bg-[#374151] px-3 text-[10px] font-semibold text-white transition-colors hover:bg-slate-700"
              >
                <ArrowsPointingOutIcon className="h-3 w-3" />
                <span>Modo Terminal</span>
                <kbd className="rounded bg-white/20 px-1 py-0.5 text-[9px] font-bold text-white">
                  F11
                </kbd>
              </button>
            </div>
          </div>

          {lastScannedItem && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#008f58] px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-xs">
              <CheckCircleIcon className="h-4 w-4" />
              <span>
                + {lastScannedItem.quantity}x {lastScannedItem.product.name}
              </span>
            </div>
          )}
        </section>

        {/* Card 2: Scanner Status Banner (AGUARDANDO LEITURA vs ÚLTIMO ITEM BIPADO) */}
        {!lastScannedItem ? (
          <section className="flex items-center gap-3 rounded-[10px] border border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <ViewColumnsIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                AGUARDANDO LEITURA
              </span>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Bipe o código de barras ou use a busca para lançar itens no cupom.
              </p>
            </div>
          </section>
        ) : (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#10b981] bg-[#ecfdf5] px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#008f58] text-white">
                <ViewColumnsIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#008f58] px-2.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    ÚLTIMO ITEM BIPADO
                  </span>
                  <span className="text-[11px] font-semibold text-[#008f58]">
                    EAN: {lastScannedItem.product.barcode}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-800">
                  {lastScannedItem.product.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] font-semibold text-[#008f58]">
                  {lastScannedItem.quantity}{" "}
                  {lastScannedItem.product.unit ?? "UN"} x{" "}
                  {formatCurrency(lastScannedItem.product.unitPrice)}
                </span>
                <strong className="text-[13px] font-bold text-slate-900">
                  {formatCurrency(
                    lastScannedItem.product.unitPrice *
                      lastScannedItem.quantity,
                  )}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleUndoLastScanned}
                className="inline-flex h-7 items-center gap-1 rounded-full bg-[#e11d48] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-rose-700"
              >
                <ArrowUturnLeftIcon className="h-3 w-3" />
                <span>Desfazer</span>
              </button>
            </div>
          </section>
        )}

        {/* Card 3: QTD Multiplier & Search / Barcode Input */}
        <section className="flex flex-col gap-3 rounded-[10px] border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center">
          <div className="flex h-[40px] shrink-0 items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-[#f3f4f6] px-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-[#2563eb]">#</span>
              <span className="text-[12px] font-bold text-slate-800">QTD:</span>
              <kbd className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                ALT+Q
              </kbd>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                onClick={() => setInputQuantity((q) => Math.max(1, q - 1))}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-2xs hover:bg-slate-100"
              >
                <MinusIcon className="h-3 w-3" />
              </button>
              <span className="flex h-6 min-w-[30px] items-center justify-center rounded-full border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-800">
                {inputQuantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={() => setInputQuantity((q) => q + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-2xs hover:bg-slate-100"
              >
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchAndBarcodeQuery}
              onChange={(event) => setSearchAndBarcodeQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleBarcodeOrSearchEnter(searchAndBarcodeQuery);
                }
              }}
              placeholder="Digite o código de barras ou busque o produto..."
              aria-label="Código de barras ou busca de produto"
              className="h-[40px] w-full rounded-[8px] border border-slate-200 bg-[#f3f4f6] pl-10 pr-4 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-[#203f9f] focus:bg-white focus:outline-none"
            />
          </div>
        </section>

        {/* Product Grid (3 Columns - Identical to Figma) */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleAddProductToCart(product, inputQuantity)}
              className="group flex flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-[#203f9f] hover:shadow-md"
            >
              <div>
                <span className="inline-block rounded bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {product.category ?? "Bebidas"}
                </span>

                <h3 className="mt-1.5 truncate text-[12px] font-bold text-slate-800 group-hover:text-[#203f9f]">
                  {product.name}
                </h3>

                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                  <ViewColumnsIcon className="h-3 w-3 shrink-0" />
                  <span>{product.barcode}</span>
                </div>
              </div>

              <div className="mt-2.5 border-t border-slate-100 pt-2">
                <span className="block text-[9px] text-slate-400">Preço</span>
                <span className="text-[12px] font-bold text-[#203f9f]">
                  {formatCurrency(product.unitPrice)}
                </span>
              </div>
            </button>
          ))}
        </section>
      </div>

      {/* Right Panel: Cupom Fiscal */}
      <aside className="flex min-h-[740px] flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Royal Blue Header */}
        <header className="flex items-center justify-between bg-[#153488] px-5 py-4 text-white">
          <div>
            <h2 className="text-[20px] font-bold leading-tight">
              Cupom Fiscal
            </h2>
            <p className="mt-0.5 text-[11px] text-blue-200">
              {terminalName} - Operador {operatorName}
            </p>
          </div>

          <span className="sr-only">
            {totalItems} {totalItems === 1 ? "Item" : "Itens"}
          </span>
        </header>

        {/* Cart Items Area */}
        <div className="flex flex-1 flex-col justify-center px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center">
              <ShoppingCartIcon className="mb-3 h-14 w-14 stroke-[1.2] text-slate-300" />
              <p className="text-[18px] font-bold text-slate-300">
                Cupom Fiscal
              </p>
              <p className="mt-1 max-w-[230px] text-[11px] leading-relaxed text-slate-300">
                Escaneie códigos de barras ou clique nos produtos no painel para
                iniciar as vendas!
              </p>
            </div>
          ) : (
            <ul className="w-full flex-1 divide-y divide-slate-100 self-start overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const lineTotal = Math.max(
                  0,
                  item.product.unitPrice * item.quantity - item.discount,
                );
                return (
                  <li key={item.product.id} className="py-3 first:pt-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12px] font-bold text-slate-800">
                        <span className="mr-1 text-[10px] font-semibold text-slate-400">
                          #{idx + 1}
                        </span>
                        {item.product.name}
                      </p>
                      <span className="shrink-0 text-[12px] font-bold text-slate-900">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {item.quantity} {item.product.unit ?? "UN"} x{" "}
                      {formatCurrency(item.product.unitPrice)}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        EAN: {item.product.barcode}
                      </span>

                      <div className="inline-flex h-6 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartQuantity(item.product.id, -1)
                          }
                          aria-label={`Diminuir ${item.product.name}`}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          <MinusIcon className="h-3 w-3" />
                        </button>
                        <span className="min-w-[16px] text-center text-[11px] font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartQuantity(item.product.id, 1)
                          }
                          aria-label={`Aumentar ${item.product.name}`}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          <PlusIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Totals & Payment Action */}
        <footer className="border-t border-slate-200 bg-white px-5 py-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
              TOTAL A PAGAR
            </span>
            <span className="text-[22px] font-bold leading-none text-[#153488]">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {cart.length === 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                FORMA DE PAGAMENTO
              </p>
              <div className="grid grid-cols-4 gap-2">
                {FOOTER_PAYMENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedPayment === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedPayment(option.id)}
                      className={`relative flex h-[52px] flex-col items-center justify-center rounded-[8px] border px-1 text-center transition-colors ${
                        isSelected
                          ? "border-[#153488] bg-blue-50/50 text-[#153488]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="absolute right-1.5 top-1 text-[8px] font-semibold text-slate-400">
                        {option.shortcut}
                      </span>
                      <Icon className="mb-1 h-4 w-4 text-[#153488]" />
                      <span className="text-[10px] font-semibold leading-tight text-[#153488]">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => handleOpenPaymentModal()}
            className="mt-4 flex h-[44px] w-full items-center justify-center rounded-[8px] bg-[#203f9f] text-[15px] font-semibold text-white shadow-xs transition-colors hover:bg-[#153488] disabled:cursor-not-allowed disabled:bg-[#4f67b0]"
          >
            Finalizar Venda (F5)
          </button>
        </footer>
      </aside>

      {/* Modal: Pagamento da Venda (Identical to Frames 1618873491..1618873497) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={paymentModalTitleId}
            className="w-full max-w-[692px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#008f58] text-[#008f58]">
                  <span className="text-[22px] font-bold">$</span>
                </div>
                <div>
                  <h2
                    id={paymentModalTitleId}
                    className="text-[19px] font-bold leading-tight text-slate-900"
                  >
                    Pagamento da Venda
                  </h2>
                  <p className="text-[12px] text-slate-400">
                    Selecione a forma e confirme o recebimento
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isNonFiscal}
                    onChange={(e) => setIsNonFiscal(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-[#ff6b00]"
                  />
                  <DocumentTextIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cupom Não Fiscal</span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    Alt+F
                  </kbd>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentError(null);
                  }}
                  aria-label="Fechar modal de pagamento"
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Modal Body: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
              {/* Left Column: Summary, Lançados & Forma de Pagamento */}
              <div className="border-b border-slate-200 bg-white p-4 md:border-b-0 md:border-r">
                <div className="rounded-[10px] border border-slate-200/80 bg-[#f8fafc] p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                    <span>Total da Venda</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  {paidSoFar > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-[#008f58]">
                      <span>Já Pago</span>
                      <span>-{formatCurrency(paidSoFar)}</span>
                    </div>
                  )}

                  <div className="my-2.5 border-t border-slate-200" />

                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] font-bold text-slate-800">
                      {paidSoFar > 0 ? "Restante" : "Total da Venda"}
                    </span>
                    <span className="text-[16px] font-bold text-slate-900">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Lançados */}
                {launchedPayments.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[11px] font-semibold text-slate-600">
                      Lançados ({launchedPayments.length})
                    </p>
                    <ul className="space-y-1.5">
                      {launchedPayments.map((launch) => (
                        <li
                          key={launch.id}
                          className="flex h-[28px] items-center justify-between rounded-[6px] border border-slate-200 bg-white px-2.5 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <CheckCircleIcon className="h-3.5 w-3.5 text-[#008f58]" />
                            <span>{formatPosPaymentMethod(launch.method)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {formatCurrency(launch.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveLaunchedPayment(launch.id)
                              }
                              aria-label={`Remover pagamento ${formatPosPaymentMethod(launch.method)}`}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Forma de Pagamento Selector */}
                <div className="mt-3.5">
                  <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
                    Forma de Pagamento
                  </p>
                  <div className="space-y-1.5">
                    {MODAL_PAYMENT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const active = selectedPayment === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            handleSelectMethodInsideModal(option.id)
                          }
                          className={`flex h-[30px] w-full items-center justify-between rounded-[6px] px-2.5 text-[11px] font-semibold transition-colors ${
                            active
                              ? "bg-[#008f7a] text-white"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            <span>{option.label}</span>
                          </span>
                          <span
                            className={`text-[9px] font-bold ${
                              active ? "text-white/90" : "text-slate-400"
                            }`}
                          >
                            {option.shortcut}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Payment Content */}
              <div className="flex flex-col justify-between bg-[#fbfcfd] p-5">
                <div className="space-y-4">
                  {/* DINHEIRO */}
                  {selectedPayment === "cash" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                          Valor em Dinheiro
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="text"
                            aria-label="Valor em Dinheiro"
                            value={paymentAmountInput}
                            onChange={(e) => {
                              setPaymentAmountInput(e.target.value);
                              setCashReceivedInput(e.target.value);
                            }}
                            className="h-[46px] w-full rounded-[8px] border border-[#2563eb] bg-white pl-10 pr-4 text-[18px] font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                          Valor Recebido
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="text"
                            aria-label="Valor Recebido"
                            value={cashReceivedInput}
                            onChange={(e) =>
                              setCashReceivedInput(e.target.value)
                            }
                            className="h-[46px] w-full rounded-[8px] border border-slate-200 bg-white pl-10 pr-4 text-[18px] font-bold text-slate-800 focus:border-[#2563eb] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Troco Box */}
                      <div className="flex items-center justify-between rounded-[8px] border border-[#00a86b]/40 bg-[#e6f9f1] p-3.5">
                        <div>
                          <p className="text-[12px] font-bold text-[#008f58]">
                            Troco
                          </p>
                          <p className="mt-1 text-[20px] font-bold leading-none text-[#008f58]">
                            {formatCurrency(changeAmount)}
                          </p>
                        </div>

                        <div className="text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#008f58] px-3 py-1 text-[10px] font-semibold text-white">
                            <LockOpenIcon className="h-3.5 w-3.5" />
                            Disparo Automático
                          </span>
                          <p className="mt-1 text-[9px] text-[#008f58]">
                            Abre gaveta física na conclusão
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* PIX */}
                  {selectedPayment === "pix" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                          Valor em Pix
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="text"
                            aria-label="Valor em Pix"
                            value={paymentAmountInput}
                            onChange={(e) =>
                              setPaymentAmountInput(e.target.value)
                            }
                            className="h-[46px] w-full rounded-[8px] border border-[#2563eb] bg-white pl-10 pr-4 text-[18px] font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] p-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#e6f9f1] text-[#008f58]">
                          <QrCodeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-800">
                            Recebimento em Pix
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pressione Enter para confirmar{" "}
                            {formatCurrency(parsedCurrentPaymentAmount)} e
                            concluir a venda.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 rounded-[8px] bg-[#eff6ff] p-3 text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-4 w-4 text-[#2563eb]" />
                          <span>Pagamento sendo processado...</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-4 w-4 text-[#2563eb]" />
                          <span>Pagamento confirmado com sucesso!</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CRÉDITO */}
                  {selectedPayment === "credit" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                          Valor em Cartão de Crédito
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="text"
                            aria-label="Valor em Cartão de Crédito"
                            value={paymentAmountInput}
                            onChange={(e) =>
                              setPaymentAmountInput(e.target.value)
                            }
                            className="h-[46px] w-full rounded-[8px] border border-[#2563eb] bg-white pl-10 pr-4 text-[18px] font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="text-[12px] font-bold text-slate-700">
                            Parcelamento
                          </label>
                          <span className="text-[10px] text-slate-400">
                            Use ↑↓
                          </span>
                        </div>
                        <select
                          aria-label="Parcelamento"
                          value={creditInstallments}
                          onChange={(e) =>
                            setCreditInstallments(Number(e.target.value))
                          }
                          className="h-[44px] w-full rounded-[8px] border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-800 focus:border-[#2563eb] focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => {
                            const perInstallment =
                              parsedCurrentPaymentAmount > 0
                                ? parsedCurrentPaymentAmount / n
                                : 0;
                            return (
                              <option key={n} value={n}>
                                {n}x de {formatCurrency(perInstallment)}{" "}
                                {n === 1 ? "À vista" : "Sem juros"}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-1.5 rounded-[8px] bg-[#eff6ff] p-3 text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-4 w-4 text-[#2563eb]" />
                          <span>Pagamento sendo processado...</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-4 w-4 text-[#2563eb]" />
                          <span>Pagamento confirmado com sucesso!</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* DÉBITO */}
                  {selectedPayment === "debit" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                          Valor em Cartão de Débito
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="text"
                            aria-label="Valor em Cartão de Débito"
                            value={paymentAmountInput}
                            onChange={(e) =>
                              setPaymentAmountInput(e.target.value)
                            }
                            className="h-[46px] w-full rounded-[8px] border border-[#2563eb] bg-white pl-10 pr-4 text-[18px] font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-[8px] border border-slate-200 bg-[#f8fafc] p-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#e0f2fe] text-[#0284c7]">
                          <CreditCardIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-slate-800">
                            Cartão de Débito à Vista
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Pressione Enter para abater{" "}
                            {formatCurrency(parsedCurrentPaymentAmount)} do
                            saldo e escolher a próxima forma.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 rounded-[8px] bg-[#eff6ff] p-3 text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-4 w-4 text-[#2563eb]" />
                          <span>Pagamento sendo processado...</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-4 w-4 text-[#2563eb]" />
                          <span>Pagamento confirmado com sucesso!</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CADERNETA */}
                  {selectedPayment === "booklet" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                          Valor em Caderneta
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">
                            R$
                          </span>
                          <input
                            type="text"
                            aria-label="Valor em Caderneta"
                            value={paymentAmountInput}
                            onChange={(e) =>
                              setPaymentAmountInput(e.target.value)
                            }
                            className="h-[46px] w-full rounded-[8px] border border-[#2563eb] bg-white pl-10 pr-4 text-[18px] font-bold text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Teal Customer Box (Identical to Frame 1618873496) */}
                      <div className="relative rounded-[8px] bg-[#008f7a] p-3.5 text-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="block text-[11px] font-bold text-white/90">
                              Cliente
                            </span>
                            <strong className="text-[12px] font-semibold text-white">
                              {selectedCustomer?.name ??
                                "Nenhum cliente selecionado"}
                            </strong>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setIsCustomerDropdownOpen((prev) => !prev)
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/95 hover:underline"
                          >
                            <span>Selecionar</span>
                            <ChevronDownIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/20 pt-2.5 text-[10px]">
                          <div>
                            <span className="block text-white/80">
                              Dívida Atual
                            </span>
                            <strong className="font-bold text-white">
                              {formatCurrency(selectedCustomer?.balance ?? 0)}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-white/80">
                              Nova Dívida
                            </span>
                            <strong className="font-bold text-white">
                              {formatCurrency(
                                (selectedCustomer?.balance ?? 0) +
                                  parsedCurrentPaymentAmount,
                              )}
                            </strong>
                          </div>
                          <div className="text-right">
                            <span className="block text-white/80">
                              Crédito Restante
                            </span>
                            <strong className="font-bold text-white">
                              {formatCurrency(
                                Math.max(
                                  0,
                                  (selectedCustomer?.creditLimit ?? 0) -
                                    ((selectedCustomer?.balance ?? 0) +
                                      parsedCurrentPaymentAmount),
                                ),
                              )}
                            </strong>
                          </div>
                        </div>

                        {/* Searchable Customer Dropdown */}
                        {isCustomerDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-slate-200 bg-white text-slate-800 shadow-xl">
                            <div className="border-b border-slate-100 p-2">
                              <input
                                type="text"
                                value={customerSearchQuery}
                                onChange={(e) =>
                                  setCustomerSearchQuery(e.target.value)
                                }
                                placeholder="Buscar cliente por nome, CPF ou telefone..."
                                className="h-8 w-full rounded border border-slate-200 px-2.5 text-[11px] text-slate-800 outline-none focus:border-[#008f7a]"
                              />
                            </div>
                            <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto text-[11px]">
                              {filteredBookletCustomers.map((c) => (
                                <li key={c.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomerId(c.id);
                                      setIsCustomerDropdownOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-amber-50/60"
                                  >
                                    <span className="font-semibold text-slate-800">
                                      {c.name}
                                    </span>
                                    <span className="font-mono text-slate-500">
                                      Dívida: {formatCurrency(c.balance)}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 rounded-[8px] bg-[#eff6ff] p-3 text-[11px]">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-3.5 w-3.5 text-[#2563eb]" />
                          <span>Pagamento sendo processado...</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-3.5 w-3.5 text-[#2563eb]" />
                          <span>Pagamento confirmado com sucesso!</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <CheckCircleIcon className="h-3.5 w-3.5 text-[#2563eb]" />
                          <span>Venda concluída com sucesso!</span>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <ArrowPathIcon className="h-3.5 w-3.5 text-[#2563eb]" />
                          <span>Emitindo comprovante...</span>
                        </div>
                      </div>
                    </>
                  )}

                  {paymentError && (
                    <p className="rounded-[8px] bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
                      {paymentError}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex items-center justify-end gap-4 border-t border-slate-200 pt-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      setPaymentError(null);
                    }}
                    className="text-[12px] font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmOrLaunchPayment}
                    className="inline-flex h-[36px] items-center gap-2 rounded-[8px] bg-[#0f766e] px-4 text-[12px] font-semibold text-white shadow-xs transition-colors hover:bg-[#0d645d]"
                  >
                    {isPartialLaunch ? (
                      <PlusIcon className="h-4 w-4" />
                    ) : (
                      <PrinterIcon className="h-4 w-4" />
                    )}
                    <span>
                      {isPartialLaunch ? "Lançar Pagamento" : "Concluir Venda"}
                    </span>
                    <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">
                      Enter
                    </kbd>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cupom Fiscal DANFE NFC-e / Documento Não Fiscal (Screenshot 105739.png) */}
      {completedSaleReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={receiptModalTitleId}
            className="w-full max-w-[420px] overflow-hidden rounded-[12px] bg-white shadow-2xl"
          >
            <div className="max-h-[82vh] overflow-y-auto bg-white p-6 font-mono text-[11px] text-slate-800">
              <div className="border-b border-dashed border-slate-300 pb-3 text-center">
                <h2
                  id={receiptModalTitleId}
                  className="text-[14px] font-bold uppercase text-slate-900"
                >
                  {storeSettings.nomeFantasia}
                </h2>
                <p className="text-[10px] text-slate-600">
                  {storeSettings.razaoSocial}
                </p>
                <p className="text-[10px] text-slate-600">
                  CNPJ: {storeSettings.cnpj}
                </p>
                <p className="text-[10px] text-slate-600">
                  {storeSettings.address}
                </p>
                <p className="text-[10px] text-slate-600">
                  Tel: {storeSettings.phone}
                </p>
              </div>

              <div className="border-b border-dashed border-slate-300 py-2.5 text-center">
                {completedSaleReceipt.isNonFiscal ? (
                  <div className="rounded-[6px] border border-amber-200 bg-amber-50/70 px-3 py-2">
                    <p className="font-bold uppercase text-slate-900">
                      DOCUMENTO NÃO FISCAL - COMPROVANTE DE VENDA
                    </p>
                    <p className="text-[10px] font-bold text-[#ff6b00]">
                      SEM VALOR FISCAL - CONTROLE INTERNO DO CLIENTE
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      {completedSaleReceipt.terminalName} - Operador:{" "}
                      {completedSaleReceipt.operatorName}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-slate-900">DANFE NFC-e</p>
                    <p className="text-[10px] text-slate-600">
                      Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      {completedSaleReceipt.terminalName} - Operador:{" "}
                      {completedSaleReceipt.operatorName}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-b border-dashed border-slate-300 py-2.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>QTD x ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {completedSaleReceipt.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-[10px]"
                    >
                      <span>
                        {item.quantity} {item.product.unit ?? "UN"} x{" "}
                        {item.product.name}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(
                          item.product.unitPrice * item.quantity -
                            item.discount,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 py-2.5 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedSaleReceipt.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[14px] font-bold text-slate-900">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(completedSaleReceipt.total)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300 py-2.5 space-y-1 text-[10px]">
                {completedSaleReceipt.payments.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span>Forma de Pagamento:</span>
                    <strong className="uppercase">
                      {formatPosPaymentMethod(p.method)} (
                      {formatCurrency(p.amount)})
                    </strong>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-center text-[10px] text-slate-600">
                {completedSaleReceipt.isNonFiscal ? (
                  <>
                    <p className="font-semibold text-slate-800">
                      Controle Interno de Venda:
                    </p>
                    <p>CÓDIGO: {completedSaleReceipt.saleCode}</p>
                    <p>Data de Emissão: {completedSaleReceipt.dateTime}</p>
                    <p className="mt-1 font-bold text-[#9a3412]">
                      DOCUMENTO AUXILIAR DE CONFERÊNCIA
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-800">
                      Protocolo de Autorização SEFAZ:
                    </p>
                    <p className="break-all text-[9px]">
                      {completedSaleReceipt.protocolNumber}
                    </p>
                    <p>Data de Emissão: {completedSaleReceipt.dateTime}</p>
                    <p className="mt-1 font-bold text-[#008f58]">
                      Status: AUTORIZADA PELA SEFAZ
                    </p>
                  </>
                )}

                <p className="mt-3 border-t border-slate-200 pt-2 text-[10px] text-slate-500">
                  {storeSettings.receiptFooter}
                </p>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
              <button
                type="button"
                onClick={() => setCompletedSaleReceipt(null)}
                className="h-[36px] flex-1 rounded-[8px] border border-slate-200 bg-slate-100 text-[12px] font-semibold text-slate-700 hover:bg-slate-200"
              >
                Nova Venda (Esc)
              </button>
              <button
                type="button"
                onClick={() => window.print?.()}
                className="inline-flex h-[36px] flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[#008f58] text-[12px] font-semibold text-white hover:bg-[#007a4b]"
              >
                <PrinterIcon className="h-4 w-4" />
                <span>Imprimir Cupom</span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
