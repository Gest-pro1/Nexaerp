export type DashboardPeriod = "today" | "7days" | "30days" | "all";

export type PaymentMethodId =
  | "pix"
  | "credit-card"
  | "debit-card"
  | "cash"
  | "booklet";

export interface DashboardMetrics {
  revenue: number;
  grossProfit: number;
  averageProfitMargin: number;
  itemsSold: number;
  averageItemsPerSale: number;
  salesCount: number;
  bookletRevenue: number;
  bookletRevenuePercentage: number;
}

export interface PaymentMethodSummary {
  id: PaymentMethodId;
  name: string;
  amount: number;
  percentage: number;
}

export interface BestSellingProduct {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  estimatedProfit: number;
}

export interface DashboardSale {
  id: string;
  code: string;
  dateTime: string;
  operator: string;
  itemCount: number;
  paymentMethod: string;
  receiptStatus: string;
  total: number;
}

export interface MarketDashboardData {
  metrics: DashboardMetrics;
  paymentMethods: PaymentMethodSummary[];
  bestSellingProducts: BestSellingProduct[];
  sales: DashboardSale[];
  totalSales: number;
}

export const EMPTY_MARKET_DASHBOARD: MarketDashboardData = {
  metrics: {
    revenue: 0,
    grossProfit: 0,
    averageProfitMargin: 0,
    itemsSold: 0,
    averageItemsPerSale: 0,
    salesCount: 0,
    bookletRevenue: 0,
    bookletRevenuePercentage: 0,
  },
  paymentMethods: [
    { id: "pix", name: "Pix instantâneo", amount: 0, percentage: 0 },
    { id: "credit-card", name: "Cartão de Crédito", amount: 0, percentage: 0 },
    { id: "debit-card", name: "Cartão de Débito", amount: 0, percentage: 0 },
    { id: "cash", name: "Dinheiro", amount: 0, percentage: 0 },
    { id: "booklet", name: "Caderneta", amount: 0, percentage: 0 },
  ],
  bestSellingProducts: [],
  sales: [],
  totalSales: 0,
};
