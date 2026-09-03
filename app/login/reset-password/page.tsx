"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";                
import Image from "next/image";
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { validarResetSenha, getMensagemForcaSenha } from "./resetConfig";
import { api } from "@/lib/api";
import { saveAuth, setUserModule, getUserModule } from "@/lib/auth";

interface ForcaSenhaState {
  minimo8Caracteres?: boolean
  temMaiuscula?: boolean
  temMinuscula?: boolean
  temNumero?: boolean
  temEspecial?: boolean
  [key: string]: boolean | undefined
}

export function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPrimeiroAcesso = searchParams.get('primeiroAcesso') === 'true' || searchParams.get('firstAccess') === 'true';
    const emailFromQuery = searchParams.get('email') || '';
    const moduloFromQuery = searchParams.get('modulo') || '';

    // Ler token tanto do query parameter (?token=) quanto do fragmento de hash (#access_token=)
    const tokenFromQuery = searchParams.get('token') || searchParams.get('access_token') || '';
    const [token, setToken] = useState(tokenFromQuery);

    React.useEffect(() => {
      if (!token && typeof window !== 'undefined') {
        const hash = window.location.hash.replace(/^#/, '');
        if (hash) {
          const hashParams = new URLSearchParams(hash);
          const hashToken = hashParams.get('token') || hashParams.get('access_token');
          if (hashToken) {
            setToken(hashToken);
          }
        }
      }
    }, [token]);

    const [userEmail, setUserEmail] = useState(emailFromQuery);
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [forcaSenha, setForcaSenha] = useState<ForcaSenhaState>({});
    const [submitError, setSubmitError] = useState("");
    const [mensagemForca, setMensagemForca] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPassword(value);
      
      // Atualizar força da senha em tempo real
      if (value) {
        const validacao = validarResetSenha(value, confirmPassword);
        setForcaSenha(validacao.forcaSenha);
        setMensagemForca(getMensagemForcaSenha(validacao.forcaSenha).mensagem);
        setPasswordError("");
      } else {
        setForcaSenha({});
        setMensagemForca("");
      }
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setConfirmPassword(value);
      
      if (value) {
        if (value !== password) {
          setConfirmPasswordError("As senhas não conferem.");
        } else {
          setConfirmPasswordError("");
        }
      } else {
        setConfirmPasswordError("");
      }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitError("");

      if (isPrimeiroAcesso && !currentPassword) {
        setSubmitError("Por favor, informe a senha atual ou temporária recebida.");
        return;
      }

      if (!isPrimeiroAcesso && !token) {
        setSubmitError("Token de recuperação não encontrado. Por favor, utilize o link recebido por e-mail para redefinir sua senha.");
        return;
      }

      // Validação completa
      const validacao = validarResetSenha(password, confirmPassword);

      if (!validacao.valido) {
        setSubmitError(validacao.erros.join("\n"));
        return;
      }

      try {
        setIsLoading(true);
        if (isPrimeiroAcesso) {
          const res = await api.auth.primeiroAcesso({
            email: userEmail,
            senhaAtual: currentPassword,
            novaSenha: password,
            confirmarNovaSenha: confirmPassword,
          });
          if (res.access_token) {
            saveAuth(res.access_token, res.user);
            const mod = moduloFromQuery || res.user?.tipo_negocio || getUserModule();
            if (mod) {
              setUserModule(mod);
            }
          }
        } else {
          await api.auth.resetPassword({
            token,
            novaSenha: password,
            confirmarSenha: confirmPassword,
          });
        }
        setSuccess(true);
      } catch (err: any) {
        setSubmitError(err.message || "Erro ao definir nova senha. Verifique os dados inseridos.");
      } finally {
        setIsLoading(false);
      }
    };
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
  {success ? (
    <section className="flex flex-col items-center p-8 sm:p-10 gap-8">
      <Image
        src="/yes.svg"
        alt="success"
        width={80}
        height={30}
      />
      <div className="flex flex-col text-center gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          {isPrimeiroAcesso ? "Senha Definida com Sucesso!" : "Senha Alterada com Sucesso!"}
        </h2>
        <p className="font-medium text-xs sm:text-sm text-gray-500">
          {isPrimeiroAcesso
            ? "Seu primeiro acesso foi validado no sistema. Você já pode acessar seu módulo contratado."
            : "Sua senha foi atualizada. Agora você pode acessar o sistema com sua nova credencial."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (isPrimeiroAcesso) {
            router.push(moduloFromQuery ? `/menu-modulos?modulo=${encodeURIComponent(moduloFromQuery)}` : "/menu-modulos");
          } else {
            router.push("/login");
          }
        }}
        className="w-full h-10 sm:h-12 text-white font-semibold text-xs sm:text-base rounded-lg transition mt-2 bg-[#1E40AF] cursor-pointer hover:bg-blue-700 shadow-md"
      >
        {isPrimeiroAcesso ? "Acessar Módulo Contratado →" : "Ir para o Login"}
      </button>
      <div className="mt-1 pt-6 border-t border-gray-200 justify-center flex items-center gap-3">
        <p className="text-sm text-gray-500 font-medium">Problemas para acessar?</p>
        <a
          href="https://wa.me/5583999999999"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-[#1E40AF] hover:text-blue-700 transition"
        >
          Contate o suporte
        </a>
      </div>
    </section>
  ) : (
    <>
      {/* TÍTULO e LOGO */}
      <section className="flex flex-col items-center ">
        <Image
          src="/nova-logo.svg"
          alt="logo-login"
          width={380}
          height={60}
        />

        <div className="flex flex-col text-center -mt-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {isPrimeiroAcesso ? "Primeiro Acesso · Criar Senha" : "Redefinir Senha"}
          </h2>
          {isPrimeiroAcesso && (
            <p className="mt-1 text-xs text-gray-500 font-light max-w-xs">
              Por segurança, cadastre sua nova senha definitiva para liberar seus módulos.
            </p>
          )}
        </div>
      </section>

      {/* FORM */}
      <form className="w-full flex flex-col gap-3.5 sm:mt-3 mb-2 p-3" onSubmit={handleSubmit}>
        {!isPrimeiroAcesso && !token && (
          <div className="p-3 mb-2 text-xs text-amber-800 rounded-lg bg-amber-50 border border-amber-200" role="alert">
            Nenhum token de recuperação encontrado na URL. Para redefinir sua senha, utilize o link recebido por e-mail ou{" "}
            <a href="/login/forgot-password" className="font-semibold underline text-amber-900">
              solicite um novo link aqui
            </a>.
          </div>
        )}

        {submitError && (
          <div className="p-3.5 mb-2 text-xs text-red-800 rounded-lg bg-red-50 border border-red-200" role="alert">
            {submitError.split('\n').map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}

        {/* E-MAIL (Em Primeiro Acesso) */}
        {isPrimeiroAcesso && (
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              E-mail da Conta
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              required
              className="bg-[#F1F3F6] w-full rounded-lg text-xs sm:text-sm py-2 sm:py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 transition font-light text-gray-700"
            />
          </div>
        )}

        {/* SENHA ATUAL / TEMPORÁRIA (Em Primeiro Acesso) */}
        {isPrimeiroAcesso && (
          <div>
            <label className="block text-xs font-medium text-gray-900 mb-1">
              Senha Atual / Temporária
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite a senha temporária recebida"
              required
              className="bg-[#F1F3F6] w-full rounded-lg text-xs sm:text-sm py-2 sm:py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500 transition font-light"
            />
          </div>
        )}

      {/* SENHA */}
      <div> 
        <label className="block text-xs font-medium text-gray-900 mb-1.5">
          Nova Senha
        </label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Digite sua nova senha"
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
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-600">Força da senha:</p>
              <p className={`text-xs font-medium ${
                Object.values(forcaSenha).every(v => v) ? 'text-green-600' :
                Object.values(forcaSenha).filter(v => v).length >= 3 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {mensagemForca}
              </p>
            </div>
            <ul className="mt-1 text-xs text-gray-600 space-y-1">
              <li className={forcaSenha.minimo8Caracteres ? 'text-green-600' : 'text-red-600'}>
                ✓ Mínimo 8 caracteres
              </li>
              <li className={forcaSenha.temMaiuscula ? 'text-green-600' : 'text-red-600'}>
                ✓ Contém letra maiúscula
              </li>
              <li className={forcaSenha.temMinuscula ? 'text-green-600' : 'text-red-600'}>
                ✓ Contém letra minúscula
              </li>
              <li className={forcaSenha.temNumero ? 'text-green-600' : 'text-red-600'}>
                ✓ Contém número
              </li>
              <li className={forcaSenha.temEspecial ? 'text-green-600' : 'text-red-600'}>
                ✓ Contém caractere especial (!@#$%^&*)
              </li>
            </ul>
          </div>
        )}
      </div>
        {/* Confirmar Senha */}
      <div>
        <label className="block text-xs font-medium text-gray-900 mb-1.5">
          Confirmar Nova Senha
        </label>
        <div className="relative">
          <input
            type="password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirme sua nova senha"
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
        {confirmPasswordError && <p className="mt-1 text-sm text-red-500">{confirmPasswordError}</p>}
        {confirmPassword && password === confirmPassword && (
          <p className="mt-1 text-sm text-green-500">✓ Senhas conferem</p>
        )}
      </div>
          {/* BOTÃO */}
      <button
        type="submit"
        disabled={
          isLoading ||
          !password ||
          !confirmPassword ||
          !!confirmPasswordError ||
          password !== confirmPassword ||
          (isPrimeiroAcesso && !currentPassword) ||
          (!isPrimeiroAcesso && !token)
        }
        className={`
          w-full
          h-9 sm:h-10
          text-white
          font-semibold
          text-xs sm:text-sm
          rounded-lg
          transition
          mt-2
          ${(isLoading || !password || !confirmPassword || confirmPasswordError || password !== confirmPassword || (isPrimeiroAcesso && !currentPassword))
            ? 'bg-gray-400 cursor-not-allowed opacity-60'
            : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer shadow-md'
          }
        `}
      >
        {isLoading
          ? "Processando..."
          : isPrimeiroAcesso
          ? "Salvar Senha e Acessar Módulos →"
          : "Redefinir Senha"}
      </button>
    {/* CADASTRO */}
    
    </form>
    </>
  )}
  </div>
  </div>
  </main>
</>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#1E40AF] text-white">Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}