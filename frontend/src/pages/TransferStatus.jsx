import { useEffect, useMemo, useState } from "react";
import { apiGet, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import TechnicalDetails from "../components/TechnicalDetails.jsx";

const DEMO_CITIZEN_USER_ID = 1001;

const STATUS_GROUPS = {
  pending: ["draft", "citizen submitted", "consent given"],
  review: [
    "abmeldung generated",
    "source finance verified",
    "source finance approved",
    "target finance verified",
    "target finance approved",
    "pending source approval",
    "released by source",
    "target accepted",
  ],
  completed: ["completed"],
  rejected: ["source rejected", "target rejected", "rejected"],
  cancelled: ["cancelled"],
};

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase().replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("de-DE");
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("de-DE");
}

function formatTaxAmount(amount) {
  return amount === null || amount === undefined || amount === "" ? "Pending" : `${amount} EUR`;
}

function getTaxAmount(transfer) {
  return transfer?.tax_assessment?.amount_eur ?? transfer?.annual_tax_amount ?? null;
}

function getDogDisplayName(transfer) {
  return transfer?.dog_name || transfer?.transfer_payload?.dog_name || transfer?.chip_number || "Dog";
}

function humanizeReason(reason) {
  if (!reason) return "Owner moved to another municipality";
  if (reason === "moved_to_other_municipality") return "Owner moved to another municipality";
  return String(reason).replaceAll("_", " ");
}

function getGroup(status) {
  const normalized = normalizeStatus(status);
  if (STATUS_GROUPS.pending.includes(normalized)) return "pending";
  if (STATUS_GROUPS.review.includes(normalized)) return "review";
  if (STATUS_GROUPS.completed.includes(normalized)) return "completed";
  if (STATUS_GROUPS.rejected.includes(normalized)) return "rejected";
  if (STATUS_GROUPS.cancelled.includes(normalized)) return "cancelled";
  return "pending";
}

function getTransferStatusInfo(transfer) {
  const status = normalizeStatus(transfer?.status);
  const from = transfer?.from_municipality || "source municipality";
  const to = transfer?.to_municipality || "target municipality";
  const map = {
    draft: {
      label: "Transfer draft",
      badge: "Pending",
      nextStep: "Submit the transfer request.",
      responsibleParty: "Citizen",
    },
    "citizen submitted": {
      label: "Transfer submitted",
      badge: "Pending",
      nextStep: "Consent must be accepted and the Abmeldung document must be generated.",
      responsibleParty: "Citizen / System",
    },
    "consent given": {
      label: "Consent accepted",
      badge: "Pending",
      nextStep: "The system will generate the Abmeldung document.",
      responsibleParty: "System",
    },
    "abmeldung generated": {
      label: `Waiting for ${from} finance approval`,
      badge: "In review",
      nextStep: `${from} finance office must verify and approve the Abmeldung.`,
      responsibleParty: `${from} finance office`,
    },
    "source finance verified": {
      label: `${from} finance verification completed`,
      badge: "In review",
      nextStep: `${from} finance office must approve the deregistration.`,
      responsibleParty: `${from} finance office`,
    },
    "source finance approved": {
      label: `Waiting for ${to} finance approval`,
      badge: "In review",
      nextStep: `${to} finance office must verify and approve the new registration.`,
      responsibleParty: `${to} finance office`,
    },
    "target finance verified": {
      label: `${to} finance verification completed`,
      badge: "In review",
      nextStep: `${to} finance office must approve the new registration.`,
      responsibleParty: `${to} finance office`,
    },
    "target finance approved": {
      label: "Finalizing transfer",
      badge: "In review",
      nextStep: "The system will close the old registration, create the new registration, and calculate tax.",
      responsibleParty: "System",
    },
    completed: {
      label: "Transfer completed",
      badge: "Completed",
      nextStep: "No action required.",
      responsibleParty: "Completed",
    },
    "source rejected": {
      label: `Rejected by ${from} finance office`,
      badge: "Rejected",
      nextStep: "Review the rejection reason.",
      responsibleParty: `${from} finance office`,
    },
    "target rejected": {
      label: `Rejected by ${to} finance office`,
      badge: "Rejected",
      nextStep: "Review the rejection reason.",
      responsibleParty: `${to} finance office`,
    },
    cancelled: {
      label: "Cancelled",
      badge: "Cancelled",
      nextStep: "No action required.",
      responsibleParty: "Completed",
    },
    "pending source approval": {
      label: `Waiting for ${from} finance approval`,
      badge: "In review",
      nextStep: `${from} finance office must verify and approve the Abmeldung.`,
      responsibleParty: `${from} finance office`,
    },
    "released by source": {
      label: `Waiting for ${to} finance approval`,
      badge: "In review",
      nextStep: `${to} finance office must verify and approve the new registration.`,
      responsibleParty: `${to} finance office`,
    },
    "target accepted": {
      label: "Finalizing transfer",
      badge: "In review",
      nextStep: "The system will close the old registration, create the new registration, and calculate tax.",
      responsibleParty: "System",
    },
    rejected: {
      label: "Rejected",
      badge: "Rejected",
      nextStep: "Review the rejection reason.",
      responsibleParty: "Municipality finance office",
    },
  };
  const info = map[status] || map.draft;
  return { ...info, group: getGroup(status) };
}

