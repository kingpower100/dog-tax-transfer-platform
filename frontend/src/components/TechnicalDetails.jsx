export default function TechnicalDetails({ title = "Technical details", data, defaultOpen = false }) {
  if (!data) return null;

  return (
    <details className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" open={defaultOpen}>
      <summary className="cursor-pointer bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100">
        {title}
      </summary>
      <pre className="max-h-[520px] overflow-auto bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
