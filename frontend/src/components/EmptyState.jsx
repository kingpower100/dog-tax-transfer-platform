export default function EmptyState({ title = "No data available.", children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-slate-600">
      <strong className="block text-base text-slate-900">{title}</strong>
      {children ? <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p> : null}
      {!children ? <p className="mt-2 text-sm leading-6 text-slate-500">No records are available for the selected access area.</p> : null}
    </div>
  );
}
