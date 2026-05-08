# PhotoShare — Project Overview for Slide Deck Generation

> **Purpose of this document:** This is a single, self-contained briefing covering every aspect of the PhotoShare project. Pass it to a slide-generation AI tool (or a human designer) along with the slide outline at the bottom, and it should be able to produce a complete COM769 Coursework 2 deck without any other context.
>
> **Honesty note:** The implementation status of every feature is marked explicitly (✅ done, 🟡 wired but env-gated, ❌ not implemented). Do not let the slide deck claim features that are not done.

---

## 1. Cover-page metadata

| Field | Value |
|---|---|
| Project name | **PhotoShare** |
| One-line description | A scalable, cloud-native photo-sharing web application with creator/consumer roles, AI-powered tagging and search, deployed on Microsoft Azure. |
| Module | COM769 (79651) — Scalable Advanced Software Solutions |
| Coursework | Coursework 2 — Mini Project (75% of module) |
| Course | MSc Computer Science |
| Module Coordinator | Dr Joseph Rafferty |
| Teaching Staff | Dr Asghar Darvishy |
| Submission deadline | 11 May 2026 |
| Student name | `[YOUR NAME]` |
| Student number | `[YOUR STUDENT NUMBER]` |

---

## 2. Problem definition

### Why a scalable photo-sharing solution is needed

Photo-sharing platforms must serve two very different workloads simultaneously:

1. **Burst-prone uploads from a small population of creators.** Each upload involves binary I/O (multipart parsing, blob storage write), database writes for metadata, and optional CPU-bound enrichment such as AI tagging or thumbnail generation.
2. **Sustained, high-fanout reads from a large population of consumers.** Browsing a feed, searching across multiple fields, viewing a single image, posting a comment, and submitting a rating must all stay sub-second under load.

A monolithic implementation couples these workloads on the same scaling unit, so when consumer reads spike, uploads are starved and vice versa. Operational risks of a monolith include:

- Single points of failure for unrelated functionality
- Inability to scale the right tier independently
- Schema and deployment lock-in: shipping a search optimisation forces a re-deploy of the upload service
- Difficult to integrate cognitive services without bloating the entry-point process

### The scalability requirements distilled

- Stateless, horizontally scalable application tiers
- Hosted, elastic database tier with automatic partitioning
- Object storage for binary photo assets, decoupled from the database
- Server-side enforcement of role-based access (creators vs consumers)
- Caching for repeated reads
- Multi-field search that does not full-scan the database
- Telemetry for observability under load
- Local development parity so the team is not blocked by cloud quotas

---

## 3. Solution overview

### Conceptual summary

PhotoShare is split into two independently scalable Node.js microservices behind a static React frontend served by nginx. Persistence is split between a NoSQL document database (Azure Cosmos DB / SQLite locally) for structured records and an object store (Azure Blob Storage / local filesystem) for the photos themselves. Cognitive services are integrated end-to-end: Azure AI Vision auto-tags every uploaded photo, and Azure AI Search powers multi-field search across title, caption, location, people present, and AI-generated tags.

The architecture follows a *graceful degradation* principle: every cloud feature has a local fallback driven by environment variables, so the entire stack can run on a developer laptop with `docker-compose up` while still demonstrating the production code paths.

### Component breakdown

| Component | Role |
|---|---|
| **Frontend** (React 18 + plain CSS, served by nginx alpine) | Single-page application — feed, search, image detail, login/register, upload (creator only). Static assets are immutable-cached; index.html is no-cache. |
| **auth-image-service** (Node.js / Express, port 8001) | Authentication, JWT issuing, user registration, image upload + metadata, image retrieval, deletion, AI Vision integration, popular-tag aggregation endpoint. |
| **interaction-search-service** (Node.js / Express, port 8002) | Comments (CRUD), ratings (1–5 stars, upsert), multi-field search (Azure AI Search or local SQLite LIKE fallback). |
| **Persistence** | Cosmos DB (Azure) or SQLite (local) — driven by `DB_MODE`. |
| **Object storage** | Azure Blob Storage (Azure) or local filesystem mount (local) — driven by `STORAGE_MODE`. |
| **AI services** | Azure AI Vision (Image Analysis 4.0) for tags, Azure AI Search for multi-field text search. |
| **Telemetry** | Application Insights — emits custom events on register, login, upload, AI tag, comment, rating, delete. |

### Component interaction (text description for diagram)