function timelineState(transfer, step) {
  const status = normalizeStatus(transfer?.status);
  if (status === "cancelled") return "cancelled";
  if (step.rejectedStatuses?.includes(status)) return "rejected";
  if (step.done()) return "done";
  if (step.currentStatuses?.includes(status)) return "current";
  return "pending";
}

function buildTransferTimeline(transfer) {
  const from = transfer?.from_municipality || "source municipality";
  const to = transfer?.to_municipality || "target municipality";
  const steps = [
    {
      label: "Transfer request submitted",
      timestamp: transfer?.created_at,
      done: () => Boolean(transfer?.created_at) || normalizeStatus(transfer?.status) !== "draft",
      currentStatuses: ["draft"],
    },
    {
      label: "Consent accepted",
      timestamp: transfer?.consent_given_at,
      done: () => Boolean(transfer?.consent_given || transfer?.consent_given_at),
      currentStatuses: ["citizen submitted", "consent given"],
    },
    {
      label: `${from} Abmeldung generated`,
      timestamp: transfer?.abmeldung_generated_at,
      done: () => Boolean(transfer?.abmeldung_generated_at),
      currentStatuses: ["consent given"],
    },
    {
      label: `${from} finance approval`,
      timestamp: transfer?.source_approved_at,
      done: () => Boolean(transfer?.source_approved || transfer?.source_approved_at),
      currentStatuses: ["abmeldung generated", "source finance verified", "pending source approval"],
      rejectedStatuses: ["source rejected"],
    },
    {
      label: `${to} finance approval`,
      timestamp: transfer?.target_approved_at || transfer?.target_accepted_at,
      done: () => Boolean(transfer?.target_accepted || transfer?.target_approved_at),
      currentStatuses: ["source finance approved", "target finance verified", "released by source"],
      rejectedStatuses: ["target rejected"],
    },
    {
      label: "Transfer completed",
      timestamp: transfer?.completed_at,
      done: () => Boolean(transfer?.completed_at) || normalizeStatus(transfer?.status) === "completed",
      currentStatuses: ["target finance approved", "target accepted"],
    },
    {
      label: `New ${to} dog tax calculated`,
      timestamp: transfer?.tax_assessment?.created_at || transfer?.completed_at,
      done: () => Boolean(transfer?.tax_assessment || transfer?.annual_tax_amount),
      currentStatuses: ["completed"],
    },
  ];
  return steps.map((step) => ({ label: step.label, timestamp: step.timestamp, state: timelineState(transfer, step) }));
}

function Badge({ group, children }) {
  const tones = {
    pending: "bg-amber-50 text-amber-900 ring-amber-200",
    review: "bg-blue-50 text-blue-800 ring-blue-200",
    completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    rejected: "bg-red-50 text-red-800 ring-red-200",
    cancelled: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return (
    <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold ring-1 ${tones[group] || tones.pending}`}>
      {children}
    </span>
  );
}

function SummaryCard({ label, value, group }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-slate-600">{label}</span>
        <Badge group={group}>{label}</Badge>
      </div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function Timeline({ transfer }) {
  return (
    <div className="space-y-3">
      {buildTransferTimeline(transfer).map((step, index) => {
        const styles = {
          done: "border-emerald-200 bg-emerald-50 text-emerald-800",
          current: "border-blue-200 bg-blue-50 text-blue-800",
          pending: "border-slate-200 bg-slate-50 text-slate-500",
          rejected: "border-red-200 bg-red-50 text-red-800",
          cancelled: "border-slate-300 bg-slate-100 text-slate-700",
        };
        return (
          <div className="flex gap-3" key={step.label}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-black ${styles[step.state]}`}>
              {index + 1}
            </div>
            <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black text-slate-900">{step.label}</p>
                <Badge group={step.state === "done" ? "completed" : step.state === "rejected" ? "rejected" : step.state === "cancelled" ? "cancelled" : step.state === "current" ? "review" : "pending"}>
                  {step.state}
                </Badge>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">{formatDateTime(step.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value || "-"}</dd>
    </div>
  );
}

