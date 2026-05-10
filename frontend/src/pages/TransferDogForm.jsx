import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import Stepper from "../components/Stepper.jsx";
import { SendIcon, LandmarkIcon, ShieldIcon } from "../components/Icons.jsx";

const TARGET_MUNICIPALITY_CODE = "HAMBURG";

const CONSENT_TEXT =
  "Ich stimme zu, dass Quell- und Zielgemeinde die für diesen Hundesteuerfall erforderlichen Übermittlungsdaten verarbeiten. (I consent to the source and target municipalities processing the transfer data required for this dog-tax case.)";

const TRANSFER_STEPS = [
  { title: "Bestandsdaten", description: "Aktueller Datensatz der Quelle" },
  { title: "Neue Adresse", description: "Zielort und Umzugsdatum" },
  { title: "Einwilligung", description: "Once-Only Datenweitergabe" },
  { title: "Einreichen", description: "Ummeldungsantrag absenden" },
];

const fieldCls = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm focus:border-[#0f2e55] focus:outline-none focus:ring-2 focus:ring-blue-100";
const readonlyCls = "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 shadow-sm cursor-not-allowed";

function tenantId(tenants, code) {
  return tenants.find((t) => t.code === code)?.id || null;
}

function FormSection({ number, title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f2e55] text-xs font-black text-white">
            {number}
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-950">{title}</h3>
            {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input className={readonlyCls} readOnly value={value || "—"} />
    </div>
  );
}

export default function TransferDogForm({
  currentUserId,
  selectedMunicipalityId,
  selectedTenant,
  selectedTransferRegistrationId,
  tenants = [],
}) {
  const userId = currentUserId || 1001;
  const sourceMunicipalityId = selectedMunicipalityId || tenantId(tenants, "BERLIN");
  const registrationId = selectedTransferRegistrationId || 3;

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
    () => demoContext({ role: "citizen", municipalityId: sourceMunicipalityId, userId }),
    [userId, sourceMunicipalityId],
  );

  const currentStep = useMemo(() => {
    if (message) return 3;
    if (form.consent) return 3;
    const addressFilled = form.target_street.trim() && form.target_postal_code.trim() && form.target_municipality_id;
    if (addressFilled) return 2;
    if (formData) return 1;
    return 0;
  }, [formData, form, message]);

  async function loadFormData() {
    if (!sourceMunicipalityId || !registrationId) return;
    try {
      setError("");
      const data = await apiGet(`/registrations/${registrationId}/transfer-form-data`, selectedTenant, citizenContext);
      setFormData(data);
      const targets = (data.target_municipalities || []).filter((t) => t.id !== data.source_municipality?.id);
      const preferred = targets.find((t) => t.code === TARGET_MUNICIPALITY_CODE);
      setForm((f) => ({
        ...f,
        target_municipality_id: f.target_municipality_id || preferred?.id || targets[0]?.id || "",
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadFormData(); }, [sourceMunicipalityId, registrationId]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitRequest(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.consent) {
      setError("Einwilligung ist erforderlich bevor der Antrag eingereicht werden kann.");
      return;
    }
    if (!form.target_municipality_id || !form.target_street.trim() || !form.move_date) {
      setError("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiPost(
        "/transfers",
        {
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
        },
        selectedTenant,
      );
      await apiPost(
        `/transfers/${created.id}/consent`,
        {
          ...citizenContext,
          consent_accepted: true,
          consent_text: CONSENT_TEXT,
        },
        selectedTenant,
      );
      setMessage("Ummeldungsantrag erfolgreich eingereicht. Die Quellgemeinde prüft den Antrag und erstellt das Abmeldedokument.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const sourceName = formData?.source_municipality?.name || "Quellgemeinde";
  const targetOptions = (formData?.target_municipalities || []).filter(
    (t) => t.id !== formData?.source_municipality?.id,
  );

  if (message) {
    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
        <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-600 px-6 py-5 text-white">
          <LandmarkIcon className="h-6 w-6" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Eingangsbestätigung</p>
            <h2 className="text-lg font-black">Ummeldungsantrag eingereicht</h2>
          </div>
        </div>
        <div className="px-6 py-6">
          <p className="text-sm leading-7 text-emerald-800">{message}</p>
          <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 text-xs leading-6 text-slate-600">
            <p><span className="font-black">Prinzip:</span> EU Once-Only — Ihre Daten wurden einmalig übermittelt.</p>
            <p><span className="font-black">Nächster Schritt:</span> Finanzamt {sourceName} prüft und genehmigt die Abmeldung.</p>
          </div>
          <button
            className="primary mt-4"
            type="button"
            onClick={() => { setMessage(""); setForm({ ...form, consent: false }); }}
          >
            Weiteren Antrag stellen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Official Formular header */}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-200 bg-[#0f2e55] px-6 py-5 text-white">
          <SendIcon className="mt-0.5 h-7 w-7 shrink-0 text-blue-200" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Formular · Hundesteuer</p>
            <h1 className="text-xl font-black leading-tight">Ummeldungsantrag — Wechsel der Hundesteuergemeinde</h1>
            <p className="mt-1 text-sm font-semibold text-blue-200">
              Behörde: Finanzamt {sourceName} · EU Once-Only Prinzip (§ 2 Ummeldung)
            </p>
          </div>
        </div>

        <div className="px-6 py-4">
          <Stepper steps={TRANSFER_STEPS} currentStep={currentStep} />
        </div>

        {/* Once-Only info notice */}
        <div className="mx-6 mb-4 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-xs leading-5 text-blue-800">
            <strong className="font-black">EU Once-Only Prinzip (seit 2023):</strong> Ihre bei der Quellgemeinde gespeicherten
            Daten werden direkt an die Zielgemeinde übermittelt — Sie müssen keine Informationen erneut einreichen.
            Nur die neue Adresse wird benötigt.
          </p>
        </div>
      </div>

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <form className="space-y-4" onSubmit={submitRequest} noValidate>
        {/* Step 1 — Current record */}
        <FormSection number="1" title="Bestandsdaten (Quellgemeinde)" subtitle={`Vorhandener Datensatz aus ${sourceName} — schreibgeschützt`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadonlyField label="Vorname" value={formData?.owner?.first_name} />
            <ReadonlyField label="Nachname" value={formData?.owner?.last_name} />
            <ReadonlyField label="Geburtsdatum" value={formData?.owner?.date_of_birth} />
            <ReadonlyField
              label="Aktuelle Anschrift"
              value={`${formData?.owner?.street || ""} ${formData?.owner?.house_number || ""}, ${formData?.owner?.postal_code || ""} ${formData?.owner?.city || ""}`.trim()}
            />
            <ReadonlyField label="Hund" value={formData?.dog ? `${formData.dog.name} (${formData.dog.breed})` : ""} />
            <ReadonlyField label="Chipnummer" value={formData?.dog?.chip_number} />
            <ReadonlyField label="Hundetyp" value={formData?.dog?.dog_type} />
            <ReadonlyField
              label="Laufende Registrierung"
              value={formData?.registration?.id ? `#${formData.registration.id} · ${formData.registration.status}` : ""}
            />

            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-xs font-black uppercase tracking-wide text-slate-600">
                Haftpflichtversicherungsnummer (neue Gemeinde) *
              </span>
              <input
                className={fieldCls}
                type="text"
                value={form.insuranceNumber}
                onChange={(e) => setField("insuranceNumber", e.target.value)}
                placeholder="z.B. HV-20001"
              />
            </label>
          </div>
        </FormSection>

        {/* Step 2 — New address */}
        <FormSection number="2" title="Neue Anschrift und Umzugsdaten" subtitle="Bitte geben Sie Ihre neue Adresse in der Zielgemeinde an">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <span className="block text-xs font-black uppercase tracking-wide text-slate-600">Zielgemeinde *</span>
              <select
                className={fieldCls}
                value={form.target_municipality_id}
                onChange={(e) => setField("target_municipality_id", e.target.value)}
                required
              >
                <option value="">Bitte wählen…</option>
                {targetOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {[
              { key: "target_street", label: "Neue Straße *", type: "text" },
              { key: "target_house_number", label: "Hausnummer *", type: "text" },
              { key: "target_postal_code", label: "Postleitzahl *", type: "text" },
              { key: "target_city", label: "Ort / Stadt *", type: "text" },
              { key: "move_date", label: "Umzugsdatum *", type: "date" },
              { key: "deregistration_date", label: "Abmeldedatum *", type: "date" },
            ].map(({ key, label, type }) => (
              <label key={key} className="space-y-1.5">
                <span className="block text-xs font-black uppercase tracking-wide text-slate-600">{label}</span>
                <input
                  className={fieldCls}
                  type={type}
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  required
                />
              </label>
            ))}
          </div>
        </FormSection>

        {/* Step 3 — Consent */}
        <FormSection number="3" title="Einwilligung zur Datenübermittlung" subtitle="Gesetzlich vorgeschriebene Zustimmung gemäß DSGVO">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                className="mt-1 h-4 w-4 shrink-0 accent-[#0f2e55]"
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setField("consent", e.target.checked)}
                required
              />
              <span>{CONSENT_TEXT}</span>
            </label>
          </div>
          {form.consent ? (
            <p className="mt-3 text-xs font-black text-emerald-700">
              ✓ Einwilligung erteilt — Antrag kann eingereicht werden.
            </p>
          ) : (
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Ohne Einwilligung kann der Antrag nicht eingereicht werden.
            </p>
          )}
        </FormSection>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-slate-400">
            Formular: Ummeldung § 2 · EU Once-Only Prinzip 2023 · {sourceName}
          </p>
          <button
            className="primary px-8 py-3 text-base"
            type="submit"
            disabled={submitting || !sourceMunicipalityId || !form.consent}
          >
            {submitting ? "Wird eingereicht…" : "Ummeldungsantrag einreichen"}
          </button>
        </div>
      </form>
    </div>
  );
}
