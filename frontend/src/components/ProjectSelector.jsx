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
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
      <div className="login-logo">🧭</div>
      <div className="login-title">Nordic Planner</div>
      <div className="login-sub">Wybierz wyprawę lub utwórz nową</div>

      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {projects.length > 0 && (
          <div className="login-card">
            <span className="login-label">Twoje wyprawy</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {projects.map(p => (
                <button
                  key={p.id}
                  className="login-member-btn"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => onSelectProject(p)}
                >
                  <div className="av" style={{ background: projColor(p.id) }}>
                    {projInitials(p.name)}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "var(--snow)", fontSize: "14px" }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: "12px", color: "var(--snow-faint)", marginTop: "1px" }}>
                        {p.description}
                      </div>
                    )}
                  </div>
                </button>
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
            + Nowa wyprawa
          </button>
        ) : (
          <div className="login-card">
            <span className="login-label">Nowa wyprawa</span>
            <div className="form-group">
              <label className="form-label">Nazwa</label>
              <input
                type="text"
                placeholder="np. Laponia Winter 2026"
                value={name}
                autoFocus
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Opis (opcjonalnie)</label>
              <input
                type="text"
                placeholder="Krótki opis, cel, daty…"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}
                onClick={handleCreate} disabled={creating}>
                {creating ? "Tworzę…" : "Utwórz i wejdź"}
              </button>
              <button className="btn btn-outline" onClick={() => { setShowForm(false); setName(""); setDesc(""); }}>
                Anuluj
              </button>
            </div>
          </div>
        )}

        {projects.length === 0 && !showForm && (
          <div style={{ textAlign: "center", color: "var(--snow-faint)", fontSize: "13px" }}>
            Nie masz jeszcze żadnych wypraw
          </div>
        )}
      </div>
    </div>
  );
}
