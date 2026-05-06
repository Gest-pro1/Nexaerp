'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import menu from '../config/menu';


export default function Footer() {
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: top - offset, behavior: 'smooth' });
    }
  };

  return (
    <footer className="overflow-hidden font-benvietnam font-medium">

      {/* ================== SEÇÃO SEGMENTOS ================== */}
      <section className="bg-[#111827] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[#0089ED] font-bold text-xl sm:text-2xl">
            Feito para o seu negócio
          </h2>

          <h1
            id="segmentos"
            className="text-white text-3xl sm:text-4xl md:text-6xl font-bold mt-3 mb-6"
          >
            Soluções por Segmento
          </h1>

          <p className="text-white/90 text-base sm:text-lg max-w-3xl mx-auto">
            O GestPro se adapta às necessidades específicas da sua empresa.
            Escolha o módulo ideal no momento do cadastro.
          </p>
        </div>

        {/* ================== CARDS ================== */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto font-bevietnam font-medium">

          {[
            {
              img: 'loja.svg',
              title: 'Lojas e Varejo',
              desc: 'Ideal para roupas, calçados, eletrônicos e bazar.',
              items: ['Grade de cores e tamanhos', 'Controle de Crediário', 'Etiquetas Personalizadas'],
            },
            {
              img: 'mercado.svg',
              title: 'Mercados e Padarias',
              desc: 'Agilidade no caixa para alto fluxo de clientes.',
              items: ['PDV super rápido', 'Integração com balança', 'Controle de validade'],
            },
            {
              img: 'bar-restaurante.svg',
              title: 'Bares e Restaurantes',
              desc: 'Gestão completa da cozinha ao delivery.',
              items: ['Comanda eletrônica', 'Sistema KDS (Cozinha)', 'Gestão de mesas'],
            },
            {
              img: 'salao-barbearia.svg',
              title: 'Salões e Barbearias',
              desc: 'Organize sua agenda e fidelize clientes.',
              items: ['Agendamento online', 'Cálculo de comissões', 'Pacotes de serviços'],
            },
          ].map((card, index) => (
            <div
              key={index}
              className="group rounded-2xl bg-[#0E1B2A] border border-white/10 overflow-hidden shadow-lg flex flex-col"
            >
              <div className="relative h-[180px] overflow-hidden">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40" />
                <h3 className="absolute bottom-4 left-4 text-white text-lg font-semibold">
                  {card.title}
                </h3>
              </div>

              <div className="p-5 text-white flex flex-col flex-1">
                <p className="text-sm text-white/70 mb-4">{card.desc}</p>

                <ul className="space-y-3 text-sm mb-6">
                  {card.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button className="mt-auto w-full rounded-lg border border-white/30 py-2 text-sm font-medium transition hover:bg-white hover:text-[#0E1B2A]">
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================== FOOTER FINAL ================== */}
      <section className="bg-[#00218F]">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-white">

            {/* LOGO */}
            <div className="flex flex-col items-start">
  <Image
    src="/nova-logo.svg"
    alt="GestPro"
    width={170}
    height={40}
    className="-ml-7 mb-3"
  />

  <p className="max-w-xs text-sm text-white/70 leading-relaxed">
    A plataforma definitiva para gestão de comércios,
    restaurantes e serviços.
  </p>
</div>

            {/* NAVEGAÇÃO */}
            <div>
              <h2 className="font-semibold mb-4">Navegação</h2>
              <ul className="space-y-3 text-sm text-white/80">
                {menu.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleScroll(item.id)}
                      className="hover:text-white transition text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* CONTATO */}
            <div>
              <h2 className="font-semibold mb-3">Contato</h2>
              <ul className="space-y-3 text-sm text-white/80">
                <li>
                  <span className="block font-medium text-white">Email</span>
                  contato@gestpro.com
                </li>
                <li>
                  <span className="block font-medium text-white">WhatsApp</span>
                  (83) 99999-9999
                </li>
              </ul>
            </div>

            {/* REDES SOCIAIS */}
            <div>
              <h2 className="font-semibold mb-4">Siga-nos</h2>
              <p className="text-sm text-white/80 mb-3">
                Acompanhe nossas novidades e dicas nas redes sociais.
              </p>

              <div className="flex items-center gap-4">
                <FaInstagram size={20} />
                <FaFacebookF size={20} />
                <FaLinkedinIn size={20} />
                <FaYoutube size={20} />
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-12 pt-6 text-center text-sm text-white/60">
            ©2025 GestPro. Todos os direitos reservados
          </div>
        </div>
      </section>

    </footer>
  );
}
