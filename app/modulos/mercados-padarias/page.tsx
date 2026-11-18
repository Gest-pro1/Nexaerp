"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import {
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  BookOpenIcon,
  ChartBarSquareIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  TruckIcon,
  UserIcon,
  WalletIcon,
  WifiIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  type BestSellingProduct,
  type DashboardPeriod,
  type DashboardSale,
  type MarketDashboardData,
  type PaymentMethodId,
} from "@/lib/market-dashboard";
import {
  type InventoryProduct,
  type InventorySupplier,
} from "@/lib/market-inventory";
import {
  type BookletCustomer,
  type BookletPaymentMethod,
} from "@/lib/market-booklet";
import {
  DEFAULT_OPERATORS,
  DEFAULT_STORE_SETTINGS,
  formatOperatorRoleLabel,
  type StoreGeneralSettings,
  type SystemOperator,
} from "@/lib/market-settings";
import {
  formatPosPaymentMethod,
  type PosCompletedSale,
  type PosPaymentLaunch,
  type PosProduct,
} from "@/lib/market-pos";
import PdvScreen from "./pdv-screen";
import CashierScreen, {
  type CashierClosingRecord,
  type ShiftSalesSummary,
} from "./cashier-screen";
import InventoryScreen from "./inventory-screen";
import SuppliersScreen from "./suppliers-screen";
import BookletScreen from "./booklet-screen";
import SettingsScreen from "./settings-screen";

type OperationMenuId =
  | "inicio"
  | "pdv"
  | "caixa"
  | "estoque"
  | "fornecedores"
  | "caderneta"
  | "configuracoes";

const PERIOD_FILTERS: { id: DashboardPeriod; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7days", label: "7 Dias" },
  { id: "30days", label: "30 Dias" },
  { id: "all", label: "Geral" },
];

const OPERATION_MENU: {
  id: Exclude<OperationMenuId, "configuracoes">;
  label: string;
  icon: typeof Squares2X2Icon;
}[] = [
  { id: "inicio", label: "Início", icon: Squares2X2Icon },
  { id: "pdv", label: "PDV", icon: ShoppingCartIcon },
  { id: "caixa", label: "Caixa", icon: WalletIcon },
  { id: "estoque", label: "Estoque", icon: CubeIcon },
  { id: "fornecedores", label: "Fornecedores", icon: TruckIcon },
  { id: "caderneta", label: "Caderneta", icon: BookOpenIcon },
];

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrency(value: number): string {
  return brlFormatter.format(value);
}

function getPaymentBarColor(id: PaymentMethodId): string {
  switch (id) {
    case "pix":
      return "#00a86b";
    case "credit-card":
      return "#0066ff";
    case "debit-card":
      return "#203f9f";
    case "cash":
      return "#ff8d28";
    case "booklet":
      return "#9a3412";
  }
}

const FIGMA_DEFAULT_DASHBOARD: MarketDashboardData = {
  metrics: {
    revenue: 480,
    grossProfit: 150,
    averageProfitMargin: 23.3,
    itemsSold: 19,
    averageItemsPerSale: 2.7,
    salesCount: 7,
    bookletRevenue: 50,
    bookletRevenuePercentage: 0,
  },
  paymentMethods: [
    { id: "pix", name: "Pix Instantâneo", amount: 164, percentage: 32 },
    { id: "credit-card", name: "Cartão de Crédito", amount: 105.2, percentage: 22 },
    { id: "debit-card", name: "Cartão de Débito", amount: 0, percentage: 0 },
    { id: "cash", name: "Dinheiro", amount: 10.48, percentage: 9 },
    { id: "booklet", name: "Caderneta", amount: 210.45, percentage: 37 },
  ],
  bestSellingProducts: [
    {
      id: "prod-1",
      name: "Arroz Branco Camil Tipo 1 5Kg",
      category: "Mercearia",
      quantitySold: 4,
      revenue: 107.6,
      estimatedProfit: 23.6,
    },
    {
      id: "prod-2",
      name: "Refrigerante Coca-Cola 2L",
      category: "Bebidas",
      quantitySold: 3,
      revenue: 29.97,
      estimatedProfit: 8.37,
    },
    {
      id: "prod-3",
      name: "Feijão Carioca Kicaldo 1Kg",
      category: "Mercearia",
      quantitySold: 3,
      revenue: 25.5,
      estimatedProfit: 6.3,
    },
    {
      id: "prod-4",
      name: "Café Torrado e Moído Pilão 500g",
      category: "Mercearia",
      quantitySold: 1,
      revenue: 19.9,
      estimatedProfit: 4.9,
    },
    {
      id: "prod-5",
      name: "Biscoito Recheado Passatempo 130g",
      category: "Padaria & Doces",
      quantitySold: 3,
      revenue: 9.9,
      estimatedProfit: 3.3,
    },
    {
      id: "prod-6",
      name: "Detergente Líquido Ypê Neutro 500ml",
      category: "Limpeza",
      quantitySold: 3,
      revenue: 7.77,
      estimatedProfit: 2.37,
    },
  ],
  sales: [
    {
      id: "s-1",
      code: "#VD-7129",
      dateTime: "24/09/2026, 16:35:15",
      operator: "João Silva (Caixa 01)",
      itemCount: 1,
      paymentMethod: "Crédito",
      receiptStatus: "Autorizada",
      total: 26.9,
    },
    {
      id: "s-2",
      code: "#VD-7467",
      dateTime: "24/09/2026, 16:28:01",
      operator: "João Silva (Caixa 01)",
      itemCount: 4,
      paymentMethod: "Crédito",
      receiptStatus: "Autorizada",
      total: 32.69,
    },
    {
      id: "s-3",
      code: "#VD-8227",
      dateTime: "24/09/2026, 16:22:49",
      operator: "João Silva (Caixa 01)",
      itemCount: 2,
      paymentMethod: "Dinheiro",
      receiptStatus: "Autorizada",
      total: 112.14,
    },
    {
      id: "s-4",
      code: "#VD-4971",
      dateTime: "24/09/2026, 16:08:16",
      operator: "João Silva (Caixa 01)",
      itemCount: 1,
      paymentMethod: "Crédito",
      receiptStatus: "Autorizada",
      total: 255.12,
    },
    {
      id: "s-5",
      code: "#VD-9056",
      dateTime: "24/09/2026, 15:49:10",
      operator: "Joana (Caixa 02)",
      itemCount: 6,
      paymentMethod: "Pix",
      receiptStatus: "Autorizada",
      total: 94.25,
    },
    {
      id: "s-6",
      code: "#VD-1046",
      dateTime: "24/09/2026, 15:35:30",
      operator: "Joana (Caixa 02)",
      itemCount: 3,
      paymentMethod: "Crédito",
      receiptStatus: "Autorizada",
      total: 18.19,
    },
    {
      id: "s-7",
      code: "#VD-1047",
      dateTime: "24/09/2026, 15:21:09",
      operator: "Joana (Caixa 02)",
      itemCount: 7,
      paymentMethod: "Caderneta",
      receiptStatus: "Balcão",
      total: 233.39,
    },
    {
      id: "s-8",
      code: "#VD-7721",
      dateTime: "24/09/2026, 14:22:26",
      operator: "Joana (Caixa 02)",
      itemCount: 1,
      paymentMethod: "Crédito",
      receiptStatus: "Autorizada",
      total: 245.26,
    },
  ],
  totalSales: 8,
};

