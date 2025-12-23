# Team Development Plan: WorkFinder (Full Lifecycle)

## Team Roles & Focus
| Name         | Role                          | Focus Area                                              |
| :----------- | :---------------------------- | :------------------------------------------------------ |
| **Fares**    | **Project Lead / Back Dev 1** | Architecture, DevOps, Core API, Security, Orchestration |
| **Danielle** | **Back Dev 2**                | Data Ingestion (Scraping), Normalization, Deduplication |
| **Ruth**     | **Lead Front / Dev Front 1**  | Design System, UX/UI Core, Search Experience            |
| **Amadou**   | **Front Dev 2**               | Job Presentation, Responsiveness, API Integration       |
| **Miguel**   | **Front Dev 3**               | User Accounts, Watchlists/Alerts UI, Dashboard          |

---

## Sprint Breakdown (14 Weeks / 7 Sprints)

### Sprint 1: Setup & Architecture (Weeks 1-2)
*Goal: Project initialization, environments set up, and architecture defined.*

#### Week 1: Backend & Data Foundation
*   **Fares (Project Lead)**:
    *   Initialize Git repository with `main` and `dev` branches.
    *   Setup `docker-compose.yml` (PostgreSQL, Redis, base Python/Node services).
    *   Design PostgreSQL Database Schema (Users, Jobs, Sources Tables).
*   **Danielle**:
    *   Analyze HTML structure of target sites (Jobartis, Emploi.cm).
    *   Setup Python Scraping Environment (BeautifulSoup/Playwright).
    *   Create "Proof of Concept" script for fetching 1 page from Remotive.

#### Week 2: Frontend Initialization
*   **Ruth (Front Lead)**:
    *   Initialize Vite + React project.
    *   Setup Tailwind CSS & Configure Design System (Colors, Fonts).
    *   Create `Navbar` and `Footer` components.
*   **Amadou**:
    *   Setup React Router (Routes structure).
    *   Create skeleton pages (Home, JobDetails, Login, 404).
    *   Draft "Job Card" HTML/CSS structure.
*   **Miguel**:
    *   Design Login & Register mockups/forms (Static).
    *   Setup Client-side Form Validation logic (Zod/React Hook Form).

### Sprint 2: Ingestion MVP (Weeks 3-4)
*Goal: Collect data from easier sources (APIs/RSS) and store in DB.*

#### Week 3: Backend Implementation
*   **Fares (Project Lead)**:
    *   Build FastAPI Skeleton (Routers, Dependency Injection).
    *   Setup SQLAlchemy ORM Models.
    *   Implement "Source Registry" (DB storing active sources).
*   **Danielle**:
    *   Implement **Remotive** scraping/API fetcher.
    *   Implement **Adzuna** API fetcher.
    *   Create data normalization utility (raw JSON -> `Job` model).

#### Week 4: Frontend Implementation
*   **Ruth (Front Lead)**:
    *   Build "Search Bar" component (Input + Filters UI).
    *   Design "Filter Sidebar" (Checkbox groups for Skills, Location).
*   **Amadou**:
    *   Build "Job List" component (Grid/List layout).
    *   Implement pagination UI components.
*   **Miguel**:
    *   Build "User Dashboard" static layout.
    *   Implement "Theme Switcher" (Dark/Light mode).

### Sprint 3: Advanced Ingestion & Deduplication (Weeks 5-6)
*Goal: Collect data from hard sources (HTML) and handle duplicates.*

#### Week 5: Backend & Data Processing
*   **Fares (Project Lead)**:
    *   Configure Celery for async task scheduling (The Scheduler).
    *   Database Migration management (Alembic).
    *   Setup Logging & Monitoring (Sentry/Logs).
*   **Danielle**:
    *   Implement **Jobartis** HTML parser.
    *   Implement **Emploi.cm** HTML parser.
    *   Implement **WeWorkRemotely** RSS parser.

#### Week 6: Frontend Refinement
*   **Ruth (Front Lead)**:
    *   Refine Mobile responsiveness for Search & Home.
    *   Implement "Loading Skeletons" for better UX.
    *   Build "Admin Dashboard" UI Layout (Stats & Ingestion Logs).
*   **Amadou**:
    *   Build "Job Details" page (Description, Meta-data display).
    *   Implement "Share Job" functionality.
