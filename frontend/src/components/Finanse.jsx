import { useState, useMemo, useEffect } from "react";
import { LuWallet, LuArrowLeftRight, LuArrowRight, LuReceipt } from "react-icons/lu";
import ConfirmDialog from "./ConfirmDialog";

const EUR_TO_PLN = 4.35;
const COLORS = ["#00c896", "#f0a500", "#4ca0e0", "#e05555", "#a78bfa", "#fb923c", "#34d399", "#60a5fa"];

function getAvatarColor(id) { return COLORS[(id - 1) % COLORS.length]; }
function initials(name) { return name.slice(0, 2).toUpperCase(); }

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

  function resetForm() {
    setForm({
      title: "",
      amount: "",
      currency: "PLN",
      payerId: members.length > 0 ? members[0].id.toString() : "",
      splitIds: members.map(m => m.id),
    });
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
    resetForm();
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
    resetForm();
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
  const canSave = form.title.trim() && form.amount && form.splitIds.length > 0 && form.payerId && !saving;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* === BILANS === */}
      <div className="card">
        <div className="card-title"><span><LuWallet size={16} /></span> Bilans</div>
        {members.length === 0 ? (
          <div className="empty-state">Najpierw dodaj uczestników w zakładce Ekipa</div>
        ) : (
          <div className="balance-grid">
            {members.map(m => {
              const b = balances[m.id] || 0;
              const cls = b > 0.01 ? "plus" : b < -0.01 ? "minus" : "zero";
              return (
                <div key={m.id} className="balance-item">
                  <div className="avatar avatar-lg" style={{ background: getAvatarColor(m.id), margin: "0 auto 8px" }}>
                    {initials(m.name)}
                  </div>
                  <div className="balance-name">{m.name}</div>
                  <div className={`balance-amount ${cls}`}>{b.toFixed(2)} zł</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === PRZELEWY === */}
      {transfers.length > 0 && (
        <div className="card">
          <div className="card-title"><span><LuArrowLeftRight size={16} /></span> Przelewy</div>
          <ul className="transfer-list">
            {transfers.map((t, i) => (
              <li key={i} className="transfer-item">
                <strong>{t.from}</strong>
                <span className="transfer-arrow"><LuArrowRight size={15} /></span>
                <strong>{t.to}</strong>
                <span className="transfer-amount">{t.amount.toFixed(2)} zł</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* === WYDATKI === */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
          <div className="card-title" style={{ margin: 0, paddingBottom: 0, border: "none" }}>
            <span><LuReceipt size={16} /></span> Wydatki ({expenses.length})
          </div>
          {!showForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} disabled={members.length === 0}>
              + Dodaj
            </button>
          )}
        </div>

        {showForm && (
          <div className="add-form">
            <div className="add-form-title">{editingId ? "Edytuj wydatek" : "Nowy wydatek"}</div>

            <div className="form-group">
              <label className="form-label">Tytuł</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="np. Paliwo, jedzenie, schronisko"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kwota</label>
              <div className="input-row">
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <select
                  style={{ flex: "0 0 92px" }}
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                >
                  <option>PLN</option>
                  <option>EUR</option>
                </select>
              </div>
              {form.currency === "EUR" && form.amount && (
                <div style={{ fontSize: "12px", color: "var(--snow-faint)", marginTop: "6px", fontFamily: "var(--font-mono)" }}>
                  ≈ {amountPLN.toFixed(2)} zł (kurs {EUR_TO_PLN})
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Zapłacił(a)</label>
              <div className="payer-select-wrap">
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`payer-btn ${form.payerId === m.id.toString() ? "active" : ""}`}
                    onClick={() => setForm(f => ({ ...f, payerId: m.id.toString() }))}
                  >
                    <span className="avatar avatar-sm" style={{ background: getAvatarColor(m.id) }}>{initials(m.name)}</span>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Dzielone na</label>
              <div className="person-tiles" style={{ marginTop: 0 }}>
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`person-tile ${form.splitIds.includes(m.id) ? "selected" : ""}`}
                    onClick={() => toggleSplit(m.id)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={saveExpense} disabled={!canSave}>
                {saving ? "Zapisywanie…" : editingId ? "Zapisz zmiany" : "Dodaj wydatek"}
              </button>
              <button className="btn btn-outline" onClick={cancelEdit}>Anuluj</button>
            </div>
          </div>
        )}

        <ul className="expense-list" style={{ marginTop: showForm ? "16px" : "0" }}>
          {expenses.length === 0 && !showForm && (
            <div className="empty-state">
              <div className="empty-icon"><LuReceipt size={30} /></div>
              <div>Brak wydatków — dodaj pierwszy</div>
            </div>
          )}
          {expenses.map(e => (
            <li key={e.id} className="expense-item">
              <div className="avatar" style={{ background: getAvatarColor(e.payerId), marginTop: "2px" }}>
                {initials(getName(e.payerId))}
              </div>
              <div className="expense-info">
                <div className="expense-title">{e.title}</div>
                <div className="expense-meta">
                  zapłacił(a) {getName(e.payerId)}
                  {e.splitIds?.length > 0 ? ` · dzielone na ${e.splitIds.length}` : ""}
                  {e.currency === "EUR" && e.original_amount ? ` · ${e.original_amount.toFixed(2)} €` : ""}
                </div>
              </div>
              <div className="expense-end-block">
                <span className="expense-amount">{e.amount.toFixed(2)} zł</span>
                <div className="expense-actions-row">
                  <button className="btn-icon-action btn-edit-icon" onClick={() => startEdit(e)} title="Edytuj">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="btn-icon-action btn-delete-icon" onClick={() => setDeleteConfirm({ id: e.id, title: e.title })} title="Usuń">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Usunąć wydatek?"
        message={`Czy na pewno chcesz usunąć „${deleteConfirm?.title}"? Operacja jest nieodwracalna.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        isDangerous={true}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
