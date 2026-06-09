import { calcSubtotal, calcVat, calcTotal, calcPaymentTotal } from '@/utils/calculations';

describe('calcSubtotal', () => {
  it('sums quantity × unitPrice across all items', () => {
    const items = [
      { id: '1', description: 'A', quantity: 2, unitPrice: 100 },
      { id: '2', description: 'B', quantity: 3, unitPrice: 50 },
    ];
    expect(calcSubtotal(items)).toBe(350);
  });

  it('returns 0 for empty items array', () => {
    expect(calcSubtotal([])).toBe(0);
  });

  it('handles fractional quantities', () => {
    const items = [{ id: '1', description: 'X', quantity: 0.5, unitPrice: 200 }];
    expect(calcSubtotal(items)).toBe(100);
  });

  it('handles a single item', () => {
    const items = [{ id: '1', description: 'X', quantity: 1, unitPrice: 25641.03 }];
    expect(calcSubtotal(items)).toBeCloseTo(25641.03);
  });
});

describe('calcVat', () => {
  it('calculates 18% VAT correctly', () => {
    expect(calcVat(100, 18)).toBe(18);
  });

  it('calculates 17% VAT correctly', () => {
    expect(calcVat(30000, 17)).toBeCloseTo(5100);
  });

  it('returns 0 when vatRate is 0', () => {
    expect(calcVat(1000, 0)).toBe(0);
  });

  it('works with fractional subtotals', () => {
    expect(calcVat(25641.03, 17)).toBeCloseTo(4358.975);
  });
});

describe('calcTotal', () => {
  it('adds subtotal and VAT amount', () => {
    expect(calcTotal(260000, 46800)).toBe(306800);
  });

  it('returns subtotal when vatAmount is 0 (no VAT)', () => {
    expect(calcTotal(1000, 0)).toBe(1000);
  });

  it('handles ₪30,000 example from ypay receipt', () => {
    const subtotal = 25641.03;
    const vat = calcVat(subtotal, 17);
    expect(calcTotal(subtotal, vat)).toBeCloseTo(30000, 0);
  });
});

describe('calcPaymentTotal', () => {
  it('sums all payment amounts', () => {
    const payments = [
      { id: '1', method: 'cash', details: '', date: '', amount: 200 },
      { id: '2', method: 'transfer', details: '', date: '', amount: 413 },
    ];
    expect(calcPaymentTotal(payments)).toBe(613);
  });

  it('returns 0 for empty payments', () => {
    expect(calcPaymentTotal([])).toBe(0);
  });

  it('handles a single payment', () => {
    const payments = [{ id: '1', method: 'transfer', details: '', date: '', amount: 30000 }];
    expect(calcPaymentTotal(payments)).toBe(30000);
  });
});
