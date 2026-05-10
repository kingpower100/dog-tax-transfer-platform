import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import TechnicalDetails from "../components/TechnicalDetails.jsx";

const columns = [
  { key: "action" },
  { key: "timestamp" },
  { key: "actor_role" },
  { key: "actor_municipality_id" },
  { key: "transfer_request_id" },
  { key: "current_hash" },
];

export default function AuditLogs({ mode = "logs", selectedTenant, tenants = [] }) {
  const municipalityId = tenants.find((tenant) => tenant.code === selectedTenant)?.id || null;
  const [rows, setRows] = useState([]);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState("");

  async function loadLogs() {
    setError("");
    try {
      setRows(
        await apiGet("/audit-logs", selectedTenant, {
          current_role: mode === "verify" ? "platform_admin" : "municipality_admin",
          current_municipality_id: municipalityId,
        }),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function verify() {
    setError("");
    try {
      setVerification(await apiGet("/audit-logs/verify", selectedTenant, { current_role: "platform_admin" }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadLogs();
    if (mode === "verify") verify();
  }, [mode, municipalityId]);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Audit trail"
        title={mode === "verify" ? "Audit Verification" : "Audit Trail"}
        description={mode === "verify" ? "Platform administration verifies the full hash chain." : `Municipality-scoped audit events for ${selectedTenant}.`}
        action={<button className="primary" type="button" onClick={mode === "verify" ? verify : loadLogs}>{mode === "verify" ? "Verify" : "Refresh"}</button>}
      />

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      {mode === "verify" && verification ? (
        <SectionCard title="Hash-chain verification">
          <MetricCard
            label="Audit status"
            value={verification.valid ? "Valid" : "Invalid"}
            badge={verification.valid ? "valid" : "invalid"}
            helper={`${verification.checked_logs} records checked`}
          />
          <TechnicalDetails data={verification} title="Verification response" />
        </SectionCard>
      ) : null}

      {mode !== "verify" ? (
        <DataTable
          title="Visible audit events"
          subtitle="Backend filters logs to the selected municipality or involved transfers."
          columns={columns}
          rows={rows}
          emptyMessage="No audit logs visible for this municipality."
          onRefresh={loadLogs}
        />
      ) : null}
    </section>
  );
}
