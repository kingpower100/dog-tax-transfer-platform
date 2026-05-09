import DataTable from "../components/DataTable.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";

export default function MyDogs({ selectedChip }) {
  const rows = [];

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Citizen self-service"
        title="My Dogs"
        description="Your dogs are shown here. The list is filtered by dog chip number until identity-based access is connected."
      />

      <SectionCard
        title="Dogs"
        description={selectedChip ? `Filter: chip number ${selectedChip}` : "No chip filter selected."}
      >
        <DataTable
          title="Dog records"
          subtitle="The backend connection can populate this table with citizen-authorized dog records."
          columns={[
            { key: "chip_number", label: "Dog chip number" },
            { key: "name", label: "Name" },
            { key: "breed", label: "Breed" },
            { key: "dog_type", label: "Dog type" },
            { key: "status", label: "Status" },
          ]}
          rows={rows}
          emptyMessage="No dogs available yet."
        />
      </SectionCard>
    </section>
  );
}

