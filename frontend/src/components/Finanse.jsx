import { useState, useMemo, useEffect } from "react";
import ConfirmDialog from "./ConfirmDialog";

const EUR_TO_PLN = 4.35;
const COLORS = ["#00c896", "#f0a500", "#4ca0e0", "#e05555", "#a78bfa", "#fb923c", "#34d399", "#60a5fa"];

function getAvatarColor(id) { return COLORS[(id - 1) % COLORS.length]; }
function initials(name) { return name.slice(0, 2).toUpperCase(); }

const S = {
  balanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "12px",
  },
  balanceItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "16px 10px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    textAlign: "center",
  },
  balanceName: { fontSize: "13px", opacity: 0.8, fontWeight: 500 },
  balanceValue: { fontSize: "16px", fontWeight: 700 },
  avatar: (color) => ({
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: color,
    color: "#0b0f14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "15px",
    flexShrink: 0,
  }),
  transferList: { display: "flex", flexDirection: "column", gap: "8px" },
  transferRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  transferAmount: {
    fontWeight: 700,
    color: "#00c896",
    whiteSpace: "nowrap",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "14px",
  },
  expenseList: { display: "flex", flexDirection: "column", gap: "8px" },
  expenseRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  expenseTitle: { fontWeight: 600, fontSize: "15px" },
  expenseMeta: { fontSize: "12px", opacity: 0.6, marginTop: "2px" },
  expenseAmount: { fontWeight: 700, fontSize: "15px", whiteSpace: "nowrap" },
  expenseActions: { display: "flex", gap: "6px", flexShrink: 0 },
  iconBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "6px 9px",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: 1,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    padding: "16px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "16px",
  },
  label: { fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.6, marginBottom: "6px", display: "block" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "inherit",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  amountRow: { display: "flex", gap: "10px" },
  pillWrap: { display: "flex", flexWrap: "wrap", gap: "8px" },
  pill: (active, color) => ({
    padding: "7px 14px",
    borderRadius: "999px",
    border: `1px solid ${active ? (color || "#00c896") : "rgba(255,255,255,0.15)"}`,
    background: active ? (color || "#00c896") : "transparent",
    color: active ? "#0b0f14" : "inherit",
    fontWeight: active ? 700 : 500,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.12s ease",
  }),
  formActions: { display: "flex", gap: "10px", marginTop: "4px" },
  primaryBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: "8px",
    border: "none",
    background: "#00c896",
    color: "#0b0f14",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
  ghostBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "inherit",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  addBtn: {
    padding: "9px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#00c896",
    color: "#0b0f14",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
  empty: { padding: "20px", textAlign: "center", opacity: 0.5, fontSize: "14px" },
  preview: { fontSize: "12px", opacity: 0.6, marginTop: "6px" },
};

export default function Finanse({ members, expenses, currentUser, onAddExpense, onUpdateExpense, onDeleteExpense }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    currency: "PLN",
    payerId: members.length > 0 ? members[0].id.toString() : "",
    splitIds: members.map(m => m.id),
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (members.length > 0 && !form.payerId) {
      setForm(f => ({ ...f, payerId: members[0].id.toString(), splitIds: members.map(m => m.id) }));
    }
  }, [members, form.payerId]);

  const amountPLN = form.currency === "EUR" ? (parseFloat(form.amount) || 0) * EUR_TO_PLN : parseFloat(form.amount) || 0;

  function toggleSplit(id) {
    setForm(f => ({
      ...f,
      splitIds: f.splitIds.includes(id) ? f.splitIds.filter(x => x !== id) : [...f.splitIds, id],
    }));
  }

  function startEdit(e) {
    setEditingId(e.id);
    let loadAmount = e.amount;
    const currency = e.currency || "PLN";
    if (currency === "EUR" && e.original_amount) loadAmount = e.original_amount;
    setForm({
      title: e.title,
      amount: loadAmount,
      currency: currency,
      payerId: e.payerId.toString(),
      splitIds: e.splitIds && e.splitIds.length > 0 ? e.splitIds : members.map(m => m.id),
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      title: "",
      amount: "",
      currency: "PLN",
      payerId: members.length > 0 ? members[0].id.toString() : "",
      splitIds: members.map(m => m.id),
    });
    setShowForm(false);
  }

  async function saveExpense() {
    if (!form.title.trim() || !form.amount || form.splitIds.length === 0 || !form.payerId) return;
    setSaving(true);
    const originalAmount = Math.round(parseFloat(form.amount) * 100) / 100;
    const convertedAmount = Math.round(amountPLN * 100) / 100;
    if (isNaN(originalAmount) || originalAmount <= 0) {
      setSaving(false);
      alert("Podaj poprawną kwotę.");
      return;
    }
    const expenseData = {
      title: form.title.trim(),
      amount: convertedAmount,
      originalAmount,
      currency: form.currency,
      payerId: parseInt(form.payerId),
      splitIds: form.splitIds.map(id => parseInt(id)),
    };
    if (editingId) await onUpdateExpense(editingId, expenseData);
    else await onAddExpense(expenseData);
    setEditingId(null);
    setForm({
      title: "",
      amount: "",
      currency: "PLN",
      payerId: members.length > 0 ? members[0].id.toString() : "",
      splitIds: members.map(m => m.id),
    });
    setShowForm(false);
    setSaving(false);
  }

  const handleDeleteConfirmed = () => {
    if (!deleteConfirm) return;
    onDeleteExpense(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const balances = useMemo(() => {
    const bal = {};
    members.forEach(m => (bal[m.id] = 0));
    expenses.forEach(e => {
      const splits = e.splitIds?.length > 0 ? e.splitIds : members.map(m => m.id);
      const share = e.amount / splits.length;
      splits.forEach(id => { bal[id] = (bal[id] || 0) - share; });
      if (e.payerId) bal[e.payerId] = (bal[e.payerId] || 0) + e.amount;
    });
    return bal;
  }, [expenses, members]);

  const transfers = useMemo(() => {
    const debtors = members.map(m => ({ ...m, bal: balances[m.id] || 0 })).filter(m => m.bal < -0.01);
    const creditors = members.map(m => ({ ...m, bal: balances[m.id] || 0 })).filter(m => m.bal > 0.01);
    const result = [];
    let i = 0, j = 0;
    const d = debtors.map(x => ({ ...x }));
    const c = creditors.map(x => ({ ...x }));
    while (i < d.length && j < c.length) {
      const amount = Math.min(-d[i].bal, c[j].bal);
      result.push({ from: d[i].name, to: c[j].name, amount, fromId: d[i].id });
      d[i].bal += amount;
      c[j].bal -= amount;
      if (Math.abs(d[i].bal) < 0.01) i++;
      if (Math.abs(c[j].bal) < 0.01) j++;
    }
    return result;
  }, [balances, members]);

  const getName = id => members.find(m => m.id === id)?.name || "?";

  return (
    <div className="finanse-container">
      {/* === BILANS === */}
      <div className="card">
        <div className="card-title">💰 Bilans</div>
        <div style={S.balanceGrid}>
          {members.map(m => {
            const b = balances[m.id] || 0;
            const color = b > 0.01 ? "#34d399" : b < -0.01 ? "#e05555" : "rgba(255,255,255,0.5)";
            return (
              <div key={m.id} style={S.balanceItem}>
                <div style={S.avatar(getAvatarColor(m.id))}>{initials(m.name)}</div>
                <div style={S.balanceName}>{m.name}</div>
                <div style={{ ...S.balanceValue, color }}>{b.toFixed(2)} zł</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === PRZELEWY === */}
      {transfers.length > 0 && (
        <div className="card">
          <div className="card-title">→ Przelewy</div>
          <div style={S.transferList}>
            {transfers.map((t, i) => (
              <div key={i} style={S.transferRow}>
                <span>
                  <strong>{t.from}</strong> <span style={{ opacity: 0.5 }}>→</span> <strong>{t.to}</strong>
                </span>
                <span style={S.transferAmount}>{t.amount.toFixed(2)} zł</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === WYDATKI === */}
      <div className="card">
        <div style={S.cardHeader}>
          <div className="card-title" style={{ margin: 0 }}>Wydatki ({expenses.length})</div>
          {!showForm && <button style={S.addBtn} onClick={() => setShowForm(true)}>+ Dodaj</button>}
        </div>

        {showForm && (
          <div style={S.form}>
            <div>
              <label style={S.label}>Tytuł</label>
              <input
                style={S.input}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="np. Paliwo, jedzenie, schronisko"
              />
            </div>

            <div>
              <label style={S.label}>Kwota</label>
              <div style={S.amountRow}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
                <select
                  style={{ ...S.input, width: "90px", flex: "0 0 auto" }}
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                >
                  <option>PLN</option>
                  <option>EUR</option>
                </select>
              </div>
              {form.currency === "EUR" && form.amount && (
                <div style={S.preview}>≈ {amountPLN.toFixed(2)} zł (kurs {EUR_TO_PLN})</div>
              )}
            </div>

            <div>
              <label style={S.label}>Zapłacił(a)</label>
              <div style={S.pillWrap}>
                {members.map(m => (
                  <button
                    key={m.id}
                    style={S.pill(form.payerId === m.id.toString())}
                    onClick={() => setForm(f => ({ ...f, payerId: m.id.toString() }))}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={S.label}>Dzielone na</label>
              <div style={S.pillWrap}>
                {members.map(m => (
                  <button
                    key={m.id}
                    style={S.pill(form.splitIds.includes(m.id))}
                    onClick={() => toggleSplit(m.id)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.formActions}>
              <button style={S.primaryBtn} onClick={saveExpense} disabled={!form.payerId || saving}>
                {saving ? "Zapisywanie…" : "Zapisz"}
              </button>
              <button style={S.ghostBtn} onClick={cancelEdit}>Anuluj</button>
            </div>
          </div>
        )}

        <div style={S.expenseList}>
          {expenses.length === 0 && <div style={S.empty}>Brak wydatków</div>}
          {expenses.map(e => (
            <div key={e.id} style={S.expenseRow}>
              <div style={{ minWidth: 0 }}>
                <div style={S.expenseTitle}>{e.title}</div>
                <div style={S.expenseMeta}>
                  zapłacił(a) {getName(e.payerId)}
                  {e.currency === "EUR" && e.original_amount ? ` · ${e.original_amount.toFixed(2)} €` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={S.expenseAmount}>{e.amount.toFixed(2)} zł</span>
                <div style={S.expenseActions}>
                  <button style={S.iconBtn} onClick={() => startEdit(e)}>✏️</button>
                  <button style={S.iconBtn} onClick={() => setDeleteConfirm({ id: e.id, title: e.title })}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Usunąć?"
        message={`Usunąć "${deleteConfirm?.title}"?`}
        confirmText="Usuń"
        cancelText="Anuluj"
        isDangerous={true}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
