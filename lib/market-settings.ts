export type PixKeyType = "CNPJ" | "CPF" | "E-mail" | "Telefone" | "Chave Aleatória";

export type OperatorRole = "cashier" | "manager" | "admin";

export interface OperatorPermissions {
  authorizeBookletSale: boolean;
  grantPosDiscounts: boolean;
  cancelItemsAndSales: boolean;
  manageStockAndPrices: boolean;
  financialReportsAndProfits: boolean;
  manageTeamAndPermissions: boolean;
}

export interface SystemOperator {
  id: string;
  name: string;
  username: string;
  password: string;
  role: OperatorRole;
  permissions: OperatorPermissions;
}

export interface StoreGeneralSettings {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ie: string;
  phone: string;
  address: string;
  pixKeyType: PixKeyType;
  pixKey: string;
  receiptFooter: string;
  terminalName: string;
}

export const PIX_KEY_TYPES: PixKeyType[] = [
  "CNPJ",
  "CPF",
  "E-mail",
  "Telefone",
  "Chave Aleatória",
];

export const DEFAULT_STORE_SETTINGS: StoreGeneralSettings = {
  razaoSocial: "Amabily Comércio Varejista Ltda",
  nomeFantasia: "Mercadinho & Conveniência Amabily",
  cnpj: "18.421.902/0001-34",
  ie: "109.832.441.110",
  phone: "(11) 98765-4321",
  address: "Rua das Flores, 450 - Centro - Ingá/PB",
  pixKeyType: "CNPJ",
  pixKey: "18421902000134",
  receiptFooter: "Obrigado pela preferência! Volte sempre.",
  terminalName: "Caixa 01",
};

export function getPresetPermissionsForRole(role: OperatorRole): OperatorPermissions {
  if (role === "admin") {
    return {
      authorizeBookletSale: true,
      grantPosDiscounts: true,
      cancelItemsAndSales: true,
      manageStockAndPrices: true,
      financialReportsAndProfits: true,
      manageTeamAndPermissions: true,
    };
  }
  if (role === "manager") {
    return {
      authorizeBookletSale: true,
      grantPosDiscounts: true,
      cancelItemsAndSales: true,
      manageStockAndPrices: true,
      financialReportsAndProfits: true,
      manageTeamAndPermissions: false,
    };
  }
  return {
    authorizeBookletSale: true,
    grantPosDiscounts: false,
    cancelItemsAndSales: false,
    manageStockAndPrices: false,
    financialReportsAndProfits: false,
    manageTeamAndPermissions: false,
  };
}

export const DEFAULT_OPERATORS: SystemOperator[] = [
  {
    id: "op-1",
    name: "João Silva",
    username: "joao.caixa",
    password: "123",
    role: "cashier",
    permissions: {
      authorizeBookletSale: true,
      grantPosDiscounts: false,
      cancelItemsAndSales: false,
      manageStockAndPrices: false,
      financialReportsAndProfits: false,
      manageTeamAndPermissions: false,
    },
  },
  {
    id: "op-2",
    name: "Carlos Mendes",
    username: "carlos.gerente",
    password: "123",
    role: "manager",
    permissions: {
      authorizeBookletSale: true,
      grantPosDiscounts: true,
      cancelItemsAndSales: true,
      manageStockAndPrices: true,
      financialReportsAndProfits: true,
      manageTeamAndPermissions: false,
    },
  },
  {
    id: "op-3",
    name: "Amabily Administrador",
    username: "amabily.admin",
    password: "123",
    role: "admin",
    permissions: {
      authorizeBookletSale: true,
      grantPosDiscounts: true,
      cancelItemsAndSales: true,
      manageStockAndPrices: true,
      financialReportsAndProfits: true,
      manageTeamAndPermissions: true,
    },
  },
];

export const OPERATOR_PERMISSION_ITEMS: {
  key: keyof OperatorPermissions;
  label: string;
  badgeLabel: string;
}[] = [
  {
    key: "authorizeBookletSale",
    label: "Autorizar Venda na Caderneta",
    badgeLabel: "Caderneta",
  },
  {
    key: "grantPosDiscounts",
    label: "Conceder Descontos no PDV",
    badgeLabel: "Descontos",
  },
  {
    key: "cancelItemsAndSales",
    label: "Cancelar Itens e Vendas",
    badgeLabel: "Caixa",
  },
  {
    key: "manageStockAndPrices",
    label: "Gestão de Estoque e Preços",
    badgeLabel: "Estoque",
  },
  {
    key: "financialReportsAndProfits",
    label: "Relatórios Financeiro e Lucros",
    badgeLabel: "Relatórios",
  },
  {
    key: "manageTeamAndPermissions",
    label: "Gerenciar Equipes e Permissões",
    badgeLabel: "Equipes",
  },
];

export function formatOperatorRoleLabel(role: OperatorRole): string {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Gerente";
  return "Caixa";
}
