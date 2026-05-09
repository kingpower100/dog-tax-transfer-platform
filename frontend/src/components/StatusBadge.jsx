export default function StatusBadge({ value }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  const raw = String(value);
  const normalized = raw.trim().toLowerCase().replaceAll("_", " ");

  const tone = (() => {
    if (["online", "ok", "valid", "completed", "active"].includes(normalized)) {
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    }

    if (["approved"].includes(normalized)) {
      return "bg-blue-50 text-blue-800 ring-blue-200";
    }

    if (["transferred", "received by target", "released by source"].includes(normalized)) {
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    }

    if (["requires consent"].includes(normalized)) {
      return "bg-teal-50 text-teal-800 ring-teal-200";
    }

    if (["pending", "draft"].includes(normalized)) {
      return "bg-amber-50 text-amber-900 ring-amber-200";
    }

    if (["rejected", "invalid", "offline"].includes(normalized)) {
      return "bg-red-50 text-red-800 ring-red-200";
    }

    if (["normal"].includes(normalized)) {
      return "bg-slate-100 text-slate-700 ring-slate-200";
    }

    if (["listenhund"].includes(normalized)) {
      return "bg-amber-50 text-amber-900 ring-amber-200";
    }

    if (normalized === "deregistered") {
      return "bg-slate-100 text-slate-700 ring-slate-200";
    }

    return "bg-slate-100 text-slate-700 ring-slate-200";
  })();

  return (
    <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize ring-1 ${tone}`}>
      {raw.replaceAll("_", " ")}
    </span>
  );
}
