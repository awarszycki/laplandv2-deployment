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

Uwaga: frontend woła względne ścieżki `/api/...`, a `vite.config.js` nie ma skonfigurowanego proxy, więc w `npm run dev` wywołania API nie trafią do backendu. Do pracy z danymi uruchom cały stack w Dockerze:

```bash
docker compose up -d --build     # aplikacja na http://localhost:3030 (za Basic Auth)
docker compose logs -f
```

Backend i baza nie mają wystawionych portów na hosta (dostęp tylko przez sieć Dockera). Do debugowania można lokalnie odkomentować `127.0.0.1:8000:8000` w compose — ale tylko lokalnie, nie commitować.

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
