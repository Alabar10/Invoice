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
    return `${day}/${m}/${y}`;
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
      <div className="flex items-start justify-between mb-3 pb-2">
        {/* Business name + address (right) */}
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
              placeholder="כתובת"
              className="text-xs text-gray-700 w-full"
            />
          </div>
        </div>

        {/* Logo (center) */}
        <div className="mx-4 flex-shrink-0">
          <button
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors w-28 h-16 flex items-center justify-center overflow-hidden no-export-border"
            title="לחץ להוספת לוגו"
          >
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="לוגו" className="max-h-14 max-w-full object-contain" />
            ) : (
              <span className="text-gray-400 text-xs text-center px-1">לוגו</span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        {/* עוסק מורשה + ח.פ (left) */}
        <div className="flex-1 text-left">
          <div className="font-bold text-base">
            עוסק מורשה{' '}
            <Field
              value={data.businessTaxId}
              onChange={(v) => up('businessTaxId', v)}
              placeholder="000000000"
              className="font-bold text-base w-28"
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
      </div>

      {/* ── DOCUMENT TITLE ROW ── */}
      <table className="w-full border-collapse mb-0">
        <tbody>
          <tr>
            <td className="border-2 border-gray-700 py-2 px-3 text-right font-bold text-base w-1/3">
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
            <td className="border-2 border-gray-700 py-2 px-3 text-center font-bold text-xl w-1/3">
              מספר :{' '}
              <Field
                value={data.documentNumber}
                onChange={(v) => up('documentNumber', v)}
                placeholder="00001"
                className="font-bold text-xl text-center w-28 mr-1"
              />
            </td>
            <td className="border-2 border-gray-700 py-2 px-3 text-left w-1/3 text-sm">
              <button
                onClick={() => up('isOriginal', !data.isOriginal)}
                className="hover:text-gray-600 no-export-border"
              >
                {data.isOriginal ? 'מקור' : 'העתק'}
              </button>
              <span className="export-only">{data.isOriginal ? 'מקור' : 'העתק'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── CUSTOMER / DATE INFO ── */}
      <table className="w-full border-collapse mb-3">
        <tbody>
          <tr>
            {/* Right cell — customer details */}
            <td className="border border-gray-400 p-2 align-top" style={{ width: '55%' }}>
              <div className="text-xs text-gray-500 mb-0.5">לכבוד :</div>
              <Field
                value={data.customerName}
                onChange={(v) => up('customerName', v)}
                placeholder="שם הלקוח"
                className="font-bold w-full"
              />
              <Field
                value={data.customerAddress}
                onChange={(v) => up('customerAddress', v)}
                placeholder="רחוב"
                className="text-xs w-full mt-0.5"
              />
              <div className="flex justify-between items-center mt-0.5">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-600">טלפון:</span>
                  <Field
                    value={data.customerPhone}
                    onChange={(v) => up('customerPhone', v)}
                    placeholder=""
                    className="text-xs w-28"
                  />
                </div>
                <Field
                  value={data.customerCity}
                  onChange={(v) => up('customerCity', v)}
                  placeholder="עיר"
                  className="text-xs w-20 text-right"
                />
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-600">פקס:</span>
                  <Field
                    value={data.customerFax}
                    onChange={(v) => up('customerFax', v)}
                    placeholder=""
                    className="text-xs w-28"
                  />
                </div>
                <span className="text-xs text-gray-400">דף 1 מתוך 1</span>
              </div>
            </td>

            {/* Left cell — reference info */}
            <td className="border border-gray-400 p-2 align-top" style={{ width: '45%' }}>
              <div className="flex justify-between items-center text-xs mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">שעה :</span>
                  <Field
                    value={data.time}
                    onChange={(v) => up('time', v)}
                    placeholder="00:00"
                    className="text-xs w-12"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">תאריך:</span>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => up('date', e.target.value)}
                    className="text-xs bg-transparent focus:outline-none no-export-border"
                  />
                  <span className="export-only text-xs">{fmtDate(data.date)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600">מספרכם:</span>
                <Field
                  value={data.customerReference}
                  onChange={(v) => up('customerReference', v)}
                  placeholder=""
                  className="text-xs w-32 text-left"
                />
              </div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-600">הקצאה מספר:</span>
                <Field
                  value={data.allocationNumber}
                  onChange={(v) => up('allocationNumber', v)}
                  placeholder=""
                  className="text-xs w-32 text-left"
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">ע.מ./ת.ז:</span>
                <Field
                  value={data.customerTaxId}
                  onChange={(v) => up('customerTaxId', v)}
                  placeholder=""
                  className="text-xs w-32 text-left"
                />
              </div>
              <div className="text-xs text-left mt-1 text-gray-400">
                <span className="export-only">{fmtDate(data.date)}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── ITEMS TABLE ── */}
      <div className="overflow-x-auto -mx-6 sm:mx-0">
        <div className="px-6 sm:px-0">
          <table className="w-full border-collapse mb-1">
            <thead>
              <tr>
                <th className={th + ' w-8 text-center'}>#<br />מס&apos; פריט</th>
                <th className={th}>תאור פריט</th>
                <th className={th + ' w-20 text-center'}>כמות<br />יחידות</th>
                <th className={th + ' w-24 text-center'}>ש&quot;ח ליחידה</th>
                <th className={th + ' w-24 text-center'}>סה&quot;כ ש&quot;ח</th>
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
                  <td className={td + ' text-left'} dir="ltr">
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
                <td className={td + ' text-center text-gray-300'}></td>
                <td className={td}>&nbsp;</td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className="no-export" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-right mb-3 no-export">
        <button onClick={addItem} className="text-xs text-blue-500 hover:underline">
          + הוסף שורה
        </button>
      </div>

      {/* ── TOTALS ── */}
      <div className="flex justify-start mb-6">
        <table className="border-collapse text-xs" style={{ minWidth: '230px' }}>
          <tbody>
            <tr>
              <td className="py-1 px-3 border border-gray-300 text-right font-semibold">
                סה&quot;כ ללא מע&quot;מ:
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left" dir="ltr">
                {fmt(subtotal)}
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left text-gray-500" dir="ltr">
                {fmt(data.items.reduce((s, i) => s + i.quantity, 0))}
              </td>
            </tr>
            <tr>
              <td className="py-1 px-3 border border-gray-300 text-right">
                הנחה: %{' '}
                <Field
                  value={data.discount}
                  onChange={(v) => up('discount', parseFloat(v) || 0)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-10 text-center inline-block"
                />
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left" dir="ltr">
                {discountAmt > 0 ? `(${fmt(discountAmt)})` : fmt(0)}
              </td>
              <td className="py-1 px-3 border border-gray-300"></td>
            </tr>
            <tr>
              <td className="py-1 px-3 border border-gray-300 text-right">
                סה&quot;כ לאחר הנחה:
              </td>
              <td className="py-1 px-3 border border-gray-300 text-left" dir="ltr">
                {fmt(afterDiscount)}
              </td>
              <td className="py-1 px-3 border border-gray-300"></td>
            </tr>
            {data.includeVat && (
              <tr>
                <td className="py-1 px-3 border border-gray-300 text-right">
                  מע&quot;מ{' '}
                  <Field
                    value={data.vatRate}
                    onChange={(v) => up('vatRate', parseFloat(v) || 18)}
                    type="number"
                    min="0"
                    className="w-8 text-center inline-block"
                  />
                  .00%
                </td>
                <td className="py-1 px-3 border border-gray-300 text-left" dir="ltr">
                  {fmt(vatAmount)}
                </td>
                <td className="py-1 px-3 border border-gray-300"></td>
              </tr>
            )}
            <tr className="font-bold">
              <td className="py-1.5 px-3 border border-gray-400 text-right bg-gray-50">
                סה&quot;כ לתשלום:
              </td>
              <td className="py-1.5 px-3 border border-gray-400 text-left bg-gray-50" dir="ltr">
                {fmt(total)}
              </td>
              <td className="py-1.5 px-3 border border-gray-400 bg-gray-50"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PAYMENTS (only for קבלה types) ── */}
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
                <td colSpan={3} className="py-1.5 px-3 text-right text-xs">
                  סה&quot;כ:
                </td>
                <td className="py-1.5 px-3 text-left text-xs" dir="ltr">
                  {fmt(paymentTotal)}
                </td>
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
      <div className="mt-8 pt-4 border-t border-gray-300">
        <div className="flex justify-between items-end mb-8 text-sm">
          <div className="text-left">
            <div className="text-xs text-gray-500 mb-1">מפיק המסמך:</div>
            <div className="border-b border-gray-500 w-48">&nbsp;</div>
          </div>
          <div className="text-right font-bold">
            {data.businessName || 'שם העסק'} ____________
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <div>
            שם המקבל_____________ חתימה________ תאריך__________
          </div>
        </div>
        <div className="flex justify-between items-end mt-4 pt-2 border-t border-gray-200 text-xs text-gray-400">
          <div>מסמך זה הופק ע&quot;י מערכת הפקת חשבוניות</div>
          <div>דף 1 מתוך 1</div>
        </div>
      </div>
    </div>
  );
});

ReceiptEditor.displayName = 'ReceiptEditor';
export default ReceiptEditor;
