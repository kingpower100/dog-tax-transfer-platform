import { useState } from "react";
import { ArrowRightIcon } from "./Icons.jsx";

const FALLBACK_MUNICIPALITIES = [
  { id: 1, code: "BERLIN", name: "Berlin" },
  { id: 2, code: "HAMBURG", name: "Hamburg" },
  { id: 3, code: "HANNOVER", name: "Hannover" },
  { id: 4, code: "FREIBURG", name: "Freiburg" },
  { id: 5, code: "LEVERKUSEN", name: "Leverkusen" },
];

export default function MunicipalitySelector({ municipalities = [], onContinue }) {
  const availableMunicipalities = municipalities.length > 0 ? municipalities : FALLBACK_MUNICIPALITIES;
  const [sourceMunicipality, setSourceMunicipality] = useState("");
  const [destinationMunicipality, setDestinationMunicipality] = useState("");
  const [error, setError] = useState("");

  function validateAndContinue() {
    setError("");
    
    if (!sourceMunicipality) {
      setError("Please select a source municipality");
      return;
    }
    
    if (!destinationMunicipality) {
      setError("Please select a destination municipality");
      return;
    }
    
    if (sourceMunicipality === destinationMunicipality) {
      setError("Source and destination municipalities must be different");
      return;
    }
    
    const source = availableMunicipalities.find(m => m.id.toString() === sourceMunicipality);
    const destination = availableMunicipalities.find(m => m.id.toString() === destinationMunicipality);
    
    if (onContinue) {
      onContinue({ source, destination });
    }
  }

  function handleSourceChange(value) {
    setSourceMunicipality(value);
    if (destinationMunicipality === value) {
      setDestinationMunicipality("");
    }
    setError("");
  }

  function handleDestinationChange(value) {
    setDestinationMunicipality(value);
    if (sourceMunicipality === value) {
      setSourceMunicipality("");
    }
    setError("");
  }

  const availableDestinations = sourceMunicipality 
    ? availableMunicipalities.filter(m => m.id.toString() !== sourceMunicipality)
    : availableMunicipalities;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-3xl border border-white/20 bg-white/5 p-8 shadow-xl backdrop-blur-[2px]">
        <h2 className="text-center text-2xl font-black text-white mb-8">
          Start Your Dog Tax Transfer
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Source Municipality */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-black uppercase tracking-wide text-emerald-200">
                Current Municipality
              </span>
              <select
                value={sourceMunicipality}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full h-12 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-[2px] focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
              >
                <option value="" className="bg-slate-900">Select current municipality</option>
                {availableMunicipalities.map((municipality) => (
                  <option 
                    key={municipality.id} 
                    value={municipality.id}
                    className="bg-slate-900"
                  >
                    {municipality.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Destination Municipality */}
          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-black uppercase tracking-wide text-emerald-200">
                New Municipality
              </span>
              <select
                value={destinationMunicipality}
                onChange={(e) => handleDestinationChange(e.target.value)}
                disabled={!sourceMunicipality}
                className="w-full h-12 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-[2px] focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-slate-900">
                  {sourceMunicipality ? "Select new municipality" : "Select current municipality first"}
                </option>
                {availableDestinations.map((municipality) => (
                  <option 
                    key={municipality.id} 
                    value={municipality.id}
                    className="bg-slate-900"
                  >
                    {municipality.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-center">
            <p className="text-sm font-semibold text-red-200">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={validateAndContinue}
            disabled={!sourceMunicipality || !destinationMunicipality}
            className="inline-flex items-center gap-3 rounded-xl bg-emerald-500 px-8 py-3 text-base font-black text-white shadow-lg transition hover:bg-emerald-400 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-500"
          >
            Continue to Transfer
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
