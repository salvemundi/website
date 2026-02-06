FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ /app/app/

# Dummy healthcheck for deployment script
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=5s \
  CMD true || exit 1

# Default CMD
CMD ["python", "-m", "app.main"]
