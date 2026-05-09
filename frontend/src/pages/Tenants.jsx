import DataTable from "../components/DataTable.jsx";
import PageHeader from "../components/PageHeader.jsx";

const columns = [
  { key: "id" },
  { key: "name" },
  { key: "code" },
  { key: "country" },
  { key: "created_at" },
];

export default function Tenants({ tenants }) {
  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Platform administration"
        title="Municipalities"
        description="Municipal tenants (tenants). In this step the list is UI-only; data will be loaded from the backend later."
      />
      <DataTable
        title="Tenants"
        subtitle="Used for routing and tenant isolation in the municipal access portal."
        columns={columns}
        rows={tenants || []}
        emptyMessage="No municipalities available yet."
        onRefresh={() => {}}
      />
    </section>
  );
}