export default function TransferStatus({ selectedTenant, selectedMunicipalityId, tenants = [] }) {
  const municipalityId = selectedMunicipalityId || tenants.find((tenant) => tenant.code === selectedTenant)?.id || null;
  const citizenContext = useMemo(
    () => demoContext({ role: "citizen", municipalityId, userId: DEMO_CITIZEN_USER_ID }),
    [municipalityId],
  );
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [document, setDocument] = useState(null);
  const [documentError, setDocumentError] = useState("");

  async function load() {
    if (!municipalityId) return;
    setError("");
    try {
      const transferData = await apiGet("/transfer-requests", null, citizenContext);
      setRows(transferData);
      setSelectedId((current) => (current && transferData.some((transfer) => String(transfer.id) === String(current)) ? current : String(transferData[0]?.id || "")));
    } catch (err) {
      setRows([]);
      setError(err.message);
    }
  }

  async function viewAbmeldung(transferId) {
    setDocument(null);
    setDocumentError("");
    try {
      setDocument(await apiGet(`/transfers/${transferId}/abmeldung-document`, null, citizenContext));
    } catch (err) {
      setDocumentError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [municipalityId]);

  useEffect(() => {
    setDocument(null);
    setDocumentError("");
  }, [selectedId]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((transfer) =>
      [
        transfer.id,
        transfer.dog_name,
        transfer.transfer_payload?.dog_name,
        transfer.chip_number,
        transfer.from_municipality,
        transfer.to_municipality,
        getTransferStatusInfo(transfer).label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [rows, search]);

  const selectedTransfer = useMemo(
    () => rows.find((row) => String(row.id) === String(selectedId)) || filteredRows[0] || rows[0] || null,
    [rows, selectedId, filteredRows],
  );

  const summary = useMemo(() => {
    const counts = { pending: 0, review: 0, completed: 0, rejected: 0, cancelled: 0 };
    rows.forEach((transfer) => {
      counts[getTransferStatusInfo(transfer).group] += 1;
    });
    return counts;
  }, [rows]);

  const selectedStatus = selectedTransfer ? getTransferStatusInfo(selectedTransfer) : null;
  const selectedTax = getTaxAmount(selectedTransfer);
  const isRejected = selectedStatus?.group === "rejected";

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Citizen self-service"
        title="My Transfers"
        description="Track your dog transfer requests, municipality approvals, and final tax calculation."
        action={<button className="primary" type="button" onClick={load}>Refresh</button>}
      />

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Pending" value={summary.pending} group="pending" />
        <SummaryCard label="In review" value={summary.review} group="review" />
        <SummaryCard label="Completed" value={summary.completed} group="completed" />
        <SummaryCard label="Rejected" value={summary.rejected} group="rejected" />
      </div>

      <SectionCard title="Transfer Requests" description="Only transfer requests owned by the current citizen are shown.">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="w-full md:max-w-sm">
            <span className="sr-only">Search transfer requests</span>
            <input
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400"
              placeholder="Search by dog, chip, municipality, or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <p className="text-sm font-semibold text-slate-500">{filteredRows.length} request{filteredRows.length === 1 ? "" : "s"}</p>
        </div>

        {filteredRows.length ? (
          <div className="space-y-3">
            {filteredRows.map((transfer) => {
              const info = getTransferStatusInfo(transfer);
              const active = String(selectedTransfer?.id) === String(transfer.id);
              return (
                <button
                  className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-blue-300 bg-blue-50/70" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"}`}
                  key={transfer.id}
                  type="button"
                  onClick={() => setSelectedId(String(transfer.id))}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-base font-black text-slate-950">Transfer #{transfer.id}</div>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        Dog: {getDogDisplayName(transfer)}
                        <span className="mx-2 text-slate-300">|</span>
                        Chip: {transfer.chip_number || "-"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        From: {transfer.from_municipality || "-"} <span className="mx-2 text-slate-300">|</span> To: {transfer.to_municipality || "-"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 lg:items-end">
                      <Badge group={info.group}>{info.label}</Badge>
                      <span className="text-sm font-semibold text-slate-600">Tax: {formatTaxAmount(getTaxAmount(transfer))}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <p className="font-semibold text-slate-700">Next step: {info.nextStep}</p>
                    <p className="font-semibold text-slate-500 md:text-right">Submitted: {formatDate(transfer.created_at)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            No transfer requests were found for the current citizen.
          </p>
        )}
      </SectionCard>

      {selectedTransfer ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <SectionCard title="Selected Transfer Details">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="Transfer ID" value={`#${selectedTransfer.id}`} />
                <DetailRow label="Dog" value={getDogDisplayName(selectedTransfer)} />
                <DetailRow label="Chip number" value={selectedTransfer.chip_number} />
                <DetailRow label="From municipality" value={selectedTransfer.from_municipality} />
                <DetailRow label="To municipality" value={selectedTransfer.to_municipality} />
                <DetailRow label="Move date" value={formatDate(selectedTransfer.move_date)} />
                <DetailRow label="Deregistration date" value={formatDate(selectedTransfer.deregistration_date)} />
                <DetailRow label="Reason" value={humanizeReason(selectedTransfer.deregistration_reason)} />
                <div className="md:col-span-2">
                  <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Current status</dt>
                  <dd className="mt-2"><Badge group={selectedStatus.group}>{selectedStatus.label}</Badge></dd>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Current Processing Step">
              <div className="grid gap-4 md:grid-cols-3">
                <DetailRow label="Status" value={selectedStatus.label} />
                <DetailRow label="Responsible party" value={selectedStatus.responsibleParty} />
                <DetailRow label="Next step" value={selectedStatus.nextStep} />
              </div>
            </SectionCard>

            <SectionCard title="Documents">
              <div className="grid gap-4 md:grid-cols-3">
                <DetailRow label="Consent stored" value={selectedTransfer.consent_given || selectedTransfer.consent_given_at ? "Yes" : "No"} />
                <DetailRow label="Abmeldung document" value={selectedTransfer.abmeldung_generated_at ? "Generated" : "Pending"} />
                <DetailRow label="Anmeldung request" value={selectedTransfer.target_registration_id ? "Generated" : "Pending"} />
              </div>
              {selectedTransfer.abmeldung_generated_at ? (
                <button className="primary mt-4" type="button" onClick={() => viewAbmeldung(selectedTransfer.id)}>
                  View Abmeldung Document
                </button>
              ) : (
                <p className="mt-4 text-sm font-semibold text-slate-600">Abmeldung document pending</p>
              )}
              {documentError ? <AlertBox type="error">{documentError}</AlertBox> : null}
              {document ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-950">Abmeldung document generated</div>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-4 text-sm leading-6 text-slate-700">{document.generated_content}</pre>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Tax Result">
              {selectedTax !== null && selectedTax !== undefined ? (
                <p className="text-sm font-semibold text-slate-700">
                  New annual tax in {selectedTransfer.to_municipality}: <span className="font-black text-slate-950">{formatTaxAmount(selectedTax)}</span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-slate-700">
                  Tax will be calculated after {selectedTransfer.to_municipality || "the target municipality"} finance approval.
                </p>
              )}
            </SectionCard>

            {isRejected ? (
              <SectionCard title="Rejection Reason">
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailRow
                    label="Rejected by"
                    value={normalizeStatus(selectedTransfer.status) === "source rejected" ? selectedTransfer.from_municipality : selectedTransfer.to_municipality}
                  />
                  <DetailRow label="Reason" value={selectedTransfer.rejection_reason || "No reason provided."} />
                </div>
              </SectionCard>
            ) : null}
          </div>

          <div className="space-y-4">
            <SectionCard title="Status Timeline">
              <Timeline transfer={selectedTransfer} />
            </SectionCard>
            <TechnicalDetails data={selectedTransfer} title="Technical details" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
