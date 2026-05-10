export default function Stepper({ steps, currentStep = 0 }) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const active = index === currentStep;
          const done = index < currentStep;
          const last = index === steps.length - 1;

          return (
            <li key={step.title} className="flex flex-1 items-start">
              {/* Step with connectors */}
              <div className="flex w-full flex-col items-center">
                {/* Connector row */}
                <div className="flex w-full items-center">
                  {/* Left line */}
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      index === 0 ? "invisible" : done ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />

                  {/* Circle */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ring-4 transition-all ${
                      done
                        ? "bg-emerald-500 text-white ring-emerald-100"
                        : active
                          ? "bg-[#0f2e55] text-white ring-blue-100"
                          : "bg-white text-slate-400 ring-slate-100 border border-slate-200"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    {done ? (
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 8l3.5 3.5L13 4.5" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Right line */}
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      last ? "invisible" : done ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />
                </div>

                {/* Label below */}
                <div className={`mt-2 px-1 text-center ${active ? "text-[#0f2e55]" : done ? "text-emerald-700" : "text-slate-400"}`}>
                  <span className="block text-[10px] font-black uppercase tracking-wider">
                    Step {index + 1}
                  </span>
                  <strong className="mt-0.5 block text-xs leading-tight sm:text-sm">{step.title}</strong>
                  {step.description ? (
                    <p className="mt-0.5 hidden text-xs leading-4 text-slate-500 md:block">{step.description}</p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
