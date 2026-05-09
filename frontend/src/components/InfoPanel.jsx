export default function InfoPanel({ title, children, className = "" }) {
  return (
    <aside className={`rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-sm leading-6 text-slate-700 ${className}`}>
      {title ? <h3 className="mb-2 text-base font-black text-slate-950">{title}</h3> : null}
      {children}
    </aside>
  );
}