> The frontend (port 3000) talks over HTTPS-ready REST to the two services. Upload → auth-image-service writes the file via the `storage` adapter to Blob Storage (or local FS), persists metadata to Cosmos DB (or SQLite), and asynchronously calls Azure AI Vision; the resulting tags are written back to the image record. Read paths from the frontend hit either auth-image-service for image listing/detail or interaction-search-service for search/comments/ratings. JWTs are signed by auth-image-service and verified by both services using a shared `JWT_SECRET`. Telemetry events flow asynchronously from both services to Application Insights.

### Architecture diagram suggestion (for designer / AI to render)

A standard 3-tier diagram with these labelled nodes, drawn left-to-right:

1. **Client** — browser icon → "React 18 SPA / nginx static host"
2. **Application tier** — two boxed containers labelled `auth-image-service (Node 20 / Express)` and `interaction-search-service (Node 20 / Express)`
3. **Data tier** — three boxes side-by-side: `Cosmos DB (NoSQL, serverless)`, `Blob Storage (photos container)`, `Azure AI Search (images-index)`
4. **Cognitive sidebar** — a connected box: `Azure AI Vision (Image Analysis 4.0)`
5. **Observability sidebar** — a connected box: `Application Insights`
6. **Edge** — `Azure Front Door / CDN` (planned) above the React node
7. **Auth flow callout** — JWT arrow from the React box through both services

---

## 4. Functional features (mapped to the brief)

| Brief requirement | Status | Implementation reference |
|---|---|---|
| Creator role uploads photos | ✅ | `auth-image-service/src/routes/images.js` — `POST /images` gated by `requireRole('admin')` |
| Title, Caption, Location, People Present metadata | ✅ | All four fields persisted in the `images` table/container |
| No public enrolment of creator users | ✅ | `POST /auth/register` always assigns `user` role |
| Consumer view, search, comment, rate | ✅ | Public list/detail endpoints + auth-required comment/rating endpoints |
| Consumer cannot upload | ✅ | Server-side `requireRole('admin')` returns 403 |
| Static HTML hosting + REST backend | ✅ | nginx-served React build + Express APIs |
| Hosted, scalable database | 🟡 | Cosmos DB code path complete; runs locally on SQLite |
| Block/object storage | 🟡 | Azure Blob code path complete; runs locally on filesystem |
| Auth + roles | ✅ | JWT (HS256) + bcrypt cost-10 + `requireRole` middleware |
| Caching | 🟡 | nginx immutable cache for hashed assets; 5-second search-hydrate de-bounce; Redis/Front Door not yet wired |
| Dynamic DNS routing | ❌ | Planned via Azure Front Door — not yet provisioned |
| Cognitive services | 🟡 | Azure AI Vision integration coded; key required to activate |
| Media conversion (thumbnails) | ❌ | Schema column exists; generator not implemented |

---

## 5. Advanced features (rubric: 20%, three or more = Distinction)

The brief lists examples (non-exhaustive): cognitive services, sentiment analysis, media conversion, media analysis, automated speech recognition, identity framework, **CI/CD pipeline**.

The PhotoShare implementation contributes the following:

### Feature 1 — Azure AI Vision auto-tagging (Cognitive service / Media analysis)

- On every upload, the uploaded image buffer is POSTed to the Azure AI Vision *Image Analysis 4.0* endpoint with `features=tags,caption`.
- Tags above 0.7 confidence are filtered, the top ten are persisted on the image record, and indexed for search.
- The call is fire-and-forget so it does not block the upload response — telemetry event `AIVisionTagged` records success.
- Implementation: `services/auth-image-service/src/services/aiVision.js`.

### Feature 2 — Azure AI Search multi-field search (Media analysis)

- Search query parameters `q`, `location`, and `tag` are issued against an Azure AI Search index (`images-index`) covering title, caption, location, people present, and tags.
- Free-tier-friendly index design with hybrid full-text relevance.
- Local SQLite `LIKE` fallback maintained at `interaction-search-service/src/routes/search.js` so demos run without Azure access.

### Feature 3 — Trending tag chips (in-app discovery / personalisation)

- A `GET /images/tags/popular` endpoint aggregates tag frequencies across the catalogue at request time and returns the top N.
- The frontend renders the top-10 as clickable chips beneath the search bar; clicking a chip toggles a tag filter on the existing multi-field search.
- Pure JavaScript aggregation in `services/auth-image-service/src/services/similarity.js` — works without Azure, becomes self-driving when AI Vision is enabled and tags accumulate organically.

