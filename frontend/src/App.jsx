import { useState, useEffect, useCallback } from "react";
import Finanse from "./components/Finanse";
import Ekwipunek from "./components/Ekwipunek";
import Ekipa from "./components/Ekipa";
import { api } from "./api";
import "./App.css";

const AVATAR_COLORS = [
  "#00c896","#f0a500","#4ca0e0","#e05555",
  "#a78bfa","#fb923c","#34d399","#60a5fa",
];

function getAvatarColor(id) { return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length]; }
function initials(name)     { return name.slice(0, 2).toUpperCase(); }

function emptyGear() {
  return { clothing:[], camp:[], food:[], nav:[], electronics:[], hygiene:[], bag:[], docs:[] };
}

// Convert flat gear array from DB → nested { memberId: { catId: [items] } }
function buildMyGear(gearRows, members) {
  const out = {};
  members.forEach(m => { out[m.id] = emptyGear(); });
  gearRows.forEach(row => {
    if (!out[row.member_id]) out[row.member_id] = emptyGear();
    if (!out[row.member_id][row.category]) out[row.member_id][row.category] = [];
    out[row.member_id][row.category].push({ id: row.id, name: row.name, packed: !!row.packed });
  });
  return out;
}

// Toast system
let _addToast = () => {};
export function toast(msg, type = "ok") { _addToast(msg, type); }

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _addToast = (msg, type) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ members, onLogin, onNewMember }) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleNew() {
    if (!newName.trim()) return;
    setCreating(true);
    await onNewMember(newName.trim());
    setCreating(false);
    setNewName("");
  }

  return (
    <div className="login-screen">
      <div className="login-logo">🏔</div>
      <h1 className="login-title">Laponia 2026</h1>
      <p className="login-sub">Kto to ty?</p>

      <div className="login-card">
        <span className="login-label">Wybierz swoje imię</span>
        <div className="login-member-grid">
          {members.map(m => (
            <button key={m.id} className="login-member-btn" onClick={() => onLogin(m)}>
              <span className="av" style={{ background: getAvatarColor(m.id) }}>
                {initials(m.name)}
              </span>
              {m.name}
            </button>
          ))}
        </div>

        <div className="login-divider" />

        <div className="login-new-row">
          <input
            type="text"
            placeholder="Twoje imię lub ksywka..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleNew()}
          />
          <button className="btn btn-primary" onClick={handleNew} disabled={creating}>
            {creating ? "..." : "Dołącz"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading]       = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // { id, name }
  const [activeTab, setActiveTab]   = useState("finanse");

  const [members,    setMembers]    = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [myGear,     setMyGear]     = useState({});
  const [sharedGear, setSharedGear] = useState([]);

  // Load everything from backend
  const loadAll = useCallback(async () => {
    try {
      const [mems, exps, gear, shared] = await Promise.all([
        api.getMembers(),
        api.getExpenses(),
        api.getGear(),
        api.getSharedGear(),
      ]);
      setMembers(mems);
      setExpenses(exps.map(e => ({ ...e, splitIds: e.split_ids })));
      setMyGear(buildMyGear(gear, mems));
      setSharedGear(shared);
    } catch (e) {
      toast("Błąd połączenia z serwerem: " + e.message, "err");
    }
  }, []);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem("lapland_user");
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  function login(member) {
    setCurrentUser(member);
    localStorage.setItem("lapland_user", JSON.stringify(member));
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("lapland_user");
  }

  // ── MEMBERS ──
  async function handleAddMember(name) {
    try {
      const m = await api.addMember(name);
      setMembers(prev => [...prev, m]);
      setMyGear(prev => ({ ...prev, [m.id]: emptyGear() }));
      toast(`${m.name} dołączył do ekipy 🎉`);
      return m;
    } catch(e) { toast(e.message, "err"); }
  }

  async function handleUpdateMember(id, name) {
    try {
      const m = await api.updateMember(id, name);
      setMembers(prev => prev.map(x => x.id === id ? m : x));
      if (currentUser?.id === id) login(m);
      toast("Nazwa zaktualizowana");
    } catch(e) { toast(e.message, "err"); }
  }

  async function handleDeleteMember(id) {
    try {
      await api.deleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
      setMyGear(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast("Uczestnik usunięty");
    } catch(e) { toast(e.message, "err"); }
  }

  // ── EXPENSES ──
  async function handleAddExpense(data) {
    try {
      const e = await api.addExpense({
        title: data.title,
        amount: data.amount,
        original_amount: data.originalAmount,
        currency: data.currency,
        payer_id: data.payerId,
        split_ids: data.splitIds,
      });
      setExpenses(prev => [{ ...e, splitIds: e.split_ids }, ...prev]);
      toast("Wydatek dodany 💸");
    } catch(e) { toast(e.message, "err"); }
  }

  async function handleDeleteExpense(id) {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast("Wydatek usunięty");
    } catch(e) { toast(e.message, "err"); }
  }

  // ── GEAR ──
  async function handleAddGear(memberId, category, name) {
    try {
      const item = await api.addGear({ member_id: memberId, category, name, packed: false });
      setMyGear(prev => ({
        ...prev,
        [memberId]: {
          ...(prev[memberId] || emptyGear()),
          [category]: [...(prev[memberId]?.[category] || []), { id: item.id, name: item.name, packed: !!item.packed }],
        },
      }));
    } catch(e) { toast(e.message, "err"); }
  }

  async function handleToggleGear(memberId, category, itemId, packed) {
    try {
      await api.toggleGear(itemId, packed);
      setMyGear(prev => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [category]: prev[memberId][category].map(i => i.id === itemId ? { ...i, packed } : i),
        },
      }));
    } catch(e) { toast(e.message, "err"); }
  }

  async function handleDeleteGear(memberId, category, itemId) {
    try {
      await api.deleteGear(itemId);
      setMyGear(prev => ({
        ...prev,
        [memberId]: {
          ...prev[memberId],
          [category]: prev[memberId][category].filter(i => i.id !== itemId),
        },
      }));
    } catch(e) { toast(e.message, "err"); }
  }

  // ── SHARED GEAR ──
  async function handleAddSharedGear(name) {
    try {
      const item = await api.addSharedGear(name);
      setSharedGear(prev => [...prev, item]);
    } catch(e) { toast(e.message, "err"); }
  }

  async function handlePatchSharedGear(id, data) {
    try {
      await api.patchSharedGear(id, data);
      setSharedGear(prev => prev.map(i => i.id === id ? { ...i, ...data, taken_by: data.taken_by ?? i.taken_by } : i));
    } catch(e) { toast(e.message, "err"); }
  }

  async function handleDeleteSharedGear(id) {
    try {
      await api.deleteSharedGear(id);
      setSharedGear(prev => prev.filter(i => i.id !== id));
    } catch(e) { toast(e.message, "err"); }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Łączenie z serwerem...</span>
        <ToastContainer />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginScreen
          members={members}
          onLogin={login}
          onNewMember={async name => {
            const m = await handleAddMember(name);
            if (m) login(m);
          }}
        />
        <ToastContainer />
      </>
    );
  }

  const tabs = [
    { id: "finanse",   label: "Finanse",   icon: "💰" },
    { id: "ekwipunek", label: "Ekwipunek", icon: "🎒" },
    { id: "ekipa",     label: "Ekipa",     icon: "⚔️" },
  ];

  return (
    <>
      <div className="app">
        <header className="app-header">
          <div className="header-inner">
            <div className="header-brand">
              <div className="brand-icon">🏔</div>
              <div className="brand-text">
                <h1>Laponia 2026</h1>
                <p className="subtitle">Organizer wyprawy</p>
              </div>
            </div>
            <nav className="tab-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <div
                className="avatar"
                style={{ background: getAvatarColor(currentUser.id), color: "var(--night)", cursor:"pointer" }}
                title={`Zalogowany jako ${currentUser.name}`}
                onClick={logout}
              >
                {initials(currentUser.name)}
              </div>
            </div>
          </div>
        </header>

        <main className="app-main">
          {activeTab === "finanse" && (
            <Finanse
              members={members}
              expenses={expenses}
              currentUser={currentUser}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}
          {activeTab === "ekwipunek" && (
            <Ekwipunek
              members={members}
              myGear={myGear}
              sharedGear={sharedGear}
              currentUser={currentUser}
              onAddGear={handleAddGear}
              onToggleGear={handleToggleGear}
              onDeleteGear={handleDeleteGear}
              onAddSharedGear={handleAddSharedGear}
              onPatchSharedGear={handlePatchSharedGear}
              onDeleteSharedGear={handleDeleteSharedGear}
            />
          )}
          {activeTab === "ekipa" && (
            <Ekipa
              members={members}
              expenses={expenses}
              myGear={myGear}
              currentUser={currentUser}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
            />
          )}
        </main>
      </div>
      <ToastContainer />
    </>
  );
}
