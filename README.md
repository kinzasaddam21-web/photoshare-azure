# PhotoShare — Scalable Cloud-Native Photo Sharing Platform

**Module:** COM769 — Scalable Advanced Software Solutions
**Coursework:** CW2 (Mini Project, 75%)

A scalable, containerised, microservices-based photo sharing web application — conceptually similar to Instagram — designed for Microsoft Azure.

## Architecture summary

- **Frontend:** React (Create React App), hosted on Azure Static Web Apps
- **Backend:** Two Node.js + Express microservices, containerised with Docker, deployed to Azure App Service
  - `auth-image-service` — authentication, user management, image upload & retrieval
  - `interaction-search-service` — comments, ratings, multi-field search
- **Database:** SQLite (local dev) → Azure Cosmos DB (production)
- **Image storage:** Local folder (dev) → Azure Blob Storage (production)
- **CDN:** Azure CDN for image acceleration
- **Global routing:** Azure Front Door
- **Autoscaling:** Azure App Service autoscale rules (CPU-based)
- **Advanced features:**
  - Azure AI Vision — auto-tagging of uploaded images
  - Azure Application Insights — monitoring and metrics
  - GitHub Actions CI/CD pipeline
  - Multi-field full-text search

## Roles

- **Admin (creator):** can upload photos with metadata (title, caption, location, people present)
- **User (consumer):** can view, search, comment on, and rate photos

## Local development

```bash
# Run everything via docker-compose
docker-compose up --build

# Frontend:  http://localhost:3000
# Auth/Image API:  http://localhost:8001
# Interaction/Search API:  http://localhost:8002
```

## Project structure

```
photo-sharing-app/
├── frontend/                          # React app
├── services/
│   ├── auth-image-service/           # Auth + image upload/retrieval
│   └── interaction-search-service/   # Comments, ratings, search
├── functions/
│   └── thumbnail-generator/          # Azure Function — blob trigger
├── infra/azure/                       # Azure deployment configs
├── .github/workflows/                 # CI/CD pipelines
├── docs/                              # Architecture diagrams, ERD
└── docker-compose.yml                 # Local orchestration
```

## Default test users (seeded on first run)

| Username | Password | Role |
|----------|----------|------|
| admin    | admin123 | admin (creator) |
| user1    | user123  | user (consumer) |
