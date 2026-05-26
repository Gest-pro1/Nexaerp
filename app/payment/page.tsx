'use client';

import React, { useState, ChangeEvent, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface PaymentFormData {
  cardName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

interface PaymentErrors {
  [key: string]: string;
}

function generateQRCode(text: string): string {
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
}

const PIX_CODE = '00020126580014br.gov.bcb.pix0136550e4f40-6d28-4f92-a5a7-2e7c2d5f8c3f52040000';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planName = searchParams.get('plan') || 'Professional';
  const frequency = searchParams.get('frequency') || 'Mês';
  const price = searchParams.get('price') || 'R$129,90';
  const companyName = searchParams.get('company') || 'Sua Empresa';

  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [formData, setFormData] = useState<PaymentFormData>({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') formattedValue = formatCardNumber(value);
    if (name === 'expiryDate') formattedValue = formatExpiryDate(value);
    if (name === 'cvv') formattedValue = value.replace(/\D/g, '').slice(0, 3);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: PaymentErrors = {};

    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Nome do titular é obrigatório';
    }

    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Número do cartão é obrigatório';
    } else if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'Número deve ter 16 dígitos';
    }

    if (!formData.expiryDate.trim()) {
      newErrors.expiryDate = 'Data de validade é obrigatória';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Use formato MM/AA';
    }

    if (!formData.cvv.trim()) {
      newErrors.cvv = 'CVV é obrigatório';
    } else if (formData.cvv.length !== 3) {
      newErrors.cvv = 'CVV deve ter 3 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push(`/payment/success?plan=${planName}&frequency=${frequency}&company=${companyName}`);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(PIX_CODE);
    alert('Código PIX copiado para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex text-amber-950" >
      {/* Sidebar Esquerdo */}
      <div className="hidden md:flex md:w-2/7 bg-[#1E40AF] p-8 flex-col justify-between">
        <div>
         

          <div className="mb-12 gap-3 flex flex-col">
            <h1 className="text-white text-3xl font-bold mb-2">Empresa</h1>
            <p className="text-blue-100 text-lg font-bold">{companyName}</p>
          </div>

          <div className="bg-blue-500/30 border border-blue-400 rounded-2xl p-6 backdrop-blur-sm w-100">
            <div className="mb-6">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wide mb-2">
                Plano Selecionado
              </p>
              <h2 className="text-white text-2xl font-bold">{planName}</h2>
              <p className="text-blue-100 text-sm font-bold mt-1">/{frequency}</p>
            </div>

            <div className="border-t border-blue-400 pt-6 mb-6">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wide mb-3">
                Total a pagar:
              </p>
              <p className="text-white text-3xl font-bold">{price}</p>
            </div>

          </div>
          <div className=' flex flex-col gap-4 mt-6'>

            <ul className="space-y-3 text-blue-100 text-lg font-bold">
              <li className="flex gap-3">
                <span className="text-blue-200">✓</span>
                <span>3 Usuários</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-200">✓</span>
                <span>Notas Ilimitadas</span>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-200">✓</span>
                <span>Gestão de Estoque Avançada</span>
              </li>
            </ul>

          </div>
        </div>

        <div className="pt-8 border-t border-blue-400 flex flex-col " >
          <p className="text-white/60 text-2 xl font-bold mb-3">
            Ao finalizar, você concorda com <br/>
               nossos termos de serviço
          </p>
          <p className="text-blue-200 text-lg flex items-center gap-2">
            🔒 Ambiente seguro e criptografado
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="w-full md:w-3/5 p-6 md:p-12">

        <div className="max-w-2xl">
        <div id='botao' className=''>
            <button onClick={() => router.push('/')} className="text-blue-600 font-bold mb-6 flex items-center gap-2 cursor-pointer">  
                ← Voltar
            </button>
        </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forma de Pagamento</h1>
          <p className="text-gray-600 mb-8">
            Escolha como deseja utilizar sua licença Gest Pro
          </p>

          {/* Métodos de Pagamento */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { id: 'credit', label: 'Crédito', icon: '💳' },
              { id: 'debit', label: 'Débito', icon: '💳' },
              { id: 'pix', label: 'Pix', icon: '📱' },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                  paymentMethod === method.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{method.icon}</div>
                <p className="text-sm">{method.label}</p>
              </button>
            ))}
          </div>

          {/* Cartão de Crédito/Débito */}
          {(paymentMethod === 'credit' || paymentMethod === 'debit') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número do Cartão *
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full px-4 py-3 border rounded-lg font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vencimento *
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="000"
                    maxLength={3}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cvv ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome no Cartão *
                </label>
                <input
                  type="text"
                  name="cardName"
                  value={formData.cardName}
                  onChange={handleInputChange}
                  placeholder="Como está no cartão"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cardName && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardName}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {isLoading ? 'Processando...' : 'Confirmar Pagamento →'}
              </button>
            </form>
          )}

          {/* PIX */}
          {paymentMethod === 'pix' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="text-gray-600 font-semibold mb-6">Escaneie o QR Code</p>
                <div className="bg-white p-4 rounded-lg inline-block mb-6">
                  <img
                    src={generateQRCode(PIX_CODE)}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-gray-600 text-sm mb-4">Ou copie o código PIX abaixo</p>
                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4 font-mono text-xs break-all max-h-20 overflow-y-auto">
                  {PIX_CODE}
                </div>
                <button
                  onClick={copyPixCode}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition mt-4"
                >
                  Copiar Código PIX
                </button>
              </div>
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-2">Formas de Pagamento</p>
                <div className="flex gap-2 items-center">
                  <span className="text-blue-600">💳</span>
                  <span className="text-red-600">💳</span>
                  <span className="text-yellow-600">💳</span>
                  <span className="text-green-600">💳</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-600">
                <p className="font-semibold mb-1">🔒 Segurança</p>
                <p>SSL 256 bits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
