FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ /app/app/

# Healthcheck om te kijken of het proces nog draait
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pgrep -f "python -m app.main" || exit 1

# Default CMD
CMD ["python", "-m", "app.main"]
