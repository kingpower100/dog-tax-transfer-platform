import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("de-DE");
}

export default function TransferFlow({ source, target, transferId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTimeline() {
      if (!transferId) return;
      setLoading(true);
      try {
        const data = await apiGet(`/transfers/${transferId}/timeline`);
        setTimeline(data || []);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [transferId]);

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

      {transferId && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <h4 className="text-sm font-black text-slate-950">Audit Timeline (Evidence)</h4>
          {loading ? (
            <p className="mt-2 text-xs font-semibold text-slate-500 text-center">Loading timeline...</p>
          ) : timeline.length ? (
            <div className="mt-4 space-y-4">
              {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-600 ring-4 ring-white">
                      {index + 1}
                    </div>
                    {index !== timeline.length - 1 && (
                      <div className="mt-1 h-full w-px bg-slate-200" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="text-xs font-black text-slate-950">{event.action.replaceAll("_", " ")}</div>
                    <div className="mt-0.5 text-[10px] font-semibold text-slate-500">{formatDate(event.timestamp)}</div>
                    <div className="mt-1 font-mono text-[10px] text-slate-400">Hash: {event.current_hash.slice(0, 8)}...</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs font-semibold text-slate-500">No audit events found for this transfer.</p>
          )}
        </div>
      )}

      <div className="mt-3 text-xs font-semibold text-slate-500">
        Diagram and audit trail based on real-time backend events.
      </div>
    </div>
  );
}
