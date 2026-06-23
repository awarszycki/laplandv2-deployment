-- ══════════════════════════════════════════════════════════
--  MIGRACJA — bezpieczna, nie niszczy danych
--  Uruchom JEDEN RAZ na istniejącej bazie.
-- ══════════════════════════════════════════════════════════

USE lapland;

-- Dodaj weight_g do gear_items jeśli nie istnieje
ALTER TABLE gear_items
  MODIFY COLUMN weight_g INT NOT NULL DEFAULT 0;

-- Dodaj weight_g do shared_gear jeśli nie istnieje
ALTER TABLE shared_gear
  MODIFY COLUMN weight_g INT NOT NULL DEFAULT 0;

-- Upewnij się, że NULL-e są zastąpione zerami (na wypadek starych danych)
UPDATE gear_items  SET weight_g = 0 WHERE weight_g IS NULL;
UPDATE shared_gear SET weight_g = 0 WHERE weight_g IS NULL;
