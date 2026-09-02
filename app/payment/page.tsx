"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from '@/lib/api';
import { Suspense } from "react";

const PIX_CODE = "00020126580014BR.GOV.BCB.PIX0136550e4f40-6d28-4f92-a5a7-2e7c2d5f8c3f52040000";

function generateQRCode(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

const planFeatures: Record<string, string[]> = {
  Standart: [
    "1 Usuário",
    "Até 500 Notas/mês",
    "Gestão de Vendas (PDV)",
    "Relatórios Básicos",
    "Suporte WhatsApp",
    "Módulos Personalizados",
  ],
  Profissional: [
    "3 Usuários",
    "Notas Ilimitadas",
    "Gestão de Estoque Avançada",
    "Módulos Personalizados",
    "Suporte 24 Horas",
    "Controle Financeiro",
  ],
  "Premium +": [
    "Usuários Ilimitados",
    "Multi-lojas",
    "API de Integração",
    "Consultoria de Negócios",
    "Gráficos Avançados",
    "Módulos Personalizados",
  ],
};

function getPlanFeatures(name: string): string[] {
  if (planFeatures[name]) return planFeatures[name];
  const normalized = name.toLowerCase();
  if (normalized.includes("stand")) return planFeatures["Standart"];
  if (normalized.includes("prof")) return planFeatures["Profissional"];
  if (normalized.includes("prem")) return planFeatures["Premium +"];
  return planFeatures["Profissional"];
}

type PaymentFormData = {
  cardName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
};

type PaymentErrors = {
  cardName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
};

// ── Icons ──────────────────────────────────────────────────────────────────

function CheckCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <circle cx="10" cy="10" r="10" fill="#60A5FA" />
      <path d="M5.5 10.5l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PixIcon({ active }: { active: boolean }) {
  return (
    <img
      src="/pix.svg"
      alt="Pix"
      className="w-8 h-8"
      style={{ filter: active ? "brightness(1)" : "grayscale(1) opacity(0.65)" }}
    />
  );
}

function CreditIcon({ active }: { active: boolean }) {
  const color = active ? "#2563EB" : "#9CA3AF";
  return (
    <svg width="26" height="20" viewBox="0 0 28 22" fill="none">
      <rect x="1" y="1" width="26" height="20" rx="3" stroke={color} strokeWidth="2" />
      <rect x="1" y="7" width="26" height="4" fill={color} opacity="0.4" />
      <rect x="4" y="14" width="7" height="2.5" rx="1" fill={color} />
    </svg>
  );
}

function DebitIcon({ active }: { active: boolean }) {
  const color = active ? "#2563EB" : "#9CA3AF";
  return (
    <svg width="26" height="20" viewBox="0 0 28 22" fill="none">
      <rect x="1" y="1" width="26" height="20" rx="3" stroke={color} strokeWidth="2" />
      <rect x="1" y="7" width="26" height="3" fill={color} opacity="0.35" />
      <rect x="4" y="14" width="5" height="2.5" rx="1" fill={color} />
      <rect x="11" y="14" width="3" height="2.5" rx="1" fill={color} opacity="0.5" />
    </svg>
  );
}

function SSLIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 16 18" fill="none">
      <path d="M8 1L14 4v5c0 3.5-2.5 6.5-6 7.5C2.5 15.5 0 12.5 0 9V4L8 1z" fill="rgba(255,255,255,0.8)" />
      <path d="M4.5 9l2 2 4-4" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 16 18" fill="none">
      <path d="M8 1L14 4v5c0 3.5-2.5 6.5-6 7.5C2.5 15.5 0 12.5 0 9V4L8 1z" fill="#F59E0B" />
      <path d="M4.5 9l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