const FIGMA_DEFAULT_SUPPLIERS: InventorySupplier[] = [
  {
    id: "sup-1",
    name: "Bebida Sul Atacado",
    document: "98.765.432/0001-10",
    representative: "Fernanda Lopes",
    contact: "(51) 99123-4567",
    email: "pedidos@bebidassul.com.br",
    cep: "90240-000",
    street: "Rua das Cervejarias",
    number: "45",
    neighborhood: "Vila Nova",
    city: "Porto Alegre",
    state: "RS",
    notes: "Pedido mínimo de 10 caixas",
  },
  {
    id: "sup-2",
    name: "Distribuidora Central Alimentos",
    document: "12.345.678/0001-90",
    representative: "Carlos Menezes",
    contact: "(11) 99876-5432",
    email: "vendas@centralalimentos.com.br",
    city: "São Paulo",
    state: "SP",
    notes: "Entrega semanal",
  },
  {
    id: "sup-3",
    name: "Distribuidora de Limpeza Brilho",
    document: "45.123.789/0001-55",
    representative: "Juliana Prado",
    contact: "(41) 99123-4567",
    email: "comercial@brilhodistribuidora.com",
    city: "Curitiba",
    state: "PR",
    notes: "Boleto 28 dias",
  },
  {
    id: "sup-4",
    name: "Hortifruti Vale Verde",
    document: "33.222.111/0001-42",
    representative: "Rafael Souza",
    contact: "(19) 99654-7788",
    email: "contato@valeverde.com.br",
    city: "Campinas",
    state: "SP",
    notes: "Repositor diário",
  },
];

