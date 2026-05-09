import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import InfoPanel from "../components/InfoPanel.jsx";

export default function TaxRules({ selectedTenant }) {
  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Municipal tax configuration"
        title="Tax Rules"
        description={`Policy overview for ${selectedTenant}. This page is UI-only in this step; rules will be loaded from the backend later.`}
      />

      <InfoPanel title="Destination-based calculation">
        Tax is recalculated after transfer using the destination municipality's local rules, because dog tax policy and exemptions can differ by city.
      </InfoPanel>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard
          title="Basic tax"
          description="First registered dog in a household."
        >
          <div className="text-3xl font-black text-slate-950">- EUR</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Will be loaded from the official municipal rule set.</p>
        </SectionCard>

        <SectionCard
          title="Additional dog"
          description="Second and further dogs in a household."
        >
          <div className="text-3xl font-black text-slate-950">- EUR</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Calculated by dog position and validity period.</p>
        </SectionCard>

        <SectionCard
          title="Listed dog / Listenhund"
          description="Special category rules where applicable."
        >
          <div className="text-3xl font-black text-slate-950">- EUR</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">May differ by breed list and local regulations.</p>
        </SectionCard>
      </div>

      <SectionCard
        title="Legal source"
        description="Links to the municipal legal basis are shown here when connected."
        action={
          <button
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 hover:bg-slate-50"
            type="button"
            onClick={() => {}}
          >
            Open legal source (placeholder)
          </button>
        }
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          No legal sources loaded yet. In the next step, this area will display official links returned by the backend.
        </div>
      </SectionCard>
    </section>
  );
}
