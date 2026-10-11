"use client";

import { useEffect, useState } from "react";
import { Banknote, CreditCard, QrCode, Search, ShoppingCart } from "lucide-react";
import { EMPTY_POS_CART, type PosPaymentMethod } from "@/lib/market-pos";

type PdvScreenProps = {
  operatorName: string;
};

const paymentMethods: { id: PosPaymentMethod; label: string; shortcut: string }[] = [
  { id: "cash", label: "Dinheiro", shortcut: "F6" },
  { id: "pix", label: "Pix", shortcut: "F7" },
  { id: "credit", label: "Crédito", shortcut: "F8" },
  { id: "debit", label: "Débito", shortcut: "F9" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function PdvScreen({ operatorName }: PdvScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PosPaymentMethod>("cash");
  const cartItems = EMPTY_POS_CART;
  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity - item.discount,
    0,
  );

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      if (event.key === "F5" && cartItemCount > 0) {
        event.preventDefault();
      }

      const paymentShortcut = paymentMethods.find((method) => method.shortcut === event.key);
      if (paymentShortcut) {
        event.preventDefault();
        setSelectedPayment(paymentShortcut.id);
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, [cartItemCount]);

  return (
    <div className="grid min-h-full grid-cols-1 gap-2 bg-[#f1f2f5] p-2 sm:h-full sm:min-h-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <section className="flex min-h-70 flex-col sm:min-h-0" aria-label="Busca de produtos">
        <label className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-3 text-slate-400 shadow-sm focus-within:ring-2 focus-within:ring-blue-200">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Digite o código de barras ou busque o produto..."
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            aria-label="Digite o código de barras ou busque o produto"
          />
        </label>
        {searchQuery.trim() && (
          <p role="status" className="mt-3 px-2 text-xs text-slate-500">
            O catálogo de produtos será exibido aqui quando estiver conectado.
          </p>
        )}
      </section>

      <aside className="flex h-[min(944px,calc(100dvh-70px))] min-h-110 w-full flex-col overflow-hidden rounded-lg bg-white shadow-sm sm:min-h-0">
        <header className="shrink-0 bg-[#203f9f] px-3 py-2 text-white">
          <h1 className="text-base font-semibold leading-5">Cupom Fiscal</h1>
          <p className="text-[9px] text-blue-100">Caixa 01 - Operador {operatorName}</p>
        </header>

        {cartItemCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingCart aria-hidden="true" className="mb-4 size-9 text-slate-300" strokeWidth={1.2} />
            <h2 className="text-sm font-semibold text-slate-400">Cupom Fiscal</h2>
            <p className="mt-1 max-w-47.5 text-[9px] leading-4 text-slate-400">
              Escaneie códigos de barras ou clique nos produtos no painel para iniciar as vendas!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto" aria-live="polite" />
        )}

        <footer className="shrink-0 border-t border-slate-200 px-3 pb-3 pt-2">
          <div className="mb-4 flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold text-slate-500">TOTAL A PAGAR</span>
            <span className="text-lg font-bold text-[#203f9f]">{formatCurrency(total)}</span>
          </div>
          <fieldset>
            <legend className="mb-2 text-[9px] font-semibold text-slate-500">FORMA DE PAGAMENTO</legend>
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  aria-pressed={selectedPayment === method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`relative flex h-11 items-center justify-center rounded-md border px-1 text-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    selectedPayment === method.id
                      ? "border-blue-300 bg-blue-50 text-blue-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {method.id === "cash" ? (
                    <Banknote aria-hidden="true" className="mr-1 size-3" />
                  ) : method.id === "credit" || method.id === "debit" ? (
                    <CreditCard aria-hidden="true" className="mr-1 size-3" />
                  ) : (
                    <QrCode aria-hidden="true" className="mr-1 size-3" />
                  )}
                  {method.label}
                  <span className="absolute right-1 top-0 text-[6px] text-slate-400">{method.shortcut}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            disabled={cartItemCount === 0}
            title={cartItemCount === 0 ? "Adicione produtos ao cupom para finalizar" : "Finalizar Venda (F5)"}
            className="mt-2 h-11 w-full rounded-md bg-[#5b79c1] px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#4c6db7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-90"
          >
            Finalizar Venda (F5)
          </button>
        </footer>
      </aside>
    </div>
  );
}
