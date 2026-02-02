# Frontend Environment Variables

## Required for Push Notifications

### NEXT_PUBLIC_NOTIFICATION_API_URL
De URL naar de notification API service.

**Development:**
```env
NEXT_PUBLIC_NOTIFICATION_API_URL=http://localhost:3003
```

**Production met nginx proxy op /api/notifications:**
```env
NEXT_PUBLIC_NOTIFICATION_API_URL=/api/notifications
```

**Production met subdomain:**
```env
NEXT_PUBLIC_NOTIFICATION_API_URL=https://notifications.salvemundi.nl
```

## Nginx Setup

### Optie 1: Via Path Prefix (Aanbevolen)
Voeg toe aan je bestaande `salvemundi.nl` nginx configuratie:

```nginx
location /api/notifications/ {
    rewrite ^/api/notifications/(.*) /$1 break;
    proxy_pass http://notification-api-dev:3003;  # of notification-api-latest voor productie
    
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_no_cache 1;
}
```

Dan gebruik je:
```env
NEXT_PUBLIC_NOTIFICATION_API_URL=/api/notifications
```

### Optie 2: Via Subdomain
Maak een nieuwe nginx server block voor `notifications.salvemundi.nl`.

Dan gebruik je:
```env
NEXT_PUBLIC_NOTIFICATION_API_URL=https://notifications.salvemundi.nl
```

## Docker Network

Zorg ervoor dat de notification-api en nginx in hetzelfde Docker netwerk zitten:

```yaml
networks:
  proxy-network:
    external: true
```

De notification-api `docker-compose.yml` gebruikt al `proxy-network`.
