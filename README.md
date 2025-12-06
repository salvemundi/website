<p align="center">
  <img src="frontend/public/banner.jpg" alt="SaMuWebsiteV6 Banner" width="100%" />
</p>

# 🌐 SaMuWebsiteV6

The central repository for Salve Mundi's digital infrastructure. This monorepo houses the modern website, synchronization services, and ecosystem configurations.

[![Last Commit](https://img.shields.io/github/last-commit/salvemundi/website?color=blue)](https://github.com/salvemundi/website/commits/main)
[![Issues](https://img.shields.io/github/issues/salvemundi/website)](https://github.com/salvemundi/website/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/salvemundi/website)](https://github.com/salvemundi/website/pulls)

---

## 🏛️ Architecture & Infrastructure

```mermaid
graph TD
    User([User / Browser]) -->|HTTPS| Proxy[Nginx Proxy Manager]
    
    subgraph "Frontend Layer"
        Proxy -->|frontend| Frontend[Next.js Production]
        Proxy -->|frontend-dev| FrontendDev[Next.js Development]
    end

    subgraph "Management & Security"
        Proxy -->|npm| NPM[Nginx Proxy Manager]
        Proxy -->|portainer| Portainer[Portainer]
        Proxy -->|vault| Vault[HashiCorp Vault]
        Proxy -->|vaultwarden| Vaultwarden[Bitwarden/Vaultwarden]
    end

    subgraph "Data & Content"
        Proxy -->|samuwiki| Wiki[Wiki.js]
        Proxy -->|directus| Directus[Directus CMS]
    end

    subgraph "Backend Services"
        Proxy -->|email-api| EmailAPI[Email API]
        Proxy -->|graph-webhook| Webhook[Graph Webhook]
        GraphSync[Graph Sync Service]
    end
    
    %% Relationships
    GraphSync <-->|Sync| Directus
    GraphSync <-->|Sync| EntraID
    Webhook <---|Notify| EntraID[Microsoft Entra ID]
    Nachtwacht[Leden Check Script] -->|Cron| EntraID
```

### 📂 Project Structure

```text
/
├── .github/workflows/    # CI/CD Pipelines
├── directus/             # Headless MS Configuration
├── email-api/            # Email Sending Service
├── frontend/             # Next.js Frontend
│   ├── src/              # Source Code
│   └── public/           # Static Assets
├── graph-sync/           # Sync Service (Entra <-> Directus)
├── graph-webhook/        # Webhook Service (Entra Listener)
├── leden-check-script/   # PowerShell Automation
├── membership-api/       # Membership Logic
├── npm/                  # Nginx Proxy Manager Config
├── payment-api/          # Payment Processing
├── portainer/            # Portainer Config
├── samuwiki/             # Wiki.js Config
└── README.md             # This file
```

---

## 🏗️ Services Overview

| Service | Path | Description |
|:---|:---|:---|
| **Website (Frontend)** | `/` | Next.js App Router (Production & Dev environments). |
| **Email API** | `/email-api` | Service for handling transactional emails. |
| **Directus** | `/directus` | Headless CMS for managing association data. |
| **Graph Sync** | `/graph-sync` | Bi-directional sync between Entra ID and Directus. |
| **Graph Webhook** | `/graph-webhook` | Event listener for real-time Entra ID changes. |
| **Nachtwacht** | `/leden-check-script` | PowerShell automation for member lifecycles. |
| **Infrastructure** | `/npm`, `/portainer`, `/samuwiki` | Docker configs for critical infra components. |
| **Security** | `(External)` | Vault and Vaultwarden (Managed via Portainer). |

---

## 🚀 Tech Stack

| Domain | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, Framer Motion |
| **Backend / Sync** | Node.js, Express, Microsoft Graph API, Directus SDK |
| **Automation** | PowerShell Core, Docker, GitHub Actions |
| **Infrastructure** | Docker Compose, Nginx Proxy Manager, Postgres |

---

## 🔄 CI/CD & Deployment

This repository uses **GitHub Actions** for continuous delivery. Each service has its own independent workflow.

### 🔹 Deployment Strategy
*   **Development Branch**: Deploys automatically to the testing environment (typically tagged `:dev`).
*   **Main Branch**: Deploys to production (`:latest`).

### 🔹 Workflows
1.  **Backend Services**: Deployment pipelines for Graph Sync, Webhook, Email API.
2.  **Automation**: Scripts like Leden Check are deployed via cron/SSH.
3.  **Infrastructure**: Managed manually via Portainer or SSH for stability (Disaster Recovery configs in Git).

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js 20+
*   Docker & Docker Compose
*   Git

### Local Development (Frontend)
```bash
git clone https://github.com/salvemundi/website.git
npm install
npm run dev
```

### Running Backend Services
Navigate to the specific service directory (e.g., `graph-sync`) and check its local `README.md` or `package.json` for start instructions. most services are Docker-first.

---

## 🧠 Contributing

We follow a consistent Way of Working across the team:

- **Clean Commits**: Use conventional commits (e.g., `feat: add sync logic`, `fix: style error`).
- **Branching**: `feature/my-feature` or `fix/my-bug`. Merge to `Development` first.
- **Language**: Code and Comments in English.

---

## 📚 Documentation & Links

*   **Setup Instructions**: [Wiki / Docs](https://github.com/salvemundi/website/wiki)
*   **Authentication**: [Entra ID Setup](readme/AUTH_SETUP.md)
*   **Email**: [Email Flow](readme/EMAIL_SETUP.md)

---

## 💬 Issues?

Found a bug or need a feature? Open an issue on GitHub.
Want to contribute? Fork the repo and open a Pull Request! 🚀

---

> "Code is communication. Keep it clean." - Salve Mundi Dev Team