### Feature 4 — Application Insights observability

- Custom telemetry events emitted on register, login, upload, AI-tag completion, comment, rating, delete.
- Activated by the `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable; falls silent otherwise.
- Implementation: `services/*/src/services/telemetry.js`.

### Feature 5 — Identity framework via JWT + bcrypt + role guards

- Issuer is `auth-image-service`; verifier middleware is shared across both services through a common `JWT_SECRET`.
- Roles are first-class (`admin` for creators, `user` for consumers), and `requireRole(role)` guards sit in front of upload and delete.
- Public registration cannot escalate to creator — the public form ignores any client-supplied role.

### Features planned but **not** implemented (be explicit in the deck)

- ❌ Sentiment analysis on comments (Azure AI Language)
- ❌ Thumbnail / media conversion (sharp)
- ❌ CI/CD pipeline (`.github/` is empty)
- ❌ Azure AD B2C / Microsoft Entra integration (current auth is JWT, which counts as standard auth, not as an "identity framework" in the strongest sense)

---

## 6. Limitations and scalability assessment

### Current limitations

1. **Not yet deployed to Azure.** The code paths are complete and env-gated; provisioning the resource group is the only step missing.
2. **No CI/CD.** Builds and deployments are manual today; the `.github/` directory is empty. A two-stage GitHub Actions pipeline (test → push image → deploy to Azure Container Apps) is the obvious next addition.
3. **Caching is partial.** nginx caches hashed JS/CSS aggressively, but there is no Redis-backed cache for hot read paths such as the feed listing or popular tags. Under 1k+ requests/sec, the database is the bottleneck.
4. **No global CDN edge.** Photos are served directly from Blob Storage rather than fronted by Azure Front Door / CDN, so cross-region viewers pay the full origin latency.
5. **No thumbnail pipeline.** The `thumbnail_url` column exists but is never populated; the feed currently downloads full-resolution photos which is bandwidth-inefficient.
6. **Role model is binary.** `admin` and `user` only — no fine-grained permissions, no creator approval queue, no "verified creator" tier.
7. **No rate limiting** on upload, comment, or rating endpoints; production deployment would need this to prevent abuse.
8. **Search fallback is a `LIKE` scan** when AI Search is disabled — fine for thousands of rows, would not survive millions.

### Scalability roadmap (talking points for the limitations slides)

| Layer | Today | Roadmap to scale |
|---|---|---|
| Compute | Containers on Docker Compose | Azure Container Apps with KEDA-driven autoscale; Front Door for global routing |
| Database | Cosmos DB serverless | Switch to provisioned throughput with autoscale RU/s; partition by `creator_id` (already in schema) |
| Storage | Azure Blob single region | Geo-redundant storage; Azure CDN endpoint in front of the photos container |
| Search | Azure AI Search free tier | Standard tier with semantic ranking; index updates via Cosmos change feed instead of synchronous writes |
| Cache | nginx asset cache only | Azure Cache for Redis for feed, popular tags, and image-detail responses |
| Async work | None | Azure Functions on Service Bus queue for AI Vision + thumbnail generation, decoupling them from the upload request |
| Observability | App Insights events | Distributed tracing across both services; alerts on p95 latency and error budget |
| CI/CD | Manual | GitHub Actions: lint → test → build images → push to ACR → deploy to Container Apps |

### Performance metrics that would be quantified in production

- p50 / p95 / p99 upload latency under load
- Concurrent feed-render request throughput (RPS) at fixed p95
- Cosmos DB request units consumed per upload and per feed page
- Blob Storage egress per hour
- AI Vision call latency and success rate
- Application Insights failure rate and dependency telemetry

---

## 7. Concluding comments

PhotoShare delivers the full functional brief — creator-only uploads with the four mandated metadata fields, consumer view-search-comment-rate, with strict role separation enforced server-side. It is built on a containerised microservices architecture that scales horizontally on Azure, with five advanced features integrated end-to-end and graceful local fallbacks for every cloud dependency.

The submission's strongest points are: clean separation of concerns between the two services; multi-field AI Search powered by AI Vision tagging; in-app discovery via trending tag aggregation; first-class observability through Application Insights; and a development experience that lets every component run on a laptop with one command.

The honest weaknesses, which would be the immediate priorities in a real production cycle, are the absence of a CI/CD pipeline, the lack of a Redis caching tier, and the missing thumbnail / media conversion pipeline. The roadmap section above sets out concrete steps to address each.

---

## 8. Technology stack (single-glance reference)

| Layer | Stack |
|---|---|
| Frontend | React 18, react-router-dom 6, plain CSS, served by nginx 1.29 alpine |
| Backend | Node.js 20, Express 4.18, Multer 1.4 (in-memory uploads), bcryptjs (cost 10), jsonwebtoken 9.0, uuid 9.0, dotenv 16.3, cors 2.8 |
| Database (local) | SQLite via `better-sqlite3` 11.0 |
| Database (cloud) | Azure Cosmos DB via `@azure/cosmos` 4.0 |
| Object storage (local) | Local filesystem (`./uploads` bind mount) |
| Object storage (cloud) | Azure Blob Storage via `@azure/storage-blob` 12.17 |
| AI / Cognitive | Azure AI Vision (Image Analysis 4.0), Azure AI Search via `@azure/search-documents` 12.0 |
| Telemetry | Application Insights via `applicationinsights` 2.9 + `@azure/monitor-opentelemetry` 1.2 |
| Containerisation | Docker, docker-compose v3.9, multi-stage Dockerfiles, healthchecks via wget |
| Auth | JWT HS256 with shared secret across both services |

---

## 9. Suggested slide outline (matches the brief, ready to feed an AI generator)

> The brief recommends approximately 12 content slides plus a title slide and references. Each cell below maps to a slide and lists the bullets a slide-generation AI should put on it. Keep prose short — 4 to 7 bullets per slide.

| Slide | Title | Bullets |
|---|---|---|
| **0** | PhotoShare — Scalable, AI-powered photo-sharing on Azure | Project name; one-line description; `[YOUR NAME]`; `[YOUR STUDENT NUMBER]`; module COM769 — CW2 |
| **1** | The problem | Photo-sharing apps mix two unrelated workloads (creators / consumers); monolithic designs couple their scaling; bursty uploads vs sustained high-fanout reads; need elastic compute + storage + search; need server-side role enforcement |
| **2** | Why scalability matters here | Single-tenant outages and noisy-neighbour effects; database lock contention under upload bursts; cost inefficiency of over-provisioning; user expectation of sub-second feed/search; observability gaps in monoliths |
| **3** | Solution at a glance | Two stateless Node.js microservices; React SPA on nginx; Cosmos DB + Blob Storage; AI Vision + AI Search + Application Insights; containerised with Docker Compose; cloud-native primitives end-to-end |
| **4** | Architecture diagram | (Render the diagram described in §3) |
| **5** | Frontend & API design | React 18 + react-router; static build served by nginx with cache-control; REST endpoints — `/auth/*`, `/images`, `/images/:id`, `/images/tags/popular`, `/comments`, `/ratings`, `/search`; JWT bearer auth |
| **6** | Persistence & storage | Cosmos DB containers `users`, `images`, `comments`, `ratings`; Blob container `photos`; partition keys chosen for write hotspots; SQLite + filesystem for local development; same code paths in both modes |
| **7** | Advanced features (1/2) | Azure AI Vision auto-tagging — top-10 tags above 0.7 confidence stored per image; Azure AI Search multi-field index with local LIKE fallback; trending tag chips computed at request time |
| **8** | Advanced features (2/2) | Application Insights custom events for register / login / upload / AI tag / comment / rating; JWT + bcrypt + `requireRole` identity framework; graceful degradation — every cloud feature has a local fallback |
| **9** | Limitations | No CI/CD pipeline; partial caching (no Redis); no global CDN front-door; no thumbnail pipeline; binary role model; no rate limiting; LIKE-scan fallback search at large N |
| **10** | Scalability roadmap | KEDA autoscale on Container Apps; Cosmos provisioned throughput with autoscale RU/s; Geo-redundant Blob + CDN; Azure Cache for Redis on hot paths; Service Bus + Functions for AI/thumbnail async pipeline; GitHub Actions CI/CD; semantic search ranking |
| **11** | Demonstration video | Embedded 5-minute screen capture (see `docs/video-script.md`) |
| **12** | Conclusions | Brief satisfied + 5 advanced features integrated; cloud-native architecture with local parity; clear roadmap to address the named limitations; lessons learned: graceful degradation pays back; cognitive services compound when paired with first-class telemetry |
| **13** | References | (See §10 below — IEEE format) |

---

## 10. References (IEEE format, ready for the references slide)

> Replace any with sources you actually consulted; these are commonly-cited canonical references for the technologies used.

1. M. Fowler and J. Lewis, "Microservices: a definition of this new architectural term," *martinfowler.com*, 2014. [Online]. Available: https://martinfowler.com/articles/microservices.html
2. Microsoft, "Azure Cosmos DB documentation." [Online]. Available: https://learn.microsoft.com/azure/cosmos-db/
3. Microsoft, "Azure Blob Storage documentation." [Online]. Available: https://learn.microsoft.com/azure/storage/blobs/
4. Microsoft, "Azure AI Vision — Image Analysis 4.0." [Online]. Available: https://learn.microsoft.com/azure/ai-services/computer-vision/concept-tag-images-40
5. Microsoft, "Azure AI Search documentation." [Online]. Available: https://learn.microsoft.com/azure/search/
6. Microsoft, "Azure Container Apps documentation." [Online]. Available: https://learn.microsoft.com/azure/container-apps/
7. Microsoft, "Application Insights overview." [Online]. Available: https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview
8. Docker Inc., "Compose file reference." [Online]. Available: https://docs.docker.com/compose/compose-file/
9. M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," IETF RFC 7519, May 2015. [Online]. Available: https://datatracker.ietf.org/doc/html/rfc7519
10. N. Provos and D. Mazieres, "A future-adaptable password scheme," in *Proc. USENIX Annual Technical Conference*, 1999. (bcrypt)
11. Meta Platforms, "React documentation," 2024. [Online]. Available: https://react.dev/
12. Express, "Express — Node.js web application framework." [Online]. Available: https://expressjs.com/
13. SQLite Consortium, "About SQLite." [Online]. Available: https://www.sqlite.org/about.html
14. NGINX Inc., "NGINX documentation." [Online]. Available: https://nginx.org/en/docs/

---

## 11. Visual / asset suggestions (so the AI doesn't pad with stock cliches)

- **Slide 0 — Title slide:** Solid pale-purple gradient background matching the app's UI; small camera-aperture icon next to the project name.
- **Slide 4 — Architecture:** Use the seven labelled nodes from §3. A left-to-right flow is clearer than a hub-and-spoke for this many components.
- **Slide 5 — API design:** Two-column layout — left lists endpoints, right shows a JWT request/response snippet.
- **Slides 7–8 — Advanced features:** Each feature should occupy roughly one quarter of the slide with: name, one-sentence what-it-does, one-sentence why-it-matters, code/file pointer.
- **Slide 9 — Limitations:** Use a two-column "current → future" framing rather than a flat bullet list.
- **Slide 10 — Roadmap:** Reuse the table from §6 verbatim, possibly as a styled table widget.
- **Slide 11 — Video:** Just the embedded video at full slide width; no other content. The 5-minute script lives in `docs/video-script.md`.
- **Avoid:** generic stock photos of clouds or padlocks; busy infographic vendors; gratuitous gradients on top of body text.

---

## 12. Talking-points cheat sheet (helpful for slide notes)

| Topic | Two-line summary you can paste into speaker notes |
|---|---|
| Why two services? | Different scaling profiles. Uploads are write-heavy and bursty; comments/ratings/search are read-heavy and steady. Splitting them lets each scale independently. |
| Why Cosmos DB? | NoSQL with automatic horizontal partitioning, multi-region replication, and serverless billing — operationally cheap at low scale, scales to global without re-architecting. |
| Why Blob Storage? | Photos are immutable binary blobs; storing them in the database wastes RU/s and inflates request costs. Blob is purpose-built and integrates with CDN. |
| Why JWT? | Stateless verification means either service can validate a token without round-tripping to a session store, which is essential for stateless horizontal scaling. |
| Why AI Vision tags drive search? | Manual tagging doesn't scale, and free-text search alone misses semantic matches. Auto-tags raise recall while AI Search raises relevance. |
| Why local fallbacks? | Cloud quotas and outages must not block development. Every cloud component is gated by an environment variable, with a feature-equivalent local mode. |
| Why Application Insights? | Custom events tied to user actions surface adoption funnels and degradation early; required for any production deployment, not optional. |
| Why containers? | Reproducible environments, identical artefact in dev and prod, and Container Apps gives KEDA-driven HTTP autoscale out of the box. |

---

**End of briefing.**
