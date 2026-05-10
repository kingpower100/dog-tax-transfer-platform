import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Stepper from "../components/Stepper.jsx";
import { PawIcon, FileIcon, SendIcon, ClockIcon, AlertTriangleIcon, ArrowRightIcon, MapPinIcon } from "../components/Icons.jsx";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(value) {
  return value ?? "—";
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("de-DE");
}

function fmtEuro(amount) {
  return amount == null ? "Ausstehend" : `€ ${amount}/Jahr`;
}

// 8-state transfer machine → stepper index (0-based out of 7 steps)
const STATE_STEP = {
  draft: 0,
  citizen_submitted: 1,
  consent_given: 1,
  abmeldung_generated: 2,
  source_finance_verified: 3,
  source_finance_approved: 4,
  target_finance_verified: 5,
  target_finance_approved: 6,
  completed: 7,
  source_rejected: -1,
  target_rejected: -1,
  cancelled: -1,
};

const TRANSFER_STEPS_MINI = [
  { title: "Antrag" },
  { title: "Zustimmung" },
  { title: "Abmeldung" },
  { title: "Quelle" },
  { title: "Freigabe" },
  { title: "Ziel prüft" },
  { title: "Ziel genehmigt" },
  { title: "Abgeschlossen" },
];

function getStepIndex(status) {
  return STATE_STEP[status] ?? 0;
}

function normalizeStatus(s) {
  return String(s || "").trim().toLowerCase().replaceAll(" ", "_");
}

function groupOf(status) {
  const s = normalizeStatus(status);
  if (["completed"].includes(s)) return "completed";
  if (["source_rejected", "target_rejected", "rejected"].includes(s)) return "rejected";
  if (["cancelled"].includes(s)) return "cancelled";
  if (["draft", "citizen_submitted", "consent_given"].includes(s)) return "pending";
  return "review";
}

const GROUP_BADGE = {
  pending: "bg-amber-50 text-amber-900 ring-amber-200",
  review: "bg-blue-50 text-blue-800 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
};

