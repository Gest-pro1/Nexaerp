'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planName = searchParams.get('plan') || 'Professional';
  const frequency = searchParams.get('frequency') || 'Mês';
  const companyName = searchParams.get('company') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 sm:p-12 max-w-md w-full text-center">
        {/* Ícone de Sucesso */}
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="w-20 h-20 text-green-500" />
        </div>

        {/* Título */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
          Pagamento Confirmado!
        </h1>

        {/* Mensagem */}
        <p className="text-gray-600 mb-6">
          Sua assinatura ao plano <strong>{planName}</strong> ({frequency}) foi ativada com sucesso.
          {companyName && ` para ${companyName}`}
        </p>

        {/* Detalhes */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-800 mb-4">Próximos Passos:</h2>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <span>Um email de confirmação foi enviado para você</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <span>Você já pode acessar sua conta</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-500 font-bold">✓</span>
              <span>Acesso a todos os recursos do seu plano</span>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Link
            href="/Admin"
            className="block w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition text-center"
          >
            Ir para Dashboard
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-200 transition text-center"
          >
            Voltar para Início
          </Link>
        </div>

        {/* Contato */}
        <p className="text-sm text-gray-600 mt-8">
          Precisa de ajuda? Entre em contato conosco pelo{' '}
          <a href="https://wa.me/5511999999999" className="text-indigo-600 hover:underline">
            WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
