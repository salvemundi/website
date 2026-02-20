<div align="center">
  <h1>Salve Mundi Website V6</h1>
  <p>The official Next.js platform and monorepo for Study Association Salve Mundi.</p>
</div>

---

## 🚀 Features

- **Authentication & Authorization**: Integrated Entra ID (Microsoft) single sign-on with custom committee-based RBAC.
- **Finance & Payments**: Deep Mollie integration for trip and event payments, handling deposits, remainders, and webhook verifications.
- **Headless CMS Integration**: Built on top of Directus as a flexible core data layer.
- **Event & Trip Management**: "Reis" (Trip) portal to register users, track payment statues, and handle crew logic.
- **Serverless Communications**: Internal microservices for structured email delivery and push notifications.

## 🛠 Tech Stack

- **Frontend Application**: [Next.js 15](https://nextjs.org/) (App Router), React, [Tailwind CSS](https://tailwindcss.com/)
- **Core CMS & Database**: [Directus](https://directus.io/), PostgreSQL
- **Internal Microservices**: Express.js / Node.js
  - Finance Service
  - Identity Service
  - Email Service
  - Notifications Service
- **Infrastructure**: Docker, Docker Compose, Nginx Proxy

## ⚙️ Getting Started (Local Setup)

Follow these steps to spin up the entire application stack locally for development.

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **Docker** and **Docker Compose**
- Git

### 2. Environment Variables
You need to set up environment variables for the frontend and services.
Copy the example files and fill in your local secrets.

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

### 3. Running the Stack
The easiest way to run the application is to use the development Docker Compose setup, which spins up all necessary services (Next.js, Directus, and internal microservices).

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### 4. Accessing Local Services
Once the containers are successfully running, you can access the platform at:

| Service                       | Local URL                                                    |
| ----------------------------- | ------------------------------------------------------------ |
| **Web Application (Next.js)** | `http://localhost:5173`                                      |
| **Directus CMS / Backend**    | `http://localhost:8055` (or mapped port depending on config) |
| Finance Service               | `http://localhost:3001`                                      |
| Identity Service              | `http://localhost:3002`                                      |

## 📂 Project Structure

This repository uses a monorepo-style structure to keep the frontend and dedicated microservices isolated but accessible together:

- `/apps/web/`: The core Next.js frontend application.
- `/services/finance/`: Handles Mollie payments, webhooks, and payment receipts.
- `/services/identity/`: Manages external authentication integrations (Microsoft Graph).
- `/services/email/`: Dedicated service for templating and sending emails.
- `/services/notifications/`: Manages system alerts and VAPID push notifications.
- `/infra/`: Shared infrastructure templates (e.g., Nginx proxy).

## 🤝 Contributing Guidelines

We welcome contributions from Salve Mundi members!

1. **Branching Strategy**: Create a feature branch originating from `main` (e.g., `feature/payment-status` or `fix/auth-provider`).
2. **Commit Messages**: Use short, descriptive commit messages.
3. **Pull Requests**: Open a pull request against `main`. Ensure all local builds and types pass before requesting a review.
4. **Code Quality**: Keep your components modular, use Server Actions securely where applicable, and remove dead code/logs.

## 📄 License

*Internal or custom open-source license. Please consult the repository administrators.*
