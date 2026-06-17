import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createOrder, verifyPayment } from '../api/payment';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCashfreeCheckout } from '../hooks/useCashfreeCheckout';
import { formatInr } from '../utils/format';

export default function Payment() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { ready, openCheckout } = useCashfreeCheckout();

  const [form, setForm] = useState({
    amount: params.get('amount') || '',
    name: user?.displayName || user?.name || '',
    email: user?.email || '',
    phone: (user?.phone || '').replace(/\D/g, '').slice(-10),
    menu_item_slug: params.get('menu_item_slug') || '',
    section_slug: params.get('section_slug') || '',
  });
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const amount = Number(form.amount) || 0;
    const fee = 0;
    return { amount, fee, total: amount + fee };
  }, [form.amount]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePay(e) {
    e.preventDefault();
    if (!ready) {
      showToast('Cashfree SDK is still loading', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await createOrder({
        amount: Number(form.amount),
        phone: form.phone,
        name: form.name,
        email: form.email || undefined,
        menu_item_slug: form.menu_item_slug || undefined,
        section_slug: form.section_slug || undefined,
      });
      const payload = res?.data || res;
      const sessionId = payload.payment_session_id;
      const orderId = payload.order_id;
      if (!sessionId) throw new Error('No payment session from server');

      await openCheckout(sessionId);

      const verified = await verifyPayment(orderId);
      const status = (verified?.data?.status || verified?.status || '').toUpperCase();

      if (status === 'SUCCESS') {
        navigate(`/payment/success?order_id=${orderId}`);
      } else if (status === 'FAILED') {
        navigate(`/payment/failed?order_id=${orderId}`);
      } else {
        navigate(`/payment/success?order_id=${orderId}&pending=1`);
      }
    } catch (err) {
      showToast(err.message || 'Payment failed', 'error');
      navigate('/payment/failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form onSubmit={handlePay} className="lg:col-span-3 space-y-5">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <h1 className="text-2xl font-bold">Pay securely</h1>
          <p className="mt-1 text-sm text-slate-400">256-bit encryption · PCI-DSS compliant gateway</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs text-slate-500">Amount (INR)</span>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Full name</span>
              <input
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Phone</span>
              <input
                required
                pattern="\d{10}"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-slate-500">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Service slug (optional)</span>
              <input
                value={form.menu_item_slug}
                onChange={(e) => updateField('menu_item_slug', e.target.value)}
                placeholder="loan-repayment"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Section slug (optional)</span>
              <input
                value={form.section_slug}
                onChange={(e) => updateField('section_slug', e.target.value)}
                placeholder="bill-payments"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !ready}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 disabled:opacity-60"
          >
            {loading ? 'Processing…' : 'Pay now'}
          </button>
        </div>
        {loading && <LoadingSpinner label="Opening Cashfree checkout…" />}
      </form>

      <aside className="lg:col-span-2">
        <div className="sticky top-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/50 to-slate-950 p-6 shadow-2xl">
          <h2 className="font-semibold">Payment summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Subtotal</dt>
              <dd>{formatInr(summary.amount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Fees</dt>
              <dd>{formatInr(summary.fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatInr(summary.total)}</dd>
            </div>
          </dl>
          <ul className="mt-6 space-y-2 text-xs text-slate-500">
            <li>✓ Cashfree secure checkout</li>
            <li>✓ Instant verification on server</li>
            <li>✓ Webhook-backed final status</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
