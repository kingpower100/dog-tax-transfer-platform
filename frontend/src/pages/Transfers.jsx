import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import DataTable from "../components/DataTable.jsx";
import LoadingState from "../components/LoadingState.jsx";
import PageHeader from "../components/PageHeader.jsx";

function transferColumns(direction, citizenMode) {
  if (direction === "incoming") {
    return [
      { key: "id", label: "Transfer ID" },
      { key: "from_municipality" },
      { key: "chip_number" },
      { key: "status" },
      { key: "target_registration_id" },
      { key: "completed_at" },
    ];
  }
  if (direction === "outgoing") {
    return [
      { key: "id", label: "Transfer ID" },
      { key: "to_municipality" },
      { key: "chip_number" },
      { key: "status" },
      { key: "source_registration_id" },
      { key: "completed_at" },
    ];
  }
  return [
    { key: "id", label: "Transfer ID" },
    { key: "from_municipality" },
    { key: "to_municipality" },
    { key: "chip_number" },
    { key: "status" },
    { key: citizenMode ? "completed_at" : "created_at" },
  ];
}

export default function Transfers({ selectedTenant, citizenMode, selectedChip, direction }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await apiGet("/transfers", selectedTenant));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [selectedTenant]);

  const filteredRows = useMemo(() => {
    let nextRows = rows;
    if (direction === "incoming") {
      nextRows = nextRows.filter((transfer) => transfer.to_municipality === selectedTenant);
    }
    if (direction === "outgoing") {
      nextRows = nextRows.filter((transfer) => transfer.from_municipality === selectedTenant);
    }
    if (citizenMode && selectedChip) {
      nextRows = nextRows.filter((transfer) => transfer.chip_number === selectedChip);
    }
    return nextRows;
  }, [rows, direction, selectedTenant, citizenMode, selectedChip]);

  const title =
    direction === "incoming"
      ? "Incoming Transfers"
      : direction === "outgoing"
        ? "Outgoing Transfers"
        : citizenMode
          ? "Transfer Status"
          : "Transfers";

  const emptyMessage =
    direction === "incoming"
      ? "No incoming transfers for this municipality."
      : direction === "outgoing"
        ? "No outgoing transfers for this municipality."
        : "No transfers found for this view.";

  return (
    <section>
      <PageHeader
        eyebrow={citizenMode ? "Citizen self-service" : "Transfer operations"}
        title={title}
        description={
          citizenMode
            ? "Follow the transfer requests for the selected dog chip number."
            : `Transfer records loaded through the selected municipality context ${selectedTenant}.`
        }
        action={<button onClick={load}>{loading ? "Refreshing..." : "Refresh"}</button>}
      />

      <AlertBox title="Transfer flow">
        Source municipality keeps the old record. Target municipality receives a new active case and recalculates tax.
      </AlertBox>

      {error ? <AlertBox type="error">{error}</AlertBox> : null}
      {loading ? (
        <LoadingState />
      ) : (
        <DataTable columns={transferColumns(direction, citizenMode)} rows={filteredRows} emptyMessage={emptyMessage} />
      )}
    </section>
  );
}
