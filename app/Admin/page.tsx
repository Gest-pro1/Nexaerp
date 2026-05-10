"use client"
import React from "react";
import { title } from "process";
import { useState, useEffect } from "react";

import AdminLayout from "../components/ManuPage";

import {
  BuildingOffice2Icon,
  UserPlusIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const infoCards = [
 {name: "Empresas e Acessos", icon: BuildingOffice2Icon, value: "0"},
 {name: "Solicitações", icon: UserPlusIcon, value: "0"},
 {name: "Financeiro e Cobranças", icon: CurrencyDollarIcon, value: "R$ 00.000,00"},

]
export default function AdminPage() {
   const [selectedCard, setSelectedCard] = useState(0);
   const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
   const [notificacoes, setNotificacoes] = useState(0);

   useEffect(() => {
     // Carregar solicitações do localStorage
     const solicitacoesArmazenadas = JSON.parse(localStorage.getItem('solicitacoes') || '[]');
     setSolicitacoes(solicitacoesArmazenadas);
     setNotificacoes(solicitacoesArmazenadas.length);

     // Escutar novas solicitações de cadastro
     const handleNewSolicitacao = (event: any) => {
       const novaSolicitacao = event.detail;
       setSolicitacoes(prev => [novaSolicitacao, ...prev]);
       setNotificacoes(prev => prev + 1);
     };

     window.addEventListener('novaSolicitacao', handleNewSolicitacao);
     return () => window.removeEventListener('novaSolicitacao', handleNewSolicitacao);
   }, []);

   const aprovarSolicitacao = (index: number) => {
     const novasSolicitacoes = solicitacoes.filter((_, i) => i !== index);
     setSolicitacoes(novasSolicitacoes);
     setNotificacoes(prev => Math.max(0, prev - 1));
     localStorage.setItem('solicitacoes', JSON.stringify(novasSolicitacoes));
   };

   const rejeitarSolicitacao = (index: number) => {
     const novasSolicitacoes = solicitacoes.filter((_, i) => i !== index);
     setSolicitacoes(novasSolicitacoes);
     setNotificacoes(prev => Math.max(0, prev - 1));
     localStorage.setItem('solicitacoes', JSON.stringify(novasSolicitacoes));
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
          <span className="text-[11px] font-medium text-white/70">Solicitações Pendentes</span>
          <span className="text-[22px] font-bold text-yellow-400 leading-none">0</span>
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
        <div className="flex items-center gap-3 mb-4">
          <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-[#1E40AF]">Empresas e Acessos</h2>
        </div>
        <p className="text-gray-600">Gerencie as empresas cadastradas e seus acessos no sistema</p>
      </div>
    )}
    
    {selectedCard === 1 && (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <UserPlusIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-[#1E40AF]">Solicitações de Cadastro</h2>
            <p className="text-sm text-gray-600">Aprove novas clientes para liberar acesso ao sistema.</p>
          </div>
        </div>
        
        {solicitacoes.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nenhuma solicitação pendente</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Empresa Solicitante</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Plano Desejado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Responsável</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Contato</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Data Solicitação</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((solicitacao, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{solicitacao.nomeEmpresa}</p>
                        <p className="text-xs text-gray-500">{solicitacao.cnpj}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{solicitacao.plano}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{solicitacao.nomeRepresentante}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-700">{solicitacao.email}</p>
                        <p className="text-xs text-gray-500">{solicitacao.telefone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{solicitacao.dataSubmissao}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => rejeitarSolicitacao(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded"
                          title="Rejeitar"
                        >
                          ✕
                        </button>
                        <button 
                          onClick={() => aprovarSolicitacao(index)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded"
                          title="Aprovar"
                        >
                          ✓
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
              {solicitacoes.length} de {solicitacoes.length} linha(s) selecionadas.
            </div>
          </div>
        )}
      </div>
    )}
    
    {selectedCard === 2 && (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-[#1E40AF]">Financeiro e Cobranças</h2>
        </div>
        <p className="text-gray-600">Gestão de receita, cobranças e inadimplência</p>
      </div>
    )}
  </div>

</main>

    </AdminLayout>
      </>
  );
}
