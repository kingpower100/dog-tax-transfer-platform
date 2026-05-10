import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, LandmarkIcon } from "./Icons.jsx";

export default function DemoSwitcherBar({ tenants, activeMunicipalityId, onSelectMunicipality }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900 transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <LandmarkIcon className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
            Demo: Tenant Isolation Debug
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100"
        >
          {isCollapsed ? (
            <>
              Expand <ChevronDownIcon className="h-3 w-3" />
            </>
          ) : (
            <>
              Collapse <ChevronUpIcon className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mx-auto mt-3 flex max-w-7xl flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => onSelectMunicipality(tenant)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                activeMunicipalityId === tenant.id
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-200 ring-2 ring-amber-600 ring-offset-1"
                  : "bg-white text-amber-900 border border-amber-200 hover:border-amber-400 hover:bg-amber-100/50"
              }`}
            >
              {tenant.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
