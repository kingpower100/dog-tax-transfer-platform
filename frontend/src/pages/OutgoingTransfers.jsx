import { useEffect, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import InfoPanel from "../components/InfoPanel.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import TechnicalDetails from "../components/TechnicalDetails.jsx";

function tenantId(tenants, code) {
  return tenants.find((tenant) => tenant.code === code)?.id || null;
}

export default function OutgoingTransfers({ selectedTenant, tenants = [] }) {
  const municipalityId = tenantId(tenants, selectedTenant);
  const municipalityName = tenants.find((tenant) => tenant.id === municipalityId)?.name || selectedTenant;
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [document, setDocument] = useState(null);
  const [notes, setNotes] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!municipalityId) return;
    setError("");
    try {
      const [transferData, auditData] = await Promise.all([
        apiGet("/transfer-requests", null, {
          ...demoContext({ role: "municipality_admin", municipalityId }),
        }),
        apiGet("/audit-logs", null, {
          ...demoContext({ role: "municipality_admin", municipalityId }),
        }),
      ]);
      setRows(transferData);
      setAuditLogs(auditData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [municipalityId]);

  async function act(id, action) {
    setError("");
    setMessage("");
    try {
      const result = await apiPost(`/transfers/${id}/source-finance/${action}`, {
        ...demoContext({ role: "municipality_admin", municipalityId }),
        notes,
      });
      setSelected(result);
      setMessage(`Source finance ${action} completed.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reject(id) {
    setError("");
    try {
      const result = await apiPost(`/transfers/${id}/source-finance/reject`, {
        ...demoContext({ role: "municipality_admin", municipalityId, userId: 2000 + municipalityId }),
        reason: notes || "Rejected by source finance",
      });
      setSelected(result);
      setMessage("Source finance rejected the transfer.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewDocument(id) {
    setError("");
    try {
      setDocument(await apiGet(`/transfers/${id}/abmeldung-document`, null, demoContext({ role: "municipality_admin", municipalityId })));
    } catch (err) {
      setError(err.message);
    }
  }

  const outgoingRows = rows.filter((row) => row.from_municipality === municipalityName);
  const selectedLogs = selected
    ? auditLogs.filter((log) => String(log.transfer_request_id) === String(selected.id))
    : [];

  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Source municipality" title="Outgoing Transfers" description={`Transfers from ${municipalityName}.`} />

      <InfoPanel title="Source approval gate">
        The backend only allows source approval when current_municipality_id matches the transfer source and consent has already been stored.
      </InfoPanel>

      {message ? <AlertBox type="success">{message}</AlertBox> : null}
      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <SectionCard title="Outgoing Abmeldung requests" description="Verify the generated Abmeldung document, approve deregistration, or reject with finance notes.">
        <label>
          <span className="mb-2 block text-sm font-black text-slate-700">Finance notes</span>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes or rejection reason" />
        </label>
        <div className="grid gap-3">
          {outgoingRows.map((transfer) => (
            <div key={transfer.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-slate-700">
                #{transfer.id} {transfer.chip_number} to {transfer.to_municipality} - {transfer.status}
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="secondary" type="button" onClick={() => viewDocument(transfer.id)}>View document</button>
                <button type="button" disabled={transfer.status !== "abmeldung_generated"} onClick={() => act(transfer.id, "verify")}>Verify</button>
                <button className="primary" type="button" disabled={transfer.status !== "source_finance_verified"} onClick={() => act(transfer.id, "approve")}>Approve</button>
                <button className="danger" type="button" disabled={transfer.status === "completed"} onClick={() => reject(transfer.id)}>Reject</button>
              </div>
            </div>
          ))}
          {!outgoingRows.length ? <p className="text-sm font-semibold text-slate-500">No outgoing transfers visible.</p> : null}
        </div>
      </SectionCard>

      <DataTable
        title="Outgoing transfer records"
        columns={[
          { key: "id", label: "Transfer ID" },
          { key: "to_municipality" },
          { key: "chip_number" },
          { key: "status" },
          { key: "consent_given_at" },
          { key: "source_approved_at" },
        ]}
        rows={outgoingRows}
        onRefresh={load}
        emptyMessage="No outgoing transfers."
      />

      <SectionCard title="Selected transfer payload" description="The minimal payload is exposed only after source approval.">
        <TechnicalDetails data={selected?.transfer_payload || selected} title="Minimal payload" defaultOpen />
      </SectionCard>

      <SectionCard title="Abmeldung document">
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
          {document?.generated_content || "Select a transfer document to preview."}
        </pre>
      </SectionCard>

      <SectionCard title="Audit timeline" description="Visible only for transfers involving this municipality.">
        <DataTable
          columns={[
            { key: "timestamp" },
            { key: "action" },
            { key: "actor_role" },
            { key: "actor_municipality_id" },
          ]}
          rows={selectedLogs}
          emptyMessage="Select a transfer to inspect its audit trail."
        />
      </SectionCard>
    </section>
  );
}
