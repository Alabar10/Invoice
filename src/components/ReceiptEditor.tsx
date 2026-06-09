'use client';
import { forwardRef, useRef, ChangeEvent } from 'react';
import { ReceiptData, ReceiptItem, PaymentRow } from '@/types/receipt';
import { calcSubtotal, calcVat, calcTotal, calcPaymentTotal } from '@/utils/calculations';

interface Props {
  data: ReceiptData;
  onChange: (data: ReceiptData) => void;
}

function Field({
  value,
  onChange,
  placeholder,
  className = '',
  type = 'text',
  min,
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none focus:bg-blue-50/40 rounded-sm transition-colors no-export-border ${className}`}
    />
  );
}

const TEAL = '#2a9d8f';

const ReceiptEditor = forwardRef<HTMLDivElement, Props>(({ data, onChange }, ref) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const up = (field: keyof ReceiptData, value: unknown) =>
    onChange({ ...data, [field]: value });

  const addItem = () =>
    up('items', [
      ...data.items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 },
    ]);

  const removeItem = (id: string) =>
    up('items', data.items.filter((i) => i.id !== id));

  const updateItem = (id: string, field: keyof ReceiptItem, raw: string) => {
    const value = field === 'description' ? raw : parseFloat(raw) || 0;
    up(
      'items',
      data.items.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const addPayment = () =>
    up('payments', [
      ...data.payments,
      { id: Date.now().toString(), method: 'העברה בנקאית', details: '', date: data.date, amount: 0 },
    ]);

  const removePayment = (id: string) =>
    up('payments', data.payments.filter((p) => p.id !== id));

  const updatePayment = (id: string, field: keyof PaymentRow, raw: string) => {
    const value = field === 'amount' ? parseFloat(raw) || 0 : raw;
    up(
      'payments',
      data.payments.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => up('logoUrl', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const subtotal = calcSubtotal(data.items);
  const vatAmount = data.includeVat ? calcVat(subtotal, data.vatRate) : 0;
  const total = calcTotal(subtotal, vatAmount);
  const paymentTotal = calcPaymentTotal(data.payments);

  const fmt = (n: number) =>
    '₪' + n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const th = 'py-2 px-3 text-sm font-semibold border border-gray-300 bg-gray-100 text-right';
  const td = 'py-1.5 px-2 border border-gray-200 text-sm';

  return (
    <div
      ref={ref}
      dir="rtl"
      className="bg-white border border-gray-300 p-4 sm:p-8 mx-auto"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif', maxWidth: '780px' }}
    >
      {/* ── HEADER: Business | Logo | Customer ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b-2 border-gray-200 mb-5">

        {/* Business (right) */}
        <div>
          <Field
            value={data.businessName}
            onChange={(v) => up('businessName', v)}
            placeholder="שם העסק"
            className="font-bold text-base w-full"
          />
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 flex-wrap">
            <span>עוסק מורשה (ח.פ):</span>
            <Field
              value={data.businessTaxId}
              onChange={(v) => up('businessTaxId', v)}
              placeholder="000000000"
              className="text-xs w-24"
            />
          </div>
          <Field
            value={data.businessAddress}
            onChange={(v) => up('businessAddress', v)}
            placeholder="כתובת"
            className="text-xs text-gray-600 w-full mt-1"
          />
          <Field
            value={data.businessPhone}
            onChange={(v) => up('businessPhone', v)}
            placeholder="טלפון"
            className="text-xs text-gray-600 w-full mt-0.5"
          />
        </div>

        {/* Logo (center) */}
        <div className="flex items-center justify-center order-first sm:order-0">
          <button
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors w-full max-w-[150px] h-20 flex items-center justify-center overflow-hidden no-export-border"
            title="לחץ להוספת לוגו"
          >
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="לוגו" className="max-h-16 max-w-full object-contain" />
            ) : (
              <span className="text-gray-400 text-xs text-center px-2">לחץ להוספת לוגו</span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        {/* Customer (left) */}
        <div>
          <div className="text-xs text-gray-500 mb-0.5">לכבוד:</div>
          <Field
            value={data.customerName}
            onChange={(v) => up('customerName', v)}
            placeholder="שם הלקוח"
            className="font-bold text-base w-full"
          />
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 flex-wrap">
            <span>ח.פ/ת.ז</span>
            <Field
              value={data.customerTaxId}
              onChange={(v) => up('customerTaxId', v)}
              placeholder="000000000"
              className="text-xs w-28"
            />
          </div>
          <Field
            value={data.customerAddress}
            onChange={(v) => up('customerAddress', v)}
            placeholder="כתובת"
            className="text-xs text-gray-600 w-full mt-1"
          />
        </div>
      </div>

      {/* ── DATE ── */}
      <div className="text-right mb-5">
        <input
          type="date"
          value={data.date}
          onChange={(e) => up('date', e.target.value)}
          className="text-sm bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 no-export-border"
        />
      </div>

      {/* ── DOCUMENT TITLE ── */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-2 mb-1">
          <select
            value={data.documentType}
            onChange={(e) => up('documentType', e.target.value)}
            className="text-lg sm:text-2xl font-bold bg-transparent focus:outline-none cursor-pointer no-export-border"
          >
            <option>חשבונית מס / קבלה</option>
            <option>חשבונית מס</option>
            <option>קבלה</option>
          </select>
          <Field
            value={data.documentNumber}
            onChange={(v) => up('documentNumber', v)}
            placeholder="00001"
            className="text-lg sm:text-2xl font-bold w-20 sm:w-24 text-center"
          />
        </div>
        <button
          onClick={() => up('isOriginal', !data.isOriginal)}
          className="text-sm text-gray-500 px-3 py-0.5 rounded border border-gray-300 hover:bg-gray-50 no-export-border"
        >
          {data.isOriginal ? 'מקור' : 'העתק'}
        </button>
      </div>

      {/* ── SECTION NAME ── */}
      <div className="text-right mb-2">
        <Field
          value={data.sectionName}
          onChange={(v) => up('sectionName', v)}
          placeholder="שם קטגוריה / פרויקט (אופציונלי)"
          className="font-bold text-sm"
          // teal color applied inline
        />
        {data.sectionName && (
          <style>{`.section-name { color: ${TEAL}; }`}</style>
        )}
      </div>

      {/* ── ITEMS TABLE ── */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="px-4 sm:px-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th + ' w-auto'}>פירוט</th>
            <th className={th + ' w-16 text-center'}>כמות</th>
            <th className={th + ' w-28'}>מחיר</th>
            <th className={th + ' w-28'}>סה&quot;כ</th>
            <th className="w-6 no-export" />
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td className={td}>
                <Field
                  value={item.description}
                  onChange={(v) => updateItem(item.id, 'description', v)}
                  placeholder="תיאור שירות / מוצר"
                  className="w-full"
                />
              </td>
              <td className={td + ' text-center'}>
                <Field
                  value={item.quantity}
                  onChange={(v) => updateItem(item.id, 'quantity', v)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full text-center"
                />
              </td>
              <td className={td} dir="ltr">
                <Field
                  value={item.unitPrice}
                  onChange={(v) => updateItem(item.id, 'unitPrice', v)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full text-right"
                />
              </td>
              <td className={td + ' text-gray-700'} dir="ltr">
                {fmt(item.quantity * item.unitPrice)}
              </td>
              <td className="no-export pl-1">
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={data.items.length === 1}
                  className="text-gray-300 hover:text-red-400 disabled:opacity-20 text-xs"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </div>

      <div className="text-right mb-1 no-export">
        <button onClick={addItem} className="text-xs text-blue-500 hover:underline">
          + הוסף שורה
        </button>
      </div>

      {/* ── TOTALS ── */}
      <div className="flex justify-start mb-7">
        <table className="border-collapse text-sm" style={{ minWidth: '220px' }}>
          <tbody>
            {data.includeVat && (
              <>
                <tr>
                  <td className="py-1.5 px-3 border border-gray-200 font-semibold text-right">
                    סה&quot;כ
                  </td>
                  <td className="py-1.5 px-3 border border-gray-200 text-left" dir="ltr">
                    {fmt(subtotal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border border-gray-200 text-right">
                    <span>מע&quot;מ </span>
                    <Field
                      value={data.vatRate}
                      onChange={(v) => up('vatRate', parseFloat(v) || 18)}
                      type="number"
                      min="0"
                      className="w-8 text-center inline-block"
                    />
                    <span>%</span>
                  </td>
                  <td className="py-1.5 px-3 border border-gray-200 text-left" dir="ltr">
                    {fmt(vatAmount)}
                  </td>
                </tr>
              </>
            )}
            <tr className="font-bold">
              <td className="py-2 px-3 border border-gray-300 text-right">סה&quot;כ לתשלום</td>
              <td className="py-2 px-3 border border-gray-300 text-left" dir="ltr">
                {fmt(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PAYMENTS SECTION ── */}
      <div className="mb-6">
        <div className="font-bold text-sm mb-2 text-right">פרטי תשלומים</div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="px-4 sm:px-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={th + ' w-36'}>אמצעי תשלום</th>
              <th className={th}>פירוט</th>
              <th className={th + ' w-28 text-center'}>תאריך</th>
              <th className={th + ' w-28'}>סכום</th>
              <th className="w-6 no-export" />
            </tr>
          </thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <select
                    value={p.method}
                    onChange={(e) => updatePayment(p.id, 'method', e.target.value)}
                    className="bg-transparent focus:outline-none w-full text-sm no-export-border"
                  >
                    <option>העברה בנקאית</option>
                    <option>מזומן</option>
                    <option>צ&apos;ק</option>
                    <option>כרטיס אשראי</option>
                    <option>ביט</option>
                    <option>פייבוקס</option>
                  </select>
                </td>
                <td className={td}>
                  <Field
                    value={p.details}
                    onChange={(v) => updatePayment(p.id, 'details', v)}
                    placeholder="פירוט"
                    className="w-full"
                  />
                </td>
                <td className={td + ' text-center'}>
                  <input
                    type="date"
                    value={p.date}
                    onChange={(e) => updatePayment(p.id, 'date', e.target.value)}
                    className="text-xs bg-transparent focus:outline-none w-full no-export-border"
                  />
                </td>
                <td className={td} dir="ltr">
                  <Field
                    value={p.amount}
                    onChange={(v) => updatePayment(p.id, 'amount', v)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full text-right"
                  />
                </td>
                <td className="no-export pl-1">
                  <button
                    onClick={() => removePayment(p.id)}
                    disabled={data.payments.length === 1}
                    className="text-gray-300 hover:text-red-400 disabled:opacity-20 text-xs"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold border-t-2 border-gray-300">
              <td colSpan={3} className="py-2 px-3 text-right">
                סה&quot;כ
              </td>
              <td className="py-2 px-3 text-left" dir="ltr">
                {fmt(paymentTotal)}
              </td>
              <td className="no-export" />
            </tr>
          </tfoot>
        </table>
        </div>
        </div>
        <div className="text-right mt-1 no-export">
          <button onClick={addPayment} className="text-xs text-blue-500 hover:underline">
            + הוסף תשלום
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 text-xs">
        <div className="text-gray-400 text-left">
          {fmtDate(data.date)} | {data.documentType} {data.documentNumber} | עמוד 1 מתוך 1
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-700 text-sm">חתימה דיגיטלית מאובטחת</div>
        </div>
      </div>
    </div>
  );
});

ReceiptEditor.displayName = 'ReceiptEditor';
export default ReceiptEditor;
