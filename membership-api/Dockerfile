FROM python:3.11-alpine

# Security update & dependencies
# We installeren ook curl voor eventuele healthchecks
RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Dependencies installeren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code kopiëren
COPY . .

# Beveiliging: draai niet als root (Exact zoals payment-api)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

# FastAPI/Uvicorn standaard poort
EXPOSE 8000

# Start commando
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]