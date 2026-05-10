import FeatureCard from "../components/FeatureCard.jsx";
import {
  AuditIcon,
  CalculatorIcon,
  CheckBuildingIcon,
  FileIcon,
  LandmarkIcon,
  SendIcon,
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
    items: ["Consent-based data sharing", "Full audit trail", "Data minimization by design", "Traceable access"],
  },
];

export default function LandingPage({ onOpenRole, municipalities = [] }) {
  const visibleMunicipalities = municipalities.filter((municipality) =>
    ["BERLIN", "HANNOVER"].includes(municipality.code),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0f2e55] text-white shadow-sm">
              <LandmarkIcon className="h-6 w-6" />
            </div>
            <div>
              <strong className="block text-lg font-black tracking-tight text-slate-950">DogTax Transfer</strong>
              <span className="hidden text-xs font-bold uppercase tracking-wide text-slate-500 sm:block">Once-Only Municipal Service</span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-700 lg:flex" aria-label="Public navigation">
            <a className="no-underline hover:text-blue-800" href="#about">About</a>
            <a className="no-underline hover:text-blue-800" href="#compliance">Compliance</a>
            <button
              className="rounded-xl bg-[#0f2e55] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-950 focus-visible:ring-blue-800"
              type="button"
              onClick={() => onOpenRole("CITIZEN")}
            >
              Access Portal
            </button>
          </nav>

          <button
            className="rounded-xl bg-[#0f2e55] px-3 py-2 text-sm font-black text-white lg:hidden"
            type="button"
            onClick={() => onOpenRole("CITIZEN")}
          >
            Access Portal
          </button>
        </div>
      </header>

      <main>
        <section
          id="about"
          className="relative min-h-[85vh] overflow-hidden px-4 py-16 text-white lg:px-6 lg:py-20"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/assets/dog-tax-hero.jpg')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-slate-950/65" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 top-8 z-10 hidden justify-center px-6 lg:flex" aria-hidden="true">
            <div className="flex w-full max-w-5xl items-center justify-between gap-4 opacity-55">
              {["Source Municipality", "Secure Transfer Hub", "Destination Municipality"].map((label, index) => (
                <div key={label} className="flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/25 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/80 shadow-lg">
                  <ShieldIcon className="h-4 w-4 text-emerald-200" />
                  {label}
                  {index < 2 ? <span className="ml-2 hidden h-px w-12 bg-emerald-200/60 xl:inline-block" /> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mx-auto flex min-h-[64vh] max-w-6xl flex-col items-center justify-center text-center">
            <span className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-100 backdrop-blur">
              German municipal once-only service
            </span>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block">Secure Dog Tax Transfer</span>
              <span className="block text-emerald-300">Between Municipalities</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-100 sm:text-xl">
              Move your dog tax registration from one city to another without submitting the same dog and owner information twice.
            </p>

            <div className="mt-10 grid w-full max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => onOpenRole("CITIZEN")}
                className="rounded-2xl border border-white/30 bg-white/10 p-5 text-left shadow-lg backdrop-blur-[2px] transition hover:border-emerald-300/70 hover:bg-white/15"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-emerald-200">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Citizen</h3>
                    <p className="mt-1 text-sm leading-6 text-white/90">Register a new dog or move an existing dog.</p>
                  </div>
                </div>
              </button>

              {visibleMunicipalities.map((municipality) => (
                <button
                  key={municipality.id}
                  type="button"
                  onClick={() => onOpenRole("MUNICIPALITY", municipality)}
                  className="rounded-2xl border border-white/30 bg-white/10 p-5 text-left shadow-lg backdrop-blur-[2px] transition hover:border-emerald-300/70 hover:bg-white/15"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-emerald-200">
                      {municipality.code === "BERLIN" ? <SendIcon className="h-6 w-6" /> : <CheckBuildingIcon className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{municipality.name} Officer</h3>
                      <p className="mt-1 text-sm leading-6 text-white/90">Process registrations and transfer approvals.</p>
                    </div>
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => onOpenRole("PLATFORM_ADMIN")}
                className="rounded-2xl border border-white/30 bg-white/10 p-5 text-left shadow-lg backdrop-blur-[2px] transition hover:border-emerald-300/70 hover:bg-white/15"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-emerald-200">
                    <ShieldIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Platform Admin</h3>
                    <p className="mt-1 text-sm leading-6 text-white/90">View all transfers, audit logs, and tax rules.</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-10 w-full max-w-6xl rounded-3xl border border-white/20 bg-white/5 p-8 text-left shadow-xl backdrop-blur-[2px]">
              <h2 className="text-center text-2xl font-black text-white">Why Choose This Service?</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {whyColumns.map((column) => (
                  <div key={column.title}>
                    <h3 className="text-base font-black text-emerald-200">{column.title}</h3>
                    <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-white/90">
                      {column.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-300 text-emerald-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="compliance" className="bg-slate-50 px-4 py-20 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="text-xs font-black uppercase tracking-wide text-blue-800">Compliance and value</span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Built for secure municipal transfer</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard title="Once-Only Principle" icon={<FileIcon className="h-6 w-6" />}>
                Citizens should not need to submit information again when another authority already holds it.
              </FeatureCard>
              <FeatureCard title="Secure Transfer Hub" icon={<ShieldIcon className="h-6 w-6" />}>
                The platform transfers only the required dog and owner data between authorized municipalities.
              </FeatureCard>
              <FeatureCard title="Tenant Isolation" icon={<LandmarkIcon className="h-6 w-6" />}>
                Each municipality can only access its own records. Data from another municipality is visible only after consent and transfer approval.
              </FeatureCard>
              <FeatureCard title="Automated Tax Calculation" icon={<CalculatorIcon className="h-6 w-6" />}>
                Tax is recalculated using the destination municipality's local rules.
              </FeatureCard>
              <FeatureCard title="Audit & Compliance" icon={<AuditIcon className="h-6 w-6" />}>
                Every access, consent, approval, and transfer action is recorded for traceability.
              </FeatureCard>
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-16 border-t border-slate-200 bg-slate-950 px-6 py-6 text-center text-sm text-white">
        © 2026 Secure Dog Tax Transfer. All rights reserved.
      </footer>
    </div>
  );
}
