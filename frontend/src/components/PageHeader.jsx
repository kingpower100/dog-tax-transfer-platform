export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <span className="text-xs font-black uppercase tracking-wide text-blue-800">{eyebrow}</span> : null}
        <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-2 text-base leading-7 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
