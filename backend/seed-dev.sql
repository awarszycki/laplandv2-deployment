-- Dane testowe TYLKO do podglądu lokalnego. Nigdy nie uruchamiać na produkcji.
-- Wgrywanie: scripts/seed-dev.sh (sprawdza, że to lokalny Docker).
-- Idempotentny: usuwa poprzedni projekt testowy (kaskada) i tworzy go od nowa.
SET NAMES utf8mb4;

DELETE FROM projects WHERE name = '[DEV] Testowy wyjazd';

INSERT INTO projects (name, description)
VALUES ('[DEV] Testowy wyjazd', 'Dane testowe do podglądu wyglądu — tylko lokalnie');
SET @p = LAST_INSERT_ID();

-- Uczestnicy
INSERT INTO members (name, project_id) VALUES ('Ania', @p);    SET @ania   = LAST_INSERT_ID();
INSERT INTO members (name, project_id) VALUES ('Bartek', @p);  SET @bartek = LAST_INSERT_ID();
INSERT INTO members (name, project_id) VALUES ('Kasia', @p);   SET @kasia  = LAST_INSERT_ID();
INSERT INTO members (name, project_id) VALUES ('Michał', @p);  SET @michal = LAST_INSERT_ID();
INSERT INTO members (name, project_id) VALUES ('Ola', @p);     SET @ola    = LAST_INSERT_ID();

SET @all = CONCAT_WS(',', @ania, @bartek, @kasia, @michal, @ola);

-- Wydatki (różni płacący, różne podziały); description = title, jak zapisuje aplikacja
INSERT INTO expenses (title, description, amount, paid_by_id, project_id, split_ids, currency, original_amount) VALUES
('Bilety lotnicze', 'Bilety lotnicze', 3450.00, @ania,   @p, @all, 'PLN', 3450.00),
('Wynajem auta', 'Wynajem auta', 2180.50, @bartek, @p, @all, 'PLN', 2180.50),
('Domek nad jeziorem', 'Domek nad jeziorem', 1890.00, @kasia,  @p, @all, 'PLN', 1890.00),
('Zakupy spożywcze', 'Zakupy spożywcze', 612.35, @michal, @p, @all, 'PLN', 612.35),
('Paliwo', 'Paliwo', 348.90, @bartek, @p, CONCAT_WS(',', @bartek, @michal, @ola), 'PLN', 348.90),
('Sauna', 'Sauna', 180.00, @ola,    @p, CONCAT_WS(',', @ania, @kasia, @ola), 'PLN', 180.00),
('Wycieczka husky', 'Wycieczka husky', 1520.00, @ania,   @p, CONCAT_WS(',', @ania, @bartek, @kasia, @michal), 'PLN', 1520.00),
('Kartusze gazowe', 'Kartusze gazowe', 96.00, @michal, @p, @all, 'PLN', 96.00),
('Mapy topograficzne', 'Mapy topograficzne', 142.70, @kasia,  @p, CONCAT_WS(',', @kasia, @michal), 'PLN', 142.70),
('Kolacja w restauracji', 'Kolacja w restauracji', 935.00, @ola,    @p, @all, 'PLN', 935.00);

-- Ekwipunek osobisty (wszystkie 8 kategorii; Michał > 15 kg)
INSERT INTO gear_items (name, category, weight_g, packed, member_id, project_id) VALUES
('Bielizna termiczna', 'Bielizna termiczna', 350, TRUE,  @ania, @p),
('Kurtka puchowa', 'Kurtka puchowa', 780, TRUE,  @ania, @p),
('Spodnie softshell', 'Spodnie softshell', 520, FALSE, @ania, @p),
('Śpiwór zimowy', 'Śpiwór zimowy', 1650, FALSE, @ania, @p),
('Czołówka', 'Czołówka', 90, TRUE,  @ania, @p),
('Powerbank 20 000 mAh', 'Powerbank 20 000 mAh', 410, FALSE, @ania, @p),
('Apteczka osobista', 'Apteczka osobista', 250, TRUE,  @ania, @p),
('Paszport', 'Paszport', 0, TRUE,  @ania, @p),

('Plecak 60 L', 'Plecak 60 L', 2100, TRUE,  @bartek, @p),
('Polar', 'Polar', 450, TRUE,  @bartek, @p),
('Karimata', 'Karimata', 480, FALSE, @bartek, @p),
('Kompas', 'Kompas', 60, FALSE, @bartek, @p),
('Liofilizaty (x5)', 'Liofilizaty (x5)', 650, FALSE, @bartek, @p),
('Ubezpieczenie podróżne', 'Ubezpieczenie podróżne', 0, FALSE, @bartek, @p),

('Kurtka przeciwdeszczowa', 'Kurtka przeciwdeszczowa', 390, TRUE,  @kasia, @p),
('Termos 1 L', 'Termos 1 L', 540, TRUE,  @kasia, @p),
('Telefon', 'Telefon', 210, TRUE,  @kasia, @p),
('Ręcznik szybkoschnący', 'Ręcznik szybkoschnący', 180, TRUE,  @kasia, @p),
('Worki wodoszczelne', 'Worki wodoszczelne', 150, TRUE,  @kasia, @p),

('Plecak 75 L', 'Plecak 75 L', 2600, TRUE,  @michal, @p),
('Śpiwór puchowy -20°C', 'Śpiwór puchowy -20°C', 2200, TRUE,  @michal, @p),
('Namiot ekspedycyjny', 'Namiot ekspedycyjny', 4300, FALSE, @michal, @p),
('Aparat + obiektywy', 'Aparat + obiektywy', 2400, FALSE, @michal, @p),
('Statyw', 'Statyw', 1500, FALSE, @michal, @p),
('Buty zimowe', 'Buty zimowe', 1900, TRUE,  @michal, @p),
('Raki', 'Raki', 900, FALSE, @michal, @p),

('Czapka i rękawice', 'Czapka i rękawice', 260, FALSE, @ola, @p),
('Pasta + szczoteczka', 'Pasta + szczoteczka', 120, FALSE, @ola, @p);

-- Ekwipunek wspólny (przypisany i nieprzypisany)
INSERT INTO shared_gear (name, weight_g, assigned_member_id, packed, project_id) VALUES
('Kuchenka gazowa', 420, @bartek, TRUE,  @p),
('Garnek 2 L', 380, @kasia, FALSE, @p),
('Filtr do wody', 300, @michal, TRUE,  @p),
('Apteczka grupowa', 900, @ania, FALSE, @p),
('Saperka', 650, NULL, FALSE, @p),
('Lina 30 m', 1800, NULL, FALSE, @p);
