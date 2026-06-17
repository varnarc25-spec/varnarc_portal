import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const orderId = params.get('order_id');

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 text-4xl">
        ✕
      </div>
      <h1 className="mt-6 text-3xl font-bold text-rose-300">Payment failed</h1>
      <p className="mt-2 text-slate-400">
        Your payment could not be completed. No amount has been charged, or a reversal may be in progress.
      </p>
      {orderId && (
        <p className="mt-4 font-mono text-xs text-slate-500">Order: {orderId}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to={orderId ? `/payment?retry=${orderId}` : '/payment'}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 font-semibold text-white"
        >
          Retry payment
        </Link>
        <Link to="/history" className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm">
          History
        </Link>
      </div>
    </div>
  );
}
