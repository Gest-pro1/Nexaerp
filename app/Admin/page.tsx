"use client"
import { title } from "process";

import AdminLayout from "../components/ManuPage";


export default function AdminPage() {
   
    return (
      <>
    <AdminLayout>
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


   <div className="p-4 cursor-pointer">
      <span>
        <h2 className="text-lg font-semibold text-[#8680A4] mb-2 hover:text-blue-600 transition-colors">Empresas e Acessos</h2>
      </span>
   </div>
    <div className="p-4 cursor-pointer">
      <span>
        <h2 className="text-lg font-semibold text-[#8680A4] mb-2 hover:text-blue-600 transition-colors">Solicitações</h2>
      </span>
   </div>
    <div className="p-4 cursor-pointer ">
      <span>
        <h2 className="text-lg font-semibold text-[#8680A4] mb-2 hover:text-blue-600 transition-colors">Financeiro e Cobranças</h2>
      </span>
   </div>

    </div>
    {/* Botão */ }
    <div> 
      <button className="cursor-pointer bg-[#009699] text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors font-medium">
        + Nova Empresa
      </button>

    </div>

  </div>
</main>

    </AdminLayout>
      </>
  );
}
