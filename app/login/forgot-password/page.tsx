"use client";
import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";    
import Image from "next/image";
import { validateEmail, handleSubmit as validateAndLog } from "./config";

export default function ForgotPasswordPage() {
   const [email, setEmail] = useState("");
   const router = useRouter();

   // Função para lidar com o envio do formulário
   const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     
     if (!validateEmail(email)) {
       alert("Email inválido! Por favor, insira um email válido.");
       return;
     }
     
     validateAndLog(email);
     alert("Email válido! Instruções de recuperação de senha serão enviadas.");
     // Aqui você pode adicionar a lógica para enviar as instruções de recuperação de senha
   };

   // Verifica se o email é válido
   const isEmailValid = validateEmail(email);
return(
   <>
     <div className="fixed inset-0 -z-10">
        <div className="h-1/2 bg-[#1E40AF]" />
        <div className="h-1/2 bg-white" />
      </div>
   <main className=" w-full  flex items-center justify-center px-2 sm:px-6 lg:px-8 min-h-screen relative z-10 ">
    
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
  "
>
  {/* WRAPPER INTERNO */}
  <div className="flex flex-col items-center mb-4 -mt-15 gap-2">

{/* TÍTULO  e LOGO*/}

<section className="flex flex-col items-center ">


  <Image
    src="/nova-logo.svg"
    alt="logo-login"
    width={380}
    height={60}
  />

<div className=" flex flex-col text-center gap-4">

  <h2 className=" text-3xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight ">
   Esqueci Minha Senha
  </h2>
  <p className="font-light text-xs sm:text-sm text-gray-500">
   Digite seu e-mail cadastrado para receber  <br /> instruções de recuperação de senha.
  </p>


</div>
</section>

    {/* FORM */}
    <form className="w-full flex flex-col gap-4 sm:mt-3 mb-2 p-3" onSubmit={handleSubmit}>

      {/* EMAIL */}
      <div> 
        <label className="block text-xs font-medium text-gray-900 mb-1.5">
          E-mail
        </label>
        <div className="relative">
          <input
        id="email2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite seu e-mail"
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
          {/* BOTÃO */}
      <button
      id="botao-forgot"
        type="submit"
        disabled={!isEmailValid}
        className={`
          w-full
          h-9 sm:h-10
          text-white
          font-semibold
          text-xs sm:text-sm
          rounded-lg
          transition
          mt-2
          ${isEmailValid 
            ? 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer' 
            : 'bg-gray-400 cursor-not-allowed opacity-60'
          }
        `}
      >
        Enviar Instruções
      </button>
    {/* CADASTRO */}
    <p className="text-center text-xs text-gray-500 font-light">
     Lembrou da sua senha?{" "}
      <a 
         onClick={()=> router.push("/login")}      
      className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer">
        Faça  login
      </a>
    </p>
    </form>


  </div>
  </div>
   </main>
   
   
   
   
   </>    );}