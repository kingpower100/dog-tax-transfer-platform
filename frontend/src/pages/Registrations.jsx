import { useEffect, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";

const columns = [
  { key: "id", label: "Registration ID" },
  { key: "dog_id", label: "Dog ID" },
  { key: "assessment_year", label: "Assessment year" },
  { key: "dog_position", label: "Dog position" },
  { key: "annual_tax_amount", label: "Annual tax amount" },
  { key: "status", label: "Status" },
  { key: "deregistered_at", label: "Deregistered at" },
];

export default function Registrations({ selectedTenant }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    setError("");
    try {
      setRows(await apiGet("/registrierungen", selectedTenant));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [selectedTenant]);

  async function financeAction(registration, action) {
    setError("");
    setMessage("");
    try {
      await apiPost(`/registrations/${registration.id}/finance/${action}`, {
        ...demoContext({ role: "municipality_admin", municipalityId: registration.municipality_id }),
        notes,
        reason: notes || "Registration rejected by finance",
      });
      setMessage(`Registration ${action} completed.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const pendingRows = rows.filter((row) => row.status === "pending_finance_verification");

  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Municipality case management" title="Registrations" description={`Tenant-scoped tax registrations for ${selectedTenant}.`} />
      {message ? <AlertBox type="success">{message}</AlertBox> : null}
      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <SectionCard title="Pending Registration Reviews" description="Verify submitted dog registrations, approve activation and tax calculation, or reject with a reason.">
        <label>
          <span className="mb-2 block text-sm font-black text-slate-700">Finance notes</span>
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes or rejection reason" />
        </label>
        <div className="mt-4 grid gap-3">
          {pendingRows.map((registration) => (
            <div key={registration.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-slate-700">
                Registration #{registration.id} for dog #{registration.dog_id}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => financeAction(registration, "verify")}>Verify</button>
                <button className="primary" type="button" onClick={() => financeAction(registration, "approve")}>Approve</button>
                <button className="danger" type="button" onClick={() => financeAction(registration, "reject")}>Reject</button>
              </div>
            </div>
          ))}
          {!pendingRows.length ? <p className="text-sm font-semibold text-slate-500">No pending registration reviews.</p> : null}
        </div>
      </SectionCard>

      <DataTable columns={columns} rows={rows} error={error} emptyMessage="No registrations to display." onRefresh={load} />
    </section>
  );
}
