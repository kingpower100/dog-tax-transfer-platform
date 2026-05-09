import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import LoadingState from "../components/LoadingState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

function tableCount(tables, key) {
  return tables?.tables?.[key] ?? 0;
}

function countActive(rows) {
  return rows.filter((row) => String(row.status).toLowerCase() === "active").length;
}

export default function Dashboard({
  selectedTenant,
  selectedRole,
  selectedChip,
  setSelectedChip,
  compact,
  tenants = [],
  health,
}) {
  const [tables, setTables] = useState(null);
  const [audit, setAudit] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const requests = [apiGet("/debug/tables"), apiGet("/audit-logs/verify")];
        if (selectedRole !== "admin") {
          requests.push(apiGet("/hunde", selectedTenant));
          requests.push(apiGet("/transfers", selectedTenant));
          requests.push(apiGet("/registrierungen", selectedTenant));
        }

        const [tableData, auditData, dogData = [], transferData = [], registrationData = []] =
          await Promise.all(requests);

        if (active) {
          setTables(tableData);
          setAudit(auditData);
          setDogs(dogData);
          setTransfers(transferData);
          setRegistrations(registrationData);
          if (!selectedChip && dogData.length && setSelectedChip) {
            setSelectedChip(dogData[0].chip_number);
          }
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [selectedTenant, selectedRole]);

  const tableRows = useMemo(() => {
    if (!tables?.tables) return [];
    return Object.entries(tables.tables).map(([name, count]) => ({ name, count }));
  }, [tables]);

  const citizenDogs = selectedChip ? dogs.filter((dog) => dog.chip_number === selectedChip) : dogs;
  const citizenDogIds = citizenDogs.map((dog) => dog.id);
  const citizenRegistrations = registrations.filter((registration) => citizenDogIds.includes(registration.dog_id));
  const citizenTransfers = transfers.filter((transfer) => !selectedChip || transfer.chip_number === selectedChip);
  const incomingTransfers = transfers.filter((transfer) => transfer.to_municipality === selectedTenant);
  const outgoingTransfers = transfers.filter((transfer) => transfer.from_municipality === selectedTenant);
  const municipalityName = tenants.find((tenant) => tenant.code === selectedTenant)?.name || selectedTenant;

  if (compact === "tables") {
    return (
      <section>
        <PageHeader
          eyebrow="Platform administration"
          title="Database Counts"
          description="Row counts returned by the backend debug endpoint. This is backend data, not a frontend fixture."
        />
        {error ? <AlertBox type="error">{error}</AlertBox> : null}
        {loading ? <LoadingState /> : <DataTable columns={[{ key: "name" }, { key: "count" }]} rows={tableRows} />}
      </section>
    );
  }

  if (selectedRole === "citizen") {
    return (
      <section>
        <PageHeader
          eyebrow="Citizen self-service"
          title="Welcome to the dog tax transfer service"
          description="Use this service when you move to another municipality. Your dog data can be transferred once-only instead of being entered again."
        />
        {error ? <AlertBox type="error">{error}</AlertBox> : null}
        {loading ? <LoadingState /> : null}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title="Citizen record context"
            description="Data is filtered by selected chip number until identity-based access is connected."
          >
            <label className="block max-w-lg">
              <span className="mb-2 block text-sm font-black text-slate-700">Selected dog chip number</span>
              <select value={selectedChip} onChange={(event) => setSelectedChip(event.target.value)}>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.chip_number}>
                    {dog.chip_number} - {dog.name}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-sm text-slate-500">The chip number identifies the dog record in the backend.</span>
            </label>
          </SectionCard>

          <SectionCard title="Trust signal" description="All data shown here flows through FastAPI and the tenant-aware backend.">
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={health?.status || "offline"} />
              <StatusBadge value={audit?.valid ? "valid audit" : "unknown"} />
            </div>
          </SectionCard>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard label="My dogs" value={citizenDogs.length} helper="Filtered from /hunde by chip number" />
          <MetricCard label="Active registrations" value={countActive(citizenRegistrations)} helper="Current tax cases for the selected dog" />
          <MetricCard label="Open/completed transfers" value={citizenTransfers.length} helper="Transfer records involving the selected dog" />
        </div>
      </section>
    );
  }

  if (selectedRole === "admin") {
    return (
      <section>
        <PageHeader
          eyebrow="Operator console"
          title="Platform Overview"
          description="A compact operational view of tenants, backend health, database counts, and audit integrity."
        />
        {error ? <AlertBox type="error">{error}</AlertBox> : null}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Backend health" value={health?.status || "offline"} badge={health?.status || "offline"} />
          <MetricCard label="Municipal tenants" value={tenants.length || tableCount(tables, "municipalities")} helper="Loaded from /mandanten" />
          <MetricCard label="Audit validity" value={audit ? (audit.valid ? "Valid" : "Invalid") : "Loading"} badge={audit?.valid ? "valid" : "unknown"} />
          <MetricCard label="Transfer records" value={tableCount(tables, "transfer_requests")} helper="From /debug/tables" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <SectionCard title="Architecture" description="The frontend is only the service interface. It does not read SQLite directly.">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800">
              {"Frontend -> FastAPI -> SQLAlchemy -> SQLite"}
            </div>
          </SectionCard>
          <SectionCard title="Table counts">
            {loading ? <LoadingState /> : <DataTable columns={[{ key: "name" }, { key: "count" }]} rows={tableRows} />}
          </SectionCard>
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        eyebrow="Municipality workspace"
        title={`${municipalityName} Overview`}
        description="Only records for the selected municipality are visible. Use this workspace to inspect dog cases, registrations, transfers, tax rules, and audit events."
      />
      {error ? <AlertBox type="error">{error}</AlertBox> : null}
      {loading ? <LoadingState /> : null}
      <AlertBox title="Important notice">Only records for the selected municipality are visible.</AlertBox>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active dogs" value={countActive(dogs)} helper="Tenant-scoped /hunde records" />
        <MetricCard label="Registrations" value={registrations.length} helper="Tax cases in this municipality" />
        <MetricCard label="Incoming transfers" value={incomingTransfers.length} helper="to_municipality equals selected tenant" />
        <MetricCard label="Outgoing transfers" value={outgoingTransfers.length} helper="from_municipality equals selected tenant" />
        <MetricCard label="Audit status" value={audit ? (audit.valid ? "Valid" : "Invalid") : "Loading"} badge={audit?.valid ? "valid" : "unknown"} />
        <MetricCard label="Backend" value={health?.status || "offline"} badge={health?.status || "offline"} />
      </div>
    </section>
  );
}
