import StatusBadge from "./StatusBadge.jsx";
import { LandmarkIcon } from "./Icons.jsx";

export default function AppHeader({
  health,
  pages,
  activePage,
  setActivePage,
  selectedRole,
  selectedTenant,
  setShowLanding,
}) {
  const roleLabel = selectedRole === "CITIZEN" ? "Citizen" : "Municipality Officer";

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="bg-[#0f2e55] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-white/10 text-white">
              <LandmarkIcon className="h-7 w-7" />
            </span>
            <div>
              <strong className="block text-xl font-black tracking-tight">Once-Only Dog Tax</strong>
              <span className="text-sm font-semibold text-blue-100">Secure municipal transfer service</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full border border-blue-200/30 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-50 hover:bg-white/15"
              type="button"
              onClick={() => setShowLanding(true)}
            >
              Switch access
            </button>
            <div className="rounded-full bg-white px-3 py-1.5">
              <StatusBadge value={health?.status || "offline"} />
            </div>
            <span className="rounded-full border border-blue-200/30 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-100">
              Role-based access for citizens and municipal staff
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
            {roleLabel}
          </span>
          {selectedRole === "MUNICIPALITY" ? (
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600">
              {selectedTenant}
            </span>
          ) : null}
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
          Municipal Access Portal
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 lg:px-6" aria-label="Role navigation">
        {pages.map((page) => (
          <button
            key={page.id}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-black transition ${
              activePage === page.id
                ? "border-[#0f2e55] bg-[#0f2e55] text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
            }`}
            onClick={() => setActivePage(page.id)}
            type="button"
          >
            {page.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
