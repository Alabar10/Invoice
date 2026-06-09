'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReceiptEditor from '@/components/ReceiptEditor';
import { defaultReceiptData, ReceiptData } from '@/types/receipt';
import { saveReceipt, getReceipt, getProfile, getNextNumber } from './actions';

const GREEN = '#2a9d8f';

export default function Home() {
  const [data, setData] = useState<ReceiptData>(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return {
      ...defaultReceiptData,
      date: today,
      time,
      payments: [{ id: '1', method: 'העברה בנקאית', details: '', date: today, amount: 0 }],
    };
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState('');
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const editorRef = useRef<HTMLDivElement>(null);

  // On load: re-open an existing receipt (?id=), otherwise pre-fill the
  // business fields from the saved company profile.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
      getReceipt(id).then((loaded) => {
        if (loaded) {
          // Merge with defaults so receipts saved before newer fields
          // existed still have every field defined (controlled inputs).
          setData({ ...defaultReceiptData, ...loaded });
          setCurrentId(id);
        }
      });
      return;
    }
    getProfile()
      .then((profile) => {
        if (profile) setData((prev) => ({ ...prev, ...profile }));
      })
      .catch(() => {});
    // Auto-assign the next receipt number from what's already saved.
    getNextNumber()
      .then((num) => setData((prev) => ({ ...prev, documentNumber: num })))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedNote('');
    try {
      const res = await saveReceipt(data, currentId);
      if (res.ok) {
        setCurrentId(res.id);
        setSavedNote('נשמר ✓');
        setTimeout(() => setSavedNote(''), 2500);
      } else {
        setSavedNote(res.error);
        setTimeout(() => setSavedNote(''), 4000);
      }
    } catch {
      setSavedNote('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (!editorRef.current) return;
    setLoading(true);
    editorRef.current.classList.add('is-exporting');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { default: jsPDF } = await import('jspdf');

      const canvas = await html2canvas(editorRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, Math.min(pdfH, pdf.internal.pageSize.getHeight()));
      pdf.save(
        `חשבונית_${data.documentType}_${data.documentNumber}_${data.customerName || 'לקוח'}.pdf`
      );
    } finally {
      editorRef.current?.classList.remove('is-exporting');
      setLoading(false);
    }
  };

  const handleNewReceipt = async () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    // Next number comes from the database (highest saved + 1).
    let nextNumber = data.documentNumber;
    try {
      nextNumber = await getNextNumber();
    } catch {
      nextNumber = String((parseInt(data.documentNumber) || 0) + 1);
    }
    setCurrentId(undefined);
    setData({
      ...defaultReceiptData,
      businessName: data.businessName,
      businessTaxId: data.businessTaxId,
      businessAddress: data.businessAddress,
      businessPhone: data.businessPhone,
      logoUrl: data.logoUrl,
      documentNumber: nextNumber,
      date: today,
      time,
      payments: [{ id: '1', method: 'העברה בנקאית', details: '', date: today, amount: 0 }],
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <header
        className="text-white px-3 sm:px-6 py-3 shadow-md sticky top-0 z-10 print:hidden"
        style={{ backgroundColor: GREEN }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <h1 className="font-bold text-base">הפקת חשבוניות</h1>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* VAT toggle */}
            <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={data.includeVat}
                onChange={(e) => setData({ ...data, includeVat: e.target.checked })}
                className="w-4 h-4"
              />
              כולל מע&quot;מ
            </label>

            <div className="w-px h-5 bg-white/30" />

            {/* Dashboard */}
            <Link
              href="/dashboard"
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              📊 לוח בקרה
            </Link>

            {/* New receipt */}
            <button
              onClick={handleNewReceipt}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              + חשבונית חדשה
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              🖨 הדפס
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? 'שומר...' : savedNote || '💾 שמור'}
            </button>

            {/* Download PDF */}
            <button
              onClick={downloadPdf}
              disabled={loading}
              className="bg-white font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60"
              style={{ color: GREEN }}
            >
              {loading ? 'מייצר...' : '⬇ הורד PDF'}
            </button>
          </div>
        </div>
      </header>

      {/* Receipt */}
      <main className="max-w-4xl mx-auto px-4 py-8 print:p-0 print:max-w-none">
        <p className="text-xs text-gray-400 mb-3 text-center print:hidden">
          לחץ על כל שדה כדי לערוך
        </p>
        <ReceiptEditor ref={editorRef} data={data} onChange={setData} />
      </main>
    </div>
  );
}
