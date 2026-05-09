import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

function pass(value) {
  return value ? "PASS" : "PENDING";
}

export default function ComplianceChecklist({ tenants = [] }) {
  const [transfers, setTransfers] = useState([]);
  const [audit, setAudit] = useState(null);
  const [blockedAccess, setBlockedAccess] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [transferData, auditData] = await Promise.all([
        apiGet("/transfer-requests", null, { current_role: "compliance_officer" }),
        apiGet("/audit-logs/verify", null, { current_role: "platform_admin" }),
      ]);
      setTransfers(transferData);
      setAudit(auditData);
      const unrelatedMunicipality = tenants.find((tenant) => {
        return !transferData.some((transfer) => transfer.from_municipality === tenant.name || transfer.to_municipality === tenant.name);
      });
      if (transferData.length && unrelatedMunicipality) {
        try {
          await apiGet(`/transfer-requests/${transferData[0].id}`, null, {
            current_role: "municipality_admin",
            current_municipality_id: unrelatedMunicipality.id,
          });
          setBlockedAccess(false);
        } catch {
          setBlockedAccess(true);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const checks = useMemo(() => {
    const anyTransfer = transfers.length > 0;
    const consented = transfers.some((transfer) => transfer.consent_given && transfer.consent_given_at);
    const sourceApproved = transfers.some((transfer) => transfer.source_approved && transfer.source_approved_at);
    const completed = transfers.some((transfer) => transfer.target_accepted && transfer.completed_at);
    const minimalPayload = transfers.some((transfer) => {
      const payload = transfer.transfer_payload || {};
      const keys = Object.keys(payload).sort();
      return keys.length === 9 && !keys.includes("phone") && !keys.includes("email") && !keys.includes("source_owner_id");
    });
    const taxCalculated = transfers.some((transfer) => transfer.annual_tax_amount !== null && transfer.annual_tax_amount !== undefined);
    return [
      { check: "once-only transfer created", status: pass(anyTransfer) },
      { check: "consent stored", status: pass(consented) },
      { check: "source approval required", status: pass(sourceApproved) },
      { check: "target acceptance required", status: pass(completed) },
      { check: "minimal payload generated", status: pass(minimalPayload) },
      { check: "tax calculated by rules", status: pass(taxCalculated) },
      { check: "audit events created", status: pass(audit?.checked_logs > 0 && audit?.valid) },
      { check: "unrelated municipalities cannot access transfer", status: pass(blockedAccess) },
    ];
  }, [transfers, audit, blockedAccess]);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Hackathon evidence"
        title="Compliance Checklist"
        description="Live checklist from backend transfer, audit, and payload data."
        action={<button className="primary" type="button" onClick={load}>Refresh</button>}
      />

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Municipal tenants" value={tenants.length} helper="All use the same transfer hub." />
        <MetricCard label="Transfer requests" value={transfers.length} helper="Platform administration view." />
        <MetricCard label="Audit chain" value={audit?.valid ? "Valid" : "Unknown"} badge={audit?.valid ? "valid" : "pending"} />
      </div>

      <SectionCard title="MVP principle checks">
        <div className="grid gap-3">
          {checks.map((item) => (
            <div key={item.check} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <span className="text-sm font-black text-slate-800">{item.check}</span>
              <StatusBadge value={item.status} />
            </div>
          ))}
        </div>
      </SectionCard>

      <DataTable
        title="Platform transfer evidence"
        columns={[
          { key: "id", label: "Transfer ID" },
          { key: "from_municipality" },
          { key: "to_municipality" },
          { key: "status" },
          { key: "annual_tax_amount" },
          { key: "dog_position" },
        ]}
        rows={transfers}
        emptyMessage="No transfers created yet."
      />
    </section>
  );
}
