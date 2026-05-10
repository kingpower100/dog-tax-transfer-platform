import { useMemo, useState, useEffect } from "react";
import { apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import Stepper from "../components/Stepper.jsx";
import { FileIcon, LandmarkIcon, AlertTriangleIcon } from "../components/Icons.jsx";

const REGISTER_STEPS = [
  { title: "Halter", description: "Angaben zum Steuerpflichtigen" },
  { title: "Hund", description: "Tierdaten und Chipnummer" },
  { title: "Prüfung & Einreichen", description: "Antrag bestätigen" },
];

const initialForm = {
  insuranceNumber: "",
  owner: {
    first_name: "",
    last_name: "",
    date_of_birth: "",
    street: "",
    house_number: "",
    postal_code: "",
    city: "",
    email: "",
    phone: "",
  },
  dog: {
    name: "",
    chip_number: "",
    breed: "",
    birth_date: "",
    gender: "MAENNLICH",
    dog_type: "NORMAL",
  },
};

const ownerFields = [
  { key: "first_name", label: "Vorname *", type: "text", col: 1 },
  { key: "last_name", label: "Nachname *", type: "text", col: 1 },
  { key: "date_of_birth", label: "Geburtsdatum", type: "date", col: 1 },
  { key: "email", label: "E-Mail-Adresse", type: "email", col: 1 },
  { key: "street", label: "Straße *", type: "text", col: 1 },
  { key: "house_number", label: "Hausnummer *", type: "text", col: 1 },
  { key: "postal_code", label: "Postleitzahl *", type: "text", col: 1 },
  { key: "city", label: "Ort / Stadt *", type: "text", col: 1 },
  { key: "phone", label: "Telefon", type: "tel", col: 1 },
];

const dogFields = [
  { key: "name", label: "Name des Hundes *", type: "text" },
  { key: "chip_number", label: "Chipnummer * (15-stellig, ISO 11784)", type: "text" },
  { key: "breed", label: "Rasse", type: "text" },
  { key: "birth_date", label: "Geburtsdatum des Hundes", type: "date" },
];

const inputCls = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[#0f2e55] focus:outline-none focus:ring-2 focus:ring-blue-100";
const selectCls = `${inputCls} cursor-pointer`;

function FormSection({ number, title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Section header — German gov style */}
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

function tenantId(tenants, code) {
  return tenants.find((t) => t.code === code)?.id || null;
}

export default function RegisterDog({ selectedTenant, tenants = [], currentUserId }) {
  const municipalityId = tenantId(tenants, selectedTenant);
  const municipalityName = tenants.find((t) => t.code === selectedTenant)?.name || selectedTenant;
  const userId = currentUserId || 1001;

  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const context = useMemo(
    () => demoContext({ role: "citizen", municipalityId, userId }),
    [municipalityId, userId],
  );

  useEffect(() => {
    async function loadCitizen() {
      setLoading(true);
      try {
        const data = await apiGet("/citizen/me", selectedTenant, context);
        if (data.owner) {
          setForm((f) => ({
            ...f,
            owner: {
              first_name: data.owner.first_name || "",
              last_name: data.owner.last_name || "",
              date_of_birth: data.owner.date_of_birth || "",
              street: data.owner.street || "",
              house_number: data.owner.house_number || "",
              postal_code: data.owner.postal_code || "",
              city: data.owner.city || "",
              email: data.user.email || "",
              phone: "",
            },
          }));
        }
      } catch (err) {
        console.error("Failed to load citizen data", err);
      } finally {
        setLoading(false);
      }
    }
    loadCitizen();
  }, [selectedTenant, context]);

  function updateOwner(key, value) {
    setForm((f) => ({ ...f, owner: { ...f.owner, [key]: value } }));
  }

  function updateDog(key, value) {
    setForm((f) => ({ ...f, dog: { ...f.dog, [key]: value } }));
  }

  async function submit(e) {
    e.preventDefault();
    setResult(null);
    setError("");
    if (!form.dog.chip_number.trim()) {
      setError("Chipnummer ist Pflichtfeld — Antrag ohne Chip wird mit HTTP 400 abgewiesen.");
      return;
    }
    if (!form.insuranceNumber.trim()) {
      setError("Haftpflichtversicherungsnummer ist erforderlich.");
      return;
    }
    setSubmitting(true);
    try {
      setResult(
        await apiPost(
          "/dogs/register",
          {
            ...context,
            municipality_id: municipalityId,
            owner: form.owner,
            dog: { ...form.dog, insurance_number: form.insuranceNumber.trim() },
          },
          selectedTenant,
        ),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        {/* Official confirmation */}
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm">
          <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-600 px-6 py-4 text-white">
            <LandmarkIcon className="h-6 w-6" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Eingangsbestätigung</p>
              <h2 className="text-lg font-black">Anmeldung eingereicht</h2>
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm leading-7 text-emerald-800">
              Ihr Antrag auf Hundesteueranmeldung wurde erfolgreich eingereicht. Die zuständige Finanzbehörde von{" "}
              <strong>{municipalityName}</strong> wird Ihre Angaben prüfen und die jährliche Steuer nach Genehmigung berechnen.
            </p>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 font-mono text-sm text-slate-700">
              <p><span className="font-black text-slate-500">Vorgangsnummer:</span> #{result.id || "—"}</p>
              <p><span className="font-black text-slate-500">Status:</span> {result.status || "eingereicht"}</p>
            </div>
            <button
              className="primary mt-4"
              type="button"
              onClick={() => { setResult(null); setForm(initialForm); }}
            >
              Weiteren Hund anmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Official Formular header */}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-200 bg-[#0f2e55] px-6 py-5 text-white">
          <FileIcon className="mt-0.5 h-7 w-7 shrink-0 text-blue-200" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Formular · Hundesteuer</p>
            <h1 className="text-xl font-black leading-tight">Antrag auf Hundesteuerpflicht — Anmeldung</h1>
            <p className="mt-1 text-sm font-semibold text-blue-200">Behörde: Finanzamt {municipalityName} · § 1 Hundesteuersatzung</p>
          </div>
        </div>

        <div className="px-6 py-4">
          <Stepper steps={REGISTER_STEPS} currentStep={currentStep} />
        </div>

        {/* Legal notice */}
        <div className="mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          <strong className="font-black">Hinweis:</strong> Die Anmeldung ist gemäß § 4 Hundesteuersatzung innerhalb von 4 Wochen nach
          Erwerb des Hundes vorzunehmen. Fehlende Chipnummer führt zur Ablehnung (HTTP 400).
          Alle mit * markierten Felder sind Pflichtfelder.
        </div>
      </div>

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <form className="space-y-4" onSubmit={submit} noValidate>
        {/* Step 1 — Owner */}
        <FormSection number="1" title="Angaben zum Steuerpflichtigen (Halter)" subtitle="Personenbezogene Daten des Hundehalters">
          <div className="grid gap-4 sm:grid-cols-2">
            {ownerFields.map(({ key, label, type }) => (
              <label key={key} className="space-y-1.5">
                <span className="block text-xs font-black uppercase tracking-wide text-slate-600">{label}</span>
                <input
                  className={inputCls}
                  type={type}
                  value={form.owner[key]}
                  onChange={(e) => updateOwner(key, e.target.value)}
                  placeholder={label.replace(" *", "")}
                />
              </label>
            ))}
          </div>
        </FormSection>

        {/* Step 2 — Dog */}
        <FormSection number="2" title="Angaben zum Hund" subtitle="Chipnummer ist Pflichtfeld (ISO 11784/85)">
          <div className="grid gap-4 sm:grid-cols-2">
            {dogFields.map(({ key, label, type }) => (
              <label key={key} className="space-y-1.5">
                <span className="block text-xs font-black uppercase tracking-wide text-slate-600">{label}</span>
                <input
                  className={inputCls}
                  type={type}
                  value={form.dog[key]}
                  onChange={(e) => updateDog(key, e.target.value)}
                  required={key === "chip_number"}
                />
              </label>
            ))}

            {/* Gender */}
            <label className="space-y-1.5">
              <span className="block text-xs font-black uppercase tracking-wide text-slate-600">Geschlecht</span>
              <select className={selectCls} value={form.dog.gender} onChange={(e) => updateDog("gender", e.target.value)}>
                <option value="MAENNLICH">Männlich</option>
                <option value="WEIBLICH">Weiblich</option>
              </select>
            </label>

            {/* Dog type */}
            <label className="space-y-1.5">
              <span className="block text-xs font-black uppercase tracking-wide text-slate-600">Hundetyp *</span>
              <select className={selectCls} value={form.dog.dog_type} onChange={(e) => updateDog("dog_type", e.target.value)}>
                <option value="NORMAL">Normaler Hund</option>
                <option value="LISTENHUND">Listenhund (erhöhter Steuersatz)</option>
              </select>
              {form.dog.dog_type === "LISTENHUND" ? (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-700">
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                  Listenhunde unterliegen erhöhten Steuersätzen gemäß kommunaler Satzung.
                </p>
              ) : null}
            </label>

            {/* Insurance number */}
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-xs font-black uppercase tracking-wide text-slate-600">Haftpflichtversicherungsnummer *</span>
              <input
                className={inputCls}
                type="text"
                value={form.insuranceNumber}
                onChange={(e) => setForm((f) => ({ ...f, insuranceNumber: e.target.value }))}
                placeholder="z.B. HV-10001"
              />
              <p className="text-[11px] text-slate-400">Versicherungsnummer der Tierhaftpflicht.</p>
            </label>
          </div>
        </FormSection>

        {/* Step 3 — Review */}
        <FormSection number="3" title="Prüfung und Einreichen" subtitle="Bitte bestätigen Sie die zuständige Behörde">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Zuständige Behörde</dt>
                <dd className="mt-0.5 font-black text-slate-900">Finanzamt {municipalityName}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Antragsteller</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {form.owner.first_name || "—"} {form.owner.last_name || ""}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Hund</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">{form.dog.name || "—"}</dd>
              </div>
            </dl>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Mit dem Einreichen bestätigen ich, dass alle Angaben der Wahrheit entsprechen. Die jährliche Hundesteuer wird nach
            behördlicher Prüfung gemäß der Steuersatzung von {municipalityName} berechnet.
          </p>
        </FormSection>

        <div className="flex items-center justify-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">
            Formular: Hundesteuersatzung § 1 · {municipalityName}
          </p>
          <button
            className="primary px-8 py-3 text-base"
            type="submit"
            disabled={submitting || !municipalityId}
          >
            {submitting ? "Wird eingereicht…" : "Antrag einreichen (Anmelden)"}
          </button>
        </div>
      </form>
    </div>
  );
}
