import { useState, useEffect } from "react";
import DeleteProjectDialog from "./DeleteProjectDialog";

const COLORS = ["#00c896","#f0a500","#4ca0e0","#e05555","#a78bfa","#fb923c","#34d399","#60a5fa"];
function projColor(id)     { return COLORS[(id - 1) % COLORS.length]; }
function projInitials(name){ return name.slice(0, 2).toUpperCase(); }

export default function ProjectSelector({ onSelectProject }) {
  const [projects, setProjects]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [name, setName]                 = useState("");
  const [desc, setDesc]                 = useState("");
  const [creating, setCreating]         = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  useEffect(() => { loadProjects(); }, []);

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
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: name.trim(), description: desc.trim() || null }),
    });
    const proj = await res.json();
    setCreating(false);
    onSelectProject(proj);
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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
                  {/* Kosz — otwiera DeleteProjectDialog, nie niszczy danych od razu */}
                  <button
                    className="btn-project-delete"
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ id: p.id, name: p.name }); }}
                    title="Usuń wyprawę"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                onKeyDown={e => e.key === "Enter" && handleCreate()}
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
                onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating ? "Tworzenie…" : "Utwórz wyprawę"}
              </button>
              <button className="btn btn-outline" onClick={() => { setShowForm(false); setName(""); setDesc(""); }}>
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog usuwania — jedyne miejsce usuwania projektu */}
      <DeleteProjectDialog
        isOpen={deleteTarget !== null}
        projectName={deleteTarget?.name || ""}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
