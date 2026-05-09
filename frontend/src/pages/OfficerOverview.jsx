import AlertBox from "../components/AlertBox.jsx";
import InfoPanel from "../components/InfoPanel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";

export default function OfficerOverview({ selectedTenant }) {
  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Municipality workspace"
        title="Overview"
        description="Only records for the selected municipality are visible."
      />

      <AlertBox title="Visibility notice">Only records for the selected municipality are visible.</AlertBox>

      <SectionCard title="Municipality" description="Current municipal tenant context.">
        <div className="text-sm font-semibold text-slate-700">
          Selected municipality: <span className="font-black text-slate-950">{selectedTenant}</span>
        </div>
      </SectionCard>

      <InfoPanel title="Municipality workspace">
        Source officers verify existing registrations and approve release. Destination officers receive approved transfer data, create the local registration, and calculate tax using their municipality's rules.
      </InfoPanel>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active dogs" value={0} helper="Will be loaded tenant-aware from /hunde." />
        <MetricCard label="Registrations" value={0} helper="Will be loaded from /registrierungen." />
        <MetricCard label="Incoming transfers" value={0} helper="Tenant-scoped transfer records." />
        <MetricCard label="Outgoing transfers" value={0} helper="Tenant-scoped transfer records." />
        <MetricCard label="Audit status" value="Unknown" badge="pending" helper="Verification will be wired to backend later." />
      </div>
    </section>
  );
}

