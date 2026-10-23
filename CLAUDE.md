# CLAUDE.md — Lapland v2 (lapplanner.tech)

Aplikacja do planowania wyjazdów grupowych (pierwotnie „Laponia 2026”): projekty (wyjazdy), ekipa, wspólne finanse z rozliczeniem długów, ekwipunek osobisty i wspólny (z wagą i statusem spakowania). **Interfejs aplikacji jest po polsku.**

## Stack

- **Frontend:** React 18 + Vite 5 (JS/JSX, bez TypeScriptu), ikony `react-icons`. Brak routera — `App.jsx` przełącza między `ProjectSelector` a `Dashboard`.
- **Serwer statyczny / reverse proxy:** Caddy 2 (w obrazie frontendu) — serwuje `dist`, proxy `/api/*` i `/health` do backendu, Basic Auth na całą aplikację.
- **Backend:** Python 3.12, FastAPI + uvicorn, `aiomysql` (surowy SQL, bez ORM), Pydantic 2. Cały backend w jednym pliku `backend/main.py`.
- **Baza:** MariaDB 11 (wolumen `mariadb_data`).
- **Orkiestracja:** Docker Compose (3 usługi: `lapland_backend`, `lapland_frontend`, `db`).

## Struktura katalogów

```
.
├── docker-compose.yml        # 3 usługi; tylko frontend wystawiony (port 3030 → 80)
├── README.md                 # stara instrukcja wdrożenia (częściowo nieaktualna, np. lista endpointów)
├── backend/
│   ├── main.py               # FastAPI: endpointy /api/projects, /api/members, /api/expenses, /api/gear, /api/shared_gear
│   ├── init.sql              # schemat + dane startowe (uruchamiany tylko przy pustym wolumenie)
│   ├── migrate.sql           # migracje dla istniejącej bazy — tu dopisujemy zmiany schematu
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── Dockerfile            # wieloetapowy: node:22-alpine (npm ci + build) → caddy:2-alpine
    ├── Caddyfile             # Basic Auth + routing; NIE zmieniać bez pytania
    ├── .env                  # VITE_API_URL=/api (bez sekretów)
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx, App.css
        ├── api.js            # klient API — obecnie NIEUŻYWANY (komponenty wołają fetch("/api/...") bezpośrednio)
        ├── lib/finance.js    # czysta logika rozliczeń (salda, kto komu ile) — bez Reacta
        └── components/
            ├── ProjectSelector.jsx, DeleteProjectDialog.jsx, ConfirmDialog.jsx
            ├── Dashboard.jsx     # ładuje dane projektu i trzyma handlery CRUD
            ├── Ekipa.jsx         # uczestnicy
            ├── Finanse.jsx, FinanceManager.jsx  # wydatki i podział
            └── Ekwipunek.jsx     # ekwipunek osobisty i wspólny
```

Dane są per projekt: tabele `members`, `expenses`, `gear_items`, `shared_gear` mają `project_id` (FK do `projects`, `ON DELETE CASCADE`); endpointy GET przyjmują `?project_id=`.

## Uruchomienie lokalne