const FIGMA_DEFAULT_PRODUCTS: InventoryProduct[] = [
  {
    id: "prod-1",
    code: "1001",
    barcode: "7894900011517",
    description: "Refrigerante Coca-Cola 2L",
    category: "Bebidas",
    unit: "UN",
    unitCost: 7.2,
    suggestedMargin: 28.4,
    salePrice: 9.99,
    currentStock: 27,
    minStock: 12,
    expirationDate: "25/01/2027",
    supplierId: "sup-1",
    supplierName: "Bebida Sul Atacado",
    active: true,
  },
  {
    id: "prod-2",
    code: "1002",
    barcode: "7891825114147",
    description: "Leite Integral UHT Piracanjuba 1L",
    category: "Laticínios & Frios",
    unit: "UN",
    unitCost: 3.3,
    suggestedMargin: 33.9,
    salePrice: 4.99,
    currentStock: 20,
    minStock: 25,
    expirationDate: "19/12/2026",
    supplierId: "sup-2",
    supplierName: "Distribuidora Central Alimentos",
    active: true,
  },
  {
    id: "prod-3",
    code: "1003",
    barcode: "7896006711115",
    description: "Arroz Branco Camil Tipo 1 5Kg",
    category: "Mercearia",
    unit: "PCT",
    unitCost: 21.0,
    suggestedMargin: 22.0,
    salePrice: 26.9,
    currentStock: 11,
    minStock: 10,
    expirationDate: "20/08/2027",
    supplierId: "sup-2",
    supplierName: "Distribuidora Central Alimentos",
    active: true,
  },
  {
    id: "prod-4",
    code: "1004",
    barcode: "7896005800025",
    description: "Feijão Carioca Kicaldo 1Kg",
    category: "Mercearia",
    unit: "UN",
    unitCost: 6.4,
    suggestedMargin: 24.7,
    salePrice: 8.5,
    currentStock: 22,
    minStock: 10,
    expirationDate: "15/06/2027",
    supplierId: "sup-2",
    supplierName: "Distribuidora Central Alimentos",
    active: true,
  },
  {
    id: "prod-5",
    code: "1005",
    barcode: "7891107000504",
    description: "Óleo de Soja Soya 900ml",
    category: "Mercearia",
    unit: "PCT",
    unitCost: 5.2,
    suggestedMargin: 20.0,
    salePrice: 6.5,
    currentStock: 17,
    minStock: 8,
    expirationDate: "10/09/2027",
    supplierId: "sup-2",
    supplierName: "Distribuidora Central Alimentos",
    active: true,
  },
  {
    id: "prod-6",
    code: "1006",
    barcode: "7896089011359",
    description: "Café Torrado e Moído Pilão 500g",
    category: "Mercearia",
    unit: "CX",
    unitCost: 15.0,
    suggestedMargin: 24.6,
    salePrice: 19.9,
    currentStock: 16,
    minStock: 10,
    expirationDate: "30/11/2027",
    supplierId: "sup-2",
    supplierName: "Distribuidora Central Alimentos",
    active: true,
  },
  {
    id: "prod-7",
    code: "1007",
    barcode: "7891150056404",
    description: "Sabão em Pó Omo Lavagem Perfeita 800g",
    category: "Mercearia",
    unit: "UN",
    unitCost: 11.2,
    suggestedMargin: 24.8,
    salePrice: 14.9,
    currentStock: 42,
    minStock: 20,
    expirationDate: "12/12/2027",
    supplierId: "sup-3",
    supplierName: "Distribuidora de Limpeza Brilho",
    active: true,
  },
  {
    id: "prod-8",
    code: "1008",
    barcode: "7896098900208",
    description: "Detergente Líquido Ypê Neutro 500ml",
    category: "Limpeza",
    unit: "UN",
    unitCost: 1.8,
    suggestedMargin: 30.5,
    salePrice: 2.59,
    currentStock: 32,
    minStock: 15,
    expirationDate: "18/10/2027",
    supplierId: "sup-3",
    supplierName: "Distribuidora de Limpeza Brilho",
    active: true,
  },
  {
    id: "prod-9",
    code: "1009",
    barcode: "7891000241301",
    description: "Biscoito Recheado Passatempo 130g",
    category: "Padaria & Doces",
    unit: "UN",
    unitCost: 2.2,
    suggestedMargin: 33.3,
    salePrice: 3.3,
    currentStock: 35,
    minStock: 15,
    expirationDate: "22/07/2027",
    supplierId: "sup-2",
    supplierName: "Distribuidora Central Alimentos",
    active: true,
  },
  {
    id: "prod-10",
    code: "1010",
    barcode: "7891024134504",
    description: "Creme Dental Colgate Total 12 90g",
    category: "Padaria & Doces",
    unit: "UN",
    unitCost: 4.1,
    suggestedMargin: 26.8,
    salePrice: 5.6,
    currentStock: 35,
    minStock: 15,
    expirationDate: "01/11/2027",
    supplierId: "sup-3",
    supplierName: "Distribuidora de Limpeza Brilho",
    active: true,
  },
  {
    id: "prod-11",
    code: "1011",
    barcode: "7890000010119",
    description: "Banana Prata Selecionada (Quilo)",
    category: "Hortifruti",
    unit: "KG",
    unitCost: 3.8,
    suggestedMargin: 35.6,
    salePrice: 5.9,
    currentStock: 40,
    minStock: 10,
    expirationDate: "30/11/2026",
    supplierId: "sup-4",
    supplierName: "Hortifruti Vale Verde",
    active: true,
  },
  {
    id: "prod-12",
    code: "1012",
    barcode: "7890000010126",
    description: "Manga Tommy (Quilo)",
    category: "Hortifruti",
    unit: "KG",
    unitCost: 3.8,
    suggestedMargin: 35.6,
    salePrice: 5.9,
    currentStock: 30,
    minStock: 10,
    expirationDate: "30/11/2026",
    supplierId: "sup-4",
    supplierName: "Hortifruti Vale Verde",
    active: true,
  },
];

const FIGMA_DEFAULT_CUSTOMERS: BookletCustomer[] = [
  {
    id: "cust-1",
    code: "0001",
    name: "Dona Maria de Lourdes",
    phone: "(83) 99123-4567",
    cpf: "025.498.798-89",
    rg: "12.345.678",
    creditLimit: 500,
    balance: 105.18,
    dueDay: "Todo dia 15",
    notes: "Cliente antiga",
    createdAt: "23 de setembro de 2026",
    entries: [
      {
        id: "e-1",
        type: "purchase",
        description: "Compra PDV #VD-1140",
        dateTime: "23/09/2026, 14:20:00",
        operatorName: "João Silva",
        amount: 105.18,
        balanceAfter: 105.18,
      },
    ],
  },
  {
    id: "cust-2",
    code: "0002",
    name: "Professora Fernanda",
    phone: "(83) 99452-3421",
    cpf: "000.651.324-61",
    rg: "11.548",
    creditLimit: 800,
    balance: 0,
    dueDay: "Todo dia 10",
    notes: "Miguel (filho), Vera (esposa)",
    createdAt: "23 de setembro de 2026",
    entries: [],
  },
  {
    id: "cust-3",
    code: "0003",
    name: "Roberto Pedreiro",
    phone: "(83) 99985-3578",
    cpf: "123.215.546-11",
    rg: "",
    creditLimit: 600,
    balance: 200,
    dueDay: "Todo dia 05",
    notes: "",
    createdAt: "23 de setembro de 2026",
    entries: [],
  },
  {
    id: "cust-4",
    code: "0004",
    name: "Seu Antônio Mecânico",
    phone: "(83) 99653-4710",
    cpf: "412.512.136-21",
    rg: "",
    creditLimit: 500,
    balance: 100,
    dueDay: "Todo dia 15",
    notes: "",
    createdAt: "23 de setembro de 2026",
    entries: [],
  },
  {
    id: "cust-5",
    code: "0005",
    name: "Marcos (Vizinho)",
    phone: "(83) 99032-3248",
    cpf: "000.214.365-00",
    rg: "",
    creditLimit: 1000,
    balance: 0,
    dueDay: "Todo dia 10",
    notes: "",
    createdAt: "23 de setembro de 2026",
    entries: [],
  },
  {
    id: "cust-6",
    code: "0006",
    name: "Enéas Carneiro",
    phone: "(83) 99325-1452",
    cpf: "142.326.521-01",
    rg: "",
    creditLimit: 700,
    balance: 200,
    dueDay: "Todo dia 05",
    notes: "",
    createdAt: "23 de setembro de 2026",
    entries: [],
  },
];

