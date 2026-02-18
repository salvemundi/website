FROM nginx:latest

COPY nginx.template.conf /etc/nginx/nginx.template.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
