import { UserIcon, PawIcon, AlertTriangleIcon } from "../components/Icons.jsx";

const DEMO_CITIZENS = [
  { id: 1001, name: "Anna Müller", city: "Hannover", dogs: ["Bella (Labrador)"], dangerous: false },
  { id: 1002, name: "Lukas Schneider", city: "Köln", dogs: ["Rocky (Schäferhund)"], dangerous: true },
  { id: 1003, name: "Sarah Becker", city: "Essen", dogs: ["Charlie (Golden)"], dangerous: false },
  { id: 1004, name: "David Fischer", city: "Münster", dogs: ["Luna (Bulldogge)"], dangerous: false },
  { id: 1005, name: "Julia Wagner", city: "Hamburg", dogs: ["Milo (Beagle)"], dangerous: false },
  { id: 1006, name: "Thomas Hoffmann", city: "Frankfurt", dogs: ["Bruno (Rottweiler)"], dangerous: true },
  { id: 1007, name: "Emily Klein", city: "Leipzig", dogs: ["Nala (Pudel)"], dangerous: false },
  { id: 1008, name: "Michael Neumann", city: "Stuttgart", dogs: ["Max (Dackel)"], dangerous: false },
  { id: 1009, name: "Sophie Richter", city: "Nürnberg", dogs: ["Coco (Chihuahua)"], dangerous: false },
  { id: 1010, name: "Daniel Krause", city: "Duisburg", dogs: ["Rex (Staffordshire)"], dangerous: true },
  { id: 1011, name: "Claudia Sommer", city: "Bonn", dogs: ["Frieda", "Oskar"], dangerous: false },
  { id: 1012, name: "Jan Peters", city: "Dortmund", dogs: ["Kira", "Balou"], dangerous: false },
  { id: 1013, name: "Nina Hartmann", city: "Mannheim", dogs: ["Spike (Bullterrier)"], dangerous: true },
  { id: 1014, name: "Leon Weber", city: "Dresden", dogs: ["Loki (Border Collie)"], dangerous: false },
  { id: 1015, name: "Martina Koch", city: "Konstanz", dogs: ["Maja (Cocker)"], dangerous: false },
  { id: 1016, name: "Oliver Bauer", city: "Kiel", dogs: ["Thor (Dobermann)"], dangerous: true },
];

export default function CitizenLoginPage({ onSelectCitizen, onBack }) {
  return (
    <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Bürgerportal</h1>
          <p className="mt-2 text-slate-600">Bitte wählen Sie Ihren Account / Please select your citizen account</p>
        </div>
        <button 
          onClick={onBack}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
        >
          ← Back to role select
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DEMO_CITIZENS.map((citizen) => (
          <button
            key={citizen.id}
            onClick={() => onSelectCitizen(citizen)}
            className="group relative flex flex-col items-start rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-600 hover:ring-4 hover:ring-blue-50"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600">
                <UserIcon className="h-6 w-6" />
              </div>
              {citizen.dangerous && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600" title="Listenhund owner">
                  <AlertTriangleIcon className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="font-black text-slate-950">{citizen.name}</div>
              <div className="text-sm font-semibold text-slate-500">{citizen.city}</div>
            </div>

            <div className="mt-6 flex w-full flex-wrap gap-2 border-t border-slate-100 pt-4">
              {citizen.dogs.map((dog, idx) => (
                <div key={idx} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700">
                  <PawIcon className="h-3 w-3" />
                  {dog}
                </div>
              ))}
            </div>

            <div className="absolute bottom-6 right-6 translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200">
                →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
