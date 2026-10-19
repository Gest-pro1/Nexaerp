"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";
import {
  EMPTY_MARKET_DASHBOARD,
  type DashboardPeriod,
  type MarketDashboardData,
  type PaymentMethodId,
} from "@/lib/market-dashboard";
import PdvScreen from "./pdv-screen";
import CashierScreen from "./cashier-screen";
import InventoryScreen from "./inventory-screen";
import BookletScreen from "./booklet-screen";
import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
  ShoppingCart,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";

const periods: { label: string; value: DashboardPeriod }[] = [
  { label: "Hoje", value: "today" },
  { label: "7 Dias", value: "7days" },
  { label: "30 Dias", value: "30days" },
  { label: "Geral", value: "all" },
];
const menuItems = [
  { label: "Início", Icon: LayoutGrid },
  { label: "PDV", Icon: ShoppingCart },
  { label: "Caixa", Icon: Wallet },
  { label: "Estoque", Icon: Boxes },
  { label: "Caderneta", Icon: BookOpen },
];

const paymentMethodStyles: Record<PaymentMethodId, { bar: string; text: string }> = {
  pix: { bar: "bg-emerald-500", text: "text-emerald-700" },
  "credit-card": { bar: "bg-blue-600", text: "text-blue-700" },
  "debit-card": { bar: "bg-violet-600", text: "text-violet-700" },
  cash: { bar: "bg-amber-500", text: "text-amber-700" },
  booklet: { bar: "bg-orange-800", text: "text-orange-800" },
};

