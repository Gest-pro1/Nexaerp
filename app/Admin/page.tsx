"use client";
import { useState, useEffect } from "react";

import AdminLayout from "../components/ManuPage";

import {
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const infoCards = [
  { name: "Empresas e Acessos", icon: BuildingOffice2Icon, value: "0" },
  { name: "Financeiro e Cobranças", icon: CurrencyDollarIcon, value: "R$ 00.000,00" },
];

type Empresa = {
  id: number;
  nome: string;
  cnpj: string;
  plano: string;
  responsavel: string;
  email: string;
  status: "ativa" | "inativa" | "bloqueado" | "pendente";
  dataCobranca: string;
  valor: string;
  cor: string;
  cidade?: string;
  uf?: string;
  senha?: string;
  telefone?: string;
};

// Dados de exemplo para teste
const empresasExemplo: Empresa[] = [
  {
    id: 1,
    nome: "Bony Custo Barbearia",
    cnpj: "15.548.254/0001-65",
    plano: "Profissional",
    responsavel: "Bony Costa",
    email: "bony.custo@gmail.com",
    status: "ativa",
    dataCobranca: "20/12/2025",
    valor: "R$ 129,90",
    cor: "bg-black",
  },
  {
    id: 2,
    nome: "Amobily Ponificadora",
    cnpj: "26.254.254/0001-86",
    plano: "Premium +",
    responsavel: "Josimar Alves",
    email: "amobily.ponificadora@gmail.com",
    status: "ativa",
    dataCobranca: "20/12/2025",
    valor: "R$ 249,90",
    cor: "bg-red-700",
  },
  {
    id: 3,
    nome: "AG Frios",
    cnpj: "11.478.954/0001-01",
    plano: "Standart",
    responsavel: "Carlos José",
    email: "carlos@gmail.com",
    status: "bloqueado",
    dataCobranca: "25/12/2025",
    valor: "R$ 69,90",
    cor: "bg-blue-600",
  },
  {
    id: 4,
    nome: "Ingó Forma",
    cnpj: "99.507.944/0001-67",
    plano: "Profissional",
    responsavel: "Maria Lúcia",
    email: "maria@gmail.com",
    status: "pendente",
    dataCobranca: "28/12/2025",
    valor: "R$ 129,90",
    cor: "bg-blue-900",
  },
  {
    id: 5,
    nome: "Grupo Gestão",
    cnpj: "97.501.651/0000-55",
    plano: "Profissional",
    responsavel: "Antônio Nunes",
    email: "antonio@gmail.com",
    status: "ativa",
    dataCobranca: "30/12/2025",
    valor: "R$ 129,90",
    cor: "bg-purple-600",
  },
  {
    id: 6,
    nome: "Mercadinho do Kinho",
    cnpj: "97.786.954/0000-01",
    plano: "Profissional",
    responsavel: "José da Silva",
    email: "jose@gmail.com",
    status: "ativa",
    dataCobranca: "20/12/2025",
    valor: "R$ 129,90",
    cor: "bg-green-600",
  },
];

type ModalType = null | "mensagem" | "editar" | "deletar" | "criar";

interface ModalData {
  empresaId: number;
  empresaNome: string;
}

// Tipo próprio do formulário de edição e criação
type EditFormState = {
  nome: string;
  cnpj: string;
  plano: string;
  cidade: string;
  uf: string;
  responsavel: string;
  email: string;
  senha: string;
  telefone: string;
  status: Empresa["status"];
  valor: string;
};

const STORAGE_KEY = "nexaerp-empresas";

export default function AdminPage() {
  const [selectedCard, setSelectedCard] = useState(0);
  const [notificacoes, setNotificacoes] = useState(0);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  // Lê o que foi salvo no localStorage (se existir) já na primeira renderização
  const [empresas, setEmpresas] = useState<Empresa[]>(() => {
    if (typeof window === "undefined") return empresasExemplo;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Empresa[]) : empresasExemplo;
    } catch {
      return empresasExemplo;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermFinanceiro, setSearchTermFinanceiro] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageFinanceiro, setCurrentPageFinanceiro] = useState(1);

  const defaultFormState: EditFormState = {
    nome: "",
    cnpj: "",
    plano: "Profissional",
    cidade: "",
    uf: "PB",
    responsavel: "",
    email: "",
    senha: "",
    telefone: "",
    status: "ativa",
    valor: "R$ 129,90",
  };

  const [editForm, setEditForm] = useState<EditFormState>(defaultFormState);
  const [createForm, setCreateForm] = useState<EditFormState>(defaultFormState);
  const itemsPerPage = 5;

  // Cálculos para os cards de métricas
  const totalEmpresas = empresas.length;
  const licencasAtivas = empresas.filter((e) => e.status === "ativa").length;
  const mrrEstimado = empresas
    .filter((e) => e.status === "ativa")
    .reduce((acc, emp) => {
      const valorNumerico = parseFloat(emp.valor.replace("R$ ", "").replace(",", "."));
      return acc + (isNaN(valorNumerico) ? 0 : valorNumerico);
    }, 0);
  const inadimplencia = empresas.filter((e) => e.status === "bloqueado").length;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empresas));
    }
  }, [empresas]);

  const handleEnviarMensagem = (id: number, nome: string) => {
    setModalData({ empresaId: id, empresaNome: nome });
    setModalType("mensagem");
  };

  const handleNovaEmpresa = () => {
    setCreateForm({ ...defaultFormState });
    setModalType("criar");
  };

  const salvarCriacao = () => {
    if (!createForm.nome.trim() || !createForm.cnpj.trim() || !createForm.email.trim()) {
      alert("Por favor, preencha os campos obrigatórios: Razão Social/Nome Fantasia, CNPJ e E-mail.");
      return;
    }

    const cores = ["bg-black", "bg-red-700", "bg-blue-600", "bg-purple-600", "bg-green-600", "bg-indigo-600"];
    const corSorteada = cores[Math.floor(Math.random() * cores.length)];

    let valorPlano = createForm.valor;
    if (createForm.plano === "Standart") valorPlano = "R$ 69,90";
    else if (createForm.plano === "Profissional") valorPlano = "R$ 129,90";
    else if (createForm.plano === "Premium +") valorPlano = "R$ 249,90";

    const novaEmpresa: Empresa = {
      id: Date.now(),
      nome: createForm.nome.trim(),
      cnpj: createForm.cnpj.trim(),
      plano: createForm.plano,
      responsavel: createForm.responsavel.trim() || "Responsável",
      email: createForm.email.trim(),
      status: createForm.status,
      dataCobranca: "30/12/2025",
      valor: valorPlano,
      cor: corSorteada,
      cidade: createForm.cidade.trim(),
      uf: createForm.uf,
      senha: createForm.senha.trim(),
      telefone: createForm.telefone.trim(),
    };

    setEmpresas((prev) => [novaEmpresa, ...prev]);
    setModalType(null);
  };

  const handleEditar = (id: number, nome: string) => {
    const empresa = empresas.find((emp) => emp.id === id);
    if (!empresa) return;

    setEditForm({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      plano: empresa.plano,
      cidade: empresa.cidade ?? "",
      uf: empresa.uf ?? "PB",
      responsavel: empresa.responsavel,
      email: empresa.email,
      senha: empresa.senha ?? "",
      telefone: empresa.telefone ?? "",
      status: empresa.status,
      valor: empresa.valor,
    });

    setModalData({ empresaId: id, empresaNome: nome });
    setModalType("editar");
  };

  const handleDeletar = (id: number, nome: string) => {
    setModalData({ empresaId: id, empresaNome: nome });
    setModalType("deletar");
  };

  const salvarEdicao = () => {
    if (!modalData) return;

    setEmpresas((prev) =>
      prev.map((emp) => {
        if (emp.id !== modalData.empresaId) return emp;

        const novoPlano = editForm.plano.trim() || emp.plano;
        let novoValor = emp.valor;
        if (novoPlano === "Standart") novoValor = "R$ 69,90";
        else if (novoPlano === "Profissional") novoValor = "R$ 129,90";
        else if (novoPlano === "Premium +") novoValor = "R$ 249,90";

        return {
          ...emp,
          nome: editForm.nome.trim() || emp.nome,
          cnpj: editForm.cnpj.trim() || emp.cnpj,
          plano: novoPlano,
          valor: novoValor,
          cidade: editForm.cidade.trim(),
          uf: editForm.uf,
          responsavel: editForm.responsavel.trim() || emp.responsavel,
          email: editForm.email.trim() || emp.email,
          senha: editForm.senha.trim(),
          telefone: editForm.telefone.trim(),
          status: editForm.status,
        };
      })
    );

    setModalType(null);
    setModalData(null);
  };

  const confirmarDelecao = () => {
    if (modalData) {
      setEmpresas((prev) => prev.filter((emp) => emp.id !== modalData.empresaId));
      setModalType(null);
      setModalData(null);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalData(null);
  };

  // Filtrar empresas baseado na pesquisa e status
  const empresasFiltradas = empresas.filter((emp) => {
    const matchSearch =
      emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "todos" || emp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Paginação
  const totalPages = Math.max(1, Math.ceil(empresasFiltradas.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const empresasPaginadas = empresasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Filtrar financeiro baseado na pesquisa
  const empresasFinanceiroFiltradas = empresas.filter(
    (emp) =>
      emp.nome.toLowerCase().includes(searchTermFinanceiro.toLowerCase()) ||
      emp.cnpj.toLowerCase().includes(searchTermFinanceiro.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTermFinanceiro.toLowerCase())
  );
  const totalPagesFinanceiro = Math.max(1, Math.ceil(empresasFinanceiroFiltradas.length / itemsPerPage));

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa":
        return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" };
      case "inativa":
        return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
      case "bloqueado":
        return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
      case "pendente":
        return { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" };
      default:
        return { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" };
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <AdminLayout notificacoes={notificacoes}>
      <div className="flex min-w-0 flex-1 flex-col gap-2 bg-[#ece6e6] p-2 sm:gap-4 sm:p-4">
        {/* Card principal: tela de valores e métricas do Admin */}
        <div className="flex w-full min-h-[180px] flex-col gap-4 rounded-lg bg-[#1E40AF] px-3 py-3 sm:px-5 sm:py-4 md:min-h-[160px] md:flex-row md:items-stretch md:justify-between">
          <div className="flex flex-1 flex-col">
            <div className="mb-1.5 flex items-center gap-2.5">
              <img src="/escudo.svg" alt="Escudo" className="h-6 w-6" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
                Administração do Sistema
              </span>
            </div>

            <h1 className="mb-5 text-[22px] font-bold tracking-tight text-white">Gestão de Licenças</h1>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex flex-col gap-1 rounded-lg px-3 py-2">
                <span className="text-[11px] font-medium text-white/70">Total de Empresas</span>
                <span className="text-[22px] font-bold leading-none text-white">{totalEmpresas}</span>
              </div>

              <div className="flex flex-col gap-1 rounded-lg  px-3 py-2">
                <span className="text-[11px] font-medium text-white/70">Licenças Ativas</span>
                <span className="text-[22px] font-bold leading-none text-green-400">{licencasAtivas}</span>
              </div>

              <div className="flex flex-col gap-1 rounded-lg px-3 py-2">
                <span className="text-[11px] font-medium text-white/70">MRR Estimado</span>
                <span className="text-[20px] font-bold leading-none text-white sm:text-[22px]">
                  {mrrEstimado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>

              <div className="flex flex-col gap-1 rounded-lg px-3 py-2">
                <span className="text-[11px] font-medium text-white/70">Inadimplência</span>
                <span className="text-[22px] font-bold leading-none text-red-400">{inadimplencia}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center opacity-25 md:justify-end md:pl-6">
            <img src="/escudo.svg" alt="" className="w-24 sm:w-28 md:w-30" />
          </div>
        </div>

        {/* Card de informações: "Empresas e Acessos" / "Financeiro e Cobrança" */}
        <div className="flex w-full flex-col gap-2 rounded-lg bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-1 flex-wrap gap-2">
            {infoCards.map((card, index) => {
              const IconComponent = card.icon;
              const isSelected = selectedCard === index;
              return (
                <button
                  key={card.name}
                  type="button"
                  onClick={() => setSelectedCard(index)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg p-3 transition-colors hover:bg-blue-50 sm:p-4"
                >
                  <IconComponent
                    className={`h-6 w-6 shrink-0 transition-colors ${
                      isSelected ? "text-blue-600" : "text-[#8680A4]"
                    }`}
                  />
                  <h2
                    className={`whitespace-nowrap border-b-2 pb-1 text-base font-semibold transition-colors sm:text-lg ${
                      isSelected ? "border-blue-600 text-blue-600" : "border-transparent text-[#8680A4] hover:text-blue-600"
                    }`}
                  >
                    {card.name}
                  </h2>
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-auto">
            <button
              onClick={handleNovaEmpresa}
              className="w-full cursor-pointer rounded-xl bg-[#009699] px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600 sm:w-auto"
            >
              + Nova Empresa
            </button>
          </div>
        </div>

        {/* Conteúdo dinâmico baseado no card selecionado */}
        <div className="w-full overflow-hidden rounded-lg bg-white px-2 py-2">
          {selectedCard === 0 && (
            <div className="p-2 sm:p-4">
              <div className="mb-6 flex items-center gap-3">
                <BuildingOffice2Icon className="h-6 w-6 shrink-0 text-blue-600" />
                <h2 className="text-xl font-bold text-[#1E40AF] sm:text-2xl">Empresas e Acessos</h2>
              </div>

              {/* Barra de Pesquisa e Filtro */}
              <div className="mb-5 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1 font-medium text-black">
                  <input
                    type="text"
                    placeholder="Buscar empresa, responsável ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 font-bold text-black focus:outline-none focus:ring-2 focus:ring-blue-600 sm:w-auto"
                >
                  <option value="todos">Status: Todos</option>
                  <option value="ativa">Status: Ativa</option>
                  <option value="inativa">Status: Inativa</option>
                  <option value="bloqueado">Status: Bloqueado</option>
                  <option value="pendente">Status: Pendente</option>
                </select>
              </div>

              {/* Tabela de Empresas */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="max-h-96 overflow-x-auto overflow-y-auto sm:max-h-72" style={{ scrollbarGutter: "stable" }}>
                  <table className="w-full min-w-[780px]">
                    <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Empresa</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Plano</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Responsável</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">Próx. Cobrança</th>
                        <th className="px-6 py-4 text-center font-semibold text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empresasPaginadas.map((empresa) => {
                        const statusColor = getStatusColor(empresa.status);
                        return (
                          <tr key={empresa.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`${empresa.cor} flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white`}
                                >
                                  {getInitials(empresa.nome)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{empresa.nome}</p>
                                  <p className="text-xs font-light text-gray-500">{empresa.cnpj}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 font-medium text-gray-700">{empresa.plano}</td>

                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">{empresa.responsavel}</p>
                                <p className="text-xs font-light text-gray-500">{empresa.email}</p>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <span
                                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusColor.bg} ${statusColor.text}`}
                                >
                                  {empresa.status === "ativa" && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                                  {empresa.status === "inativa" && <XCircleIcon className="h-4 w-4 text-gray-500" />}
                                  {empresa.status === "bloqueado" && <XCircleIcon className="h-4 w-4 text-red-500" />}
                                  {empresa.status === "pendente" && <ClockIcon className="h-4 w-4 text-yellow-500" />}
                                  <span>{getStatusLabel(empresa.status)}</span>
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 font-light text-gray-700">{empresa.dataCobranca}</td>

                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEnviarMensagem(empresa.id, empresa.nome)}
                                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                  title="Enviar mensagem"
                                >
                                  <EnvelopeIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleEditar(empresa.id, empresa.nome)}
                                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                                  title="Editar"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDeletar(empresa.id, empresa.nome)}
                                  className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                                  title="Deletar"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {empresasPaginadas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                            Nenhuma empresa encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginação */}
              <div className="mt-3 flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
                <p className="text-sm font-light text-gray-600">
                  {empresasPaginadas.length} de {empresasFiltradas.length} linha(s) exibida(s).
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-black transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-black transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedCard === 1 && (
            <div className="p-2 sm:p-6">
              <div className="mb-6">
                <div className="relative w-full max-w-sm">
                  <input
                    type="text"
                    placeholder="Buscar cobrança por empresa ou CNPJ..."
                    value={searchTermFinanceiro}
                    onChange={(e) => {
                      setSearchTermFinanceiro(e.target.value);
                      setCurrentPageFinanceiro(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Tabela de Cobranças */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white font-bold">
                <div className="max-h-72 overflow-x-auto overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
                  <table className="w-full min-w-[760px]">
                    <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 font-medium">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Empresa</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Plano</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Valor</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Vencimento</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empresasFinanceiroFiltradas
                        .slice((currentPageFinanceiro - 1) * itemsPerPage, currentPageFinanceiro * itemsPerPage)
                        .map((empresa) => {
                          const statusColor = getStatusColor(empresa.status);
                          return (
                            <tr key={empresa.id} className="border-b border-gray-200 transition hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-medium text-gray-900">{empresa.nome}</p>
                                  <p className="text-xs text-gray-500">{empresa.cnpj}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-700">{empresa.plano}</td>
                              <td className="px-4 py-4 text-sm font-semibold text-gray-900">{empresa.valor}</td>
                              <td className="px-4 py-4 text-sm text-gray-700">{empresa.dataCobranca}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium ${statusColor.bg} ${statusColor.text}`}
                                  >
                                    {empresa.status === "ativa" && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                                    {empresa.status === "inativa" && <XCircleIcon className="h-4 w-4 text-gray-500" />}
                                    {empresa.status === "bloqueado" && <XCircleIcon className="h-4 w-4 text-red-500" />}
                                    {empresa.status === "pendente" && <ClockIcon className="h-4 w-4 text-yellow-500" />}
                                    <span>{getStatusLabel(empresa.status)}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleEnviarMensagem(empresa.id, empresa.nome)}
                                    title="Enviar cobrança / mensagem"
                                    className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                  >
                                    <EnvelopeIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginação */}
              <div className="mt-6 flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
                <p className="text-sm text-gray-600">
                  Página {currentPageFinanceiro} de {totalPagesFinanceiro}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentPageFinanceiro((p) => Math.max(1, p - 1))}
                    disabled={currentPageFinanceiro === 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPageFinanceiro((p) => Math.min(totalPagesFinanceiro, p + 1))}
                    disabled={currentPageFinanceiro === totalPagesFinanceiro}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Mensagem */}
        {modalType === "mensagem" && modalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-4">
            <div className="absolute inset-0 bg-black/50" onClick={closeModal} aria-hidden="true" />
            <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Enviar mensagem</h3>
                    <p className="text-sm text-gray-600">
                      Para <span className="font-semibold text-black">{modalData.empresaNome}</span>
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="text-gray-500 hover:text-black" aria-label="Fechar">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-black">Assunto</label>
                  <input
                    type="text"
                    placeholder="Ex: Cobrança / Atualização de plano"
                    className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-black">Mensagem</label>
                  <textarea
                    className="min-h-[150px] w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows={6}
                    placeholder="Digite sua mensagem..."
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
                <button
                  onClick={closeModal}
                  className="w-full rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={closeModal}
                  className="w-full rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Editar */}
        {modalType === "editar" && modalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-4 sm:px-4">
            <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-8">
              <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-0 font-medium text-black sm:pr-4">
                <div>
                  <h4 className="mb-4 text-lg font-semibold text-gray-800">Dados da empresa</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Razão Social/Nome Fantasia</label>
                      <input
                        type="text"
                        value={editForm.nome}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                        placeholder="Bony Custo Barberaria"
                        className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">CNPJ</label>
                        <input
                          type="text"
                          value={editForm.cnpj}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, cnpj: e.target.value }))}
                          placeholder="15.548.254/0001-65"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Planos</label>
                        <select
                          value={editForm.plano}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, plano: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="Standart">Standart (R$ 69,90/mês)</option>
                          <option value="Profissional">Profissional (R$ 129,90/mês)</option>
                          <option value="Premium +">Premium + (R$ 249,90/mês)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-semibold text-gray-800">Localização</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Cidade</label>
                      <input
                        type="text"
                        value={editForm.cidade}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, cidade: e.target.value }))}
                        placeholder="Ingoá"
                        className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">UF</label>
                      <select
                        value={editForm.uf}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, uf: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="PB">PB</option>
                        <option value="SP">SP</option>
                        <option value="RJ">RJ</option>
                        <option value="MG">MG</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-semibold text-gray-800">Contato e Acesso</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Responsável</label>
                      <input
                        type="text"
                        value={editForm.responsavel}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, responsavel: e.target.value }))}
                        placeholder="Bony Custo"
                        className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">E-mail de Acesso</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="bony.costobarberaria@gmail.com"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Senha de Acesso</label>
                        <input
                          type="password"
                          value={editForm.senha}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, senha: e.target.value }))}
                          placeholder="bony123"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Telefone/Whatsapp</label>
                        <input
                          type="tel"
                          value={editForm.telefone}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, telefone: e.target.value }))}
                          placeholder="(83) 99999-9999"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, status: e.target.value as Empresa["status"] }))
                          }
                          className="w-full rounded-lg border border-gray-300 p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="ativa">Ativo</option>
                          <option value="inativa">Inativo</option>
                          <option value="bloqueado">Bloqueado</option>
                          <option value="pendente">Pendente</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t pt-6 sm:flex-row">
                <button
                  onClick={closeModal}
                  className="w-full rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  className="w-full rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700 sm:w-auto"
                >
                  Salvar Dados
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Nova Empresa */}
        {modalType === "criar" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-4 sm:px-4">
            <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-8">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h3 className="text-xl font-bold text-[#1E40AF]">Cadastrar Nova Empresa</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-black" aria-label="Fechar">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-0 font-medium text-black sm:pr-4">
                <div>
                  <h4 className="mb-3 text-base font-semibold text-gray-800">Dados Principais</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Razão Social / Nome Fantasia *</label>
                      <input
                        type="text"
                        value={createForm.nome}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, nome: e.target.value }))}
                        placeholder="Ex: Minha Empresa LTDA"
                        className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">CNPJ *</label>
                        <input
                          type="text"
                          value={createForm.cnpj}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, cnpj: e.target.value }))}
                          placeholder="00.000.000/0001-00"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Plano</label>
                        <select
                          value={createForm.plano}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, plano: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="Standart">Standart (R$ 69,90/mês)</option>
                          <option value="Profissional">Profissional (R$ 129,90/mês)</option>
                          <option value="Premium +">Premium + (R$ 249,90/mês)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-base font-semibold text-gray-800">Localização</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Cidade</label>
                      <input
                        type="text"
                        value={createForm.cidade}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, cidade: e.target.value }))}
                        placeholder="Ex: João Pessoa"
                        className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">UF</label>
                      <select
                        value={createForm.uf}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, uf: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="PB">PB</option>
                        <option value="SP">SP</option>
                        <option value="RJ">RJ</option>
                        <option value="MG">MG</option>
                        <option value="PE">PE</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 text-base font-semibold text-gray-800">Contato & Acesso</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Nome do Responsável</label>
                      <input
                        type="text"
                        value={createForm.responsavel}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, responsavel: e.target.value }))}
                        placeholder="Ex: Carlos Silva"
                        className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">E-mail de Acesso *</label>
                        <input
                          type="email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="contato@empresa.com"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Senha Inicial</label>
                        <input
                          type="password"
                          value={createForm.senha}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, senha: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Telefone / WhatsApp</label>
                        <input
                          type="tel"
                          value={createForm.telefone}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, telefone: e.target.value }))}
                          placeholder="(83) 99999-9999"
                          className="w-full rounded-lg border border-gray-300 p-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Status Inicial</label>
                        <select
                          value={createForm.status}
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, status: e.target.value as Empresa["status"] }))
                          }
                          className="w-full rounded-lg border border-gray-300 p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="ativa">Ativo</option>
                          <option value="inativa">Inativo</option>
                          <option value="bloqueado">Bloqueado</option>
                          <option value="pendente">Pendente</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t pt-6 sm:flex-row">
                <button
                  onClick={closeModal}
                  className="w-full rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarCriacao}
                  className="w-full rounded-lg bg-[#009699] px-6 py-2 font-medium text-white transition hover:bg-blue-600 sm:w-auto"
                >
                  Cadastrar Empresa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Deletar */}
        {modalType === "deletar" && modalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-4">
            <div className="absolute inset-0 bg-black/50" onClick={closeModal} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-red-600">Confirmar Exclusão</h3>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700" aria-label="Fechar">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-6 text-gray-600">
                Você tem certeza que deseja deletar <strong>{modalData.empresaNome}</strong>? Esta ação não pode ser
                desfeita.
              </p>

              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarDelecao}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}