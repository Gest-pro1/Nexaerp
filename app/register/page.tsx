"use client"

import React from "react"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { validarCadastro, validarCPF, validarEmail, validarCNPJ, validarTelefone, validarNome } from "./config"
import { api } from '@/lib/api'

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

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
    annualPrice: 671.04,
    features: "1 Usuário · Até 500 Notas/Mês",
  },
  {
    id: "professional",
    name: "Profissional",
    monthlyPrice: 129.90,
    annualPrice: 1247.04,
    features: "3 Usuários · Notas Ilimitadas",
    recommended: true,
  },
  {
    id: "premium",
    name: "Premium +",
    monthlyPrice: 249.90,
    annualPrice: 2399.04,
    features: "Usuários Ilimitados · Multi-Lojas",
  },
]

// Tipagem da resposta da API ViaCEP
interface ViaCepResponse {
  erro?: boolean
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
}

function CadastroFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [availablePlans, setAvailablePlans] = useState(PLANS)
  const [segmentosConfig, setSegmentosConfig] = useState<Record<string, { disponivel: boolean; manutencao: boolean }>>({
    lojas: { disponivel: true, manutencao: false },
    saloes: { disponivel: true, manutencao: false },
    bares: { disponivel: true, manutencao: false },
    mercados: { disponivel: true, manutencao: false },
  });

  const initialPlanParam = searchParams.get("plan")
  const initialFreqParam = searchParams.get("frequency")

  const defaultPlanId = availablePlans.some(p => p.id === initialPlanParam)
    ? (initialPlanParam as string)
    : "professional"

  useEffect(() => {
    api.planos.list()
      .then((apiPlanos) => {
        if (apiPlanos && Array.isArray(apiPlanos) && apiPlanos.length > 0) {
          const mapped = apiPlanos.map((p: any) => ({
            id: p.id,
            name: p.nome,
            monthlyPrice: Number(p.preco_mensal) || 0,
            annualPrice: Number(p.preco_anual) || (Number(p.preco_mensal) * 12 * 0.8),
            features: typeof p.recursos === 'string'
              ? p.recursos.split(/[,•\n]/).map((r: string) => r.trim()).filter(Boolean).join(' · ')
              : Array.isArray(p.recursos)
              ? p.recursos.join(' · ')
              : 'Recursos inclusos',
            recommended: Boolean(p.nome?.toLowerCase().includes('pro') || p.nome?.toLowerCase().includes('premium')),
          }));
          setAvailablePlans(mapped);
          if (initialPlanParam) {
            const found = mapped.find(m => m.id === initialPlanParam || m.name.toLowerCase() === initialPlanParam.toLowerCase());
            if (found) setSelectedPlan(found.id);
          }
        }
      })
      .catch((err) => console.debug('Usando planos padrão no registro:', err));

    api.admin.getConfiguracoes()
      .then((configs) => {
        if (configs?.segmentos) {
          setSegmentosConfig(configs.segmentos);
        }
      })
      .catch((err) => console.debug('Configurações de segmentos locais:', err));
  }, [initialPlanParam]);

  // ── Dados da Empresa ──
  const [razaoSocial, setRazaoSocial] = useState("")
  const [razaoSocialError, setRazaoSocialError] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [cnpjError, setCnpjError] = useState("")
  const [telefone, setTelefone] = useState("")
  const [telefoneError, setTelefoneError] = useState("")
  const [cep, setCep] = useState("")
  const [cepError, setCepError] = useState("")
  const [cepLoading, setCepLoading] = useState(false)
  const [rua, setRua] = useState("")
  const [ruaError, setRuaError] = useState("")
  const [numero, setNumero] = useState("")
  const [numeroError, setNumeroError] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [bairroError, setBairroError] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")

  // ── Dados do Responsável ──
  const [nomeCompleto, setNomeCompleto] = useState("")
  const [nomeCompletoError, setNomeCompletoError] = useState("")
  const [cpf, setCpf] = useState("")
  const [cpfError, setCpfError] = useState("")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")

  // ── Tipo de negócio / plano ──
  const [selectedBusinessType, setSelectedBusinessType] = useState("lojas")
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanId)
  const [isAnnual, setIsAnnual] = useState(initialFreqParam === "Ano")

  const handleRazaoSocialBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRazaoSocial(value)
    if (value && value.trim().length < 3) {
      setRazaoSocialError("Razão Social deve ter pelo menos 3 caracteres.")
    } else {
      setRazaoSocialError("")
    }
  }

  const handleCnpjBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCnpj(value)
    if (value && !validarCNPJ(value)) {
      setCnpjError("CNPJ inválido.")
    } else {
      setCnpjError("")
    }
  }

  const handleTelefoneBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTelefone(value)
    if (value && !validarTelefone(value)) {
      setTelefoneError("Telefone inválido. Use formato: (00) 00000-0000")
    } else {
      setTelefoneError("")
    }
  }

  const handleRuaBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRua(value)
    if (value && value.trim().length < 3) {
      setRuaError("Rua deve ter pelo menos 3 caracteres.")
    } else {
      setRuaError("")
    }
  }

  const handleNumeroBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNumero(value)
    if (!value || !value.trim()) {
      setNumeroError("Número é obrigatório.")
    } else {
      setNumeroError("")
    }
  }

  const handleBairroBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBairro(value)
    if (value && value.trim().length < 2) {
      setBairroError("Bairro deve ter pelo menos 2 caracteres.")
    } else {
      setBairroError("")
    }
  }

  const handleNomeCompletoBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNomeCompleto(value)
    if (value && !validarNome(value)) {
      setNomeCompletoError("Nome deve ter pelo menos 3 caracteres e sem números.")
    } else {
      setNomeCompletoError("")
    }
  }

  const handleCpfBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCpf(value)
    if (value && !validarCPF(value)) {
      setCpfError("CPF inválido.")
    } else {
      setCpfError("")
    }
  }

  const handleEmailBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (value && !validarEmail(value)) {
      setEmailError("E-mail inválido.")
    } else {
      setEmailError("")
    }
  }

  // Máscara simples de CEP: 00000-000
  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  // Consulta a API ViaCEP e preenche Rua, Bairro, Cidade e UF automaticamente
  const fetchCepData = async (cepValue: string): Promise<void> => {
    const cleanCep = cepValue.replace(/\D/g, "")

    if (cleanCep.length === 0) {
      setCepError("")
      return
    }

    if (cleanCep.length !== 8) {
      setCepError("CEP deve ter 8 dígitos.")
      return
    }

    setCepLoading(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = (await response.json()) as ViaCepResponse

      if (data.erro) {
        setCepError("CEP não encontrado.")
        return
      }

      setSelectedState(data.uf || "")
      setSelectedCity(data.localidade || "")
      setRua(data.logradouro || "")
      setBairro(data.bairro || "")
      setRuaError("")
      setBairroError("")
      setCepError("")
    } catch (error) {
      setCepError("Erro ao consultar CEP. Tente novamente.")
    } finally {
      setCepLoading(false)
    }
  }

  const handleCepChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setCep(formatted)

    const digits = formatted.replace(/\D/g, "")
    if (digits.length === 8) {
      fetchCepData(formatted)
    } else if (digits.length === 0) {
      setCepError("")
    }
  }

  const handleCepBlur = (e: ChangeEvent<HTMLInputElement>) => {
    fetchCepData(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const resultadoValidacao = validarCadastro({
      razaoSocial,
      cnpj,
      telefone,
      cep,
      estado: selectedState,
      cidade: selectedCity,
      nomeCompleto,
      cpf,
      email,
    })

    if (!resultadoValidacao.valido) {
      alert("Erro ao cadastrar:\n\n" + resultadoValidacao.erros.join("\n"))
      return
    }

    const callApi = async () => {
      try {
        const planos = await api.planos.list();
        const planSelected = availablePlans.find(p => p.id === selectedPlan);
        const planName = planSelected?.name || 'Profissional';
        const matchedPlano = planos.find((p: any) => p.id === selectedPlan || p.nome?.toLowerCase() === planName.toLowerCase());
        const resolvedPlanoId = matchedPlano?.id || (planSelected?.id && planSelected.id.length === 36 ? planSelected.id : undefined);
        
        const result = await api.auth.register({
          razaoSocial: razaoSocial,
          cnpj,
          email,
          telefone,
          cep,
          rua,
          numero,
          complemento,
          bairro,
          uf: selectedState,
          cidade: selectedCity,
          responsavelNome: nomeCompleto,
          responsavelCpf: cpf,
          tipoNegocio: selectedBusinessType,
          planoId: resolvedPlanoId,
          tipoPlano: isAnnual ? 'Anual' : 'Mensal',
        });
        
        const price = isAnnual ? planSelected?.annualPrice : planSelected?.monthlyPrice;
        const frequency = isAnnual ? 'Ano' : 'Mês';
        const formattedPrice = `R$${(price ?? 0).toFixed(2).replace('.', ',')}`;

        router.push(`/payment?empresaId=${result.empresaId}&plan=${encodeURIComponent(planName)}&frequency=${frequency}&price=${encodeURIComponent(formattedPrice)}&company=${encodeURIComponent(razaoSocial)}&email=${encodeURIComponent(email)}`);
      } catch (err: any) {
        alert('Erro ao cadastrar: ' + err.message);
      }
    };
    callApi();
  }

  return (
    <main className="min-h-screen flex">

      {/* ── Sidebar ghost: reserves space in flex flow ── */}
      <div className="hidden lg:block shrink-0 w-[40%]" aria-hidden="true" />

      {/* ── LEFT SIDEBAR — fixed on top of the ghost ── */}
      <aside className="hidden lg:flex lg:flex-col lg:justify-between lg:p-10 bg-[#1f3fbf] fixed top-0 left-0 h-screen w-[40%] z-10">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Image src="/nova-logo.svg" alt="GestPro Logo" width={300} height={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-gl font-bold leading-tight text-white xl:text-4xl">
              Gestão profissional para o seu negócio.
            </h2>
            <p className="text-white/80 font-medium text-2xl">
              Junte-se a centenas de empresas que usam o GestPro para vender mais e gerenciar melhor.
            </p>
          </div>
        </div>
        <p className="text-sm font-light text-white/70">
          © 2025 GestPro Tecnologia
        </p>
      </aside>

      {/* ── RIGHT CONTENT — scrollable, takes remaining space ── */}
      <div className="flex-1 flex min-h-screen flex-col bg-gray-50 p-4 md:p-8 lg:p-10 font-medium">
        <div className="mx-auto w-full max-w-2xl flex-1">

          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
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
            <p className="mt-2 text-gray-500 font-light">
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
                {/* Razão Social */}
                <div>
                  <label className="mb-1.5 block text-sm text-gray-500 font-light">
                    Razão Social/Nome Fantasia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mercado Silva LTDA"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    onBlur={handleRazaoSocialBlur}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                  />
                  {razaoSocialError && <p className="mt-1 text-sm text-red-500">{razaoSocialError}</p>}
                </div>

                {/* CNPJ / Telefone / CEP */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      CNPJ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      onBlur={handleCnpjBlur}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                    {cnpjError && <p className="mt-1 text-sm text-red-500">{cnpjError}</p>}
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
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        onBlur={handleTelefoneBlur}
                        required
                        className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                      />
                    </div>
                    {telefoneError && <p className="mt-1 text-sm text-red-500">{telefoneError}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      CEP <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={cep}
                        onChange={handleCepChange}
                        onBlur={handleCepBlur}
                        maxLength={9}
                        inputMode="numeric"
                        required
                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                      />
                      {cepLoading && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          Buscando...
                        </span>
                      )}
                    </div>
                    {cepError && <p className="mt-1 text-sm text-red-500">{cepError}</p>}
                  </div>
                </div>

                {/* Rua */}
                <div>
                  <label className="mb-1.5 block text-sm text-gray-500 font-light">
                    Rua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Manoel Correia"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    onBlur={handleRuaBlur}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                  />
                  {ruaError && <p className="mt-1 text-sm text-red-500">{ruaError}</p>}
                </div>

                {/* Número / Complemento / Bairro */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      Número <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 123"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      onBlur={handleNumeroBlur}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                    {numeroError && <p className="mt-1 text-sm text-red-500">{numeroError}</p>}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      Complemento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 1 andar"
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      Bairro <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Nova Esperança"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      onBlur={handleBairroBlur}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                    {bairroError && <p className="mt-1 text-sm text-red-500">{bairroError}</p>}
                  </div>
                </div>

                {/* UF / Cidade */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      UF <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value)
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
                        placeholder="Selecionar cidade"
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
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    onBlur={handleNomeCompletoBlur}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                  />
                  {nomeCompletoError && <p className="mt-1 text-sm text-red-500">{nomeCompletoError}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      CPF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      onBlur={handleCpfBlur}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                    {cpfError && <p className="mt-1 text-sm text-red-500">{cpfError}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-gray-500 font-light">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="seuemail@dominio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleEmailBlur}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1f3fbf] focus:outline-none focus:ring-2 focus:ring-[#1f3fbf]/20"
                    />
                    {emailError && <p className="mt-1 text-sm text-red-500">{emailError}</p>}
                  </div>
                </div>

                {/* Aviso Informativo de Primeiro Acesso */}
                <div className="rounded-xl bg-blue-50 border border-blue-200/80 p-4 text-xs text-blue-900 flex items-start gap-3 mt-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#1f3fbf]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-950 text-sm">Primeiro acesso automatizado</p>
                    <p className="mt-0.5 text-blue-800 leading-relaxed font-normal">
                      Não é necessário criar uma senha agora. Sua senha temporária de primeiro acesso será gerada automaticamente com segurança e enviada para o e-mail cadastrado assim que o pagamento for confirmado.
                    </p>
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
                  const segStatus = segmentosConfig[type.id] || { disponivel: true, manutencao: false }
                  const isDisponivel = segStatus.disponivel !== false
                  const isManutencao = Boolean(segStatus.manutencao)

                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={!isDisponivel}
                      onClick={() => isDisponivel && setSelectedBusinessType(type.id)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        !isDisponivel
                          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "border-[#1f3fbf] bg-[#1f3fbf]/5 cursor-pointer"
                          : "border-gray-200 bg-white hover:border-[#1f3fbf]/50 cursor-pointer"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        !isDisponivel ? "bg-gray-200 text-gray-400" : isSelected ? "bg-[#1f3fbf] text-white" : "bg-gray-100 text-gray-500"
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-medium ${!isDisponivel ? "text-gray-400" : isSelected ? "text-[#1f3fbf]" : "text-gray-900"}`}>
                            {type.title}
                          </p>
                          {!isDisponivel ? (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                              Indisponível
                            </span>
                          ) : isManutencao ? (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                              Em Manutenção
                            </span>
                          ) : null}
                        </div>
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
                {availablePlans.map((plan) => {
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
                        <p className="text-xs text-gray-500 font-light">
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
            <p className="text-center text-xs text-gray-500 pb-10">
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

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Carregando...</div>}>
      <CadastroFormContent />
    </Suspense>
  )
}