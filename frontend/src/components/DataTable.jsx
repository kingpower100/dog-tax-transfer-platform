import { useMemo, useState } from "react";
import AlertBox from "./AlertBox.jsx";
import EmptyState from "./EmptyState.jsx";
import LoadingState from "./LoadingState.jsx";
import StatusBadge from "./StatusBadge.jsx";

const defaultLabels = {
  transfer_id: "Transfer ID",
  transfer_request_id: "Transfer ID",
  from_municipality: "From",
  to_municipality: "To",
  chip_number: "Dog chip number",
  status: "Status",
  target_registration_id: "Target registration",
  source_registration_id: "Source registration",
  completed_at: "Completed at",
  created_at: "Created at",
  timestamp: "Timestamp",
  actor: "Actor",
  actor_role: "Actor",
  municipality: "Municipality",
  actor_municipality_id: "Municipality",
  action: "Action",
};

function normalizeString(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatCell(value, key) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  if (key === "source_url") {
    return (
      <a className="font-semibold" href={String(value)} target="_blank" rel="noreferrer">
        Legal source
      </a>
    );
  }

  if (key === "details_json") {
    return <span className="text-slate-500">Hidden in technical details</span>;
  }

  if (key === "previous_hash" || key === "current_hash") {
    const v = String(value);
    return (
      <span className="inline-flex items-center gap-2">
        <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{v.slice(0, 10)}…</code>
        <span className="text-xs text-slate-500">{v.length} chars</span>
      </span>
    );
  }

  if (key.includes("_at") || key === "timestamp") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  if (["status", "dog_type", "rule_type", "action"].includes(key)) {
    return <StatusBadge value={value} />;
  }

  return String(value);
}

export default function DataTable({
  title,
  subtitle,
  columns = [],
  rows = [],
  loading = false,
  error = "",
  emptyMessage = "No data available.",
  onRefresh,
  initialSearch = "",
}) {
  const [search, setSearch] = useState(initialSearch);

  const normalized = normalizeString(search);
  const filteredRows = useMemo(() => {
    if (!normalized) return rows;
    return rows.filter((row) => normalizeString(JSON.stringify(row)).includes(normalized));
  }, [rows, normalized]);

  const table = (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[980px] w-full border-collapse">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-600"
                key={column.key}
                scope="col"
              >
                {column.label || defaultLabels[column.key] || column.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, index) => (
            <tr className="odd:bg-white even:bg-slate-50/70 hover:bg-blue-50/70" key={row.id ?? index}>
              {columns.map((column) => (
                <td className="border-b border-slate-100 px-4 py-3 align-top text-sm text-slate-700" key={column.key}>
                  {formatCell(row[column.key], column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {(title || subtitle || onRefresh) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h3 className="text-base font-black text-slate-950">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <label className="relative">
                <span className="sr-only">Search table</span>
                <input
                  className="h-10 w-64 max-w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {onRefresh ? (
                <button
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-black text-slate-800 hover:bg-slate-50"
                  type="button"
                  onClick={onRefresh}
                >
                  Refresh
                </button>
              ) : null}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {loading ? "Loading…" : `${filteredRows.length} result${filteredRows.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {error ? <AlertBox type="error" title="Could not load data">{error}</AlertBox> : null}
        {loading ? <LoadingState /> : null}
        {!loading && filteredRows.length === 0 ? <EmptyState title={emptyMessage} /> : null}
        {!loading && filteredRows.length > 0 ? table : null}
      </div>
    </section>
  );
}
