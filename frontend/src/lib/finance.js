// Czysta logika rozliczeń — bez Reacta, w pełni testowalna.
export const EPSILON = 0.01;

export function calculateBalances(members, expenses) {
  const bal = {};
  members.forEach(m => { bal[m.id] = 0; });

  expenses.forEach(e => {
    const splits = e.splitIds && e.splitIds.length > 0 ? e.splitIds : members.map(m => m.id);
    if (splits.length === 0) return;

    const share = e.amount / splits.length;
    splits.forEach(id => { bal[id] = (bal[id] || 0) - share; });
    if (e.payerId != null) bal[e.payerId] = (bal[e.payerId] || 0) + e.amount;
  });

  return bal;
}

export function calculateTransfers(balances, members) {
  const debtors = members
    .map(m => ({ ...m, bal: balances[m.id] || 0 }))
    .filter(m => m.bal < -EPSILON)
    .map(x => ({ ...x }));
  const creditors = members
    .map(m => ({ ...m, bal: balances[m.id] || 0 }))
    .filter(m => m.bal > EPSILON)
    .map(x => ({ ...x }));

  const result = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(-debtors[i].bal, creditors[j].bal);
    result.push({ from: debtors[i].name, to: creditors[j].name, amount, fromId: debtors[i].id });
    debtors[i].bal += amount;
    creditors[j].bal -= amount;
    if (Math.abs(debtors[i].bal) < EPSILON) i++;
    if (Math.abs(creditors[j].bal) < EPSILON) j++;
  }
  return result;
}
