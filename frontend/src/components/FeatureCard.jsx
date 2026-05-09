export default function FeatureCard({ icon, title, children }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-800 ring-1 ring-blue-100">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{children}</p>
    </article>
  );
}

