#!/bin/bash
# install-cron.sh
# Installeert een cronjob die het script elke nacht om 02:00 draait.

DEPLOY_DIR="/opt/leden-check-script"
LOG_FILE="/var/log/nachtwacht.log"

# Het commando: Ga naar de map en start de container (éénmalig)
CRON_CMD="0 2 * * * cd $DEPLOY_DIR && docker compose pull && docker compose up nachtwacht >> $LOG_FILE 2>&1"

# Check of de actie al in crontab staat om dubbele te voorkomen
crontab -l | grep -q "nachtwacht"
if [ $? -eq 0 ]; then
    echo "⚠️  Cronjob voor Nachtwacht lijkt al te bestaan. Check crontab -l"
else
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    echo "✅ Cronjob geïnstalleerd: Elke dag om 02:00."
fi
