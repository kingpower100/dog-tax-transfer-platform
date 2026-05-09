export default function JsonViewer({ title = "API Response", data, defaultOpen = true }) {
  if (!data) return null;

  return (
    <details className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" open={defaultOpen}>
      <summary className="cursor-pointer bg-slate-50 px-4 py-3 font-extrabold text-slate-800">{title}</summary>
      <pre className="overflow-auto bg-slate-950 p-4 text-sm text-slate-100">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}
