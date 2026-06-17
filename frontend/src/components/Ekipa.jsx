import { useState } from "react";

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
        <div className="card-title"><span>📊</span> Podsumowanie wyprawy</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"10px" }}>
          {[
            { label:"Uczestników", value: members.length, icon:"🧍" },
            { label:"Wydatków",    value: expenses.length, icon:"🧾" },
            { label:"Łącznie",     value: totalSpent.toFixed(2) + " zł", icon:"💰" },
          ].map(stat => (
            <div key={stat.label} className="balance-item">
              <div style={{ fontSize:"20px", marginBottom:"6px" }}>{stat.icon}</div>
              <div className="balance-name">{stat.label}</div>
              <div className="balance-amount" style={{ color:"var(--amber)", fontSize:"15px" }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista uczestników */}
      <div className="card">
        <div className="card-title"><span>⚔️</span> Ekipa ({members.length} os.)</div>

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
                        <span style={{ fontSize:"10px", background:"var(--aurora-dim)", color:"var(--aurora)", border:"1px solid rgba(0,200,150,0.3)", borderRadius:"10px", padding:"1px 7px", fontFamily:"var(--font-display)", fontWeight:700, letterSpacing:"0.3px" }}>
                          TY
                        </span>
                      )}
                    </div>
                  )}
                  <div className="member-stats">
                    Zapłacił: <span style={{ color:"var(--amber)", fontWeight:600 }}>{paid.toFixed(2)} zł</span>
                    {" · "}Ekwipunek: {gear.packed}/{gear.total}
                    {hasExpenses(m.id) && <span style={{ color:"var(--amber)", marginLeft:"6px" }}>· ma wydatki</span>}
                  </div>
                </div>
                {!isEd && (
                  <div className="member-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditingId(m.id); setEditingName(m.name); }}>✏</button>
                    <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}
                      disabled={hasExpenses(m.id)}>🗑</button>
                  </div>
                )}
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