*   **Miguel**:
    *   Create "Profile Settings" page layout.
    *   Implement "Saved Jobs" list UI (UI only).

### Sprint 4: Data Quality & Core Backend (Weeks 7-8)
*Goal: Deduplication Logic and Search API readiness.*

#### Week 7: Backend Logic
*   **Fares (Project Lead)**:
    *   Implement `GET /jobs` API with filtering logic (SQLAlchemy filters).
    *   Implement Full-Text Search (Targeting PostgreSQL `tsvector`).
*   **Danielle**:
    *   **Core Task**: Implement Deduplication Logic.
        *   Step 1: Hash Generation (Title + Company).
        *   Step 2: Fuzzy Matching integration (RapidFuzz) for similar titles.
    *   Write Unit Tests for all parsers.

#### Week 8: Frontend Mocking & State
*   **Ruth (Front Lead)**:
    *   Connect "Search Bar" to mocked API data (simulate delays).
    *   Implement "Zero Results" state.
*   **Amadou**:
    *   Connect "Job List" to mocked API data.
    *   Refactor CSS for perfect mapping with backend data types.
*   **Miguel**:
    *   Design "Watchlist Creation" Modal/Form.
    *   Design "Watchlist Management" Table.

### Sprint 5: Authentication & API Integration (Weeks 9-10)
*Goal: User Accounts and connecting Front to Back.*

#### Week 9: Backend Auth & optimization
*   **Fares (Project Lead)**:
    *   Implement Auth API (`/login`, `/register`, `/me`).
    *   Implement JWT Token generation and verification.
    *   Secure `POST /watchlists` endpoints.
*   **Danielle**:
    *   Optimize Ingestion Performance (Bulk Inserts).
    *   Setup Retries policy for failed scrapes.

#### Week 10: Frontend Integration
*   **Ruth (Front Lead)**:
    *   **Integration**: Connect Home/Search to Real Backend (`GET /jobs`).
    *   Handle API Error states (Network error, Server error).
*   **Amadou**:
    *   **Integration**: Connect Job Details to Real Backend.
    *   Implement "Related Jobs" logic on frontend (if API supports).
*   **Miguel**:
    *   **Integration**: Connect Login/Register to Real Backend.
    *   Implement Global Auth Context (Store JWT, handle Logout).

### Sprint 6: Watchlists & Notifications (Weeks 11-12)
*Goal: The "Intelligent" part - Email Alerts.*

#### Week 11: Backend Features
*   **Fares (Project Lead)**:
    *   Implement `Watchlist` CRUD API.
    *   Implement "Notification Engine" (Cron task: Match new jobs vs Watchlists).
    *   Setup Email Sending Service (SMTP/SendGrid).
*   **Danielle**:
    *   Assist Fares with "Matching Algorithm" for alerts.
    *   Finalize documentation for Scrapers.

#### Week 12: Frontend Polish
*   **Ruth (Front Lead)**:
    *   Final User Testing & UI Polish (Animations, Transitions).
    *   Accessibility Audit (A11y).
*   **Amadou**:
    *   Cross-browser testing (Chrome, Firefox, Edge).
    *   Fix layout bugs on Tablets.
*   **Miguel**:
    *   Integrate "Create Watchlist" to Real Backend.
    *   Display "My Alerts" in User Dashboard.

### Sprint 7: Deployment & Final Delivery (Weeks 13-14)
*Goal: Production Deploy and Documentation.*

#### Week 13: Backend DevOps & Data
*   **Fares (Project Lead)**:
    *   Configure Production Docker Images (Optimized).
    *   Deploy Backend & DB to Render/VPS.
    *   Setup Domain & SSL.
*   **Danielle**:
    *   Seed Production Database.
    *   Write Technical Report Section (Ingestion Strategy).

#### Week 14: Frontend Deploy & Documentation
*   **Ruth (Front Lead)**:
    *   Deploy Frontend to Vercel/Netlify.
    *   Write User Manual (Screenshots).
*   **Amadou**:
    *   Verify all links and external redirects.
    *   Presentation Slides Preparation (Frontend demo).
*   **Miguel**:
    *   Write Technical Report Section (User Features).
    *   Presentation Slides Preparation (User flow).
