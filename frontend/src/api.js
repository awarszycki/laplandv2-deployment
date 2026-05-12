const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Members
  getMembers:    ()           => req("GET",    "/members"),
  addMember:     (name)       => req("POST",   "/members", { name }),
  updateMember:  (id, name)   => req("PUT",    `/members/${id}`, { name }),
  deleteMember:  (id)         => req("DELETE", `/members/${id}`),

  // Expenses
  getExpenses:   ()           => req("GET",    "/expenses"),
  addExpense:    (data)       => req("POST",   "/expenses", data),
  deleteExpense: (id)         => req("DELETE", `/expenses/${id}`),

  // Gear
  getGear:       ()           => req("GET",    "/gear"),
  addGear:       (data)       => req("POST",   "/gear", data),
  toggleGear:    (id, packed) => req("PUT",    `/gear/${id}/packed`, { packed }),
  deleteGear:    (id)         => req("DELETE", `/gear/${id}`),

  // Shared gear
  getSharedGear:    ()           => req("GET",    "/shared-gear"),
  addSharedGear:    (name)       => req("POST",   "/shared-gear", { name }),
  patchSharedGear:  (id, data)   => req("PATCH",  `/shared-gear/${id}`, data),
  deleteSharedGear: (id)         => req("DELETE", `/shared-gear/${id}`),
};
