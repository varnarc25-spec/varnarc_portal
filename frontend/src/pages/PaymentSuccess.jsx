import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyPayment } from '../api/payment';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatInr } from '../utils/format';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('order_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) return;
    verifyPayment(orderId)
      .then((res) => setOrder(res?.data || res))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <LoadingSpinner label="Confirming payment…" />;

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-4xl animate-bounce">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold text-emerald-300">
        {params.get('pending') ? 'Payment pending' : 'Payment successful'}
      </h1>
      {order && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left text-sm">
          <p className="font-mono text-xs text-slate-500">{order.order_id}</p>
          <p className="mt-2 text-2xl font-bold">{formatInr(order.amount)}</p>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-slate-500">{formatDate(order.updated_at || order.created_at)}</span>
          </div>
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Download receipt
        </button>
        <Link to="/history" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
          View history
        </Link>
        <Link to="/payment" className="rounded-xl border border-slate-600 px-4 py-2 text-sm">
          Pay again
        </Link>
      </div>
    </div>
  );
}
