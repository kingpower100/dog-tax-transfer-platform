import { CheckBuildingIcon, LandmarkIcon } from "../components/Icons.jsx";

export default function AuthoritySelectionPage({ tenants = [], onSelectMunicipality, onBack }) {
  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Authority Portal</h1>
          <p className="mt-2 text-slate-600">Select a municipality to manage tax and transfer records.</p>
        </div>
        <button 
          onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <button
            key={tenant.id}
            onClick={() => onSelectMunicipality(tenant)}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-600 hover:ring-4 hover:ring-blue-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600">
              <LandmarkIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-black text-slate-950">{tenant.name}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{tenant.code}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
