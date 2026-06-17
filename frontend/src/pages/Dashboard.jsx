import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatInr } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 p-8 shadow-2xl">
        <p className="text-sm text-indigo-300">Secure payments</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Payments dashboard</h1>
        <p className="mt-2 max-w-xl text-slate-400">
          Pay bills, insurance premiums, and recharges with Cashfree. All transactions are linked to your account and
          service menu items.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/payment"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 font-semibold text-white shadow-lg"
          >
            New payment
          </Link>
          <Link
            to="/history"
            className="rounded-xl border border-slate-600 px-5 py-2.5 font-medium text-slate-200 hover:bg-slate-800"
          >
            Transaction history
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Account', value: user?.phone || user?.email || '—' },
          { label: 'Gateway', value: 'Cashfree PG' },
          { label: 'Limit / txn', value: formatInr(500000) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
