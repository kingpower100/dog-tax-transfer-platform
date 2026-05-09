import { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";
import DataTable from "../components/DataTable.jsx";
import PageHeader from "../components/PageHeader.jsx";

const columns = [
  { key: "id", label: "Dog ID" },
  { key: "chip_number", label: "Dog chip number" },
  { key: "name", label: "Name" },
  { key: "breed", label: "Breed" },
  { key: "dog_type", label: "Dog type" },
  { key: "status", label: "Status" },
];

export default function Dogs({ selectedTenant }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setRows(await apiGet("/hunde", selectedTenant));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [selectedTenant]);

  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Municipality case management" title="Dog Cases" description={`Tenant-scoped dog records for ${selectedTenant}.`} />
      <DataTable columns={columns} rows={rows} error={error} emptyMessage="No dog cases to display." onRefresh={load} />
    </section>
  );
}
