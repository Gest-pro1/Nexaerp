" use client";


import Image from "next/image";
import { validateEmail, handleSubmit as validateAndLog } from "../forgot-password/config";

{/* tela de sucesso para quando o usuario solicitar a troca de senha, informando que um email foi enviado com as instruções para a troca de senha */}

export default function SenhaAltPage() {

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
   E-mail enviado com  Sucesso!
  </h2>
  <p className="font-light text-xs sm:text-lg text-gray-500">
   Verifique as instruções enviada para sua <br /> caixa de e-mail.
  </p>


</div>

<button
      id="botao-forgot"
        type="submit"
        
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
        `}
      >
        Ir para o Login
      </button>

</section>
  </div>
  </div>
   </main>
   </>    );




}
  