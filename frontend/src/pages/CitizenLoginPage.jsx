import React, { useState } from 'react';
import { UserIcon, LandmarkIcon } from '../components/Icons';

export default function CitizenLoginPage({ onSelectCitizen, onBack }) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState(null);

  const handleLogin = (citizen) => {
    setLoading(true);
    setTimeout(() => {
      onSelectCitizen(citizen);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-lg font-black text-slate-800">Authentifizierung läuft über {method}...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg pt-20">
      <button onClick={onBack} className="mb-8 text-sm font-black text-slate-500 hover:text-slate-900">← Zurück</button>
      <h1 className="text-3xl font-black text-slate-950">Bürger-Login</h1>
      <p className="mt-2 text-slate-600">Bitte wählen Sie eine Methode zur Authentifizierung:</p>

      <div className="mt-8 space-y-3">
        {['BundID', 'E-Mail & Passwort', 'Online-Ausweis'].map((m) => (
          <button 
            key={m}
            onClick={() => setMethod(m)}
            className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left font-black text-slate-800 shadow-sm hover:border-blue-500 hover:ring-4 hover:ring-blue-50 transition"
          >
            {m}
            <span className="text-xs font-bold text-blue-600 uppercase">Login</span>
          </button>
        ))}
      </div>

      {method && (
        <div className="mt-10 border-t border-slate-200 pt-8">
          <button 
            onClick={() => handleLogin({ id: 1001, name: "Julia Wagner" })}
            className="w-full flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 hover:border-blue-500 transition"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-black text-white">JW</div>
            <span className="text-sm font-bold text-slate-900">Login as Julia Wagner</span>
          </button>
        </div>
      )}
    </div>
  );
}