// ── Payment Content ────────────────────────────────────────────────────────

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planName = searchParams.get("plan") || "Profissional";
  const frequency = searchParams.get("frequency") || "Mês";
  const price = searchParams.get("price") || "R$129,90";
  const companyName = searchParams.get("company") || "Sua Empresa";
  const empresaId = searchParams.get("empresaId") || "";
  const modulo = searchParams.get("modulo") || "";

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [formData, setFormData] = useState<PaymentFormData>({ cardName: "", cardNumber: "", expiryDate: "", cvv: "" });
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dynamicPixCode, setDynamicPixCode] = useState<string>(PIX_CODE);
  const [dynamicQrImage, setDynamicQrImage] = useState<string>("");
  const [pixGerado, setPixGerado] = useState<boolean>(false);
  const [dynamicFeatures, setDynamicFeatures] = useState<string[]>([]);

  useEffect(() => {
    api.planos.list()
      .then((apiPlanos) => {
        if (apiPlanos && Array.isArray(apiPlanos)) {
          const found = apiPlanos.find((p: any) => p.nome?.toLowerCase() === planName.toLowerCase() || p.id === planName);
          if (found?.recursos) {
            const list = typeof found.recursos === "string"
              ? found.recursos.split(/[,•\n]/).map((r: string) => r.trim()).filter(Boolean)
              : Array.isArray(found.recursos)
              ? found.recursos
              : [];
            if (list.length > 0) setDynamicFeatures(list);
          }
        }
      })
      .catch((e) => console.debug("Aviso ao buscar recursos do plano:", e));
  }, [planName]);

  const features = dynamicFeatures.length > 0 ? dynamicFeatures : getPlanFeatures(planName);

  const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const formatExpiry = (v: string) => {
    const c = v.replace(/\D/g, "");
    return c.length <= 2 ? c : `${c.slice(0, 2)}/${c.slice(2, 4)}`;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof PaymentFormData;
    let v = value;
    if (fieldName === "cardNumber") v = formatCardNumber(value);
    if (fieldName === "expiryDate") v = formatExpiry(value);
    if (fieldName === "cvv") v = value.replace(/\D/g, "").slice(0, 3);
    setFormData((p) => ({ ...p, [fieldName]: v }));
    if (errors[fieldName]) setErrors((p) => ({ ...p, [fieldName]: "" }));
  };

  const validate = () => {
    const e: PaymentErrors = {};
    if (!formData.cardName.trim()) e.cardName = "Nome é obrigatório";
    if (formData.cardNumber.replace(/\s/g, "").length !== 16) e.cardNumber = "Número deve ter 16 dígitos";
    if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) e.expiryDate = "Use MM/AA";
    if (formData.cvv.length !== 3) e.cvv = "CVV deve ter 3 dígitos";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    await processPayment();
  };

  const processPayment = async () => {
    try {
      setIsLoading(true);
      const res: any = await api.pagamentos.create({
        empresaId,
        metodo: paymentMethod,
        ...(paymentMethod !== 'pix' ? {
          cardName: formData.cardName,
          cardNumber: formData.cardNumber.replace(/\s/g, ''),
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
        } : {}),
      });

      if (paymentMethod === 'pix' && res?.pix) {
        if (res.pix.copiaECola) setDynamicPixCode(res.pix.copiaECola);
        if (res.pix.qrCodeBase64) setDynamicQrImage(res.pix.qrCodeBase64);
        setPixGerado(true);
        setIsLoading(false);
        return;
      }

      router.push(`/payment/sucesso?plan=${encodeURIComponent(planName)}&frequency=${encodeURIComponent(frequency)}&company=${encodeURIComponent(companyName)}${modulo ? `&modulo=${encodeURIComponent(modulo)}` : ''}`);
    } catch (err: any) {
      setIsLoading(false);
      alert('Erro no pagamento: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-blue-600 to-blue-800">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Processando pagamento...</h2>
          <p className="text-blue-100 text-lg">Por favor, aguarde</p>
        </div>
      </div>
    );
  }

  const copyPix = () => {
    navigator.clipboard?.writeText(dynamicPixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputBase = "w-full min-w-0 h-12 px-4 py-3 border rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400";
  const inputClass = (field: keyof PaymentErrors) => `${inputBase} ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"}`;

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── SIDEBAR — fixed, left ── */}
      <aside className="hidden lg:flex flex-col justify-between fixed top-0 left-0 h-screen w-[25%] p-10 z-10"
        style={{ background: "linear-gradient(160deg, #1E3FA0 0%, #1E40AF 70%, #1C3D9E 100%)" }}>
        <div className="flex flex-col gap-8">

          {/* Logo */}
          <div className="flex items-center gap-3   px-3 mb-6 h-23">
            <img src="/nova-logo.svg" alt="Logo Gest Pro" width={400}  />
          </div>

          {/* Company */}
          <div>
            <h1 className="text-white font-extrabold text-3xl mb-3">Empresa</h1>
            <p className="text-blue-200 font-semibold text-sm ">{companyName}</p>
          </div>

          {/* Plan card */}
          <div className="rounded-2xl p-5  w-80" style={{ background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.22)" }}>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Plano Selecionado</p>
            <p className="text-white font-extrabold text-xl leading-tight">{planName}</p>
            <p className="text-blue-200 text-xs font-semibold mb-4">/{frequency}</p>
            <div className="border-t border-white/20 pt-4">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Total a pagar:</p>
              <p className="text-white font-extrabold text-2xl">{price}</p>
            </div>
          </div>

          {/* Features */}
          <ul className="flex flex-col gap-3">
            {features.map((f: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-blue-100 font-semibold text-sm">
                <CheckCircle />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-white/20 pt-6">
          <p className="text-white/50 text-lg font-semibold leading-relaxed mb-3">
            Ao finalizar, você concorda com nossos termos de serviço
          </p>
          <div className="flex items-center gap-2">
            <SSLIcon />
            <span className="text-blue-200 text-lg font-bold">Ambiente seguro e criptografado</span>
          </div>
        </div>
      </aside>

      {/* ── GHOST spacer so flex content shifts right ── */}
      <div className="hidden lg:block shrink-0 w-[15%] " aria-hidden="true" />

      {/* ── MAIN CONTENT — scrollable ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50 overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center px-4 py-10 md:px-8 lg:px-12 max-w-5xl w-full mx-auto">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#969696] font-bold text-lg mb-8 w-fit hover:text-blue-800 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Voltar
          </button>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Forma de Pagamento</h1>
          <p className="text-gray-500 text-lg font-medium mb-8">Escolha como deseja ativar sua licença Nexa ERP</p>

          {/* Method selector */}
          <div className="grid grid-cols-3 gap-3 mb-7" >
            {[
              { id: "credit", label: "Crédito", Icon: CreditIcon },
              { id: "debit", label: "Débito", Icon: DebitIcon },
              { id: "pix", label: "Pix", Icon: PixIcon },
            ].map(({ id, label, Icon }) => {
              const active = paymentMethod === id;
              return (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-bold text-sm transition-all ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon active={active} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Credit / Debit form */}
          {(paymentMethod === "credit" || paymentMethod === "debit") && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Número do Cartão *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <CreditIcon active={true} />
                  </span>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className={`${inputClass("cardNumber")} pl-14 font-medium tracking-widest text-base`}
                  />
                </div>
                {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Vencimento *</label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={inputClass("expiryDate") + " font-medium tracking-widest text-base"}
                  />
                  {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">CVC *</label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="123"
                    maxLength={3}
                    className={inputClass("cvv") + " font-medium tracking-widest text-base"}
                  />
                  {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome no Cartão *</label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleChange}
                  placeholder="Como está no cartão"
                  className={inputClass("cardName") + " font-medium tracking-widest text-base"}
                />
                {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl text-white font-extrabold text-base flex items-center justify-center gap-2 transition mt-1"
                style={{ background: isLoading ? "#93C5FD" : "#1D4ED8", cursor: isLoading ? "not-allowed" : "pointer" }}
              >
                {isLoading ? "Processando..." : "Confirmar Pagamento →"}
              </button>
            </form>
          )}

          {/* PIX */}
          {paymentMethod === "pix" && (
            <div className="flex flex-col gap-4">
              <div className="border border-gray-200 rounded-2xl p-8 bg-white text-center">
                <div className="inline-block bg-white p-2 rounded-xl shadow-sm ">
                  <img
                    src={dynamicQrImage || generateQRCode(dynamicPixCode)}
                    alt="QR Code PIX"
                    className="w-44 h-44 block object-contain"
                  />
                </div>
                <p className="font-bold text-gray-800 text-base mb-2">Escaneie o QR Code</p>
                <p className="text-gray-500 text-sm font-semibold leading-relaxed mb-5">
                  Aponte a câmera do seu banco para o código acima<br />para pagar via pix.
                </p>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                  <span className="flex-1 text-xs font-mono text-gray-500 truncate">{dynamicPixCode}</span>
                  <button
                    onClick={copyPix}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    📋 {copied ? "Copiado!" : "Copiar Chave"}
                  </button>
                </div>
              </div>

              <button
                onClick={processPayment}
                disabled={isLoading}
                className="w-full py-4 rounded-xl text-white font-extrabold text-base flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 transition cursor-pointer"
                style={{ background: isLoading ? "#93C5FD" : undefined, cursor: isLoading ? "not-allowed" : "pointer" }}
              >
                {isLoading ? "Processando..." : pixGerado ? "Já realizei o pagamento →" : "Gerar Cobrança PIX Oficial →"}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 justify-center flex items-center gap-3">
              <img src="/cartoes-footer.svg" alt="cartoes" width={200} />
            
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Carregando...</div>}>
      <PaymentContent />
    </Suspense>
  );
}