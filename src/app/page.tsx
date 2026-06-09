'use client';
import { useRef, useState } from 'react';
import ReceiptEditor from '@/components/ReceiptEditor';
import { defaultReceiptData, ReceiptData } from '@/types/receipt';

const GREEN = '#2a9d8f';

export default function Home() {
  const [data, setData] = useState<ReceiptData>(defaultReceiptData);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

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

  const handleNewReceipt = () => {
    const next = parseInt(data.documentNumber) || 0;
    setData({
      ...defaultReceiptData,
      businessName: data.businessName,
      businessTaxId: data.businessTaxId,
      businessAddress: data.businessAddress,
      businessPhone: data.businessPhone,
      logoUrl: data.logoUrl,
      documentNumber: String(next + 1),
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
