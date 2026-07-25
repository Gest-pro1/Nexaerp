"use client";
import React from "react";
import AdminLayout from "../../components/ManuPage";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
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
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CreditCardIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

// Badge de período, estilo "dropdown" (Select/Popover trigger do shadcn/ui)
const PeriodBadge = ({ children }: { children: React.ReactNode }) => (
  <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground border rounded-md px-3 py-1.5 hover:bg-accent transition-colors">
    <CalendarIcon className="w-3.5 h-3.5" />
    {children}
  </button>
);

// Badge de status das mensalidades
const StatusBadge = ({ status }: { status: "Pago" | "Atrasado" | "Aguardando" }) => {
  const styles: Record<string, string> = {
    Pago: "bg-emerald-100 text-emerald-700",
    Atrasado: "bg-red-100 text-red-600",
    Aguardando: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
};

// Barra de progresso simples, colorida por métrica
const ProgressBar = ({ value, color }: { value: number; color: string }) => (
  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
  </div>
);

// Avatar circular simples para as empresas da tabela
const CompanyAvatar = ({ letter, color }: { letter: string; color: string }) => (
  <div
    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
    style={{ backgroundColor: color }}
  >
    {letter}
  </div>
);

// Config do gráfico de Evolução Receita x Custos
const evolucaoConfig = {
  receita: {
    label: "Receita",
    color: "#4c1d95",
  },
  custos: {
    label: "Custos",
    color: "#c4b5fd",
  },
} satisfies ChartConfig;

const Receita = () => {
  // Dados para o gráfico de evolução receita x custos (dia do mês)
  const evolucaoData = [
    { dia: 1, receita: 9000000, custos: 6500000 },
    { dia: 4, receita: 12500000, custos: 6200000 },
    { dia: 7, receita: 15800000, custos: 6800000 },
    { dia: 10, receita: 14200000, custos: 6400000 },
    { dia: 13, receita: 18550680, custos: 6900000 },
    { dia: 16, receita: 22000000, custos: 6600000 },
    { dia: 19, receita: 33500000, custos: 7100000 },
    { dia: 22, receita: 24000000, custos: 6800000 },
    { dia: 25, receita: 27500000, custos: 7200000 },
    { dia: 28, receita: 20000000, custos: 6900000 },
    { dia: 30, receita: 22500000, custos: 7000000 },
  ];

  // Cards de KPIs
  const kpiCards = [
    {
      titulo: "Receita Confirmada",
      valor: "R$7.684,41",
      icon: CheckCircleIcon,
      bgColor: "bg-orange-500",
      percentual: "Pagamentos realizados este mês",
    },
    {
      titulo: "A Receber",
      valor: "R$5.654,52",
      icon: ClockIcon,
      bgColor: "bg-fuchsia-600",
      percentual: "Boletos/Faturas emitidos",
    },
    {
      titulo: "Inadimplência",
      valor: "R$129.98",
      icon: ExclamationCircleIcon,
      bgColor: "bg-indigo-500",
      percentual: "Vencidos há mais de 5 dias",
    },
    {
      titulo: "Projeção Total",
      valor: "R$ 12.984,65",
      icon: CreditCardIcon,
      bgColor: "bg-cyan-500",
      percentual: "Potencial total do mês",
    },
  ];

  // Indicadores de saúde financeira
  const saudeFinanceira = [
    {
      titulo: "Meta de MMR",
      variacao: "+12% vs mês anterior",
      descricao: "84% da meta atingida",
      valor: "R$12.500",
      progresso: 84,
      cor: "#4338ca",
    },
    {
      titulo: "Entradas",
      variacao: "+8% vs mês anterior",
      descricao: "Assinaturas + Taxas",
      valor: "R$10.984,65",
      progresso: 70,
      cor: "#22c55e",
    },
    {
      titulo: "Custos",
      variacao: "-2% vs mês anterior",
      descricao: "Servidores + Api",
      valor: "R$450,00",
      progresso: 15,
      cor: "#ef4444",
    },
    {
      titulo: "Lucro Líquido",
      variacao: "+5% vs last month",
      descricao: "Margem: 40%",
      valor: "R$550,00",
      progresso: 55,
      cor: "#3b82f6",
    },
  ];

  // Últimas mensalidades cobradas
  const mensalidades: {
    empresa: string;
    letra: string;
    cor: string;
    plano: string;
    vencimento: string;
    valor: string;
    status: "Pago" | "Atrasado" | "Aguardando";
  }[] = [
    { empresa: "Mercado Bom Preço", letra: "M", cor: "#f97316", plano: "Premium +", vencimento: "Nov 30, 2025", valor: "R$249.00", status: "Atrasado" },
    { empresa: "Queixo Burguer", letra: "Q", cor: "#eab308", plano: "Premium +", vencimento: "Dez 10, 2025", valor: "R$249.00", status: "Pago" },
    { empresa: "Bony Costa Barbearia", letra: "B", cor: "#111827", plano: "Standart", vencimento: "Dez 10, 2025", valor: "R$69.90", status: "Pago" },
    { empresa: "Cestão", letra: "C", cor: "#0ea5e9", plano: "Profissional", vencimento: "Dez 20, 2025", valor: "R$129.90", status: "Aguardando" },
    { empresa: "Padaria Vitória", letra: "P", cor: "#dc2626", plano: "Profissional", vencimento: "Jul 25, 2025", valor: "R$129.90", status: "Pago" },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-700">Dashboard</h1>
            <p className="text-gray-600">Acompanhamento de mensalidades e fluxo de caixa da plataforma</p>
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
                  <p className="text-xs mt-3 opacity-80">{card.percentual}</p>
                </div>
              );
            })}
          </div>

          {/* Evolução Receita x Custos + Saúde Financeira */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-indigo-900">Evolução Receita x Custos</CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">Mês de provisões</span>
                  <PeriodBadge>Dezembro 2025</PeriodBadge>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={evolucaoConfig} className="h-[280px] w-full">
                  <AreaChart accessibilityLayer data={evolucaoData} margin={{ left: 12, right: 12, top: 20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" labelFormatter={() => "Este mês"} />}
                    />
                    <ReferenceLine x={13} stroke="#c7d2fe" strokeDasharray="4 4" />
                    <Area
                      dataKey="custos"
                      type="natural"
                      fill="none"
                      stroke="var(--color-custos)"
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="receita"
                      type="natural"
                      fill="var(--color-receita)"
                      fillOpacity={0.08}
                      stroke="var(--color-receita)"
                      strokeWidth={3}
                    />
                    <ReferenceDot x={13} y={18550680} r={5} fill="#4c1d95" stroke="white" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Saúde Financeira</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {saudeFinanceira.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">{item.titulo}</span>
                      <span className="text-xs font-medium text-emerald-600">{item.variacao}</span>
                    </div>
                    <ProgressBar value={item.progresso} color={item.cor} />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-gray-400">{item.descricao}</span>
                      <span className="text-xs font-semibold text-gray-900">{item.valor}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Últimas Mensalidades */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Últimas Mensalidades</CardTitle>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs">
                    <th className="font-medium px-6 py-2">Empresa</th>
                    <th className="font-medium px-6 py-2">Plano</th>
                    <th className="font-medium px-6 py-2">Vencimento</th>
                    <th className="font-medium px-6 py-2">Valor</th>
                    <th className="font-medium px-6 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mensalidades.map((item, index) => (
                    <tr key={index} className={index % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <CompanyAvatar letter={item.letra} color={item.cor} />
                          <span className="font-medium text-gray-800">{item.empresa}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{item.plano}</td>
                      <td className="px-6 py-3 text-gray-600">{item.vencimento}</td>
                      <td className="px-6 py-3 text-gray-800 font-medium">{item.valor}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Receita;