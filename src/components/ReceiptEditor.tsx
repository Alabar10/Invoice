'use client';
import { forwardRef, useRef, ChangeEvent, ReactNode } from 'react';
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

/**
 * Editable field that renders an <input> in normal view, and a static text
 * <span> during PDF export (html2canvas renders inputs poorly). The wrapper
 * span carries width / alignment / font classes; the input fills it.
 */
function Field({
  value,
  onChange,
  placeholder,
  className = '',
  type = 'text',
  min,
  step,
  dir,
  display,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  min?: string;
  step?: string;
  dir?: 'ltr' | 'rtl';
  display?: string;
}) {
  const exportText =
    display !== undefined
      ? display
      : value === '' || value === null || value === undefined
      ? ''
      : String(value);
  return (
    <span className={`inline-block align-baseline ${className}`}>
      <input
        type={type}
        value={value}
        min={min}
        step={step}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none focus:bg-blue-50/30 rounded-sm transition-colors w-full"
        style={{ textAlign: 'inherit', font: 'inherit', color: 'inherit' }}
      />
      <span className="export-only" style={{ whiteSpace: 'nowrap' }} dir={dir}>
        {exportText}
      </span>
    </span>
  );
}

/** Label : value row used inside the info box. */
function InfoRow({
  label,
  children,
  bold = false,
  align = 'right',
}: {
  label: string;
  children: ReactNode;
  bold?: boolean;
  align?: 'right' | 'left';
}) {
  return (
    <div
      className={`flex items-center gap-1 mb-0.5 ${bold ? 'font-bold' : ''} ${
        align === 'left' ? 'justify-end' : 'justify-start'
      }`}
    >
      <span className={bold ? '' : 'text-gray-600'}>{label}</span>
      {children}
    </div>
  );
}

const th = 'py-1.5 px-2 text-xs font-bold border border-gray-400 bg-gray-100 text-right';
const td = 'py-1 px-2 border border-gray-300 text-xs';

