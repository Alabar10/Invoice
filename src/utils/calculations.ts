import { ReceiptItem, PaymentRow } from '@/types/receipt';

export function calcSubtotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calcDiscount(subtotal: number, discountPct: number): number {
  return (subtotal * discountPct) / 100;
}

export function calcVat(base: number, vatRate: number): number {
  return (base * vatRate) / 100;
}

export function calcTotal(base: number, vatAmount: number): number {
  return base + vatAmount;
}

export function calcPaymentTotal(payments: PaymentRow[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}
