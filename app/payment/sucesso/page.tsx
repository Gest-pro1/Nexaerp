"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

interface CadastroData {
  razaoSocial?: string;
  email?: string;
}

export default function SucessoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cadastroData, setCadastroData] = useState<CadastroData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    setCadastroData({
      razaoSocial: searchParams.get("company") || undefined,
      email: searchParams.get("email") || undefined,
    })
    setIsLoading(false)
  }, [searchParams])

  // Simular progresso das etapas
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < 120 ) {
        setCurrentStep(currentStep + 1)
      }
    }, 120000) // Avança cada 2 minutos (120000 ms)

    return () => clearTimeout(timer)
  }, [currentStep])

  return (
    <>
    
     <main className="relative min-h-screen font-sans overflow-hidden">
      {/* Logo - Apenas em Desktop - Canto Superior Esquerdo */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 hidden md:block z-20">
        <img src="/nova-logo.svg" alt="GestPro" width={280} height={80} className="w-64 md:w-72 h-auto" />
      </div>

      {/* Fundo azul topo 50% */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#1f3fbf]" />
      {/* Fundo cinza baixo 50% */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-slate-100" />
 
      {/* Conteúdo */}
      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 lg:py-10 flex flex-col items-center justify-center min-h-screen">
        {/* Card */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-xl sm:rounded-2xl bg-white shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8">
 
          {/* Ícone de sucesso */}
          <div className="mb-4 sm:mb-6 md:mb-8 flex justify-center">
            <div className="flex h-10 sm:h-12 md:h-14 w-10 sm:w-12 md:w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-5 sm:h-6 md:h-7 w-5 sm:w-6 md:w-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
 
          {/* Título */}
          <div className="text-center font-medium flex flex-col gap-2 sm:gap-3 md:gap-4"> 
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Pagamento Confirmado!!</h1>
            <p className="text-xs sm:text-sm md:text-sm text-gray-500 px-1">
              A empresa{" "}
              <span className="font-semibold text-gray-900">
                {isLoading ? "carregando..." : (cadastroData?.razaoSocial || "sua empresa")}
              </span>{" "}
              já está com o acesso em processamento.
            </p>
          </div>
 
          {/* Status */}
          <div className="flex flex-col gap-2 mb-4 sm:mb-5 md:mb-6 rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-5">
            <div className="mb-3 sm:mb-4 md:mb-5 flex items-center gap-2 sm:gap-3">
              <img src="/vectar.svg" alt="logo-vectar" className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Status da Ativação</h2>
            </div>
 
            <div className="flex flex-col">
 
              {/* Passo 1 */}
              <div className="flex gap-2 sm:gap-3 md:gap-4 font-medium">
                <div className="flex flex-col items-center">
                  <div className="flex h-3 sm:h-4 md:h-4 w-3 sm:w-4 md:w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                    <div className="h-1 sm:h-1.5 md:h-1.5 w-1 sm:w-1.5 md:w-1.5 rounded-full bg-white" />
                  </div>
                  {currentStep > 1 && <div className="w-px flex-1 bg-green-500 my-2 sm:my-3" />}
                  {currentStep === 1 && <div className="w-px flex-1 bg-gray-200 my-2 sm:my-3" />}
                </div>
                <div className="pb-5 sm:pb-6 md:pb-8">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Pagamento Recebido</p>
                  <p className="text-xs text-green-600">Confirmado com sucesso</p>
                </div>
              </div>
 
              {/* Passo 2 */}
              <div className="flex gap-2 sm:gap-3 md:gap-4 font-medium">
                <div className="flex flex-col items-center">
                  <div className={`flex h-3 sm:h-4 md:h-4 w-3 sm:w-4 md:w-4 shrink-0 items-center justify-center rounded-full ${
                    currentStep > 1 ? 'bg-green-500' : 'bg-[#1f3fbf]'
                  }`}>
                    <div className="h-1 sm:h-1.5 md:h-1.5 w-1 sm:w-1.5 md:w-1.5 rounded-full bg-white" />
                  </div>
                  {currentStep > 2 && <div className="w-px flex-1 bg-green-500 my-2 sm:my-3" />}
                  {currentStep <= 2 && <div className="w-px flex-1 bg-gray-200 my-2 sm:my-3" />}
                </div>
                <div className="pb-5 sm:pb-6 md:pb-8">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Configurando Instância</p>
                  <p className={`text-xs ${currentStep > 1 ? 'text-green-600' : 'text-[#1f3fbf]'}`}>
                    {currentStep > 2 ? 'Análise concluída' : currentStep > 1 ? 'Criando ambiente...' : 'Criando ambiente...'}
                  </p>
                  <p className="text-xs text-gray-400">Estamos preparando o banco de dados da sua empresa</p>
                </div>
              </div>
 
              {/* Passo 3 - sem linha abaixo */}
              <div className="flex gap-2 sm:gap-3 md:gap-4 font-medium">
                <div className="flex flex-col items-center">
                  <div className={`h-3 sm:h-4 md:h-4 w-3 sm:w-4 md:w-4 shrink-0 rounded-full ${
                    currentStep > 2 ? 'bg-green-500' : 'border-2 border-gray-300 bg-white'
                  } transition-all`} />
                </div>
                <div>
                  <p className={`text-xs sm:text-sm font-medium ${currentStep > 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                    Liberação de Acesso
                  </p>
                  <p className={`text-xs ${currentStep > 2 ? 'text-green-600' : 'text-gray-400'}`}>
                    {currentStep > 2 ? 'Acesso liberado!' : 'Aguardando aprovação'}
                  </p>
                </div>
              </div>
 
            </div>
          </div>
 
          {/* Box e-mail */}
          <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col sm:flex-row items-start gap-2 sm:gap-3 md:gap-4 rounded-lg sm:rounded-xl border-2 border-[#1f3fbf]/20 bg-[#1f3fbf]/5 p-3 sm:p-4 md:p-5">
            <div className="flex h-7 sm:h-8 md:h-8 w-7 sm:w-8 md:w-8 shrink-0 items-center justify-center rounded-lg bg-[#1f3fbf]">
              <svg className="h-3.5 sm:h-4 md:h-4 w-3.5 sm:w-4 md:w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="font-medium w-full">
              <p className="text-xs sm:text-sm font-semibold text-gray-900">Fique atento ao seu e-mail</p>
              {isLoading ? (
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">Carregando dados...</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Assim que aprovado, enviaremos sua{" "}
                  <span className="font-medium text-[#1f3fbf]">senha de acesso</span> e os{" "}
                  <span className="font-medium text-[#1f3fbf]">dados de pagamento</span> para:{" "}
                  <span className="font-medium text-gray-900 break-all">{cadastroData?.email || "seuemail@dominio.com"}</span>
                </p>
              )}
            </div>
          </div>
 
          {/* Botão */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-lg sm:rounded-xl bg-[#1f3fbf] py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-[#1a35a3]"
          >
            Voltar para o Início
          </button>
 
        </div>
      </div>
    </main>
    </>
  )
  
}