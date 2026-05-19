import React, { useState, useEffect } from 'react';

export default function FinanceManager({ project }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetch(`/api/members?project_id=${project.id}`).then(res => res.json()).then(data => setMembers(data));
    fetch(`/api/expenses?project_id=${project.id}`).then(res => res.json()).then(data => setExpenses(data));
  }, [project.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amount || !paidBy) return;

    const payload = {
      description,
      amount: parseFloat(amount),
      paid_by_id: parseInt(paidBy),
      project_id: project.id
    };

    if (editingExpense) {
      // Tryb edycji: PUT
      fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(updated => {
        setExpenses(expenses.map(exp => exp.id === updated.id ? updated : exp));
        clearForm();
      });
    } else {
      // Tryb tworzenia: POST
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(newExp => {
        setExpenses([...expenses, newExp]);
        clearForm();
      });
    }
  };

  const startEdit = (expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount);
    setPaidBy(expense.paid_by_id);
  };

  const clearForm = () => {
    setEditingExpense(null);
    setDescription('');
    setAmount('');
    setPaidBy('');
  };

  const handleDelete = (id) => {
    fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      .then(() => setExpenses(expenses.filter(e => e.id !== id)));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm max-w-4xl mx-auto my-6">
      <h2 className="text-2xl font-bold text-zinc-800 mb-6">Finanse projektu: {project.name}</h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Opis wydatku</label>
          <input className="w-full p-2.5 rounded-xl border border-zinc-300 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="np. Zakup liofilizatów" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Kwota (PLN)</label>
          <input className="w-full p-2.5 rounded-xl border border-zinc-300 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Kto płacił</label>
          <select className="w-full p-2.5 rounded-xl border border-zinc-300 bg-slate-50 text-sm focus:ring-2 focus:ring-teal-600 focus:bg-white" value={paidBy} onChange={e => setPaidBy(e.target.value)} required>
            <option value="">Wybierz...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 bg-teal-800 hover:bg-teal-900 text-white font-medium py-2.5 rounded-xl text-sm shadow-sm transition-all">
            {editingExpense ? 'Zapisz' : 'Dodaj'}
          </button>
          {editingExpense && (
            <button type="button" onClick={clearForm} className="bg-zinc-200 hover:bg-zinc-300 text-zinc-700 py-2.5 px-3 rounded-xl text-sm transition-all">
              Anuluj
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-zinc-500 font-semibold border-b border-zinc-200">
            <tr>
              <th className="p-4">Opis</th>
              <th className="p-4">Kwota</th>
              <th className="p-4">Płatnik</th>
              <th className="p-4 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {expenses.map(e => {
              const payer = members.find(m => m.id === e.paid_by_id);
              return (
                <tr key={e.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-zinc-900">{e.description}</td>
                  <td className="p-4 text-zinc-700">{e.amount.toFixed(2)} PLN</td>
                  <td className="p-4 text-zinc-600">{payer ? payer.name : 'Nieznany'}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => startEdit(e)} className="text-teal-700 hover:text-teal-950 font-medium">Edytuj</button>
                    <button onClick={() => handleDelete(e.id)} className="text-rose-600 hover:text-rose-800 font-medium">Usuń</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}