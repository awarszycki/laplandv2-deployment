import { useState, useEffect } from "react";

const COLORS = ["#00c896","#f0a500","#4ca0e0","#e05555","#a78bfa","#fb923c","#34d399","#60a5fa"];
function projColor(id) { return COLORS[(id - 1) % COLORS.length]; }
function projInitials(name) { return name.slice(0, 2).toUpperCase(); }

export default function ProjectSelector({ onSelectProject }) {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [name, setName]           = useState("");
  const [desc, setDesc]           = useState("");
  const [creating, setCreating]   = useState(false);
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  function loadProjects() {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const res  = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() || null }),
    });
    const proj = await res.json();
    setCreating(false);
    onSelectProject(proj);
  }

  async function handleDeleteProject(id, e) {
    e.stopPropagation(); // zatrzymuje wejście w projekt przy kliknięciu usuń
    if (!confirm("Czy na pewno chcesz usunąć tę wyprawę oraz wszystkie przypisane koszty i ekwipunek?")) return;
    
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Ładowanie wypraw…</span>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="app-bg-overlay" style={{ backgroundImage: "url('/image_44d1c1.jpg')" }} />
      
      <div className="login-logo">
        <svg className="w-12 h-12 text-aurora mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a13.917 13.917 0 00-3.438-9.571m15.656 5.314a13.942 13.942 0 00-3.321-4.01M16.118 19.11a13.943 13.943 0 01-3.32 4.011M12 11a13.916 13.916 0 003.438 9.571M12 11a13.917 13.917 0 003.438-9.571M21 4a1 1 0 00-1-1h-4a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V4zM4 16a1 1 0 00-1-1H1a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1v4z" />
        </svg>
      </div>
      <div className="login-title">Lapplanner</div>
      <div className="login-sub">Zarządzanie wyjazdami</div>

      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px", zIndex: 10 }}>

        {projects.length > 0 && (
          <div className="login-card">
            <span className="login-label">Twoje aktywne wyjazdy</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {projects.map(p => (
                <div 
                  key={p.id} 
                  className="login-member-btn row-project-item"
                  onClick={() => onSelectProject(p)}
                >
                  <div className="av" style={{ background: projColor(p.id) }}>
                    {projInitials(p.name)}
                  </div>
                  <div style={{ textAlign: "left", flex: 1, marginRight: "10px" }}>
                    <div style={{ fontWeight: 600, color: "var(--snow)", fontSize: "14px" }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: "12px", color: "var(--snow-faint)", marginTop: "2px" }}>
                        {p.description}
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn-project-delete" 
                    onClick={(e) => handleDeleteProject(p.id, e)}
                    title="Usuń projekt"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showForm ? (
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "13px" }}
            onClick={() => setShowForm(true)}
          >
            + Zaplanuj nową wyprawę
          </button>
        ) : (
          <div className="login-card animate-fade-in">
            <span className="login-label">Nowa wyprawa</span>
            <div className="form-group">
              <label className="form-label">Nazwa wyprawy</label>
              <input
                type="text"
                placeholder="np. Trekking 2026"
                value={name}
                autoFocus
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Opis, cel lub termin</label>
              <input
                type="text"
                placeholder="np. szlak, 7 dni"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}
                onClick={handleCreate} disabled={creating}>
                {creating ? "Tworzenie…" : "Utwórz wyprawę"}
              </button>
              <button className="btn btn-outline" onClick={() => { setShowForm(false); setName(""); setDesc(""); }}>
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
