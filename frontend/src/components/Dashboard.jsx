import { useState, useEffect, useCallback } from "react";
import Ekipa      from "./Ekipa";
import Finanse    from "./Finanse";
import Ekwipunek  from "./Ekwipunek";
import DeleteProjectDialog from "./DeleteProjectDialog";  // ✨ NOWY IMPORT

// Nowoczesne ikony SVG
const ICONS = {
  ekipa: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  finanse: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ekwipunek: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )
};

const TABS = [
  { id: "ekipa",     label: "Ekipa",      icon: ICONS.ekipa },
  { id: "finanse",   label: "Finanse",    icon: ICONS.finanse },
  { id: "ekwipunek", label: "Ekwipunek",  icon: ICONS.ekwipunek },
];

function gearByMemberAndCategory(rawItems) {
  const out = {};
  rawItems.forEach(item => {
    if (!out[item.member_id]) out[item.member_id] = {};
    if (!out[item.member_id][item.category]) out[item.member_id][item.category] = [];
    out[item.member_id][item.category].push(item);
  });
  return out;
}

export default function Dashboard({ project, onBack }) {
  const [tab, setTab]             = useState("ekipa");
  const [members, setMembers]     = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [gearItems, setGearItems] = useState([]);   
  const [sharedGear, setSharedGear] = useState([]); 
  const [loading, setLoading]     = useState(true);

  // ✨ NOWY STATE dla potwierdzenia usuwania projektu
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState(null);

  // Bezpieczna normalizacja wydatków (usuwa błąd splitIds is undefined)
  const normalizeExpenses = useCallback((rawExpenses) => {
    return rawExpenses.map(e => {
      const amount = parseFloat(e.amount || 0);
      // BUGFIX: Upewnij się że original_amount jest zawsze poprawnie ustalone
      // Jeśli original_amount nie istnieje, ustaw go na amount
      // (są to zwykle wydatki w PLN gdzie original_amount == amount)
      let original_amount = parseFloat(e.original_amount || 0);
      if (original_amount <= 0 && amount > 0) {
        original_amount = amount;
      }
      
      return {
        ...e,
        id: e.id,
        title: e.title ?? e.description ?? "Wydatek",
        amount: amount,
        original_amount: original_amount,
        currency: e.currency || "PLN",
        payerId: e.payer_id ?? e.paid_by_id,
        splitIds: e.split_ids ?? e.splitIds ?? [],
        date: e.date || ""
      };
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const pid = project.id;
    Promise.all([
      fetch(`/api/members?project_id=${pid}`).then(r => r.json()),
      fetch(`/api/expenses?project_id=${pid}`).then(r => r.json()),
      fetch(`/api/gear?project_id=${pid}`).then(r => r.json()).catch(() => []),
      fetch(`/api/shared_gear?project_id=${pid}`).then(r => r.json()).catch(() => []),
    ]).then(([m, e, g, sg]) => {
      setMembers(m);
      setExpenses(normalizeExpenses(e));
      setGearItems(g);
      setSharedGear(sg);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [project.id, normalizeExpenses]);

  // ── members ───────────────────────────────────────────────────────
  const handleAddMember = useCallback(async (name) => {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, project_id: project.id }),
    });
    const m = await res.json();
    setMembers(prev => [...prev, m]);
  }, [project.id]);

  const handleUpdateMember = useCallback(async (id, name) => {
    await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, project_id: project.id }),
    });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  }, [project.id]);

  const handleDeleteMember = useCallback(async (id) => {
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  // ── expenses (Z dodaną obsługą aktualizacji) ──────────────────────
  const handleAddExpense = useCallback(async (data) => {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: data.title,
        amount: data.amount,
        paid_by_id: data.payerId,
        project_id: project.id,
        split_ids: data.splitIds,
        currency: data.currency,
        original_amount: data.originalAmount,
      }),
    });
    const e = await res.json();
    setExpenses(prev => normalizeExpenses([...prev, e]));
  }, [project.id, normalizeExpenses]);

  const handleUpdateExpense = useCallback(async (id, data) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: data.title,
        amount: data.amount,
        paid_by_id: data.payerId,
        project_id: project.id,
        split_ids: data.splitIds,
        currency: data.currency,
        original_amount: data.originalAmount,
      }),
    });
    const updated = await res.json();
    setExpenses(prev => prev.map(e => e.id === id ? normalizeExpenses([updated])[0] : e));
  }, [project.id, normalizeExpenses]);

  const handleDeleteExpense = useCallback(async (id) => {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── personal gear ─────────────────────────────────────────────────
  const handleAddGear = useCallback(async (memberId, category, name) => {
    const res = await fetch("/api/gear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, member_id: memberId, project_id: project.id, packed: false }),
    });
    const item = await res.json();
    setGearItems(prev => [...prev, item]);
  }, [project.id]);

  const handleToggleGear = useCallback(async (memberId, category, itemId, packed) => {
    await fetch(`/api/gear/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packed }),
    });
    setGearItems(prev => prev.map(i => i.id === itemId ? { ...i, packed } : i));
  }, []);

  const handleDeleteGear = useCallback(async (memberId, category, itemId) => {
    await fetch(`/api/gear/${itemId}`, { method: "DELETE" });
    setGearItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  // ── shared gear ───────────────────────────────────────────────────
  const handleAddSharedGear = useCallback(async (name) => {
    if (!name?.trim()) return;
    const res = await fetch("/api/shared_gear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), project_id: project.id }),
    });
    const item = await res.json();
    setSharedGear(prev => [...prev, item]);
  }, [project.id]);

  const handlePatchSharedGear = useCallback(async (itemId, patch) => {
    await fetch(`/api/shared_gear/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSharedGear(prev => prev.map(i => i.id === itemId ? { ...i, ...patch } : i));
  }, []);

  const handleDeleteSharedGear = useCallback(async (itemId) => {
    await fetch(`/api/shared_gear/${itemId}`, { method: "DELETE" });
    setSharedGear(prev => prev.filter(i => i.id !== itemId));
  }, []);

  // ✨ NOWY HANDLER dla usuwania projektu
  const handleDeleteProject = () => {
    if (!deleteProjectConfirm) return;
    
    fetch(`/api/projects/${deleteProjectConfirm.id}`, { method: "DELETE" })
      .then(() => {
        setDeleteProjectConfirm(null);
        onBack();  // Wróć do listy projektów
      })
      .catch(err => {
        console.error('Error deleting project:', err);
        alert('Błąd przy usuwaniu projektu');
      });
  };

  const myGear = gearByMemberAndCategory(gearItems);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Ładowanie projektu…</span>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Dodane estetyczne zdjęcie w tle projektu z lekkim przyciemnieniem */}
      <div className="app-bg-overlay" style={{ backgroundImage: "url('/image_44d1c1.jpg')" }} />

      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand" onClick={onBack}>
            <div className="brand-icon">
              <svg className="w-6 h-6 text-aurora" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="brand-text">
              <h1>{project.name}</h1>
              {project.description && <span className="subtitle">{project.description}</span>}
            </div>
          </div>

          <nav className="tab-nav desktop-only">
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <span className="tab-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* ✨ ZMIENIONY: Dodany przycisk usuwania projektu */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setDeleteProjectConfirm({ id: project.id, name: project.name })}
              style={{ color: "#dc2626" }}
              title="Usuń ten projekt na zawsze"
            >
              🗑️ Usuń projekt
            </button>
            <button className="btn btn-outline btn-sm back-to-trips-btn" onClick={onBack}>
              ← Wyprawy
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === "ekipa" && (
          <Ekipa
            members={members}
            expenses={expenses}
            myGear={myGear}
            currentUser={null}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        )}
        {tab === "finanse" && (
          <Finanse
            members={members}
            expenses={expenses}
            currentUser={null}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
        {tab === "ekwipunek" && (
          <Ekwipunek
            members={members}
            myGear={myGear}
            sharedGear={sharedGear}
            currentUser={null}
            onAddGear={handleAddGear}
            onToggleGear={handleToggleGear}
            onDeleteGear={handleDeleteGear}
            onAddSharedGear={handleAddSharedGear}
            onPatchSharedGear={handlePatchSharedGear}
            onDeleteSharedGear={handleDeleteSharedGear}
          />
        )}
      </main>

      {/* Responsywny pasek dolny dla urządzeń mobilnych zapobiegający nakładaniu */}
      <nav className="mobile-bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`mobile-nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span className="mobile-nav-icon">{t.icon}</span>
            <span className="mobile-nav-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ✨ NOWY DIALOG dla usuwania projektu */}
      <DeleteProjectDialog
        isOpen={deleteProjectConfirm !== null}
        projectName={deleteProjectConfirm?.name || ''}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProjectConfirm(null)}
      />
    </div>
  );
}
