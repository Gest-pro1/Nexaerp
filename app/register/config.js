// Validação de CPF
export const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
};

// Validação de CNPJ
export const validarCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]/g, "");
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = 0;
  for (let i = tamanho - 1; i >= 0; i--) {
    pos++;
    soma += numeros.charAt(i) * Math.pow(2, (pos % 8));
    if (pos === 8) pos = 0;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = 0;
  for (let i = tamanho - 1; i >= 0; i--) {
    pos++;
    soma += numeros.charAt(i) * Math.pow(2, (pos % 8));
    if (pos === 8) pos = 0;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
};

// Validação de Email
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validação de Telefone (formato brasileiro)
export const validarTelefone = (telefone) => {
  const regex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
  return regex.test(telefone.replace(/\s/g, ""));
};

// Validação de Nome (pelo menos 3 caracteres e sem números)
export const validarNome = (nome) => {
  return nome.trim().length >= 3 && !/\d/.test(nome);
};

// Validação geral do cadastro
export const validarCadastro = ({
  razaoSocial,
  cnpj,
  telefone,
  cep,
  estado,
  cidade,
  nomeCompleto,
  cpf,
  email,
}) => {
  const erros = [];

  if (!razaoSocial || razaoSocial.trim().length < 3) {
    erros.push("Razão Social deve ter pelo menos 3 caracteres.");
  }

  if (!cnpj || !validarCNPJ(cnpj)) {
    erros.push("CNPJ inválido.");
  }

  if (!telefone || !validarTelefone(telefone)) {
    erros.push("Telefone inválido.");
  }

  if (!cep || cep.replace(/\D/g, "").length !== 8) {
    erros.push("CEP inválido.");
  }

  if (!estado || estado.trim() === "") {
    erros.push("UF é obrigatório.");
  }

  if (!cidade || cidade.trim().length === 0) {
    erros.push("Cidade é obrigatória.");
  }

  if (!nomeCompleto || !validarNome(nomeCompleto)) {
    erros.push("Nome Completo inválido.");
  }

  if (!cpf || !validarCPF(cpf)) {
    erros.push("CPF inválido.");
  }

  if (!email || !validarEmail(email)) {
    erros.push("E-mail inválido.");
  }

  return {
    valido: erros.length === 0,
    erros: erros,
  };
};
