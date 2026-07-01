"use client"
import React from "react";
import { title } from "process";
import { useState, useEffect } from "react";

import AdminLayout from "../components/ManuPage";

import { BuildingOffice2Icon, CurrencyDollarIcon, TrashIcon, PencilIcon, EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/outline";

const infoCards = [
 {name: "Empresas e Acessos", icon: BuildingOffice2Icon, value: "0"},
 {name: "Financeiro e Cobranças", icon: CurrencyDollarIcon, value: "R$ 00.000,00"},

]

// Dados serão carregados dinamicamente quando o cliente fizer cadastro
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
}

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
    cor: "bg-black" 
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
    cor: "bg-red-700" 
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
    cor: "bg-blue-600" 
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
    cor: "bg-blue-900" 
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
    cor: "bg-purple-600" 
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
    cor: "bg-green-600" 
  },
];

type ModalType = null | "mensagem" | "editar" | "deletar";

interface ModalData {
  empresaId: number;
  empresaNome: string;
}

export default function AdminPage() {
   const [selectedCard, setSelectedCard] = useState(0);
   const [notificacoes, setNotificacoes] = useState(0);
   const [modalType, setModalType] = useState<ModalType>(null);
   const [modalData, setModalData] = useState<ModalData | null>(null);
   const [empresas, setEmpresas] = useState<Empresa[]>(empresasExemplo);
   const [searchTerm, setSearchTerm] = useState("");
   const [statusFilter, setStatusFilter] = useState("todos");
   const [currentPage, setCurrentPage] = useState(1);
   const [currentPageFinanceiro, setCurrentPageFinanceiro] = useState(1);
   const itemsPerPage = 5;

   // useEffect para carregar dados quando o cliente fizer cadastro
   useEffect(() => {
     // Aqui virá a chamada para API ou dados do contexto global
     // Por enquanto, usando dados de exemplo para teste
   }, []);

   const handleEnviarMensagem = (id: number, nome: string) => {
     setModalData({ empresaId: id, empresaNome: nome });
     setModalType("mensagem");
   };

   const handleEditar = (id: number, nome: string) => {
     setModalData({ empresaId: id, empresaNome: nome });
     setModalType("editar");
   };

   const handleDeletar = (id: number, nome: string) => {
     setModalData({ empresaId: id, empresaNome: nome });
     setModalType("deletar");
   };

   const confirmarDelecao = () => {
     if (modalData) {
       setEmpresas(empresas.filter(emp => emp.id !== modalData.empresaId));
       setModalType(null);
       setModalData(null);
     }
   };

   const closeModal = () => {
     setModalType(null);
     setModalData(null);
   };

   // Filtrar empresas baseado na pesquisa e status
   const empresasFiltradas = empresas.filter(emp => {
     const matchSearch = emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
     const matchStatus = statusFilter === "todos" || emp.status === statusFilter;
     return matchSearch && matchStatus;
   });

   // Paginação
   const totalPages = Math.ceil(empresasFiltradas.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const empresasPaginadas = empresasFiltradas.slice(startIndex, startIndex + itemsPerPage);

   // Função para obter iniciais
   const getInitials = (nome: string) => {
     return nome.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
   };

   // Função para obter cor do status
   const getStatusColor = (status: string) => {
     switch(status) {
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
      <>
    <AdminLayout notificacoes={notificacoes}>
   <main className="flex-1 flex flex-col p-6 gap-7 bg-[#ece6e6]">

    {/* Card principal  tela de valores e metricas do Admin */ }
  <div className="bg-[#1E40AF] rounded-lg w-full px-7 py-5 flex justify-between items-stretch h-50">

    {/* Conteúdo esquerdo */}
    <div className="flex flex-col flex-1">
      <div className="flex items-center gap-2.5 mb-1.5">
        <img src="/escudo.svg" alt="Escudo" className="w-6 h-6" />
        <span className="text-[11px] font-semibold tracking-widest text-white/80 uppercase">
          Administração do Sistema
        </span>
      </div>

      <h1 className="text-[22px] font-bold text-white mb-5 tracking-tight">
        Gestão de Licenças
      </h1>

      <div className="flex items-end gap-10">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-white/70">Total de Empresas</span>
          <span className="text-[22px] font-bold text-white leading-none">0</span>
        </div>
        <div className="w-px h-9 bg-white/20 self-end mb-1" />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-white/70">Licenças Ativas</span>
          <span className="text-[22px] font-bold text-green-400 leading-none">0</span>
        </div>
        <div className="w-px h-9 bg-white/20 self-end mb-1" />
        
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-white/70">MRR Estimado</span>
          <span className="text-[22px] font-bold text-white leading-none">R$ 00.000,00</span>
        </div>
        <div className="w-px h-9 bg-white/20 self-end mb-1" />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-white/70">Inadimplência</span>
          <span className="text-[22px] font-bold text-red-400 leading-none">0</span>
        </div>
      </div>
    </div>

    {/* Escudo decorativo direita */}
    <div className="flex items-end pl-6 opacity-25">
      <img src="/escudo.svg" alt="Escudo" className="w-30" />
    </div>

  </div>

  {
    /* Card de informações  de " empresas e Acessos  " " solicitação de cadrastro para a plataforma" " financeiro e cobrança"*/
  }

  <div id="" className=" flex bg-white rounded-lg w-full px-7 py-5  h-17 items-center justify-content-between" >

    {/* Conteúdo do esquerdo */ }
    <div className="flex flex-1">

    {infoCards.map((card, index) => {
      const IconComponent = card.icon;
      const isSelected = selectedCard === index;
      return (
        <div 
          key={index} 
          onClick={() => setSelectedCard(index)}
          className="p-4 cursor-pointer flex items-center gap-2"
        >
          <IconComponent className={`w-6 h-6 transition-colors ${
            isSelected 
              ? 'text-blue-600' 
              : 'text-[#8680A4]'
          }`} />
          <span>
            <h2 className={`text-lg  font-semibold border-b-2 pb-1 transition-colors ${
              isSelected 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-[#8680A4] hover:text-blue-600'
            }`}>{card.name}</h2>
          </span>
        </div>
      );
    })}
    </div>

    {/* Botão */ }
    <div> 
      <button className="cursor-pointer bg-[#009699] text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors font-medium">
        + Nova Empresa
      </button>

    </div>

  </div>

  {/* Conteúdo dinâmico baseado no card selecionado */}
  <div className="bg-white rounded-lg w-full px-7 py-5">
    {selectedCard === 0 && (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-[#1E40AF]">Empresas e Acessos</h2>
        </div>
        
        {/* Barra de Pesquisa e Filtro */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar empresa, responsável ou e-mail..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="todos">Status: Todos</option>
            <option value="ativa">Status: Ativa</option>
            <option value="inativa">Status: Inativa</option>
            <option value="bloqueado">Status: Bloqueado</option>
            <option value="pendente">Status: Pendente</option>
          </select>
        </div>
        
        {/* Tabela de Empresas */}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Empresa</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Plano</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Responsável</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Próx. Cobrança</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {empresasPaginadas.map((empresa) => {
                const statusColor = getStatusColor(empresa.status);
                return (
                  <tr key={empresa.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    {/* Empresa com Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`${empresa.cor} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                          {getInitials(empresa.nome)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{empresa.nome}</p>
                          <p className="text-xs text-gray-500">{empresa.cnpj}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Plano */}
                    <td className="py-4 px-6 text-gray-700">{empresa.plano}</td>
                    
                    {/* Responsável */}
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{empresa.responsavel}</p>
                        <p className="text-xs text-gray-500">{empresa.email}</p>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusColor.dot}`}></span>
                        <span className={`text-sm font-medium ${statusColor.text}`}>
                          {getStatusLabel(empresa.status)}
                        </span>
                      </div>
                    </td>
                    
                    {/* Próxima Cobrança */}
                    <td className="py-4 px-6 text-gray-700">{empresa.dataCobranca}</td>
                    
                    {/* Ações */}
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEnviarMensagem(empresa.id, empresa.nome)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Enviar mensagem"
                        >
                          <EnvelopeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditar(empresa.id, empresa.nome)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletar(empresa.id, empresa.nome)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Deletar"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-6 py-4">
          <p className="text-sm text-gray-600">0 de {empresasFiltradas.length} linha(s) selecionadas.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    )}
    
    
    
    {selectedCard === 1 && (
      <div className="bg-white rounded-lg p-6">
        <div className="mb-6">
          <div className="relative inline-block w-full max-w-sm">
            <input
              type="text"
              placeholder="Buscar cobrança por empresa..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabela de Cobranças */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Empresa</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Plano</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Valor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Vencimento</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 text-sm">Status</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-800 text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {empresas.slice((currentPageFinanceiro - 1) * itemsPerPage, currentPageFinanceiro * itemsPerPage).map((empresa) => {
                const statusColor = getStatusColor(empresa.status);
                return (
                  <tr key={empresa.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{empresa.nome}</p>
                        <p className="text-xs text-gray-500">{empresa.cnpj}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700 text-sm">{empresa.plano}</td>
                    <td className="py-4 px-4 text-gray-900 font-semibold text-sm">{empresa.valor}</td>
                    <td className="py-4 px-4 text-gray-700 text-sm">{empresa.dataCobranca}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusColor.dot}`}></span>
                        <span className={`text-sm font-medium ${statusColor.text}`}>
                          {getStatusLabel(empresa.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                          + Enviar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-6 py-4">
          <p className="text-sm text-gray-600">0 de 5 linha(s) selecionadas.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPageFinanceiro(Math.max(1, currentPageFinanceiro - 1))}
              disabled={currentPageFinanceiro === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPageFinanceiro(Math.min(Math.ceil(empresas.length / itemsPerPage), currentPageFinanceiro + 1))}
              disabled={currentPageFinanceiro === Math.ceil(empresas.length / itemsPerPage)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
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
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Enviar Mensagem</h3>
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-4">Enviar mensagem para <strong>{modalData.empresaNome}</strong></p>
        <textarea 
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
          rows={4}
          placeholder="Digite sua mensagem..."
        />
        <div className="flex justify-end gap-3">
          <button 
            onClick={closeModal}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={closeModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Modal de Editar */}
  {modalType === "editar" && modalData && (
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4 bg-black/50 overflow-y-auto py-8">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Editar Empresa</h3>
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          {/* Dados da empresa */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Dados da empresa</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social/Nome Fantasia</label>
                <input 
                  type="text" 
                  placeholder="Bony Custo Barberaria"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input 
                    type="text" 
                    placeholder="15.548.254/0001-65"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planos</label>
                  <select className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option>Profissional</option>
                    <option>Básico</option>
                    <option>Premium</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Localização</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input 
                  type="text" 
                  placeholder="Ingoá"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                <select className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>PB</option>
                  <option>SP</option>
                  <option>RJ</option>
                  <option>MG</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contato e Acesso */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Contato e Acesso</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <input 
                  type="text" 
                  placeholder="Bony Custo"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Acesso</label>
                  <input 
                    type="email" 
                    placeholder="bony.costobarberaria@gmail.com"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label>
                  <input 
                    type="password" 
                    placeholder="bony123"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/Whatsapp</label>
                  <input 
                    type="tel" 
                    placeholder="(83) 99999-9999"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-8 border-t pt-6">
          <button 
            onClick={closeModal}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={closeModal}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Salvar Dados
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Modal de Deletar */}
  {modalType === "deletar" && modalData && (
    <div className="fixed inset-0 z-999 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-red-600">Confirmar Exclusão</h3>
          <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Você tem certeza que deseja deletar <strong>{modalData.empresaNome}</strong>? Esta ação não pode ser desfeita.
        </p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={closeModal}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button 
            onClick={confirmarDelecao}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Deletar
          </button>
        </div>
      </div>
    </div>
  )}

</main>

    </AdminLayout>
      </>
  );
}
