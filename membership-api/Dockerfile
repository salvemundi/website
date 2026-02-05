FROM python:3.11-alpine


RUN apk update && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app


COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


COPY . .


RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

# FastAPI/Uvicorn standaard poort
EXPOSE 8000


CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# Triggering rebuild for beta endpoint change
