"use client";
import React from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../components/ManuPage";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ShieldCheckIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

// Badge de período, estilo "dropdown" (Select/Popover trigger do shadcn/ui)
const PeriodBadge = ({ children }: { children: React.ReactNode }) => (
  <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-accent transition-colors">
    <CalendarIcon className="w-3.5 h-3.5" />
    {children}
  </button>
);

// Config do gráfico de Crescimento de Assinantes
const crescimentoConfig = {
  assinantes: {
    label: "Assinantes",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

// Config do gráfico de Movimentação de MMR
const mmrConfig = {
  vendas: {
    label: "Vendas",
    color: "#22c55e",
  },
  cancelamentos: {
    label: "Cancelamentos",
    color: "#ef4444",
  },
} satisfies ChartConfig;

// Config do gráfico radial de Clientes por Plano
const planosConfig = {
  value: {
    label: "Clientes",
  },
} satisfies ChartConfig;

const Estatisticas = () => {
  const router = useRouter();

  // Dados para o gráfico de crescimento de assinantes
  const crescimentoData = [
    { mes: "Jan", assinantes: 600 },
    { mes: "Fev", assinantes: 550 },
    { mes: "Mar", assinantes: 750 },
    { mes: "Abr", assinantes: 700 },
    { mes: "Mai", assinantes: 820 },
    { mes: "Jun", assinantes: 850 },
    { mes: "Jul", assinantes: 868 },
  ];

  // Dados para o gráfico de movimentação de MMR
  const mmrData = [
    { dia: "01", vendas: 4000, cancelamentos: 2400 },
    { dia: "02", vendas: 3000, cancelamentos: 1398 },
    { dia: "03", vendas: 2000, cancelamentos: 9800 },
    { dia: "04", vendas: 2780, cancelamentos: 3908 },
    { dia: "05", vendas: 1890, cancelamentos: 4800 },
    { dia: "06", vendas: 2390, cancelamentos: 3800 },
    { dia: "07", vendas: 3490, cancelamentos: 4300 },
    { dia: "08", vendas: 2000, cancelamentos: 1800 },
    { dia: "09", vendas: 2780, cancelamentos: 3908 },
    { dia: "10", vendas: 1890, cancelamentos: 4800 },
    { dia: "11", vendas: 2390, cancelamentos: 3800 },
    { dia: "12", vendas: 3490, cancelamentos: 4300 },
  ];

  // Dados para o gráfico radial de clientes por plano
  const planosData = [
    { name: "Standart", value: 30, fill: "#9333EA" },
    { name: "Profissional", value: 50, fill: "#3B82F6" },
    { name: "Premium +", value: 20, fill: "#06B6D4" },
  ];

  // Cards de KPIs
  const kpiCards = [
    {
      titulo: "MRR (Receita Mensal)",
      valor: "R$12.234,56",
      icon: CurrencyDollarIcon,
      bgColor: "bg-orange-500",
      percentual: "+10.5% vs mês anterior",
      trend: "up",
    },
    {
      titulo: "Assinantes Ativos",
      valor: "850",
      icon: UsersIcon,
      bgColor: "bg-fuchsia-600",
      percentual: "-5.8% vs mês anterior",
      trend: "down",
    },
    {
      titulo: "Ticket Médio",
      valor: "R$99.90",
      icon: ArrowTrendingUpIcon,
      bgColor: "bg-indigo-500",
      percentual: "+12.7% vs mês anterior",
      trend: "up",
    },
    {
      titulo: "Solicitações Pendentes",
      valor: "3",
      icon: ExclamationTriangleIcon,
      bgColor: "bg-cyan-500",
      percentual: "Pendentes de aprovação",
      trend: "neutral",
    },
  ];

  // Dados de acesso rápido com links
  const acessoRapido = [
    {
      titulo: "Gerenciar Licenças",
      descricao: "Aprovar ou bloquear empresas",
      icon: ShieldCheckIcon,
      href: "/Admin",
    },
    {
      titulo: "Configurar Planos",
      descricao: "Alterar preços e recursos",
      icon: Cog6ToothIcon,
      href: "/Admin/gear",
    },
    {
      titulo: "Financeiro",
      descricao: "Ver inadimplência e receita",
      icon: CreditCardIcon,
      href: "/Admin/Receitas",
    },
    {
      titulo: "Aprovar Cadastros",
      descricao: "Ver fila de solicitações",
      icon: UserPlusIcon,
      href: "/Admin",
    },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Bem-vindo de Volta! Aqui está a visão geral do sistema GetsPro.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className={`${card.bgColor} relative rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
                >
                  <div className="absolute top-5 right-5 w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium opacity-90 pr-10">{card.titulo}</p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">{card.valor}</p>
                  <p className="text-xs mt-3 opacity-80 flex items-center gap-1">
                    {card.trend === "up" && <span>↑</span>}
                    {card.trend === "down" && <span>↓</span>}
                    {card.percentual}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Gráficos - Primeira Linha */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Crescimento de Assinantes */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Crescimento de Assinantes</CardTitle>
                  <CardDescription>Evolução mensal de novos cadastros</CardDescription>
                </div>
                <PeriodBadge>Março 2025</PeriodBadge>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-gray-900">868</p>
                  <p className="text-sm text-gray-500">Total cadastrado</p>
                </div>
                <ChartContainer config={crescimentoConfig} className="h-[280px] w-full">
                  <AreaChart
                    accessibilityLayer
                    data={crescimentoData}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="mes"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      dataKey="assinantes"
                      type="natural"
                      fill="var(--color-assinantes)"
                      fillOpacity={0.15}
                      stroke="var(--color-assinantes)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Clientes por Plano */}
            <Card>
              <CardHeader>
                <CardTitle>Clientes por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <ChartContainer config={planosConfig} className="h-[230px] w-full">
                    <RadialBarChart
                      data={planosData}
                      innerRadius="35%"
                      outerRadius="100%"
                      barSize={12}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <RadialBar background={{ fill: "#f3f4f6" }} dataKey="value" cornerRadius={8} />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-900">850</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {planosData.map((plano, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plano.fill }}></div>
                        <span className="text-sm text-gray-700">{plano.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{plano.value}% ↗</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos - Segunda Linha */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Movimentação de MMR */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Movimentação de MMR</CardTitle>
                  <CardDescription>Novas vendas e cancelamentos</CardDescription>
                </div>
                <PeriodBadge>1-12 Dez, 2025</PeriodBadge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mb-2">Vendas e cancelamentos de 1-12 Dez, 2025</p>
                <ChartContainer config={mmrConfig} className="h-[280px] w-full">
                  <BarChart accessibilityLayer data={mmrData} barGap={4}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="vendas" fill="var(--color-vendas)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="cancelamentos" fill="var(--color-cancelamentos)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ChartContainer>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Vendas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Cancelamentos
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Acesso Rápido */}
            <Card>
              <CardHeader>
                <CardTitle>Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {acessoRapido.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => router.push(item.href)}
                        className="w-full rounded-lg p-3 flex items-center gap-3 hover:bg-accent transition-colors text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.titulo}</p>
                          <p className="text-xs text-gray-500">{item.descricao}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Estatisticas;