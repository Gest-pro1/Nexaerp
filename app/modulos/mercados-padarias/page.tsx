"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeftRight,
  Award,
  Banknote,
  BookOpen,
  CreditCard,
  DollarSign,
  Home,
  Lock,
  Monitor,
  Package,
  QrCode,
  Settings,
  ShoppingBag,
  TrendingUp,
  Truck,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import {
  EMPTY_MARKET_DASHBOARD,
  type BestSellingProduct,
  type DashboardPeriod,
  type DashboardSale,
  type MarketDashboardData,
  type PaymentMethodId,
} from "@/lib/market-dashboard";
import {
  EMPTY_INVENTORY_PRODUCTS,
  EMPTY_INVENTORY_SUPPLIERS,
  type InventoryProduct,
  type InventorySupplier,
} from "@/lib/market-inventory";
import {
  EMPTY_BOOKLET_CUSTOMERS,
  type BookletCustomer,
  type BookletPaymentMethod,
} from "@/lib/market-booklet";
import {
  DEFAULT_OPERATORS,
  DEFAULT_STORE_SETTINGS,
  formatOperatorRoleLabel,
  type StoreGeneralSettings,
  type SystemOperator,
} from "@/lib/market-settings";
import {
  formatPosPaymentMethod,
  type PosCompletedSale,
  type PosPaymentLaunch,
  type PosProduct,
} from "@/lib/market-pos";
import PdvScreen from "./pdv-screen";
import CashierScreen, { type ShiftSalesSummary } from "./cashier-screen";
import InventoryScreen from "./inventory-screen";
import SuppliersScreen from "./suppliers-screen";
import BookletScreen from "./booklet-screen";
import SettingsScreen from "./settings-screen";

type OperationMenuId =
  | "inicio"
  | "pdv"
  | "caixa"
  | "estoque"
  | "fornecedores"
  | "caderneta"
  | "configuracoes";

const PERIOD_FILTERS: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7days", label: "7 Dias" },
  { id: "30days", label: "30 Dias" },
  { id: "all", label: "Geral" },
];

const OPERATION_MENU: {
  id: Exclude<OperationMenuId, "configuracoes">;
  label: string;
  icon: typeof Home;
}[] = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "pdv", label: "PDV", icon: Monitor },
  { id: "caixa", label: "Caixa", icon: DollarSign },
  { id: "estoque", label: "Estoque", icon: Package },
  { id: "fornecedores", label: "Fornecedores", icon: Truck },
  { id: "caderneta", label: "Caderneta", icon: BookOpen },
];

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}

function getPaymentMethodIcon(id: PaymentMethodId) {
  switch (id) {
    case "pix":
      return QrCode;
    case "credit-card":
      return CreditCard;
    case "debit-card":
      return Wallet;
    case "cash":
      return Banknote;
    case "booklet":
      return BookOpen;
  }
}

export interface MercadosPadariasPageProps {
  initialData?: MarketDashboardData;
  initialProducts?: InventoryProduct[];
  initialSuppliers?: InventorySupplier[];
  initialCustomers?: BookletCustomer[];
}

