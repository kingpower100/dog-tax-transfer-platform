export default function StatusBadge({ value }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  const raw = String(value);
  const normalized = raw.trim().toLowerCase().replaceAll("_", " ");

  const tone = (() => {
    // Terminal success states
    if (["online", "ok", "valid", "completed", "active", "transferred", "received by target", "released by source"].includes(normalized)) {
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    }

    // Approval / approved
    if (["approved", "source finance approved", "target finance approved"].includes(normalized)) {
      return "bg-blue-50 text-blue-800 ring-blue-200";
    }

    // In-review / verification steps
    if (["abmeldung generated", "source finance verified", "target finance verified", "in review"].includes(normalized)) {
      return "bg-indigo-50 text-indigo-800 ring-indigo-200";
    }

    // Consent / pending source approval
    if (["requires consent", "consent given", "citizen submitted", "pending source approval"].includes(normalized)) {
      return "bg-teal-50 text-teal-800 ring-teal-200";
    }

    // Draft / pending
    if (["pending", "draft"].includes(normalized)) {
      return "bg-amber-50 text-amber-900 ring-amber-200";
    }

    // Rejected / error
    if (["rejected", "source rejected", "target rejected", "invalid", "offline"].includes(normalized)) {
      return "bg-red-50 text-red-800 ring-red-200";
    }

    // Cancelled / deregistered / neutral
    if (["cancelled", "deregistered", "normal"].includes(normalized)) {
      return "bg-slate-100 text-slate-700 ring-slate-200";
    }

    // Listenhund (dangerous breed – warning)
    if (["listenhund"].includes(normalized)) {
      return "bg-orange-50 text-orange-800 ring-orange-200";
    }

    // Target accepted / finalizing
    if (["target accepted"].includes(normalized)) {
      return "bg-cyan-50 text-cyan-800 ring-cyan-200";
    }

    // Citizen service / role badges
    if (["citizen service", "municipality officer", "platform admin"].includes(normalized)) {
      return "bg-blue-50 text-blue-700 ring-blue-200";
    }

    return "bg-slate-100 text-slate-700 ring-slate-200";
  })();

  return (
    <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize ring-1 ${tone}`}>
      {raw.replaceAll("_", " ")}
    </span>
  );
}
