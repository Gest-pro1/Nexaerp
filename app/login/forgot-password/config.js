
// Expressão regular para validar o formato do email
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Função para validar email
export const validateEmail = (email) => {
  return emailRegex.test(email);
};

// Função para verificar se o botão deve estar habilitado
export const isButtonEnabled = (email) => {
  return validateEmail(email);
}; 

// teste de email enviado para o console
export const handleSubmit = (email) => {
  if (!validateEmail(email)) {
    console.log("Email inválido! Por favor, insira um email válido.");
    return;
  }
  console.log("✓ Email enviado com sucesso!");
};
