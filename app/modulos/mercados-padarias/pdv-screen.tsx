"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  Banknote,
  Barcode,
  BookOpen,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText,
  Lock,
  LockOpen,
  Maximize2,
  Minus,
  Plus,
  Printer,
  QrCode,
  Search,
  ShoppingCart,
  Trash2,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
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

const PAYMENT_OPTIONS: {
  id: PosPaymentMethod;
  label: string;
  shortcut: string;
  icon: typeof Banknote;
}[] = [
  { id: "cash", label: "Dinheiro", shortcut: "F6", icon: Banknote },
  { id: "pix", label: "Pix", shortcut: "F7", icon: QrCode },
  { id: "credit", label: "Crédito", shortcut: "F8", icon: CreditCard },
  { id: "debit", label: "Débito", shortcut: "F9", icon: Wallet },
  { id: "booklet", label: "Caderneta", shortcut: "F10", icon: BookOpen },
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
  operatorName = "João Silva",
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

  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [inputQuantity, setInputQuantity] = useState(1);

  const [cart, setCart] = useState<PosCartItem[]>(initialCart);
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of activeCatalog) {
      if (item.category?.trim()) set.add(item.category.trim());
    }
    return Array.from(set);
  }, [activeCatalog]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeCatalog.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q) ||
        (item.code ?? "").toLowerCase().includes(q)
      );
    });
  }, [activeCatalog, searchQuery, selectedCategory]);

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
    () => Math.max(0, Number((subtotalAmount - discountTotalAmount).toFixed(2))),
    [subtotalAmount, discountTotalAmount],
  );

  const paidSoFar = useMemo(
    () =>
      Number(
        launchedPayments
          .reduce((sum, p) => sum + p.amount, 0)
          .toFixed(2),
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
  }, [parsedCashReceived, parsedCurrentPaymentAmount, remainingAmount, selectedPayment]);

  const selectedCustomer = useMemo(
    () =>
      bookletCustomers.find((c) => c.id === selectedCustomerId) ??
      bookletCustomers[0] ??
      null,
    [bookletCustomers, selectedCustomerId],
  );

  const handleAddProductToCart = (product: PosProduct, qty = 1) => {
    const safeQty = Math.max(1, qty);
    setCart((current) => {
      const existingIndex = current.findIndex(
        (item) => item.product.id === product.id,
      );
      if (existingIndex === -1) {
        return [
          ...current,
          { product, quantity: safeQty, discount: 0 },
        ];
      }
      return current.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + safeQty }
          : item,
      );
    });
  };

  const handleBarcodeSubmit = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;

    const matchedProduct = activeCatalog.find(
      (product) =>
        product.barcode === trimmed ||
        product.code === trimmed ||
        product.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (!matchedProduct) return;

    handleAddProductToCart(matchedProduct, inputQuantity);
    setBarcodeQuery("");
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

  const handleRemoveCartItem = (productId: string) => {
    setCart((current) =>
      current.filter((item) => item.product.id !== productId),
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
      setPaymentError("O valor do pagamento não pode exceder o saldo restante.");
      return;
    }

    if (selectedPayment === "cash" && parsedCashReceived < amountToApply) {
      setPaymentError("O valor recebido em dinheiro é menor que o valor lançado.");
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
      installments: selectedPayment === "credit" ? creditInstallments : undefined,
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
      // Partial payment launched — stay in modal for remaining balance
      setLaunchedPayments(updatedLaunches);
      const formattedRem = nextRemaining.toFixed(2).replace(".", ",");
      setPaymentAmountInput(formattedRem);
      setCashReceivedInput(formattedRem);
      return;
    }

    // Full balance paid — complete the sale!
    const saleNumber = String(Math.floor(100000 + Math.random() * 900000));
    const completedSale: PosCompletedSale = {
      id: `sale-${Date.now()}`,
      saleCode: `#${saleNumber}`,
      dateTime: new Date().toLocaleString("pt-BR"),
      operatorName,
      terminalName,
      isNonFiscal,
      items: [...cart],
      subtotal: subtotalAmount,
      discountTotal: discountTotalAmount,
      total: totalAmount,
      payments: updatedLaunches,
      protocolNumber: `${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
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
        else setSelectedPayment("debit");
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
    <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_412px]">
      {/* Left Area: Status Bar, Barcode Scanner, Search & Product Grid */}
      <div className="flex min-h-[760px] flex-col gap-3.5">
        {/* Top Terminal & Cashier Status Bar */}
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-black/10 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
                isCashierOpen
                  ? "bg-[#008f58]/15 text-[#008f58]"
                  : "bg-[#ff8d28]/20 text-[#c95c00]"
              }`}
            >
              {isCashierOpen ? (
                <LockOpen className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {isCashierOpen ? "Caixa Aberto" : "Caixa Fechado"}
            </span>
            <span className="text-[13px] font-semibold text-black/75">
              {terminalName} • Operador: {operatorName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                isCashierOpen
                  ? onRequestCloseCashier?.()
                  : onRequestOpenCashier?.()
              }
              className="inline-flex h-[32px] items-center gap-1.5 rounded-[7px] border border-black/15 bg-[#f0f2f5] px-3 text-[12px] font-semibold text-black/75 transition-colors hover:bg-black/10"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{isCashierOpen ? "Fechar Caixa" : "Abrir Caixa"}</span>
              <kbd className="ml-1 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">
                F4
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof document !== "undefined") {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen?.().catch(() => {});
                  } else {
                    document.exitFullscreen?.().catch(() => {});
                  }
                }
              }}
              className="inline-flex h-[32px] items-center gap-1.5 rounded-[7px] border border-black/15 bg-[#f0f2f5] px-3 text-[12px] font-semibold text-black/75 transition-colors hover:bg-black/10"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Tela Cheia</span>
              <kbd className="ml-1 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">
                F11
              </kbd>
            </button>
          </div>
        </section>

        {/* Barcode Scanner & Quantity Multiplier Row */}
        <section className="flex flex-col gap-3 rounded-[10px] border border-black/10 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center">
          {/* Quantity Multiplier Box */}
          <div className="flex h-[46px] shrink-0 items-center justify-between gap-2 rounded-[10px] border border-black/20 bg-[#f8f9fb] px-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-black/60">Qtd</span>
              <kbd className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold text-black/60">
                ALT+Q
              </kbd>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                onClick={() => setInputQuantity((q) => Math.max(1, q - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-black/15 bg-white text-black/70 hover:bg-black/5"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[28px] text-center text-[14px] font-bold text-black">
                {inputQuantity}
              </span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={() => setInputQuantity((q) => q + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-black/15 bg-white text-black/70 hover:bg-black/5"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Barcode Input */}
          <div className="relative flex-1">
            <Barcode className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#203f9f]" />
            <input
              type="text"
              value={barcodeQuery}
              onChange={(event) => setBarcodeQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleBarcodeSubmit(barcodeQuery);
                }
              }}
              placeholder="Bipe o código de barras ou digite o código e pressione Enter..."
              aria-label="Código de barras ou busca de produto"
              className="h-[46px] w-full rounded-[10px] border border-black/25 bg-white pl-11 pr-4 text-[14px] font-medium text-black placeholder:text-black/40 focus:border-[#203f9f] focus:outline-none"
            />
          </div>
        </section>

        {/* Search & Category Filter Row */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar produtos por nome ou código..."
              aria-label="Buscar produtos no catálogo"
              className="h-[42px] w-full rounded-[10px] border border-black/20 bg-white pl-10 pr-4 text-[14px] text-black placeholder:text-black/45 focus:border-[#203f9f] focus:outline-none"
            />
          </div>

          <select
            aria-label="Filtrar catálogo por categoria"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="h-[42px] min-w-[200px] rounded-[10px] border border-black/20 bg-white px-3.5 text-[14px] font-medium text-black/80 focus:border-[#203f9f] focus:outline-none"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </section>

        {/* Product Grid (3 Columns) */}
        {filteredProducts.length === 0 ? (
          <section className="flex flex-1 flex-col items-center justify-center rounded-[12px] border border-black/10 bg-white p-8 text-center">
            <Barcode className="mb-2 h-8 w-8 text-black/30" />
            <p className="text-[15px] font-semibold text-black/70">
              Nenhum produto encontrado no catálogo
            </p>
            <p className="mt-1 text-[12px] text-black/45">
              Cadastre novos produtos na aba Estoque ou ajuste os filtros de busca.
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleAddProductToCart(product, inputQuantity)}
                className="group flex min-h-[108px] flex-col justify-between rounded-[10px] border border-black/15 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:border-[#203f9f] hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-[14px] font-bold text-black group-hover:text-[#203f9f]">
                      {product.name}
                    </h3>
                    <span className="shrink-0 rounded-[5px] bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-bold text-black/65">
                      {product.stockQuantity} {(product.unit ?? "un").toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-black/45">
                    <Barcode className="h-3 w-3" />
                    <span>{product.barcode}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between border-t border-black/10 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-black/45">
                    Preço
                  </span>
                  <span className="text-[16px] font-bold text-[#008f58]">
                    {formatCurrency(product.unitPrice)}
                  </span>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>

      {/* Right Panel: Cupom Fiscal */}
      <aside className="flex min-h-[760px] flex-col overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        {/* Blue Header */}
        <header className="flex min-h-[74px] items-center justify-between bg-[#203f9f] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 shrink-0 stroke-[2]" />
            <div>
              <h2 className="text-[20px] font-semibold leading-tight">
                Cupom Fiscal
              </h2>
              <p className="text-[12px] font-medium text-white/85">
                {terminalName} - Operador {operatorName}
              </p>
            </div>
          </div>

          <span className=" inline-flex h-[32px] min-w-[74px] items-center justify-center rounded-[8px] bg-[#f0f2f5]/35 px-3 text-[14px] font-semibold text-white">
            {totalItems} {totalItems === 1 ? "Item" : "Itens"}
          </span>
        </header>

        {/* Cart Items Area */}
        <div className="flex flex-1 flex-col justify-center px-4 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#f0f2f5]">
                <ShoppingCart className="h-7 w-7 text-black/45" />
              </div>
              <p className="text-[16px] font-semibold text-black/55">
                Caixa Livre
              </p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-snug text-black/45">
                Bipe um produto ou selecione no catálogo ao lado para iniciar a venda
              </p>
            </div>
          ) : (
            <ul className="w-full flex-1 space-y-2.5 self-start overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const lineTotal = Math.max(
                  0,
                  item.product.unitPrice * item.quantity - item.discount,
                );
                return (
                  <li
                    key={item.product.id}
                    className="rounded-[10px] border border-black/15 bg-[#f8f9fb] p-3 text-[13px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#203f9f]/15 px-1.5 py-0.5 text-[11px] font-bold text-[#203f9f]">
                          #{idx + 1}
                        </span>
                        <p className="font-bold text-black">
                          {item.product.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(item.product.id)}
                        aria-label={`Remover ${item.product.name}`}
                        className="text-black/40 transition-colors hover:text-[#ff383c]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartQuantity(item.product.id, -1)
                          }
                          aria-label={`Diminuir ${item.product.name}`}
                          className="flex h-6 w-6 items-center justify-center rounded border border-black/15 bg-white text-black/70 hover:bg-black/5"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[24px] text-center text-[12px] font-bold text-black">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartQuantity(item.product.id, 1)
                          }
                          aria-label={`Aumentar ${item.product.name}`}
                          className="flex h-6 w-6 items-center justify-center rounded border border-black/15 bg-white text-black/70 hover:bg-black/5"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <span className="ml-1 text-[12px] text-black/55">
                          x {formatCurrency(item.product.unitPrice)}
                        </span>
                      </div>

                      <span className="text-[14px] font-bold text-black">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Totals & Payment Action */}
        <footer className="border-t border-black/10 bg-[#f0f2f5] p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[16px] font-semibold tracking-tight text-black">
              TOTAL A PAGAR
            </span>
            <span className="text-[28px] font-semibold leading-none text-black">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* 5 Payment Method Quick Buttons */}
          <div className="mt-3.5 grid grid-cols-5 gap-1.5">
            {PAYMENT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedPayment === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedPayment(option.id)}
                  className={`flex h-[68px] flex-col items-center justify-center rounded-[10px] border px-1 text-center transition-colors ${
                    isSelected
                      ? "border-[#203f9f] bg-[#203f9f]/10 text-[#203f9f]"
                      : "border-black/25 bg-white text-black/80 hover:bg-black/[0.03]"
                  }`}
                >
                  <Icon className="mb-1 h-4 w-4 stroke-[2]" />
                  <span className="text-[11px] font-semibold leading-tight">
                    {option.label}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium text-black/45">
                    {option.shortcut}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => handleOpenPaymentModal()}
            className="mt-3.5 flex h-[48px] w-full items-center justify-center rounded-[10px] bg-[#008f58] text-[18px] font-semibold text-white shadow-sm transition-opacity hover:bg-[#007a4b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Finalizar Venda (F5)
          </button>
        </footer>
      </aside>

      {/* Modal: Pagamento da Venda (Nodes 1378:2944 to 1395:3057) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={paymentModalTitleId}
            className="w-full max-w-[692px] overflow-hidden rounded-[16px] bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#008f7a]/15 text-[#008f7a]">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h2
                    id={paymentModalTitleId}
                    className="text-[20px] font-bold leading-tight text-black"
                  >
                    Pagamento da Venda
                  </h2>
                  <p className="text-[12px] text-black/60">
                    Selecione a forma e confirme o recebimento
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-black/15 bg-[#f8f9fb] px-3 py-1.5 text-[12px] font-semibold text-black/80">
                  <input
                    type="checkbox"
                    checked={isNonFiscal}
                    onChange={(e) => setIsNonFiscal(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-black/30 text-[#008f7a] focus:ring-[#008f7a]"
                  />
                  <FileText className="h-3.5 w-3.5 text-black/55" />
                  <span>Cupom Não Fiscal</span>
                  <kbd className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold text-black/65">
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
                  className="rounded-full p-1 text-black/60 transition-colors hover:bg-black/5 hover:text-black"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Modal Body: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-[265px_1fr]">
              {/* Left Column: Totals, Lançados & Forma de Pagamento */}
              <div className="border-b border-black/10 bg-white p-4 md:border-b-0 md:border-r">
                {/* Summary Box */}
                <div className="rounded-[10px] border border-black/15 bg-[#f8f9fb] p-3.5">
                  <div className="flex items-center justify-between text-[12px] font-semibold text-black/65">
                    <span>Total da Venda</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>

                  {paidSoFar > 0 && (
                    <div className="mt-1.5 flex items-center justify-between text-[12px] font-bold text-[#008f58]">
                      <span>Já Pago</span>
                      <span>-{formatCurrency(paidSoFar)}</span>
                    </div>
                  )}

                  <div className="my-2.5 border-t border-black/10" />

                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] font-bold uppercase text-black/75">
                      {paidSoFar > 0 ? "Restante" : "Total a Pagar"}
                    </span>
                    <span className="text-[18px] font-bold text-black">
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>

                {/* Lançados (Partial Payments) */}
                {launchedPayments.length > 0 && (
                  <div className="mt-3.5">
                    <p className="mb-1.5 text-[12px] font-bold text-black/70">
                      Lançados ({launchedPayments.length})
                    </p>
                    <ul className="space-y-1.5">
                      {launchedPayments.map((launch) => (
                        <li
                          key={launch.id}
                          className="flex items-center justify-between rounded-[7px] border border-[#008f58]/30 bg-[#008f58]/10 px-2.5 py-1.5 text-[12px]"
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-black">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#008f58]" />
                            <span>{formatPosPaymentMethod(launch.method)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black">
                              {formatCurrency(launch.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveLaunchedPayment(launch.id)
                              }
                              aria-label={`Remover pagamento ${formatPosPaymentMethod(launch.method)}`}
                              className="text-black/45 hover:text-[#ff383c]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Forma de Pagamento Selector */}
                <div className="mt-4">
                  <p className="mb-2 text-[12px] font-bold text-black/70">
                    Forma de Pagamento
                  </p>
                  <div className="space-y-1.5">
                    {PAYMENT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const active = selectedPayment === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            handleSelectMethodInsideModal(option.id)
                          }
                          className={`flex h-[34px] w-full items-center justify-between rounded-[8px] px-3 text-[12px] font-semibold transition-colors ${
                            active
                              ? "bg-[#008f7a] text-white shadow-sm"
                              : "border border-black/15 bg-white text-black/80 hover:bg-black/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </span>
                          <kbd
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-black/10 text-black/60"
                            }`}
                          >
                            {option.shortcut}
                          </kbd>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Payment Form */}
              <div className="flex flex-col justify-between bg-[#f8f9fb] p-5">
                <div className="space-y-4">
                  {/* DINHEIRO */}
                  {selectedPayment === "cash" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-bold text-black">
                          Valor em Dinheiro
                        </label>
                        <input
                          type="text"
                          aria-label="Valor em Dinheiro"
                          value={paymentAmountInput}
                          onChange={(e) => {
                            setPaymentAmountInput(e.target.value);
                            setCashReceivedInput(e.target.value);
                          }}
                          className="h-[48px] w-full rounded-[10px] border border-black/25 bg-white px-4 text-[20px] font-bold text-black focus:border-[#008f7a] focus:outline-none"
                        />
                      </div>

                      <div className="border-t border-black/10 pt-3">
                        <label className="mb-1.5 block text-[13px] font-bold text-black">
                          Valor Recebido
                        </label>
                        <input
                          type="text"
                          aria-label="Valor Recebido"
                          value={cashReceivedInput}
                          onChange={(e) => setCashReceivedInput(e.target.value)}
                          className="h-[48px] w-full rounded-[10px] border border-black/25 bg-white px-4 text-[20px] font-bold text-black focus:border-[#008f7a] focus:outline-none"
                        />
                      </div>

                      {/* Green Troco Box */}
                      <div className="flex items-center justify-between rounded-[10px] border border-[#008f58]/30 bg-[#008f58]/10 p-3.5">
                        <div>
                          <p className="text-[13px] font-bold text-[#008f58]">
                            Troco
                          </p>
                          <p className="mt-1 text-[22px] font-bold leading-none text-[#008f58]">
                            {formatCurrency(changeAmount)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#008f58] px-2.5 py-1 text-[11px] font-semibold text-white">
                            <LockOpen className="h-3.5 w-3.5" />
                            Disparo Automático
                          </span>
                          <p className="mt-1 text-[10px] font-medium text-black/55">
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
                        <label className="mb-1.5 block text-[13px] font-bold text-black">
                          Valor em Pix
                        </label>
                        <input
                          type="text"
                          aria-label="Valor em Pix"
                          value={paymentAmountInput}
                          onChange={(e) =>
                            setPaymentAmountInput(e.target.value)
                          }
                          className="h-[48px] w-full rounded-[10px] border border-black/25 bg-white px-4 text-[20px] font-bold text-black focus:border-[#008f7a] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 rounded-[10px] border border-[#008f7a]/30 bg-[#008f7a]/10 p-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#008f7a] text-white">
                          <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-black">
                            Recebimento em Pix
                          </p>
                          <p className="text-[12px] text-black/65">
                            Pressione Enter para confirmar{" "}
                            {formatCurrency(parsedCurrentPaymentAmount)} e{" "}
                            {isPartialLaunch
                              ? "lançar o pagamento parcial."
                              : "concluir a venda."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 rounded-[10px] border border-black/10 bg-white p-3 text-[12px]">
                        <div className="flex items-center gap-2 font-medium text-black/75">
                          <CheckCircle2 className="h-4 w-4 text-[#008f58]" />
                          <span>Pagamento sendo processado...</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-[#008f58]">
                          <CheckCircle2 className="h-4 w-4 text-[#008f58]" />
                          <span>Pagamento confirmado com sucesso!</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CRÉDITO */}
                  {selectedPayment === "credit" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-bold text-black">
                          Valor em Cartão de Crédito
                        </label>
                        <input
                          type="text"
                          aria-label="Valor em Cartão de Crédito"
                          value={paymentAmountInput}
                          onChange={(e) =>
                            setPaymentAmountInput(e.target.value)
                          }
                          className="h-[48px] w-full rounded-[10px] border border-black/25 bg-white px-4 text-[20px] font-bold text-black focus:border-[#008f7a] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[13px] font-bold text-black">
                          Parcelamento
                        </label>
                        <select
                          aria-label="Parcelamento"
                          value={creditInstallments}
                          onChange={(e) =>
                            setCreditInstallments(Number(e.target.value))
                          }
                          className="h-[46px] w-full rounded-[10px] border border-black/25 bg-white px-3.5 text-[14px] font-semibold text-black focus:border-[#008f7a] focus:outline-none"
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

                      <div className="space-y-1.5 rounded-[10px] border border-black/10 bg-white p-3 text-[12px]">
                        <div className="flex items-center gap-2 font-medium text-black/75">
                          <CheckCircle2 className="h-4 w-4 text-[#008f58]" />
                          <span>Pagamento sendo processado...</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-[#008f58]">
                          <CheckCircle2 className="h-4 w-4 text-[#008f58]" />
                          <span>Pagamento confirmado com sucesso!</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* DÉBITO */}
                  {selectedPayment === "debit" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-bold text-black">
                          Valor em Cartão de Débito
                        </label>
                        <input
                          type="text"
                          aria-label="Valor em Cartão de Débito"
                          value={paymentAmountInput}
                          onChange={(e) =>
                            setPaymentAmountInput(e.target.value)
                          }
                          className="h-[48px] w-full rounded-[10px] border border-black/25 bg-white px-4 text-[20px] font-bold text-black focus:border-[#008f7a] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 rounded-[10px] border border-[#008f7a]/30 bg-[#008f7a]/10 p-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#008f7a] text-white">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-black">
                            Cartão de Débito à Vista
                          </p>
                          <p className="text-[12px] text-black/65">
                            Pressione Enter para abater{" "}
                            {formatCurrency(parsedCurrentPaymentAmount)} do
                            saldo.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 rounded-[10px] border border-black/10 bg-white p-3 text-[12px]">
                        <div className="flex items-center gap-2 font-medium text-black/75">
                          <CheckCircle2 className="h-4 w-4 text-[#008f58]" />
                          <span>Pagamento sendo processado...</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-[#008f58]">
                          <CheckCircle2 className="h-4 w-4 text-[#008f58]" />
                          <span>Pagamento confirmado com sucesso!</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CADERNETA */}
                  {selectedPayment === "booklet" && (
                    <>
                      <div>
                        <label className="mb-1.5 block text-[13px] font-bold text-black">
                          Valor em Caderneta
                        </label>
                        <input
                          type="text"
                          aria-label="Valor em Caderneta"
                          value={paymentAmountInput}
                          onChange={(e) =>
                            setPaymentAmountInput(e.target.value)
                          }
                          className="h-[48px] w-full rounded-[10px] border border-black/25 bg-white px-4 text-[20px] font-bold text-black focus:border-[#008f7a] focus:outline-none"
                        />
                      </div>

                      <div className="rounded-[10px] border border-[#008f7a]/35 bg-[#008f7a]/10 p-3.5">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[#008f7a]">
                          <UserCheck className="h-4 w-4" />
                          <span>Cliente da Caderneta</span>
                        </label>
                        <select
                          aria-label="Selecionar Cliente da Caderneta"
                          value={selectedCustomer?.id ?? ""}
                          onChange={(e) =>
                            setSelectedCustomerId(e.target.value)
                          }
                          className="h-[40px] w-full rounded-[8px] border border-black/20 bg-white px-3 text-[13px] font-semibold text-black focus:border-[#008f7a] focus:outline-none"
                        >
                          {bookletCustomers.length === 0 ? (
                            <option value="">
                              Nenhum cliente cadastrado na caderneta
                            </option>
                          ) : (
                            bookletCustomers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} — CPF: {c.cpf}
                              </option>
                            ))
                          )}
                        </select>

                        {selectedCustomer && (
                          <div className="mt-3 grid grid-cols-3 gap-2 rounded-[8px] bg-white/90 p-2.5 text-center text-[11px]">
                            <div>
                              <span className="block font-semibold text-black/55">
                                Dívida Atual
                              </span>
                              <span className="font-bold text-black">
                                {formatCurrency(selectedCustomer.balance)}
                              </span>
                            </div>
                            <div>
                              <span className="block font-semibold text-black/55">
                                Nova Dívida
                              </span>
                              <span className="font-bold text-[#ff8d28]">
                                {formatCurrency(
                                  selectedCustomer.balance +
                                    parsedCurrentPaymentAmount,
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="block font-semibold text-black/55">
                                Crédito Restante
                              </span>
                              <span className="font-bold text-[#008f58]">
                                {formatCurrency(
                                  Math.max(
                                    0,
                                    selectedCustomer.creditLimit -
                                      (selectedCustomer.balance +
                                        parsedCurrentPaymentAmount),
                                  ),
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {paymentError && (
                    <p className="rounded-[8px] bg-[#ff383c]/10 px-3 py-2 text-[12px] font-semibold text-[#ff383c]">
                      {paymentError}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 flex items-center justify-end gap-4 border-t border-black/10 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaymentModalOpen(false);
                      setPaymentError(null);
                    }}
                    className="text-[14px] font-semibold text-black/60 hover:text-black"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmOrLaunchPayment}
                    className="inline-flex h-[40px] items-center gap-2 rounded-[8px] bg-[#008f58] px-5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a4b]"
                  >
                    <span>
                      {isPartialLaunch ? "Lançar Pagamento" : "Concluir Venda"}
                    </span>
                    <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
                      Enter
                    </kbd>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cupom Fiscal NFC-e / Cupom Não Fiscal (Nodes 1252:2808 & 1255:2851) */}
      {completedSaleReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={receiptModalTitleId}
            className="w-full max-w-[430px] overflow-hidden rounded-[14px] bg-white shadow-2xl"
          >
            <div className="max-h-[82vh] overflow-y-auto bg-[#fffef7] p-6 font-mono text-[12px] text-black">
              <div className="border-b border-dashed border-black/30 pb-3 text-center">
                <h2
                  id={receiptModalTitleId}
                  className="text-[15px] font-bold uppercase"
                >
                  {storeSettings.nomeFantasia}
                </h2>
                <p className="text-[11px] text-black/70">
                  {storeSettings.razaoSocial}
                </p>
                <p className="text-[11px] text-black/70">
                  CNPJ: {storeSettings.cnpj} • IE: {storeSettings.ie}
                </p>
                <p className="text-[11px] text-black/70">
                  {storeSettings.address}
                </p>
              </div>

              <div className="border-b border-dashed border-black/30 py-2.5 text-center">
                {completedSaleReceipt.isNonFiscal ? (
                  <>
                    <p className="font-bold uppercase">
                      Controle Interno de Venda
                    </p>
                    <p className="text-[11px] text-black/65">
                      DOCUMENTO AUXILIAR DE CONFERÊNCIA (Sem Valor Fiscal)
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold uppercase">DANFE NFC-e</p>
                    <p className="text-[11px] text-black/65">
                      Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica
                    </p>
                  </>
                )}
              </div>

              <div className="border-b border-dashed border-black/30 py-2.5">
                <div className="flex justify-between font-bold">
                  <span>ITEM / DESCRIÇÃO</span>
                  <span>TOTAL</span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {completedSaleReceipt.items.map((item, i) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-[11px]"
                    >
                      <span>
                        {String(i + 1).padStart(2, "0")} {item.product.name} (
                        {item.quantity}x{" "}
                        {formatCurrency(item.product.unitPrice)})
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

              <div className="border-b border-dashed border-black/30 py-2.5 space-y-1">
                <div className="flex justify-between text-[13px] font-bold">
                  <span>VALOR TOTAL R$</span>
                  <span>{formatCurrency(completedSaleReceipt.total)}</span>
                </div>
                {completedSaleReceipt.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-[11px] text-black/75"
                  >
                    <span>
                      {formatPosPaymentMethod(p.method)}
                      {p.installments && p.installments > 1
                        ? ` (${p.installments}x)`
                        : ""}
                      {p.customerName ? ` - ${p.customerName}` : ""}
                    </span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 text-center text-[11px] text-black/70">
                <p>
                  Venda {completedSaleReceipt.saleCode} •{" "}
                  {completedSaleReceipt.dateTime}
                </p>
                <p>
                  {completedSaleReceipt.terminalName} - Operador:{" "}
                  {completedSaleReceipt.operatorName}
                </p>
                {!completedSaleReceipt.isNonFiscal && (
                  <p className="mt-1 text-[10px] text-black/55">
                    Protocolo SEFAZ: {completedSaleReceipt.protocolNumber}
                  </p>
                )}
                <p className="mt-2 font-semibold text-black">
                  {storeSettings.receiptFooter}
                </p>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-black/10 bg-white px-5 py-3.5">
              <button
                type="button"
                onClick={() => setCompletedSaleReceipt(null)}
                className="h-[38px] flex-1 rounded-[8px] border border-black/20 bg-[#f0f2f5] text-[13px] font-semibold text-black/75 hover:bg-black/10"
              >
                Nova Venda (Esc)
              </button>
              <button
                type="button"
                onClick={() => window.print?.()}
                className="inline-flex h-[38px] flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#008f58] text-[13px] font-semibold text-white hover:bg-[#007a4b]"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Cupom</span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
