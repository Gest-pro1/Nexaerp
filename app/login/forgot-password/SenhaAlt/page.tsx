"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from 'next/navigation';

function SenhaAltContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('name') || searchParams.get('email') || '';

  return (
    <div className="flex flex-col items-center mb-4 -mt-15 gap-2">
      <section className="flex flex-col items-center p-8 sm:p-10 gap-8">
        <Image
          src="/yes.svg"
          alt="logo-login"
          width={80}
          height={30}
        />

        <div className="flex flex-col text-center gap-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            E-mail enviado com Sucesso!
          </h2>
          
          <p className="font-light text-xs sm:text-sm text-gray-600 max-w-sm">
            Enviamos as instruções e o link de redefinição para {email ? <strong>{email}</strong> : 'sua caixa de entrada'}.
          </p>
        </div>

        <button
          id="botao-forgot"
          type="button"
          onClick={() => router.push('/login')}
          className="w-full h-10 sm:h-12 text-white font-semibold text-xs sm:text-base rounded-lg transition mt-2 bg-[#1E40AF] cursor-pointer hover:bg-blue-700 shadow-md"
        >
          Ir para o Login
        </button>
      </section>

      <div className="mt-1 pt-6 border-t border-gray-200 justify-center flex items-center gap-3">
        <span className="text-xs text-gray-500">Dúvidas?</span>
        <a
          href="https://wa.me/5583999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#1E40AF] hover:text-blue-700 transition"
        >
          Contate o suporte
        </a>
      </div>
    </div>
  );
}

export default function SenhaAltPage() {
  return (
    <>
      <div className="fixed inset-0 -z-10">
        <div className="h-1/2 bg-[#1E40AF]" />
        <div className="h-1/2 bg-white" />
      </div>
      <main className="w-full flex items-center justify-center px-2 sm:px-6 lg:px-8 min-h-screen relative z-10">
        <div className="w-full sm:max-w-md lg:max-w-lg lg:w-1/2 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl text-black flex items-center justify-center">
          <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Carregando...</div>}>
            <SenhaAltContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}