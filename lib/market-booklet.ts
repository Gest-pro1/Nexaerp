export type BookletPaymentMethod = "pix" | "cash" | "debit";

export type BookletEntryType = "purchase" | "payment";

export interface BookletEntry {
  id: string;
  type: BookletEntryType;
  description: string;
  dateTime: string;
  operatorName: string;
  amount: number;
  balanceAfter: number;
  paymentMethod?: BookletPaymentMethod;
}

export interface BookletCustomer {
  id: string;
  code: string;
  name: string;
  phone: string;
  cpf: string;
  rg: string;
  creditLimit: number;
  balance: number;
  dueDay: string;
  notes: string;
  createdAt: string;
  entries: BookletEntry[];
}

export interface BookletMetrics {
  totalReceivable: number;
  totalCreditLimit: number;
  commitmentRate: number;
  totalCustomers: number;
  activeDebtCount: number;
  upToDateCount: number;
}

export const BOOKLET_DUE_OPTIONS: string[] = [
  "Todo dia 05",
  "Todo dia 10",
  "Todo dia 15",
  "Todo dia 20",
  "Todo dia 25",
  "Todo dia 30",
  "Semanal",
  "Quinzenal",
];

export const EMPTY_BOOKLET_CUSTOMERS: BookletCustomer[] = [];

export function calculateLimitUtilization(balance: number, creditLimit: number): number {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  if (!Number.isFinite(creditLimit) || creditLimit <= 0) return 100;
  return Math.round((balance / creditLimit) * 100);
}

export function computeBookletMetrics(customers: BookletCustomer[]): BookletMetrics {
  let totalReceivable = 0;
  let totalCreditLimit = 0;
  let activeDebtCount = 0;
  let upToDateCount = 0;

  for (const customer of customers) {
    const balance = Number.isFinite(customer.balance) && customer.balance > 0 ? customer.balance : 0;
    const limit =
      Number.isFinite(customer.creditLimit) && customer.creditLimit > 0 ? customer.creditLimit : 0;

    totalReceivable += balance;
    totalCreditLimit += limit;

    if (balance > 0) {
      activeDebtCount += 1;
    } else {
      upToDateCount += 1;
    }
  }

  const commitmentRate =
    totalCreditLimit > 0 ? Math.round((totalReceivable / totalCreditLimit) * 100) : 0;

  return {
    totalReceivable: Number(totalReceivable.toFixed(2)),
    totalCreditLimit: Number(totalCreditLimit.toFixed(2)),
    commitmentRate,
    totalCustomers: customers.length,
    activeDebtCount,
    upToDateCount,
  };
}

export function extractDueDayLabel(dueDay: string): string {
  const match = /(\d{1,2})/.exec(dueDay);
  if (match) {
    return match[1].padStart(2, "0");
  }
  return dueDay.trim() || "05";
}

export function formatBookletPaymentMethod(method: BookletPaymentMethod): string {
  switch (method) {
    case "pix":
      return "PIX";
    case "cash":
      return "Dinheiro";
    case "debit":
      return "Débito";
  }
}
