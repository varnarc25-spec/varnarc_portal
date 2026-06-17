import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const signinUrl = import.meta.env.VITE_PORTAL_SIGNIN_URL || 'http://localhost:4000/signin';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem('varnarc_auth_token') || '');

  if (isAuthenticated) {
    navigate(location.state?.from || '/dashboard', { replace: true });
  }

  function handleTokenLogin(e) {
    e.preventDefault();
    if (!token.trim()) {
      showToast('Paste your Firebase ID token from Varnarc portal', 'error');
      return;
    }
    let user = {};
    try {
      user = JSON.parse(localStorage.getItem('varnarc_auth_user') || '{}');
    } catch {
      user = {};
    }
    login(token.trim(), user);
    showToast('Signed in', 'success');
    navigate(location.state?.from || '/dashboard');
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Varnarc uses Firebase phone OTP on the portal. Sign in there, then return here with your session token.
        </p>
        <a
          href={signinUrl}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30"
        >
          Open Varnarc Sign-in
        </a>
        <form onSubmit={handleTokenLogin} className="mt-6 space-y-3">
          <label className="block text-xs font-medium text-slate-500">Firebase ID token (dev)</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
            placeholder="varnarc_auth_token from portal localStorage"
          />
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-600 py-2.5 text-sm font-medium hover:bg-slate-800"
          >
            Continue with token
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New user?{' '}
          <Link to="/register" className="text-indigo-300 hover:underline">
            Register on portal
          </Link>
        </p>
      </div>
    </div>
  );
}
