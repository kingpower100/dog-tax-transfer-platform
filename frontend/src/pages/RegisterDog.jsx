import { useMemo, useState } from "react";
import { apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TechnicalDetails from "../components/TechnicalDetails.jsx";

const CITIZEN_USER_ID = 1001;

const initialForm = {
  insuranceNumber: "DOG-INS-2026-001",
  owner: {
    first_name: "Anna",
    last_name: "Schmidt",
    date_of_birth: "1990-01-15",
    street: "Musterstrasse",
    house_number: "10",
    postal_code: "30159",
    city: "Hannover",
    email: "anna.schmidt@example.de",
    phone: "017600000000",
  },
  dog: {
    name: "Bello",
    chip_number: "276099900009999",
    breed: "Labrador",
    birth_date: "2020-05-10",
    gender: "MAENNLICH",
    dog_type: "NORMAL",
  },
};

const ownerLabels = {
  first_name: "First name",
  last_name: "Last name",
  date_of_birth: "Date of birth",
  street: "Street",
  house_number: "House number",
  postal_code: "Postal code",
  city: "City",
  email: "Email",
  phone: "Phone",
};

const dogLabels = {
  name: "Dog name",
  chip_number: "Dog chip number",
  breed: "Breed",
  birth_date: "Date of birth",
  gender: "Sex",
  dog_type: "Dog category",
};

const dogFieldOrder = ["name", "chip_number", "insuranceNumber", "birth_date", "breed", "dog_type", "gender"];
const fieldClassName =
  "h-12 w-full rounded-xl border border-slate-300 px-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

function tenantId(tenants, code) {
  return tenants.find((tenant) => tenant.code === code)?.id || null;
}

export default function RegisterDog({ selectedTenant, tenants = [] }) {
  const municipalityId = tenantId(tenants, selectedTenant);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const context = useMemo(
    () => demoContext({ role: "citizen", municipalityId, userId: CITIZEN_USER_ID }),
    [municipalityId],
  );

  function update(section, key, value) {
    setForm((current) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }));
  }

  function updateInsuranceNumber(value) {
    setForm((current) => ({ ...current, insuranceNumber: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setResult(null);
    setError("");
    const insuranceNumber = form.insuranceNumber.trim();
    if (!insuranceNumber) {
      setError("Insurance number is required.");
      return;
    }
    setSubmitting(true);
    try {
      setResult(
        await apiPost("/dogs/register", {
          ...context,
          municipality_id: municipalityId,
          owner: form.owner,
          dog: {
            ...form.dog,
            insurance_number: insuranceNumber,
          },
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Citizen self-service"
        title="Register a New Dog"
        description="Submit a dog tax registration for finance review. The tax amount is calculated after municipal approval."
      />

      {error ? <AlertBox type="error">{error}</AlertBox> : null}
      {result ? (
        <AlertBox type="success" title="Registration submitted">
          The registration is pending municipal finance verification.
        </AlertBox>
      ) : null}

      <form className="space-y-4" onSubmit={submit}>
        <SectionCard title="Owner Information">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(form.owner).map(([key, value]) => (
              <label key={key}>
                <span className="mb-2 block text-sm font-black text-slate-700">{ownerLabels[key] || key}</span>
                <input value={value} onChange={(event) => update("owner", key, event.target.value)} />
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Dog Information">
          <div className="grid gap-5 md:grid-cols-2">
            {dogFieldOrder.map((key) => (
              <div className="space-y-2" key={key}>
                {key === "insuranceNumber" ? (
                  <>
                    <label className="block text-sm font-semibold text-slate-700">Insurance number *</label>
                    <input
                      className={fieldClassName}
                      type="text"
                      value={form.insuranceNumber}
                      onChange={(event) => updateInsuranceNumber(event.target.value)}
                      placeholder="e.g. DOG-INS-2026-001"
                      required
                    />
                    <p className="text-xs text-slate-500">Enter the dog liability insurance number.</p>
                  </>
                ) : key === "dog_type" ? (
                  <>
                    <label className="block text-sm font-semibold text-slate-700">{dogLabels[key]}</label>
                    <select className={fieldClassName} value={form.dog[key]} onChange={(event) => update("dog", key, event.target.value)}>
                      <option value="NORMAL">Basic dog</option>
                      <option value="LISTENHUND">Listed dog</option>
                    </select>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-slate-700">{dogLabels[key] || key}</label>
                    <input className={fieldClassName} value={form.dog[key]} onChange={(event) => update("dog", key, event.target.value)} />
                  </>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Municipality">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge value={selectedTenant} />
            <span className="text-sm font-semibold text-slate-600">Finance approval is required before activation.</span>
          </div>
        </SectionCard>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button className="primary px-6 py-3 text-base" type="submit" disabled={submitting || !municipalityId}>
            {submitting ? "Submitting registration..." : "Submit Registration"}
          </button>
        </div>
      </form>

      {result ? <TechnicalDetails data={result} title="Registration response" defaultOpen /> : null}
    </section>
  );
}
