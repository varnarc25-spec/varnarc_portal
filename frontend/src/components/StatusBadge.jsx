const styles = {
  SUCCESS: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30',
  FAILED: 'bg-rose-500/20 text-rose-300 ring-rose-500/30',
  PENDING: 'bg-amber-500/20 text-amber-200 ring-amber-500/30',
};

export default function StatusBadge({ status }) {
  const key = String(status || 'PENDING').toUpperCase();
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[key] || styles.PENDING}`}
    >
      {key}
    </span>
  );
}
