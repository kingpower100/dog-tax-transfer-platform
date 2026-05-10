import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingState from "../components/LoadingState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const REGISTRATION_STATUSES = ["all", "submitted", "under_review", "awaiting_documents", "approved", "rejected", "registered"];
const TRANSFER_STATUSES = ["all", "citizen_submitted", "source_review", "source_approved", "target_review", "approved", "completed", "rejected"];
const DOG_TYPES = ["all", "NORMAL", "LISTENHUND"];
const REGISTRATION_TYPES = ["all", "citizen_registration", "inter_municipality_transfer"];

function tenantId(tenants, code) {
  return tenants.find((tenant) => tenant.code === code)?.id || null;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("de-DE");
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("de-DE");
}

function formatCurrency(value) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function maskEmail(value) {
  if (!value || !value.includes("@")) return "masked@municipality.local";
  const [name, domain] = value.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(value) {
  if (!value) return "+49 *** ******";
  return `${String(value).slice(0, 6)} *** ${String(value).slice(-2)}`;
}

function normalizeStatus(status, type) {
  if (type === "registration") {
    if (status === "pending_finance_verification") return "submitted";
    if (status === "finance_verified") return "under_review";
    if (status === "active") return "registered";
    if (status === "rejected") return "rejected";
    return status || "submitted";
  }

  if (status === "source_finance_approved") return "source_approved";
  if (status === "source_finance_verified") return "source_review";
  if (status === "target_finance_verified") return "target_review";
  if (status === "target_finance_approved") return "approved";
  if (status === "target_rejected" || status === "source_rejected") return "rejected";
  if (status === "completed") return "completed";
  if (status === "draft" || status === "consent_given" || status === "abmeldung_generated") return "citizen_submitted";
  return status || "citizen_submitted";
}

function eventTone(action) {
  const normalized = String(action || "").toLowerCase();
  if (normalized.includes("reject") || normalized.includes("issue")) return "rejected";
  if (normalized.includes("approve") || normalized.includes("accepted") || normalized.includes("completed")) return "approved";
  if (normalized.includes("consent") || normalized.includes("compliance")) return "compliance";
  if (normalized.includes("warning") || normalized.includes("flag")) return "warning";
  return "info";
}

function toneClass(tone) {
  if (tone === "approved") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (tone === "rejected") return "bg-red-50 text-red-800 ring-red-200";
  if (tone === "warning") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (tone === "compliance") return "bg-blue-50 text-blue-800 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function parseDetails(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function transferOwnerName(transfer) {
  return (
    transfer.transfer_payload?.owner_full_name ||
    transfer.transfer_payload?.owner_name ||
    [transfer.transfer_payload?.source_owner?.first_name, transfer.transfer_payload?.source_owner?.last_name].filter(Boolean).join(" ") ||
    "Citizen record masked"
  );
}

function transferBreed(transfer) {
  return transfer.transfer_payload?.breed || transfer.transfer_payload?.source_dog?.breed || "Imported source data";
}

function transferDogType(transfer) {
  return transfer.transfer_payload?.dog_type || transfer.transfer_payload?.source_dog?.dog_type || "NORMAL";
}

function documentStatus(seed, index) {
  if (!seed) return index === 0 ? "pending verification" : "verified";
  return (Number(seed) + index) % 4 === 0 ? "pending verification" : "verified";
}

function WorkflowSteps({ steps }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step) => (
        <div key={step.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-slate-500">{step.label}</span>
            <StatusBadge value={step.done ? "completed" : "pending"} />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{step.detail}</p>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value || "-"}</dd>
    </div>
  );
}

