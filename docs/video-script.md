# PhotoShare — 5-Minute Demonstration Video Script

**Module:** COM769 (79651) — Scalable Advanced Software Solutions
**Coursework:** CW2 — Mini Project (75%)
**Slide:** Slide 11 of the deck (Functionality of the recorded demonstration, 15% of CW2)

> Replace `[YOUR NAME]` and `[YOUR STUDENT NUMBER]` before recording.
> Pace yourself — five minutes goes faster than you think. Stay within ±10 seconds of each timestamp.
> Read the lines naturally; treat them as a guide, not a teleprompter.

---

## Pre-record checklist

- [ ] Stack is running: `docker-compose up -d` (verify with `docker ps`)
- [ ] Browser open at `http://localhost:3000`
- [ ] A second tab/terminal open showing live logs:
      `docker logs -f photoshare-auth-image`
- [ ] Logged out before starting (so the login page is the first thing on screen)
- [ ] At least 3 photos uploaded with tags seeded (so trending-tag chips are visible)
- [ ] Audio test done; screen-recorder set to 1080p

---

## 0:00 – 0:25 · Introduction

**On screen:** Title slide of your PowerPoint deck (slide 0).

> "Hi, I'm **[YOUR NAME]**, student number **[YOUR STUDENT NUMBER]**, and this is my submission for COM769 — Scalable Advanced Software Solutions, Coursework 2.
>
> The project is called **PhotoShare** — a cloud-native, role-based photo-sharing web application, conceptually similar to Instagram. In the next five minutes I'll walk you through the problem, the architecture, the live functionality, and the scalable and AI-powered features that earn this solution its advanced-feature credit."

---

## 0:25 – 0:55 · Problem statement

**On screen:** Slides 1–2 of the deck.

> "Photo-sharing platforms face two scalability pressures: bursty upload traffic from creators, and unbounded read traffic from consumers searching and browsing.
>
> A monolithic design couples those two workloads, so when ten thousand consumers refresh the feed at the same time, the upload pipeline slows down too. My solution addresses this by splitting the system into independently scalable microservices, with stateless application tiers, hosted databases, and object storage. Authentication is enforced server-side, and the design degrades gracefully — every cloud feature has a local fallback."

---

## 0:55 – 1:30 · Architecture overview

**On screen:** Slides 3–6 — your architecture diagram. Talk through it briefly.

> "The architecture has three layers.
>
> The **frontend** is a React single-page application built into static assets and served by an **nginx** container with cache-control headers for hashed assets.
>
> The **backend** is two **Node.js Express** microservices: the *auth-image-service* on port 8001 handles authentication and image upload, and the *interaction-search-service* on port 8002 handles comments, ratings, and multi-field search.
>
> The **persistence layer** uses **Azure Cosmos DB** for documents and **Azure Blob Storage** for photo files when deployed to the cloud, and falls back to **SQLite** and the local filesystem for development. Every service is containerised with Docker and orchestrated through Compose."

---

## 1:30 – 2:30 · Live demo — creator flow

**On screen:** Browser at `http://localhost:3000`. Switch to the terminal tailing logs occasionally.

**Action:** Click "Login". Log in as `admin` / `admin123`.

> "I'll log in as a *creator* — the role permitted to upload. Notice the header now shows the **Creator** badge."

**Action:** Click "Upload". Pick a photo. Fill in **Title**, **Caption**, **Location**, and **People Present** — exactly the four metadata fields the brief calls out.

> "Creators upload through a dedicated view. The four metadata fields — title, caption, location, and people present — are exactly the fields specified in the brief."

**Action:** Click submit. Briefly switch to the terminal showing the auth-image-service logs.

> "On the backend you can see the request hitting the API: the file is written through the storage adapter, the metadata is persisted, and an asynchronous AI Vision call is fired so it doesn't block the response."

**Action:** Return to the feed. Point at the new card.