const FIGMA_DEFAULT_CLOSINGS: CashierClosingRecord[] = [
  {
    id: "cl-1",
    closedAt: "29/09/2026",
    shiftTimeRange: "09:30 - 15:33",
    operatorName: "João Silva",
    terminalName: "Caixa 01",
    initialFund: 150,
    totalSales: 145.99,
    expectedDrawer: 150,
    physicalCount: 150,
    difference: 0,
    statusLabel: "Fechado",
    movements: [
      {
        id: "mv-1",
        type: "sale",
        amount: 144.15,
        reason: "Venda #000132",
        createdAt: "13:24 - Dinheiro + 3 mais",
      },
      {
        id: "mv-2",
        type: "withdrawal",
        amount: 70,
        reason: "Depósito Bancário",
        createdAt: "11:24",
      },
      {
        id: "mv-3",
        type: "supply",
        amount: 150,
        reason: "Cédulas",
        createdAt: "11:24",
      },
    ],
  },
  {
    id: "cl-2",
    closedAt: "23/09/2026",
    shiftTimeRange: "08:57 - 18:00",
    operatorName: "Sílvia Mota",
    terminalName: "Caixa 02",
    initialFund: 230,
    totalSales: 398.5,
    expectedDrawer: 230,
    physicalCount: 230,
    difference: 0,
    statusLabel: "Fechado",
    movements: [],
  },
  {
    id: "cl-3",
    closedAt: "22/09/2026",
    shiftTimeRange: "08:10 - 18:30",
    operatorName: "João Silva",
    terminalName: "Caixa 01",
    initialFund: 250,
    totalSales: 185.9,
    expectedDrawer: 250,
    physicalCount: 230,
    difference: -20,
    statusLabel: "Fechado",
    movements: [],
  },
  {
    id: "cl-4",
    closedAt: "21/09/2026",
    shiftTimeRange: "07:38 - 17:35",
    operatorName: "João Silva",
    terminalName: "Caixa 01",
    initialFund: 180,
    totalSales: 245.5,
    expectedDrawer: 180,
    physicalCount: 180,
    difference: 0,
    statusLabel: "Fechado",
    movements: [],
  },
];

export interface MercadosPadariasPageProps {
  initialData?: MarketDashboardData;
  initialProducts?: InventoryProduct[];
  initialSuppliers?: InventorySupplier[];
  initialCustomers?: BookletCustomer[];
}

