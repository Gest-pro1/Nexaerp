export type InventoryUnit = "UN" | "KG" | "PCT" | "CX" | "L" | "FD";

export interface InventorySupplier {
  id: string;
  name: string;
  document: string;
  representative: string;
  contact: string;
  email: string;
  notes: string;
}

export interface InventoryProduct {
  id: string;
  barcode: string;
  description: string;
  category: string;
  unit: InventoryUnit;
  unitCost: number;
  suggestedMargin: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  expirationDate: string;
  supplierId?: string;
  supplierName: string;
}

export interface InventoryMetrics {
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export const INVENTORY_CATEGORIES: string[] = [
  "Mercearia",
  "Bebidas",
  "Laticínios & Frios",
  "Limpeza",
  "Padaria & Doces",
  "Hortifruti",
  "Carnes & Açougue",
  "Higiene & Perfumaria",
];

export const INVENTORY_UNITS: { value: InventoryUnit; label: string }[] = [
  { value: "UN", label: "UN - Unidade" },
  { value: "KG", label: "KG - Quilograma" },
  { value: "PCT", label: "PCT - Pacote" },
  { value: "CX", label: "CX - Caixa" },
  { value: "L", label: "L - Litro" },
  { value: "FD", label: "FD - Fardo" },
];

export const EMPTY_INVENTORY_PRODUCTS: InventoryProduct[] = [];
export const EMPTY_INVENTORY_SUPPLIERS: InventorySupplier[] = [];

export function generateEan13(): string {
  const prefix = "789";
  let body = prefix;
  for (let i = 0; i < 9; i += 1) {
    body += Math.floor(Math.random() * 10).toString();
  }

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const digit = Number(body[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${body}${checkDigit}`;
}

export function calculateSalePrice(unitCost: number, suggestedMargin: number): number {
  if (!Number.isFinite(unitCost) || unitCost <= 0) return 0;
  const margin = Number.isFinite(suggestedMargin) ? suggestedMargin : 0;
  return Number((unitCost * (1 + margin / 100)).toFixed(2));
}

export function parseExpirationDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]) - 1;
    const year = Number(brMatch[3]);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  return null;
}

export function formatExpirationDate(value: string): string {
  const parsed = parseExpirationDate(value);
  if (!parsed) return value.trim() || "—";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getExpirationStatus(
  expirationDate: string,
  referenceDate: Date = new Date(),
): {
  status: "none" | "ok" | "expiring-soon" | "expired";
  daysRemaining: number | null;
  label: string | null;
  formattedDate: string;
} {
  const parsed = parseExpirationDate(expirationDate);
  if (!parsed) {
    return {
      status: "none",
      daysRemaining: null,
      label: null,
      formattedDate: expirationDate.trim() || "—",
    };
  }

  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const targetStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );

  const diffMs = targetStart.getTime() - refStart.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const formattedDate = formatExpirationDate(expirationDate);

  if (daysRemaining < 0) {
    return {
      status: "expired",
      daysRemaining,
      label: "Vencido !",
      formattedDate,
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: "expiring-soon",
      daysRemaining,
      label: `Vence em ${daysRemaining}d`,
      formattedDate,
    };
  }

  return {
    status: "ok",
    daysRemaining,
    label: null,
    formattedDate,
  };
}

export function isLowStock(product: Pick<InventoryProduct, "currentStock" | "minStock">): boolean {
  return product.minStock > 0 && product.currentStock < product.minStock;
}

export function computeInventoryMetrics(
  products: InventoryProduct[],
  referenceDate: Date = new Date(),
): InventoryMetrics {
  let lowStockCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;

  for (const product of products) {
    if (isLowStock(product)) {
      lowStockCount += 1;
    }
    const exp = getExpirationStatus(product.expirationDate, referenceDate);
    if (exp.status === "expiring-soon") {
      expiringSoonCount += 1;
    } else if (exp.status === "expired") {
      expiredCount += 1;
    }
  }

  return {
    totalItems: products.length,
    lowStockCount,
    expiringSoonCount,
    expiredCount,
  };
}
