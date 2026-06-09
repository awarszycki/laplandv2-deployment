import { useState, useEffect, useCallback } from "react";
import Ekipa      from "./Ekipa";
import Finanse    from "./Finanse";
import Ekwipunek  from "./Ekwipunek";

const TABS = [
  { id: "ekipa",     label: "Ekipa",      icon: "⚔️" },
  { id: "finanse",   label: "Finanse",    icon: "💸" },
  { id: "ekwipunek", label: "Ekwipunek",  icon: "🎒" },
];

// ── helpers ──────────────────────────────────────────────────────────
function gearByMemberAndCategory(rawItems) {
  // rawItems: [{id, name, category, packed, member_id}]
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
  const [gearItems, setGearItems] = useState([]);   // personal gear flat list
  const [sharedGear, setSharedGear] = useState([]); // shared gear flat list
  const [loading, setLoading]     = useState(true);

  // ── initial load ──────────────────────────────────────────────────
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
      setExpenses(e);
      setGearItems(g);
      setSharedGear(sg);
      setLoading(false);
    });
  }, [project.id]);

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

  // ── expenses ──────────────────────────────────────────────────────
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
    // normalise to shape Finanse.jsx expects
    setExpenses(prev => [...prev, {
      ...e,
      title: e.title ?? e.description,
      payer_id: e.payer_id ?? e.paid_by_id,
      splitIds: e.split_ids ?? data.splitIds,
      currency: e.currency ?? data.currency ?? "PLN",
      original_amount: e.original_amount ?? data.originalAmount,
    }]);
  }, [project.id]);

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

  // ── derived ───────────────────────────────────────────────────────
  const myGear = gearByMemberAndCategory(gearItems);

  // ── render ────────────────────────────────────────────────────────
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
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand" style={{ cursor: "pointer" }} onClick={onBack}>
            <div className="brand-icon">🧭</div>
            <div className="brand-text">
              <h1>{project.name}</h1>
              {project.description && <span className="subtitle">{project.description}</span>}
            </div>
          </div>

          <nav className="tab-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <button
            className="btn btn-outline btn-sm"
            onClick={onBack}
            title="Wróć do listy wypraw"
          >
            ← Wyprawy
          </button>
        </div>
      </header>

      {/* Content */}
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
    </div>
  );
}
