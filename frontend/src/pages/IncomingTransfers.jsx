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

export default function IncomingTransfers({ selectedTenant, tenants = [] }) {
  const municipalityId = tenantId(tenants, selectedTenant);
  const municipalityName = tenants.find((tenant) => tenant.id === municipalityId)?.name || selectedTenant;
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notes, setNotes] = useState("");
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
          ...demoContext({ role: "municipality_admin", municipalityId, userId: 2000 + municipalityId }),
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
      const result = await apiPost(`/transfers/${id}/target-finance/${action}`, {
        ...demoContext({ role: "municipality_admin", municipalityId }),
        notes,
      });
      setSelected(result);
      setMessage(`Target finance ${action} completed.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function reject(id) {
    setError("");
    try {
      const result = await apiPost(`/transfers/${id}/target-finance/reject`, {
        ...demoContext({ role: "municipality_admin", municipalityId }),
        reason: notes || "Rejected by target finance",
      });
      setSelected(result);
      setMessage("Target finance rejected the transfer.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function complete(id) {
    setError("");
    try {
      const result = await apiPost(`/transfers/${id}/complete`, {
        ...demoContext({ role: "municipality_admin", municipalityId }),
      });
      setSelected(result);
      setMessage(
        "Transfer completed. Target registration is now active and the new dog tax has been calculated.",
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const incomingRows = rows.filter((row) => row.to_municipality === municipalityName);
  const selectedLogs = selected
    ? auditLogs.filter((log) => String(log.transfer_request_id) === String(selected.id))
    : [];

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Target municipality · Ummeldung workflow"
        title="Incoming Transfers"
        description={`New registrations (Anmeldung) arriving at ${municipalityName}. Verify and approve to create the new dog tax record and calculate tax.`}
        action={
          <button className="primary" type="button" onClick={load}>
            Refresh
          </button>
        }
      />

      <InfoPanel title="Target acceptance gate (§ Anmeldung)">
        The target can only accept transfers <strong>after</strong> the source municipality has released the
        case (source_finance_approved). Tax is calculated <strong>only</strong> during target acceptance, using
        this municipality's statutory rates — demonstrating how the same dog is taxed differently between cities.
      </InfoPanel>

      {message ? <AlertBox type="success">{message}</AlertBox> : null}
      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      {/* Transfer list */}
      <SectionCard
        title="Incoming Approved Transfers"
        description="Verify the new address and applicable tax rules, approve the new registration, then complete the transfer."
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
          {incomingRows.map((transfer) => {
            const isSelected = selected?.id === transfer.id;
            return (
              <div
                key={transfer.id}
                className={`rounded-xl border p-4 transition ${
                  isSelected ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-950">Transfer #{transfer.id}</span>
                      <StatusBadge value={transfer.status} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      Chip: {transfer.chip_number} from {transfer.from_municipality}
                    </p>
                    {transfer.annual_tax_amount != null ? (
                      <p className="mt-0.5 text-xs font-black text-emerald-700">
                        Calculated tax: €{transfer.annual_tax_amount}/year
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      label="Verify"
                      onClick={() => { setSelected(transfer); act(transfer.id, "verify"); }}
                      disabled={transfer.status !== "source_finance_approved"}
                      variant="secondary"
                    />
                    <ActionButton
                      label="Approve"
                      onClick={() => { setSelected(transfer); act(transfer.id, "approve"); }}
                      disabled={transfer.status !== "target_finance_verified"}
                      variant="primary"
                    />
                    <ActionButton
                      label="Complete transfer"
                      onClick={() => { setSelected(transfer); complete(transfer.id); }}
                      disabled={transfer.status !== "target_finance_approved"}
                      variant="primary"
                    />
                    <ActionButton
                      label="Reject"
                      onClick={() => reject(transfer.id)}
                      disabled={transfer.status === "completed" || transfer.status === "target_rejected"}
                      variant="danger"
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {!incomingRows.length ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              No incoming transfers visible for {municipalityName}. Transfers become visible here after the source municipality approves.
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
            source={selected.from_municipality}
            target={selected.to_municipality || municipalityName}
            transferId={selected.id}
          />
        </SectionCard>
      ) : null}

      <DataTable
        title="Incoming transfer records"
        columns={[
          { key: "id", label: "Transfer ID" },
          { key: "from_municipality" },
          { key: "chip_number" },
          { key: "status" },
          { key: "target_registration_id" },
          { key: "annual_tax_amount" },
          { key: "dog_position" },
        ]}
        rows={incomingRows}
        onRefresh={load}
        emptyMessage="No incoming transfers."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Tax assessment result"
          description="Target acceptance creates the local registration and calculates tax using this municipality's statutes."
        >
          <TechnicalDetails data={selected?.tax_assessment || selected} title="Tax assessment" defaultOpen />
        </SectionCard>

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
      </div>
    </section>
  );
}
