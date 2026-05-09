import DataTable from "../components/DataTable.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function TableCounts() {
  const rows = [];

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Platform administration"
        title="Database Counts"
        description="Row counts returned by a backend debug endpoint (to be connected next step)."
      />

      <DataTable
        title="Tables"
        subtitle="Shows how many records exist per table."
        columns={[
          { key: "name", label: "Table" },
          { key: "count", label: "Rows" },
        ]}
        rows={rows}
        emptyMessage="No table counts available yet."
        onRefresh={() => {}}
      />
    </section>
  );
}

