import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, demoContext } from "../api/client.js";
import AlertBox from "../components/AlertBox.jsx";
import MetricCard from "../components/MetricCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionCard from "../components/SectionCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

function formatEuro(amount) {
  return amount == null ? "Pending" : `€${amount}`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

export default function CitizenHome({
  currentUserId,
  health,
  selectedMunicipalityId,
  setActivePage,
  setSelectedTransferRegistrationId,
}) {
  const [citizen, setCitizen] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [error, setError] = useState("");

  const citizenContext = useMemo(
    () => demoContext({ role: "citizen", municipalityId: selectedMunicipalityId, userId: currentUserId }),
    [currentUserId, selectedMunicipalityId],
  );
  const dogs = citizen?.dogs || [];

  async function fetchCurrentCitizenDogs() {
    if (!currentUserId || !selectedMunicipalityId) return;
    setLoading(true);
    setError("");
    try {
      setCitizen(await apiGet("/citizen/me", null, citizenContext));
    } catch (err) {
      setError(err.message);
      setCitizen(null);
    } finally {
      setLoading(false);
    }
  }

  async function generateReceiptPreview() {
    setGeneratingReceipt(true);
    setError("");
    try {
      setReceipt(await apiPost("/citizen/me/tax-receipt-preview", citizenContext));
    } catch (err) {
      setError(err.message);
      setReceipt(null);
    } finally {
      setGeneratingReceipt(false);
    }
  }

  function startMove(registrationId) {
    setSelectedTransferRegistrationId(registrationId);
    setActivePage("request-transfer");
  }

  useEffect(() => {
    fetchCurrentCitizenDogs();
  }, [currentUserId, selectedMunicipalityId]);

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Citizen self-service"
        title="Citizen Dashboard"
        description="View your active dog tax registrations and start municipal services for your dogs."
        action={
          <button className="primary" type="button" onClick={fetchCurrentCitizenDogs} disabled={loading || !selectedMunicipalityId}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      {error ? <AlertBox type="error">{error}</AlertBox> : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title={citizen?.user?.name ? `Welcome, ${citizen.user.name}` : "Welcome"}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Citizen email</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{citizen?.user?.email || "Not available"}</div>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-slate-500">Registered in</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{citizen?.owner?.municipality_name || "Not available"}</div>
            </div>
            {citizen?.owner ? (
              <div className="md:col-span-2">
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Current address</div>
                <div className="mt-1 text-sm font-semibold text-slate-800">
                  {citizen.owner.street} {citizen.owner.house_number}, {citizen.owner.postal_code} {citizen.owner.city}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="grid gap-3">
            <button className="primary" type="button" onClick={() => setActivePage("register-dog")}>
              Register a New Dog
            </button>
            <button
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={() => dogs[0] && startMove(dogs[0].registration_id)}
              disabled={!dogs.length}
            >
              Move Dog to Another Municipality
            </button>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <StatusBadge value={health?.status || "offline"} />
              <StatusBadge value="citizen service" />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="My Registered Dogs">
        {loading ? (
          <p className="text-sm font-semibold text-slate-600">Loading registered dogs...</p>
        ) : dogs.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {dogs.map((dog) => (
              <article key={dog.registration_id} className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Dog: {dog.dog_name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{dog.breed}</p>
                  </div>
                  <StatusBadge value={dog.registration_status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Chip number</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{dog.chip_number}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Dog type</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{dog.dog_type}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Current municipality</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{dog.municipality_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Registration start</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{formatDate(dog.registration_start_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Annual tax</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{formatEuro(dog.annual_tax_eur)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Transfer status</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{dog.active_transfer_status || "No active transfer"}</dd>
                  </div>
                  {dog.tax_rule_reference ? (
                    <div className="md:col-span-2">
                      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">Tax rule used</dt>
                      <dd className="mt-1 font-semibold text-slate-800">{dog.tax_rule_reference}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="primary" type="button" onClick={() => startMove(dog.registration_id)}>
                    Move Dog to Another Municipality
                  </button>
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-50"
                    type="button"
                    onClick={() => setActivePage("transfer-status")}
                  >
                    View Registration
                  </button>
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={generateReceiptPreview}
                    disabled={!dog.tax_assessment_id && dog.annual_tax_eur == null}
                  >
                    View Tax Assessment
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">No registered dogs found.</p>
            <p className="mt-1 text-sm text-slate-600">You can register a new dog to start a dog tax registration.</p>
            <button className="primary mt-4" type="button" onClick={() => setActivePage("register-dog")}>
              Register a New Dog
            </button>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Tax Overview">
          <button className="primary" type="button" onClick={generateReceiptPreview} disabled={generatingReceipt || !dogs.length}>
            {generatingReceipt ? "Generating preview..." : "Generate Tax Receipt for All Dogs"}
          </button>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            The preview includes the active dog registrations shown on this dashboard.
          </p>
          {receipt ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-black text-slate-950">Dog Tax Receipt Preview</h3>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Owner</span>
                  <div className="mt-1 font-semibold text-slate-800">{receipt.owner_name || citizen?.user?.name}</div>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Tax period</span>
                  <div className="mt-1 font-semibold text-slate-800">{receipt.tax_period}</div>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Dogs included</span>
                  <div className="mt-1 font-semibold text-slate-800">{receipt.dog_count}</div>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Total amount</span>
                  <div className="mt-1 font-semibold text-slate-800">€{receipt.total_amount_eur}</div>
                </div>
              </div>
              <button className="primary mt-4" type="button" disabled>
                Download Receipt PDF
              </button>
              <p className="mt-2 text-xs font-semibold text-slate-500">PDF export will be available after official approval.</p>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Recent Transfers">
          {dogs.some((dog) => dog.active_transfer_status) ? (
            <div className="space-y-3">
              {dogs.filter((dog) => dog.active_transfer_status).map((dog) => (
                <div key={dog.registration_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="font-black text-slate-950">{dog.dog_name}</div>
                  <div className="mt-1 font-semibold text-slate-700">{dog.active_transfer_status}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-600">No active transfers for your registered dogs.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-300" type="button" onClick={() => setActivePage("register-dog")}>
          <MetricCard label="Register a New Dog" value="Start" helper="Submit a dog tax registration for municipal review." />
        </button>
        <button className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-300" type="button" onClick={() => dogs[0] && startMove(dogs[0].registration_id)} disabled={!dogs.length}>
          <MetricCard label="Move Dog to Another Municipality" value="Start" helper="Start from one of your active dog registrations." />
        </button>
        <button className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-300" type="button" onClick={() => setActivePage("transfer-status")}>
          <MetricCard label="My Transfers" value="View" helper="Track approval status and final tax calculation." />
        </button>
      </div>
    </section>
  );
}