export default function MercadosPadariasPage({
  initialData = FIGMA_DEFAULT_DASHBOARD,
  initialProducts = FIGMA_DEFAULT_PRODUCTS,
  initialSuppliers = FIGMA_DEFAULT_SUPPLIERS,
  initialCustomers = FIGMA_DEFAULT_CUSTOMERS,
}: MercadosPadariasPageProps) {
  const [selectedPeriod, setSelectedPeriod] =
    useState<DashboardPeriod>("all");
  const [activeMenu, setActiveMenu] = useState<OperationMenuId>("inicio");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Store & Operator Settings State
  const [storeSettings, setStoreSettings] = useState<StoreGeneralSettings>(
    DEFAULT_STORE_SETTINGS,
  );
  const [operators, setOperators] =
    useState<SystemOperator[]>(DEFAULT_OPERATORS);
  const [currentOperator, setCurrentOperator] = useState<SystemOperator>(
    DEFAULT_OPERATORS[1], // Carlos Mendes (Gerente)
  );

  // Switch Operator Modal State
  const [isSwitchOperatorOpen, setIsSwitchOperatorOpen] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(
    DEFAULT_OPERATORS[1].id,
  );
  const [operatorPassword, setOperatorPassword] = useState("");
  const [operatorSwitchError, setOperatorSwitchError] = useState<string | null>(
    null,
  );
  const switchDialogTitleId = useId();

  // Shared Frontend State across tabs
  const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);
  const [suppliers, setSuppliers] =
    useState<InventorySupplier[]>(initialSuppliers);
  const [customers, setCustomers] =
    useState<BookletCustomer[]>(initialCustomers);
  const [isCashierOpen, setIsCashierOpen] = useState(true);
  const [shiftSales, setShiftSales] = useState<ShiftSalesSummary>({
    cashSales: 100,
    pixSales: 245.6,
    cardSales: 55,
    bookletSales: 250,
    salesCount: 6,
  });

  // Live Dashboard Sales & Best Selling State
  const [recordedSales, setRecordedSales] = useState<DashboardSale[]>(
    initialData.sales,
  );
  const [bestSellers, setBestSellers] = useState<BestSellingProduct[]>(
    initialData.bestSellingProducts,
  );

  useEffect(() => {
    if (!isSwitchOperatorOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSwitchOperatorOpen(false);
        setOperatorPassword("");
        setOperatorSwitchError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSwitchOperatorOpen]);

  const posCatalog = useMemo<PosProduct[]>(
    () =>
      products.map((p) => ({
        id: p.id,
        code: p.code,
        barcode: p.barcode,
        name: p.description,
        category: p.category,
        unit: p.unit,
        unitCost: p.unitCost,
        unitPrice: p.salePrice,
        stockQuantity: p.currentStock,
        active: p.active !== false,
      })),
    [products],
  );

  const dashboardData = useMemo<MarketDashboardData>(() => {
    if (recordedSales.length === initialData.sales.length) {
      return initialData;
    }

    const totalRevenue = Number(
      recordedSales.reduce((s, sale) => s + sale.total, 0).toFixed(2),
    );
    const totalItemsSold = recordedSales.reduce(
      (s, sale) => s + sale.itemCount,
      0,
    );
    const estimatedProfit = Number((totalRevenue * 0.28).toFixed(2));
    const avgMargin =
      totalRevenue > 0
        ? Number(((estimatedProfit / totalRevenue) * 100).toFixed(1))
        : 0;
    const avgItems =
      recordedSales.length > 0
        ? Number((totalItemsSold / recordedSales.length).toFixed(1))
        : 0;

    const bookletRev = Number(shiftSales.bookletSales.toFixed(2));
    const bookletPct =
      totalRevenue > 0 ? Math.round((bookletRev / totalRevenue) * 100) : 0;

    const pct = (val: number) =>
      totalRevenue > 0 ? Math.round((val / totalRevenue) * 100) : 0;

    return {
      metrics: {
        revenue: totalRevenue,
        grossProfit: estimatedProfit,
        averageProfitMargin: avgMargin,
        itemsSold: totalItemsSold,
        averageItemsPerSale: avgItems,
        salesCount: recordedSales.length,
        bookletRevenue: bookletRev,
        bookletRevenuePercentage: bookletPct,
      },
      paymentMethods: [
        {
          id: "pix",
          name: "Pix Instantâneo",
          amount: shiftSales.pixSales,
          percentage: pct(shiftSales.pixSales),
        },
        {
          id: "credit-card",
          name: "Cartão de Crédito",
          amount: shiftSales.cardSales,
          percentage: pct(shiftSales.cardSales),
        },
        {
          id: "debit-card",
          name: "Cartão de Débito",
          amount: 0,
          percentage: 0,
        },
        {
          id: "cash",
          name: "Dinheiro",
          amount: shiftSales.cashSales,
          percentage: pct(shiftSales.cashSales),
        },
        {
          id: "booklet",
          name: "Caderneta",
          amount: shiftSales.bookletSales,
          percentage: pct(shiftSales.bookletSales),
        },
      ],
      bestSellingProducts: bestSellers,
      sales: recordedSales,
      totalSales: recordedSales.length,
    };
  }, [bestSellers, initialData, recordedSales, shiftSales]);

  const handleOpenSwitchOperator = () => {
    setSelectedOperatorId(currentOperator.id);
    setOperatorPassword("");
    setOperatorSwitchError(null);
    setIsSwitchOperatorOpen(true);
  };

  const handleCloseSwitchOperator = () => {
    setIsSwitchOperatorOpen(false);
    setOperatorPassword("");
    setOperatorSwitchError(null);
  };

  const handleConfirmSwitchOperator = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetOperator = operators.find((op) => op.id === selectedOperatorId);
    if (!targetOperator) return;

    if (!operatorPassword.trim()) {
      setOperatorSwitchError("Digite a senha para confirmar a troca.");
      return;
    }

    setCurrentOperator(targetOperator);
    handleCloseSwitchOperator();
  };

  const handleSaveProduct = (product: InventoryProduct, isEdit: boolean) => {
    setProducts((curr) =>
      isEdit
        ? curr.map((item) => (item.id === product.id ? product : item))
        : [product, ...curr],
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((curr) => curr.filter((item) => item.id !== productId));
  };

  const handleSaveSupplier = (supplier: InventorySupplier, isEdit: boolean) => {
    setSuppliers((curr) =>
      isEdit
        ? curr.map((item) => (item.id === supplier.id ? supplier : item))
        : [...curr, supplier],
    );
    if (isEdit) {
      setProducts((curr) =>
        curr.map((p) =>
          p.supplierId === supplier.id
            ? { ...p, supplierName: supplier.name }
            : p,
        ),
      );
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((curr) => curr.filter((item) => item.id !== supplierId));
  };

  const handleSaveCustomer = (customer: BookletCustomer) => {
    setCustomers((curr) => {
      const exists = curr.some((c) => c.id === customer.id);
      return exists
        ? curr.map((c) => (c.id === customer.id ? customer : c))
        : [customer, ...curr];
    });
  };

  const handleReceiveBookletPayment = (
    customerId: string,
    amount: number,
    method: BookletPaymentMethod,
  ) => {
    setCustomers((curr) =>
      curr.map((c) => {
        if (c.id !== customerId) return c;
        const nextBalance = Math.max(
          0,
          Number((c.balance - amount).toFixed(2)),
        );
        return {
          ...c,
          balance: nextBalance,
          entries: [
            {
              id: `entry-${Date.now()}`,
              type: "payment",
              description: `Pagamento recebido no balcão via ${method.toUpperCase()}`,
              dateTime: new Date().toLocaleString("pt-BR"),
              operatorName: currentOperator.name,
              amount,
              balanceAfter: nextBalance,
              paymentMethod: method,
            },
            ...c.entries,
          ],
        };
      }),
    );
  };

  const handleFinishPdvSale = (payload: {
    items: { product: PosProduct; quantity: number; discount: number }[];
    payments: PosPaymentLaunch[];
    total: number;
    isNonFiscal: boolean;
    completedSale: PosCompletedSale;
  }) => {
    setProducts((curr) =>
      curr.map((prod) => {
        const soldItem = payload.items.find((i) => i.product.id === prod.id);
        if (!soldItem) return prod;
        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - soldItem.quantity),
        };
      }),
    );

    let cashAdd = 0;
    let pixAdd = 0;
    let cardAdd = 0;
    let bookletAdd = 0;

    for (const p of payload.payments) {
      if (p.method === "cash") cashAdd += p.amount;
      else if (p.method === "pix") pixAdd += p.amount;
      else if (p.method === "credit" || p.method === "debit")
        cardAdd += p.amount;
      else if (p.method === "booklet") bookletAdd += p.amount;

      if (p.method === "booklet" && p.customerId) {
        setCustomers((curr) =>
          curr.map((cust) => {
            if (cust.id !== p.customerId) return cust;
            const nextBal = Number((cust.balance + p.amount).toFixed(2));
            return {
              ...cust,
              balance: nextBal,
              entries: [
                {
                  id: `entry-${Date.now()}`,
                  type: "purchase",
                  description: `Compra PDV ${payload.completedSale.saleCode}`,
                  dateTime: payload.completedSale.dateTime,
                  operatorName: currentOperator.name,
                  amount: p.amount,
                  balanceAfter: nextBal,
                },
                ...cust.entries,
              ],
            };
          }),
        );
      }
    }

    setShiftSales((curr) => ({
      cashSales: Number((curr.cashSales + cashAdd).toFixed(2)),
      pixSales: Number((curr.pixSales + pixAdd).toFixed(2)),
      cardSales: Number((curr.cardSales + cardAdd).toFixed(2)),
      bookletSales: Number((curr.bookletSales + bookletAdd).toFixed(2)),
      salesCount: curr.salesCount + 1,
    }));

    const totalQty = payload.items.reduce((s, i) => s + i.quantity, 0);
    const methodsLabel = payload.payments
      .map((p) => formatPosPaymentMethod(p.method))
      .join(" + ");

    const newDashSale: DashboardSale = {
      id: payload.completedSale.id,
      code: payload.completedSale.saleCode,
      dateTime: payload.completedSale.dateTime,
      operator: `${currentOperator.name} (${storeSettings.terminalName})`,
      itemCount: totalQty,
      paymentMethod: methodsLabel,
      receiptStatus: payload.isNonFiscal ? "Balcão" : "Autorizada",
      total: payload.total,
    };

    setRecordedSales((curr) => [newDashSale, ...curr]);

    setBestSellers((curr) => {
      const map = new Map<string, BestSellingProduct>();
      for (const existing of curr) {
        map.set(existing.id, { ...existing });
      }
      for (const item of payload.items) {
        const rev = Number(
          (item.product.unitPrice * item.quantity - item.discount).toFixed(2),
        );
        const cost =
          (item.product.unitCost ?? item.product.unitPrice * 0.7) *
          item.quantity;
        const profit = Math.max(0, Number((rev - cost).toFixed(2)));
        const currentEntry = map.get(item.product.id);
        if (currentEntry) {
          currentEntry.quantitySold += item.quantity;
          currentEntry.revenue = Number((currentEntry.revenue + rev).toFixed(2));
          currentEntry.estimatedProfit = Number(
            (currentEntry.estimatedProfit + profit).toFixed(2),
          );
        } else {
          map.set(item.product.id, {
            id: item.product.id,
            name: item.product.name,
            category: item.product.category ?? "Mercearia",
            quantitySold: item.quantity,
            revenue: rev,
            estimatedProfit: profit,
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f0f2f5] font-sans text-slate-900">
      {/* Dark Royal Blue Sidebar (Identical to all 39 Figma Screenshots) */}
      <aside className="sticky top-0 flex h-screen w-[212px] shrink-0 flex-col justify-between bg-[#153488] text-white">
        <div>
          {/* Company Logo (/nova-logo.svg) */}
          <div className="flex items-center justify-center px-5 pt-6 pb-5">
            <Image
              src="/nova-logo.svg"
              alt="Nexa ERP"
              width={135}
              height={44}
              priority
              className="h-auto w-[130px] object-contain"
            />
          </div>

          {/* Section Title */}
          <div className="px-5 pt-2 pb-2">
            <span className="text-[12px] font-medium text-blue-200/80">
              Operação
            </span>
          </div>

          {/* Navigation Menu */}
          <nav aria-label="Menu de Operação" className="space-y-0.5">
            {OPERATION_MENU.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveMenu(item.id)}
                  className={`flex h-[40px] w-full items-center gap-3 px-5 text-left text-[13px] transition-colors ${
                    isActive
                      ? "border-r-[3px] border-[#3b82f6] bg-white/10 font-semibold text-white"
                      : "font-normal text-blue-100/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? "text-[#ff8d28]" : "text-blue-200/80"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Settings & Switch Operator */}
        <div className="border-t border-white/15 py-4">
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setActiveMenu("configuracoes")}
              className={`flex h-[38px] w-full items-center gap-3 px-5 text-left text-[12px] transition-colors ${
                activeMenu === "configuracoes"
                  ? "border-r-[3px] border-[#3b82f6] bg-white/10 font-semibold text-white"
                  : "font-normal text-blue-100/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Cog6ToothIcon
                className={`h-4 w-4 ${
                  activeMenu === "configuracoes"
                    ? "text-[#ff8d28]"
                    : "text-blue-200/80"
                }`}
              />
              <span>Configurações</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSwitchOperator}
              className="flex h-[38px] w-full items-center gap-3 px-5 text-left text-[12px] font-normal text-blue-100/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4 text-blue-200/80" />
              <span>Trocar operador</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Right Column: Top Header Bar + Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top White Header Bar (Identical to Figma) */}
        <header className="flex h-[66px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          {/* Global Search Input */}
          <div className="relative w-full max-w-[390px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Buscar produtos, clientes, vendas..."
              aria-label="Busca global"
              className="h-[36px] w-full rounded-[8px] border border-slate-200 bg-white pl-10 pr-4 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-[#203f9f] focus:outline-none"
            />
          </div>

          {/* Right Status, Notifications & Profile */}
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#00a86b]/30 bg-[#e6f9f1] px-3 py-1 text-[10px] font-bold text-[#008f58] sm:inline-flex">
              <WifiIcon className="h-3.5 w-3.5" />
              <span>PDV Online</span>
            </span>

            <button
              type="button"
              aria-label="Notificações"
              className="relative rounded-full p-1 text-slate-700 hover:bg-slate-100"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ffcc00] text-[9px] font-bold text-slate-900">
                3
              </span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-[12px] font-bold leading-tight text-slate-900">
                  Amabily Restaurante
                </p>
                <p className="text-[10px] text-slate-400">carlos@gmail.com</p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5b192c] text-[9px] font-bold text-amber-300">
                Amabily
              </div>
              <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 p-5 lg:p-6">
          {activeMenu === "pdv" ? (
            <PdvScreen
              operatorName={currentOperator.name}
              terminalName={storeSettings.terminalName}
              isCashierOpen={isCashierOpen}
              catalog={posCatalog}
              bookletCustomers={customers}
              storeSettings={storeSettings}
              onRequestOpenCashier={() => setActiveMenu("caixa")}
              onRequestCloseCashier={() => setActiveMenu("caixa")}
              onFinishSale={handleFinishPdvSale}
            />
          ) : activeMenu === "caixa" ? (
            <CashierScreen
              operatorName={`${currentOperator.name} (${formatOperatorRoleLabel(currentOperator.role)})`}
              initialIsOpen={isCashierOpen}
              initialFundAmount={100}
              shiftSales={shiftSales}
              initialClosings={FIGMA_DEFAULT_CLOSINGS}
              onShiftStatusChange={setIsCashierOpen}
            />
          ) : activeMenu === "estoque" ? (
            <InventoryScreen
              products={products}
              suppliers={suppliers}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onSaveSupplier={handleSaveSupplier}
            />
          ) : activeMenu === "fornecedores" ? (
            <SuppliersScreen
              suppliers={suppliers}
              products={products}
              onSaveSupplier={handleSaveSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          ) : activeMenu === "caderneta" ? (
            <BookletScreen
              operatorName={currentOperator.name}
              companyName={storeSettings.nomeFantasia}
              customers={customers}
              onSaveCustomer={handleSaveCustomer}
              onReceivePayment={handleReceiveBookletPayment}
            />
          ) : activeMenu === "configuracoes" ? (
            <SettingsScreen
              settings={storeSettings}
              operators={operators}
              onSaveSettings={setStoreSettings}
              onSaveOperator={(op, isEdit) => {
                setOperators((curr) =>
                  isEdit
                    ? curr.map((item) => (item.id === op.id ? op : item))
                    : [...curr, op],
                );
                if (currentOperator.id === op.id) {
                  setCurrentOperator(op);
                }
              }}
              onDeleteOperator={(opId) => {
                setOperators((curr) => curr.filter((item) => item.id !== opId));
              }}
            />
          ) : (
            /* Início Dashboard (Identical to Screenshot 105542.png) */
            <div className="mx-auto max-w-[1280px] space-y-4">
              {/* Sub-header & Period Filter */}
              <div className="-mx-5 -mt-5 mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 lg:-mx-6 lg:-mt-6">
                <div>
                  <h1 className="text-[20px] font-bold tracking-tight text-[#203f9f]">
                    Painel de Desempenho e Relatórios Financeiros
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    Análise em tempo real de faturamento, margem de lucro
                    líquido, curva ABC e formas de recebimento
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Filtro de período"
                  className="inline-flex items-center gap-1 rounded-[8px] border border-slate-200 bg-white p-1"
                >
                  {PERIOD_FILTERS.map((period) => {
                    const isSelected = selectedPeriod === period.id;

                    return (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => setSelectedPeriod(period.id)}
                        className={`h-[26px] rounded-[6px] px-3 text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? "bg-[#0066ff] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {period.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Solid Colored Metric Cards (Screenshot 105542.png) */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <article className="flex min-h-[118px] flex-col justify-between rounded-[12px] bg-[#ff8d28] p-5 text-white shadow-xs">
                  <h2 className="text-[12px] font-medium text-white/95">
                    Faturamento Atual
                  </h2>
                  <p className="my-1 text-[26px] font-bold leading-none">
                    {formatCurrency(dashboardData.metrics.revenue)}
                  </p>
                  <p className="text-[11px] text-white/85">
                    {dashboardData.metrics.salesCount} vendas no período
                  </p>
                </article>

                <article className="flex min-h-[118px] flex-col justify-between rounded-[12px] bg-[#28c76f] p-5 text-white shadow-xs">
                  <h2 className="text-[12px] font-medium text-white/95">
                    Lucro Bruto
                  </h2>
                  <p className="my-1 text-[26px] font-bold leading-none">
                    {formatCurrency(dashboardData.metrics.grossProfit)}
                  </p>
                  <p className="text-[11px] text-white/85">
                    Margem Média: {dashboardData.metrics.averageProfitMargin}%
                  </p>
                </article>

                <article className="flex min-h-[118px] flex-col justify-between rounded-[12px] bg-[#6155f5] p-5 text-white shadow-xs">
                  <h2 className="text-[12px] font-medium text-white/95">
                    Total de Itens Vendidos
                  </h2>
                  <p className="my-1 text-[26px] font-bold leading-none">
                    {dashboardData.metrics.itemsSold}
                  </p>
                  <p className="text-[11px] text-white/85">
                    Média de {dashboardData.metrics.averageItemsPerSale} por
                    venda
                  </p>
                </article>

                <article className="flex min-h-[118px] flex-col justify-between rounded-[12px] bg-[#0088ff] p-5 text-white shadow-xs">
                  <h2 className="text-[12px] font-medium text-white/95">
                    Vendas na Caderneta
                  </h2>
                  <p className="my-1 text-[26px] font-bold leading-none">
                    {formatCurrency(dashboardData.metrics.bookletRevenue)}
                  </p>
                  <p className="text-[11px] text-white/85">
                    {dashboardData.metrics.bookletRevenuePercentage.toFixed(1)}%
                    do faturamento
                  </p>
                </article>
              </section>

              {/* Middle Panels: Payment Methods & ABC Curve */}
              <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Left Panel: Recebimento por Meio de Pagamento */}
                <div className="rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-5">
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-[#0088ff]" />
                    <h2 className="text-[13px] font-bold text-slate-800">
                      Recebimento por Meio de Pagamento
                    </h2>
                  </div>

                  <div className="mt-4 space-y-3.5">
                    {dashboardData.paymentMethods.map((method) => {
                      const barColor = getPaymentBarColor(method.id);
                      const clampedPct = Math.min(
                        100,
                        Math.max(0, method.percentage),
                      );

                      return (
                        <div key={method.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-semibold text-slate-800">
                              {method.name}
                            </span>

                            <span
                              className="font-bold"
                              style={{ color: barColor }}
                            >
                              {formatCurrency(method.amount)} (
                              {method.percentage}%)
                            </span>
                          </div>

                          <div className="h-[6px] w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${clampedPct}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel: Produtos Mais Vendidos (Curva ABC) */}
                <div className="flex flex-col rounded-[10px] border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ChartBarSquareIcon className="h-4 w-4 text-[#0088ff]" />
                      <h2 className="text-[13px] font-bold text-slate-800">
                        Produtos Mais Vendidos (Curva ABC)
                      </h2>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400">
                      Classificação por receita
                    </span>
                  </div>

                  <div className="mt-3.5 flex-1 overflow-x-auto">
                    <table className="w-full min-w-[480px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-[#f8fafc] text-[11px] font-semibold text-slate-600">
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2">Categoria</th>
                          <th className="px-3 py-2">Qtd Vendida</th>
                          <th className="px-3 py-2">Faturamento</th>
                          <th className="px-3 py-2 text-right">
                            Lucro Estimado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {dashboardData.bestSellingProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="px-3 py-2.5 font-semibold text-slate-800">
                              {product.name}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500">
                              {product.category}
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              {product.quantitySold} un
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-800">
                              {formatCurrency(product.revenue)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-[#0f766e]">
                              {formatCurrency(product.estimatedProfit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Bottom Section: Histórico Detalhado de Vendas */}
              <section className="overflow-hidden rounded-[10px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                  <h2 className="text-[14px] font-bold text-slate-800">
                    Histórico Detalhado de Vendas
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#f8fafc] text-[11px] font-semibold text-slate-600">
                        <th className="px-5 py-2.5">Código</th>
                        <th className="px-4 py-2.5">Data/Hora</th>
                        <th className="px-4 py-2.5">Operador</th>
                        <th className="px-4 py-2.5">Itens</th>
                        <th className="px-4 py-2.5">Pagamento</th>
                        <th className="px-4 py-2.5">NFC-E Sefaz</th>
                        <th className="px-5 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {dashboardData.sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 font-bold text-[#2563eb]">
                            {sale.code}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {sale.dateTime}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {sale.operator}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {sale.itemCount} produto(s)
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {sale.paymentMethod}
                          </td>
                          <td className="px-4 py-3 font-bold text-[#008f58]">
                            {sale.receiptStatus}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-slate-800">
                            {formatCurrency(sale.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
                  <span>
                    0 de {dashboardData.sales.length} linha(s) selecionadas
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="h-7 rounded-[4px] border border-slate-200 bg-slate-50 px-3 text-[11px] font-medium text-slate-400"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="h-7 rounded-[4px] border border-slate-200 bg-slate-100 px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Trocar Operador */}
      {isSwitchOperatorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
          onClick={handleCloseSwitchOperator}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={switchDialogTitleId}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[333px] rounded-[14px] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 shrink-0 text-[#0088ff]" />
                <h2
                  id={switchDialogTitleId}
                  className="text-[18px] font-bold leading-tight text-slate-900"
                >
                  Trocar Operador
                </h2>
              </div>

              <button
                type="button"
                aria-label="Fechar"
                onClick={handleCloseSwitchOperator}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-1 text-[11px] text-slate-400">
              Selecione o operador e digite a senha para continuar.
            </p>

            <form
              onSubmit={handleConfirmSwitchOperator}
              className="mt-4 space-y-4"
            >
              <div>
                <span className="block text-[12px] font-semibold text-slate-800">
                  Operador
                </span>

                <div className="mt-1.5 space-y-2">
                  {operators.map((operator) => {
                    const isSelected = selectedOperatorId === operator.id;

                    return (
                      <button
                        key={operator.id}
                        type="button"
                        onClick={() => {
                          setSelectedOperatorId(operator.id);
                          setOperatorSwitchError(null);
                        }}
                        className={`flex h-[34px] w-full items-center justify-between rounded-[8px] border px-3 text-left text-[12px] font-semibold transition-colors ${
                          isSelected
                            ? "border-[#0088ff] bg-[#eff6ff] text-[#203f9f]"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>
                          {operator.name} -{" "}
                          {formatOperatorRoleLabel(operator.role)}
                        </span>
                        {currentOperator.id === operator.id && (
                          <span className="text-[10px] font-bold text-[#203f9f]">
                            Atual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="operator-switch-password"
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800"
                >
                  <LockClosedIcon className="h-3.5 w-3.5 text-slate-600" />
                  <span>Senha</span>
                </label>

                <input
                  id="operator-switch-password"
                  type="password"
                  value={operatorPassword}
                  onChange={(event) => {
                    setOperatorPassword(event.target.value);
                    if (operatorSwitchError) setOperatorSwitchError(null);
                  }}
                  placeholder="Digite a senha (ex: 123)"
                  className="mt-1.5 h-[36px] w-full rounded-[8px] border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0088ff] focus:outline-none"
                />

                {operatorSwitchError && (
                  <p className="mt-1.5 text-[11px] font-medium text-rose-600">
                    {operatorSwitchError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="h-[36px] w-full rounded-[8px] bg-[#008f58] text-[13px] font-semibold text-white transition-colors hover:bg-[#007a4b]"
              >
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
