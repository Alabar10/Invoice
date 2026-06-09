'use client';
import { forwardRef, useRef, ChangeEvent } from 'react';
import { ReceiptData, ReceiptItem, PaymentRow } from '@/types/receipt';
import {
  calcSubtotal,
  calcDiscount,
  calcVat,
  calcPaymentTotal,
} from '@/utils/calculations';

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
      className={`bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none focus:bg-blue-50/30 rounded-sm transition-colors no-export-border ${className}`}
    />
  );
}

const th = 'py-1.5 px-2 text-xs font-bold border border-gray-400 bg-gray-100 text-right';
const td = 'py-1 px-2 border border-gray-300 text-xs';

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
    up('items', data.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
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
    up('payments', data.payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => up('logoUrl', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const subtotal = calcSubtotal(data.items);
  const discountAmt = calcDiscount(subtotal, data.discount);
  const afterDiscount = subtotal - discountAmt;
  const vatAmount = data.includeVat ? calcVat(afterDiscount, data.vatRate) : 0;
  const total = afterDiscount + vatAmount;
  const paymentTotal = calcPaymentTotal(data.payments);

  const fmt = (n: number) =>
    n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (d: string) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y.slice(2)}`;
  };

  const showPayments =
    data.documentType === 'חשבונית מס קבלה' || data.documentType === 'קבלה';

  return (
    <div
      ref={ref}
      dir="rtl"
      className="bg-white border border-gray-300 p-6 mx-auto"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif', maxWidth: '780px', fontSize: '13px' }}
    >

      {/* ── HEADER ── */}
      <div className="border border-gray-600 mb-1 p-3 flex items-start justify-between">
        {/* Right: business name + address */}
        <div className="flex-1 text-right">
          <Field
            value={data.businessName}
            onChange={(v) => up('businessName', v)}
            placeholder="שם העסק"
            className="font-bold text-base w-full"
          />
          <div className="mt-0.5">
            <Field
              value={data.businessAddress}
              onChange={(v) => up('businessAddress', v)}
              placeholder="כתובת העסק"
              className="text-xs text-gray-700 w-full"
            />
          </div>
          <div className="mt-0.5">
            <Field
              value={data.businessPhone}
              onChange={(v) => up('businessPhone', v)}
              placeholder="טלפון"
              className="text-xs text-gray-700 w-full"
            />
          </div>
        </div>

        {/* Center: logo */}
        <div className="mx-6 flex-shrink-0">
          <button
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors w-24 h-14 flex items-center justify-center overflow-hidden no-export-border"
            title="לחץ להוספת לוגו"
          >
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="לוגו" className="max-h-12 max-w-full object-contain" />
            ) : (
              <span className="text-gray-300 text-xs">לוגו</span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        {/* Left: עוסק מורשה + tax ID */}
        <div className="text-left" style={{ minWidth: '160px' }}>
          <div className="font-bold text-sm whitespace-nowrap">
            עוסק מורשה{' '}
            <Field
              value={data.businessTaxId}
              onChange={(v) => up('businessTaxId', v)}
              placeholder="000000000"
              className="font-bold text-sm w-24 text-left"
            />
          </div>
        </div>
      </div>

      {/* ── DOCUMENT TITLE ROW ── */}
      <table className="w-full border-collapse mb-0" style={{ borderTop: 'none' }}>
        <tbody>
          <tr>
            <td className="border-2 border-gray-700 py-2 px-3 text-right font-bold text-base" style={{ width: '33%' }}>
              <select
                value={data.documentType}
                onChange={(e) => up('documentType', e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-base cursor-pointer no-export-border w-full"
              >
                <option>חשבונית מס</option>
                <option>חשבונית מס קבלה</option>
                <option>קבלה</option>
              </select>
            </td>
            <td className="border-2 border-gray-700 py-2 px-3 text-center font-bold text-xl" style={{ width: '34%' }}>
              <span>מספר :{' '}</span>
              <Field
                value={data.documentNumber}
                onChange={(v) => up('documentNumber', v)}
                placeholder="00001"
                className="font-bold text-xl text-center w-28"
              />
            </td>
            <td className="border-2 border-gray-700 py-2 px-3 text-left font-bold text-base" style={{ width: '33%' }}>
              <button
                onClick={() => up('isOriginal', !data.isOriginal)}
                className="hover:text-gray-600 no-export-border font-bold"
              >
                {data.isOriginal ? 'מקור' : 'העתק'}
              </button>
              <span className="export-only font-bold">{data.isOriginal ? 'מקור' : 'העתק'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── CUSTOMER / REFERENCE INFO ── */}
      <table className="w-full border-collapse mb-3">
        <tbody>
          <tr>
            {/* Right cell — customer details (55%) */}
            <td className="border border-gray-400 p-2 align-top" style={{ width: '55%' }}>
              <div className="text-xs text-gray-600 mb-0.5">לכבוד :</div>
              <Field
                value={data.customerName}
                onChange={(v) => up('customerName', v)}
                placeholder="שם הלקוח"
                className="font-bold w-full text-sm"
              />
              <div className="mt-0.5">
                <Field
                  value={data.customerAddress}
                  onChange={(v) => up('customerAddress', v)}
                  placeholder="רחוב ומספר"
                  className="text-xs w-full"
                />
              </div>
              <div className="mt-0.5">
                <Field
                  value={data.customerCity}
                  onChange={(v) => up('customerCity', v)}
                  placeholder="עיר"
                  className="text-xs w-full"
                />
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs">
                <span className="text-gray-600 whitespace-nowrap">טלפון:</span>
                <Field
                  value={data.customerPhone}
                  onChange={(v) => up('customerPhone', v)}
                  placeholder=""
                  className="text-xs w-32"
                />
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs">
                <span className="text-gray-600 whitespace-nowrap">פקס:</span>
                <Field
                  value={data.customerFax}
                  onChange={(v) => up('customerFax', v)}
                  placeholder=""
                  className="text-xs w-32"
                />
              </div>
            </td>

            {/* Left cell — reference info (45%) */}
            <td className="border border-gray-400 p-2 align-top" style={{ width: '45%' }}>
              {/* מספרכם */}
              <div className="flex justify-between items-center text-xs mb-1">
                <Field
                  value={data.customerReference}
                  onChange={(v) => up('customerReference', v)}
                  placeholder=""
                  className="text-xs w-28 text-left"
                />
                <span className="text-gray-600 whitespace-nowrap">:מספרכם</span>
              </div>
              {/* הקצאה מספר */}
              <div className="flex justify-between items-center text-xs mb-1">
                <Field
                  value={data.allocationNumber}
                  onChange={(v) => up('allocationNumber', v)}
                  placeholder=""
                  className="text-xs w-28 text-left"
                />
                <span className="text-gray-600 whitespace-nowrap">:הקצאה מספר</span>
              </div>
              {/* ע.מ./ת.ז */}
              <div className="flex justify-between items-center text-xs mb-1">
                <Field
                  value={data.customerTaxId}
                  onChange={(v) => up('customerTaxId', v)}
                  placeholder=""
                  className="text-xs w-28 text-left"
                />
                <span className="text-gray-600 whitespace-nowrap">:ע.מ./ת.ז</span>
              </div>
              {/* תאריך — bold, own row */}
              <div className="flex justify-between items-center text-xs mb-0.5 font-bold">
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => up('date', e.target.value)}
                    className="text-xs bg-transparent focus:outline-none no-export-border font-bold"
                    style={{ direction: 'ltr' }}
                  />
                  <span className="export-only font-bold">{fmtDate(data.date)}</span>
                </div>
                <span className="whitespace-nowrap">:תאריך</span>
              </div>
              {/* שעה — bold, own row */}
              <div className="flex justify-between items-center text-xs mb-1 font-bold">
                <Field
                  value={data.time}
                  onChange={(v) => up('time', v)}
                  placeholder="00:00"
                  className="text-xs w-16 text-left font-bold"
                />
                <span className="whitespace-nowrap">:שעה</span>
              </div>
              {/* Footer row: דף + date */}
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span className="export-only">{fmtDate(data.date)}</span>
                <span>דף 1 מתוך 1</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── ITEMS TABLE ── */}
      <table className="w-full border-collapse mb-1">
        <thead>
          <tr>
            <th className={th + ' text-center'} style={{ width: '36px' }}>#<br />מס&apos; פריט</th>
            <th className={th}>תאור פריט</th>
            <th className={th + ' text-center'} style={{ width: '72px' }}>כמות<br />יחידות</th>
            <th className={th + ' text-center'} style={{ width: '90px' }}>ש&quot;ח ליחידה</th>
            <th className={th + ' text-center'} style={{ width: '90px' }}>סה&quot;כ ש&quot;ח</th>
            <th className="w-5 no-export" />
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={item.id}>
              <td className={td + ' text-center text-gray-500'}>{index + 1}</td>
              <td className={td}>
                <Field
                  value={item.description}
                  onChange={(v) => updateItem(item.id, 'description', v)}
                  placeholder="תאור פריט"
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
              <td className={td + ' text-left font-medium'} dir="ltr">
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
          {/* Empty filler row */}
          <tr>
            <td className={td}></td>
            <td className={td}>&nbsp;</td>
            <td className={td}></td>
            <td className={td}></td>
            <td className={td}></td>
            <td className="no-export" />
          </tr>
        </tbody>
      </table>

      <div className="text-right mb-3 no-export">
        <button onClick={addItem} className="text-xs text-blue-500 hover:underline">
          + הוסף שורה
        </button>
      </div>

      {/* ── TOTALS (left-aligned, matching reference) ── */}
      <div className="flex justify-end mb-6">
        <table className="border-collapse text-xs" style={{ minWidth: '260px' }}>
          <tbody>
            {/* סה"כ ללא מע"מ */}
            <tr>
              <td className="py-1 px-3 border border-gray-300 text-right font-bold">
                סה&quot;כ ללא מע&quot;מ:
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left font-bold" dir="ltr" style={{ minWidth: '90px' }}>
                {fmt(subtotal)}
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left text-gray-500" dir="ltr" style={{ minWidth: '60px' }}>
                {fmt(data.items.reduce((s, i) => s + i.quantity, 0))}
              </td>
            </tr>
            {/* הנחה */}
            <tr>
              <td className="py-1 px-3 border border-gray-300 text-right">
                <span>הנחה: </span>
                <span dir="ltr" className="inline-flex items-baseline gap-0.5">
                  <Field
                    value={data.discount}
                    onChange={(v) => up('discount', parseFloat(v) || 0)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-12 text-center"
                  />
                  <span> %</span>
                </span>
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left" dir="ltr">
                {fmt(discountAmt)}
              </td>
              <td className="py-1 px-3 border border-gray-300" />
            </tr>
            {/* סה"כ לאחר הנחה */}
            <tr>
              <td className="py-1 px-3 border border-gray-300 text-right font-bold">
                סה&quot;כ לאחר הנחה:
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left font-bold" dir="ltr">
                {fmt(afterDiscount)}
              </td>
              <td className="py-1 px-3 border border-gray-300" />
            </tr>
            {/* מע"מ */}
            {data.includeVat && (
              <tr>
                <td className="py-1 px-3 border border-gray-300 text-right">
                  <span>מע&quot;מ </span>
                  <span dir="ltr" className="inline-flex items-baseline gap-0.5">
                    <Field
                      value={data.vatRate}
                      onChange={(v) => up('vatRate', parseFloat(v) || 18)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-12 text-center"
                    />
                    <span>%</span>
                  </span>
                </td>
                <td className="py-1 px-3 border border-gray-300 text-left" dir="ltr">
                  {fmt(vatAmount)}
                </td>
                <td className="py-1 px-3 border border-gray-300" />
              </tr>
            )}
            {/* סה"כ לתשלום */}
            <tr className="font-bold">
              <td className="py-1.5 px-3 border border-gray-500 text-right bg-gray-50">
                סה&quot;כ לתשלום:
              </td>
              <td className="py-1.5 px-3 border border-gray-500 text-left bg-gray-50" dir="ltr">
                {fmt(total)}
              </td>
              <td className="py-1.5 px-3 border border-gray-500 bg-gray-50" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PAYMENTS (קבלה types only) ── */}
      {showPayments && (
        <div className="mb-6">
          <div className="font-bold text-sm mb-2 text-right border-b border-gray-300 pb-1">
            פרטי תשלום: {data.documentType} מספר: {data.documentNumber}
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={th + ' w-32'}>סוג תשלום</th>
                <th className={th}>פירוט</th>
                <th className={th + ' w-28 text-center'}>תאריך פרעון</th>
                <th className={th + ' w-24'}>ש&quot;ח</th>
                <th className="w-5 no-export" />
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <td className={td}>
                    <select
                      value={p.method}
                      onChange={(e) => updatePayment(p.id, 'method', e.target.value)}
                      className="bg-transparent focus:outline-none w-full text-xs no-export-border"
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
                    <span className="export-only text-xs">{fmtDate(p.date)}</span>
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
              <tr className="font-bold border-t-2 border-gray-400">
                <td colSpan={3} className="py-1.5 px-3 text-right text-xs">סה&quot;כ:</td>
                <td className="py-1.5 px-3 text-left text-xs" dir="ltr">{fmt(paymentTotal)}</td>
                <td className="no-export" />
              </tr>
            </tfoot>
          </table>
          <div className="text-right mt-1 no-export">
            <button onClick={addPayment} className="text-xs text-blue-500 hover:underline">
              + הוסף תשלום
            </button>
          </div>
        </div>
      )}

      {/* ── SIGNATURE & FOOTER ── */}
      <div className="mt-10 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-end mb-4 text-sm">
          {/* Right: מפיק המסמך */}
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-1">מפיק המסמך:</div>
            <div className="text-xs">
              {data.businessName || 'שם העסק'} ___________
            </div>
          </div>
          {/* Left: שם המקבל etc. */}
          <div className="text-left text-xs">
            שם המקבל_____________ חתימה___________ תאריך__________
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-200 text-xs text-gray-400">
          <div>מסמך זה הופק ע&quot;י מערכת הפקת חשבוניות</div>
          <div>דף 1 מתוך 1</div>
        </div>
      </div>
    </div>
  );
});

ReceiptEditor.displayName = 'ReceiptEditor';
export default ReceiptEditor;
