#!/bin/sh
set -e

# Vul nginx.conf met de juiste proxy target
if [ -z "$DIRECTUS_PROXY_TARGET" ]; then
  echo "DIRECTUS_PROXY_TARGET is not set!" >&2
  exit 1
fi

envsubst < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