// Borderless items table — horizontal rules supplied by the row, not the cell
const itemTh = 'py-1.5 px-2 text-xs font-bold text-right';
const itemTd = 'py-1.5 px-2 text-xs';

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
  const qtyTotal = data.items.reduce((s, i) => s + i.quantity, 0);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      className="bg-white p-6 mx-auto"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif', maxWidth: '800px', fontSize: '13px' }}
    >
      {/* ── HEADER BOX ── */}
      <div className="border border-gray-600 mb-2 px-4 py-3 flex items-start justify-between" style={{ minHeight: '110px' }}>
        {/* Right: business name + address + phone */}
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
              className="font-bold text-sm w-full"
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

        {/* Center: optional logo */}
        <div className="mx-4 flex-shrink-0">
          <button
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded hover:border-blue-400 transition-colors w-24 h-14 flex items-center justify-center overflow-hidden no-export"
            title="לחץ להוספת לוגו"
          >
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="לוגו" className="max-h-12 max-w-full object-contain" />
            ) : (
              <span className="text-gray-300 text-xs">לוגו</span>
            )}
          </button>
          {data.logoUrl && (
            <img src={data.logoUrl} alt="לוגו" className="export-only max-h-12 max-w-full object-contain" />
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        {/* Left: עוסק מורשה + tax ID */}
        <div className="text-left whitespace-nowrap">
          <span className="font-bold text-sm">עוסק מורשה </span>
          <Field
            value={data.businessTaxId}
            onChange={(v) => up('businessTaxId', v)}
            placeholder="000000000"
            className="font-bold text-sm w-24 text-left"
            dir="ltr"
          />
        </div>
      </div>

      {/* ── DOCUMENT TITLE ROW (top + bottom rules only, no cell borders) ── */}
      <table
        className="w-full border-collapse mb-0"
        style={{ borderTop: '3px solid #111827', borderBottom: '1px solid #111827' }}
      >
        <tbody>
          <tr>
            <td className="py-2 px-3 text-right font-bold text-base" style={{ width: '33%' }}>
              <select
                value={data.documentType}
                onChange={(e) => up('documentType', e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-base cursor-pointer w-full"
              >
                <option>חשבונית מס</option>
                <option>חשבונית מס קבלה</option>
                <option>קבלה</option>
              </select>
              <span className="export-only font-bold text-base">{data.documentType}</span>
            </td>
            <td className="py-2 px-3 text-center font-bold text-xl" style={{ width: '34%' }}>
              <span>מספר : </span>
              <Field
                value={data.documentNumber}
                onChange={(v) => up('documentNumber', v)}
                placeholder="00001"
                className="font-bold text-xl text-center w-28"
              />
            </td>
            <td className="py-2 px-3 text-left font-bold text-base" style={{ width: '33%' }}>
              <button
                onClick={() => up('isOriginal', !data.isOriginal)}
                className="hover:text-gray-600 font-bold no-export"
              >
                {data.isOriginal ? 'מקור' : 'העתק'}
              </button>
              <span className="export-only font-bold">{data.isOriginal ? 'מקור' : 'העתק'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── INFO BOX (single bordered box, 3 columns, no inner divider) ── */}
      <div
        className="mb-3 px-4 py-2 flex justify-between text-xs"
        style={{ borderBottom: '1px solid #111827' }}
      >
        {/* Right column — customer */}
        <div className="text-right" style={{ width: '38%' }}>
          <div className="font-bold mb-0.5">לכבוד :</div>
          <Field
            value={data.customerName}
            onChange={(v) => up('customerName', v)}
            placeholder="שם הלקוח"
            className="font-bold text-sm w-full"
          />
          <div className="mt-0.5">
            <Field
              value={data.customerAddress}
              onChange={(v) => up('customerAddress', v)}
              placeholder="כתובת"
              className="w-full"
            />
          </div>
          <div className="mt-0.5">
            <Field
              value={data.customerCity}
              onChange={(v) => up('customerCity', v)}
              placeholder="עיר"
              className="w-full"
            />
          </div>
        </div>

        {/* Center column — references + contact + tax id */}
        <div className="text-right" style={{ width: '34%' }}>
          <InfoRow label="מספרכם:">
            <Field
              value={data.customerReference}
              onChange={(v) => up('customerReference', v)}
              className="w-24 text-right"
            />
          </InfoRow>
          <InfoRow label="הקצאה מספר:">
            <Field
              value={data.allocationNumber}
              onChange={(v) => up('allocationNumber', v)}
              className="w-24 text-right"
            />
          </InfoRow>
          <InfoRow label="טלפון:">
            <Field
              value={data.customerPhone}
              onChange={(v) => up('customerPhone', v)}
              className="w-24 text-right"
            />
          </InfoRow>
          <InfoRow label="פקס:">
            <Field
              value={data.customerFax}
              onChange={(v) => up('customerFax', v)}
              className="w-24 text-right"
            />
          </InfoRow>
          <InfoRow label="ע.מ./ת.ז:">
            <Field
              value={data.customerTaxId}
              onChange={(v) => up('customerTaxId', v)}
              className="w-28 text-right"
              dir="ltr"
            />
          </InfoRow>
        </div>

        {/* Left column — date / time */}
        <div className="text-left" style={{ width: '24%' }}>
          {/* תאריך */}
          <div className="flex items-center justify-end gap-1 font-bold mb-0.5">
            <span className="whitespace-nowrap">תאריך :</span>
            <span>
              <input
                type="date"
                value={data.date}
                onChange={(e) => up('date', e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-xs"
                style={{ direction: 'ltr' }}
              />
              <span className="export-only font-bold">{fmtDate(data.date)}</span>
            </span>
          </div>
          {/* שעה */}
          <div className="flex items-center justify-end gap-1 font-bold mb-1">
            <span className="whitespace-nowrap">שעה :</span>
            <Field
              value={data.time}
              onChange={(v) => up('time', v)}
              placeholder="00:00"
              className="font-bold w-12 text-left"
              dir="ltr"
            />
          </div>
          {/* footer: page + print date */}
          <div className="text-gray-500 mt-1">דף 1 מתוך 1</div>
          <div className="text-gray-500 export-only">{fmtDate(data.date)}</div>
        </div>
      </div>

      {/* ── ITEMS TABLE (horizontal rules only, no grid / no shading) ── */}
      <table className="w-full border-collapse mb-1">
        <thead>
          <tr style={{ borderTop: '1px solid #111827', borderBottom: '1px solid #111827' }}>
            <th className={itemTh + ' text-center'} style={{ width: '40px' }}>#<br />מס&apos; פריט</th>
            <th className={itemTh}>תאור פריט</th>
            <th className={itemTh + ' text-center'} style={{ width: '78px' }}>כמות<br />יחידות</th>
            <th className={itemTh + ' text-center'} style={{ width: '95px' }}>ש&quot;ח ליחידה</th>
            <th className={itemTh + ' text-center'} style={{ width: '95px' }}>סה&quot;כ ש&quot;ח</th>
            <th className="w-5 no-export" />
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #d1d5db' }}>
              <td className={itemTd + ' text-center text-gray-600'}>{index + 1}</td>
              <td className={itemTd}>
                <Field
                  value={item.description}
                  onChange={(v) => updateItem(item.id, 'description', v)}
                  placeholder="תאור פריט"
                  className="w-full"
                />
              </td>
              <td className={itemTd + ' text-center'}>
                <Field
                  value={item.quantity}
                  onChange={(v) => updateItem(item.id, 'quantity', v)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full text-center"
                  dir="ltr"
                  display={fmt(item.quantity)}
                />
              </td>
              <td className={itemTd + ' text-left'} dir="ltr">
                <Field
                  value={item.unitPrice}
                  onChange={(v) => updateItem(item.id, 'unitPrice', v)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full text-left"
                  dir="ltr"
                  display={fmt(item.unitPrice)}
                />
              </td>
              <td className={itemTd + ' text-left'} dir="ltr">
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

      <div className="text-right mb-3 no-export">
        <button onClick={addItem} className="text-xs text-blue-500 hover:underline">
          + הוסף שורה
        </button>
      </div>

      {/* ── TOTALS (left side; only the amounts column is boxed) ── */}
      <div className="flex justify-end mb-6">
        <table className="border-collapse text-xs">
          <tbody>
            {/* סה"כ ללא מע"מ */}
            <tr>
              <td className="py-1 px-3 text-right text-gray-700" dir="ltr" style={{ minWidth: '55px' }}>
                <span className="underline">{fmt(qtyTotal)}</span>
              </td>
              <td className="py-1 px-3 text-right font-bold whitespace-nowrap">
                סה&quot;כ ללא מע&quot;מ:
              </td>
              <td className="py-1 px-3 text-left font-bold border-t-2 border-x border-gray-700" dir="ltr" style={{ minWidth: '110px' }}>
                {fmt(subtotal)}
              </td>
            </tr>
            {/* הנחה */}
            <tr>
              <td />
              <td className="py-1 px-3 text-right whitespace-nowrap">
                <span>הנחה: </span>
                <span dir="ltr" className="inline-flex items-baseline gap-1">
                  <Field
                    value={data.discount}
                    onChange={(v) => up('discount', parseFloat(v) || 0)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-12 text-center"
                    dir="ltr"
                    display={data.discount.toFixed(2)}
                  />
                  <span>%</span>
                </span>
              </td>
              <td className="py-1 px-3 text-left border-b border-x border-gray-700" dir="ltr">
                {fmt(discountAmt)}
              </td>
            </tr>
            {/* סה"כ לאחר הנחה */}
            <tr>
              <td />
              <td className="py-1 px-3 text-right font-bold whitespace-nowrap">
                סה&quot;כ לאחר הנחה:
              </td>
              <td className="py-1 px-3 text-left font-bold border-t border-x border-gray-700" dir="ltr">
                {fmt(afterDiscount)}
              </td>
            </tr>
            {/* מע"מ */}
            {data.includeVat && (
              <tr>
                <td />
                <td className="py-1 px-3 text-right whitespace-nowrap">
                  <span dir="ltr" className="inline-flex items-baseline gap-1">
                    <Field
                      value={data.vatRate}
                      onChange={(v) => up('vatRate', parseFloat(v) || 18)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-12 text-center"
                      dir="ltr"
                      display={data.vatRate.toFixed(2)}
                    />
                    <span>%</span>
                  </span>
                  <span> מע&quot;מ</span>
                </td>
                <td className="py-1 px-3 text-left border-b border-x border-gray-700" dir="ltr">
                  {fmt(vatAmount)}
                </td>
              </tr>
            )}
            {/* סה"כ לתשלום */}
            <tr className="font-bold">
              <td />
              <td className="py-1.5 px-3 text-right whitespace-nowrap">
                סה&quot;כ לתשלום:
              </td>
              <td className="py-1.5 px-3 text-left border-2 border-gray-700" dir="ltr">
                {fmt(total)}
              </td>
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
                      className="bg-transparent focus:outline-none w-full text-xs"
                    >
                      <option>העברה בנקאית</option>
                      <option>מזומן</option>
                      <option>צ&apos;ק</option>
                      <option>כרטיס אשראי</option>
                      <option>ביט</option>
                      <option>פייבוקס</option>
                    </select>
                    <span className="export-only text-xs">{p.method}</span>
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
                      className="text-xs bg-transparent focus:outline-none w-full"
                    />
                    <span className="export-only text-xs">{fmtDate(p.date)}</span>
                  </td>
                  <td className={td + ' text-left'} dir="ltr">
                    <Field
                      value={p.amount}
                      onChange={(v) => updatePayment(p.id, 'amount', v)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full text-left"
                      dir="ltr"
                      display={fmt(p.amount)}
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
      <div className="mt-12 text-sm">
        <div className="flex justify-between items-start mb-1">
          {/* Right: document producer (editable) */}
          <div className="text-right">
            <div className="font-bold mb-1">מפיק המסמך:</div>
            <div className="flex items-baseline gap-1">
              <Field
                value={data.documentProducer}
                onChange={(v) => up('documentProducer', v)}
                placeholder={data.businessName || 'שם המפיק'}
                className="text-xs w-44 text-right"
              />
              <span className="text-xs">_______________</span>
            </div>
          </div>
          {/* Left: recipient signature line (filled by hand after print) */}
          <div className="text-left text-xs pt-6">
            שם המקבל_____________ חתימה___________ תאריך__________
          </div>
        </div>
      </div>
    </div>
  );
});

ReceiptEditor.displayName = 'ReceiptEditor';
export default ReceiptEditor;
