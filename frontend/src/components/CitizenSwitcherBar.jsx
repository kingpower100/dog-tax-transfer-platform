export default function CitizenSwitcherBar({ currentCitizen, onSwitchCitizen }) {
  const citizens = [
    { id: 1001, name: "Anna Müller" },
    { id: 1002, name: "Lukas Schneider" },
    { id: 1005, name: "Julia Wagner" },
    { id: 1015, name: "Martina Koch" },
  ];

  return (
    <div className="bg-slate-900 px-4 py-2 text-white flex items-center justify-between text-xs">
      <span className="font-black opacity-60 uppercase tracking-widest">Demo User Switcher:</span>
      <div className="flex gap-2">
        {citizens.map(c => (
          <button
            key={c.id}
            onClick={() => onSwitchCitizen(c)}
            className={`px-3 py-1 rounded-full font-bold transition ${currentCitizen?.id === c.id ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700'}`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
