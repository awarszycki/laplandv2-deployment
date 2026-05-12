# Laponia 2026 — Wdrożenie na serwerze domowym

## Struktura projektu

```
lapland/
├── backend/
│   ├── main.py          ← FastAPI API
│   ├── requirements.txt
│   ├── init.sql         ← schemat + dane startowe bazy
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── components/
│   │       ├── Finanse.jsx
│   │       ├── Ekwipunek.jsx
│   │       └── Ekipa.jsx
│   ├── Caddyfile
│   ├── Dockerfile
│   ├── index.html
│   └── package.json
└── docker-compose.yml
```

---

## Krok 1 — Zmień hasła w docker-compose.yml

Otwórz `docker-compose.yml` i zmień:
```
MARIADB_ROOT_PASSWORD: root_secret_change_me   ← zmień!
MARIADB_PASSWORD: lapland_pass_change_me        ← zmień!
DB_PASSWORD: lapland_pass_change_me             ← ta sama wartość co wyżej!
```

---

## Krok 2 — Wgraj pliki na serwer

Skopiuj cały folder `lapland/` na serwer, np.:
```bash
scp -r ./lapland user@TWOJ_IP:~/lapland
```

Lub przez GUI serwera jeśli masz dostęp.

---

## Krok 3 — Wdrożenie przez Portainer

### Opcja A — przez Portainer Stacks (zalecana)

1. Otwórz Portainer → **Stacks** → **Add stack**
2. Nazwa: `lapland`
3. Wybierz **"Upload"** i wgraj `docker-compose.yml`
   - Uwaga: Portainer Stacks nie buduje z lokalnych plików — użyj Opcji B

### Opcja B — przez SSH (najprostsza do budowania)

Zaloguj się przez SSH i uruchom:
```bash
cd ~/lapland
docker compose up -d --build
```

Po zbudowaniu obrazów, możesz je zarejestrować w Portainerze ręcznie
lub po prostu zostawić uruchomione przez `docker compose`.

### Sprawdź czy działa

```bash
docker compose ps          # wszystkie 3 kontenery powinny być "running"
docker compose logs -f     # logi na żywo
```

Otwórz w przeglądarce: `http://TWOJE_IP:3030`

---

## Krok 4 — Cloudflare Named Tunnel (stały URL dla znajomych)

Quick tunnel zmienia adres przy każdym restarcie. Named tunnel jest stały i darmowy.

### 4.1 — Zainstaluj cloudflared na serwerze

```bash
# Na Ubuntu/Debian:
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 4.2 — Zaloguj się do Cloudflare

```bash
cloudflared tunnel login
# Otworzy się przeglądarka — zaloguj się i wybierz domenę
```

Jeśli nie masz domeny, możesz zarejestrować darmową np. na Cloudflare (.pages.dev nie działa,
ale możesz kupić tanią domenę .dev za ~5$/rok lub użyć usługi jak duckdns.org z DreamHost).

### 4.3 — Utwórz tunel

```bash
cloudflared tunnel create lapland-tunnel
# Zapamiętaj UUID tunelu który zostanie wypisany
```

### 4.4 — Skonfiguruj tunel

Utwórz plik `~/.cloudflared/config.yml`:
```yaml
tunnel: TWOJ_UUID_TUNELU
credentials-file: /root/.cloudflared/TWOJ_UUID_TUNELU.json

ingress:
  - hostname: lapland.twojadomena.com
    service: http://localhost:3030
  - service: http_status:404
```

### 4.5 — Dodaj DNS record

```bash
cloudflared tunnel route dns lapland-tunnel lapland.twojadomena.com
```

### 4.6 — Uruchom tunel jako kontener w Portainerze

Dodaj do `docker-compose.yml` (opcjonalnie, zamiast instalować na hoście):

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: lapland_tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: TWOJ_TOKEN_TUNELU
    network_mode: host
```

Token tunelu pobierzesz z dashboard Cloudflare → Zero Trust → Tunnels.

### Wynik

Znajomi wchodzą na: `https://lapland.twojadomena.com`
Stały URL, HTTPS automatycznie, bez otwierania portów na routerze. ✓

---

## API Endpoints (dla ciekawskich)

| Metoda | Ścieżka              | Opis                        |
|--------|----------------------|-----------------------------|
| GET    | /members             | Lista uczestników           |
| POST   | /members             | Dodaj uczestnika            |
| PUT    | /members/{id}        | Zmień nazwę                 |
| DELETE | /members/{id}        | Usuń uczestnika             |
| GET    | /expenses            | Lista wydatków              |
| POST   | /expenses            | Dodaj wydatek               |
| DELETE | /expenses/{id}       | Usuń wydatek                |
| GET    | /gear                | Ekwipunek (indywidualny)    |
| POST   | /gear                | Dodaj przedmiot             |
| PUT    | /gear/{id}/packed    | Zmień status spakowania     |
| DELETE | /gear/{id}           | Usuń przedmiot              |
| GET    | /shared-gear         | Wspólna lista               |
| POST   | /shared-gear         | Dodaj do wspólnej           |
| PATCH  | /shared-gear/{id}    | Kto bierze / spakowane      |
| DELETE | /shared-gear/{id}    | Usuń z wspólnej             |

Dokumentacja Swagger: `http://TWOJE_IP:3030/api/docs`

---

## Port 3030

Port `3030` jest wolny na Twoim serwerze (8080 = phpMyAdmin, 8000/9000 = Portainer).
Możesz zmienić w docker-compose.yml jeśli wolisz inny.
