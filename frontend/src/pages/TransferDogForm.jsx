import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";

const DEMO_CITIZEN_USER_ID = 1001;
const SOURCE_MUNICIPALITY_CODE = "BERLIN";
const TARGET_MUNICIPALITY_CODE = "HAMBURG";
const SOURCE_REGISTRATION_ID = 3;
const CONSENT_TEXT =
  "I consent to the source and target municipalities processing the transfer data required for this dog-tax case.";

function tenantId(tenants, code) {
  return tenants.find((tenant) => tenant.code === code)?.id || null;
}

const requiredFields = [
  ["insuranceNumber", "Insurance number"],
  ["target_municipality_id", "Target municipality"],
  ["target_street", "New street"],
  ["target_house_number", "New house number"],
  ["target_postal_code", "New postal code"],
  ["target_city", "New city"],
  ["move_date", "Move date"],
  ["deregistration_date", "Transfer effective date"],
];

const fieldClassName =
  "h-12 w-full rounded-xl border border-slate-300 px-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

export default function TransferDogForm({ currentUserId = DEMO_CITIZEN_USER_ID, selectedMunicipalityId, selectedTransferRegistrationId, tenants = [] }) {
  const sourceMunicipalityId = selectedMunicipalityId || tenantId(tenants, SOURCE_MUNICIPALITY_CODE);
  const registrationId = selectedTransferRegistrationId || SOURCE_REGISTRATION_ID;
  const [formData, setFormData] = useState(null);
  const [form, setForm] = useState({
    target_municipality_id: "",
    target_street: "",
    target_house_number: "",
    target_postal_code: "",
    target_city: "",
    move_date: "",
    deregistration_date: "",
    insuranceNumber: "",
    consent: false,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const citizenContext = useMemo(
    () => demoContext({ role: "citizen", municipalityId: sourceMunicipalityId, userId: currentUserId }),
    [currentUserId, sourceMunicipalityId],
  );

  async function loadFormData() {
    if (!sourceMunicipalityId || !registrationId) return;
    try {
      setError("");
      const data = await apiGet(`/registrations/${registrationId}/transfer-form-data`, null, citizenContext);
      setFormData(data);
      const allowedTargets = (data.target_municipalities || []).filter((tenant) => tenant.id !== data.source_municipality?.id);
      const preferredTarget = allowedTargets.find((tenant) => tenant.code === TARGET_MUNICIPALITY_CODE);
      const firstTarget = allowedTargets?.[0]?.id || "";
      setForm((current) => ({ ...current, target_municipality_id: current.target_municipality_id || preferredTarget?.id || firstTarget }));
    } catch (err) {
      setFormData(null);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadFormData();
  }, [sourceMunicipalityId, registrationId]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateForm() {
    if (!form.consent) return "Consent is required before submitting the transfer request.";
    const missing = requiredFields.find(([key]) => !String(form[key] || "").trim());
    if (missing) return `${missing[1]} is required.`;
    return "";
  }

  async function submitRequest(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiPost("/transfers", {
        ...citizenContext,
        registration_id: registrationId,
        target_municipality_id: Number(form.target_municipality_id),
        insurance_number: form.insuranceNumber.trim(),
        target_street: form.target_street,
        target_house_number: form.target_house_number,
        target_postal_code: form.target_postal_code,
        target_city: form.target_city,
        move_date: form.move_date,
        deregistration_date: form.deregistration_date,
        deregistration_reason: "moved_to_other_municipality",
      });
      await apiPost(`/transfers/${created.id}/consent`, {
        ...citizenContext,
        consent_accepted: true,
        consent_text: CONSENT_TEXT,
      });
      setMessage("Transfer request submitted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <PageHeader eyebrow="Citizen self-service" title="Transfer Dog" description="Review the existing dog tax record, enter the new address, and submit the transfer request with consent." />
      {message ? <AlertBox type="success">{message}</AlertBox> : null}
      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <form className="space-y-4" onSubmit={submitRequest} noValidate>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Owner Information / Dog Information / Current Registration">
            <div className="grid gap-5 md:grid-cols-2">
              {[
                ["First name", formData?.owner?.first_name || ""],
                ["Last name", formData?.owner?.last_name || ""],
                ["Date of birth", formData?.owner?.date_of_birth || ""],
                ["Old address", `${formData?.owner?.street || ""} ${formData?.owner?.house_number || ""}, ${formData?.owner?.postal_code || ""} ${formData?.owner?.city || ""}`.trim()],
                ["Dog", formData?.dog ? `${formData.dog.name} (${formData.dog.breed})` : ""],
                ["Chip number", formData?.dog?.chip_number || ""],
                ["Dog type", formData?.dog?.dog_type || ""],
                ["Current registration", formData?.registration?.id ? `#${formData.registration.id} - ${formData.registration.status}` : ""],
              ].map(([label, value]) => (
                <div className="space-y-2" key={label}>
                  <label className="block text-sm font-semibold text-slate-700">{label}</label>
                  <input className={`${fieldClassName} bg-slate-50 text-slate-700`} readOnly value={value} />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Insurance number *</label>
                <input
                  className={fieldClassName}
                  type="text"
                  value={form.insuranceNumber}
                  onChange={(event) => setField("insuranceNumber", event.target.value)}
                  placeholder="e.g. DOG-INS-2026-001"
                  required
                />
                <p className="text-xs text-slate-500">Enter the dog liability insurance number.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="New Address and Move Details">
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Target municipality</span>
                <select value={form.target_municipality_id} onChange={(event) => setField("target_municipality_id", event.target.value)} required>
                  <option value="">Choose target</option>
                  {formData?.target_municipalities?.filter((tenant) => [TARGET_MUNICIPALITY_CODE].includes(tenant.code)).map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">New street</span>
                <input value={form.target_street} onChange={(event) => setField("target_street", event.target.value)} required />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">New house number</span>
                <input value={form.target_house_number} onChange={(event) => setField("target_house_number", event.target.value)} required />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">New postal code</span>
                <input value={form.target_postal_code} onChange={(event) => setField("target_postal_code", event.target.value)} required />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">New city</span>
                <input value={form.target_city} onChange={(event) => setField("target_city", event.target.value)} required />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Move date</span>
                <input type="date" value={form.move_date} onChange={(event) => setField("move_date", event.target.value)} required />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase text-slate-500">Transfer effective date</span>
                <input type="date" value={form.deregistration_date} onChange={(event) => setField("deregistration_date", event.target.value)} required />
              </label>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Consent">
          <label className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
            <input
              className="mt-1 h-4 w-4"
              type="checkbox"
              checked={form.consent}
              onChange={(event) => setField("consent", event.target.checked)}
              required
              aria-required="true"
            />
            <span>{CONSENT_TEXT}</span>
          </label>
        </SectionCard>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            className="primary px-6 py-3 text-base"
            type="submit"
            disabled={submitting || !sourceMunicipalityId}
          >
            {submitting ? "Submitting request..." : "Submit request"}
          </button>
        </div>
      </form>
    </section>
  );
}
