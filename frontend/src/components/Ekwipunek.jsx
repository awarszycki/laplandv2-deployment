import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import {
  LuShirt, LuTent, LuUtensils, LuCompass,
  LuBatteryFull, LuDroplets, LuLuggage, LuFileText,
  LuHandshake, LuPackageOpen, LuBackpack, LuUsers, LuScale,
  LuPencil, LuCheck, LuX,
} from "react-icons/lu";

const COLORS = ["#00c896","#f0a500","#4ca0e0","#e05555","#a78bfa","#fb923c","#34d399","#60a5fa"];
function getAvatarColor(id) { return COLORS[(id - 1) % COLORS.length]; }

export const CATEGORIES = [
  { id: "clothing",    label: "Odzież",      icon: <LuShirt /> },
  { id: "camp",        label: "Biwak",       icon: <LuTent /> },
  { id: "food",        label: "Jedzenie",    icon: <LuUtensils /> },
  { id: "nav",         label: "Nawigacja",   icon: <LuCompass /> },
  { id: "electronics", label: "Elektronika", icon: <LuBatteryFull /> },
  { id: "hygiene",     label: "Higiena",     icon: <LuDroplets /> },
  { id: "bag",         label: "Bagaż",       icon: <LuLuggage /> },
  { id: "docs",        label: "Dokumenty",   icon: <LuFileText /> },
];

const CAT_SUGGESTIONS = {
  clothing:    ["Bielizna termiczna", "Koszulka z długim rękawem", "Kurtka przeciwdeszczowa", "Spodnie trekkingowe"],
  camp:        ["Śpiwór (letni/3-sezonowy)", "Karimat / mata śpiąca", "Latarka czołowa do namiotu"],
  food:        ["Liofilizaty (x5)", "Kuchenka gazowa", "Kartusz gazowy", "Termos", "Butelka na wodę"],
  nav:         ["Mapa topograficzna", "Kompas", "Latarka czołowa", "Nóż / multitool"],
  electronics: ["Telefon", "Powerbank", "Kabel USB-C", "Ładowarka"],
  hygiene:     ["Apteczka osobista", "Plastry / opatrunki", "Pasta do zębów + szczoteczka", "Ręcznik szybkoschnący"],
  bag:         ["Plecak trekkingowy (40-60L)", "Pokrowiec przeciwdeszczowy", "Worki wodoszczelne"],
  docs:        ["Paszport", "Ubezpieczenie podróżne", "Karta płatnicza", "Gotówka (EUR)"],
};

/** Sumuje wagę elementów z wagą (weight_g > 0), zwraca gramy */
function sumWeight(items) {
  return items.reduce((s, i) => s + (i.weight_g || 0), 0);
}
function gToKg(g) {
  return (g / 1000).toFixed(2);
}

