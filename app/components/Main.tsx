'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon, CheckIcon } from '@heroicons/react/20/solid';

/* ================= UTIL ================= */
function classNames(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/* ================= DATA ================= */
const frequencies = [
  { value: 'Mês' as const, label: 'Mês', priceSuffix: '/Mês' },
  { value: 'Ano' as const, label: 'Ano', priceSuffix: '/Ano' },
];

interface Tier {
  name: string
  id: string
  price: { Mês: string; Ano: string }
  description: string
  features: string[]
}

const tiers: Tier[] = [
  {
    name: 'Stardart',
    id: 'tier-standard',
    price: { Mês: 'R$69,90', Ano: 'R$ 671,04' },
    description: 'Para começar agora.',
    features: [
      '1 Usuário',
      'Até 500 Notas/mês',
      'Gestão de Vendas (PDV)',
      'Relatórios Básicos',
      'Suporte WhatsApp',
      'Módulos Personalizados',
    ],
  },
  {
    name: 'Professional',
    id: 'tier-professional',
    price: { Mês: 'R$129,90', Ano: 'R$ 1.247,04' },
    description: 'Para quem quer crescer.',
    features: [
      '3 Usuários',
      'Notas Ilimitadas',
      'Gestão de Estoque Avançada',
      'Módulos Personalizados',
      'Suporte 24 Horas',
      'Controle Financeiro',
    ],
  },
  {
    name: 'Premium +',
    id: 'tier-premium-plus',
    price: { Mês: 'R$249,90', Ano: 'R$ 2.399,04' },
    description: 'Para gestão e consultoria.',
    features: [
      'Usuários Ilimitados',
      'Multi-lojas',
      'API de Integração',
      'Consultoria de Negócios',
      'Gráficos Avançados',
      'Módulos Personalizados',
    ],
  },
];

/* ================= COMPONENT ================= */
export default function Main() {
  const router = useRouter();
  const [frequency, setFrequency] = useState(frequencies[0]);
  const [selectedPlan, setSelectedPlan] = useState(tiers[1]);

  const handleSelectPlan = (tier: Tier) => {
    router.push('/register');
  };

  return (
    <main className="overflow-hidden font-bevietnam font-medium">
      {/* ================= HERO ================= */}
      <section
        id="beneficios"
        className="relative w-full overflow-hidden bg-[#F3F5FF] py-16 sm:py-20 lg:py-24"
      >
        {/* Shape decorativo */}
        <div className="absolute hidden sm:block right-[-780px] top-1/2 -translate-y-1/2 w-[1340px] h-[1600px] bg-[#00218F] rounded-full -rotate-[50deg] scale-x-[0.88] skew-y-[-8deg]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div>
              <h2 className="mb-8 text-3xl sm:text-4xl lg:text-[3rem] font-bold leading-tight text-[#0B0B3B]">
                Que benefícios
                <br />
                você terá?
              </h2>

              <ul className="space-y-6">
                {[
                  ['Controle Financeiro Total', 'Fluxo de caixa integrado.'],
                  ['Emissão Fiscal Descomplicada', 'NF-e e NFC-e em poucos cliques.'],
                  ['Fidelização de Clientes', 'CRM integrado.'],
                  ['Acesso de Qualquer Lugar', 'Sistema 100% online.'],
                ].map(([title, desc]) => (
                  <li key={title} className="flex gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-[#39FF14] drop-shadow-[0_0_6px_#39FF14]" />
                    <div>
                      <p className="font-semibold text-[#0B0B3B]">{title}</p>
                      <p className="text-sm text-[#4A4A68]">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Imagem */}
            <div className="flex justify-center">
              <Image
                src="/dash-2.svg"
                alt="Dashboard"
                width={870}
                height={480}
                className="w-full max-w-xl lg:max-w-none rounded-xl shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRICING ================= */}
      <section id="precos" className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-[3.5rem] font-bold text-[#0C0047]">
              Nossos Preços
            </h2>
            <p className="mt-3 text-gray-600 font-medium">
              Pague online com segurança e gerencie sua assinatura em qualquer dispositivo.
            </p>
          </div>

          {/* Toggle */}
          <div className="mt-12 flex justify-center">
            <RadioGroup
              value={frequency}
              onChange={setFrequency}
              className="grid grid-cols-2 gap-1 rounded-full p-1 ring-1 ring-gray-200"
            >
              {frequencies.map((option) => (
                <RadioGroup.Option
                  key={option.value}
                  value={option}
                  className={({ checked }) =>
                    classNames(
                      checked ? 'bg-[#00218F] text-white' : 'text-gray-500',
                      'cursor-pointer rounded-full px-4 py-2 text-sm font-semibold',
                    )
                  }
                >
                  {option.label}
                </RadioGroup.Option>
              ))}
            </RadioGroup>
          </div>

          {/* Cards */}
          <div className="mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {tiers.map((tier) => {
              const isSelected = selectedPlan.id === tier.id;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedPlan(tier)}
                  className={classNames(
                    isSelected
                      ? 'bg-[#00218F] text-white ring-2 ring-[#00218F] shadow-xl'
                      : 'bg-white text-gray-900 ring-1 ring-gray-200',
                    `
                      cursor-pointer
                      rounded-[14px]
                      p-6 sm:p-8
                      transition-all
                      duration-300
                      w-full
                      max-w-[384px]
                      min-h-[680px]
                      flex
                      flex-col
                    `,
                  )}
                >
                  {/* Título */}
                  <h3 className="text-2xl font-semibold text-center">{tier.name}</h3>

                  {/* Descrição */}
                  <p
                    className={classNames(
                      'mt-6 text-center',
                      isSelected ? 'text-white/90' : 'text-gray-600',
                    )}
                  >
                    {tier.description}
                  </p>

                  {/* Preço */}
                  <p className="mt-8 text-3xl sm:text-4xl font-bold text-center">
                    {tier.price[frequency.value]}
                    <span
                      className={classNames(
                        'ml-1 text-sm',
                        isSelected ? 'text-white/70' : 'text-gray-500',
                      )}
                    >
                      {frequency.priceSuffix}
                    </span>
                  </p>

                  {/* Botão */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(tier);
                    }}
                    className={classNames(
                      isSelected ? 'bg-white text-[#0B0B3B]' : 'bg-[#00218F] text-white',
                      'mt-8 w-full rounded-xl py-3 text-sm font-semibold transition hover:scale-[1.02]',
                    )}
                  >
                    {isSelected ? 'Continuar com este plano' : 'Selecionar Plano'}
                  </button>

                  {/* Features */}
                  <ul className="mt-8 space-y-3 text-base flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <CheckIcon
                          className={classNames(
                            'h-5 w-5',
                            isSelected ? 'text-white' : 'text-indigo-600',
                          )}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