function GroupPill({ status }) {
  const g = groupOf(status);
  const labels = { pending: "Ausstehend", review: "In Bearbeitung", completed: "Abgeschlossen", rejected: "Abgelehnt", cancelled: "Storniert" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ${GROUP_BADGE[g]}`}>
      {labels[g] || g}
    </span>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProfileCard({ citizen, currentCitizen }) {
  const name = citizen?.user?.name || (currentCitizen ? `${currentCitizen.firstName} ${currentCitizen.lastName}` : "Bürger");
  const email = citizen?.user?.email || currentCitizen?.dogs?.[0]?.name || "—";
  const owner = citizen?.owner;
  const address = owner
    ? `${owner.street} ${owner.house_number}, ${owner.postal_code} ${owner.city}`
    : currentCitizen?.street
      ? `${currentCitizen.street}, ${currentCitizen.plz} ${currentCitizen.city}`
      : "—";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start">
      {/* Avatar */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0f2e55] text-xl font-black text-white shadow-sm">
        {initials}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bürger · Hundesteuer</p>
          <h2 className="mt-0.5 text-2xl font-black text-slate-950">{name}</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">E-Mail</dt>
            <dd className="mt-0.5 font-semibold text-slate-800 break-all">{email}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400 flex items-center gap-1">
              <MapPinIcon className="h-3 w-3" /> Adresse
            </dt>
            <dd className="mt-0.5 font-semibold text-slate-800">{address}</dd>
          </div>
        </div>
      </div>

      {/* Official badge */}
      <div className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs">
        <div className="font-black uppercase tracking-wide text-slate-400">Steuerpflichtiger</div>
        <div className="mt-1 font-black text-slate-700">
          OWN-{citizen?.user?.id || currentCitizen?.id || "—"}
        </div>
        <StatusBadge value="active" />
      </div>
    </div>
  );
}

function DogCard({ dog, onMove, onViewNotice }) {
  const isListenhund = dog.dog_type === "LISTENHUND" || dog.dog_type?.toLowerCase() === "listenhund";
  return (
    <article className={`rounded-xl border p-5 shadow-sm ${isListenhund ? "border-orange-200 bg-orange-50/30" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isListenhund ? "bg-orange-100" : "bg-blue-50"}`}>
            <PawIcon className={`h-5 w-5 ${isListenhund ? "text-orange-600" : "text-blue-600"}`} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-950">{dog.dog_name}</h3>
            <p className="text-xs font-semibold text-slate-500">{dog.breed}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge value={dog.registration_status} />
          {isListenhund && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase text-orange-700 ring-1 ring-orange-200">
              <AlertTriangleIcon className="h-3 w-3" /> Listenhund
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Chipnummer</dt>
          <dd className="mt-0.5 font-mono text-xs font-semibold text-slate-700">{fmt(dog.chip_number)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Jahressteuer</dt>
          <dd className="mt-0.5 font-black text-slate-900">{fmtEuro(dog.annual_tax_eur)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Angemeldet seit</dt>
          <dd className="mt-0.5 font-semibold text-slate-700">{fmtDate(dog.registration_start_date)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Gemeinde</dt>
          <dd className="mt-0.5 font-semibold text-slate-700">{fmt(dog.municipality_name)}</dd>
        </div>
        {dog.active_transfer_status ? (
          <div className="col-span-2">
            <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">Ummeldung</dt>
            <dd className="mt-0.5"><StatusBadge value={dog.active_transfer_status} /></dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button
          className="primary text-sm"
          type="button"
          onClick={() => onMove(dog.registration_id)}
        >
          Ummelden →
        </button>
        <button
          className="secondary text-sm"
          type="button"
          onClick={() => onViewNotice(dog.registration_id)}
        >
          Bescheid
        </button>
      </div>
    </article>
  );
}

function ServiceTile({ icon, title, germanTitle, description, legal, duration, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-[#0f2e55] transition group-hover:bg-blue-50">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dienstleistung</p>
          <h3 className="text-base font-black text-slate-950 group-hover:text-blue-800">{germanTitle}</h3>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>

      {/* Meta */}
      <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {legal ? <p><span className="font-black">Rechtsgrundlage:</span> {legal}</p> : null}
        {duration ? <p><span className="font-black">Dauer:</span> {duration}</p> : null}
        <p><span className="font-black">Gebühr:</span> Kostenlos (Steuer wird nach Genehmigung berechnet)</p>
      </div>

      {/* CTA */}
      <div className="mt-4 flex items-center gap-2 font-black text-blue-700 group-hover:text-blue-800 text-sm">
        Dienst starten <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function TransferRequestCard({ transfer, onViewFull }) {
  const status = normalizeStatus(transfer.status);
  const stepIndex = getStepIndex(status);
  const isTerminal = ["completed", "source_rejected", "target_rejected", "rejected", "cancelled"].includes(status);
  const from = transfer.from_municipality || "Quelle";
  const to = transfer.to_municipality || "Ziel";
  const dogName = transfer.dog_name || transfer.transfer_payload?.dog_name || "Hund";
  const taxAmount = transfer.tax_assessment?.amount_eur ?? transfer.annual_tax_amount ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-slate-950">Antrag #{transfer.id}</span>
            <GroupPill status={transfer.status} />
            {isTerminal && <StatusBadge value={transfer.status} />}
            {transfer.payment_required && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 ring-1 ring-amber-200">
                💰 Zahlung erforderlich
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {dogName} · {from} → {to}
          </p>
          {taxAmount != null ? (
            <p className="mt-0.5 text-sm font-black text-emerald-700">Berechnete Steuer: € {taxAmount}/Jahr</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onViewFull(transfer)}
          className="secondary shrink-0 text-xs"
        >
          <ClockIcon className="mr-1.5 inline h-3.5 w-3.5" />
          Timeline ansehen
        </button>
      </div>

      {/* Mini progress */}
      {!isTerminal && stepIndex >= 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-wide text-slate-400">
            <span>Schritt {stepIndex + 1} von 8</span>
            <span>{Math.round(((stepIndex + 1) / 8) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${((stepIndex + 1) / 8) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-slate-500">
            {TRANSFER_STEPS_MINI[stepIndex]?.title || "In Bearbeitung"}
          </p>
        </div>
      ) : null}

      {status === "completed" ? (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
          Ummeldung erfolgreich abgeschlossen
        </div>
      ) : null}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CitizenHome({
  currentUserId,
  currentCitizen,
  health,
  selectedMunicipalityId,
  selectedTenant,
  setActivePage,
  setSelectedTransferRegistrationId,
  tenants = [],
}) {
  const [citizen, setCitizen] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const citizenContext = useMemo(
    () => demoContext({ role: "citizen", municipalityId: selectedMunicipalityId, userId: currentUserId }),
    [currentUserId, selectedMunicipalityId],
  );

  const dogs = citizen?.dogs || [];

  async function load() {
    if (!currentUserId || !selectedMunicipalityId) return;
    setLoading(true);
    setError("");
    try {
      const [citizenData, transferData] = await Promise.all([
        apiGet("/citizen/me", selectedTenant, citizenContext),
        apiGet("/transfer-requests", selectedTenant, citizenContext),
      ]);
      setCitizen(citizenData);
      setTransfers(transferData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotice(registrationId) {
    try {
      const data = await apiGet(`/registrations/${registrationId}/notice`, selectedTenant, citizenContext);
      setNotice(data.notice);
    } catch (err) {
      setError(err.message);
    }
  }

  function startMove(registrationId) {
    setSelectedTransferRegistrationId(registrationId);
    setActivePage("request-transfer");
  }

  useEffect(() => {
    load();
  }, [currentUserId, selectedMunicipalityId]);

  return (
    <div className="space-y-6">
      {/* Registration notice modal */}
      {notice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-black text-slate-950">Steuerbescheid (Bescheid)</h2>
              <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => setNotice(null)}>✕</button>
            </div>
            <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap p-6 font-mono text-sm text-slate-800 leading-6">
              {notice}
            </pre>
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button className="primary" onClick={() => setNotice(null)}>Schließen</button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      {/* 1 ─ Profile */}
      <ProfileCard citizen={citizen} currentCitizen={currentCitizen} />

      {/* 2 ─ My Dogs */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <PawIcon className="h-5 w-5 text-slate-500" />
            Meine Hunde
          </h2>
          <button
            className="secondary text-xs"
            type="button"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Wird geladen…" : "Aktualisieren"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
            Registrierungen werden geladen…
          </div>
        ) : dogs.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {dogs.map((dog) => (
              <DogCard
                key={dog.registration_id}
                dog={dog}
                onMove={startMove}
                onViewNotice={fetchNotice}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8">
            <p className="text-sm font-semibold text-slate-700">Keine Hunde registriert.</p>
            <p className="mt-1 text-sm text-slate-500">Sie können einen neuen Hund über den Anmeldungs-Dienst unten registrieren.</p>
          </div>
        )}
      </section>

      {/* 3 ─ Government Service Tiles */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-800">Bürgeramt Online</p>
          <h2 className="mt-0.5 text-lg font-black text-slate-950">Verfügbare Dienstleistungen</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ServiceTile
            icon={<FileIcon className="h-6 w-6" />}
            germanTitle="Anmeldung"
            title="Dog Tax Registration"
            description="Melden Sie einen neuen Hund bei Ihrer Gemeinde zur Hundesteuer an. Die Steuer wird automatisch nach behördlicher Genehmigung berechnet."
            legal="§ 1 Hundesteuersatzung"
            duration="ca. 5 Minuten online"
            onClick={() => setActivePage("register-dog")}
          />
          <ServiceTile
            icon={<SendIcon className="h-6 w-6" />}
            germanTitle="Ummeldung"
            title="Inter-Municipal Transfer"
            description="Beim Umzug in eine andere Stadt wird Ihre Hundesteuerregistrierung einmalig übermittelt — kein doppeltes Einreichen von Daten."
            legal="EU Once-Only Prinzip (seit 2023)"
            duration="ca. 3 Minuten online"
            onClick={() => {
              if (dogs[0]) startMove(dogs[0].registration_id);
              else setActivePage("request-transfer");
            }}
          />
        </div>
      </section>

      {/* 4 ─ My Requests & Decisions */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-800">Behördliche Bescheide</p>
            <h2 className="mt-0.5 flex items-center gap-2 text-lg font-black text-slate-950">
              <ClockIcon className="h-5 w-5 text-slate-500" />
              Meine Anträge & Bescheide
            </h2>
          </div>
          <button
            type="button"
            className="secondary text-xs"
            onClick={() => setActivePage("transfer-status")}
          >
            Alle ansehen →
          </button>
        </div>

        {transfers.length ? (
          <div className="space-y-3">
            {transfers.slice(0, 5).map((transfer) => (
              <TransferRequestCard
                key={transfer.id}
                transfer={transfer}
                onViewFull={() => setActivePage("transfer-status")}
              />
            ))}
            {transfers.length > 5 ? (
              <button
                type="button"
                className="secondary w-full text-sm"
                onClick={() => setActivePage("transfer-status")}
              >
                Alle {transfers.length} Anträge anzeigen →
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <ClockIcon className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-600">Keine Anträge vorhanden.</p>
            <p className="mt-1 text-xs text-slate-400">Gestellte Ummeldungsanträge erscheinen hier.</p>
          </div>
        )}
      </section>
    </div>
  );
}
