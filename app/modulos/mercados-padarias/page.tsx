"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  Boxes,
  LayoutGrid,
  LogOut,
  Settings,
  ShoppingCart,
  Wallet,
} from "lucide-react";

const menuItems = [
  { label: "Início", Icon: LayoutGrid },
  { label: "PDV", Icon: ShoppingCart },
  { label: "Caixa", Icon: Wallet },
  { label: "Estoque", Icon: Boxes },
  { label: "Caderneta", Icon: BookOpen },
];

export default function MercadosPadariasPage() {
  const [activeItem, setActiveItem] = useState("Início");

  return (
    <div className="min-h-dvh bg-[#f4f5f7] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-40 flex-col border-r border-white/20 bg-[#1e3a8a] text-white">
        <div className="flex h-29.5 shrink-0 items-center justify-center border-b border-white/10">
            <Image
              src="/nova-logo.svg"
              alt="Nexa ERP"
              width={225}
              height={150}
              priority
              className="h-auto w-28 object-contain"
            />
        </div>

        <nav className="flex-1 pt-3" aria-label="Menu principal">
          <p className="px-3.5 pb-1.5 text-[13px] font-medium text-blue-200/80">Operação</p>
          <ul className="space-y-0.5">
            {menuItems.map(({ label, Icon }) => {
              const isActive = activeItem === label;

              return (
                <li key={label}>
                  <button
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveItem(label)}
                    className={`flex h-7.5 w-full items-center gap-3 px-3.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${isActive ? "bg-[#3554aa] text-white" : "text-blue-200/75 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Icon aria-hidden="true" className={`size-4 shrink-0 ${isActive ? "text-amber-400" : "text-blue-200/70"}`} strokeWidth={2} />
                    <span>{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/20 py-3">
          <button type="button" className="flex h-7.5 w-full items-center gap-2 px-3.5 text-left text-[12px] text-blue-200/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400">
            <Settings aria-hidden="true" className="size-4 shrink-0" />
            <span>Configurações</span>
          </button>
          <button type="button" className="flex h-7.5 w-full items-center gap-2 px-3.5 text-left text-[12px] text-blue-200/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400">
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            <span>Troca operador</span>
          </button>
        </div>
      </aside>

      <main className="ml-40 flex min-h-dvh items-center justify-center px-6 py-10">
        <section className="w-full max-w-3xl text-center" aria-labelledby="page-title">
          <p className="text-sm font-medium text-blue-700">Nexa ERP</p>
          <h1 id="page-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Mercados e Padarias
          </h1>
          <p className="mt-2 text-sm text-slate-500">Painel inicial</p>
        </section>
      </main>
    </div>
  );
}
