export default function Stepper({ steps, currentStep = 0 }) {
  return (
    <ol className="grid gap-3 md:grid-cols-4">
      {steps.map((step, index) => {
        const active = index === currentStep;
        const done = index < currentStep;
        return (
          <li
            className={`rounded-2xl border p-4 shadow-sm ${
              active
                ? "border-blue-300 bg-blue-50"
                : done
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-white"
            }`}
            key={step.title}
          >
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Step {index + 1}</span>
            <strong className="mt-1 block text-sm text-slate-950">{step.title}</strong>
            <p className="mt-1 text-sm leading-5 text-slate-600">{step.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
