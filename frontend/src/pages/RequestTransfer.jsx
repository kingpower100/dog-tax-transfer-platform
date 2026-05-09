import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TechnicalDetails from "../components/TechnicalDetails.jsx";

const DEMO_CITIZEN_USER_ID = 1001;

function tenantId(tenants, code) {
  return tenants.find((tenant) => tenant.code === code)?.id || null;
}

export default function RequestTransfer({ selectedTenant, tenants = [], selectedChip }) {
  const tenantCodes = useMemo(() => tenants.map((tenant) => tenant.code).filter(Boolean), [tenants]);
  const [sourceCode, setSourceCode] = useState(selectedTenant || "HAMBURG");
  const [targetCode, setTargetCode] = useState("BERLIN");
  const [chipNumber, setChipNumber] = useState(selectedChip || "");
  const [sourceDogs, setSourceDogs] = useState([]);
  const [transfer, setTransfer] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sourceMunicipalityId = tenantId(tenants, sourceCode);
  const targetMunicipalityId = tenantId(tenants, targetCode);

  async function loadSourceDogs() {
    if (!sourceCode) return;
    try {
      setSourceDogs(await apiGet("/hunde", sourceCode));
    } catch {
      setSourceDogs([]);
    }
  }

  async function loadTransfers() {
    if (!sourceMunicipalityId) return;
    try {
      setTransfers(
        await apiGet("/transfer-requests", null, {
          ...demoContext({
            role: "citizen",
            municipalityId: sourceMunicipalityId,
            userId: DEMO_CITIZEN_USER_ID,
          }),
        }),
      );
    } catch {
      setTransfers([]);
    }
  }

  useEffect(() => {
    loadSourceDogs();
  }, [sourceCode]);

  useEffect(() => {
    if (targetCode === sourceCode) {
      const fallback = tenantCodes.find((code) => code !== sourceCode);
      if (fallback) setTargetCode(fallback);
    }
  }, [sourceCode, targetCode, tenantCodes]);

  useEffect(() => {
    loadTransfers();
  }, [sourceMunicipalityId]);

  useEffect(() => {
    if (sourceDogs.length && !sourceDogs.some((dog) => dog.chip_number === chipNumber)) {
      setChipNumber(sourceDogs[0].chip_number);
    } else if (!sourceDogs.length) {
      setChipNumber("");
    }
  }, [sourceDogs, chipNumber]);

  async function createRequest() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const created = await apiPost("/transfer-requests", {
        ...demoContext({
          role: "citizen",
          municipalityId: sourceMunicipalityId,
          userId: DEMO_CITIZEN_USER_ID,
        }),
        from_municipality_id: sourceMunicipalityId,
        to_municipality_id: targetMunicipalityId,
        chip_number: chipNumber,
      });
      setTransfer(created);
      setMessage("Draft transfer request created. Consent is still required before the source municipality can approve it.");
      await loadTransfers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function giveConsent() {
    if (!transfer?.id) return;
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const consented = await apiPost(`/transfer-requests/${transfer.id}/consent`, {
        ...demoContext({
          role: "citizen",
          municipalityId: sourceMunicipalityId,
          userId: DEMO_CITIZEN_USER_ID,
        }),
      });
      setTransfer(consented);
      setMessage("Consent stored. The request is now pending source municipality approval.");
      await loadTransfers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Citizen self-service"
        title="Create Once-Only Transfer"
        description="The citizen identifies the existing dog record, creates one transfer request, and gives explicit consent. Dog and owner data are reused by the backend."
      />

      {message ? <AlertBox type="success">{message}</AlertBox> : null}
      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Citizen request" description="Demo context: current_role=citizen, current_user_id=1001.">
          <div className="grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">Source municipality</span>
              <select value={sourceCode} onChange={(event) => setSourceCode(event.target.value)}>
                {tenantCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">Target municipality</span>
              <select value={targetCode} onChange={(event) => setTargetCode(event.target.value)}>
                {tenantCodes.filter((code) => code !== sourceCode).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">Select existing dog</span>
              <select value={chipNumber} onChange={(event) => setChipNumber(event.target.value)}>
                <option value="">Choose an active source dog</option>
                {sourceDogs.map((dog) => (
                  <option key={dog.id} value={dog.chip_number}>
                    {dog.chip_number} - {dog.name} ({dog.breed})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={createRequest} disabled={loading || !sourceMunicipalityId || !targetMunicipalityId || !chipNumber}>
                Create draft request
              </button>
              <button className="secondary" type="button" onClick={giveConsent} disabled={loading || transfer?.status !== "draft"}>
                Give consent
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Workflow status" description="Consent moves the transfer from draft to pending_source_approval.">
          {transfer ? (
            <div className="space-y-3">
              <StatusBadge value={transfer.status} />
              <div className="grid gap-3 text-sm font-semibold text-slate-700 md:grid-cols-3">
                <div>Consent: {transfer.consent_given ? "stored" : "not yet"}</div>
                <div>Source approval: {transfer.source_approved ? "done" : "pending"}</div>
                <div>Target acceptance: {transfer.target_accepted ? "done" : "pending"}</div>
              </div>
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-slate-500">Current tax result</div>
                  <div className="mt-2 text-sm font-semibold text-slate-700">
                    {transfer.annual_tax_amount != null ? `${transfer.annual_tax_amount} EUR` : "Calculated after target acceptance"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-slate-500">Dog position</div>
                  <div className="mt-2 text-sm font-semibold text-slate-700">
                    {transfer.dog_position != null ? `Position ${transfer.dog_position}` : "Calculated after target acceptance"}
                  </div>
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Status timeline</div>
                {[
                  ["draft", transfer.created_at],
                  ["pending_source_approval", transfer.consent_given_at],
                  ["released_by_source", transfer.source_approved_at],
                  ["completed", transfer.completed_at],
                  ["rejected", transfer.rejected_at],
                ].map(([status, at]) => (
                  <div key={status} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-slate-700">{String(status).replaceAll("_", " ")}</span>
                    <span className="text-slate-500">{at ? new Date(at).toLocaleString() : "-"}</span>
                  </div>
                ))}
              </div>
              <TechnicalDetails data={transfer} title="Technical details: transfer request" defaultOpen />
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-600">No transfer request created in this session yet.</p>
          )}
        </SectionCard>
      </div>

      <DataTable
        title="Existing source dogs"
        subtitle="Loaded from the selected source municipality. The citizen selects one existing record instead of re-entering dog data."
        columns={[
          { key: "chip_number" },
          { key: "name" },
          { key: "breed" },
          { key: "dog_type" },
          { key: "status" },
        ]}
        rows={sourceDogs}
        emptyMessage="No source dogs loaded for this municipality."
        onRefresh={loadSourceDogs}
      />

      <DataTable
        title="Transfer requests visible to source municipality"
        columns={[
          { key: "id", label: "Transfer ID" },
          { key: "from_municipality" },
          { key: "to_municipality" },
          { key: "chip_number" },
          { key: "status" },
          { key: "consent_given_at" },
        ]}
        rows={transfers}
        emptyMessage="No transfer requests visible yet."
        onRefresh={loadTransfers}
      />
    </section>
  );
}
