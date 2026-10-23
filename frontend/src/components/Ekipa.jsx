import { useState } from "react";
// 1. Importujemy profesjonalne ikony z zestawu Lucide (lu)
import { LuSwords, LuLayoutDashboard, LuPencil, LuTrash2 } from "react-icons/lu";

const COLORS = ["#00c896","#f0a500","#4ca0e0","#e05555","#a78bfa","#fb923c","#34d399","#60a5fa"];
function getAvatarColor(id) { return COLORS[(id - 1) % COLORS.length]; }
function initials(name) { return name.slice(0, 2).toUpperCase(); }

function getGearStats(gearForMember) {
  let total = 0, packed = 0;
  Object.values(gearForMember || {}).forEach(items => {
    total  += items.length;
    packed += items.filter(i => i.packed).length;
  });
  return { total, packed };
}

export default function Ekipa({ members, expenses, myGear, currentUser, onAddMember, onUpdateMember, onDeleteMember }) {
  const [newName, setNewName]         = useState("");
  const [editingId, setEditingId]     = useState(null);
  const [editingName, setEditingName] = useState("");

  async function addMember() {
    if (!newName.trim()) return;
    await onAddMember(newName.trim());
    setNewName("");
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return;
    await onUpdateMember(id, editingName.trim());
    setEditingId(null);
  }

  async function removeMember(id) {
    const hasExp = expenses.some(e => (e.payer_id ?? e.payerId) === id || e.splitIds.includes(id));
    if (hasExp) { alert("Nie można usunąć tej osoby — ma przypisane wydatki."); return; }
    await onDeleteMember(id);
  }

  const hasExpenses = id => expenses.some(e => (e.payer_id ?? e.payerId) === id || e.splitIds.includes(id));
  const totalSpent  = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Podsumowanie */}
      <div className="card">
        {/* Zmieniono emoji 📊 na ikonę LuLayoutDashboard */}
        <div className="card-title">
          <span><LuLayoutDashboard size={16} /></span> Podsumowanie wyprawy
        </div>
        <div className="stat-tiles">
          <div className="stat-tile stat">
            <div className="stat-label">Uczestnicy</div>
            <div className="stat-value">{members.length}</div>
          </div>
          <div className="stat-tile stat">
            <div className="stat-label">Wydatki</div>
            <div className="stat-value">{expenses.length}</div>
          </div>
          <div className="stat-tile stat">
            <div className="stat-label">Łącznie</div>
            <div className="stat-value warn">{totalSpent.toFixed(2)}<span className="stat-unit">zł</span></div>
          </div>
        </div>
      </div>

      {/* Lista uczestników */}
      <div className="card">
        {/* Zmieniono emoji ⚔️ na ikonę LuSwords */}
        <div className="card-title">
          <span><LuSwords size={16} /></span> Ekipa ({members.length} os.)
        </div>

        <ul className="member-list">
          {members.map(m => {
            const paid  = expenses.filter(e => (e.payer_id ?? e.payerId) === m.id).reduce((s,e) => s + parseFloat(e.amount), 0);
            const gear  = getGearStats(myGear[m.id]);
            const isEd  = editingId === m.id;
            const isMe  = currentUser?.id === m.id;
            return (
              <li key={m.id} className="member-item">
                <div className="avatar avatar-lg" style={{ background: getAvatarColor(m.id) }}>
                  {initials(m.name)}
                </div>
                <div className="member-info">
                  {isEd ? (
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      <input className="name-input" type="text" value={editingName} autoFocus
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(m.id); if (e.key === "Escape") setEditingId(null); }} />
                      <button className="btn btn-primary btn-sm" onClick={() => saveEdit(m.id)}>✓</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                      <div className="member-name">{m.name}</div>
                      {isMe && (
                        <span style={{ fontSize:"10px", background:"var(--aurora-dim)", color:"var(--aurora)", border:"1px solid var(--accent-line)", borderRadius:"10px", padding:"1px 7px", fontFamily:"var(--font-display)", fontWeight:700, letterSpacing:"0.3px" }}>
                          TY
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isEd && (
                  <div className="member-actions" style={{ display: "flex", gap: "4px" }}>
                    {/* Zmieniono emoji ✏ na LuPencil */}
                    <button className="btn btn-outline btn-sm" style={{ display: "flex", alignItems: "center" }} onClick={() => { setEditingId(m.id); setEditingName(m.name); }}>
                      <LuPencil size={14} />
                    </button>
                    {/* Zmieniono emoji 🗑 na LuTrash2 */}
                    <button className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center" }} onClick={() => removeMember(m.id)} disabled={hasExpenses(m.id)}
                      title={hasExpenses(m.id) ? "Ma przypisane wydatki — nie można usunąć" : "Usuń"}>
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                )}
                <div className="stat-row">
                  <div className="stat">
                    <div className="stat-label">Zapłacił(a)</div>
                    <div className="stat-value sm warn">{paid.toFixed(2)}<span className="stat-unit">zł</span></div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Ekwipunek</div>
                    <div className={`stat-value sm${gear.total > 0 && gear.packed === gear.total ? " plus" : ""}`}>
                      {gear.total > 0 ? `${gear.packed}/${gear.total}` : "—"}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="add-form" style={{ marginTop:"16px" }}>
          <div className="add-form-title">Dodaj uczestnika</div>
          <div style={{ display:"flex", gap:"8px" }}>
            <input type="text" placeholder="Imię lub ksywka..." value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addMember()}
              style={{ flex:1 }} />
            <button className="btn btn-primary" onClick={addMember}>+ Dodaj</button>
          </div>
        </div>
      </div>
    </div>
  );
}
