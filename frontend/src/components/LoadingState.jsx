export default function LoadingState({ label = "Loading…" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
      {label}
    </div>
  );
}
