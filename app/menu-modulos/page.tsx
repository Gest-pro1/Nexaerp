"use client";

import {
  CheckIcon,
  BuildingStorefrontIcon,
  CakeIcon,
  ScissorsIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
interface ModuleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
}

const modules: ModuleOption[] = [
  {
    id: "lojas-varejo",
    title: "Lojas e Varejo",
    description: "Controle de estoque e PDV ágil",
    icon: <BuildingStorefrontIcon className="h-5 w-5 text-blue-600" />,
    iconBg: "bg-blue-100",
  },
  {
    id: "bares-restaurantes",
    title: "Bares e Restaurantes",
    description: "Mesas, comandas e KDS",
    icon: <CakeIcon className="h-5 w-5 text-rose-500" />,
    iconBg: "bg-rose-100",
  },
  {
    id: "saloes-barbearias",
    title: "Salões e Barbearias",
    description: "Agenda e comissões",
    icon: <ScissorsIcon className="h-5 w-5 text-violet-500" />,
    iconBg: "bg-violet-100",
  },
  {
    id: "mercados-padarias",
    title: "Mercados e Padarias",
    description: "Agilidade no caixa",
    icon: <ShoppingCartIcon className="h-5 w-5 text-emerald-500" />,
    iconBg: "bg-emerald-100",
  },
];

export default function LoginSuccessPage() {
  const handleSelectModule = (id: string) => {
    console.log("Módulo selecionado:", id);
  };

  const handleAccessPanel = () => {
    console.log("Acessar painel");
  };

  return (
    <div className="relative min-h-screen bg-slate-100">
      {/* Metade superior azul */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-blue-800" />

      {/* Logo */}
      <div className="absolute left-8 top-8 z-10">
        <Image
          src="/nova-logo.svg"
          alt="Nexa ERP"
          width={600}
          height={150}
          className="h-auto w-24"
        />
      </div>

      {/* Card central */}
      <div className="relative z-10 flex justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckIcon className="h-6 w-6 text-emerald-500" strokeWidth={3} />
            </div>
            <h1 className="mt-3 text-lg font-bold text-slate-800">
              Login Realizado!
            </h1>
            <p className="mt-1 text-sm font-medium text-blue-800">
              Selecione o módulo para acessar:
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => handleSelectModule(module.id)}
                className="group flex items-center gap-3 rounded-xl border border-transparent bg-slate-100 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${module.iconBg} transition-transform duration-200 group-hover:scale-110`}
                >
                  {module.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-800">
                    {module.title}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {module.description}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAccessPanel}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-800 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
          >
            Acessar Painel
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}