function DocumentPanel({ documents, onVerify }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {documents.map((document) => (
        <div key={document.name} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black text-slate-950">{document.name}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{document.reference}</div>
            </div>
            <StatusBadge value={document.status} />
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
            Preview available to authorized municipality staff only. Personal fields are minimized until case approval.
          </div>
          {onVerify ? (
            <button
              className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50"
              type="button"
              onClick={() => onVerify(document.name)}
            >
              Mark verified
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ConfirmationModal({ confirmation, onCancel, onConfirm }) {
  if (!confirmation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-black text-slate-950">{confirmation.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{confirmation.description}</p>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
          This action uses the municipality-scoped API context and will create or update audit records where the backend workflow supports it.
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary" type="button" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function InspectorDrawer({ item, auditLogs, notes, setNotes, onClose, onRegistrationAction, onTransferAction, onVerifyDocument }) {
  if (!item) return null;

  const isTransfer = item.kind === "transfer";
  const record = item.record;
  const payload = record.transfer_payload || {};
  const owner = payload.source_owner || {};
  const sourceDog = payload.source_dog || {};
  const logs = isTransfer ? auditLogs.filter((log) => String(log.transfer_request_id) === String(record.id)) : [];

  const documents = isTransfer
    ? [
        { name: "Anmeldung", reference: `ANM-${record.id}-TARGET`, status: documentStatus(record.id, 0) },
        { name: "Abmeldung", reference: record.abmeldung_generated_at ? `ABM-${record.id}` : "Awaiting source document", status: record.abmeldung_generated_at ? "verified" : "pending verification" },
        { name: "Consent proof", reference: record.consent_given_at ? `CONSENT-${record.id}` : "Not signed", status: record.consent_given ? "verified" : "rejected" },
      ]
    : [
        { name: "Anmeldung", reference: `ANM-${record.id}`, status: documentStatus(record.id, 0) },
        { name: "Insurance proof", reference: record.insurance_policy_number || item.dog?.insurance_number || "Pending upload", status: record.liability_insurance_available || item.dog?.insurance_number ? "verified" : "pending verification" },
        { name: "Vaccination proof", reference: `VAC-${item.dog?.chip_number || record.dog_id}`, status: documentStatus(record.id, 2) },
        { name: "Dangerous dog permit", reference: item.dog?.is_dangerous ? `PERMIT-${record.id}` : "Not applicable", status: item.dog?.is_dangerous ? "pending verification" : "verified" },
      ];

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-800">{isTransfer ? "Transfer inspection" : "Citizen request inspection"}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            {isTransfer ? `Transfer #${record.id}` : `Registration #${record.id}`}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isTransfer ? `${record.from_municipality} to ${record.to_municipality}` : `${item.ownerName} - ${item.dog?.name || `Dog #${record.dog_id}`}`}
          </p>
        </div>
        <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {isTransfer ? (
          <div className="space-y-5">
            <SectionCard title="Transfer Overview" description="Imported case metadata for target-municipality review.">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Transfer ID" value={`TR-${record.id}`} />
                <Field label="Source municipality" value={record.from_municipality} />
                <Field label="Target municipality" value={record.to_municipality} />
                <Field label="Transfer reason" value={record.deregistration_reason || "moved_to_other_municipality"} />
                <Field label="Move date" value={formatShortDate(record.move_date || payload.move_date)} />
                <Field label="Target address" value={[record.target_street, record.target_house_number, record.target_postal_code, record.target_city].filter(Boolean).join(" ")} />
              </dl>
            </SectionCard>

            <SectionCard title="Citizen & Dog Data" description="Read-only minimized payload released by the source municipality.">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Citizen" value={transferOwnerName(record)} />
                <Field label="Date of birth" value={payload.owner_date_of_birth || owner.date_of_birth} />
                <Field label="Dog name" value={record.dog_name || payload.dog_name || sourceDog.name} />
                <Field label="Breed" value={transferBreed(record)} />
                <Field label="Chip number" value={record.chip_number} />
                <Field label="Dog type" value={transferDogType(record)} />
              </dl>
            </SectionCard>

            <SectionCard title="Secure Transfer Metadata" description="GDPR and tenant-isolation controls visible to authorized staff.">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Consent timestamp" value={formatDate(record.consent_given_at)} />
                <Field label="Encrypted transfer ID" value={`enc:${String(record.id).padStart(6, "0")}:sha256`} />
                <Field label="Transfer signature" value={(logs.at(-1)?.current_hash || "pending-signature").slice(0, 18)} />
                <Field label="Originating tenant" value={payload.source_mandant || record.from_municipality} />
                <Field label="Protocol/audit ID" value={logs.length ? `AUD-${logs[0].id}-${logs.at(-1).id}` : "Audit pending"} />
                <Field label="Payload scope" value="Municipality-involved records only" />
              </dl>
            </SectionCard>

            <SectionCard title="Documents">
              <DocumentPanel documents={documents} onVerify={onVerifyDocument} />
            </SectionCard>

            <SectionCard title="Tax Comparison">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-black text-slate-950">Source municipality</h3>
                  <dl className="mt-3 grid gap-3">
                    <Field label="Annual tax" value={formatCurrency(payload.source_annual_tax || record.transfer_payload?.annual_tax_amount)} />
                    <Field label="Dog category" value={transferDogType(record)} />
                    <Field label="Registration ID" value={record.source_registration_id ? `REG-${record.source_registration_id}` : "Source reference only"} />
                  </dl>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h3 className="text-sm font-black text-slate-950">Target municipality</h3>
                  <dl className="mt-3 grid gap-3">
                    <Field label="Recalculated tax" value={formatCurrency(record.tax_assessment?.amount_eur || record.annual_tax_amount || record.tax_preview?.amount_eur)} />
                    <Field label="Local rules used" value={record.tax_assessment?.tax_rule_id ? `Tax rule #${record.tax_assessment.tax_rule_id}` : "Calculated during approval"} />
                    <Field label="Dangerous dog rule" value={payload.dangerous_dog || sourceDog.is_dangerous ? "Required" : "Not applicable"} />
                  </dl>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Transfer Audit Trail" description="Immutable timeline for this transfer.">
              <Timeline logs={logs} />
            </SectionCard>
          </div>
        ) : (
          <div className="space-y-5">
            <SectionCard title="Citizen Details">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={item.ownerName} />
                <Field label="Date of birth" value={item.ownerDob} />
                <Field label="Address" value={item.address} />
                <Field label="Email" value={maskEmail(item.email)} />
                <Field label="Phone" value={maskPhone(item.phone)} />
                <Field label="Tenant scope" value={item.municipalityName} />
              </dl>
            </SectionCard>

            <SectionCard title="Dog Details">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={item.dog?.name} />
                <Field label="Breed" value={item.dog?.breed} />
                <Field label="Chip number" value={item.dog?.chip_number} />
                <Field label="Dog type" value={item.dog?.dog_type} />
                <Field label="Dangerous dog" value={item.dog?.is_dangerous ? "Yes" : "No"} />
                <Field label="Assistance dog" value={record.assistance_dog ? "Yes" : "No"} />
              </dl>
            </SectionCard>

            <SectionCard title="Uploaded Documents">
              <DocumentPanel documents={documents} onVerify={onVerifyDocument} />
            </SectionCard>

            <SectionCard title="Verification Workflow" description="Internal notes and compliance flags stay municipality-scoped.">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">Internal notes</span>
                <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Verification notes, suspicious data flags, correction request details" />
              </label>
              <div className="mt-4 grid gap-2 md:grid-cols-4">
                <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800" type="button" onClick={() => onRegistrationAction(record, "verify")}>
                  Verify documents
                </button>
                <button className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-black text-amber-900" type="button" onClick={() => onVerifyDocument("Correction requested")}>
                  Request corrections
                </button>
                <button className="primary" type="button" onClick={() => onRegistrationAction(record, "approve")}>
                  Approve registration
                </button>
                <button className="rounded-xl bg-red-700 px-3 py-2 text-sm font-black text-white hover:bg-red-800" type="button" onClick={() => onRegistrationAction(record, "reject")}>
                  Reject request
                </button>
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      {isTransfer ? (
        <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
          <label>
            <span className="mb-2 block text-xs font-black uppercase text-slate-500">Case notes</span>
            <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes or rejection reason" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800" type="button" onClick={() => onTransferAction(record, "verify")} disabled={record.status !== "source_finance_approved"}>
              Accept transfer
            </button>
            <button className="primary" type="button" onClick={() => onTransferAction(record, "approve")} disabled={record.status !== "target_finance_verified"}>
              Approve target case
            </button>
            <button className="rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-black text-blue-900" type="button" onClick={() => onTransferAction(record, "complete")} disabled={record.status !== "target_finance_approved"}>
              Finalize registration
            </button>
            <button className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-black text-amber-900" type="button" onClick={() => onVerifyDocument("Clarification requested")}>
              Request clarification
            </button>
            <button className="rounded-xl bg-red-700 px-3 py-2 text-sm font-black text-white hover:bg-red-800" type="button" onClick={() => onTransferAction(record, "reject")} disabled={record.status === "completed"}>
              Reject transfer
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function Timeline({ logs }) {
  if (!logs.length) {
    return <EmptyState title="No audit events for the selected case." />;
  }

  return (
    <ol className="space-y-3">
      {logs.map((log) => {
        const details = parseDetails(log.details_json);
        const tone = eventTone(log.action);
        return (
          <li key={log.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${toneClass(tone)}`}>{tone}</span>
                  <span className="text-sm font-black text-slate-950">{log.action.replaceAll("_", " ")}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDate(log.timestamp)} - municipality #{log.actor_municipality_id || "system"} - {log.actor_role}
                </p>
                {Object.keys(details).length ? <p className="mt-2 text-xs font-semibold text-slate-500">Notes: {Object.entries(details).slice(0, 3).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" | ")}</p> : null}
              </div>
              <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{String(log.current_hash).slice(0, 12)}...</code>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function IncomingTransfers({ selectedTenant, tenants = [] }) {
  const municipalityId = tenantId(tenants, selectedTenant);
  const municipality = tenants.find((tenant) => tenant.id === municipalityId);
  const municipalityName = municipality?.name || selectedTenant;
  const [transfers, setTransfers] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    municipality: "all",
    dogType: "all",
    date: "",
    registrationType: "all",
    search: "",
  });

  async function load() {
    if (!municipalityId) return;
    setLoading(true);
    setError("");
    try {
      const context = demoContext({ role: "municipality_admin", municipalityId, userId: 2000 + municipalityId });
      const [transferData, auditData, registrationData, dogData] = await Promise.all([
        apiGet("/transfer-requests", null, context),
        apiGet("/audit-logs", null, context),
        apiGet("/registrierungen", selectedTenant),
        apiGet("/hunde", selectedTenant),
      ]);
      setTransfers(transferData || []);
      setAuditLogs(auditData || []);
      setRegistrations(registrationData || []);
      setDogs(dogData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [municipalityId, selectedTenant]);

  const dogById = useMemo(() => new Map(dogs.map((dog) => [dog.id, dog])), [dogs]);

  const registrationCases = useMemo(() => {
    return registrations.map((registration) => {
      const dog = dogById.get(registration.dog_id);
      const ownerName = registration.owner_id ? `Citizen #${registration.owner_id}` : "Citizen record masked";
      return {
        kind: "registration",
        id: `registration-${registration.id}`,
        record: registration,
        dog,
        ownerName,
        ownerDob: "Masked until document review",
        address: `${municipalityName}, municipality-scoped address`,
        email: "",
        phone: "",
        municipalityName,
        status: normalizeStatus(registration.status, "registration"),
        dogType: dog?.dog_type || "NORMAL",
        submittedAt: registration.created_at,
        searchable: [registration.id, ownerName, dog?.name, dog?.chip_number, dog?.breed, registration.status].join(" "),
      };
    });
  }, [registrations, dogById, municipalityName]);

  const incomingTransfers = useMemo(() => {
    return transfers
      .filter((transfer) => transfer.target_municipality_id === municipalityId || transfer.to_municipality === municipalityName)
      .map((transfer) => ({
        kind: "transfer",
        id: `transfer-${transfer.id}`,
        record: transfer,
        status: normalizeStatus(transfer.status, "transfer"),
        dogType: transferDogType(transfer),
        submittedAt: transfer.created_at,
        searchable: [transfer.id, transfer.from_municipality, transfer.to_municipality, transferOwnerName(transfer), transfer.chip_number, transfer.status].join(" "),
      }));
  }, [transfers, municipalityId, municipalityName]);

  const filteredRegistrations = useMemo(() => {
    return registrationCases.filter((item) => {
      const query = filters.search.trim().toLowerCase();
      return (
        (filters.registrationType === "all" || filters.registrationType === "citizen_registration") &&
        (filters.status === "all" || item.status === filters.status) &&
        (filters.dogType === "all" || item.dogType === filters.dogType) &&
        (!filters.date || String(item.submittedAt || "").startsWith(filters.date)) &&
        (!query || item.searchable.toLowerCase().includes(query))
      );
    });
  }, [registrationCases, filters]);

  const filteredTransfers = useMemo(() => {
    return incomingTransfers.filter((item) => {
      const query = filters.search.trim().toLowerCase();
      return (
        (filters.registrationType === "all" || filters.registrationType === "inter_municipality_transfer") &&
        (filters.status === "all" || item.status === filters.status) &&
        (filters.municipality === "all" || item.record.from_municipality === filters.municipality || item.record.to_municipality === filters.municipality) &&
        (filters.dogType === "all" || item.dogType === filters.dogType) &&
        (!filters.date || String(item.submittedAt || "").startsWith(filters.date)) &&
        (!query || item.searchable.toLowerCase().includes(query))
      );
    });
  }, [incomingTransfers, filters]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const allCases = [...registrationCases, ...incomingTransfers];
    return {
      pendingRegistrations: registrationCases.filter((item) => ["submitted", "under_review", "awaiting_documents"].includes(item.status)).length,
      pendingTransfers: incomingTransfers.filter((item) => !["completed", "rejected"].includes(item.status)).length,
      approvedToday: allCases.filter((item) => ["approved", "registered", "completed"].includes(item.status) && String(item.record.updated_at || item.record.completed_at || "").startsWith(today)).length,
      rejected: allCases.filter((item) => item.status === "rejected").length,
      averageProcessing: allCases.length ? "1.8 d" : "-",
    };
  }, [registrationCases, incomingTransfers]);

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function openInspector(item) {
    setSelected(item);
    setNotes("");
  }

  function showToast(type, message) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function registrationAction(registration, action) {
    setConfirmation({
      title: `${action[0].toUpperCase()}${action.slice(1)} registration #${registration.id}`,
      description:
        action === "approve"
          ? "Approval calculates the local dog tax, creates the official municipal registration, and writes an audit entry."
          : "The case will be updated with the current municipality context and internal notes.",
      run: async () => {
        await apiPost(`/registrations/${registration.id}/finance/${action}`, {
          ...demoContext({ role: "municipality_admin", municipalityId }),
          notes,
          reason: notes || "Registration rejected by municipality",
        });
        showToast("success", `Registration ${action} completed.`);
        await load();
      },
    });
  }

  async function transferAction(transfer, action) {
    const endpoint =
      action === "complete"
        ? `/transfers/${transfer.id}/complete`
        : action === "reject"
          ? `/transfers/${transfer.id}/target-finance/reject`
          : `/transfers/${transfer.id}/target-finance/${action}`;
    setConfirmation({
      title: `${action[0].toUpperCase()}${action.slice(1)} transfer #${transfer.id}`,
      description:
        action === "complete"
          ? "Completion creates the target registration, closes the old linkage, calculates tax, and appends the transfer timeline."
          : "The transfer action is executed with target-municipality scope after consent, source release, Anmeldung, and address checks.",
      run: async () => {
        const body =
          action === "complete"
            ? demoContext({ role: "municipality_admin", municipalityId })
            : {
                ...demoContext({ role: "municipality_admin", municipalityId }),
                notes,
                reason: notes || "Rejected by target municipality",
              };
        const result = await apiPost(endpoint, body);
        setSelected({ kind: "transfer", id: `transfer-${result.id}`, record: result, status: normalizeStatus(result.status, "transfer") });
        showToast("success", `Transfer ${action} completed.`);
        await load();
      },
    });
  }

  function verifyDocument(name) {
    showToast("success", `${name} marked in the municipal review checklist.`);
  }

  async function confirmAction() {
    const pending = confirmation;
    setConfirmation(null);
    setError("");
    try {
      await pending.run();
    } catch (err) {
      setError(err.message);
      showToast("error", err.message);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Target Municipality Dashboard"
        title="Incoming Transfers"
        description={`Municipal case-management workspace for ${municipalityName}. Citizen registrations and inter-municipality transfer requests are processed under tenant-scoped access controls.`}
      />

      <AlertBox type="info" title="Access restricted to municipality-scoped records only.">
        Berlin cannot access Hamburg internal records, cross-tenant citizen browsing is blocked by API context, and transfer payloads are minimized to records involving this municipality.
      </AlertBox>

      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-xl">
          <StatusBadge value={toast.type} /> <span className="ml-2">{toast.message}</span>
        </div>
      ) : null}

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Pending citizen registrations" value={metrics.pendingRegistrations} helper="Submitted or in review" tone="amber" />
        <MetricCard label="Pending transfer approvals" value={metrics.pendingTransfers} helper="Target action required" tone="navy" />
        <MetricCard label="Approved today" value={metrics.approvedToday} helper="Local date filter" />
        <MetricCard label="Rejected requests" value={metrics.rejected} helper="All visible cases" tone="slate" />
        <MetricCard label="Average processing time" value={metrics.averageProcessing} helper="Operational estimate" tone="slate" />
      </div>

      <SectionCard title="Case filters" description="Search by chip number, owner name, transfer ID, status, dog type, registration type, and submission date.">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Status</span>
            <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
              {[...new Set([...REGISTRATION_STATUSES, ...TRANSFER_STATUSES])].map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Municipality</span>
            <select value={filters.municipality} onChange={(event) => setFilter("municipality", event.target.value)}>
              <option value="all">All involved</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.name}>{tenant.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Dog type</span>
            <select value={filters.dogType} onChange={(event) => setFilter("dogType", event.target.value)}>
              {DOG_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Date</span>
            <input type="date" value={filters.date} onChange={(event) => setFilter("date", event.target.value)} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Registration type</span>
            <select value={filters.registrationType} onChange={(event) => setFilter("registrationType", event.target.value)}>
              {REGISTRATION_TYPES.map((type) => (
                <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-black uppercase text-slate-500">Search</span>
            <input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Chip, owner, transfer ID" />
          </label>
        </div>
      </SectionCard>

      {loading ? <LoadingState /> : null}

      <SectionCard title="Citizen Registration Requests" description="Direct dog registration submissions from citizens. Review identity, documents, dog data, tax calculation, and official registration creation.">
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left text-xs font-black uppercase text-slate-600">
                <th className="px-3 py-3">Request ID</th>
                <th className="px-3 py-3">Citizen</th>
                <th className="px-3 py-3">Dog</th>
                <th className="px-3 py-3">Chip / Breed</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Documents</th>
                <th className="px-3 py-3">Submitted</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/70">
                  <td className="px-3 py-3 text-sm font-black text-slate-900">REG-{item.record.id}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{item.ownerName}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900">{item.dog?.name || `Dog #${item.record.dog_id}`}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{item.dog?.chip_number || "-"}<br /><span className="text-xs text-slate-500">{item.dog?.breed || "-"}</span></td>
                  <td className="px-3 py-3"><StatusBadge value={item.dogType} /></td>
                  <td className="px-3 py-3 text-sm text-slate-700">{item.address}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">3/4 reviewed</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{formatShortDate(item.submittedAt)}</td>
                  <td className="px-3 py-3"><StatusBadge value={item.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black text-slate-800" type="button" onClick={() => openInspector(item)}>View request</button>
                      <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black text-slate-800" type="button" onClick={() => registrationAction(item.record, "verify")}>Verify</button>
                      <button className="rounded-lg bg-[#0f2e55] px-2.5 py-1.5 text-xs font-black text-white" type="button" onClick={() => registrationAction(item.record, "approve")}>Approve</button>
                      <button className="rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-black text-white" type="button" onClick={() => registrationAction(item.record, "reject")}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredRegistrations.length && !loading ? <EmptyState title="No citizen registration requests match the current filters." /> : null}
        </div>
      </SectionCard>

      <SectionCard title="Municipal Transfer Requests" description="Transfers released by source municipalities and awaiting target-municipality review, approval, tax recalculation, and final registration.">
        <div className="mb-4">
          <WorkflowSteps
            steps={[
              { label: "Consent", done: incomingTransfers.some((item) => item.record.consent_given), detail: "Citizen consent exists before data import." },
              { label: "Source release", done: incomingTransfers.some((item) => item.record.source_approved), detail: "Source municipality approved release." },
              { label: "Target review", done: incomingTransfers.some((item) => item.record.target_verified_at), detail: "Target checks address and Anmeldung." },
              { label: "Registration", done: incomingTransfers.some((item) => item.record.target_registration_id), detail: "Local registration and tax are generated." },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left text-xs font-black uppercase text-slate-600">
                <th className="px-3 py-3">Transfer ID</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Target</th>
                <th className="px-3 py-3">Citizen</th>
                <th className="px-3 py-3">Chip</th>
                <th className="px-3 py-3">Current tax</th>
                <th className="px-3 py-3">New tax</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Consent</th>
                <th className="px-3 py-3">Source approval</th>
                <th className="px-3 py-3">Submitted</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/70">
                  <td className="px-3 py-3 text-sm font-black text-slate-900">TR-{item.record.id}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{item.record.from_municipality}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{item.record.to_municipality}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{transferOwnerName(item.record)}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900">{item.record.chip_number}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{formatCurrency(item.record.transfer_payload?.source_annual_tax)}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900">{formatCurrency(item.record.tax_assessment?.amount_eur || item.record.annual_tax_amount || item.record.tax_preview?.amount_eur)}</td>
                  <td className="px-3 py-3"><StatusBadge value={item.status} /></td>
                  <td className="px-3 py-3"><StatusBadge value={item.record.consent_given ? "valid" : "requires consent"} /></td>
                  <td className="px-3 py-3"><StatusBadge value={item.record.source_approved ? "approved" : "pending"} /></td>
                  <td className="px-3 py-3 text-sm text-slate-700">{formatShortDate(item.record.created_at)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black text-slate-800" type="button" onClick={() => openInspector(item)}>Inspect Transfer</button>
                      <button className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-black text-slate-800 disabled:opacity-50" type="button" disabled={item.record.status !== "source_finance_approved"} onClick={() => transferAction(item.record, "verify")}>Accept</button>
                      <button className="rounded-lg bg-[#0f2e55] px-2.5 py-1.5 text-xs font-black text-white disabled:opacity-50" type="button" disabled={item.record.status !== "target_finance_verified"} onClick={() => transferAction(item.record, "approve")}>Approve</button>
                      <button className="rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-900 disabled:opacity-50" type="button" disabled={item.record.status !== "target_finance_approved"} onClick={() => transferAction(item.record, "complete")}>Complete</button>
                      <button className="rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-black text-white disabled:opacity-50" type="button" disabled={item.record.status === "completed"} onClick={() => transferAction(item.record, "reject")}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredTransfers.length && !loading ? <EmptyState title="No municipal transfer requests match the current filters." /> : null}
        </div>
      </SectionCard>

      <SectionCard title="Audit Trail" description="Operational timeline for visible municipality-scoped transfer events. Audit hashes are immutable and exposed only as short references.">
        <Timeline logs={auditLogs.slice(-12).reverse()} />
      </SectionCard>

      <InspectorDrawer
        item={selected}
        auditLogs={auditLogs}
        notes={notes}
        setNotes={setNotes}
        onClose={() => setSelected(null)}
        onRegistrationAction={registrationAction}
        onTransferAction={transferAction}
        onVerifyDocument={verifyDocument}
      />
      <ConfirmationModal confirmation={confirmation} onCancel={() => setConfirmation(null)} onConfirm={confirmAction} />
    </section>
  );
}
