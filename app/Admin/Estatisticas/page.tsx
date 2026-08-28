"use client";
import React, { useEffect, useState } from "react";
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
import { api } from "@/lib/api";
import {
  ADMIN_DATA_UPDATED_EVENT,
  formatCurrency,
  parseCurrency,
  type EmpresaAdmin,
} from "../../../lib/admin-data";

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
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [statsData, empresasRes] = await Promise.allSettled([
          api.admin.stats(),
          api.empresas.list({ limit: 100 }),
        ]);

        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        }

        if (empresasRes.status === "fulfilled" && empresasRes.value?.data) {
          const mapped: EmpresaAdmin[] = empresasRes.value.data.map((e: any) => {
            const raw = (e.status || "").toLowerCase();
            let status: EmpresaAdmin["status"] = "pendente";
            if (raw === "ativa" || raw === "active" || raw === "ativo") status = "ativa";
            else if (raw === "bloqueado" || raw === "blocked") status = "bloqueado";
            else if (raw === "inativa" || raw === "inactive" || raw === "suspended") status = "inativa";

            return {
              id: e.id,
              nome: e.razao_social,
              cnpj: e.cnpj,
              plano: e.planos?.nome || e.plano_id || "Profissional",
              responsavel: e.responsavel_nome,
              email: e.email,
              status,
              dataCobranca: e.data_cobranca ? new Date(e.data_cobranca).toLocaleDateString("pt-BR") : "",
              valor: `R$ ${(e.planos?.preco_mensal || 129.9).toFixed(2).replace(".", ",")}`,
              cor: "bg-blue-600",
              cidade: e.cidade,
              uf: e.uf,
              telefone: e.telefone,
            };
          });
          setEmpresas(mapped);
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const empresasAtivas = empresas.filter((empresa) => empresa.status === "ativa");
  const empresasBloqueadas = empresas.filter((empresa) => empresa.status === "bloqueado");
  const empresasPendentes = empresas.filter((empresa) => empresa.status === "pendente");
  const mrr = stats?.mrr ?? empresasAtivas.reduce((total, empresa) => total + parseCurrency(empresa.valor), 0);
  const ticketMedio = stats?.ticketMedio ?? (empresasAtivas.length ? mrr / empresasAtivas.length : 0);
  type PlanoData = { name: string; value: number; fill: string };
  const planosData: PlanoData[] = stats?.planoDistribuicao?.length
    ? stats.planoDistribuicao.map((p: any, idx: number) => ({
        name: String(p.nome),
        value: Number(p.quantidade) || 0,
        fill: ["#9333EA", "#3B82F6", "#06B6D4", "#F59E0B"][idx % 4],
      }))
    : [
        { name: "Standart", value: empresas.filter((empresa) => empresa.plano?.includes("Standart") || empresa.plano?.includes("Start")).length, fill: "#9333EA" },
        { name: "Profissional", value: empresas.filter((empresa) => empresa.plano?.includes("Profissional") || empresa.plano?.includes("Pro")).length, fill: "#3B82F6" },
        { name: "Premium +", value: empresas.filter((empresa) => empresa.plano?.includes("Premium")).length, fill: "#06B6D4" },
      ];

  // Dados para o gráfico de crescimento de assinantes
  const crescimentoData = [
    { mes: "Anterior", assinantes: Math.max(0, empresas.length - 2) },
    { mes: "Atual", assinantes: stats?.totalEmpresas ?? empresas.length },
  ];

  // Dados para o gráfico de movimentação de MMR
  const mmrData = [
    { dia: "Mês Anterior", vendas: mrr * 0.9, cancelamentos: 0 },
    { dia: "Atual", vendas: mrr, cancelamentos: stats?.empresasBloqueadas ?? empresasBloqueadas.length },
  ];

  // Cards de KPIs
  const kpiCards = [
    {
      titulo: "MRR (Receita Mensal)",
      valor: formatCurrency(mrr),
      icon: CurrencyDollarIcon,
      bgColor: "bg-orange-500",
      percentual: "Empresas ativas",
      trend: "neutral",
    },
    {
      titulo: "Assinantes Ativos",
      valor: String(empresasAtivas.length),
      icon: UsersIcon,
      bgColor: "bg-fuchsia-600",
      percentual: "Licenças ativas",
      trend: "neutral",
    },
    {
      titulo: "Ticket Médio",
      valor: formatCurrency(ticketMedio),
      icon: ArrowTrendingUpIcon,
      bgColor: "bg-indigo-500",
      percentual: "Média por licença ativa",
      trend: "up",
    },
    {
      titulo: "Solicitações Pendentes",
      valor: String(empresasPendentes.length),
      icon: ExclamationTriangleIcon,
      bgColor: "bg-cyan-500",
      percentual: `${empresasBloqueadas.length} bloqueadas`,
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
                  <p className="text-3xl font-bold text-gray-900">{empresas.length}</p>
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
                    <span className="text-2xl font-bold text-gray-900">{empresas.length}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {planosData.map((plano, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plano.fill }}></div>
                        <span className="text-sm text-gray-700">{plano.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {empresas.length ? Math.round((plano.value / empresas.length) * 100) : 0}%
                      </span>
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