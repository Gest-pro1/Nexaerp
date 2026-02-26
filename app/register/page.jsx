"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

const BUSINESS_TYPES = [
  {
    id: "lojas",
    title: "Lojas e Varejo",
    description: "Ideal para roupas, calçados, eletrônicos e bazar.",
  },
  {
    id: "saloes",
    title: "Salões e Barbearias",
    description: "Organize sua agenda e fidelize clientes.",
  },
  {
    id: "bares",
    title: "Bares e Restaurantes",
    description: "Gestão completa da cozinha ao delivery.",
  },
  {
    id: "mercados",
    title: "Mercados e Padarias",
    description: "Agilidade no caixa para alto fluxo de clientes.",
  },
]

const PLANS = [
  {
    id: "standard",
    name: "Standart",
    monthlyPrice: 69.90,
    annualPrice: 671.04, // 12 meses com 20% de desconto
    features: "1 Usuário · Até 50 Notas/Mês",
  },
  {
    id: "professional",
    name: "Profissional",
    monthlyPrice: 129.90,
    annualPrice: 1247.04, // 12 meses com 20% de desconto
    features: "3 Usuário · Notas Ilimitadas",
    recommended: true,
  },
  {
    id: "premium",
    name: "Premium +",
    monthlyPrice: 249.90,
    annualPrice: 2399.04, // 12 meses com 20% de desconto
    features: "10 Usuário · Multi-Lojas",
  },
]

export default function CadastroPage() {
  const router = useRouter()
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedBusinessType, setSelectedBusinessType] = useState("lojas")
  const [selectedPlan, setSelectedPlan] = useState("professional")
  const [isAnnual, setIsAnnual] = useState(false)

  const handleSubmit = () => {
    e.preventDefault()
    router.push("/sucesso")
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[40%_60%]">
      {/* Left Sidebar - Dark Blue Background */}
      <aside className="hidden bg-[#1f3fbf] lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="space-y-8">
          {/* GestPro Logo */}
          <div className="flex items-center gap-3">
            <Image src="/nova-logo.svg" alt="GestPro Logo" width={300} height={48} />
          </div>
          <div className="space-y-4">
            <h2 className=" text-gl font-bold leading-tight text-white xl:text-4xl">
              Gestão profissional para o seu negócio.
            </h2>
            <p className="text-sm text-white/80">
              Junte-se a centenas de empresas que usam o GestPro para vender mais e gerenciar melhor.
            </p>
          </div>
        </div>
        <p className="text-sm font-light text-white/70 ">
          © 2025 GestPro Tecnologia
        </p>
      </aside>

      {/* Right Content - Light Gray Background */}
      <div className="flex min-h-screen flex-col bg-gray-50 p-4 md:p-8 lg:p-10">
        {/* Mobile Header */}
        <div className="mb-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                <circle cx="24" cy="24" r="20" stroke="#F59E0B" strokeWidth="3" strokeDasharray="8 4" />
                <circle cx="24" cy="24" r="10" fill="#F59E0B" />
                <path d="M24 14v10l7 7" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl font-bold">
              <span className="text-amber-500">Gest</span>
              <span className="text-gray-900">Pro</span>
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1">
          {/* Back Button */}
          <button
          onClick={()=> router.push("/")}
            type="button"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900 cursor-pointer font-medium"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Cadastre sua Empresa
            </h2>
            <p className="mt-2 text-gray-500 font-light ">
              Preencha os dados abaixo para criar sua conta e iniciar o período de teste.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados da Empresa */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-gray-900">
                <svg className="h-5 w-5 text-[#1f3fbf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="font-semibold">Dados da Empresa</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-500 font-light">
                    Razão Social/Nome Fantasia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mercado Silva LTDA"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      CNPJ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      Telefone/WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        required
                        className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      UF <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value)
                        setSelectedCity("")
                      }}
                      required
                      className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    >
                      <option value="">Selecionar UF</option>
                      {BRAZILIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      Cidade <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Ex: São Paulo"     
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do Responsável */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-gray-900">
                <svg className="h-5 w-5 text-[#1f3fbf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="font-semibold">Dados do Responsável</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-500 font-light">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="seuemail@dominio.com"
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de Negócio */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-gray-900">
                <svg className="h-5 w-5 text-[#1f3fbf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold">
                  Tipo de Negócio (Módulo) <span className="text-red-500">*</span>
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {BUSINESS_TYPES.map((type) => {
                  const isSelected = selectedBusinessType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedBusinessType(type.id)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-[#1f3fbf] bg-[#1f3fbf]/5"
                          : "border-gray-200 bg-white hover:border-[#1f3fbf]/50"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? "bg-[#1f3fbf] text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {type.id === "lojas" && (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        )}
                        {type.id === "saloes" && (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                          </svg>
                        )}
                        {type.id === "bares" && (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        )}
                        {type.id === "mercados" && (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isSelected ? "text-[#1f3fbf]" : "text-gray-900"}`}>
                          {type.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Escolha do Plano */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Escolha seu Plano <span className="text-red-500">*</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${!isAnnual ? "font-medium text-gray-900" : "text-gray-500"}`}>
                    Mensal
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAnnual(!isAnnual)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      isAnnual ? "bg-[#1f3fbf]" : "bg-gray-300"
                    }`}
                  >
                    
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform left-0 ${
                        isAnnual ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${isAnnual ? "font-medium text-gray-900" : "text-gray-500"}`}>
                    Anual
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id
                  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-[#1f3fbf] bg-[#1f3fbf]/5"
                          : "border-gray-200 bg-white hover:border-[#1f3fbf]/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isSelected ? "text-[#1f3fbf]" : "text-gray-900"}`}>
                            {plan.name}
                          </p>
                          {plan.recommended && (
                            <span className="rounded bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                              RECOMENDADO
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {plan.features}
                        </p>
                      </div>
                      <div className="text-right font-light">
                        <p className={`text-lg font-bold ${isSelected ? "text-[#1f3fbf]" : "text-gray-900"}`}>
                          R${price.toFixed(2).replace(".", ",")}
                        </p>
                       <p className="text-xs text-gray-500  font-light">
                          {isAnnual ? "/ano" : "/mês"}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f3fbf] py-4 text-base font-semibold text-white transition-colors hover:bg-[#1a35a3]"
            >
              Finalizar Cadastro
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {/* Terms */}
            <p className="text-center text-xs text-gray-500">
              Ao clicar em finalizar, você concorda com nossos{" "}
              <a href="#" className="text-[#1f3fbf] hover:underline">Termos de Uso</a>
              {" "}e{" "}
              <a href="#" className="text-[#1f3fbf] hover:underline">Política de Privacidade</a>.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
