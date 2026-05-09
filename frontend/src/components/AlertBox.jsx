export default function AlertBox({ type = "info", title, children }) {
  const tone = {
    info: "border-slate-200 bg-white text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
  }[type];

  return (
    <div className={`mb-4 rounded-xl border p-4 shadow-sm ${tone}`}>
      {title ? <strong className="mb-1 block text-slate-950">{title}</strong> : null}
      {children ? <div>{children}</div> : null}
    </div>
  );
}
