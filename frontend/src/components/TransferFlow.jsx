export default function TransferFlow({ source, target }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Source municipality</div>
          <div className="mt-1 text-base font-black text-slate-950">{source || "Source municipality"}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sends the dog and registration context once-only for your move.
          </p>
        </div>

        <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">-&gt;</div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-blue-900/70">Secure Transfer Layer</div>
          <div className="mt-1 text-base font-black text-slate-950">Transfer record + audit event</div>
          <p className="mt-2 text-sm leading-6 text-blue-950/80">
            Acts as the secure, tenant-aware handover between municipalities.
          </p>
        </div>

        <div className="hidden items-center justify-center lg:flex" aria-hidden="true">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">-&gt;</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Target municipality</div>
          <div className="mt-1 text-base font-black text-slate-950">{target || "Target municipality"}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Receives the case and can complete the new registration.
          </p>
        </div>
      </div>

      <div className="mt-3 text-xs font-semibold text-slate-500">
        Diagram shown for explanation only. This step keeps API calls as placeholders.
      </div>
    </div>
  );
}
