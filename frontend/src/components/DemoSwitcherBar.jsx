import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "./Icons.jsx";

export default function DemoSwitcherBar({ tenants = [], activeMunicipalityId, onSelectMunicipality }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!tenants.length) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-800">
            <span aria-hidden="true">🏛</span>
            <span className="uppercase tracking-wide">Demo Switcher</span>
            <span className="hidden font-semibold text-amber-600 sm:inline">
              · Switching between isolated municipality tenants
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black text-amber-700 transition hover:bg-amber-100"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand municipality switcher" : "Collapse municipality switcher"}
          >
            {collapsed ? (
              <>
                Show <ChevronDownIcon className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Hide <ChevronUpIcon className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Tenant pills */}
        {!collapsed && (
          <div className="flex flex-wrap gap-2 pb-3">
            {tenants.map((tenant) => {
              const active = tenant.id === activeMunicipalityId;
              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => onSelectMunicipality(tenant)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-black transition ${
                    active
                      ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                      : "border-amber-300 bg-white text-amber-800 hover:border-amber-400 hover:bg-amber-100"
                  }`}
                >
                  {active ? "● " : ""}
                  {tenant.name}
                  <span className="ml-1.5 font-semibold opacity-60">({tenant.code})</span>
                </button>
              );
            })}
            <p className="flex items-center text-[10px] font-semibold uppercase tracking-wide text-amber-500">
              Each tenant sees only its own data via X-Mandant-ID header
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