> "The new photo appears immediately in the feed. The role check is enforced server-side — public registration creates only consumer accounts, so creator credentials cannot be obtained through the public interface."

---

## 2:30 – 3:30 · Live demo — consumer flow + role enforcement

**Action:** Log out. Log in as `user1` / `user123`.

> "Now I'll switch to a *consumer* account. The Upload link is gone from the navigation, and the role badge confirms the user has only the consumer role."

**Action:** Try to navigate manually to `/upload`.

> "If a consumer tries to bypass the UI and POST to the upload endpoint directly, the `requireRole` middleware on the server returns a 403 — the protection is not just cosmetic."

**Action:** On the feed, type a search term, then click a trending tag chip.

> "Consumers can search across multiple fields — title, caption, location, people present, and AI-generated tags. The **trending tag chips** under the search bar are aggregated from the most-used tags across the catalogue, and clicking one applies it as a filter instantly."

**Action:** Click into a photo. Leave a comment, then click stars to rate.

> "On the detail page, consumers can comment and rate from one to five stars. Both interactions hit the *interaction-search-service* — and notice that ratings are upserted, so a user can't game the score by submitting twice."

---

## 3:30 – 4:15 · Advanced features

**On screen:** Continue in the browser. Show the chip row, then the architecture diagram in the deck.

> "The solution incorporates several advanced features required for a Distinction-level submission.
>
> **First**, **Azure AI Vision** auto-tagging. On every upload the image bytes are sent to the Image Analysis 4.0 endpoint, and high-confidence tags above seventy percent are persisted on the image record. Those tags then power the search and the trending-chip recommendation.
>
> **Second**, **Azure AI Search** for genuine multi-field search across title, caption, location, people, and tags — with a SQLite LIKE-based fallback for local development.
>
> **Third**, **content-based tag aggregation** — the trending chips you just saw are computed in real time from the catalogue, giving the feed a personalised discovery surface without any external dependency.
>
> **Fourth**, **Application Insights** telemetry — every upload, login, comment, rating, and AI-tag event is emitted as a custom event, so operations teams can monitor the health of the deployment."

---

## 4:15 – 4:45 · Cloud deployment evidence

**On screen:** Azure portal — Resource Group containing Cosmos DB, Storage Account, AI Vision, AI Search, App Service or Container Apps, Application Insights. *(Record this segment after Azure deployment is done. If still local, replace this segment with a screen of `docker ps` showing the three healthy containers and the `docker-compose.yml` open in an editor.)*

> "The application is deployed to **Microsoft Azure** using free-tier resources where possible. You can see the resource group hosting Cosmos DB in serverless mode, Blob Storage for photos, the AI Vision and AI Search resources, and Application Insights collecting telemetry. The two services are containerised images deployed to **Azure Container Apps**, which provides automatic horizontal scaling based on HTTP load. Routing is fronted by Azure Front Door for global CDN caching."

---

## 4:45 – 5:00 · Closing

**On screen:** Conclusions slide of the deck (slide 12).

> "To summarise: PhotoShare delivers the full functional brief — creator-only uploads with mandated metadata, consumer view-search-comment-rate, and clean role separation — built on a containerised, microservices architecture that scales horizontally on Azure. Three or more advanced features are integrated end-to-end, and every cloud component degrades gracefully to a local equivalent. Thank you for watching."

---

## Recording tips

- Record at **1920×1080** with the browser zoomed to ~110% so text is readable when embedded in the slide.
- Use **OBS Studio** (free) — record with separate audio track so you can re-cut narration without re-recording the screen.
- Speak slightly slower than you think you should — viewers process spoken word at about 150 wpm; this script is roughly 750 words for 5 minutes.
- Trim any "umm"s in post; even a few seconds saved per cut adds room to breathe.
- Export at H.264 / MP4 for embedding in PowerPoint without codec issues.

## Word count

Roughly **740 spoken words**, comfortable for a 5-minute delivery at ~150 wpm with brief pauses for screen-switching.
