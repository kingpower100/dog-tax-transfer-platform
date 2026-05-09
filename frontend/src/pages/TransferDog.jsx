import { useMemo, useState } from "react";
import { apiPost } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import Stepper from "../components/Stepper.jsx";
import TechnicalDetails from "../components/TechnicalDetails.jsx";
import TransferFlow from "../components/TransferFlow.jsx";

const initialForm = {
  von_mandant: "HANNOVER",
  chipnummer: "276098100001111",
  neue_adresse: {
    strasse: "Musterstrasse",
    hausnummer: "5",
    plz: "20095",
    ort: "Hamburg",
  },
};

export default function TransferDog({ selectedTenant, tenants = [], selectedChip }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    chipnummer: selectedChip || initialForm.chipnummer,
  }));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const tenantCodes = useMemo(() => {
    const codes = tenants.map((tenant) => tenant.code).filter(Boolean);
    return codes.length ? codes : ["HANNOVER", "HAMBURG", "BERLIN", "FREIBURG", "LEVERKUSEN"];
  }, [tenants]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateAddress(key, value) {
    setForm((current) => ({
      ...current,
      neue_adresse: { ...current.neue_adresse, [key]: value },
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      setResult(await apiPost("/ummeldung", form, selectedTenant));
    } catch (err) {
      setError(err.data || { message: err.message, status: err.status });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Once-only transfer request"
        title="Request Transfer"
        description={`Submit a dog tax transfer from the source municipality to ${selectedTenant}, the selected target municipality.`}
      />

      <div className="mb-4">
        <Stepper
          currentStep={3}
          steps={[
            { title: "Source municipality", description: "Where the current dog tax record exists." },
            { title: "Dog chip number", description: "Identifies the dog record for transfer." },
            { title: "New address", description: "Citizen address in the target municipality." },
            { title: "Submit request", description: "Backend creates the target case and audit log." },
          ]}
        />
      </div>

      <SectionCard title="What happens during transfer" className="mb-4">
        <TransferFlow source={form.von_mandant} target={selectedTenant} />
      </SectionCard>

      {selectedTenant !== "HAMBURG" ? (
        <AlertBox type="warning">The prepared transfer values may be aligned with target municipality HAMBURG.</AlertBox>
      ) : null}

      <form className="grid gap-4" onSubmit={submit}>
        <SectionCard title="Step 1: Source municipality" description="Select the municipality that currently holds the dog tax record.">
          <label className="block max-w-lg">
            <span className="mb-2 block text-sm font-black text-slate-700">Source municipality</span>
            <select value={form.von_mandant} onChange={(event) => update("von_mandant", event.target.value)}>
              {tenantCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </SectionCard>

        <SectionCard title="Step 2: Dog chip number" description="The backend uses this value to find the source dog record.">
          <label className="block max-w-lg">
            <span className="mb-2 block text-sm font-black text-slate-700">Dog chip number</span>
            <input value={form.chipnummer} onChange={(event) => update("chipnummer", event.target.value)} />
            <span className="mt-2 block text-sm text-slate-500">Technical API field: chipnummer.</span>
          </label>
        </SectionCard>

        <SectionCard title="Step 3: New address" description="Address of the citizen in the target municipality.">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">Street</span>
              <input value={form.neue_adresse.strasse} onChange={(event) => updateAddress("strasse", event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">House number</span>
              <input value={form.neue_adresse.hausnummer} onChange={(event) => updateAddress("hausnummer", event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">Postal code</span>
              <input value={form.neue_adresse.plz} onChange={(event) => updateAddress("plz", event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">City</span>
              <input value={form.neue_adresse.ort} onChange={(event) => updateAddress("ort", event.target.value)} />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Step 4: Submit transfer request">
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting transfer..." : "Submit transfer request"}
          </button>
        </SectionCard>
      </form>

      {error ? (
        <>
          <AlertBox type="error" title="Transfer failed">
            The backend rejected the request. Open technical details to inspect the response.
          </AlertBox>
          <TechnicalDetails data={error} defaultOpen />
        </>
      ) : null}
      {result ? (
        <>
          <AlertBox type="success" title="Transfer completed">
            The backend created the transfer and returned the target registration details.
          </AlertBox>
          <TechnicalDetails data={result} title="Technical details: API response" />
        </>
      ) : null}
    </section>
  );
}
