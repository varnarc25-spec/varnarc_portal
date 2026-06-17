import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatDate, formatInr } from '../utils/format';

export default function TransactionTable({ items = [], onRetry }) {
  if (!items.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center text-slate-400">
        No transactions yet. Complete a payment to see history here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {items.map((row) => (
            <tr key={row.order_id} className="hover:bg-slate-800/40">
              <td className="px-4 py-3 font-mono text-xs text-slate-300">{row.order_id}</td>
              <td className="px-4 py-3 text-slate-400">{row.menu_item_slug || '—'}</td>
              <td className="px-4 py-3 font-medium">{formatInr(row.amount)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-slate-400">{formatDate(row.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {row.status === 'SUCCESS' && (
                    <button
                      type="button"
                      className="text-xs text-indigo-300 hover:underline"
                      onClick={() => window.print()}
                    >
                      Receipt
                    </button>
                  )}
                  {(row.status === 'FAILED' || row.status === 'PENDING') && onRetry && (
                    <button
                      type="button"
                      className="text-xs text-amber-300 hover:underline"
                      onClick={() => onRetry(row)}
                    >
                      Retry
                    </button>
                  )}
                  <Link to={`/payment/success?order_id=${row.order_id}`} className="text-xs text-slate-400 hover:underline">
                    View
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
