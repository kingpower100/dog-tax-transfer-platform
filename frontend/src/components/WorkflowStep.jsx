export default function WorkflowStep({ number, title }) {
  return (
    <div className="group relative flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-sm font-black text-white shadow-sm">
        {number}
      </div>
      <p className="pt-2 text-sm font-black leading-6 text-slate-800">{title}</p>
    </div>
  );
}

