# Nachtwacht Leden Check Script
# Environment Isolation Audit: 2025-12-30
FROM mcr.microsoft.com/powershell:lts-ubuntu-22.04

LABEL description="Salve Mundi Leden Nachtwacht"
LABEL maintainer="DevOps Team"

# Vermijd interactieve prompts tijdens installatie
SHELL ["pwsh", "-Command"]

# Installeer vereiste modules
# We gebruiken -Scope AllUsers zodat ze beschikbaar zijn voor de container user
RUN Set-PSRepository -Name PSGallery -InstallationPolicy Trusted; \
    Install-Module Microsoft.Graph.Authentication -Scope AllUsers -Force; \
    Install-Module Microsoft.Graph.Users -Scope AllUsers -Force; \
    Install-Module Microsoft.Graph.Groups -Scope AllUsers -Force

# Werkmap instellen
WORKDIR /app

# Kopieer het script naar de container
COPY Nachtwacht.ps1 .

# Start het script direct bij het opstarten van de container
ENTRYPOINT ["pwsh", "-File", "./Nachtwacht.ps1"]
