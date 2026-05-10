import { LandmarkIcon, AlertTriangleIcon, PawIcon } from "../components/Icons.jsx";

export const DEMO_CITIZENS = [
  { id: 1001, firstName: "Anna", lastName: "Müller", city: "Hannover", plz: "30159", street: "Hauptstraße 12", dogs: [{ name: "Bella", breed: "Labrador Retriever", dangerous: false }] },
  { id: 1002, firstName: "Lukas", lastName: "Schneider", city: "Köln", plz: "50667", street: "Ringweg 8", dogs: [{ name: "Rocky", breed: "Deutscher Schäferhund", dangerous: true }] },
  { id: 1003, firstName: "Sarah", lastName: "Becker", city: "Essen", plz: "45127", street: "Gartenstraße 44", dogs: [{ name: "Charlie", breed: "Golden Retriever", dangerous: false }] },
  { id: 1004, firstName: "David", lastName: "Fischer", city: "Münster", plz: "48143", street: "Schillerplatz 3", dogs: [{ name: "Luna", breed: "Französische Bulldogge", dangerous: false }] },
  { id: 1005, firstName: "Julia", lastName: "Wagner", city: "Hamburg", plz: "20095", street: "Elbchaussee 77", dogs: [{ name: "Milo", breed: "Beagle", dangerous: false }] },
  { id: 1006, firstName: "Thomas", lastName: "Hoffmann", city: "Frankfurt am Main", plz: "60311", street: "Bahnhofstraße 19", dogs: [{ name: "Bruno", breed: "Rottweiler", dangerous: true }] },
  { id: 1007, firstName: "Emily", lastName: "Klein", city: "Leipzig", plz: "04109", street: "Parkallee 5", dogs: [{ name: "Nala", breed: "Pudel", dangerous: false }] },
  { id: 1008, firstName: "Michael", lastName: "Neumann", city: "Stuttgart", plz: "70173", street: "Waldweg 14", dogs: [{ name: "Max", breed: "Dackel", dangerous: false }] },
  { id: 1009, firstName: "Sophie", lastName: "Richter", city: "Nürnberg", plz: "90402", street: "Marktplatz 2", dogs: [{ name: "Coco", breed: "Chihuahua", dangerous: false }] },
  { id: 1010, firstName: "Daniel", lastName: "Krause", city: "Duisburg", plz: "47051", street: "Industriestraße 88", dogs: [{ name: "Rex", breed: "Am. Staffordshire Terrier", dangerous: true }] },
  { id: 1011, firstName: "Claudia", lastName: "Sommer", city: "Bonn", plz: "53111", street: "Lindenweg 6", dogs: [{ name: "Frieda", breed: "Mischling", dangerous: false }, { name: "Oskar", breed: "Jack Russell Terrier", dangerous: false }] },
  { id: 1012, firstName: "Jan", lastName: "Peters", city: "Dortmund", plz: "44135", street: "Rosenstraße 21", dogs: [{ name: "Kira", breed: "Siberian Husky", dangerous: false }, { name: "Balou", breed: "Berner Sennenhund", dangerous: false }] },
  { id: 1013, firstName: "Nina", lastName: "Hartmann", city: "Mannheim", plz: "68159", street: "Kirchplatz 9", dogs: [{ name: "Spike", breed: "Bullterrier", dangerous: true }] },
  { id: 1014, firstName: "Leon", lastName: "Weber", city: "Dresden", plz: "01067", street: "Bergstraße 13", dogs: [{ name: "Loki", breed: "Border Collie", dangerous: false }] },
  { id: 1015, firstName: "Martina", lastName: "Koch", city: "Konstanz", plz: "78462", street: "Seestraße 2", dogs: [{ name: "Maja", breed: "Cocker Spaniel", dangerous: false, abgemeldet: true }] },
  { id: 1016, firstName: "Oliver", lastName: "Bauer", city: "Kiel", plz: "24103", street: "Feldweg 30", dogs: [{ name: "Thor", breed: "Dobermann", dangerous: true }] },
];

function initials(citizen) {
  return `${citizen.firstName[0]}${citizen.lastName[0]}`;
}

function avatarColor(id) {
  const palette = [
    "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-rose-600",
    "bg-amber-600", "bg-teal-600", "bg-indigo-600", "bg-pink-600",
  ];
  return palette[(id - 1001) % palette.length];
}

export default function CitizenLoginPage({ onSelectCitizen, onBack }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Official top bar */}
      <header className="bg-[#0f2e55] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10">
              <LandmarkIcon className="h-6 w-6 text-white" />
            </span>
            <div>
              <strong className="block text-lg font-black tracking-tight leading-tight">Bürgerportal · Hundesteuer</strong>
              <span className="text-xs font-semibold text-blue-200">Once-Only Municipal Dog Tax Service · Germany</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-blue-100 transition hover:bg-white/20"
          >
            ← Zurück / Back
          </button>
        </div>
      </header>

      {/* Yellow official notice strip */}
      <div className="border-b border-yellow-300 bg-yellow-50 px-4 py-2 text-center">
        <p className="text-xs font-bold text-yellow-800">
          🔧 Demo-Modus: Wählen Sie ein Bürgerkonto zur Simulation — Select a citizen account to simulate
        </p>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        {/* Page heading */}
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-widest text-blue-800">Bürgerportal · Hundesteuer</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Anmeldung — Konto wählen
          </h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Wählen Sie Ihr Bürgerkonto um Ihre Hundesteuerregistrierungen einzusehen und Anträge zu stellen.
            <br />
            <span className="text-sm text-slate-400">Select your citizen account to view your dog tax registrations and submit applications.</span>
          </p>
        </div>

        {/* Citizen grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEMO_CITIZENS.map((citizen) => {
            const hasListenhund = citizen.dogs.some((d) => d.dangerous);
            const allAbgemeldet = citizen.dogs.every((d) => d.abgemeldet);
            return (
              <button
                key={citizen.id}
                type="button"
                onClick={() => onSelectCitizen(citizen)}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {/* Avatar row */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white ${avatarColor(citizen.id)}`}>
                    {initials(citizen)}
                  </div>
                  {hasListenhund ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-orange-700 ring-1 ring-orange-200">
                      <AlertTriangleIcon className="h-3 w-3" />
                      Listenhund
                    </span>
                  ) : null}
                  {allAbgemeldet ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                      Abgemeldet
                    </span>
                  ) : null}
                </div>

                {/* Name */}
                <div className="mt-3">
                  <p className="text-base font-black text-slate-950 group-hover:text-blue-800">
                    {citizen.firstName} {citizen.lastName}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {citizen.plz} {citizen.city}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{citizen.street}</p>
                </div>

                {/* Dogs */}
                <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                  {citizen.dogs.map((dog) => (
                    <div key={dog.name} className="flex items-center gap-1.5">
                      <PawIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">{dog.name}</span>
                      <span className="text-xs text-slate-400">· {dog.breed}</span>
                      {dog.dangerous ? (
                        <AlertTriangleIcon className="h-3 w-3 shrink-0 text-orange-500" />
                      ) : null}
                      {dog.abgemeldet ? (
                        <span className="text-[10px] text-slate-400">(abgemeldet)</span>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* OWN-ID */}
                <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  OWN-{citizen.id}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white px-6 py-5 text-center text-xs text-slate-400">
        Bürgerportal Hundesteuer · Hackathon Demo · Bundesrepublik Deutschland · 2026
      </footer>
    </div>
  );
}
