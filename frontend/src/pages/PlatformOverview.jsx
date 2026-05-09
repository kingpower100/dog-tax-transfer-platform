import { useEffect, useMemo, useState } from "react";
import { apiGet, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function PlatformOverview({ health, tenantsCount = 0 }) {
  const [transfers, setTransfers] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [transferData, municipalityData, auditData] = await Promise.all([
        apiGet("/transfer-requests", null, demoContext({ role: "platform_admin" })),
        apiGet("/mandanten"),
        apiGet("/audit-logs/verify", null, { current_role: "platform_admin" }),
      ]);
      setTransfers(transferData);
      setMunicipalities(municipalityData);
      setAudit(auditData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const transferCounts = useMemo(() => {
    return transfers.reduce((acc, transfer) => {
      acc[transfer.status] = (acc[transfer.status] || 0) + 1;
      return acc;
    }, {});
  }, [transfers]);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Platform administration"
        title="Platform Overview"
        description="All municipalities use the same transfer hub. Platform administration can inspect transfer metadata, tenant inventory, and audit-chain status."
        action={<button className="primary" type="button" onClick={load}>Refresh</button>}
      />

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Municipal tenants" value={municipalities.length || tenantsCount} helper="Shared SaaS tenant inventory" />
        <MetricCard label="Transfers" value={transfers.length} helper="Visible only to platform administration" />
        <MetricCard label="Completed" value={transferCounts.completed || 0} badge="completed" />
        <MetricCard label="Audit validity" value={audit?.valid ? "Valid" : "Invalid"} badge={audit?.valid ? "valid" : "invalid"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Architecture" description="The same transfer hub serves all municipalities.">
          <div className="grid gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800">
              React Frontend {"->"} FastAPI API {"->"} SQLite Database
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Role selection is local for this prototype. The backend validates transfer permissions with explicit context fields.
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Tenant inventory" description="All seeded municipalities share the same transfer hub.">
          <DataTable
            columns={[
              { key: "id", label: "ID" },
              { key: "name" },
              { key: "code" },
              { key: "country" },
            ]}
            rows={municipalities}
            emptyMessage="No municipalities loaded."
          />
        </SectionCard>
      </div>

      <SectionCard title="Transfer overview" description="Platform view of all transfer requests.">
        <DataTable
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
      </SectionCard>

      <SectionCard title="Backend status">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={health?.status || "offline"} />
          <StatusBadge value="platform_admin" />
          <StatusBadge value={audit?.valid ? "audit valid" : "audit invalid"} />
        </div>
      </SectionCard>
    </section>
  );
}
