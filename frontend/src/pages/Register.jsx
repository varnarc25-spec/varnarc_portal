const signinUrl = import.meta.env.VITE_PORTAL_SIGNIN_URL || 'http://localhost:4000/signin';

export default function Register() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="mt-3 text-sm text-slate-400">
        Registration is handled on the Varnarc portal via Firebase phone OTP, which syncs your profile to Marg API.
      </p>
      <a
        href={signinUrl}
        className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 font-semibold text-white"
      >
        Go to portal sign-up
      </a>
    </div>
  );
}
