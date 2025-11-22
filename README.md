<p align="center">
  <img src="/banner.jpg" alt="SamuWebsiteV6 Banner" width="100%" />
</p>

# 🌐 SamuWebsiteV6

The modern, scalable website for Salve Mundi — built with Next.js, TypeScript, TailwindCSS, and real dev workflow standards.

[![Last Commit](https://img.shields.io/github/last-commit/salvemundi/website?color=blue)](https://github.com/salvemundi/website/commits/main)
[![Issues](https://img.shields.io/github/issues/salvemundi/website)](https://github.com/salvemundi/website/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/salvemundi/website)](https://github.com/salvemundi/website/pulls)
[![License](https://img.shields.io/github/license/salvemundi/website)](https://github.com/salvemundi/website/blob/main/LICENSE)

---

## 🚀 Tech Stack

| Tool / Library               | Purpose                             |
|------------------------------|-------------------------------------|
| **Next.js (App Router)**     | Fullstack React framework           |
| **TypeScript**               | Static typing and clean code        |
| **Tailwind CSS**             | Utility-first styling               |
| **ESLint**                   | Code quality and formatting         |
| **Turbopack**                | Super-fast bundler for dev mode     |

✅ Uses default import alias: `@/*`  
✅ Based on real-world scalable development workflows

---

## 🛠️ Getting Started

**📖 See setup guide:**  
👉 [Setup Instructions](https://github.com/salvemundi/website/wiki/setup-instructions)

Basic steps:

```bash
git clone https://github.com/salvemundi/website.git
cd /website/samuwebsitev6
npm run dev
```

Then open: [http://localhost:3000](http://localhost:3000)

---
## 🔄 CI/CD Deployment Pipeline

De automatische deployment wordt beheerd door de GitHub Action (`deploy.yml`). Dit proces garandeert dat een push naar de `Development` of `main` branch direct een update op de Linux VPS uitvoert.

**Proces:** De workflow voert een multi-stage build uit:
1.  Het bouwt de Vite/React SPA als een Docker image.
2.  Het injecteert de **Entra ID (MSAL) configuratie** en de **Directus URL** via GitHub Secrets als build-arguments.
3.  Vervolgens maakt het via SSH verbinding met de VPS, trekt de nieuwe image uit de GitHub Container Registry (GHCR), en herstart de Docker Compose stack in de juiste omgeving (`dev` of `prod`).

## 🧠 Contributing

We follow a consistent Way of Working across the team:

- Clear issue tracking
- Branch naming rules
- Commit message format
- Code in English, PascalCase naming, kebab-case branches

🔎 See: [Way of Working]\([Place appropriate link]\)

---

## 📚 Documentation

**Page & Description**  
⚙️ Setup Instructions: How to get the app running  
🛠️ Way of Working: Git workflow, commits, tasks, branches  
🔐 [Authentication Setup](readme/AUTH_SETUP.md): Microsoft Entra ID integration  
📧 [Email Setup](readme/EMAIL_SETUP.md): Email notification configuration  
📨 [Directus Email Flow](readme/DIRECTUS_EMAIL_FLOW.md): Setup Directus for email sending  
🧑‍💻 Contributors: Thanks to these awesome people

[![Contributors](https://contrib.rocks/image?repo=salvemundi/website)](https://github.com/salvemundi/website/graphs/contributors)

Want to join the wall? Open a PR and contribute!

---

## 💬 Questions or Issues?

Found a bug? Open an issue.  
Want to improve the docs or code? Fork and submit a PR 🚀

---

## 📄 License

Licensed under SAMU??

---

> "Code is communication. Keep it clean."
