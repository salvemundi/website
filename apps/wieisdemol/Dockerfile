FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    MOLPROEF_DATA=/data \
    TRUST_PROXY=1

WORKDIR /srv
COPY apps/wieisdemol/app ./app

# Draait niet als root; /data is het enige schrijfbare pad (mount hier een volume).
RUN useradd --uid 568 --no-create-home --shell /usr/sbin/nologin molproef \
 && mkdir /data && chown 568:568 /data
USER 568:568
VOLUME /data
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD python -c "import urllib.request,os;urllib.request.urlopen('http://127.0.0.1:%s/healthz' % os.environ.get('PORT','8080'), timeout=2)" || exit 1

CMD ["python", "app/server.py"]
