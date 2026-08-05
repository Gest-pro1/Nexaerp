"use client";

import React, { useState, ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  

  return (
    <>
      {/* FUNDO */}
      <div className="fixed inset-0 -z-10">
        <div className="h-1/2 bg-[#1E40AF]" />
        <div className="h-1/2 bg-white" />
      </div>

      {/* CONTEÚDO */}
      <main className="relative z-10 min-h-screen w-full overflow-x-hidden px-4 sm:px-6 lg:px-8 flex flex-col">

        {/* TOPO (não interfere no mobile) */}
        <section
          onClick={() => router.push("/")}
          className="hidden sm:flex items-center gap-2 hover:underline cursor-pointer w-fit py-3 mt-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18"
            />
          </svg>
          <span className="font-light text-base">VOLTAR</span>
        </section>

        {/* TEXTO (desktop apenas) */}
        <section className="hidden sm:flex flex-col p-4 pt-2 h-15  w-100  ">
          <h1 className="font-bold text-2xl md:text-3xl lg:text-4xl leading-tight">
            Seja Bem Vindo!
          </h1>
          <p className="font-light text-sm md:text-lg mt-1">
            A plataforma completa para gestão <br />
            inteligente do seu negócio.
          </p>
        </section>

        {/* CENTRALIZAÇÃO REAL */}
        <section className="flex-1 flex items-center justify-center">

          <div className="w-full max-w-7xl flex items-center justify-center gap-12">

            {/* IMAGEM (desktop) */}
            <div className="hidden lg:flex w-1/2 justify-center">
              <Image
                src="/casa-login.svg"
                alt="casa-login"
                width={850}
                height={550}
                priority
                className="w-full max-w-lg xl:max-w-2xl h-auto object-contain"
              />
            </div>

            {/* FORMULÁRIO */}
              <div
  className="
    w-full
    sm:max-w-md
    lg:max-w-lg
    lg:w-1/2
    bg-white
    p-6 sm:p-8
    rounded-3xl
    shadow-2xl
    text-black
    flex
    items-center
    justify-center
    sm:-mt-28
  "
>
  {/* WRAPPER INTERNO */}
  <div className="w-full flex flex-col items-center justify-center gap-4">

    {/* LOGO */}
{/* LOGO */}


{/* TÍTULO  e LOGO*/}

<section className="flex flex-col items-center mb-4 -mt-15 gap-2">

<div className="  h-50">

  <Image
    src="/nova-logo.svg"
    alt="logo-login"
    width={380}
    height={60}
  />
</div>


  <h2 className=" mb-4 sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
    Entrar
  </h2>
  <p className="font-medium text-xs sm:text-sm text-gray-500">
    Acesse o painel de gestão do Gest Pro
  </p>
</section>

    {/* FORM */}
    <form onSubmit={(e) => { e.preventDefault(); if (!email || !password) { alert('Preencha e-mail e senha'); return; } router.push('/Admin'); }} className="w-full flex flex-col gap-4 sm:mt-3 mb-2 p-3">

      {/* EMAIL */}
      <div> 
        <label className="block text-xs font-medium text-gray-900 mb-1.5">
          E-mail
        </label>
        <div className="relative">
          <input
          id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
            required
            className="
              bg-[#F1F3F6]
              w-full
              rounded-lg
              text-xs sm:text-sm
              py-2 sm:py-2.5
              pl-3 sm:pl-4
              pr-9 sm:pr-10
              outline-none
              focus:ring-2
              focus:ring-indigo-500
              transition
              font-light
             
            "
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 p-2 sm:p-2.5 rounded text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* SENHA */}
      <div>
        <label className="block text-xs font-medium text-gray-900 mb-1.5">
          Senha
        </label>
        <div className="relative">
          <input
          id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            required
            className="
              bg-[#F1F3F6]
              w-full
              rounded-lg
              text-xs sm:text-sm
              py-2 sm:py-3
              pl-3 sm:pl-4
              pr-9 sm:pr-10
              outline-none
              focus:ring-2
              focus:ring-indigo-500
              transition
              font-light
            "
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 p-2.5 rounded text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* OPÇÕES */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <label className="flex items-center gap-2 text-gray-600 font-light cursor-pointer">
          <input
          id="checkbox"
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-indigo-600"
          />
          Manter conectado
        </label>

        <a 
            onClick={()=>router.push("/login/forgot-password")}
        className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
          Esqueceu?
        </a>
      </div>

      {/* BOTÃO */}
      <button 
      id="botao"
        type="submit"
        className={`
          w-full
          h-9 sm:h-10
          bg-indigo-600
          text-white
          font-semibold
          text-xs sm:text-sm
          rounded-lg
          hover:bg-indigo-500
          transition
          mt-2
          
        `}
      >
        Entrar no Sistema
      </button>
    {/* CADASTRO */}
    <p className="text-center text-xs text-gray-500 font-medium">
      Não tem uma conta?{" "}
      <a onClick={() => router.push("/register")} className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
        Faça seu cadastro
      </a>
    </p>
    </form>


  </div>
  </div>
          </div>
        </section>
      </main>
    </>
  );
  
}
