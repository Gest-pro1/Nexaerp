// Validação de força de senha
export const validarForcaSenha = (senha) => {
  const requisitos = {
    minimo8Caracteres: senha.length >= 8,
    temMaiuscula: /[A-Z]/.test(senha),
    temMinuscula: /[a-z]/.test(senha),
    temNumero: /[0-9]/.test(senha),
    temEspecial: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(senha),
  };

  return requisitos;
};

// Validação de conformidade das senhas
export const validarConfirmacaoSenha = (senha, confirmacao) => {
  return senha === confirmacao;
};

// Validação completa de reset de senha
export const validarResetSenha = (senha, confirmacaoSenha) => {
  const erros = [];

  // Verificar se a senha está vazia
  if (!senha || senha.trim() === "") {
    erros.push("A senha não pode estar vazia.");
    return {
      valido: false,
      erros: erros,
      forcaSenha: {},
      senhasConferem: false,
    };
  }

  // Validar força da senha
  const forcaSenha = validarForcaSenha(senha);

  if (!forcaSenha.minimo8Caracteres) {
    erros.push("A senha deve ter no mínimo 8 caracteres.");
  }

  if (!forcaSenha.temMaiuscula) {
    erros.push("A senha deve conter pelo menos uma letra maiúscula.");
  }

  if (!forcaSenha.temMinuscula) {
    erros.push("A senha deve conter pelo menos uma letra minúscula.");
  }

  if (!forcaSenha.temNumero) {
    erros.push("A senha deve conter pelo menos um número.");
  }

  if (!forcaSenha.temEspecial) {
    erros.push("A senha deve conter pelo menos um caractere especial (!@#$%^&*).");
  }

  // Verificar se a confirmação não está vazia
  if (!confirmacaoSenha || confirmacaoSenha.trim() === "") {
    erros.push("A confirmação de senha não pode estar vazia.");
  }

  // Verificar se as senhas conferem
  const senhasConferem = validarConfirmacaoSenha(senha, confirmacaoSenha);
  if (!senhasConferem && confirmacaoSenha) {
    erros.push("As senhas não conferem.");
  }

  return {
    valido: erros.length === 0,
    erros: erros,
    forcaSenha: forcaSenha,
    senhasConferem: senhasConferem,
  };
};

// Gerar mensagem de força de senha para o usuário
export const getMensagemForcaSenha = (forcaSenha) => {
  const requisitosAtendidos = Object.values(forcaSenha).filter(
    (valor) => valor
  ).length;
  const totalRequisitos = Object.keys(forcaSenha).length;

  if (requisitosAtendidos === totalRequisitos) {
    return { mensagem: "Senha forte", cor: "text-green-600" };
  } else if (requisitosAtendidos >= 3) {
    return { mensagem: "Senha média", cor: "text-yellow-600" };
  } else {
    return { mensagem: "Senha fraca", cor: "text-red-600" };
  }
};
