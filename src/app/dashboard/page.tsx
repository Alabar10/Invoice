'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listReceipts,
  getStats,
  deleteReceipt,
  ReceiptSummary,
} from '../actions';

const GREEN = '#2a9d8f';

interface Stats {
  count: number;
  revenue: number;
  monthCount: number;
  monthRevenue: number;
}

const money = (n: number) =>
  '₪' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function Dashboard() {
  const [rows, setRows] = useState<ReceiptSummary[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [list, s] = await Promise.all([listReceipts(), getStats()]);
      setRows(list);
      setStats(s);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את החשבונית?')) return;
    await deleteReceipt(id);
    load();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <header
        className="text-white px-3 sm:px-6 py-3 shadow-md sticky top-0 z-10"
        style={{ backgroundColor: GREEN }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <h1 className="font-bold text-base">📊 לוח בקרה</h1>
          <Link
            href="/"
            className="bg-white font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: GREEN }}
          >
            + חשבונית חדשה
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-600">
            <p className="font-bold text-base mb-2">בסיס הנתונים עדיין לא מחובר</p>
            <p>חבר את מסד הנתונים (Neon) ב-Vercel והרץ את המיגרציה. ראה הוראות בקובץ DATABASE_SETUP.md.</p>
          </div>
        ) : loading ? (
          <p className="text-center text-gray-400 text-sm">טוען...</p>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="סה״כ חשבוניות" value={String(stats?.count ?? 0)} />
              <StatCard label="סה״כ הכנסות" value={money(stats?.revenue ?? 0)} />
              <StatCard label="חשבוניות החודש" value={String(stats?.monthCount ?? 0)} />
              <StatCard label="הכנסות החודש" value={money(stats?.monthRevenue ?? 0)} />
            </div>

            {/* Receipts table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 font-bold text-sm">
                כל החשבוניות
              </div>
              {rows.length === 0 ? (
                <p className="px-4 py-8 text-center text-gray-400 text-sm">
                  עדיין אין חשבוניות שמורות. צור חשבונית חדשה ולחץ &quot;שמור&quot;.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs">
                      <th className="text-right font-semibold px-4 py-2">סוג</th>
                      <th className="text-right font-semibold px-4 py-2">מספר</th>
                      <th className="text-right font-semibold px-4 py-2">לקוח</th>
                      <th className="text-right font-semibold px-4 py-2">תאריך</th>
                      <th className="text-left font-semibold px-4 py-2">סכום</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2">{r.documentType}</td>
                        <td className="px-4 py-2">{r.documentNumber}</td>
                        <td className="px-4 py-2">{r.customerName || '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-2 text-left font-semibold" dir="ltr">
                          {money(r.total)}
                        </td>
                        <td className="px-4 py-2 text-left whitespace-nowrap">
                          <Link
                            href={`/?id=${r.id}`}
                            className="text-blue-500 hover:underline ml-3"
                          >
                            פתח
                          </Link>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            מחק
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color: GREEN }}>
        {value}
      </div>
    </div>
  );
}
