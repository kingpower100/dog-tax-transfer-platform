import StatusBadge from "./StatusBadge.jsx";
import { LandmarkIcon, HomeIcon } from "./Icons.jsx";

const CITIZEN_SUBPAGES = ["register-dog", "request-transfer", "transfer-status"];

const PAGE_TITLES = {
  "register-dog": "Anmeldung — Hund anmelden",
  "request-transfer": "Ummeldung — Hund ummelden",
  "transfer-status": "Meine Anträge",
};

export default function AppHeader({
  health,
  pages,
  activePage,
  setActivePage,
  selectedRole,
  selectedTenant,
  setShowLanding,
  currentCitizen,
}) {
  const roleLabel =
    selectedRole === "CITIZEN"
      ? currentCitizen ? `👤 ${currentCitizen.name}` : "Bürger"
      : selectedRole === "PLATFORM_ADMIN"
        ? "Platform Admin"
        : "Sachbearbeiter";

  const roleColor =
    selectedRole === "CITIZEN"
      ? "bg-emerald-100 text-emerald-800"
      : selectedRole === "PLATFORM_ADMIN"
        ? "bg-purple-100 text-purple-800"
        : "bg-blue-100 text-blue-800";

  const isCitizenSubPage = selectedRole === "CITIZEN" && CITIZEN_SUBPAGES.includes(activePage);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      {/* Brand bar */}
      <div className="bg-[#0f2e55] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/10">
              <LandmarkIcon className="h-5 w-5 text-white" />
            </span>
            <div>
              <strong className="block text-base font-black tracking-tight leading-tight">Once-Only Hundesteuer</strong>
              <span className="text-[11px] font-semibold text-blue-200">Kommunales Datentransfer-Portal · Germany</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-full bg-white/10 px-3 py-1 sm:block">
              <StatusBadge value={health?.status || "offline"} />
            </div>
            <button
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-100 transition hover:bg-white/20"
              type="button"
              onClick={() => setShowLanding(true)}
            >
              Wechseln / Switch
            </button>
          </div>
        </div>
      </div>

      {/* Context strip */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 lg:px-6">
          <span className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wide ${roleColor}`}>
            {roleLabel}
          </span>
          {(selectedRole === "MUNICIPALITY" || selectedRole === "PLATFORM_ADMIN") && selectedTenant ? (
            <span className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-black uppercase tracking-wide text-slate-700">
              {selectedTenant}
            </span>
          ) : null}
          <span className="ml-auto hidden text-[11px] font-semibold text-slate-400 sm:block">
            EU Once-Only Principle · Mandantentrennung
          </span>
        </div>
      </div>

      {/* Navigation */}
      {isCitizenSubPage ? (
        /* Citizen sub-page: show back button + page title */
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => setActivePage("citizen-home")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <HomeIcon className="h-4 w-4" />
            Mein Portal
          </button>
          <span className="text-sm font-black text-slate-700">
            {PAGE_TITLES[activePage] || activePage}
          </span>
        </div>
      ) : (
        /* Normal tab nav */
        <nav
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 lg:px-6"
          aria-label="Role navigation"
        >
          {pages.map((page) => (
            <button
              key={page.id}
              className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-black transition ${
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
      )}
    </header>
  );
}
