'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import menu from '../config/menu';
import FeatureCard from './FeatureCard';
import Modal from './Modal';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [open, setOpen] = useState(false);
const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.pageYOffset;
      const offset = 80; // ajuste para header fixo, altere se necessário
      window.scrollTo({ top: top - offset, behavior: 'smooth' });
    } else {
      console.warn('Elemento não encontrado:', id);
    }
    setOpen(false);
  };

  return (
    <header className="relative w-full min-h-screen flex flex-col items-center overflow-hidden font-bevietnam font-medium">
      {/* ELIPSE AZUL */}
      <div
        className="
    absolute
    rounded-full
    bg-[#00218F]
    w-[210vw]
    h-[195vh]
    -top-[95vh]
    -left-[90vw]
  "
      />

      {/* LUZ ESQUERDA */}
      <div
        className="
    pointer-events-none
    absolute
    top-[-20%]
    left-[-30%]
    h-full
    w-[500px]
    md:w-[800px]
    rounded-full
    bg-gradient-to-r
    from-white/10
    via-white/5
    md:from-white/40
    md:via-white/20
    to-transparent
    blur-3xl
    z-10
  "
      />

      {/* LUZ DIREITA */}
      <div
        className="
    pointer-events-none
    absolute
    top-[-20%]
    right-[-30%]
    h-full
    w-[500px]
    md:w-[800px]
    rounded-full
    bg-gradient-to-l
    from-white/10
    via-white/5
    md:from-white/40
    md:via-white/20
    to-transparent
    blur-3xl
    z-10
  "
      />

      {/* NAVBAR */}
      <nav className="h-20 w-full z-20">
        <div className="mx-auto px-6">
          <div className="flex justify-around items-center h-20">
            {/* LOGO */}
            <div className="flex items-center top-12">
              <Image src="/nova-logo.svg" alt="logo" width={200} height={100} />
            </div>

            {/* MENU */}
            <ul className="hidden md:flex gap-10 text-white font-bevietnam text-[17px]">
              {menu.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleScroll(item.id);
                    }}
                    className="hover:opacity-75 transition"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* AÇÕES */}
            <div className="hidden md:flex gap-4">
              <button 
              onClick={()=>router.push("/login")}
              className=" cursor-pointer h-[46px] px-[45px] rounded-lg border border-white/60 text-white hover:bg-white/10 transition">
                Entrar
              </button>
              <button
              onClick={()=> router.push("/register")}
              className=" cursor-pointer  h-[50px] px-[52px] rounded-lg bg-white text-purple-600 hover:bg-gray-100 transition">
                Criar Conta
              </button>
            </div>

            {/* MOBILE */}
            <div className="md:hidden">
              <button onClick={() => setOpen(!open)} className="text-white text-2xl">
                ☰
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="md:hidden mx-4 bg-blue-900/95 rounded-xl p-3 z-30">
            <ul className="flex flex-col gap-3 text-white font-bevietnam text-sm">
              {menu.map((item) => (
                <li key={item.id}>
                  <button onClick={() => handleScroll(item.id)} className="text-left w-full">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-col mt-4 gap-3">
              <button
               onClick={()=>router.push("/login")}
              className="border border-white/60 text-white py-2 rounded-lg text-sm">
             
                Entrar
              </button>
              <button onClick={()=>router.push("/register")} className="bg-white text-purple-600 py-3 rounded-lg text-sm font-medium">
                Criar Conta
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <div id="inicio" className="relative z-10 text-center pt-10 px-4 max-w-4xl mx-auto">
        <h1 className="text-white font-bold text-3xl md:text-6xl lg:text-7xl leading-tight font-bevietnam">
          Gerencie Seu <span className="text-[#37E2D5]">Negócio</span>
          <br />
          Com Inteligência
        </h1>

        <p className="mt-4 text-white/90 text-base md:text-xl font-bevietnam">
          O Gest Pro é a solução completa para pequenos e médios comércios.
          <br />
          PDV, CRM, estoque, financeiro e fiscal em uma única plataforma.
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-6 justify-center">
          <button className="bg-white text-purple-600 px-6 py-3 rounded-lg text-sm md:text-base font-medium">
            Começar Grátis
          </button>
          <button className="border border-white/60 text-white px-12 py-3 rounded-lg text-sm md:text-base">
            Ver Demo
          </button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="relative z-20 mt-16">
        <Image
          src="/desh.png"
          alt="Dashboard"
          width={1000}
          height={700}
          className="w-full max-w-5xl mx-auto"
        />
      </div>

      <main id="recursos" className="bg-white relative z-20 mt-24 py-20 px-4">
        {/* TÍTULO */}
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold font-bevietnam text-black">
            Nossa Solução Para O Seu Negócio
          </h2>
          <p className="mt-4 text-[#969696] text-base sm:text-lg font-bevietnam">
            Tudo o que você precisa para gerenciar, vender e crescer em uma única plataforma
            intuitiva
          </p>
        </div>

        {/* GRID DE CARDS */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 font-bevietnam  font-medium">
          {/* CARD */}
          {[
            {
              title: 'PDV Frente de Caixa',
              desc: 'Venda rápido e sem travar. Totalmente online.',
              icon: '/PDV.svg',
              modalText:
                'Nosso PDV é projetado para velocidade e estabilidade. Realize vendas em segundos, com suporte e leitores de código de barras, balanças e impressoras térmicas. ',
            },
            {
              title: 'Controle de Estoque',
              desc: 'Saiba exatamente o que tem na prateleira.',
              icon: '/controle-Estoque.svg',
              modalText:
                'Tenha visão total do seu inventário. Acompanhe entradas e saídas em tempo real, defina estoques mínimos para alertas automáticos de reposição e gerencie múltiplos depósitos. Evite perdas e rupturas com relatórios precisos de giro de estoque.',
            },
            {
              title: 'Emissão Fiscal',
              desc: 'NFC-e e SAT simples para o dia a dia.',
              icon: '/emissao.svg',
              modalText:
                'Simplifique sua contabilidade. Emita NFC-e (Cupom Fiscal Eletrônico), NF-e (Nota Grande) e SAT com facilidade. O sistema calcula automaticamente os impostos e gera arquivos XML para seu computador.',
            },
            {
              title: 'Gestão Financeira',
              desc: 'Contas a pagar, receber e fluxo de caixa.',
              icon: '/gestao-financeira.svg',
              modalText:
                'Controle cada centavo. Acompanhe seu fluxo de caixa diário, contas a pagar e receber. Saiba exatamente qual é o lucro da sua operação e onde você pode otimizar custos.',
            },
            {
              title: 'Gestão de Vendedores',
              desc: 'Defina comissões e acompanhe as vendas.',
              icon: '/gestao-vendas.svg',
              modalText:
                'Gerencie seu time com eficiência. Crie perfis de acesso com permissões personalizadas, controle comissões de vendedores automaticamente e acompanhe o desenvolvimento individual de cada colaborador através de metas e indicadores.',
            },
            {
              title: 'Relatórios Fáceis',
              desc: 'Saiba quando vendeu e qual seu lucro no dia.',
              icon: '/relatorio-facil.svg',
              modalText:
                'Tome decisões baseadas em dados. Acesse dashboards intuitivos com curva ABC de produtos, ticket médio, horários de pico, ranking de clientes e lucratividade por categoria. Exporte tudo para o Excel ou PDF com um clique.   ',
            },
          ].map((card) => (
            <FeatureCard
              key={card.title}
              card={card}
              onSaibaMais={(c) => {
                setModalContent(c)
                setModalOpen(true)
              }}
            />
          ))}
        </div>
      </main>

      <Modal open={modalOpen} content={modalContent} onClose={() => setModalOpen(false)} />
    </header>
  );
}
