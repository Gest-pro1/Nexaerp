"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from '@/lib/auth';
import { useEffect, type ReactNode } from "react";
import { useState } from "react";
import {
  ShieldCheckIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Licenças", href: "/Admin", icon: ShieldCheckIcon },
  { name: "Estatísticas", href: "/Admin/Estatisticas", icon: PresentationChartLineIcon },
  { name: "Receita", href: "/Admin/Receitas", icon: BanknotesIcon },
];

const configuration = [
  { name: "Configurações", href: "/Admin/gear", icon: Cog6ToothIcon },
  { name: "Sair", href: "/login", icon: ArrowRightStartOnRectangleIcon },
];

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface AdminLayoutProps {
  children?: ReactNode;
  notificacoes?: number;
}

export default function AdminLayout({ children, notificacoes = 0 }: AdminLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; nome?: string; email?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, []);

  // Trava o scroll do body quando o menu mobile está aberto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Fecha o menu com a tecla Esc
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 flex w-64 max-w-[80vw] flex-shrink-0 flex-col overflow-y-auto bg-blue-800 px-4 text-white transition-transform duration-300 ease-in-out sm:px-6",
          "lg:sticky lg:top-0 lg:h-screen lg:max-w-none lg:translate-x-0",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between">
          <img src="/nova-logo.svg" className="w-36 sm:w-40" alt="Logo Nexaerp" />
          <button
            type="button"
            className="rounded-lg p-1 text-white hover:bg-indigo-700 lg:hidden"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 shrink-0 font-semibold text-indigo-200">Área Administrativa</p>

        <nav className="mt-6 flex flex-1 flex-col">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isCurrent = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={classNames(
                      isCurrent
                        ? "bg-indigo-700 text-white font-bold shadow-sm"
                        : "text-indigo-200 hover:bg-indigo-700 hover:text-white",
                      "flex items-center gap-3 rounded-md p-2.5 text-sm font-semibold transition-colors"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pb-4 font-bold">
            <div className="my-4 border-t border-indigo-700"></div>

            {configuration.map((item) => {
              const isCurrent = pathname === item.href;
              const handleClick = (e: React.MouseEvent) => {
                if (item.name === "Sair") {
                  e.preventDefault();
                  logout();
                  router.push('/login');
                } else {
                  setIsMenuOpen(false);
                }
              };
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleClick}
                  className={classNames(
                    isCurrent
                      ? "bg-indigo-700 text-white font-bold"
                      : "text-indigo-200 hover:bg-indigo-700 hover:text-white",
                    "flex items-center gap-3 rounded-md p-2.5 text-sm transition-colors mb-1"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Overlay mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 transition-opacity lg:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Coluna principal */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex shrink-0 flex-col gap-2 border-b border-gray-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="button"
              className="rounded-lg border border-gray-200 p-2 text-gray-700 lg:hidden"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={isMenuOpen}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="flex w-full items-center rounded-lg bg-gray-100 px-3 py-1.5 sm:w-72">
              <MagnifyingGlassIcon className="mr-2 h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos, clientes, vendas..."
                className="w-full min-w-0 bg-transparent text-sm font-light text-black outline-none"
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-6">
            <div className="relative shrink-0">
              <BellIcon className="h-6 w-6 text-black" />
              {notificacoes > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-yellow-400 px-1 text-xs font-medium">
                  {notificacoes}
                </span>
              )}
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 text-right text-black sm:block">
                <p className="truncate text-sm font-medium">
                  ADIM
                </p>
                <p className="truncate text-xs font-light opacity-80">{user?.email || ""}</p>
              </div>

              <img
                src="https://i.pravatar.cc/40"
                className="h-10 w-10 shrink-0 rounded-full"
                alt="Usuário"
              />
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-600" />
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}