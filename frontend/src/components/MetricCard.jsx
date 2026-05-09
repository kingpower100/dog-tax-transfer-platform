import StatusBadge from "./StatusBadge.jsx";

export default function MetricCard({ label, value, helper, tone, badge }) {
  const accent =
    tone === "navy"
      ? "bg-blue-50"
      : tone === "slate"
        ? "bg-slate-50"
        : tone === "amber"
          ? "bg-amber-50"
          : "bg-emerald-50";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="text-sm font-extrabold text-slate-500">{label}</span>
        {badge ? <StatusBadge value={badge} /> : null}
      </div>
      <strong className="relative z-10 mt-5 block text-3xl font-black leading-none text-slate-950">{value ?? "-"}</strong>
      {helper ? <p className="relative z-10 mt-3 text-sm text-slate-500">{helper}</p> : null}
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${accent}`} aria-hidden="true" />
    </article>
  );
}
