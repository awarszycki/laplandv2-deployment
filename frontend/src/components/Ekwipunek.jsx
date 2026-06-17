import { useState } from "react";

const COLORS = ["#00c896","#f0a500","#4ca0e0","#e05555","#a78bfa","#fb923c","#34d399","#60a5fa"];
function getAvatarColor(id) { return COLORS[(id - 1) % COLORS.length]; }
function initials(name) { return name.slice(0, 2).toUpperCase(); }

export const CATEGORIES = [
  { id:"clothing",    label:"Odzież",      icon:"🧥" },
  { id:"camp",        label:"Biwak",        icon:"🛌" },
  { id:"food",        label:"Jedzenie",     icon:"🍳" },
  { id:"nav",         label:"Nawigacja",    icon:"🧭" },
  { id:"electronics", label:"Elektronika",  icon:"🔋" },
  { id:"hygiene",     label:"Higiena",      icon:"🧴" },
  { id:"bag",         label:"Bagaż",        icon:"🎒" },
  { id:"docs",        label:"Dokumenty",    icon:"📄" },
];

const CAT_SUGGESTIONS = {
  clothing:    ["Bielizna termiczna","Koszulka z długim rękawem","Koszulka (x3)","Bluza/polar","Kurtka przeciwdeszczowa","Spodnie trekkingowe","Spodnie na deszcz","Skarpety (x5)","Bielizna (x5)","Czapka","Rękawiczki lekkie","Buff/komin","Buty trekkingowe","Sandały/kapcie obozowe"],
  camp:        ["Śpiwór (letni/3-sezonowy)","Karimat / mata śpiąca","Poduszka dmuchana","Wkładka do śpiwora","Latarka czołowa do namiotu"],
  food:        ["Liofilizaty (x5)","Czekolada / batoniki","Orzechy i suszone owoce","Płatki owsiane","Herbata / kawa","Kuchenka gazowa","Kartusz gazowy","Menażka / garnek","Kubek turystyczny","Sztućce","Termos","Butelka na wodę","Filtr do wody / tabletki"],
  nav:         ["Mapa topograficzna","Kompas","Latarka czołowa","Baterie zapasowe","Koc NRC","Gwizdek","Repelent na komary (DEET)","Siatka na komary","Nóż / multitool","Zapalniczka / zapałki"],
  electronics: ["Telefon","Powerbank","Kabel USB-C","Ładowarka","Aparat fotograficzny","Karta pamięci zapasowa","Słuchawki","Adapter do gniazdek EU"],
  hygiene:     ["Apteczka osobista","Leki na receptę","Tabletki przeciwbólowe","Plastry / opatrunki","Krem z filtrem SPF 50+","Balsam do ust z filtrem","Pasta do zębów + szczoteczka","Mydło w kostce","Ręcznik szybkoschnący","Papier toaletowy","Chusteczki mokre","Płyn do dezynfekcji rąk"],
  bag:         ["Plecak trekkingowy (40-60L)","Pokrowiec przeciwdeszczowy","Torba / walizka na samolot","Worki wodoszczelne / dry bag","Kłódka do bagażu","Organizery / packing cubes"],
  docs:        ["Paszport","Ubezpieczenie podróżne","Prawo jazdy","Karta płatnicza","Gotówka (EUR)","Numer ICE (w telefonie)","Potwierdzenia rezerwacji","Mapa offline w telefonie"],
};

function ProgressBar({ done, total }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div className={`progress-fill${pct === 100 ? " done" : ""}`} style={{ width:`${pct}%` }} />
      </div>
      <span className="progress-label">{done}/{total}</span>
    </div>
  );
}