const salesColumns = ["Código", "Data/Hora", "Operador", "Itens", "Pagamento", "NFC-E Sefaz", "Total"];
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function MercadosPadariasPage() {
  const [activePeriod, setActivePeriod] = useState<DashboardPeriod>("all");
  const [dashboard, setDashboard] = useState<MarketDashboardData>(EMPTY_MARKET_DASHBOARD);
  const [activeItem, setActiveItem] = useState("Início");
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [profile, setProfile] = useState({
    personName: "Usuário conectado",
    companyName: "Empresa",
    internalEmail: "",
  });

  useEffect(() => {
    const updateConnectionStatus = () => setIsOnline(navigator.onLine);
    const user = getUser();
    const company = user?.empresa ?? {};
    const personName = [
      user?.nome_completo,
      user?.nomeCompleto,
      user?.name,
      user?.nome,
      user?.responsavel_nome,
      user?.responsavelNome,
    ].find((value): value is string => typeof value === "string" && value.trim().length > 0);
    const companyName = [
      company?.razao_social,
      company?.razaoSocial,
      company?.nome,
      company?.name,
      user?.empresa_nome,
      user?.empresaNome,
      user?.razao_social,
      user?.razaoSocial,
    ].find((value): value is string => typeof value === "string" && value.trim().length > 0);
    const email =
      typeof user?.email === "string" && /^[^@\s]+@nexaerp\.com\.br$/i.test(user.email.trim())
        ? user.email.trim()
        : "";

    updateConnectionStatus();
    setProfile({
      personName: personName?.trim() ?? "Usuário conectado",
      companyName: companyName?.trim() ?? "Empresa",
      internalEmail: email,
    });
    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    return () => {
      window.removeEventListener("online", updateConnectionStatus);
      window.removeEventListener("offline", updateConnectionStatus);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[#f3f4f6] text-slate-800">
      {activeItem === "PDV" ? (
        <div className="group fixed inset-y-0 left-0 z-30 w-2 pointer-events-none">
          <span aria-hidden="true" className="absolute inset-0 pointer-events-auto" />
          <aside
            aria-label="Menu lateral"
            className="pointer-events-auto fixed inset-y-0 left-0 flex w-42 -translate-x-full flex-col border-r border-white/10 bg-[#1e3a8a] text-white transition-transform duration-200 ease-out group-hover:translate-x-0 group-focus-within:translate-x-0"
          >
            <div className="flex h-20 shrink-0 items-center justify-center border-b border-white/10">
              <Image
                src="/nova-logo.svg"
                alt="Nexa ERP"
                width={225}
                height={150}
                priority
                className="h-auto w-29.5 object-contain"
              />
            </div>
            <nav className="flex-1 pt-3" aria-label="Menu principal">
              <p className="px-4 pb-2 text-sm font-medium text-blue-200/80">Operação</p>
              <ul className="space-y-0.5">
                {menuItems.map(({ label, Icon }) => {
                  const isActive = activeItem === label;
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setActiveItem(label)}
                        className={`flex h-9 w-full items-center gap-3 px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${isActive ? "bg-[#3554aa] text-white" : "text-blue-200/75 hover:bg-white/10 hover:text-white"}`}
                      >
                        <Icon aria-hidden="true" className={`size-4.5 shrink-0 ${isActive ? "text-amber-400" : "text-blue-200/70"}`} strokeWidth={2} />
                        <span>{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="shrink-0 border-t border-white/20 py-3">
              <button type="button" className="flex h-9 w-full items-center gap-2 px-4 text-left text-[13px] text-blue-200/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400">
                <Settings aria-hidden="true" className="size-4.5 shrink-0" />
                <span>Configurações</span>
              </button>
              <button type="button" className="flex h-9 w-full items-center gap-2 px-4 text-left text-[13px] text-blue-200/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400">
                <LogOut aria-hidden="true" className="size-4.5 shrink-0" />
                <span>Troca operador</span>
              </button>
            </div>
          </aside>
        </div>
      ) : (
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-42 flex-col border-r border-white/10 bg-[#1e3a8a] text-white lg:flex">
        <div className="flex h-20 shrink-0 items-center justify-center border-b border-white/10">
          <Image
            src="/nova-logo.svg"
            alt="Nexa ERP"
            width={225}
            height={150}
            priority
            className="h-auto w-29.5 object-contain"
          />
        </div>
        <nav className="flex-1 pt-3" aria-label="Menu principal">
          <p className="px-4 pb-2 text-sm font-medium text-blue-200/80">Operação</p>
          <ul className="space-y-0.5">
            {menuItems.map(({ label, Icon }) => {
              const isActive = activeItem === label;
              return (
                <li key={label}>
                  <button
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveItem(label)}
                    className={`flex h-9 w-full items-center gap-3 px-4 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${isActive ? "bg-[#3554aa] text-white" : "text-blue-200/75 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon aria-hidden="true" className={`size-4.5 shrink-0 ${isActive ? "text-amber-400" : "text-blue-200/70"}`} strokeWidth={2} />
                    <span>{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="shrink-0 border-t border-white/20 py-3">
          <button type="button" className="flex h-9 w-full items-center gap-2 px-4 text-left text-[13px] text-blue-200/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400">
            <Settings aria-hidden="true" className="size-4.5 shrink-0" />
            <span>Configurações</span>
          </button>
          <button type="button" className="flex h-9 w-full items-center gap-2 px-4 text-left text-[13px] text-blue-200/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400">
            <LogOut aria-hidden="true" className="size-4.5 shrink-0" />
            <span>Troca operador</span>
          </button>
        </div>
      </aside>
      )}

      <div className={`min-h-dvh ${activeItem === "PDV" ? "" : "lg:ml-42"}`}>
      <header className="flex h-13.5 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-7">
        <label className="flex h-10 w-full max-w-[320px] items-center gap-2 rounded-md border border-slate-200 px-3 text-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
          <Search aria-hidden="true" className="size-4.5 shrink-0" />
          <input
            type="search"
            placeholder="Buscar produtos, clientes, vendas..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
            aria-label="Buscar produtos, clientes ou vendas"
          />
        </label>

        <div className="ml-3 flex shrink-0 items-center gap-3 sm:gap-7">
          <span
            role="status"
            aria-live="polite"
            title={
              isOnline === null
                ? "Verificando conexão"
                : isOnline
                  ? "Internet disponível"
                  : "Sem internet: PDV aberto neste computador"
            }
            className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium sm:flex ${
              isOnline === null
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : isOnline
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {isOnline === false ? (
              <WifiOff aria-hidden="true" className="size-3.5" />
            ) : (
              <Wifi aria-hidden="true" className="size-3.5" />
            )}
            {isOnline === null
              ? "Verificando..."
              : isOnline
                ? "PDV Online"
                : "PDV Local"}
          </span>
          <button
            type="button"
            aria-label="Notificações: 0"
            className="relative rounded-md p-1.5 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Bell aria-hidden="true" className="size-4.5" />
            <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-semibold text-white">0</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={`Conta de ${profile.personName}, ${profile.companyName}`}
          >
            <span className="hidden sm:block">
              <span className="block text-xs font-medium leading-4 text-slate-800">{profile.personName}</span>
              <span className="block text-[10px] leading-3 text-slate-500">
                {profile.internalEmail || profile.companyName}
              </span>
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-rose-800 text-[10px] font-bold text-white">{getInitials(profile.personName)}</span>
            <ChevronDown aria-hidden="true" className="hidden size-3.5 text-slate-500 sm:block" />
          </button>
        </div>
      </header>

      <main className={activeItem === "PDV" ? "h-[calc(100dvh-54px)]" : "mx-auto max-w-400 px-5 pb-5 pt-4 sm:px-7"}>
        <div hidden={activeItem !== "Caixa"}>
          <CashierScreen operatorName={profile.personName} />
        </div>
        <div hidden={activeItem !== "Estoque"}>
          <InventoryScreen />
        </div>
        <div hidden={activeItem !== "Caderneta"}>
          <BookletScreen operatorName={profile.personName} />
        </div>
        {activeItem === "PDV" ? (
          <PdvScreen operatorName={profile.personName} />
        ) : (
        <div hidden={activeItem === "Caixa" || activeItem === "Estoque" || activeItem === "Caderneta"}>
        <>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold leading-7 text-blue-800">
              Painel de Desempenho e Relatórios Financeiros
            </h1>
            <p className="text-[11px] text-slate-500">
              Análise em tempo real de faturamento, margem de lucro líquido, curva ABC e formas de recebimento.
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1" aria-label="Período do painel">
            {periods.map((period) => (
              <button
                key={period.value}
                type="button"
                aria-pressed={activePeriod === period.value}
                onClick={() => setActivePeriod(period.value)}
                className={`rounded-md px-3 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${activePeriod === period.value ? "bg-blue-600 font-medium text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <section aria-label="Indicadores do período" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="min-h-26 rounded-md bg-orange-500 p-4 text-white">
            <p className="text-xs">Faturamento Atual</p>
            <p className="mt-1 text-2xl font-semibold leading-7">{formatCurrency(dashboard.metrics.revenue)}</p>
            <p className="mt-2 text-[10px]">{dashboard.metrics.salesCount} vendas no período</p>
          </article>
          <article className="min-h-26 rounded-md bg-green-600 p-4 text-white">
            <p className="text-xs">Lucro Bruto</p>
            <p className="mt-1 text-2xl font-semibold leading-7">{formatCurrency(dashboard.metrics.grossProfit)}</p>
            <p className="mt-2 text-[10px]">Margem Média: {dashboard.metrics.averageProfitMargin}%</p>
          </article>
          <article className="min-h-26 rounded-md bg-indigo-600 p-4 text-white">
            <p className="text-xs">Total de Itens Vendidos</p>
            <p className="mt-1 text-2xl font-semibold leading-7">{dashboard.metrics.itemsSold}</p>
            <p className="mt-2 text-[10px]">Média de {dashboard.metrics.averageItemsPerSale} por venda</p>
          </article>
          <article className="min-h-26 rounded-md bg-sky-600 p-4 text-white">
            <p className="text-xs">Vendas na Caderneta</p>
            <p className="mt-1 text-2xl font-semibold leading-7">{formatCurrency(dashboard.metrics.bookletRevenue)}</p>
            <p className="mt-2 text-[10px]">{dashboard.metrics.bookletRevenuePercentage}% do faturamento</p>
          </article>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.95fr_1.5fr]">
          <article className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-700">
              <Wallet aria-hidden="true" className="size-4.5 text-sky-500" />
              Recebimento por Meio de Pagamento
            </h2>
            <ul className="space-y-2">
              {dashboard.paymentMethods.map((method) => (
                <li key={method.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span>{method.name}</span>
                    <span className={paymentMethodStyles[method.id].text}>
                      {formatCurrency(method.amount)} ({method.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${paymentMethodStyles[method.id].bar}`}
                      style={{ width: `${Math.min(Math.max(method.percentage, 0), 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                <BarChart3 aria-hidden="true" className="size-4.5 text-sky-500" />
                Produtos Mais Vendidos (Curva ABC)
              </h2>
              <span className="text-[9px] text-slate-500">
                {dashboard.bestSellingProducts.length} produto(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-130 text-left text-[10px]">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 font-medium">Categoria</th>
                    <th className="px-3 py-2 font-medium">Qtd Vendida</th>
                    <th className="px-3 py-2 font-medium">Faturamento</th>
                    <th className="px-3 py-2 font-medium">Lucro Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.bestSellingProducts.length > 0 ? (
                    dashboard.bestSellingProducts.map((product) => (
                      <tr key={product.id} className="border-t border-slate-100">
                        <td className="whitespace-nowrap px-4 py-2">{product.name}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">{product.category}</td>
                        <td className="whitespace-nowrap px-3 py-2">{product.quantitySold} un</td>
                        <td className="whitespace-nowrap px-3 py-2">{formatCurrency(product.revenue)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-emerald-700">{formatCurrency(product.estimatedProfit)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-slate-100">
                      <td colSpan={5} className="px-4 py-8 text-center text-[11px] text-slate-500">
                        Nenhum produto vendido neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm" aria-labelledby="sales-history-heading">
          <h2 id="sales-history-heading" className="px-4 py-3 text-[13px] font-semibold text-slate-700">
            Histórico Detalhado de Vendas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-[10px]">
              <thead className="border-y border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  {salesColumns.map((column) => (
                    <th key={column} className="px-5 py-2 font-medium">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.sales.length > 0 ? (
                  dashboard.sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-slate-100">
                      <td className="px-5 py-2 text-blue-700">{sale.code}</td>
                      <td className="px-5 py-2">{sale.dateTime}</td>
                      <td className="px-5 py-2">{sale.operator}</td>
                      <td className="px-5 py-2">{sale.itemCount} produto(s)</td>
                      <td className="px-5 py-2">{sale.paymentMethod}</td>
                      <td className="px-5 py-2 text-emerald-700">{sale.receiptStatus}</td>
                      <td className="px-5 py-2">{formatCurrency(sale.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={salesColumns.length} className="px-5 py-10 text-center text-[11px] text-slate-500">
                      Nenhuma venda registrada neste período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 text-[10px] text-slate-500">
            <span>{dashboard.totalSales} venda(s) no período</span>
            <div className="flex gap-2">
              <button type="button" disabled className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
              <button type="button" disabled className="rounded border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50">Próximo</button>
            </div>
          </div>
        </section>
        </>
        </div>
        )}
      </main>
      </div>
    </div>
  );
}
