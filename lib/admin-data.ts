export const ADMIN_DATA_UPDATED_EVENT = "nexaerp-admin-data-updated";

export type EmpresaAdmin = {
  id: number;
  nome: string;
  cnpj: string;
  plano: string;
  responsavel: string;
  email: string;
  status: "ativa" | "inativa" | "bloqueado" | "pendente";
  dataCobranca: string;
  valor: string;
  cor: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  senha?: string;
  telefone?: string;
};

export const parseCurrency = (value: string | undefined): number => {
  if (!value) return 0;
  const normalized = value
    .replace(/R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value: number): string =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

export const readEmpresas = (): EmpresaAdmin[] => {
  return [];
};

export const dispatchAdminDataUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_DATA_UPDATED_EVENT));
  }
};

export const readConfiguredPlans = () => {
  return [];
};