function ProgressBar({ done, total }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className={`progress-fill${pct === 100 ? " done" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">{done}/{total}</span>
    </div>
  );
}

/** Pill wyświetlający całkowitą wagę uczestnika (osobista + shared który bierze) */
function WeightBadge({ weightG, label }) {
  if (weightG === 0) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "12px", fontWeight: 700,
      fontFamily: "var(--font-mono)",
      color: weightG > 15000 ? "var(--amber)" : "var(--aurora)",
      background: weightG > 15000 ? "var(--amber-dim)" : "var(--aurora-dim)",
      border: `1px solid ${weightG > 15000 ? "rgba(217,119,6,0.25)" : "rgba(31,168,90,0.25)"}`,
      borderRadius: "999px",
      padding: "2px 10px",
    }}>
      <LuScale size={13} /> {label}: {gToKg(weightG)} kg
    </span>
  );
}

export default function Ekwipunek({
  members, myGear, sharedGear, currentUser,
  onAddGear, onToggleGear, onDeleteGear, onPatchGear,
  onAddSharedGear, onPatchSharedGear, onDeleteSharedGear,
}) {
  const [activeProfile, setActiveProfile]   = useState(currentUser?.id || members[0]?.id || null);
  const [activeCat, setActiveCat]           = useState("clothing");
  const [newItem, setNewItem]               = useState("");
  const [newItemWeight, setNewItemWeight]   = useState("");   // pole wagi (opcjonalne)
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newSharedItem, setNewSharedItem]   = useState("");
  const [newSharedWeight, setNewSharedWeight] = useState(""); // waga dla wspólnego
  const [deleteConfirm, setDeleteConfirm]   = useState(null); // { id, name, type }
  const [editingId, setEditingId]           = useState(null); // id edytowanej pozycji
  const [editName, setEditName]             = useState("");
  const [editWeight, setEditWeight]         = useState("");

  const profileGear = myGear[activeProfile] || {};
  const catItems    = profileGear[activeCat] || [];

  const allPersonalItems = Object.values(profileGear).flat();
  const totalAll  = allPersonalItems.length;
  const packedAll = allPersonalItems.filter(i => i.packed).length;

  // Waga osobista aktywnego uczestnika (tylko przedmioty z wagą)
  const personalWeightG = sumWeight(allPersonalItems);

  // Waga shared gear przypisana do aktywnego uczestnika
  const sharedWeightG = sumWeight(sharedGear.filter(i => i.taken_by === activeProfile));

  const totalWeightG = personalWeightG + sharedWeightG;

  function catCount(catId) {
    const items = profileGear[catId] || [];
    return { total: items.length, packed: items.filter(i => i.packed).length };
  }

  const suggestions = (CAT_SUGGESTIONS[activeCat] || []).filter(
    s => !catItems.some(i => i.name.toLowerCase() === s.toLowerCase())
  );

  const handleDeleteConfirmed = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "shared_gear") {
      onDeleteSharedGear(deleteConfirm.id);
    } else {
      onDeleteGear(activeProfile, activeCat, deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  function parseWeight(str) {
    const n = parseInt(str, 10);
    return isNaN(n) || n <= 0 ? null : n;
  }

  async function addItem(name) {
    if (!name.trim()) return;
    const w = parseWeight(newItemWeight);
    await onAddGear(activeProfile, activeCat, name.trim(), w);
    setNewItem("");
    setNewItemWeight("");
    setShowSuggestions(false);
  }

  function startEditGear(item) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditWeight(item.weight_g > 0 ? String(item.weight_g) : "");
  }

  function cancelEditGear() {
    setEditingId(null);
    setEditName("");
    setEditWeight("");
  }

  async function saveEditGear(item) {
    if (!editName.trim() || !onPatchGear) { cancelEditGear(); return; }
    const w = parseWeight(editWeight);
    await onPatchGear(activeProfile, activeCat, item.id, {
      name: editName.trim(),
      weight_g: w == null ? 0 : w,
    });
    cancelEditGear();
  }

  async function addSharedItem() {
    if (!newSharedItem.trim()) return;
    const w = parseWeight(newSharedWeight);
    await onAddSharedGear(newSharedItem.trim(), w);
    setNewSharedItem("");
    setNewSharedWeight("");
  }

  const currentCat   = CATEGORIES.find(c => c.id === activeCat);
  const sharedPacked = sharedGear.filter(i => i.packed).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* ── Profil uczestnika + waga całkowita ── */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
          <span className="section-label">Lista uczestnika</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {totalAll > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 600, color: packedAll === totalAll ? "var(--aurora)" : "var(--snow-faint)" }}>
                {packedAll === totalAll ? "✓ Wszystko spakowane!" : `${packedAll} z ${totalAll} spakowane`}
              </span>
            )}
            {/* Całkowita waga uczestnika */}
            <WeightBadge weightG={totalWeightG} label="Łącznie" />
          </div>
        </div>

        {/* Zakładki uczestników */}
        <div className="profile-tabs" style={{ marginBottom: totalAll > 0 ? "10px" : 0 }}>
          {members.map(m => {
            const mPersonal = sumWeight(Object.values(myGear[m.id] || {}).flat());
            const mShared   = sumWeight(sharedGear.filter(i => i.taken_by === m.id));
            const mTotal    = mPersonal + mShared;
            return (
              <button key={m.id}
                className={`profile-tab ${activeProfile === m.id ? "active" : ""}`}
                onClick={() => setActiveProfile(m.id)}
              >
                {m.name}
                {mTotal > 0 && (
                  <span style={{
                    marginLeft: "5px", fontSize: "10px", fontFamily: "var(--font-mono)",
                    opacity: activeProfile === m.id ? 1 : 0.6,
                  }}>
                    {gToKg(mTotal)} kg
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ProgressBar done={packedAll} total={totalAll} />

        {/* Rozbicie wagi: osobista vs wspólna */}
        {totalWeightG > 0 && (
          <div style={{
            marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap",
            paddingTop: "10px", borderTop: "1px solid var(--night-border)",
          }}>
            {personalWeightG > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--snow-faint)", fontFamily: "var(--font-mono)" }}>
                <LuBackpack size={13} /> Osobisty: <strong style={{ color: "var(--snow-dim)" }}>{gToKg(personalWeightG)} kg</strong>
              </span>
            )}
            {sharedWeightG > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--snow-faint)", fontFamily: "var(--font-mono)" }}>
                <LuUsers size={13} /> Wspólny: <strong style={{ color: "var(--ice)" }}>{gToKg(sharedWeightG)} kg</strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Pasek kategorii ── */}
      <div className="cat-bar-wrap">
        <div className="cat-bar">
          {CATEGORIES.map(cat => {
            const { total, packed } = catCount(cat.id);
            return (
              <button key={cat.id} className={`cat-btn ${activeCat === cat.id ? "active" : ""}`}
                onClick={() => setActiveCat(cat.id)} title={cat.label}>
                <span className="cat-btn-icon" style={{ display: "inline-flex", alignItems: "center" }}>{cat.icon}</span>
                <span className="cat-btn-label">{cat.label}</span>
                {total > 0
                  ? <span className={`cat-btn-badge${packed === total ? " done" : ""}`}>{packed === total ? "✓" : `${packed}/${total}`}</span>
                  : <span className="cat-btn-badge empty">—</span>
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel aktywnej kategorii ── */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid var(--night-border)" }}>
          <span style={{ fontSize: "22px", display: "inline-flex", alignItems: "center" }}>{currentCat.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "15px", fontFamily: "var(--font-display)" }}>{currentCat.label}</div>
            {catItems.length > 0 && <ProgressBar done={catItems.filter(i => i.packed).length} total={catItems.length} />}
          </div>
          {catItems.length > 0 && (
            <span style={{ fontSize: "11px", color: "var(--snow-faint)" }}>
              {catItems.filter(i => i.packed).length === catItems.length
                ? "✓ gotowe"
                : `${catItems.filter(i => !i.packed).length} pozostało`}
            </span>
          )}
        </div>

        {catItems.length === 0 ? (
          <div className="empty-state" style={{ padding: "20px 0" }}>
            <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}>{currentCat.icon}</div>
            <div>Brak przedmiotów — dodaj poniżej lub wybierz z sugestii</div>
          </div>
        ) : (
          <ul className="gear-list" style={{ marginBottom: "14px" }}>
            {catItems.map(item => (
              <li key={item.id} className={`gear-item ${item.packed ? "packed" : ""}`}>
                {editingId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEditGear(item); if (e.key === "Escape") cancelEditGear(); }}
                      autoFocus
                      style={{ flex: "1 1 120px", minWidth: 0, height: "34px" }}
                    />
                    <input
                      type="number"
                      value={editWeight}
                      onChange={e => setEditWeight(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEditGear(item); if (e.key === "Escape") cancelEditGear(); }}
                      placeholder="Waga (g)"
                      min="1"
                      style={{ width: "84px", flexShrink: 0, height: "34px" }}
                      title="Waga w gramach (opcjonalnie)"
                    />
                    <button className="btn-icon-action btn-edit-icon" onClick={() => saveEditGear(item)} title="Zapisz">
                      <LuCheck size={16} />
                    </button>
                    <button className="btn-icon-action" onClick={cancelEditGear} title="Anuluj">
                      <LuX size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <input type="checkbox" className="gear-checkbox" checked={item.packed}
                      onChange={() => onToggleGear(activeProfile, activeCat, item.id, !item.packed)} />
                    <span className="gear-name">{item.name}</span>
                    {item.weight_g > 0 && (
                      <span style={{
                        fontSize: "11px", color: "var(--snow-faint)",
                        fontFamily: "var(--font-mono)", flexShrink: 0,
                      }}>
                        {item.weight_g} g
                      </span>
                    )}
                    {onPatchGear && (
                      <button className="btn-icon-action btn-edit-icon"
                        onClick={() => startEditGear(item)} title="Edytuj">
                        <LuPencil size={15} />
                      </button>
                    )}
                    <button className="btn-icon-action btn-delete-icon"
                      onClick={() => setDeleteConfirm({ id: item.id, name: item.name, type: "gear" })}
                      title="Usuń">
                      <LuX size={16} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Formularz dodawania z opcjonalną wagą */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder={`Dodaj do: ${currentCat.label}...`}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem(newItem)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
              style={{ flex: "1 1 160px", minWidth: 0 }}
            />
            <input
              type="number"
              placeholder="Waga (g)"
              value={newItemWeight}
              onChange={e => setNewItemWeight(e.target.value)}
              min="1"
              style={{ width: "90px", flexShrink: 0 }}
              title="Waga w gramach (opcjonalnie)"
            />
            <button className="btn btn-primary btn-sm" onClick={() => addItem(newItem)}>Dodaj</button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              marginTop: "8px",
              background: "var(--night-raise)",
              border: "1px solid var(--night-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px", boxShadow: "var(--shadow-md)",
            }}>
              <div style={{
                fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.8px", color: "var(--snow-faint)",
                marginBottom: "7px", fontFamily: "var(--font-display)",
              }}>
                Sugestie
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {suggestions.map(s => (
                  <button key={s} onMouseDown={() => addItem(s)} style={{
                    padding: "4px 10px", fontSize: "12px", fontWeight: 500,
                    background: "var(--night-card)", border: "1px solid var(--night-border)",
                    borderRadius: "20px", color: "var(--snow-faint)", cursor: "pointer",
                    fontFamily: "var(--font-body)", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = "var(--aurora-dim)";
                    e.target.style.borderColor = "var(--aurora)";
                    e.target.style.color = "var(--aurora)";
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = "var(--night-card)";
                    e.target.style.borderColor = "var(--night-border)";
                    e.target.style.color = "var(--snow-faint)";
                  }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ekwipunek wspólny ── */}
      <div className="card">
        <div className="card-title">
          <span style={{ display: "inline-flex", alignItems: "center", marginRight: "6px" }}><LuHandshake /></span>
          Wspólna lista
          {sharedGear.length > 0 && (
            <span style={{ marginLeft: "auto", fontSize: "11px", fontFamily: "var(--font-display)", color: "var(--snow-faint)" }}>
              {sharedPacked}/{sharedGear.length}
            </span>
          )}
        </div>

        {/* Legenda logiki wagi */}
        <p style={{
          fontSize: "11px", color: "var(--snow-faint)",
          marginBottom: "10px", lineHeight: 1.5,
        }}>
          Waga przedmiotu wspólnego dolicza się do uczestnika, który kliknie „Biorę".
        </p>

        {sharedGear.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <ProgressBar done={sharedPacked} total={sharedGear.length} />
          </div>
        )}

        {sharedGear.length === 0 ? (
          <div className="empty-state" style={{ padding: "14px 0" }}>
            <div className="empty-icon" style={{ display: "inline-flex", justifyContent: "center" }}><LuPackageOpen /></div>
            <div>Brak pozycji</div>
          </div>
        ) : (
          <ul className="gear-list">
            {sharedGear.map(item => {
              const taker = members.find(m => m.id === item.taken_by);
              const iMine = item.taken_by === activeProfile;
              return (
                <li key={item.id} className={`gear-item ${item.packed ? "packed" : ""}`}>
                  <input type="checkbox" className="gear-checkbox" checked={!!item.packed}
                    onChange={() => onPatchSharedGear(item.id, { packed: !item.packed })} />
                  <span className="gear-name">{item.name}</span>
                  {item.weight_g > 0 && (
                    <span style={{
                      fontSize: "11px", color: "var(--snow-faint)",
                      fontFamily: "var(--font-mono)", flexShrink: 0,
                    }}>
                      {item.weight_g} g
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {taker ? (
                      <span
                        className="gear-taker"
                        style={{ color: iMine ? "var(--aurora)" : "var(--ice)", cursor: iMine ? "pointer" : "default" }}
                        onClick={() => iMine && onPatchSharedGear(item.id, { taken_by: 0 })}
                        title={iMine ? "Kliknij żeby oddać" : ""}
                      >
                        {iMine ? "✓ Biorę" : taker.name}
                      </span>
                    ) : (
                      <button className="btn btn-outline btn-sm" style={{ fontSize: "11px", padding: "3px 9px" }}
                        onClick={() => onPatchSharedGear(item.id, { taken_by: activeProfile })}>
                        Biorę
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteConfirm({ id: item.id, name: item.name, type: "shared_gear" })}>
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Dodawanie wspólnego przedmiotu z wagą */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Dodaj przedmiot wspólny..."
            value={newSharedItem}
            onChange={e => setNewSharedItem(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSharedItem()}
            style={{ flex: "1 1 140px", minWidth: 0 }}
          />
          <input
            type="number"
            placeholder="Waga (g)"
            value={newSharedWeight}
            onChange={e => setNewSharedWeight(e.target.value)}
            min="1"
            style={{ width: "90px", flexShrink: 0 }}
            title="Waga w gramach (opcjonalnie)"
          />
          <button className="btn btn-primary btn-sm" onClick={addSharedItem}>Dodaj</button>
        </div>
      </div>

      {/* Dialog potwierdzenia usunięcia */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Usunąć przedmiot?"
        message={`Czy na pewno chcesz usunąć „${deleteConfirm?.name}"? Operacja jest nieodwracalna.`}
        confirmText="Usuń"
        cancelText="Anuluj"
        isDangerous={true}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
