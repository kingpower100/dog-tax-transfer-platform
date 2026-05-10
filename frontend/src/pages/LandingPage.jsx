import FeatureCard from "../components/FeatureCard.jsx";
import {
  AuditIcon,
  CalculatorIcon,
  CheckBuildingIcon,
  FileIcon,
  LandmarkIcon,
  ShieldIcon,
  UserIcon,
} from "../components/Icons.jsx";

const whyColumns = [
  {
    title: "For Citizens",
    items: ["No duplicate registration forms", "Faster move between cities", "Clear transfer status", "Consent-based data sharing"],
  },
  {
    title: "For Municipalities",
    items: ["Secure inter-municipal data transfer", "Strict tenant isolation", "Automated dog tax calculation", "Reduced administrative workload"],
  },
  {
    title: "For Compliance",
    items: ["Consent-based data sharing", "Full tamper-proof audit trail", "Data minimization by design", "Traceable access per transfer"],
  },
];

const transferSteps = [
  { label: "Citizen submits move request", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { label: "Consent & Abmeldung generated", color: "bg-teal-100 text-teal-800 border-teal-200" },
  { label: "Source municipality approves", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { label: "Target municipality accepts", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { label: "Tax recalculated & transfer complete", color: "bg-green-100 text-green-800 border-green-200" },
];

export default function LandingPage({ onOpenRole, municipalities = [] }) {
  const berlinTenant = municipalities.find((t) => t.code === "BERLIN") || {
    id: 2,
    code: "BERLIN",
    name: "Berlin",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sticky top nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0f2e55] text-white shadow-sm">
              <LandmarkIcon className="h-5 w-5" />
            </div>
            <div>
              <strong className="block text-base font-black tracking-tight text-slate-950 leading-tight">DogTax Transfer</strong>
              <span className="hidden text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:block">
                Once-Only Municipal Service · Germany
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 lg:flex" aria-label="Public navigation">
            <a className="no-underline hover:text-blue-800" href="#about">How it works</a>
            <a className="no-underline hover:text-blue-800" href="#compliance">Compliance</a>
            <button
              className="primary"
              type="button"
              onClick={() => onOpenRole("CITIZEN")}
            >
              Access Portal
            </button>
          </nav>

          <button
            className="primary lg:hidden"
            type="button"
            onClick={() => onOpenRole("CITIZEN")}
          >
            Access Portal
          </button>
        </div>
      </header>

      <main>
        {/* Hero — CSS gradient (no external image dependency) */}
        <section
          id="about"
          className="relative min-h-[88vh] overflow-hidden px-4 py-16 text-white lg:px-6 lg:py-20"
          style={{
            background:
              "linear-gradient(135deg, #0a1f38 0%, #0f2e55 40%, #134a40 100%)",
          }}
        >
          {/* Decorative grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, white 0, white 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, white 0, white 1px, transparent 0, transparent 50%)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden="true"
          />

          {/* Main hero content */}
          <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-200 backdrop-blur">
              <ShieldIcon className="h-3.5 w-3.5" />
              EU Once-Only Principle · Germany · 2026
            </span>

            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block">Secure Dog Tax Transfer</span>
              <span className="mt-1 block text-emerald-300">Between Municipalities</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300 sm:text-xl">
              Move your dog tax registration from one German city to another —
              without submitting the same data twice.
            </p>

            {/* Role selection cards */}
            <div className="mt-10 grid w-full max-w-xl gap-3 sm:grid-cols-2">
              {/* Citizen */}
              <button
                type="button"
                onClick={() => onOpenRole("CITIZEN")}
                className="group rounded-2xl border border-white/20 bg-white/10 p-5 text-left shadow-lg backdrop-blur-sm transition hover:border-emerald-300/60 hover:bg-white/15"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-emerald-200 transition group-hover:bg-white/20">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Citizen Portal</h3>
                    <p className="mt-0.5 text-xs leading-5 text-white/75">Register or transfer your dog.</p>
                  </div>
                </div>
              </button>

              {/* Authority Portal */}
              <button
                type="button"
                onClick={() => onOpenRole("MUNICIPALITY", berlinTenant)}
                className="group rounded-2xl border border-white/20 bg-white/10 p-5 text-left shadow-lg backdrop-blur-sm transition hover:border-purple-300/60 hover:bg-white/15"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-purple-200 transition group-hover:bg-white/20">
                    <CheckBuildingIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Authority Portal</h3>
                    <p className="mt-0.5 text-xs leading-5 text-white/75">Manage transfers & administrative overview.</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Why section (inline hero) */}
            <div className="mt-10 w-full max-w-5xl rounded-3xl border border-white/15 bg-white/5 p-8 text-left shadow-xl backdrop-blur-sm">
              <h2 className="text-center text-xl font-black text-white">Why the Once-Only Principle?</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {whyColumns.map((column) => (
                  <div key={column.title}>
                    <h3 className="text-sm font-black text-emerald-300">{column.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {column.items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm font-medium leading-6 text-white/80">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Transfer state machine strip */}
        <section className="border-b border-slate-200 bg-white px-4 py-10 lg:px-6">
          <div className="mx-auto max-w-5xl">
            <p className="mb-6 text-center text-xs font-black uppercase tracking-wider text-slate-500">
              Transfer workflow — Ummeldung state machine
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {transferSteps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-2">
                  <span className={`rounded-full border px-4 py-1.5 text-xs font-black ${step.color}`}>
                    {step.label}
                  </span>
                  {index < transferSteps.length - 1 ? (
                    <span className="text-slate-300 font-black" aria-hidden="true">→</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance section */}
        <section id="compliance" className="bg-slate-50 px-4 py-20 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <span className="text-xs font-black uppercase tracking-wide text-blue-800">Compliance and value</span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Built for secure municipal data transfer
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Addresses the EU Once-Only Principle (legally binding since 2023) by enabling controlled data flow between German municipalities.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard title="Once-Only Principle" icon={<FileIcon className="h-6 w-6" />}>
                Citizens should not need to submit information again when another authority already holds it.
              </FeatureCard>
              <FeatureCard title="Secure Transfer Hub" icon={<ShieldIcon className="h-6 w-6" />}>
                The platform transfers only the required dog and owner data between authorized municipalities.
              </FeatureCard>
              <FeatureCard title="Tenant Isolation" icon={<LandmarkIcon className="h-6 w-6" />}>
                Each municipality accesses only its own records. Data is shared only after consent and transfer approval.
              </FeatureCard>
              <FeatureCard title="Automated Tax Calculation" icon={<CalculatorIcon className="h-6 w-6" />}>
                Tax is recalculated using the destination municipality's local statutes (Berlin HuStG, Hamburg HuStG).
              </FeatureCard>
              <FeatureCard title="Tamper-proof Audit Trail" icon={<AuditIcon className="h-6 w-6" />}>
                Every access, consent, approval, and transfer is hash-chained for full traceability.
              </FeatureCard>
              <FeatureCard title="Listed Dogs (Listenhund)" icon={<CheckBuildingIcon className="h-6 w-6" />}>
                Dangerous breeds are flagged and taxed at higher municipal rates automatically.
              </FeatureCard>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 px-6 py-6 text-center text-sm text-slate-400">
        © 2026 Once-Only Dog Tax Transfer Platform · Hackathon MVP · Berlin & Hamburg statutes
      </footer>
    </div>
  );
}
