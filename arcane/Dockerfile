FROM ghcr.io/getarcaneapp/arcane:latest

# Hier kunnen we later eventueel custom configs of thema's toevoegen
# Voor nu is het een exacte kopie, maar wel ONS beheer.
# Healthcheck om de deployment script te laten weten dat we klaar zijn
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD wget --spider -q http://localhost:3552/ || exit 1
