FROM python:3.11-alpine


# Ensure system is up-to-date and install common build deps + Rust (Cargo) so
# Python packages that require Rust/C extensions can be built during pip install.
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        build-base \
        libffi-dev \
        openssl-dev \
        cargo \
        rust && \
    rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

# Upgrade pip/setuptools/wheel to ensure modern build backends work, then
# install requirements. Having rust/cargo + build-base available allows
# packages like infisical-python to build their extensions on Alpine.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt


COPY . .


RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app

USER appuser

# FastAPI/Uvicorn standaard poort
EXPOSE 8000


CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# Triggering rebuild for beta endpoint change
