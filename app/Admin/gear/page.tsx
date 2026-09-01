"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/ManuPage";
import { api } from "@/lib/api";
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
          <button type="button" onClick={() => step(1)} className="px-1.5 hover:bg-gray-50 cursor-pointer">
            <ChevronUpIcon className="w-3 h-3 text-gray-400" />
          </button>
          <button type="button" onClick={() => step(-1)} className="px-1.5 hover:bg-gray-50 border-t border-gray-200 cursor-pointer">
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

  const initialConfig: any = null;

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
  type PlanoItem = {
    id: string;
    nome: string;
    preco: string;
    popular: boolean;
    recursos: string[];
  };

  const [planos, setPlanos] = useState<PlanoItem[]>(
    initialConfig?.planos ?? planosIniciais
  );
  const [destaque, setDestaque] = useState<DestaqueState>(
    initialConfig?.destaque ?? Object.fromEntries(planosIniciais.map((p) => [p.id, p.popular]))
  );

  // Modal de criar plano
  const [mostrarModalPlano, setMostrarModalPlano] = useState(false);
  const [novoPlanoNome, setNovoPlanoNome] = useState("");
  const [novoPlanoPreco, setNovoPlanoPreco] = useState("");
  const [novoPlanoPopular, setNovoPlanoPopular] = useState(false);
  const [novoPlanoRecursos, setNovoPlanoRecursos] = useState("");

  // Modal de adicionar recurso
  const [modalRecurso, setModalRecurso] = useState<{ planoId: string; planoNome: string } | null>(null);
  const [novoRecursoTexto, setNovoRecursoTexto] = useState("");

  const handleCriarPlanoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPlanoNome.trim() || !novoPlanoPreco.trim()) {
      alert("Por favor, preencha o nome e o preço do plano.");
      return;
    }

    const recursosArray = novoPlanoRecursos
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const cleanPrice = parseFloat(novoPlanoPreco.replace("R$", "").replace(/\s/g, "").replace(",", ".")) || 0;
    let realId = novoPlanoNome.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    try {
      const created = await api.planos.create({
        nome: novoPlanoNome.trim(),
        precoMensal: cleanPrice,
        recursos: recursosArray.join("\n"),
        ativo: true,
      });
      if (created?.id) {
        realId = created.id;
      }
    } catch (err: any) {
      console.warn("Aviso ao persistir novo plano na API:", err);
    }

    const novoPlanoObj: PlanoItem = {
      id: realId,
      nome: novoPlanoNome.trim(),
      preco: novoPlanoPreco.startsWith("R$") ? novoPlanoPreco.trim() : `R$ ${novoPlanoPreco.trim()}`,
      popular: novoPlanoPopular,
      recursos: recursosArray.length > 0 ? recursosArray : ["Suporte Básico"],
    };

    if (novoPlanoPopular) {
      setPlanos((prev) =>
        prev.map((p) => ({ ...p, popular: false })).concat(novoPlanoObj)
      );
      setDestaque((prev) => {
        const next: DestaqueState = {};
        Object.keys(prev).forEach((k) => (next[k] = false));
        next[novoPlanoObj.id] = true;
        return next;
      });
    } else {
      setPlanos((prev) => [...prev, novoPlanoObj]);
      setDestaque((prev) => ({ ...prev, [novoPlanoObj.id]: false }));
    }

    setNovoPlanoNome("");
    setNovoPlanoPreco("");
    setNovoPlanoPopular(false);
    setNovoPlanoRecursos("");
    setMostrarModalPlano(false);
  };

  const handleAbrirModalRecurso = (planoId: string, planoNome: string) => {
    setModalRecurso({ planoId, planoNome });
    setNovoRecursoTexto("");
  };

  const handleSalvarNovoRecurso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRecurso || !novoRecursoTexto.trim()) return;

    setPlanos((prev) =>
      prev.map((p) =>
        p.id === modalRecurso.planoId
          ? { ...p, recursos: [...p.recursos, novoRecursoTexto.trim()] }
          : p
      )
    );

    setNovoRecursoTexto("");
    setModalRecurso(null);
  };

  const toggleDestaque = (planoId: string) => {
    const proximoStatus = !destaque[planoId];

    setDestaque((prev) => {
      const next = { ...prev };
      if (proximoStatus) {
        Object.keys(next).forEach((k) => (next[k] = false));
        next[planoId] = true;
      } else {
        next[planoId] = false;
      }
      return next;
    });

    setPlanos((prev) =>
      prev.map((p) => ({
        ...p,
        popular: p.id === planoId ? proximoStatus : proximoStatus ? false : p.popular,
      }))
    );
  };

  const handleDeletarPlano = async (planoId: string, planoNome: string) => {
    if (confirm(`Deseja realmente excluir o plano "${planoNome}"?`)) {
      try {
        await api.planos.delete(planoId);
      } catch (err: any) {
        console.debug("Aviso ao remover plano no banco:", err);
      }
      setPlanos((prev) => prev.filter((p) => p.id !== planoId));
      setDestaque((prev) => {
        const copy = { ...prev };
        delete copy[planoId];
        return copy;
      });
    }
  };

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
  const [validacaoGateway, setValidacaoGateway] = useState<any>(null);
  const [testandoGateway, setTestandoGateway] = useState<boolean>(false);
  const [feedbackMensagem, setFeedbackMensagem] = useState<string>("");

  const gatewaySelecionado = gateways.find((g) => g.id === gatewayAtivo)!;

  // Carregar dados salvos, planos e configurações do banco/API na montagem
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexaerp_system_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (typeof parsed.manutencaoGlobal === "boolean") setManutencaoGlobal(parsed.manutencaoGlobal);
        if (typeof parsed.whatsappNotif === "boolean") setWhatsappNotif(parsed.whatsappNotif);
        if (parsed.segmentos) setSegmentos(parsed.segmentos);
        if (parsed.planos && Array.isArray(parsed.planos) && parsed.planos.length > 0) setPlanos(parsed.planos);
        if (parsed.destaque) setDestaque(parsed.destaque);
        if (parsed.financeiro) setFinanceiro(parsed.financeiro);
        if (typeof parsed.ativarLembretes === "boolean") setAtivarLembretes(parsed.ativarLembretes);
        if (parsed.sandbox) setSandbox(parsed.sandbox);
        if (parsed.gatewayKeys) setGatewayKeys(parsed.gatewayKeys);
      }
    } catch (e) {
      console.warn("Erro ao carregar configurações salvas:", e);
    }

    // Sincronizar configurações e chaves de pagamento com o backend
    api.admin.getConfiguracoes()
      .then((configs) => {
        if (configs?.geral) {
          if (configs.geral.email) setEmail(configs.geral.email);
          if (typeof configs.geral.manutencaoGlobal === "boolean") setManutencaoGlobal(configs.geral.manutencaoGlobal);
          if (typeof configs.geral.whatsappNotif === "boolean") setWhatsappNotif(configs.geral.whatsappNotif);
        } else if (configs?.email) {
          setEmail(configs.email);
        }

        if (configs?.financeiro) {
          setFinanceiro((prev) => ({ ...prev, ...configs.financeiro }));
        }

        if (typeof configs?.ativarLembretes === "boolean") {
          setAtivarLembretes(configs.ativarLembretes);
        }

        if (configs?.segmentos) {
          setSegmentos((prev) => ({ ...prev, ...configs.segmentos }));
        }

        if (configs?.gateway_pagamento) {
          const gw = configs.gateway_pagamento;
          if (gw.ativo) setGatewayAtivo(gw.ativo);
          if (gw.sandbox) setSandbox((prev) => ({ ...prev, ...gw.sandbox }));
          if (gw.gatewayKeys) setGatewayKeys((prev) => ({ ...prev, ...gw.gatewayKeys }));
          if (gw.mercadopagoValidation) setValidacaoGateway(gw.mercadopagoValidation);
        }
      })
      .catch((err) => {
        console.debug("Configurações remotas não disponíveis:", err);
      });

    // Buscar planos da API para sincronizar
    api.planos.list()
      .then((apiPlanos) => {
        if (apiPlanos && Array.isArray(apiPlanos) && apiPlanos.length > 0) {
          const mapped: PlanoItem[] = apiPlanos.map((p: any) => ({
            id: p.id,
            nome: p.nome,
            preco: `R$ ${(p.preco_mensal || 0).toFixed(2).replace(".", ",")}`,
            popular: p.nome?.toLowerCase().includes("pro") || p.nome?.toLowerCase().includes("premium"),
            recursos: typeof p.recursos === "string"
              ? p.recursos.split(/[,•\n]/).map((r: string) => r.trim()).filter(Boolean)
              : Array.isArray(p.recursos)
              ? p.recursos
              : ["Recursos Inclusos"],
          }));
          const saved = localStorage.getItem("nexaerp_system_config");
          if (!saved) {
            setPlanos(mapped);
            setDestaque(Object.fromEntries(mapped.map((m) => [m.id, m.popular])));
          }
        }
      })
      .catch((err) => {
        console.debug("Planos locais em uso:", err);
      });
  }, []);

  const handleTestarGateway = async () => {
    setTestandoGateway(true);
    try {
      const keys = gatewayKeys[gatewayAtivo] || {};
      const res = await api.admin.testarGateway({
        gateway: gatewayAtivo,
        chave1: keys.chave1 || "",
        chave2: keys.chave2 || "",
      });

      if (res?.resultado) {
        setValidacaoGateway(res.resultado);
      }
      setFeedbackMensagem(res?.resultado?.mensagem || res?.message || "Teste concluído!");
    } catch (err: any) {
      setFeedbackMensagem(`Erro ao testar gateway: ${err.message}`);
    } finally {
      setTestandoGateway(false);
    }
  };

  const salvarAlteracoes = async () => {
    const configToSave = {
      email,
      manutencaoGlobal,
      whatsappNotif,
      segmentos,
      planos,
      destaque,
      financeiro,
      ativarLembretes,
      sandbox,
      gatewayKeys,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("nexaerp_system_config", JSON.stringify(configToSave));
    } catch (e) {
      console.error("Erro ao salvar no storage local:", e);
    }

    try {
      await api.planos.sync(planos);
    } catch (err: any) {
      console.warn("Aviso ao sincronizar planos no banco:", err);
    }

    try {
      const res = await api.admin.salvarConfiguracoes({
        geral: {
          email,
          manutencaoGlobal,
          whatsappNotif,
        },
        financeiro,
        segmentos,
        ativarLembretes,
        gateway_pagamento: {
          ativo: gatewayAtivo,
          sandbox,
          gatewayKeys,
        },
      });

      if (res?.validation) {
        setValidacaoGateway(res.validation);
      }
      if (res?.message) {
        setFeedbackMensagem(res.message);
      }
    } catch (err: any) {
      console.warn("Aviso ao sincronizar configurações no banco:", err);
    }

    setSalvoSucesso(true);
    setTimeout(() => {
      setSalvoSucesso(false);
    }, 4000);
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
                    <button
                      onClick={() => setMostrarModalPlano(true)}
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Criar Plano
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {planos.map((plano) => (
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
                            <button
                              onClick={() => handleAbrirModalRecurso(plano.id, plano.nome)}
                              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 mt-3 cursor-pointer"
                            >
                              <PlusIcon className="w-3.5 h-3.5" />
                              Adicionar Recurso
                            </button>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <Toggle
                                  checked={!!destaque[plano.id]}
                                  onChange={() => toggleDestaque(plano.id)}
                                />
                                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">DESTAQUE</span>
                              </div>
                              <button
                                onClick={() => handleDeletarPlano(plano.id, plano.nome)}
                                className="text-gray-300 hover:text-red-500 cursor-pointer"
                                title="Excluir Plano"
                              >
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

              {/* Modal de Adicionar Recurso */}
              {modalRecurso && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Adicionar Recurso</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Plano: <span className="font-semibold text-gray-800">{modalRecurso.planoNome}</span>
                    </p>
                    <form onSubmit={handleSalvarNovoRecurso} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Recurso</label>
                        <input
                          type="text"
                          placeholder="Ex: Suporte VIP 24/7"
                          value={novoRecursoTexto}
                          onChange={(e) => setNovoRecursoTexto(e.target.value)}
                          autoFocus
                          required
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setModalRecurso(null)}
                          className="px-4 py-2 rounded-md border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Adicionar Recurso
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal de Criar Plano */}
              {mostrarModalPlano && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Criar Novo Plano</h3>
                    <form onSubmit={handleCriarPlanoSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
                        <input
                          type="text"
                          placeholder="Ex: Enterprise"
                          value={novoPlanoNome}
                          onChange={(e) => setNovoPlanoNome(e.target.value)}
                          required
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preço Mensal</label>
                        <input
                          type="text"
                          placeholder="Ex: R$399,90"
                          value={novoPlanoPreco}
                          onChange={(e) => setNovoPlanoPreco(e.target.value)}
                          required
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recursos (um por linha)</label>
                        <textarea
                          placeholder="Usuários Ilimitados&#10;Suporte VIP 24h&#10;Servidor Dedicado"
                          value={novoPlanoRecursos}
                          onChange={(e) => setNovoPlanoRecursos(e.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Toggle checked={novoPlanoPopular} onChange={() => setNovoPlanoPopular(!novoPlanoPopular)} />
                        <span className="text-sm text-gray-700 font-medium">Marcar como Mais Popular</span>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setMostrarModalPlano(false)}
                          className="px-4 py-2 rounded-md border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Criar Plano
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
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

                    {/* Status de Validação e Botão de Teste */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <span>Status de Validação:</span>
                            {validacaoGateway?.valido ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Conectado e Validado
                              </span>
                            ) : validacaoGateway?.erro ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Falha na Conexão
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Aguardando Teste
                              </span>
                            )}
                          </p>
                          {validacaoGateway?.conta && (
                            <p className="text-xs text-gray-500 mt-1">
                              Conta: <strong>{validacaoGateway.conta.nickname}</strong> ({validacaoGateway.conta.email}) — ID: {validacaoGateway.conta.id}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleTestarGateway}
                          disabled={testandoGateway}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {testandoGateway ? "Testando..." : "⚡ Validar Credenciais"}
                        </button>
                      </div>

                      {feedbackMensagem && (
                        <p className={`text-xs p-2.5 rounded-lg ${
                          validacaoGateway?.valido
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {feedbackMensagem}
                        </p>
                      )}
                    </div>

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