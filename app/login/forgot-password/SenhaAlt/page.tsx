"use client";

import Image from "next/image";
import { useRouter } from 'next/navigation';

{/* tela de sucesso para quando o usuario solicitar a troca de senha, informando que um email foi enviado com as instruções para a troca de senha */}

export const dynamic = 'force-dynamic';
export default function SenhaAltPage() {
  const router = useRouter();
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

<section className="flex flex-col items-center  p-10 gap-10">


  <Image
    src="/yes.svg"
    alt="logo-login"
    width={80}
    height={30}
  />

<div className=" flex flex-col text-center gap-4">

  <h2 className=" text-3xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight ">
   E-mail enviado com Sucesso!
  </h2>
  
  <p className="font-light text-xs sm:text-lg text-gray-500">
   Verifique as instruções enviadas para sua <br /> caixa de e-mail.
  </p>

  

</div>

<button
      id="botao-forgot"
        type="button"
        onClick={() => router.push('/login')}
        
        className={`
          w-full
          h-10 sm:h-13
          text-white
          font-semibold
          text-xs sm:text-lg
          rounded-lg
          transition
          mt-2
            bg-[#1E40AF]
            cursor-pointer
          hover:bg-blue-700
        `}
      >
        Ir para o Login
      </button>

</section>
 <div className="mt-1 pt-6 border-t border-gray-200 justify-center flex items-center gap-3">
    <p className="text-sm text-gray-500 font-medium">
      Problemas para acessar?
    </p>
    <a href="/register" className="text-lg font-semibold text-[#1E40AF] hover:text-blue-700 transition">
     Contate o suporte
    </a>
            
          </div>
  </div>
  
  </div>
   </main>
   </>    );




}
  