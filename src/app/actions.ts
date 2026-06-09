'use server';

import { prisma } from '@/lib/prisma';
import { ReceiptData } from '@/types/receipt';
import {
  calcSubtotal,
  calcDiscount,
  calcVat,
} from '@/utils/calculations';
import { revalidatePath } from 'next/cache';

/** Compute the headline totals we store as indexed columns. */
function computeTotals(data: ReceiptData) {
  const subtotal = calcSubtotal(data.items);
  const afterDiscount = subtotal - calcDiscount(subtotal, data.discount);
  const vatAmount = data.includeVat ? calcVat(afterDiscount, data.vatRate) : 0;
  const total = afterDiscount + vatAmount;
  return { subtotal, vatAmount, total };
}

export interface ReceiptSummary {
  id: string;
  documentType: string;
  documentNumber: string;
  date: string;
  customerName: string;
  total: number;
  createdAt: string;
}

/** Create or update a receipt. Returns its id. */
export async function saveReceipt(
  data: ReceiptData,
  id?: string
): Promise<string> {
  const { subtotal, vatAmount, total } = computeTotals(data);
  const fields = {
    documentType: data.documentType,
    documentNumber: data.documentNumber,
    date: data.date,
    time: data.time,
    customerName: data.customerName,
    subtotal,
    vatAmount,
    total,
    // Stored as JSON so the full editable document round-trips intact.
    data: data as unknown as object,
  };

  const saved = id
    ? await prisma.receipt.update({ where: { id }, data: fields })
    : await prisma.receipt.create({ data: fields });

  revalidatePath('/dashboard');
  return saved.id;
}

/** All receipts, newest first, as lightweight summaries for the dashboard. */
export async function listReceipts(): Promise<ReceiptSummary[]> {
  const rows = await prisma.receipt.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      documentType: true,
      documentNumber: true,
      date: true,
      customerName: true,
      total: true,
      createdAt: true,
    },
  });
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/** Full receipt data for re-opening in the editor. */
export async function getReceipt(id: string): Promise<ReceiptData | null> {
  const row = await prisma.receipt.findUnique({ where: { id } });
  return row ? (row.data as unknown as ReceiptData) : null;
}

export async function deleteReceipt(id: string): Promise<void> {
  await prisma.receipt.delete({ where: { id } });
  revalidatePath('/dashboard');
}

/** Aggregate stats for the dashboard header. */
export async function getStats() {
  const all = await prisma.receipt.findMany({
    select: { total: true, createdAt: true },
  });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = all.length;
  const revenue = all.reduce((s, r) => s + r.total, 0);
  const monthRows = all.filter((r) => r.createdAt >= monthStart);
  const monthCount = monthRows.length;
  const monthRevenue = monthRows.reduce((s, r) => s + r.total, 0);

  return { count, revenue, monthCount, monthRevenue };
}
