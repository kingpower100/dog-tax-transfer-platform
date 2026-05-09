const roles = [
  { value: "citizen", label: "Citizen / Dog Owner" },
  { value: "officer", label: "Municipality Officer" },
  { value: "admin", label: "Platform Admin" },
];

export default function RoleSelector({ selectedRole, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">Access Area</span>
      <select
        className="h-10 min-w-48 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm"
        value={selectedRole}
        onChange={(event) => onChange(event.target.value)}
      >
        {roles.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </label>
  );
}
