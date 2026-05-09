import DataTable from "../components/DataTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";

export default function MyRegistrations({ selectedChip }) {
  const rows = [];

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Citizen self-service"
        title="My Registrations"
        description="Tax registrations (cases) linked to your dog."
      />

      <SectionCard title="Registrations" description={selectedChip ? `Filter: chip number ${selectedChip}` : "No chip filter selected."}>
        <DataTable
          title="Registration cases"
          subtitle="Cases will be loaded tenant-aware from the API in the next step."
          columns={[
            { key: "id", label: "Registration ID" },
            { key: "chip_number", label: "Dog chip number" },
            { key: "status", label: "Status" },
            { key: "assessment_year", label: "Assessment year" },
            { key: "annual_tax_amount", label: "Annual tax amount" },
          ]}
          rows={rows}
          emptyMessage="No registrations available yet."
        />
      </SectionCard>
    </section>
  );
}

