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
      setMessage("Transfer completed. Target registration is active and new tax is calculated.");
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
      <PageHeader eyebrow="Target municipality" title="Incoming Transfers" description={`Transfers into ${municipalityName}.`} />

      <InfoPanel title="Target acceptance gate">
        The target can only accept transfers after source release. Tax is calculated only during target acceptance, using the target municipality's rules.
      </InfoPanel>

      {message ? <AlertBox type="success">{message}</AlertBox> : null}
      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <SectionCard title="Incoming approved transfers" description="Verify the new address and target tax rules, approve the new registration, then complete the transfer.">
        <label>
          <span className="mb-2 block text-sm font-black text-slate-700">Finance notes</span>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes or rejection reason" />
        </label>
        <div className="grid gap-3">
          {incomingRows.map((transfer) => (
            <div key={transfer.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-slate-700">
                #{transfer.id} {transfer.chip_number} from {transfer.from_municipality} - {transfer.status}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={transfer.status !== "source_finance_approved"} onClick={() => act(transfer.id, "verify")}>Verify</button>
                <button className="primary" type="button" disabled={transfer.status !== "target_finance_verified"} onClick={() => act(transfer.id, "approve")}>Approve</button>
                <button className="secondary" type="button" disabled={transfer.status !== "target_finance_approved"} onClick={() => complete(transfer.id)}>Complete</button>
                <button className="danger" type="button" disabled={transfer.status === "completed"} onClick={() => reject(transfer.id)}>Reject</button>
              </div>
            </div>
          ))}
          {!incomingRows.length ? <p className="text-sm font-semibold text-slate-500">No incoming transfers visible.</p> : null}
        </div>
      </SectionCard>

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

      <SectionCard title="Completed transfer result" description="Target acceptance creates the local registration and calculates tax from the stored payload.">
        <TechnicalDetails data={selected?.tax_assessment || selected} title="Tax assessment" defaultOpen />
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
