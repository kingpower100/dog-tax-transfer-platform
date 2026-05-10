import { useEffect, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import InfoPanel from "../components/InfoPanel.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TechnicalDetails from "../components/TechnicalDetails.jsx";
import TransferFlow from "../components/TransferFlow.jsx";

function tenantId(tenants, code) {
  return tenants.find((tenant) => tenant.code === code)?.id || null;
}

function ActionButton({ label, onClick, disabled, variant = "secondary" }) {
  return (
    <button
      className={variant}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
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
      setDocument(
        await apiGet(
          `/transfers/${id}/abmeldung-document`,
          null,
          demoContext({ role: "municipality_admin", municipalityId }),
        ),
      );
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
      <PageHeader
        eyebrow="Source municipality · Ummeldung workflow"
        title="Outgoing Transfers"
        description={`Deregistration (Abmeldung) requests from ${municipalityName}. Verify and approve to release dog data to the target municipality.`}
        action={
          <button className="primary" type="button" onClick={load}>
            Refresh
          </button>
        }
      />

      <InfoPanel title="Source approval gate (§ Abmeldung)">
        The backend only allows source approval when <code className="rounded bg-blue-100 px-1 text-xs font-mono">current_municipality_id</code> matches
        the transfer source and citizen consent has already been recorded. Tax is recalculated by the target municipality
        using its local statutes.
      </InfoPanel>

      {message ? <AlertBox type="success">{message}</AlertBox> : null}
      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      {/* Transfer list */}
      <SectionCard
        title="Outgoing Abmeldung Requests"
        description="Verify the Abmeldung document, approve the deregistration, or reject with finance notes."
      >
        <label className="mb-4 block max-w-sm">
          <span className="mb-1.5 block text-sm font-black text-slate-700">Finance notes</span>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes or rejection reason"
          />
        </label>

        <div className="space-y-3">
          {outgoingRows.map((transfer) => {
            const isSelected = selected?.id === transfer.id;
            return (
              <div
                key={transfer.id}
                className={`rounded-xl border p-4 transition ${
                  isSelected ? "border-blue-300 bg-blue-50/50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-950">Transfer #{transfer.id}</span>
                      <StatusBadge value={transfer.status} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      Chip: {transfer.chip_number} → {transfer.to_municipality}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      label="View document"
                      onClick={() => {
                        setSelected(transfer);
                        viewDocument(transfer.id);
                      }}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Verify"
                      onClick={() => { setSelected(transfer); act(transfer.id, "verify"); }}
                      disabled={transfer.status !== "abmeldung_generated"}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Approve"
                      onClick={() => { setSelected(transfer); act(transfer.id, "approve"); }}
                      disabled={transfer.status !== "source_finance_verified"}
                      variant="primary"
                    />
                    <ActionButton
                      label="Reject"
                      onClick={() => reject(transfer.id)}
                      disabled={transfer.status === "completed" || transfer.status === "source_rejected"}
                      variant="danger"
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {!outgoingRows.length ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              No outgoing transfers visible for {municipalityName}.
            </p>
          ) : null}
        </div>
      </SectionCard>

      {/* Visual transfer flow for selected transfer */}
      {selected ? (
        <SectionCard
          title={`Transfer Flow — #${selected.id}`}
          description="Visual diagram and tamper-proof audit timeline for the selected transfer."
        >
          <TransferFlow
            source={selected.from_municipality || municipalityName}
            target={selected.to_municipality}
            transferId={selected.id}
          />
        </SectionCard>
      ) : null}

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

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Abmeldung document"
          description="Generated deregistration document for the selected transfer."
        >
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-950 p-4 text-sm text-slate-100">
            {document?.generated_content || "Select a transfer and click 'View document' to preview the Abmeldung."}
          </pre>
        </SectionCard>

        <SectionCard
          title="Selected transfer payload"
          description="The minimal data payload exposed after source approval."
        >
          <TechnicalDetails data={selected?.transfer_payload || selected} title="Minimal payload" defaultOpen />
        </SectionCard>
      </div>

      <SectionCard
        title="Audit timeline"
        description="Visible only for transfers involving this municipality."
      >
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
