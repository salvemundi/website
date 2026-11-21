#!/usr/bin/env bash
set -euo pipefail

action=$1
revision=$2
worker=v7-dev-mobile-notifications
if [[ "$action" == stop ]]; then
    if docker container inspect "$worker" >/dev/null 2>&1; then
        docker stop "$worker"
    fi
    exit 0
fi

# Pin both migrations and the worker's loopback to the database owned by dev-core.
database=$(docker inspect --type container --format '{{.Id}}' v7-dev-db)
identity=$(docker inspect --format '{{.State.Running}} {{index .Config.Labels "com.docker.compose.project"}} {{index .Config.Labels "com.docker.compose.service"}}' "$database")
if [[ "$identity" != 'true v7-dev-core v7-dev-db' ]]; then
    echo 'The dev-core PostgreSQL container must be running.' >&2
    exit 1
fi

if [[ "$action" == migrate ]]; then
    for migration in packages/db/drizzle/mobile_notifications{,_android}.sql; do
        docker exec -i "$database" sh -ec '
            export PGPASSWORD="$POSTGRES_PASSWORD"
            exec psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"
        ' < "$migration"
    done
    exit 0
fi

if [[ "$action" != check && "$action" != start ]]; then
    echo 'Unknown dev notification action.' >&2
    exit 1
fi

docker exec "$database" sh -ec 'printf "%s\0" "$POSTGRES_USER" "$POSTGRES_PASSWORD" "$POSTGRES_DB"' > database.env
mapfile -d '' -t credentials < database.env
rm database.env
export DB_USER="${credentials[0]}" DB_PASSWORD="${credentials[1]}" DB_NAME="${credentials[2]}"
unset credentials

source=apps/services/mobile-notification-service
image="v7-dev-mobile-notifications:$revision"
tar -cf - "$source/Dockerfile" "$source/package.json" "$source/src" apps/frontend/src/shared/lib/permissions-config.ts |
    docker build -t "$image" -f "$source/Dockerfile" -

worker_options=(
    --network "container:$database" --read-only --cap-drop ALL --security-opt no-new-privileges
    --env-file firebase.env --env DB_USER --env DB_PASSWORD --env DB_NAME
    --env ENV_NAME=dev --env DB_HOST=127.0.0.1 --env DB_PORT=5432
    --env MOBILE_API_ENABLED=true --env MOBILE_NOTIFICATIONS_ENABLED=true
    --env MOBILE_FCM_ENABLED=true --env MOBILE_APNS_ALLOW_PRODUCTION=false
)
docker run --rm "${worker_options[@]}" "$image" node src/readiness.mjs --database

if [[ "$action" == start ]]; then
    if docker container inspect "$worker" >/dev/null 2>&1; then
        docker rm -f "$worker"
    fi
    docker run -d --name "$worker" "${worker_options[@]}" "$image"
    sleep 2
    [[ $(docker inspect --format '{{.State.Running}}' "$worker") == true ]]
    echo 'Dev Android notification worker is running.'
fi
