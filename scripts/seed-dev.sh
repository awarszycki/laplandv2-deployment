#!/usr/bin/env bash
# Wgrywa dane testowe (backend/seed-dev.sql) do LOKALNEJ bazy w Dockerze.
# Tylko do podglądu na maszynie deweloperskiej — nigdy na produkcji.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f docker-compose.override.yml ]]; then
  echo "Brak docker-compose.override.yml — to nie wygląda na maszynę deweloperską. Przerywam." >&2
  exit 1
fi

if [[ -n "${DOCKER_HOST:-}" ]]; then
  echo "Ustawiony DOCKER_HOST=$DOCKER_HOST — Docker nie jest lokalny. Przerywam." >&2
  exit 1
fi

context="$(docker context show)"
if [[ "$context" != "default" ]]; then
  echo "Aktywny kontekst Dockera to „$context”, a nie „default”. Przerywam." >&2
  exit 1
fi

# Hasło roota bazy jest brane z wnętrza kontenera, nie z tego skryptu.
db_sql() {
  docker compose exec -T db sh -c 'mariadb -u root -p"$MYSQL_ROOT_PASSWORD" lapland "$@"' sh "$@"
}

# Pusta baza (np. wolumen utworzony przed obecnym init.sql) — najpierw schemat.
if [[ -z "$(db_sql -N -e "SHOW TABLES LIKE 'projects'")" ]]; then
  echo "Brak tabel w lokalnej bazie — wgrywam schemat z backend/init.sql."
  db_sql < backend/init.sql
fi

db_sql < backend/seed-dev.sql

echo "Gotowe: projekt „[DEV] Testowy wyjazd” wgrany do lokalnej bazy."
