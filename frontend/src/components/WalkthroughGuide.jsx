const steps = [
  "Select HAMBURG as tenant.",
  "Open Tax Rules and show Hamburg rates.",
  "Open Transfer Dog and transfer chip 276098100001111 from HANNOVER to HAMBURG.",
  "Open Dogs with HANNOVER and show source status transferred.",
  "Open Dogs with HAMBURG and show target status active.",
  "Open Audit Logs and verify chain.",
];

export default function WalkthroughGuide() {
  return (
    <aside className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <span className="block text-xs font-black uppercase tracking-widest text-slate-500">Guided walkthrough</span>
        <h2 className="mb-4 text-lg font-black text-slate-950">Six-step walkthrough</h2>
      </div>
      <ol className="grid gap-3 lg:grid-cols-3">
        {steps.map((step) => (
          <li className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700" key={step}>{step}</li>
        ))}
      </ol>
    </aside>
  );
}