export default function MercadosPadariasPage({
  initialData = EMPTY_MARKET_DASHBOARD,
  initialProducts = EMPTY_INVENTORY_PRODUCTS,
  initialSuppliers = EMPTY_INVENTORY_SUPPLIERS,
  initialCustomers = EMPTY_BOOKLET_CUSTOMERS,
}: MercadosPadariasPageProps) {
  const [selectedPeriod, setSelectedPeriod] =
    useState<DashboardPeriod>("today");
  const [activeMenu, setActiveMenu] = useState<OperationMenuId>("inicio");

  // Store & Operator Settings State
  const [storeSettings, setStoreSettings] = useState<StoreGeneralSettings>(
    DEFAULT_STORE_SETTINGS,
  );
  const [operators, setOperators] =
    useState<SystemOperator[]>(DEFAULT_OPERATORS);
  const [currentOperator, setCurrentOperator] = useState<SystemOperator>(
    DEFAULT_OPERATORS[0],
  );

  // Switch Operator Modal State
  const [isSwitchOperatorOpen, setIsSwitchOperatorOpen] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(
    DEFAULT_OPERATORS[0].id,
  );
  const [operatorPassword, setOperatorPassword] = useState("");
  const [operatorSwitchError, setOperatorSwitchError] = useState<string | null>(
    null,
  );
  const switchDialogTitleId = useId();

  // Shared Frontend State across tabs
  const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);
  const [suppliers, setSuppliers] =
    useState<InventorySupplier[]>(initialSuppliers);
  const [customers, setCustomers] =
    useState<BookletCustomer[]>(initialCustomers);
  const [isCashierOpen, setIsCashierOpen] = useState(true);
  const [shiftSales, setShiftSales] = useState<ShiftSalesSummary>({
    cashSales: 0,
    pixSales: 0,
    cardSales: 0,
    bookletSales: 0,
    salesCount: 0,
  });

  // Live Dashboard Sales & Best Selling State
  const [recordedSales, setRecordedSales] = useState<DashboardSale[]>(
    initialData.sales,
  );
  const [bestSellers, setBestSellers] = useState<BestSellingProduct[]>(
    initialData.bestSellingProducts,
  );

  useEffect(() => {
    if (!isSwitchOperatorOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSwitchOperatorOpen(false);
        setOperatorPassword("");
        setOperatorSwitchError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSwitchOperatorOpen]);

  // Convert InventoryProducts to PosProducts for PDV
  const posCatalog = useMemo<PosProduct[]>(
    () =>
      products.map((p) => ({
        id: p.id,
        code: p.code,
        barcode: p.barcode,
        name: p.description,
        category: p.category,
        unit: p.unit,
        unitCost: p.unitCost,
        unitPrice: p.salePrice,
        stockQuantity: p.currentStock,
        active: p.active !== false,
      })),
    [products],
  );

  // Compute live dashboard data combining initialData + any sales completed in PDV
  const dashboardData = useMemo<MarketDashboardData>(() => {
    if (recordedSales.length === initialData.sales.length) {
      return initialData;
    }

    const totalRevenue = Number(
      recordedSales.reduce((s, sale) => s + sale.total, 0).toFixed(2),
    );
    const totalItemsSold = recordedSales.reduce(
      (s, sale) => s + sale.itemCount,
      0,
    );
    const estimatedProfit = Number((totalRevenue * 0.28).toFixed(2));
    const avgMargin =
      totalRevenue > 0
        ? Math.round((estimatedProfit / totalRevenue) * 100)
        : 0;
    const avgItems =
      recordedSales.length > 0
        ? Number((totalItemsSold / recordedSales.length).toFixed(1))
        : 0;

    const bookletRev = Number(shiftSales.bookletSales.toFixed(2));
    const bookletPct =
      totalRevenue > 0 ? Math.round((bookletRev / totalRevenue) * 100) : 0;

    const pct = (val: number) =>
      totalRevenue > 0 ? Math.round((val / totalRevenue) * 100) : 0;

    return {
      metrics: {
        revenue: totalRevenue,
        grossProfit: estimatedProfit,
        averageProfitMargin: avgMargin,
        itemsSold: totalItemsSold,
        averageItemsPerSale: avgItems,
        salesCount: recordedSales.length,
        bookletRevenue: bookletRev,
        bookletRevenuePercentage: bookletPct,
      },
      paymentMethods: [
        {
          id: "pix",
          name: "Pix instantâneo",
          amount: shiftSales.pixSales,
          percentage: pct(shiftSales.pixSales),
        },
        {
          id: "credit-card",
          name: "Cartão de Crédito",
          amount: shiftSales.cardSales,
          percentage: pct(shiftSales.cardSales),
        },
        {
          id: "debit-card",
          name: "Cartão de Débito",
          amount: 0,
          percentage: 0,
        },
        {
          id: "cash",
          name: "Dinheiro",
          amount: shiftSales.cashSales,
          percentage: pct(shiftSales.cashSales),
        },
        {
          id: "booklet",
          name: "Caderneta",
          amount: shiftSales.bookletSales,
          percentage: pct(shiftSales.bookletSales),
        },
      ],
      bestSellingProducts: bestSellers,
      sales: recordedSales,
      totalSales: recordedSales.length,
    };
  }, [bestSellers, initialData, recordedSales, shiftSales]);

  const handleOpenSwitchOperator = () => {
    setSelectedOperatorId(currentOperator.id);
    setOperatorPassword("");
    setOperatorSwitchError(null);
    setIsSwitchOperatorOpen(true);
  };

  const handleCloseSwitchOperator = () => {
    setIsSwitchOperatorOpen(false);
    setOperatorPassword("");
    setOperatorSwitchError(null);
  };

  const handleConfirmSwitchOperator = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetOperator = operators.find((op) => op.id === selectedOperatorId);
    if (!targetOperator) return;

    if (!operatorPassword.trim()) {
      setOperatorSwitchError("Digite a senha para confirmar a troca.");
      return;
    }

    setCurrentOperator(targetOperator);
    handleCloseSwitchOperator();
  };

  // Handlers for shared state updates
  const handleSaveProduct = (product: InventoryProduct, isEdit: boolean) => {
    setProducts((curr) =>
      isEdit
        ? curr.map((item) => (item.id === product.id ? product : item))
        : [product, ...curr],
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((curr) => curr.filter((item) => item.id !== productId));
  };

  const handleSaveSupplier = (supplier: InventorySupplier, isEdit: boolean) => {
    setSuppliers((curr) =>
      isEdit
        ? curr.map((item) => (item.id === supplier.id ? supplier : item))
        : [...curr, supplier],
    );
    if (isEdit) {
      setProducts((curr) =>
        curr.map((p) =>
          p.supplierId === supplier.id
            ? { ...p, supplierName: supplier.name }
            : p,
        ),
      );
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((curr) => curr.filter((item) => item.id !== supplierId));
  };

  const handleSaveCustomer = (customer: BookletCustomer) => {
    setCustomers((curr) => {
      const exists = curr.some((c) => c.id === customer.id);
      return exists
        ? curr.map((c) => (c.id === customer.id ? customer : c))
        : [customer, ...curr];
    });
  };

  const handleReceiveBookletPayment = (
    customerId: string,
    amount: number,
    method: BookletPaymentMethod,
  ) => {
    setCustomers((curr) =>
      curr.map((c) => {
        if (c.id !== customerId) return c;
        const nextBalance = Math.max(
          0,
          Number((c.balance - amount).toFixed(2)),
        );
        return {
          ...c,
          balance: nextBalance,
          entries: [
            {
              id: `entry-${Date.now()}`,
              type: "payment",
              description: `Pagamento recebido no balcão via ${method.toUpperCase()}`,
              dateTime: new Date().toLocaleString("pt-BR"),
              operatorName: currentOperator.name,
              amount,
              balanceAfter: nextBalance,
              paymentMethod: method,
            },
            ...c.entries,
          ],
        };
      }),
    );
  };

  const handleFinishPdvSale = (payload: {
    items: { product: PosProduct; quantity: number; discount: number }[];
    payments: PosPaymentLaunch[];
    total: number;
    isNonFiscal: boolean;
    completedSale: PosCompletedSale;
  }) => {
    // 1. Decrement product stock
    setProducts((curr) =>
      curr.map((prod) => {
        const soldItem = payload.items.find((i) => i.product.id === prod.id);
        if (!soldItem) return prod;
        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - soldItem.quantity),
        };
      }),
    );

    // 2. Update shift sales
    let cashAdd = 0;
    let pixAdd = 0;
    let cardAdd = 0;
    let bookletAdd = 0;

    for (const p of payload.payments) {
      if (p.method === "cash") cashAdd += p.amount;
      else if (p.method === "pix") pixAdd += p.amount;
      else if (p.method === "credit" || p.method === "debit") cardAdd += p.amount;
      else if (p.method === "booklet") bookletAdd += p.amount;

      // Update booklet customer balance if paid on Caderneta
      if (p.method === "booklet" && p.customerId) {
        setCustomers((curr) =>
          curr.map((cust) => {
            if (cust.id !== p.customerId) return cust;
            const nextBal = Number((cust.balance + p.amount).toFixed(2));
            return {
              ...cust,
              balance: nextBal,
              entries: [
                {
                  id: `entry-${Date.now()}`,
                  type: "purchase",
                  description: `Compra PDV ${payload.completedSale.saleCode}`,
                  dateTime: payload.completedSale.dateTime,
                  operatorName: currentOperator.name,
                  amount: p.amount,
                  balanceAfter: nextBal,
                },
                ...cust.entries,
              ],
            };
          }),
        );
      }
    }

    setShiftSales((curr) => ({
      cashSales: Number((curr.cashSales + cashAdd).toFixed(2)),
      pixSales: Number((curr.pixSales + pixAdd).toFixed(2)),
      cardSales: Number((curr.cardSales + cardAdd).toFixed(2)),
      bookletSales: Number((curr.bookletSales + bookletAdd).toFixed(2)),
      salesCount: curr.salesCount + 1,
    }));

    // 3. Record dashboard sale & best sellers
    const totalQty = payload.items.reduce((s, i) => s + i.quantity, 0);
    const methodsLabel = payload.payments
      .map((p) => formatPosPaymentMethod(p.method))
      .join(" + ");

    const newDashSale: DashboardSale = {
      id: payload.completedSale.id,
      code: payload.completedSale.saleCode,
      dateTime: payload.completedSale.dateTime,
      operator: currentOperator.name,
      itemCount: totalQty,
      paymentMethod: methodsLabel,
      receiptStatus: payload.isNonFiscal
        ? "Controle Interno"
        : "NFC-e Emitida",
      total: payload.total,
    };

    setRecordedSales((curr) => [newDashSale, ...curr]);

    setBestSellers((curr) => {
      const map = new Map<string, BestSellingProduct>();
      for (const existing of curr) {
        map.set(existing.id, { ...existing });
      }
      for (const item of payload.items) {
        const rev = Number(
          (item.product.unitPrice * item.quantity - item.discount).toFixed(2),
        );
        const cost = (item.product.unitCost ?? item.product.unitPrice * 0.7) * item.quantity;
        const profit = Math.max(0, Number((rev - cost).toFixed(2)));
        const currentEntry = map.get(item.product.id);
        if (currentEntry) {
          currentEntry.quantitySold += item.quantity;
          currentEntry.revenue = Number((currentEntry.revenue + rev).toFixed(2));
          currentEntry.estimatedProfit = Number(
            (currentEntry.estimatedProfit + profit).toFixed(2),
          );
        } else {
          map.set(item.product.id, {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category ?? "Mercearia",
            quantitySold: item.quantity,
            revenue: rev,
            estimatedProfit: profit,
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    });
  };

  const metricCards = [
    {
      id: "revenue",
      title: "Faturamento Atual",
      value: formatCurrency(dashboardData.metrics.revenue),
      subtitle: `${dashboardData.metrics.salesCount} vendas concluídas no período`,
      accentColor: "#ff8d28",
      icon: DollarSign,
    },
    {
      id: "gross-profit",
      title: "Lucro Bruto",
      value: formatCurrency(dashboardData.metrics.grossProfit),
      subtitle: `Margem média de ${dashboardData.metrics.averageProfitMargin}% sobre vendas`,
      accentColor: "#34c759",
      icon: TrendingUp,
    },
    {
      id: "items-sold",
      title: "Total de Itens Vendidos",
      value: `${dashboardData.metrics.itemsSold} un`,
      subtitle: `Média de ${dashboardData.metrics.averageItemsPerSale} itens por venda`,
      accentColor: "#6155f5",
      icon: ShoppingBag,
    },
    {
      id: "booklet",
      title: "Vendas na Caderneta",
      value: formatCurrency(dashboardData.metrics.bookletRevenue),
      subtitle: `${dashboardData.metrics.bookletRevenuePercentage}% do faturamento no período`,
      accentColor: "#0088ff",
      icon: BookOpen,
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-[#f0f2f5] font-sans text-black">
      {/* Sidebar */}
      <aside className="flex w-[224px] shrink-0 flex-col justify-between border-r border-black/10 bg-white">
        <div>
          {/* Brand Logo */}
          <div className="px-5 pb-4 pt-6">
            <Image
              src="/Logo.svg"
              alt="Gestão Pro"
              width={150}
              height={42}
              priority
              className="h-auto w-[150px]"
            />
          </div>

          <div className="mx-3 border-t border-black/10" />

          {/* Section Title */}
          <div className="px-4 pb-2 pt-4">
            <span className="text-[12px] font-semibold tracking-wide text-black/45">
              Operação
            </span>
          </div>

          {/* Navigation Menu */}
          <nav aria-label="Menu de Operação" className="space-y-1 px-3">
            {OPERATION_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id)}
                  className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left text-[15px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#203f9f]/85 text-white shadow-xs"
                      : "text-black/75 hover:bg-black/5"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-white" : "text-black/70"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Operator & Settings */}
        <div className="border-t border-black/10 px-3 py-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveMenu("configuracoes")}
              className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                activeMenu === "configuracoes"
                  ? "bg-[#203f9f]/85 text-white shadow-xs"
                  : "text-black/75 hover:bg-black/5"
              }`}
            >
              <Settings
                className={`h-4 w-4 ${
                  activeMenu === "configuracoes"
                    ? "text-white"
                    : "text-black/70"
                }`}
              />
              <span>Configurações</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSwitchOperator}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13px] font-medium text-black/75 transition-colors hover:bg-black/5"
            >
              <ArrowLeftRight className="h-4 w-4 text-black/70" />
              <span>Trocar operador</span>
            </button>
          </div>

          <div className="mt-3 rounded-[8px] bg-[#f8f9fb] px-3 py-2 text-[11px] text-black/60">
            <span className="block font-semibold text-black">
              {currentOperator.name} (
              {formatOperatorRoleLabel(currentOperator.role)})
            </span>
            <span>{storeSettings.terminalName}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 p-5 lg:p-6">
        {activeMenu === "pdv" ? (
          <PdvScreen
            operatorName={currentOperator.name}
            terminalName={storeSettings.terminalName}
            isCashierOpen={isCashierOpen}
            catalog={posCatalog}
            bookletCustomers={customers}
            storeSettings={storeSettings}
            onRequestOpenCashier={() => setActiveMenu("caixa")}
            onRequestCloseCashier={() => setActiveMenu("caixa")}
            onFinishSale={handleFinishPdvSale}
          />
        ) : activeMenu === "caixa" ? (
          <CashierScreen
            operatorName={currentOperator.name}
            shiftSales={shiftSales}
            onShiftStatusChange={setIsCashierOpen}
          />
        ) : activeMenu === "estoque" ? (
          <InventoryScreen
            products={products}
            suppliers={suppliers}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onSaveSupplier={handleSaveSupplier}
          />
        ) : activeMenu === "fornecedores" ? (
          <SuppliersScreen
            suppliers={suppliers}
            products={products}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        ) : activeMenu === "caderneta" ? (
          <BookletScreen
            operatorName={currentOperator.name}
            companyName={storeSettings.nomeFantasia}
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onReceivePayment={handleReceiveBookletPayment}
          />
        ) : activeMenu === "configuracoes" ? (
          <SettingsScreen
            settings={storeSettings}
            operators={operators}
            onSaveSettings={setStoreSettings}
            onSaveOperator={(op, isEdit) => {
              setOperators((curr) =>
                isEdit
                  ? curr.map((item) => (item.id === op.id ? op : item))
                  : [...curr, op],
              );
              if (currentOperator.id === op.id) {
                setCurrentOperator(op);
              }
            }}
            onDeleteOperator={(opId) => {
              setOperators((curr) => curr.filter((item) => item.id !== opId));
            }}
          />
        ) : (
          <div className="mx-auto max-w-[1180px] space-y-5">
            {/* Header & Period Filter */}
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-semibold tracking-tight text-black">
                  Visão Geral &amp; Desempenho
                </h1>
                <p className="text-[13px] text-black/60">
                  Acompanhamento de vendas, lucro estimado e movimentação da loja.
                </p>
              </div>

              <div
                role="group"
                aria-label="Filtro de período"
                className="inline-flex items-center gap-1 rounded-[8px] bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              >
                {PERIOD_FILTERS.map((period) => {
                  const isSelected = selectedPeriod === period.id;

                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setSelectedPeriod(period.id)}
                      className={`h-[26px] rounded-[5px] px-3 text-[12px] font-semibold transition-colors ${
                        isSelected
                          ? "bg-[#203f9f]/85 text-white"
                          : "text-black/75 hover:bg-black/5"
                      }`}
                    >
                      {period.label}
                    </button>
                  );
                })}
              </div>
            </header>

            {/* 4 Metric Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.id}
                    className="relative overflow-hidden rounded-[8px] bg-white p-4 pl-6 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-[9px]"
                      style={{ backgroundColor: card.accentColor }}
                    />

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-[13px] font-semibold text-black/75">
                          {card.title}
                        </h2>
                        <p className="mt-1.5 text-[22px] font-semibold leading-none text-black">
                          {card.value}
                        </p>
                      </div>

                      <div
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px]"
                        style={{
                          backgroundColor: `${card.accentColor}33`,
                          color: card.accentColor,
                        }}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] font-medium text-black/45">
                      {card.subtitle}
                    </p>
                  </article>
                );
              })}
            </section>

            {/* Middle Panels: Payment Methods & ABC Curve */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left Panel: Recebimento por Meio de Pagamento */}
              <div className="rounded-[8px] border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] lg:col-span-5">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#203f9f]" />
                  <h2 className="text-[14px] font-semibold text-black">
                    Recebimento por Meio de Pagamento
                  </h2>
                </div>

                <div className="mt-5 space-y-4">
                  {dashboardData.paymentMethods.map((method) => {
                    const MethodIcon = getPaymentMethodIcon(method.id);
                    const clampedPct = Math.min(
                      100,
                      Math.max(0, method.percentage),
                    );

                    return (
                      <div key={method.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[13px]">
                          <div className="flex items-center gap-2 font-medium text-black/80">
                            <MethodIcon className="h-4 w-4 text-black/60" />
                            <span>{method.name}</span>
                          </div>

                          <div className="font-semibold text-black">
                            {formatCurrency(method.amount)}{" "}
                            <span className="font-normal text-black/50">
                              ({method.percentage}%)
                            </span>
                          </div>
                        </div>

                        <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#e5e7eb]">
                          <div
                            className="h-full rounded-full bg-[#203f9f] transition-all"
                            style={{ width: `${clampedPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Panel: Produtos Mais Vendidos (Curva ABC) */}
              <div className="flex flex-col rounded-[8px] border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] lg:col-span-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#ff8d28]" />
                    <h2 className="text-[14px] font-semibold text-black">
                      Produtos Mais Vendidos (Curva ABC)
                    </h2>
                  </div>

                  <span className="text-[11px] font-semibold text-black/45">
                    Classificação por receita
                  </span>
                </div>

                <div className="mt-4 flex-1 overflow-x-auto">
                  <table className="w-full min-w-[460px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-black/10 bg-[#f8f9fb] text-[12px] font-semibold text-black">
                        <th className="px-3 py-2.5">Produtos</th>
                        <th className="px-3 py-2.5">Categoria</th>
                        <th className="px-3 py-2.5 text-center">Qtd.</th>
                        <th className="px-3 py-2.5 text-right">Receita</th>
                        <th className="px-3 py-2.5 text-right">Lucro Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10 text-[13px]">
                      {dashboardData.bestSellingProducts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-12 text-center text-[13px] text-black/45"
                          >
                            Nenhuma venda registrada no período.
                          </td>
                        </tr>
                      ) : (
                        dashboardData.bestSellingProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-black/[0.02]">
                            <td className="px-3 py-2.5 font-medium text-black">
                              {product.name}
                            </td>
                            <td className="px-3 py-2.5 text-black/65">
                              {product.category}
                            </td>
                            <td className="px-3 py-2.5 text-center text-black/80">
                              {product.quantitySold}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-black">
                              {formatCurrency(product.revenue)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-[#16a34a]">
                              {formatCurrency(product.estimatedProfit)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Bottom Section: Histórico Detalhado de Vendas */}
            <section className="overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-3.5">
                <h2 className="text-[14px] font-semibold text-black">
                  Histórico Detalhado de Vendas
                </h2>
                <span className="text-[12px] font-semibold text-black/60">
                  {dashboardData.totalSales} registro(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black/10 bg-[#f8f9fb] text-[12px] font-semibold text-black">
                      <th className="px-5 py-2.5">Venda</th>
                      <th className="px-4 py-2.5">Data / Hora</th>
                      <th className="px-4 py-2.5">Operador</th>
                      <th className="px-4 py-2.5">Itens</th>
                      <th className="px-4 py-2.5">Pagamento</th>
                      <th className="px-4 py-2.5">Comprovante</th>
                      <th className="px-5 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 text-[13px]">
                    {dashboardData.sales.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-[13px] text-black/45"
                        >
                          Nenhuma venda registrada neste período.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-black/[0.02]">
                          <td className="px-5 py-3 font-medium text-black">
                            {sale.code}
                          </td>
                          <td className="px-4 py-3 text-black/70">
                            {sale.dateTime}
                          </td>
                          <td className="px-4 py-3 text-black/80">
                            {sale.operator}
                          </td>
                          <td className="px-4 py-3 text-black/80">
                            {sale.itemCount}
                          </td>
                          <td className="px-4 py-3 text-black/80">
                            {sale.paymentMethod}
                          </td>
                          <td className="px-4 py-3 text-black/70">
                            {sale.receiptStatus}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-black">
                            {formatCurrency(sale.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-5 py-3 text-[12px] text-black/60">
                <span>0 de {dashboardData.sales.length} linha(s) selecionadas</span>

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
          </div>
        )}
      </main>

      {/* Modal: Trocar Operador */}
      {isSwitchOperatorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={handleCloseSwitchOperator}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={switchDialogTitleId}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[333px] rounded-[15px] bg-white p-5 shadow-xl"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-[22px] w-[22px] shrink-0 text-[#0088ff]" />
                <h2
                  id={switchDialogTitleId}
                  className="text-[20px] font-semibold leading-tight text-black"
                >
                  Trocar Operador
                </h2>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={handleCloseSwitchOperator}
                className="rounded-md p-1 text-black/70 transition-colors hover:bg-black/5 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-1 text-[12px] text-black/60">
              Selecione o operador e digite a senha para continuar.
            </p>

            <form
              onSubmit={handleConfirmSwitchOperator}
              className="mt-4 space-y-4"
            >
              {/* Operator Selection List */}
              <div>
                <span className="block text-[14px] font-semibold text-black">
                  Operador
                </span>

                <div className="mt-1.5 space-y-2">
                  {operators.map((operator) => {
                    const isSelected = selectedOperatorId === operator.id;

                    return (
                      <button
                        key={operator.id}
                        type="button"
                        onClick={() => {
                          setSelectedOperatorId(operator.id);
                          setOperatorSwitchError(null);
                        }}
                        className={`flex h-[34px] w-full items-center justify-between rounded-[8px] border px-3 text-left text-[12px] font-semibold transition-colors ${
                          isSelected
                            ? "border-[#0088ff] bg-[#0088ff]/15 text-[#203f9f]"
                            : "border-black/30 bg-white text-black/70 hover:bg-black/[0.03]"
                        }`}
                      >
                        <span>
                          {operator.name} -{" "}
                          {formatOperatorRoleLabel(operator.role)}
                        </span>
                        {currentOperator.id === operator.id && (
                          <span className="text-[11px] font-semibold text-[#203f9f]">
                            Atual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="operator-switch-password"
                  className="flex items-center gap-1.5 text-[14px] font-semibold text-black"
                >
                  <Lock className="h-3.5 w-3.5 text-black/70" />
                  <span>Senha</span>
                </label>

                <input
                  id="operator-switch-password"
                  type="password"
                  value={operatorPassword}
                  onChange={(event) => {
                    setOperatorPassword(event.target.value);
                    if (operatorSwitchError) setOperatorSwitchError(null);
                  }}
                  placeholder="Digite a senha (ex: 123)"
                  className="mt-1.5 h-[34px] w-full rounded-[8px] border border-black/30 bg-white px-3 text-[12px] font-medium text-black placeholder:text-black/40 focus:border-[#0088ff] focus:outline-none"
                />

                {operatorSwitchError && (
                  <p className="mt-1.5 text-[11px] font-medium text-red-600">
                    {operatorSwitchError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="h-[34px] w-full rounded-[8px] bg-[#008f58] text-[14px] font-semibold text-white transition-colors hover:bg-[#007a4b]"
              >
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
