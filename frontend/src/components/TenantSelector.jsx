const FALLBACK_TENANTS = ["HAMBURG", "BERLIN", "HANNOVER", "FREIBURG", "LEVERKUSEN"];

export default function TenantSelector({ selectedTenant, onChange, tenants = [] }) {
  const codes = tenants.length
    ? tenants.map((tenant) => tenant.code || tenant).filter(Boolean)
    : FALLBACK_TENANTS;
  const uniqueCodes = [...new Set(codes)];

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">Tenant</span>
      <select
        className="h-10 min-w-40 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm"
        value={selectedTenant}
        onChange={(event) => onChange(event.target.value)}
      >
        {uniqueCodes.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </label>
  );
}