Frontend (dev server Vite, http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

Frontend woła względne ścieżki `/api/...`. W `npm run dev` Vite przekazuje `/api` i `/health` na lokalny backend `http://127.0.0.1:8000` (`server.proxy` w `vite.config.js`) — nigdy na produkcję. Backend musi więc działać lokalnie na porcie 8000. Alternatywnie uruchom cały stack w Dockerze:

```bash
docker compose up -d --build     # aplikacja na http://localhost:3030 (za Basic Auth)
docker compose logs -f
```

W `docker-compose.yml` backend i baza nie mają wystawionych portów na hosta (dostęp tylko przez sieć Dockera). Żeby proxy Vite działało lokalnie, użyj nadpisania compose:

```bash
cp docker-compose.override.example.yml docker-compose.override.yml   # jednorazowo; plik jest w .gitignore
docker compose up -d --build     # backend dodatkowo na 127.0.0.1:8000
cd frontend && npm run dev       # http://localhost:5173, /api → lokalny backend
```

`docker-compose.override.yml` istnieje tylko na maszynie deweloperskiej — na produkcji go nie ma.

### Podgląd z danymi testowymi

```bash
scripts/seed-dev.sh              # po `docker compose up -d` z override
```

Wgrywa `backend/seed-dev.sql` do **lokalnej** bazy: projekt „[DEV] Testowy wyjazd” (5 osób, wydatki, ekwipunek we wszystkich kategoriach, sprzęt wspólny). Można uruchamiać wielokrotnie — poprzedni projekt testowy jest usuwany. Przy pustej bazie najpierw wgrywa schemat z `init.sql`. Skrypt przerywa, jeśli nie ma `docker-compose.override.yml`, ustawiony jest `DOCKER_HOST` albo kontekst Dockera nie jest `default`. Hasło bazy bierze z wnętrza kontenera. **Nigdy nie uruchamiać na produkcji.**

Healthcheck: `GET /health` (backend; sprawdza też połączenie z bazą, 503 gdy baza niedostępna).

## Budowanie

- Sprawdzenie builda frontendu (wymagane przed commitem): `cd frontend && npm run build` → wynik w `frontend/dist`.
- Produkcyjnie frontend jest budowany **w Dockerze** (wieloetapowy `frontend/Dockerfile`: `npm ci` + `vite build`, potem same pliki statyczne do obrazu Caddy). Dlatego **nie commitujemy `node_modules` ani `dist`** (są w `.gitignore` i `.dockerignore`).
- Obrazy: `docker compose build` (lub `up -d --build`).

## Produkcja i wdrożenie

- Serwer domowy **Proxmox**, kontener **LXC 101**, w nim Docker Compose z tego repo.
- Publicznie: **https://lapplanner.tech** przez **Cloudflare Tunnel** (tunel kieruje na port 3030 frontendu; żadne porty na routerze nie są otwarte).
- Cała aplikacja (frontend + API) jest za **Basic Auth w Caddy** (`frontend/Caddyfile`).
- **Wdrożenie:** merge do `main`, potem na laptopie właściciel uruchamia `lapland-deploy` (kopia zapasowa bazy, `git pull`, `docker compose up -d --build`, test, powiadomienie ntfy). **Claude nigdy nie uruchamia `lapland-deploy`.**
- Migracje na produkcji uruchamia właściciel ręcznie, np. `docker exec -i lapland_db mariadb -u lapland -p lapland < backend/migrate.sql`.

## Zasady pracy

1. **Każda zmiana na nowej gałęzi**, nigdy bezpośrednio na `main`. Claude robi commit i push gałęzi; PR i merge robi właściciel.
2. **Przed commitem** sprawdź, że `cd frontend && npm run build` przechodzi.
3. **Nie commituj** sekretów, plików `.env` z hasłami, `node_modules`, `dist`.
4. **Nie zmieniaj bez pytania:** `frontend/Caddyfile` (Basic Auth), haseł i usług w `docker-compose.yml`.
5. **Zmiany schematu bazy:** dopisz SQL do `backend/migrate.sql` (bezpieczny dla istniejących danych, idempotentny gdzie się da), w razie potrzeby zaktualizuj też `init.sql`, i opisz właścicielowi, co ma uruchomić. **Nigdy nie wykonuj migracji na produkcji.**
6. **Interfejs aplikacji jest po polsku** — nowe teksty w UI piszemy po polsku.
7. **Przy większych przebudowach najpierw przedstaw plan** i poczekaj na akceptację.
8. **Twarde blokady** w `.claude/settings.json` (`permissions.deny`): zakaz `ssh`, `scp`, `rsync` (laptop ma klucz roota do serwera produkcyjnego — agent nie łączy się z serwerem), zakaz `git push` na `main` i `git push --force`/`-f`, zakaz czytania głównego `.env` (hasła bazy) i `~/.ssh`. Nie obchodź tych blokad ani ich nie usuwaj.
