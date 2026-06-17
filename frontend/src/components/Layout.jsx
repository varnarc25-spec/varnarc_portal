import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`;

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold">
              V
            </span>
            <span className="font-semibold tracking-tight">Varnarc Pay</span>
          </Link>
          {isAuthenticated && (
            <nav className="flex flex-wrap items-center gap-1">
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/payment" className={navClass}>
                Pay
              </NavLink>
              <NavLink to="/history" className={navClass}>
                History
              </NavLink>
            </nav>
          )}
          <div className="flex items-center gap-3 text-sm">
            {isAuthenticated ? (
              <>
                <span className="hidden text-slate-400 sm:inline">
                  {user?.phone || user?.email || 'Signed in'}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 font-medium text-white shadow-lg shadow-indigo-500/25"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
