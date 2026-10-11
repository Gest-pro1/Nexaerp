export type PosPaymentMethod = "cash" | "pix" | "credit" | "debit";

export interface PosProduct {
  id: string;
  barcode: string;
  name: string;
  unitPrice: number;
  stockQuantity: number;
}

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
  discount: number;
}

export const EMPTY_POS_CART: PosCartItem[] = [];
