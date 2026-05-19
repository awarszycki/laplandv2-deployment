import React, { useState, useEffect } from 'react';

export default function ProjectSelector({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error("Błąd pobierania projektów:", err));
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: desc })
    })
    .then(res => res.json())
    .then(newProj => {
      setProjects([...projects, newProj]);
      onSelectProject(newProj);
    })
    .catch(err => console.error("Błąd tworzenia projektu:", err));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-teal-950 mb-2">Nordic Planner</h1>
        <p className="text-zinc-500">Wybierz wyprawę lub utwórz nowy projekt podróży</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Lista Projektów */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-zinc-800">Twoje Wyprawy</h2>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-zinc-400 text-sm">Brak zdefiniowanych wypraw. Utwórz pierwszą!</p>
            ) : (
              projects.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => onSelectProject(p)} 
                  className="w-full text-left p-4 rounded-xl border border-zinc-200 hover:border-teal-600 hover:bg-teal-50/40 transition-all group"
                >
                  <div className="font-semibold text-zinc-900 group-hover:text-teal-950">{p.name}</div>
                  {p.description && <div className="text-sm text-zinc-500 mt-1">{p.description}</div>}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Formularz Nowego Projektu */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-smh-fit">
          <h2 className="text-xl font-bold mb-4 text-zinc-800">Nowa Przygoda</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Nazwa wyjazdu</label>
              <input 
                className="w-full p-3 rounded-xl border border-zinc-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all" 
                type="text" 
                placeholder="np. Laponia Winter 2026" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Opis / Notatki</label>
              <textarea 
                className="w-full p-3 rounded-xl border border-zinc-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all h-24 resize-none" 
                placeholder="Krótki cel wyprawy, ramy czasowe..." 
                value={desc} 
                onChange={e => setDesc(e.target.value)} 
              />
            </div>
            <button className="w-full bg-teal-800 hover:bg-teal-900 text-white font-medium py-3 rounded-xl shadow-sm transition-all text-sm">
              Utwórz i przejdź do projektu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}