export default function Ekwipunek({
  members, myGear, sharedGear, currentUser,
  onAddGear, onToggleGear, onDeleteGear,
  onAddSharedGear, onPatchSharedGear, onDeleteSharedGear,
}) {
  const [activeProfile, setActiveProfile] = useState(currentUser?.id || members[0]?.id || null);
  const [activeCat, setActiveCat]         = useState("clothing");
  const [newItem, setNewItem]             = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newSharedItem, setNewSharedItem] = useState("");

  const profileGear = myGear[activeProfile] || {};
  const catItems    = profileGear[activeCat] || [];

  const allItems  = Object.values(profileGear).flat();
  const totalAll  = allItems.length;
  const packedAll = allItems.filter(i => i.packed).length;

  function catCount(catId) {
    const items = profileGear[catId] || [];
    return { total: items.length, packed: items.filter(i => i.packed).length };
  }

  const suggestions = (CAT_SUGGESTIONS[activeCat] || []).filter(
    s => !catItems.some(i => i.name.toLowerCase() === s.toLowerCase())
  );

  async function addItem(name) {
    if (!name.trim()) return;
    await onAddGear(activeProfile, activeCat, name.trim());
    setNewItem("");
    setShowSuggestions(false);
  }

  const currentCat = CATEGORIES.find(c => c.id === activeCat);
  const sharedPacked = sharedGear.filter(i => i.packed).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

      {/* Profile selector */}
      <div className="card" style={{ padding:"14px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px", flexWrap:"wrap", gap:"6px" }}>
          <span className="section-label">Lista uczestnika</span>
          {totalAll > 0 && (
            <span style={{ fontSize:"12px", fontWeight:600, color: packedAll === totalAll ? "var(--aurora)" : "var(--snow-faint)" }}>
              {packedAll === totalAll ? "✓ Wszystko spakowane!" : `${packedAll} z ${totalAll} spakowane`}
            </span>
          )}
        </div>
        <div className="profile-tabs" style={{ marginBottom: totalAll > 0 ? "10px" : 0 }}>
          {members.map(m => (
            <button key={m.id} className={`profile-tab ${activeProfile === m.id ? "active" : ""}`}
              onClick={() => setActiveProfile(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
        <ProgressBar done={packedAll} total={totalAll} />
      </div>

      {/* Category bar */}
      <div className="cat-bar-wrap">
        <div className="cat-bar">
          {CATEGORIES.map(cat => {
            const { total, packed } = catCount(cat.id);
            return (
              <button key={cat.id} className={`cat-btn ${activeCat === cat.id ? "active" : ""}`}
                onClick={() => setActiveCat(cat.id)} title={cat.label}>
                <span className="cat-btn-icon">{cat.icon}</span>
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

      {/* Active category panel */}
      <div className="card">
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px", paddingBottom:"12px", borderBottom:"1px solid var(--night-border)" }}>
          <span style={{ fontSize:"22px" }}>{currentCat.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:"15px", fontFamily:"var(--font-display)" }}>{currentCat.label}</div>
            {catItems.length > 0 && <ProgressBar done={catItems.filter(i => i.packed).length} total={catItems.length} />}
          </div>
          {catItems.length > 0 && (
            <span style={{ fontSize:"11px", color:"var(--snow-faint)" }}>
              {catItems.filter(i => i.packed).length === catItems.length ? "✓ gotowe" : `${catItems.filter(i => !i.packed).length} pozostało`}
            </span>
          )}
        </div>

        {catItems.length === 0 ? (
          <div className="empty-state" style={{ padding:"20px 0" }}>
            <div className="empty-icon">{currentCat.icon}</div>
            <div>Brak przedmiotów — dodaj poniżej lub wybierz z sugestii</div>
          </div>
        ) : (
          <ul className="gear-list" style={{ marginBottom:"14px" }}>
            {catItems.map(item => (
              <li key={item.id} className={`gear-item ${item.packed ? "packed" : ""}`}>
                <input type="checkbox" className="gear-checkbox" checked={item.packed}
                  onChange={() => onToggleGear(activeProfile, activeCat, item.id, !item.packed)} />
                <span className="gear-name">{item.name}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => onDeleteGear(activeProfile, activeCat, item.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", gap:"8px" }}>
            <input type="text" placeholder={`Dodaj do: ${currentCat.label}...`}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem(newItem)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
            />
            <button className="btn btn-primary btn-sm" onClick={() => addItem(newItem)}>Dodaj</button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{ marginTop:"8px", background:"var(--night-raise)", border:"1px solid var(--night-border)", borderRadius:"var(--radius-md)", padding:"10px", boxShadow:"var(--shadow-md)" }}>
              <div style={{ fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--snow-faint)", marginBottom:"7px", fontFamily:"var(--font-display)" }}>
                Sugestie
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                {suggestions.map(s => (
                  <button key={s} onMouseDown={() => addItem(s)} style={{
                    padding:"4px 10px", fontSize:"12px", fontWeight:500,
                    background:"var(--night-card)", border:"1px solid var(--night-border)",
                    borderRadius:"20px", color:"var(--snow-faint)", cursor:"pointer",
                    fontFamily:"var(--font-body)", transition:"all 0.12s",
                  }}
                  onMouseEnter={e => { e.target.style.background="var(--aurora-dim)"; e.target.style.borderColor="var(--aurora)"; e.target.style.color="var(--aurora)"; }}
                  onMouseLeave={e => { e.target.style.background="var(--night-card)"; e.target.style.borderColor="var(--night-border)"; e.target.style.color="var(--snow-faint)"; }}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared gear */}
      <div className="card">
        <div className="card-title">
          <span>🤝</span> Wspólna lista
          {sharedGear.length > 0 && (
            <span style={{ marginLeft:"auto", fontSize:"11px", fontFamily:"var(--font-display)", color:"var(--snow-faint)" }}>
              {sharedPacked}/{sharedGear.length}
            </span>
          )}
        </div>
        {sharedGear.length > 0 && <div style={{ marginBottom:"12px" }}><ProgressBar done={sharedPacked} total={sharedGear.length} /></div>}

        {sharedGear.length === 0 ? (
          <div className="empty-state" style={{ padding:"14px 0" }}>
            <div className="empty-icon">📦</div><div>Brak pozycji</div>
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
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    {taker ? (
                      <span className="gear-taker"
                        style={{ color: iMine ? "var(--aurora)" : "var(--ice)", cursor: iMine ? "pointer" : "default" }}
                        onClick={() => iMine && onPatchSharedGear(item.id, { taken_by: 0 })}
                        title={iMine ? "Kliknij żeby oddać" : ""}>
                        {iMine ? "✓ Biorę" : taker.name}
                      </span>
                    ) : (
                      <button className="btn btn-outline btn-sm" style={{ fontSize:"11px", padding:"3px 9px" }}
                        onClick={() => onPatchSharedGear(item.id, { taken_by: activeProfile })}>
                        Biorę
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => onDeleteSharedGear(item.id)}>✕</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
          <input type="text" placeholder="Dodaj przedmiot wspólny..."
            value={newSharedItem}
            onChange={e => setNewSharedItem(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (onAddSharedGear(newSharedItem), setNewSharedItem(""))}
          />
          <button className="btn btn-primary btn-sm"
            onClick={() => { onAddSharedGear(newSharedItem); setNewSharedItem(""); }}>
            Dodaj
          </button>
        </div>
      </div>
    </div>
  );
}
