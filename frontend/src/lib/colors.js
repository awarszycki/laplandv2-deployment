// Wspólna paleta avatarów i odznak. Wartości kolorów są tokenami w App.css
// (--c-1 … --c-8), tu tylko wybór koloru — jedno miejsce do strojenia.

const PALETTE_SIZE = 8;

/** Kolor (zmienna CSS) dla id osoby lub projektu: ten sam id → ten sam kolor. */
export function getAvatarColor(id) {
  return `var(--c-${((Number(id) - 1) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE + 1})`;
}

export function initials(name) {
  return name.slice(0, 2).toUpperCase();
}
