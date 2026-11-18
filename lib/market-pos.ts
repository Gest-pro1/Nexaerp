export type PosPaymentMethod = "cash" | "pix" | "credit" | "debit" | "booklet";

export interface PosProduct {
  id: string;
  code?: string;
  barcode: string;
  name: string;
  category?: string;
  unit?: string;
  unitCost?: number;
  unitPrice: number;
  stockQuantity: number;
  active?: boolean;
}

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
  discount: number;
}

export interface PosPaymentLaunch {
  id: string;
  method: PosPaymentMethod;
  amount: number;
  installments?: number;
  receivedAmount?: number;
  changeAmount?: number;
  customerId?: string;
  customerName?: string;
}

export interface PosCompletedSale {
  id: string;
  saleCode: string;
  dateTime: string;
  operatorName: string;
  terminalName: string;
  isNonFiscal: boolean;
  items: PosCartItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  payments: PosPaymentLaunch[];
  protocolNumber: string;
}

export const EMPTY_POS_CART: PosCartItem[] = [];

export const POS_PAYMENT_LABELS: Record<PosPaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  booklet: "Caderneta",
};

export function formatPosPaymentMethod(method: PosPaymentMethod): string {
  return POS_PAYMENT_LABELS[method] ?? method;
}
