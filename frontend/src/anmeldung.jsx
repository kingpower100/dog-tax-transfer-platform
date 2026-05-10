import React from "react";
import ReactDOM from "react-dom/client";
import RegisterDog from "./pages/RegisterDog.jsx";
import "./styles.css";

const Header = () => (
  <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
    <div className="bg-[#0f2e55] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 10h16"></path><path d="M5 10l7-5 7 5"></path><path d="M6 10v8"></path><path d="M10 10v8"></path><path d="M14 10v8"></path><path d="M18 10v8"></path><path d="M4 18h16"></path>
            </svg>
          </span>
          <div>
            <strong className="block text-base font-black tracking-tight leading-tight">Once-Only Hundesteuer</strong>
            <span className="text-[11px] font-semibold text-blue-200">Kommunales Datentransfer-Portal · Germany</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full bg-white/10 px-3 py-1 sm:block">
            <span className="inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold capitalize ring-1 bg-emerald-50 text-emerald-800 ring-emerald-200">ok</span>
          </div>
          <button className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-blue-100 transition hover:bg-white/20" type="button" onClick={() => window.location.href = "/"}>Wechseln / Switch</button>
        </div>
      </div>
    </div>
    <div className="border-b border-slate-100 bg-slate-50">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 lg:px-6">
        <span className="rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wide bg-emerald-100 text-emerald-800">👤 Julia Wagner</span>
        <span className="ml-auto hidden text-[11px] font-semibold text-slate-400 sm:block">EU Once-Only Principle · Mandantentrennung</span>
      </div>
    </div>
    <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
      <button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50" onClick={() => window.location.href = "/"}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path>
        </svg>
        Mein Portal
      </button>
      <span className="text-sm font-black text-slate-700">Anmeldung — Hund anmelden</span>
    </div>
  </header>
);

const Shell = ({ children }) => (
  <div className="min-h-screen bg-slate-50 text-slate-900">
    <div className="bg-slate-900 px-4 py-2 text-white flex items-center justify-between text-xs overflow-x-auto">
      <span className="font-black opacity-60 uppercase tracking-widest shrink-0 mr-4">Demo User Switcher:</span>
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded-full font-bold transition whitespace-nowrap bg-blue-600">Julia Wagner</button>
      </div>
    </div>
    <Header />
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      {children}
    </main>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Shell>
      <RegisterDog />
    </Shell>
  </React.StrictMode>
);
