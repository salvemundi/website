#!/usr/bin/env bash
# Voert de Wrapped-testdata uit op de dev-core database. Aangeroepen door .github/workflows/wrapped-testdata-dev.yml.
set -euo pipefail
cd "$(dirname "$0")"

# Alleen de PostgreSQL-container van dev-core, nooit acceptance/productie.
database=$(docker inspect --type container --format '{{.Id}}' v7-dev-db)
identity=$(docker inspect --format '{{.State.Running}} {{index .Config.Labels "com.docker.compose.project"}} {{index .Config.Labels "com.docker.compose.service"}}' "$database")
if [[ "$identity" != 'true v7-dev-core v7-dev-db' ]]; then
    echo 'The dev-core PostgreSQL container must be running.' >&2
    exit 1
fi

case "$ACTION" in
    seed) files=(cleanup.sql seed.sql) ;;
    cleanup) files=(cleanup.sql) ;;
    *) echo 'Unknown action.' >&2; exit 1 ;;
esac

cat "${files[@]}" | docker exec -i -e WRAPPED_EMAIL="${EMAIL:-}" "$database" sh -ec '
    export PGPASSWORD="$POSTGRES_PASSWORD"
    exec psql -X -v ON_ERROR_STOP=1 --single-transaction -v email="$WRAPPED_EMAIL" \
        -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
'
echo "Wrapped test data: $ACTION done."
