import { ReceiptItem, PaymentRow } from '@/types/receipt';

export function calcSubtotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calcVat(subtotal: number, vatRate: number): number {
  return (subtotal * vatRate) / 100;
}

export function calcTotal(subtotal: number, vatAmount: number): number {
  return subtotal + vatAmount;
}

export function calcPaymentTotal(payments: PaymentRow[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}
