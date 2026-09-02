"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  CheckIcon,
  BuildingStorefrontIcon,
  CakeIcon,
  ScissorsIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  CubeIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  getUser,
  getUserModule,
  setUserModule,
  getUserStatus,
  isAuthenticated,
  logout,
  normalizeModuleId,
} from "@/lib/auth";
import { api } from "@/lib/api";

interface ModuleOption {
  id: string;
  alias: string[];
  title: string;
  segmentTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  features: string[];
  stats: { label: string; value: string; hint: string }[];
  quickActions: { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[];
}

const MODULES: ModuleOption[] = [
  {
    id: "lojas-varejo",
    alias: ["lojas", "lojas-varejo", "varejo", "loja"],
    title: "Lojas e Varejo",
    segmentTitle: "Comércio, Roupas e Variedades",
    description: "Controle de estoque, vendas rápidas e PDV ágil para comércio.",
    icon: BuildingStorefrontIcon,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    accentColor: "border-blue-600 ring-blue-500/20 bg-blue-50/50",
    features: [
      "Frente de Caixa (PDV) de alta velocidade",
      "Controle de grade de cores e tamanhos",
      "Emissão de NFC-e, NF-e e Cupom Fiscal",
      "Gestão de crediário e controle de clientes",
    ],
    stats: [
      { label: "Vendas de Hoje", value: "R$ 4.850,00", hint: "+18% vs ontem" },
      { label: "Itens em Estoque", value: "1.248 un", hint: "Reposição em dia" },
      { label: "Pedidos Atendidos", value: "42 vendas", hint: "PDV 01 e 02" },
      { label: "Ticket Médio", value: "R$ 115,40", hint: "Meta diária batida" },
    ],
    quickActions: [
      { label: "Abrir PDV / Caixa", desc: "Iniciar nova venda rápida no balcão", icon: ShoppingCartIcon },
      { label: "Cadastrar Produto", desc: "Adicionar item com grade e código", icon: CubeIcon },
      { label: "Controle de Estoque", desc: "Ajustar quantidades e reposições", icon: DocumentTextIcon },
      { label: "Relatório de Vendas", desc: "Consultar fechamento e faturamento", icon: ReceiptPercentIcon },
    ],
  },
  {
    id: "bares-restaurantes",
    alias: ["bares", "bares-restaurantes", "restaurante", "bar", "comida"],
    title: "Bares e Restaurantes",
    segmentTitle: "Gastronomia, Mesas e Delivery",
    description: "Gestão de mesas, comandas eletrônicas, KDS e delivery.",
    icon: CakeIcon,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
    accentColor: "border-rose-600 ring-rose-500/20 bg-rose-50/50",
    features: [
      "Mapa interativo de mesas e comandas",
      "Painel de pedidos da cozinha (KDS)",
      "Integração para balcão e delivery",
      "Controle de insumos e fichas técnicas",
    ],
    stats: [
      { label: "Mesas Ocupadas", value: "14 / 20", hint: "70% de lotação" },
      { label: "Comandas Abertas", value: "18 ativas", hint: "Tempo médio 32m" },
      { label: "Pedidos na Cozinha", value: "6 pedidos", hint: "Fila em ordem" },
      { label: "Faturamento Turno", value: "R$ 3.920,00", hint: "Almoço e Jantar" },
    ],
    quickActions: [
      { label: "Mapa de Mesas", desc: "Visualizar mesas e comandas abertas", icon: BuildingStorefrontIcon },
      { label: "Lançar Pedido", desc: "Adicionar itens na comanda do cliente", icon: DocumentTextIcon },
      { label: "Painel Cozinha (KDS)", desc: "Acompanhar fila de preparo", icon: ClockIcon },
      { label: "Fechar Conta / Caixa", desc: "Receber pagamentos e emitir cupom", icon: CurrencyDollarIcon },
    ],
  },
  {
    id: "saloes-barbearias",
    alias: ["saloes", "saloes-barbearias", "salao", "barbearia", "estetica"],
    title: "Salões e Barbearias",
    segmentTitle: "Beleza, Estética e Barbearia",
    description: "Agenda inteligente, controle de comissões e pacotes de serviços.",
    icon: ScissorsIcon,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
    accentColor: "border-violet-600 ring-violet-500/20 bg-violet-50/50",
    features: [
      "Agenda digital por profissional",
      "Cálculo automático de comissões",
      "Histórico de preferências de clientes",
      "Venda de produtos e pacotes de serviços",
    ],
    stats: [
      { label: "Agendamentos Hoje", value: "22 horários", hint: "4 horários livres" },
      { label: "Profissionais Ativos", value: "5 no turno", hint: "100% disponíveis" },
      { label: "Atendimentos Feitos", value: "14 concluídos", hint: "Satisfação 4.9★" },
      { label: "Faturamento Hoje", value: "R$ 2.450,00", hint: "Comissões em dia" },
    ],
    quickActions: [
      { label: "Agenda do Dia", desc: "Ver horários e agendar clientes", icon: ClockIcon },
      { label: "Novo Atendimento", desc: "Registrar serviço e vincular barbeiro/cabeleireiro", icon: SparklesIcon },
      { label: "Comissões da Equipe", desc: "Relatório de repasses e metas", icon: CurrencyDollarIcon },
      { label: "Cadastro de Cliente", desc: "Ficha de histórico e preferências", icon: UserCircleIcon },
    ],
  },
  {
    id: "mercados-padarias",
    alias: ["mercados", "mercados-padarias", "mercado", "padaria", "mercearia"],
    title: "Mercados e Padarias",
    segmentTitle: "Supermercados, Padarias e Mercearias",
    description: "Agilidade no caixa, integração com balança e alto fluxo de clientes.",
    icon: ShoppingCartIcon,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
    accentColor: "border-emerald-600 ring-emerald-500/20 bg-emerald-50/50",
    features: [
      "PDV otimizado para leitor de código de barras",
      "Integração nativa com balanças de pesagem",
      "Controle de lotes e alertas de validade",
      "Sangria, suprimento e múltiplos caixas",
    ],
    stats: [
      { label: "Cupons Emitidos", value: "158 vendas", hint: "Alto fluxo no caixa" },
      { label: "Caixas em Operação", value: "2 caixas", hint: "Caixa 01 e 02" },
      { label: "Alertas de Validade", value: "3 lotes", hint: "Atenção reposição" },
      { label: "Faturamento Hoje", value: "R$ 6.180,00", hint: "Meta superada" },
    ],
    quickActions: [
      { label: "Iniciar Caixa PDV", desc: "Frente de caixa com balança e leitor", icon: ShoppingCartIcon },
      { label: "Tabela de Preços / Balança", desc: "Atualizar preços e código de barras", icon: DocumentTextIcon },
      { label: "Validades e Lotes", desc: "Conferir produtos próximos ao vencimento", icon: ExclamationTriangleIcon },
      { label: "Fechamento de Caixa", desc: "Conferência de gaveta e sangria", icon: CurrencyDollarIcon },
    ],
  },
];

function MenuModulosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<any>(() => (typeof window !== "undefined" ? getUser() : null));
  const [activeModuleId, setActiveModuleId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return getUserModule() || "lojas-varejo";
    }
    return "lojas-varejo";
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return getUserModule() || "lojas-varejo";
    }
    return "lojas-varejo";
  });
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [showOnlySubscribed, setShowOnlySubscribed] = useState(true);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<string>(() => (typeof window !== "undefined" ? getUserStatus() || "ativa" : "ativa"));
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  useEffect(() => {
    // 1. Verificação de Autenticação
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const user = getUser();
    setCurrentUser(user);

    // 2. Identificar o módulo assinado pelo cliente
    const queryModule = searchParams.get("modulo") || searchParams.get("segmento") || searchParams.get("tipoNegocio");
    const userStoredModule = getUserModule();
    const resolvedRaw = queryModule || userStoredModule || user?.tipo_negocio || user?.tipoNegocio || user?.modulo || user?.segmento || "lojas-varejo";
    const canonicalId = normalizeModuleId(resolvedRaw) || "lojas-varejo";

    setActiveModuleId(canonicalId);
    setSelectedModuleId(canonicalId);
    setUserModule(canonicalId);

    // 3. Status de Ativação / Validação
    const status = getUserStatus() || user?.status || "ativa";
    setAccountStatus(status);

    // 4. Se a URL indicar para abrir diretamente o módulo
    if (searchParams.get("open") === "1" || searchParams.get("abrir") === "true") {
      setIsWorkspaceOpen(true);
    }

    // 5. Tentar sincronizar dados mais recentes com a API
    api.auth.me()
      .then((meData) => {
        if (meData?.user) {
          setCurrentUser(meData.user);
          const rawMod = meData.user.tipo_negocio || meData.user.tipoNegocio || meData.user.modulo || meData.user.segmento;
          if (rawMod) {
            const apiMod = normalizeModuleId(rawMod);
            setActiveModuleId(apiMod);
            setSelectedModuleId(apiMod);
            setUserModule(apiMod);
          }
          if (meData.user.status) {
            setAccountStatus(meData.user.status);
          }
        }
      })
      .catch(() => {});

    if (user?.empresa_id) {
      api.empresas.get(user.empresa_id)
        .then((empresa) => {
          if (empresa?.tipo_negocio) {
            const apiMod = normalizeModuleId(empresa.tipo_negocio);
            setActiveModuleId(apiMod);
            setSelectedModuleId(apiMod);
            setUserModule(apiMod);
          }
          if (empresa?.status) {
            setAccountStatus(empresa.status);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsCheckingAuth(false);
        });
    } else {
      setIsCheckingAuth(false);
    }
  }, [router, searchParams]);

  const activeModuleObj = MODULES.find((m) => m.id === activeModuleId) || MODULES[0];
  const selectedModuleObj = MODULES.find((m) => m.id === selectedModuleId) || activeModuleObj;

  const handleSelectModule = (modId: string) => {
    const isAccessible = modId === activeModuleId || currentUser?.role === "admin" || currentUser?.role === "superadmin";

    if (!isAccessible) {
      const clickedMod = MODULES.find((m) => m.id === modId);
      setLockedNotice(
        `O módulo "${clickedMod?.title}" está inacessível. O seu plano atual dá acesso exclusivo ao módulo "${activeModuleObj.title}".`
      );
      setTimeout(() => setLockedNotice(null), 5000);
      return;
    }

    setSelectedModuleId(modId);
    setLockedNotice(null);
  };

  const handleAccessPanel = () => {
    setIsWorkspaceOpen(true);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const triggerAction = (actionTitle: string) => {
    setActionNotice(`Operação "${actionTitle}" iniciada com sucesso no módulo ${activeModuleObj.title}!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-300">Validando autenticação e permissões de acesso...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TELA 2: WORKSPACE DO MÓDULO ABERTO (ONDE VAI ABRIR O MÓDULO ASSINADO)
  // -------------------------------------------------------------
  if (isWorkspaceOpen) {
    const IconComp = activeModuleObj.icon;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {/* Topbar do Módulo */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-xs">
          <div className="flex items-center gap-4">
            <Image src="/nova-logo.svg" alt="Nexa ERP" width={140} height={36} className="h-auto w-28 sm:w-32" priority />
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Módulo Ativo: {activeModuleObj.title}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWorkspaceOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voltar aos Módulos</span>
            </button>

            {(currentUser?.role === "admin" || currentUser?.role === "superadmin") && (
              <button
                onClick={() => router.push("/Admin")}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-900 cursor-pointer"
              >
                <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                Painel Master
              </button>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 cursor-pointer"
              title="Encerrar Sessão"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Banner de Boas-vindas e Status */}
        <div className="bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 px-4 py-8 text-white sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Licença Ativa e Validada
                  </span>
                  <span className="text-xs text-blue-200">
                    Empresa: <strong className="text-white">{currentUser?.empresa?.razao_social || "Empresa Contratante"}</strong>
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Painel de Gestão: {activeModuleObj.title}</h1>
                <p className="mt-1 text-sm text-blue-100 font-light">{activeModuleObj.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200">Operador Conectado</p>
                  <p className="text-sm font-semibold text-white truncate max-w-50">
                    {currentUser?.email || "usuario@empresa.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notificação de Ação */}
        {actionNotice && (
          <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-4">
            <div className="flex items-center justify-between rounded-xl bg-emerald-600 p-3.5 text-sm font-medium text-white shadow-md">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5" />
                <span>{actionNotice}</span>
              </div>
              <button onClick={() => setActionNotice(null)} className="text-white/80 hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo do Workspace */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          {/* Métricas Operacionais */}
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Métricas do Módulo</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activeModuleObj.stats.map((stat, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">{stat.value}</p>
                  <p className="mt-2 flex items-center text-xs font-medium text-emerald-600">
                    <span className="mr-1">●</span> {stat.hint}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Ações Rápidas do Módulo */}
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
              Operações Disponíveis no Módulo {activeModuleObj.title}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activeModuleObj.quickActions.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => triggerAction(action.label)}
                    className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <ActionIcon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-700">{action.label}</h3>
                    <p className="mt-1 text-xs text-slate-500 font-light leading-relaxed">{action.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                      Executar Ação <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recursos Inclusos na Assinatura */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeModuleObj.iconBg}`}>
                  <IconComp className={`h-6 w-6 ${activeModuleObj.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recursos Inclusos na Assinatura</h3>
                  <p className="text-xs text-slate-500">Módulo contratado: {activeModuleObj.segmentTitle}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                100% Liberado
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activeModuleObj.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckIcon className="h-3.5 w-3.5 stroke-3" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TELA 1: SELEÇÃO E VALIDAÇÃO DE MÓDULOS (CARD CENTRAL)
  // -------------------------------------------------------------
  const filteredModules = showOnlySubscribed ? MODULES.filter((m) => m.id === activeModuleId) : MODULES;

  return (
    <div className="relative min-h-screen bg-slate-100 font-sans">
      {/* Metade superior azul */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-blue-800" />

      {/* Logo e cabeçalho topo */}
      <div className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10">
        <Image src="/nova-logo.svg" alt="Nexa ERP" width={600} height={150} className="h-auto w-28 sm:w-32" priority />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right text-white">
            <span className="text-xs font-semibold">{currentUser?.email || "Cliente Autorizado"}</span>
            <span className="text-[11px] text-blue-200">Status: {accountStatus === "ativa" ? "Ativo" : accountStatus}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xs transition hover:bg-white/20 cursor-pointer"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Card central */}
      <div className="relative z-10 flex justify-center px-4 pb-12 pt-2">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
          {/* Cabeçalho do Card */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckIcon className="h-8 w-8 stroke-3" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">Acesso Autorizado!</h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-blue-800">
              Sua conta foi validada com sucesso. Acesse o módulo contratado:
            </p>
          </div>

          {/* Alerta de Módulo Inacessível */}
          {lockedNotice && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-xs">
              <LockClosedIcon className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-950">Módulo Inacessível</p>
                <p className="mt-0.5 leading-relaxed">{lockedNotice}</p>
              </div>
              <button onClick={() => setLockedNotice(null)} className="text-amber-600 hover:text-amber-800">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Filtro de Visualização */}
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setShowOnlySubscribed(true)}
              className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
                showOnlySubscribed ? "bg-white font-bold text-blue-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Apenas Meu Módulo Assinado
            </button>
            <button
              type="button"
              onClick={() => setShowOnlySubscribed(false)}
              className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
                !showOnlySubscribed ? "bg-white font-bold text-blue-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos os Módulos
            </button>
          </div>

          {/* Lista de Módulos */}
          <div className="mt-5 flex flex-col gap-3">
            {filteredModules.map((module) => {
              const isSubscribed = module.id === activeModuleId;
              const isSelected = module.id === selectedModuleId;
              const IconComponent = module.icon;

              return (
                <div
                  key={module.id}
                  onClick={() => handleSelectModule(module.id)}
                  className={`group relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSubscribed
                      ? isSelected
                        ? "border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/30 cursor-pointer"
                        : "border-blue-200 bg-white hover:border-blue-400 hover:shadow-sm cursor-pointer"
                      : "border-dashed border-slate-200 bg-slate-50/80 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isSubscribed ? module.iconBg : "bg-slate-200"
                        } transition-transform duration-200 ${isSubscribed ? "group-hover:scale-105" : ""}`}
                      >
                        <IconComponent className={`h-6 w-6 ${isSubscribed ? module.iconColor : "text-slate-400"}`} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isSubscribed ? "text-slate-900 group-hover:text-blue-800" : "text-slate-500"
                            }`}
                          >
                            {module.title}
                          </span>
                        </div>
                        <span className="block text-xs text-slate-500 font-light">{module.description}</span>
                      </div>
                    </div>

                    {/* Badges de Status */}
                    {isSubscribed ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1 border border-emerald-200">
                        <CheckIcon className="h-3.5 w-3.5 stroke-3" />
                        Liberado
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <LockClosedIcon className="h-3.5 w-3.5" />
                        Inacessível
                      </span>
                    )}
                  </div>

                  {/* Detalhes para o módulo assinado */}
                  {isSubscribed && (
                    <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs text-blue-900 font-medium">
                      <span>✓ Plano Contratado · Acesso Total</span>
                      <span className="text-blue-700 font-bold">Clique para abrir →</span>
                    </div>
                  )}

                  {!isSubscribed && (
                    <div className="mt-2 text-[11px] text-slate-400 font-light">
                      Módulo não incluso na sua assinatura atual.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botão de Acesso ao Painel */}
          <button
            type="button"
            onClick={handleAccessPanel}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-800 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-900 hover:shadow-blue-800/25 active:scale-[0.99] cursor-pointer"
          >
            Acessar Módulo {activeModuleObj.title}
            <ArrowRightIcon className="h-4 w-4 stroke-[2.5]" />
          </button>

          {/* Nota de rodapé informativa */}
          <p className="mt-4 text-center text-xs text-slate-400 font-light">
            Ambiente seguro Nexa ERP · Gestão profissional para sua empresa
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MenuModulosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-blue-800 text-white">
          <p className="text-sm font-medium">Carregando módulos...</p>
        </div>
      }
    >
      <MenuModulosContent />
    </Suspense>
  );
}