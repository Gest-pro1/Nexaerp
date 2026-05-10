import {
  ShieldCheckIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Licenças", href: "#", icon: ShieldCheckIcon, count: "1", current: true },
  { name: "Estatísticas", href: "#", icon: PresentationChartLineIcon, count: "1", current: false },
  { name: "Receita", href: "#", icon: BanknotesIcon, count: "1", current: false },
];

const configuration = [
  { name: "Configurações", href: "#", icon: Cog6ToothIcon },
  { name: "Sair", href: "#", icon: ArrowRightStartOnRectangleIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface AdminLayoutProps {
  children?: React.ReactNode;
  notificacoes?: number;
}

export default function AdminLayout({ children, notificacoes = 0 }: AdminLayoutProps) {
  return (
    <div className="flex h-screen">

      {/* 🔵 MENU */}
      <aside className="w-60 bg-blue-800 text-white flex flex-col px-6">
        <div className="h-16 flex items-center">
          <img src="/nova-logo.svg" className="w-40" />
        </div>

        <p className="text-indigo-200 font-semibold">
          Área Administrativa
        </p>

        <nav className="flex flex-1 flex-col mt-6">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-indigo-700 text-white"
                      : "text-indigo-200 hover:bg-indigo-700 hover:text-white",
                    "flex items-center gap-3 p-2 rounded-md text-sm font-semibold"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {item.count && (
                    <span className="ml-auto bg-indigo-600 px-2 text-xs rounded-full">
                      {item.count}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>

          {/* CONFIG */}
          <div className="mt-auto">
            <div className="border-t border-gray-300 my-4"></div>

            {configuration.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 p-2 text-sm text-indigo-200 hover:bg-indigo-700 rounded-md"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            ))}
          </div>
        </nav>
      </aside>

      {/* ⚪ LADO DIREITO */}
      <div className="flex-1 flex flex-col">

        {/* 🔝 HEADER */}
        <header className="px-6 py-3 flex items-center justify-between border-b border-gray-200 bg-white">
          
          {/* Busca */}
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 w-80">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar produtos, clientes, vendas..."
              className="bg-transparent outline-none w-full text-sm text-black font-light"
            />
          </div>

          {/* Usuário */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <BellIcon className="w-6 h-6 text-black" />
              {notificacoes > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs font-medium px-1 rounded-full">
                  {notificacoes}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-black">
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs opacity-80 font-light">
                  alex.silva@gestpro.com.br
                </p>
              </div>

              <img
                src="https://i.pravatar.cc/40"
                className="w-10 h-10 rounded-full"
              />

              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </header>

        {/* 🧩 CONTEÚDO DA PÁGINA */}
        <main className="flex-1 flex">
          {children}
        </main>

      </div>
    </div>
  );
}