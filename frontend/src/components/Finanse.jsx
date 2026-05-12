import { useState, useMemo } from "react";

const EUR_TO_PLN = 4.35;
const COLORS = ["#00c896","#f0a500","#4ca0e0","#e05555","#a78bfa","#fb923c","#34d399","#60a5fa"];
function getAvatarColor(id) { return COLORS[(id - 1) % COLORS.length]; }
function initials(name) { return name.slice(0, 2).toUpperCase(); }

export default function Finanse({ members, expenses, currentUser, onAddExpense, onDeleteExpense }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    currency: "PLN",
    payerId: currentUser?.id || members[0]?.id || null,
    splitIds: members.map(m => m.id),
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const amountPLN = form.currency === "EUR"
    ? (parseFloat(form.amount) || 0) * EUR_TO_PLN
    : parseFloat(form.amount) || 0;

  function toggleSplit(id) {
    setForm(f => ({
      ...f,
      splitIds: f.splitIds.includes(id)
        ? f.splitIds.filter(x => x !== id)
        : [...f.splitIds, id],
    }));
  }

  async function addExpense() {
    if (!form.title.trim() || !form.amount || form.splitIds.length === 0) return;
    setSaving(true);
    await onAddExpense({
      title: form.title.trim(),
      amount: amountPLN,
      originalAmount: parseFloat(form.amount),
      currency: form.currency,
      payerId: form.payerId,
      splitIds: form.splitIds,
    });
    setForm(f => ({ ...f, title: "", amount: "", currency: "PLN" }));
    setShowForm(false);
    setSaving(false);
  }

  const balances = useMemo(() => {
    const bal = {};
    members.forEach(m => (bal[m.id] = 0));
    expenses.forEach(e => {
      const share = e.amount / e.splitIds.length;
      e.splitIds.forEach(id => { bal[id] = (bal[id] || 0) - share; });
      bal[e.payer_id ?? e.payerId] = (bal[e.payer_id ?? e.payerId] || 0) + e.amount;
    });
    return bal;
  }, [expenses, members]);

  const transfers = useMemo(() => {
    const debtors   = members.map(m => ({ ...m, bal: balances[m.id] || 0 })).filter(m => m.bal < -0.01).sort((a,b) => a.bal - b.bal);
    const creditors = members.map(m => ({ ...m, bal: balances[m.id] || 0 })).filter(m => m.bal > 0.01).sort((a,b) => b.bal - a.bal);
    const result = [];
    let i = 0, j = 0;
    const d = debtors.map(x => ({ ...x }));
    const c = creditors.map(x => ({ ...x }));
    while (i < d.length && j < c.length) {
      const amount = Math.min(-d[i].bal, c[j].bal);
      result.push({ from: d[i].name, to: c[j].name, amount });
      d[i].bal += amount;
      c[j].bal -= amount;
      if (Math.abs(d[i].bal) < 0.01) i++;
      if (Math.abs(c[j].bal) < 0.01) j++;
    }
    return result;
  }, [balances, members]);

  const getName = id => members.find(m => m.id === id)?.name || "?";
  const getPayerId = e => e.payer_id ?? e.payerId;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

      {/* Bilans */}
      <div className="card">
        <div className="card-title"><span>⚖</span> Bilans</div>
        <div className="balance-grid">
          {members.map(m => {
            const b = balances[m.id] || 0;
            const cls = b > 0.5 ? "plus" : b < -0.5 ? "minus" : "zero";
            return (
              <div key={m.id} className="balance-item">
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(m.id), margin:"0 auto 8px" }}>
                  {initials(m.name)}
                </div>
                <div className="balance-name">{m.name}</div>
                <div className={`balance-amount ${cls}`}>
                  {b >= 0 ? "+" : ""}{b.toFixed(2)} zł
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sugerowane przelewy */}
      {transfers.length > 0 && (
        <div className="card">
          <div className="card-title"><span>↔</span> Sugerowane przelewy</div>
          <ul className="transfer-list">
            {transfers.map((t, i) => (
              <li key={i} className="transfer-item">
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(members.find(m => m.name === t.from)?.id || 1) }}>
                  {initials(t.from)}
                </div>
                <span style={{ fontSize:"14px" }}>{t.from}</span>
                <span className="transfer-arrow">→</span>
                <span style={{ fontSize:"14px" }}>{t.to}</span>
                <span className="transfer-amount">{t.amount.toFixed(2)} zł</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista wydatków */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
          <div className="card-title" style={{ margin:0 }}>
            <span>💸</span> Wydatki ({expenses.length})
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? "✕ Anuluj" : "+ Dodaj"}
          </button>
        </div>

        {showForm && (
          <div className="add-form" style={{ marginBottom:"16px" }}>
            <div className="add-form-title">Nowy wydatek</div>
            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input type="text" placeholder="np. Jedzenie, Paliwo..." value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Kwota</label>
              <div className="input-row">
                <input type="number" placeholder="0.00" min="0" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  style={{ width:"90px", flex:"unset" }}>
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              {form.currency === "EUR" && parseFloat(form.amount) > 0 && (
                <div style={{ fontSize:"12px", color:"var(--snow-faint)", marginTop:"4px" }}>
                  ≈ {amountPLN.toFixed(2)} zł (kurs 4,35)
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Płaci</label>
              <div className="payer-select-wrap">
                {members.map(m => (
                  <button key={m.id}
                    className={`payer-btn ${form.payerId === m.id ? "active" : ""}`}
                    onClick={() => setForm(f => ({ ...f, payerId: m.id }))}>
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(m.id) }}>
                      {initials(m.name)}
                    </div>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dzielone między</label>
              <div className="person-tiles">
                {members.map(m => (
                  <div key={m.id} className={`person-tile ${form.splitIds.includes(m.id) ? "selected" : ""}`}
                    onClick={() => toggleSplit(m.id)}>
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(m.id) }}>
                      {initials(m.name)}
                    </div>
                    {m.name}
                  </div>
                ))}
              </div>
              {form.splitIds.length > 0 && amountPLN > 0 && (
                <div style={{ fontSize:"12px", color:"var(--snow-faint)", marginTop:"6px" }}>
                  {(amountPLN / form.splitIds.length).toFixed(2)} zł / osoba ({form.splitIds.length} os.)
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={addExpense} disabled={saving}>
              {saving ? "Zapisuję..." : "Zapisz wydatek"}
            </button>
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <div>Brak wydatków. Dodaj pierwszy!</div>
          </div>
        ) : (
          <ul className="expense-list">
            {expenses.map(e => (
              <li key={e.id} className="expense-item">
                <div className="avatar" style={{ background: getAvatarColor(getPayerId(e)) }}>
                  {initials(getName(getPayerId(e)))}
                </div>
                <div className="expense-info">
                  <div className="expense-title">{e.title}</div>
                  <div className="expense-meta">
                    {getName(getPayerId(e))} płaci · {e.splitIds.length} os. ·{" "}
                    {e.currency === "EUR" ? `${parseFloat(e.original_amount).toFixed(2)} EUR · ` : ""}
                    {e.date}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
                  <div className="expense-amount">{parseFloat(e.amount).toFixed(2)} zł</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => onDeleteExpense(e.id)}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
