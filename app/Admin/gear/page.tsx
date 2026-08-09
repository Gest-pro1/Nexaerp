"use client";
import React, { useState } from "react";
import AdminLayout from "../../components/ManuPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GlobeAltIcon,
  Square3Stack3DIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  PuzzlePieceIcon,
  WrenchScrewdriverIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon,
  LockClosedIcon,
  LinkIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  BookmarkSquareIcon,
} from "@heroicons/react/24/outline";

/* ---------------------------------------------------------------- */
/* Componentes auxiliares                                            */
/* ---------------------------------------------------------------- */

// Switch simples (liga/desliga), inspirado no shadcn/ui
const Toggle = ({
  checked,
  onChange,
  onColor = "#22c55e",
}: {
  checked: boolean;
  onChange: () => void;
  onColor?: string;
}) => (
  <button
    onClick={onChange}
    className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
    style={{ backgroundColor: checked ? onColor : "#cbd5e1" }}
  >
    <span
      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
      style={{ left: checked ? "22px" : "2px" }}
    />
  </button>
);

// Campo de texto padrão, com label e texto de ajuda opcional
const LabeledInput = ({
  label,
  placeholder,
  value,
  onChange,
  helper,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  helper?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
    />
    {helper && <p className="text-xs text-gray-400 mt-1.5">{helper}</p>}
  </div>
);

// Campo numérico com setas de incremento/decremento e sufixo (%, dias)
const NumberField = ({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  suffix?: string;
  onChange: (v: string) => void;
}) => {
  const step = (dir: 1 | -1) => {
    const num = parseFloat(value.replace(",", ".")) || 0;
    const next = Math.max(0, num + dir);
    onChange(next.toFixed(value.includes(",") ? 2 : 0).replace(".", ","));
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm text-gray-800 focus:outline-none"
        />
        {suffix && <span className="text-xs text-gray-400 pr-2">{suffix}</span>}
        <div className="flex flex-col border-l border-gray-200">
          <button onClick={() => step(1)} className="px-1.5 hover:bg-gray-50">
            <ChevronUpIcon className="w-3 h-3 text-gray-400" />
          </button>
          <button onClick={() => step(-1)} className="px-1.5 hover:bg-gray-50 border-t border-gray-200">
            <ChevronDownIcon className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- */
/* Dados estáticos                                                    */
/* ---------------------------------------------------------------- */

const secoes = [
  { id: "geral", titulo: "Geral", subtitulo: "Informações básicas", icon: GlobeAltIcon },
  { id: "modulos", titulo: "Módulos", subtitulo: "Segmentos ativos", icon: Square3Stack3DIcon },
  { id: "planos", titulo: "Planos", subtitulo: "Preços e recursos", icon: CreditCardIcon },
  { id: "financeiro", titulo: "Financeiro", subtitulo: "Regras de cobrança", icon: CurrencyDollarIcon },
  { id: "integracoes", titulo: "Integrações", subtitulo: "Gateways de pagamento", icon: PuzzlePieceIcon },
] as const;

type SecaoId = (typeof secoes)[number]["id"];

const segmentosIniciais = [
  {
    id: "lojas",
    titulo: "Lojas e Varejo",
    descricao: "Gestão de produtos, estoque e vendas no varejo.",
    icon: ShoppingBagIcon,
    cor: "#22c55e",
  },
  {
    id: "mercados",
    titulo: "Mercados e Padarias",
    descricao: "Controle de balança, validade e reposição de itens.",
    icon: ShoppingCartIcon,
    cor: "#f97316",
  },
  {
    id: "bares",
    titulo: "Bares e Restaurantes",
    descricao: "Comandas, mesas e integração com delivery.",
    icon: BuildingStorefrontIcon,
    cor: "#a855f7",
  },
  {
    id: "saloes",
    titulo: "Salões e Barbearias",
    descricao: "Agenda de horários e controle de comissões.",
    icon: SparklesIcon,
    cor: "#3b82f6",
  },
];

const planosIniciais = [
  {
    id: "standart",
    nome: "Standart",
    preco: "R$69,90",
    popular: false,
    recursos: [
      "1 Usuário",
      "Até 50 Notas/mês",
      "Gestão de Vendas (PDV)",
      "Relatórios Básicos",
      "Suporte WhatsApp",
      "Módulos Personalizados",
    ],
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: "R$129,90",
    popular: true,
    recursos: [
      "3 Usuários",
      "Notas Ilimitadas",
      "Gestão de Estoque Avançada",
      "Módulos Personalizados",
      "Suporte 24 Horas",
      "Controle Financeiro",
      "Compartilhe com mais usuários",
    ],
  },
  {
    id: "premium",
    nome: "Premium +",
    preco: "R$249,90",
    popular: false,
    recursos: [
      "10 Usuários",
      "Multi-Lojas",
      "API de Integração",
      "Consultoria de Negócio",
      "Suporte 24 Horas",
      "Gráficos Avançados",
      "Módulos Personalizados",
    ],
  },
];

const gateways = [
  {
    id: "asaas",
    label: "Asaas",
    campos: [
      { chave: "chave1", label: "API Key", placeholder: "sk_test_..." },
      { chave: "chave2", label: "Wallet ID", placeholder: "Endereço da carteira" },
    ],
    webhook: "https://api.gestpro.com/webhooks/asaas",
  },
  {
    id: "mercadopago",
    label: "Mercado Pago",
    campos: [
      { chave: "chave1", label: "Access Token", placeholder: "APP_USR-..." },
      { chave: "chave2", label: "Public Key", placeholder: "APP_USR-..." },
    ],
    webhook: "https://api.gestpro.com/webhooks/mp",
  },
  {
    id: "stripe",
    label: "Stripe",
    campos: [
      { chave: "chave1", label: "Secret Key", placeholder: "sk_test_..." },
      { chave: "chave2", label: "Publishable Key", placeholder: "pk_test_..." },
    ],
    webhook: "https://api.gestpro.com/webhooks/stripe",
  },
] as const;

/* ---------------------------------------------------------------- */
/* Componente principal                                              */
/* ---------------------------------------------------------------- */

const STORAGE_KEY_CONFIG = "nexaerp-configuracoes";

type SegmentoState = Record<string, { disponivel: boolean; manutencao: boolean }>;
type DestaqueState = Record<string, boolean>;
type FinanceiroState = {
  multaAtraso: string;
  jurosMora: string;
  avisarDepois: string;
  descontoAntecipacao: string;
  avisarAntes: string;
  reenvioCobranca: string;
  diasBloqueio: string;
};
type SandboxState = Record<string, boolean>;

const ConfiguracoesSistema = () => {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>("geral");
  const [salvoSucesso, setSalvoSucesso] = useState(false);

  // Função auxiliar para carregar do localStorage
  const loadSavedConfig = () => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const initialConfig = loadSavedConfig();

  // Geral
  const [email, setEmail] = useState<string>(initialConfig?.email ?? "suporte@gestpro.com.br");
  const [manutencaoGlobal, setManutencaoGlobal] = useState<boolean>(initialConfig?.manutencaoGlobal ?? false);
  const [whatsappNotif, setWhatsappNotif] = useState<boolean>(initialConfig?.whatsappNotif ?? true);

  // Módulos
  const [segmentos, setSegmentos] = useState<SegmentoState>(
    initialConfig?.segmentos ??
      Object.fromEntries(segmentosIniciais.map((s) => [s.id, { disponivel: true, manutencao: false }]))
  );

  // Planos
  const [destaque, setDestaque] = useState<DestaqueState>(
    initialConfig?.destaque ?? Object.fromEntries(planosIniciais.map((p) => [p.id, p.popular]))
  );

  // Financeiro
  const [financeiro, setFinanceiro] = useState<FinanceiroState>(
    initialConfig?.financeiro ?? {
      multaAtraso: "2,00",
      jurosMora: "1,00",
      avisarDepois: "1",
      descontoAntecipacao: "2,00",
      avisarAntes: "5",
      reenvioCobranca: "5",
      diasBloqueio: "5",
    }
  );
  const [ativarLembretes, setAtivarLembretes] = useState<boolean>(initialConfig?.ativarLembretes ?? true);

  // Integrações
  const [gatewayAtivo, setGatewayAtivo] = useState<string>("asaas");
  const [sandbox, setSandbox] = useState<SandboxState>(
    initialConfig?.sandbox ?? Object.fromEntries(gateways.map((g) => [g.id, true]))
  );
  const [gatewayKeys, setGatewayKeys] = useState<Record<string, Record<string, string>>>(
    initialConfig?.gatewayKeys ?? {
      asaas: { chave1: "", chave2: "" },
      mercadopago: { chave1: "", chave2: "" },
      stripe: { chave1: "", chave2: "" },
    }
  );

  const gatewaySelecionado = gateways.find((g) => g.id === gatewayAtivo)!;

  const salvarAlteracoes = () => {
    const dataToSave = {
      email,
      manutencaoGlobal,
      whatsappNotif,
      segmentos,
      destaque,
      financeiro,
      ativarLembretes,
      sandbox,
      gatewayKeys,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(dataToSave));
    }

    setSalvoSucesso(true);
    setTimeout(() => {
      setSalvoSucesso(false);
    }, 3000);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Alerta de confirmação ao salvar */}
          {salvoSucesso && (
            <div className="mb-6 flex items-center justify-between rounded-lg bg-emerald-500 p-4 text-white shadow-lg transition-all">
              <div className="flex items-center gap-2">
                <CheckIcon className="w-5 h-5 font-bold" />
                <span className="font-semibold text-sm">Configurações salvas com sucesso!</span>
              </div>
            </div>
          )}

          {/* Título + botão salvar */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Configurações do Sistema</h1>
              <p className="text-gray-500 text-sm">Área de gerenciamento de planos e integrações do sistema.</p>
            </div>
            <button
              onClick={salvarAlteracoes}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
            >
              <BookmarkSquareIcon className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
            {/* Navegação lateral das seções */}
            <div className="space-y-3">
              {secoes.map((secao) => {
                const Icon = secao.icon;
                const ativo = secaoAtiva === secao.id;
                return (
                  <button
                    key={secao.id}
                    onClick={() => setSecaoAtiva(secao.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-colors bg-white ${
                      ativo ? "border-blue-400 ring-1 ring-blue-400 bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{secao.titulo}</p>
                      <p className="text-xs text-gray-400">{secao.subtitulo}</p>
                    </div>
                    <ChevronRightIcon className={`w-4 h-4 flex-shrink-0 ${ativo ? "text-blue-500" : "text-gray-300"}`} />
                  </button>
                );
              })}
            </div>

            {/* Painel de conteúdo */}
            <div>
              {/* ---------------- GERAL ---------------- */}
              {secaoAtiva === "geral" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GlobeAltIcon className="w-5 h-5 text-gray-500" />
                      Configurações Globais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LabeledInput
                      label="E-mail de Suporte"
                      placeholder="Inserir e-mail"
                      value={email}
                      onChange={setEmail}
                      helper="Este e-mail será usado para enviar notificações ao cliente."
                    />

                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Modo Manutenção Global</p>
                          <p className="text-xs text-gray-400">
                            Bloqueia acesso temporário de todos os clientes ao painel.
                          </p>
                        </div>
                      </div>
                      <Toggle checked={manutencaoGlobal} onChange={() => setManutencaoGlobal((v) => !v)} onColor="#312e81" />
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Notificações WhatsApp</p>
                          <p className="text-xs text-gray-400">
                            Enviar alertas automáticos de vencimento e boas-vindas.
                          </p>
                        </div>
                      </div>
                      <Toggle checked={whatsappNotif} onChange={() => setWhatsappNotif((v) => !v)} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ---------------- MÓDULOS ---------------- */}
              {secaoAtiva === "modulos" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Square3Stack3DIcon className="w-5 h-5 text-gray-500" />
                      Gestão de Segmentos
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                      Controle quais módulos estão disponíveis para venda. Use o "Modo Manutenção" para bloquear
                      acesso a um segmento específico sem afetar os demais.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end gap-10 pr-2 mb-2 text-xs font-medium text-gray-400">
                      <span>Disponível</span>
                      <span>Manutenção</span>
                    </div>
                    <div className="space-y-3">
                      {segmentosIniciais.map((seg) => {
                        const Icon = seg.icon;
                        const estado = segmentos[seg.id];
                        return (
                          <div key={seg.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: seg.cor }}
                              >
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{seg.titulo}</p>
                                <p className="text-xs text-gray-400">{seg.descricao}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <Toggle
                                checked={estado.disponivel}
                                onChange={() =>
                                  setSegmentos((prev) => ({
                                    ...prev,
                                    [seg.id]: { ...prev[seg.id], disponivel: !prev[seg.id].disponivel },
                                  }))
                                }
                              />
                              <Toggle
                                checked={estado.manutencao}
                                onChange={() =>
                                  setSegmentos((prev) => ({
                                    ...prev,
                                    [seg.id]: { ...prev[seg.id], manutencao: !prev[seg.id].manutencao },
                                  }))
                                }
                                onColor="#312e81"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ---------------- PLANOS ---------------- */}
              {secaoAtiva === "planos" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCardIcon className="w-5 h-5 text-gray-500" />
                      Planos de Assinatura
                    </CardTitle>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
                      <PlusIcon className="w-4 h-4" />
                      Criar Plano
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {planosIniciais.map((plano) => (
                        <div
                          key={plano.id}
                          className={`relative rounded-xl border overflow-hidden flex flex-col ${
                            plano.popular ? "border-blue-400 ring-1 ring-blue-400" : "border-gray-200"
                          }`}
                        >
                          {plano.popular && (
                            <div className="bg-blue-500 text-white text-[11px] font-semibold text-center py-1">
                              MAIS POPULAR
                            </div>
                          )}
                          <div className="p-5 flex flex-col flex-1">
                            <p className="font-semibold text-gray-900">{plano.nome}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {plano.preco}
                              <span className="text-sm font-normal text-gray-400"> /mês</span>
                            </p>
                            <p className="text-[11px] font-semibold text-gray-400 mt-4 mb-2 tracking-wide">
                              RECURSOS INCLUÍDOS · {plano.recursos.length} itens
                            </p>
                            <ul className="space-y-2 flex-1">
                              {plano.recursos.map((r, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                            <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 mt-3">
                              <PlusIcon className="w-3.5 h-3.5" />
                              Adicionar Recurso
                            </button>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <Toggle
                                  checked={destaque[plano.id]}
                                  onChange={() => setDestaque((prev) => ({ ...prev, [plano.id]: !prev[plano.id] }))}
                                />
                                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">DESTAQUE</span>
                              </div>
                              <button className="text-gray-300 hover:text-red-500">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ---------------- FINANCEIRO ---------------- */}
              {secaoAtiva === "financeiro" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-500" />
                      Regras de Cobrança
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-indigo-50 text-indigo-700 text-xs rounded-lg p-3">
                      O sistema gera faturas automaticamente 5 dias antes do vencimento e envia lembretes via
                      e-mail/WhatsApp (se ativado).
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <NumberField
                        label="MULTA ATRASO (%)"
                        suffix="%"
                        value={financeiro.multaAtraso}
                        onChange={(v) => setFinanceiro((p) => ({ ...p, multaAtraso: v }))}
                      />
                      <NumberField
                        label="JUROS DE MORA (AO MÊS %)"
                        suffix="%"
                        value={financeiro.jurosMora}
                        onChange={(v) => setFinanceiro((p) => ({ ...p, jurosMora: v }))}
                      />
                      <NumberField
                        label="AVISAR DEPOIS DO VENCIMENTO"
                        suffix="DIAS"
                        value={financeiro.avisarDepois}
                        onChange={(v) => setFinanceiro((p) => ({ ...p, avisarDepois: v }))}
                      />
                      <NumberField
                        label="DESCONTO ANTECIPAÇÃO (%)"
                        suffix="%"
                        value={financeiro.descontoAntecipacao}
                        onChange={(v) => setFinanceiro((p) => ({ ...p, descontoAntecipacao: v }))}
                      />
                      <NumberField
                        label="AVISAR ANTES DE VENCER"
                        suffix="DIAS"
                        value={financeiro.avisarAntes}
                        onChange={(v) => setFinanceiro((p) => ({ ...p, avisarAntes: v }))}
                      />
                      <NumberField
                        label="REENVIO DE COBRANÇA"
                        suffix="DIAS"
                        value={financeiro.reenvioCobranca}
                        onChange={(v) => setFinanceiro((p) => ({ ...p, reenvioCobranca: v }))}
                      />
                    </div>

                    <div className="flex items-end justify-between pt-2">
                      <div className="w-48">
                        <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1.5 tracking-wide">
                          <LockClosedIcon className="w-3.5 h-3.5" />
                          DIAS P/ BLOQUEIO
                        </label>
                        <input
                          type="text"
                          value={financeiro.diasBloqueio}
                          onChange={(e) => setFinanceiro((p) => ({ ...p, diasBloqueio: e.target.value }))}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Ativar Lembretes</span>
                        <Toggle checked={ativarLembretes} onChange={() => setAtivarLembretes((v) => !v)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ---------------- INTEGRAÇÕES ---------------- */}
              {secaoAtiva === "integracoes" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PuzzlePieceIcon className="w-5 h-5 text-gray-500" />
                      Gateways de Pagamento
                    </CardTitle>
                    <div className="flex items-center gap-5 border-b border-gray-100 pt-2">
                      {gateways.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setGatewayAtivo(g.id)}
                          className={`text-sm pb-2 -mb-px border-b-2 transition-colors ${
                            gatewayAtivo === g.id
                              ? "border-blue-500 text-blue-600 font-medium"
                              : "border-transparent text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex justify-end">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Modo Sandbox</span>
                        <Toggle
                          checked={sandbox[gatewayAtivo]}
                          onChange={() => setSandbox((p) => ({ ...p, [gatewayAtivo]: !p[gatewayAtivo] }))}
                          onColor="#f59e0b"
                        />
                      </div>
                    </div>

                    {gatewaySelecionado.campos.map((campo) => (
                      <LabeledInput
                        key={campo.chave}
                        label={campo.label}
                        placeholder={campo.placeholder}
                        value={gatewayKeys[gatewayAtivo]?.[campo.chave] ?? ""}
                        onChange={(val) =>
                          setGatewayKeys((prev) => ({
                            ...prev,
                            [gatewayAtivo]: {
                              ...(prev[gatewayAtivo] || {}),
                              [campo.chave]: val,
                            },
                          }))
                        }
                      />
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Webhook URL (Notificações)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={gatewaySelecionado.webhook}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 bg-gray-50 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(gatewaySelecionado.webhook);
                              alert("Webhook URL copiada para a área de transferência!");
                            }
                          }}
                          title="Copiar URL"
                          className="w-9 h-9 flex-shrink-0 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                        >
                          <LinkIcon className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Configure a URL para receber notificações de pagamento.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ConfiguracoesSistema;