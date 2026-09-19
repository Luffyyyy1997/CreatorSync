# CreatorSync — Implementation Plan

## Top-Level Overview

**Goal:** Build a full-stack web application called CreatorSync where social media content creators can plan, schedule, and publish posts across YouTube, Instagram, TikTok, and Twitter, supported by an AI assistant (OpenAI API) for content ideas, captions, and hashtags.

**Scope:**
- User registration and login (email + password, JWT authentication)
- Content calendar — create, edit, delete, and view scheduled posts
- Multi-platform publishing — actually POST to YouTube/Instagram/TikTok/Twitter via their APIs using OAuth 2.0 per platform
- AI assistant — content idea suggestions, caption generator, hashtag recommender (OpenAI GPT API)
- SQLite database via SQLAlchemy ORM
- FastAPI backend (Python), React + Vite frontend
- Deployable to Render or Railway (free tier)

**Non-goals (out of scope for this build):**
- Analytics dashboards
- Team/collaboration features
- Paid subscription billing
- Mobile native apps

**Architecture at a glance:**
```
React (Vite)  <-->  FastAPI  <-->  SQLite (SQLAlchemy)
                      |
                 OpenAI API
                      |
    YouTube / Instagram / TikTok / Twitter APIs
```

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Popular, fast dev server, easy component model |
| Styling | Tailwind CSS | Utility-first, fast to build clean UI |
| State mgmt | React Context + useState | Simple enough for this scale; no Redux needed |
| HTTP client | Axios | Clean API, interceptors for JWT headers |
| Calendar UI | react-big-calendar | Drop-in calendar with month/week/day views |
| Backend | FastAPI (Python 3.11+) | Async, auto-generates OpenAPI docs, beginner-friendly |
| ORM | SQLAlchemy 2.x (sync) | Maps Python classes to SQLite tables |
| DB | SQLite | Zero config, file-based, perfect for single-server deploy |
| Auth | python-jose (JWT) + passlib (bcrypt) | Standard JWT pattern, well documented |
| Social OAuth | Authlib | Handles OAuth 2.0 flows for all four platforms |
| AI | OpenAI Python SDK (gpt-4o-mini) | Cheap, fast, good quality for text generation |
| Scheduler | APScheduler | In-process job scheduler to fire publish jobs at scheduled time |
| Deployment | Render (backend) + Render Static Sites (frontend) | Free tier, GitHub-connected |

---

## Project Folder Structure

```
creator_sync/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Settings (env vars, secrets)
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models/
│   │   ├── user.py              # User ORM model
│   │   ├── post.py              # Post ORM model
│   │   └── platform_token.py   # OAuth tokens per platform per user
│   ├── schemas/
│   │   ├── user.py              # Pydantic schemas for user
│   │   ├── post.py              # Pydantic schemas for post
│   │   └── ai.py                # Pydantic schemas for AI requests/responses
│   ├── routers/
│   │   ├── auth.py              # /auth/register, /auth/login, /auth/me
│   │   ├── posts.py             # /posts CRUD
│   │   ├── platforms.py         # /platforms/connect, /platforms/callback
│   │   └── ai.py                # /ai/ideas, /ai/caption, /ai/hashtags
│   ├── services/
│   │   ├── auth_service.py      # Password hashing, JWT creation/verification
│   │   ├── post_service.py      # Business logic for posts
│   │   ├── publish_service.py   # Dispatches posts to platform APIs
│   │   ├── ai_service.py        # OpenAI prompts and response parsing
│   │   └── scheduler_service.py # APScheduler setup and job management
│   ├── publishers/
│   │   ├── base_publisher.py    # Abstract base class
│   │   ├── twitter_publisher.py
│   │   ├── instagram_publisher.py
│   │   ├── youtube_publisher.py
│   │   └── tiktok_publisher.py
│   ├── middleware/
│   │   └── auth_middleware.py   # JWT dependency for protected routes
│   ├── utils/
│   │   └── errors.py            # Custom exception classes
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_posts.py
│   │   ├── test_ai.py
│   │   └── test_publish.py
│   ├── requirements.txt
│   ├── .env.example
│   └── render.yaml              # Render deploy config
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx             # React entry point
        ├── App.jsx              # Router setup
        ├── api/
        │   ├── axiosClient.js   # Axios instance + JWT interceptor
        │   ├── authApi.js
        │   ├── postsApi.js
        │   ├── platformsApi.js
        │   └── aiApi.js
        ├── context/
        │   └── AuthContext.jsx  # Global auth state
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── CalendarPage.jsx
        │   ├── NewPostPage.jsx
        │   ├── EditPostPage.jsx
        │   ├── ConnectPlatformsPage.jsx
        │   └── AiAssistantPage.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── PostCard.jsx
        │   ├── PostForm.jsx
        │   ├── PlatformBadge.jsx
        │   ├── AiSuggestionPanel.jsx
        │   └── LoadingSpinner.jsx
        └── utils/
            └── validators.js    # Frontend input validation helpers
```

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| id | Integer PK | Auto-increment |
| email | String | Unique, indexed |
| hashed_password | String | bcrypt hash |
| display_name | String | |
| created_at | DateTime | UTC |

### Post
| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| user_id | FK → User | |
| title | String | Internal label |
| content | Text | The post body/caption |
| media_url | String | Optional image/video URL |
| platforms | JSON | List: ["twitter","instagram",...] |
| scheduled_at | DateTime | UTC when to publish |
| status | Enum | draft / scheduled / published / failed |
| created_at | DateTime | |
| updated_at | DateTime | |

### PlatformToken
| Field | Type | Notes |
|---|---|---|
| id | Integer PK | |
| user_id | FK → User | |
| platform | String | twitter / instagram / youtube / tiktok |
| access_token | Text | Encrypted at rest |
| refresh_token | Text | Encrypted at rest |
| expires_at | DateTime | For refresh logic |

---

## API Structure

### Auth routes — `/auth`
| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Create new user account |
| POST | /auth/login | Returns JWT access token |
| GET | /auth/me | Returns current user profile |

### Post routes — `/posts`
| Method | Path | Description |
|---|---|---|
| GET | /posts | List all posts for current user |
| POST | /posts | Create new post |
| GET | /posts/{id} | Get single post |
| PUT | /posts/{id} | Update post |
| DELETE | /posts/{id} | Delete post |
| POST | /posts/{id}/publish-now | Immediately publish a post |

### Platform OAuth routes — `/platforms`
| Method | Path | Description |
|---|---|---|
| GET | /platforms/status | Which platforms are connected for current user |
| GET | /platforms/{name}/connect | Redirect to platform OAuth consent |
| GET | /platforms/{name}/callback | OAuth callback, saves token |
| DELETE | /platforms/{name}/disconnect | Revoke and delete stored token |

### AI routes — `/ai`
| Method | Path | Description |
|---|---|---|
| POST | /ai/ideas | Generate content ideas given a topic |
| POST | /ai/caption | Generate a caption given a topic and platform |
| POST | /ai/hashtags | Generate hashtag list given a topic and platform |

---

## Authentication Approach

- Users register with email + password; password is hashed with bcrypt (passlib).
- On login, the backend returns a signed JWT (HS256) with `user_id` and `exp` (24h expiry).
- The JWT is stored in `localStorage` on the frontend (acceptable for a student project; production would use httpOnly cookies).
- All protected API routes use a FastAPI `Depends(get_current_user)` dependency that validates the JWT from the `Authorization: Bearer <token>` header.
- Social platform OAuth tokens are stored in the `PlatformToken` table, encrypted with `cryptography.fernet` using a secret key from the environment.

---

## AI Integration Approach

- A single `ai_service.py` module wraps the OpenAI Python SDK.
- Three functions: `generate_ideas(topic, platform)`, `generate_caption(topic, platform)`, `generate_hashtags(topic, platform)`.
- Each function constructs a specific system + user prompt and calls `gpt-4o-mini` (cheap, fast).
- Responses are parsed and returned as structured JSON.
- The frontend's `AiAssistantPage` and `PostForm` both call these endpoints and let the user copy/insert the suggestions.

---

## Publishing Approach

- Each platform publisher (`twitter_publisher.py`, etc.) extends `BasePublisher` and implements a `publish(post, token)` method.
- `publish_service.py` looks up which platforms a post targets, retrieves the stored OAuth tokens, and calls the correct publisher for each.
- APScheduler runs in the background inside the FastAPI process. On startup, it loads all `scheduled` posts from the DB whose `scheduled_at` is in the future and registers jobs.
- When a job fires, it calls `publish_service.publish_post(post_id)` which publishes and then updates `post.status` to `published` or `failed`.

---

## Classes and Responsibilities

| Class / Module | File | Responsibility |
|---|---|---|
| `AuthService` | `services/auth_service.py` | Hash passwords, create/verify JWTs |
| `PostService` | `services/post_service.py` | CRUD operations for posts, ownership checks |
| `PublishService` | `services/publish_service.py` | Orchestrate publishing to platforms |
| `AiService` | `services/ai_service.py` | All OpenAI API calls |
| `SchedulerService` | `services/scheduler_service.py` | APScheduler lifecycle, register/cancel jobs |
| `BasePublisher` | `publishers/base_publisher.py` | Abstract interface: `publish(post, token)` |
| `TwitterPublisher` | `publishers/twitter_publisher.py` | Calls Twitter v2 API |
| `InstagramPublisher` | `publishers/instagram_publisher.py` | Calls Instagram Graph API |
| `YouTubePublisher` | `publishers/youtube_publisher.py` | Calls YouTube Data API v3 |
| `TikTokPublisher` | `publishers/tiktok_publisher.py` | Calls TikTok Content Posting API |
| `AuthContext` | `context/AuthContext.jsx` | Holds user, token, login/logout actions in React |
| `axiosClient` | `api/axiosClient.js` | Axios instance that attaches JWT to every request |

---

## Main Functions

| Function | Location | What it does |
|---|---|---|
| `register_user(email, password, display_name)` | `auth_service.py` | Validates uniqueness, hashes password, inserts User row |
| `login_user(email, password)` | `auth_service.py` | Verifies password, returns signed JWT |
| `get_current_user(token)` | `auth_middleware.py` | FastAPI dependency; decodes JWT, returns User |
| `create_post(user_id, data)` | `post_service.py` | Inserts Post, schedules job if `scheduled_at` is set |
| `update_post(post_id, data)` | `post_service.py` | Updates Post, reschedules job |
| `delete_post(post_id)` | `post_service.py` | Deletes Post, cancels scheduled job |
| `publish_post(post_id)` | `publish_service.py` | Dispatches to all target platform publishers |
| `generate_ideas(topic, platform)` | `ai_service.py` | Returns list of content idea strings |
| `generate_caption(topic, platform)` | `ai_service.py` | Returns a caption string |
| `generate_hashtags(topic, platform)` | `ai_service.py` | Returns list of hashtag strings |
| `schedule_job(post)` | `scheduler_service.py` | Registers APScheduler job at `post.scheduled_at` |
| `cancel_job(post_id)` | `scheduler_service.py` | Removes APScheduler job for a post |

---

## Data Flow

### Create + Schedule a Post
```
User fills PostForm (React)
  → POST /posts (Axios, JWT header)
    → posts router → PostService.create_post()
      → Insert Post row (status=scheduled)
      → SchedulerService.schedule_job(post)
    → Return Post JSON → React updates calendar
```

### Publish at Scheduled Time
```
APScheduler fires job at scheduled_at
  → PublishService.publish_post(post_id)
    → Load Post + PlatformTokens from DB
    → For each platform in post.platforms:
        Publisher.publish(post, token)
          → Call platform API
    → Update post.status = "published" or "failed"
```

### AI Caption Generation
```
User clicks "Generate Caption" in PostForm
  → POST /ai/caption { topic, platform }
    → AiService.generate_caption()
      → OpenAI API call
    → Return { caption: "..." }
  → React inserts caption into PostForm content field
```

---

## Validation

### Backend (Pydantic schemas)
- `email` — valid email format (EmailStr)
- `password` — minimum 8 characters
- `scheduled_at` — must be a future datetime
- `platforms` — list must contain only known platform names
- `content` — required, max 2200 chars (Instagram limit)
- All IDs verified against ownership before any mutation

### Frontend (validators.js)
- Email format check before submit
- Password length before submit
- Scheduled date must be in the future
- At least one platform must be selected
- Content field not empty

---

## Error Handling

### Backend
- FastAPI `HTTPException` raised with descriptive messages and correct HTTP status codes
- Custom exception classes in `utils/errors.py`: `PostNotFoundError`, `UnauthorizedError`, `PublishError`, `PlatformTokenMissingError`
- Global exception handler middleware catches unexpected errors and returns `500` with a safe message (no stack traces in production)
- Publishing failures set `post.status = "failed"` and store the error message; they do NOT crash the scheduler

### Frontend
- Axios response interceptor catches `401` → clears token → redirects to login
- All API calls wrapped in try/catch; errors shown in inline UI error messages (no raw JSON shown to users)
- Loading states shown during async operations with `LoadingSpinner`

---

## Security Considerations

1. Passwords stored as bcrypt hashes only — never plaintext
2. JWT signed with a secret key from environment variable (never hardcoded)
3. OAuth tokens encrypted with Fernet before storing in DB
4. All post mutations verify `post.user_id == current_user.id` (ownership check)
5. CORS configured to allow only the frontend's origin
6. `.env` files excluded from git via `.gitignore`
7. `platform` API keys/secrets stored only in environment variables
8. `Content-Security-Policy` header added for production build
9. Rate-limit the `/ai/*` endpoints to prevent OpenAI cost abuse (simple in-memory counter per user)

---

## Testing Strategy

- **Backend:** pytest + httpx `TestClient`
  - Unit tests for service functions (mock DB and external APIs)
  - Integration tests for each router using an in-memory SQLite test DB
  - Tests for JWT creation/verification
  - Tests for publish flow with mocked publisher classes
- **Frontend:** Vitest + React Testing Library
  - Unit tests for `validators.js`
  - Component tests for `PostForm`, `AiSuggestionPanel`
  - Mock Axios in tests using `msw` (Mock Service Worker)
- **Manual E2E:** Test full flow in browser against a running dev server before each phase completion

---

## Deployment Approach

### Backend (Render Web Service)
- `render.yaml` defines the service: build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables set in Render dashboard (JWT secret, OpenAI key, platform API keys)
- SQLite DB stored as a persistent disk mounted at `/data/creator_sync.db` (Render supports persistent disk)

### Frontend (Render Static Site)
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable `VITE_API_URL` set to the backend Render URL

### CI
- GitHub Actions workflow runs pytest and vitest on every push to `main`

---

## Implementation Phases

---

### Phase 1 — Project Setup
**Status:** [ ] pending

**What will be built:**
- Backend Python project with FastAPI, SQLAlchemy, dependencies installed
- Frontend React + Vite project with Tailwind CSS configured
- SQLite database created and ORM models defined
- `.env.example` files for both sides
- Git repository initialized with `.gitignore`

**Files created:**
- `backend/requirements.txt`
- `backend/main.py` (bare FastAPI app)
- `backend/config.py`
- `backend/database.py`
- `backend/models/user.py`
- `backend/models/post.py`
- `backend/models/platform_token.py`
- `backend/.env.example`
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/tailwind.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx` (placeholder)
- `frontend/.env.example`
- `.gitignore`

**Why needed:** Without this skeleton, nothing else can be built. Gets the dev environment running.

**How tested:** `uvicorn main:app` starts without error; `npm run dev` opens a blank React page.

---

### Phase 2 — Basic UI (Pages and Navigation)
**Status:** [ ] pending

**What will be built:**
- React Router setup with all page routes
- Navbar component
- Placeholder pages for all routes
- Login and Register page forms (UI only, not wired to API yet)
- Tailwind CSS base styling and color theme

**Files created/modified:**
- `frontend/src/App.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/RegisterPage.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/pages/CalendarPage.jsx`
- `frontend/src/pages/NewPostPage.jsx`
- `frontend/src/pages/EditPostPage.jsx`
- `frontend/src/pages/ConnectPlatformsPage.jsx`
- `frontend/src/pages/AiAssistantPage.jsx`

**Why needed:** Establishes the navigable shell of the app so all future features have a place to live.

**How tested:** Manually navigate all routes in browser; no broken links; Navbar links work.

---

### Phase 3 — Authentication (Backend + Frontend)
**Status:** [ ] pending

**What will be built:**
- Backend: User model, auth service (register, login, JWT), auth router
- Frontend: AuthContext, axiosClient with JWT interceptor, Login/Register pages wired to API, ProtectedRoute enforced

**Files created/modified:**
- `backend/models/user.py`
- `backend/schemas/user.py`
- `backend/services/auth_service.py`
- `backend/middleware/auth_middleware.py`
- `backend/routers/auth.py`
- `backend/utils/errors.py`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/api/axiosClient.js`
- `frontend/src/api/authApi.js`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/RegisterPage.jsx`
- `frontend/src/components/ProtectedRoute.jsx`

**Why needed:** Everything else is user-specific; auth must exist before building any protected feature.

**How tested:** Register a new user → login → JWT stored → protected page accessible → logout clears token → redirected to login.

---

### Phase 4 — Post CRUD (Backend + Frontend)
**Status:** [ ] pending

**What will be built:**
- Backend: Post model, post service (create/read/update/delete), posts router
- Frontend: PostForm component, PostCard component, NewPostPage, EditPostPage, DashboardPage listing posts

**Files created/modified:**
- `backend/models/post.py`
- `backend/schemas/post.py`
- `backend/services/post_service.py`
- `backend/routers/posts.py`
- `frontend/src/api/postsApi.js`
- `frontend/src/components/PostForm.jsx`
- `frontend/src/components/PostCard.jsx`
- `frontend/src/pages/NewPostPage.jsx`
- `frontend/src/pages/EditPostPage.jsx`
- `frontend/src/pages/DashboardPage.jsx`

**Why needed:** Core feature of the product — without posts there is nothing to schedule or publish.

**How tested:** Create post → appears in dashboard; Edit post → changes saved; Delete post → removed from list; Ownership enforced (user B cannot edit user A's post — verify via API).

---

### Phase 5 — Content Calendar
**Status:** [ ] pending

**What will be built:**
- CalendarPage using `react-big-calendar` showing scheduled posts
- Clicking a date opens the new post form pre-filled with that date
- Clicking an existing event opens the edit page

**Files created/modified:**
- `frontend/src/pages/CalendarPage.jsx`
- `frontend/src/api/postsApi.js` (add date-range filter query)
- `backend/routers/posts.py` (add `?from=&to=` query params)

**Why needed:** The calendar is the primary UX for a scheduling tool; users need to visualize their posting plan.

**How tested:** Schedule posts on different dates → calendar shows events correctly; click event → navigates to edit page.

---

### Phase 6 — Platform OAuth Connections
**Status:** [ ] pending

**What will be built:**
- Backend: PlatformToken model, platforms router (OAuth initiation + callback + disconnect)
- Frontend: ConnectPlatformsPage showing connection status per platform with Connect/Disconnect buttons
- Authlib OAuth clients for Twitter, Instagram, YouTube, TikTok

**Files created/modified:**
- `backend/models/platform_token.py`
- `backend/routers/platforms.py`
- `frontend/src/api/platformsApi.js`
- `frontend/src/pages/ConnectPlatformsPage.jsx`
- `frontend/src/components/PlatformBadge.jsx`

**Why needed:** Without connected platform accounts, publishing cannot happen.

**How tested:** Click "Connect Twitter" → OAuth consent screen → callback stores token → status shows "Connected"; Disconnect removes token.

---

### Phase 7 — Scheduling and Publishing Engine
**Status:** [ ] pending

**What will be built:**
- APScheduler integrated into FastAPI startup
- SchedulerService: loads existing scheduled posts on startup, registers jobs, cancels on delete/update
- Publisher classes for each platform
- PublishService orchestrates publishing
- "Publish Now" endpoint for immediate publishing

**Files created/modified:**
- `backend/services/scheduler_service.py`
- `backend/services/publish_service.py`
- `backend/publishers/base_publisher.py`
- `backend/publishers/twitter_publisher.py`
- `backend/publishers/instagram_publisher.py`
- `backend/publishers/youtube_publisher.py`
- `backend/publishers/tiktok_publisher.py`
- `backend/routers/posts.py` (add publish-now endpoint)
- `backend/main.py` (start/stop scheduler on lifespan events)

**Why needed:** This is what makes CreatorSync functional rather than just a note-taking app.

**How tested:** Schedule a post 2 minutes in the future → wait → post status changes to "published" in DB; post appears on the platform; failed publishes (bad token) set status to "failed" without crashing.

---

### Phase 8 — AI Assistant
**Status:** [ ] pending

**What will be built:**
- Backend: AiService with three OpenAI-powered functions, AI router
- Frontend: AiAssistantPage for standalone brainstorming, AiSuggestionPanel embedded in PostForm

**Files created/modified:**
- `backend/schemas/ai.py`
- `backend/services/ai_service.py`
- `backend/routers/ai.py`
- `frontend/src/api/aiApi.js`
- `frontend/src/pages/AiAssistantPage.jsx`
- `frontend/src/components/AiSuggestionPanel.jsx`
- `frontend/src/pages/NewPostPage.jsx` (embed panel)
- `frontend/src/pages/EditPostPage.jsx` (embed panel)

**Why needed:** AI features are a core differentiator of the product per requirements.

**How tested:** Enter a topic → receive ideas, caption, hashtags from OpenAI; click "Use This Caption" → fills PostForm content field; rate limiting prevents >10 requests per minute per user.

---

### Phase 9 — Validation and Error Handling
**Status:** [ ] pending

**What will be built:**
- All Pydantic validators wired up and returning meaningful error messages
- Frontend `validators.js` with all form validation rules
- Global error boundary in React
- Axios interceptor for 401 redirect
- Backend global exception handler returning safe 500 messages
- Publisher error isolation (failed platform doesn't affect others)

**Files created/modified:**
- `backend/utils/errors.py`
- `backend/main.py` (add exception handlers)
- `frontend/src/utils/validators.js`
- `frontend/src/App.jsx` (add error boundary)
- `frontend/src/api/axiosClient.js` (401 interceptor)
- All form components (add inline error display)

**Why needed:** Makes the app robust and user-friendly; prevents data corruption from bad inputs.

**How tested:** Submit empty forms → see field-level errors; submit past date → error shown; invalid JWT → redirected to login; publish with missing token → post marked failed, other platforms still attempted.

---

### Phase 10 — Testing
**Status:** [ ] pending

**What will be built:**
- pytest test suite for auth, posts, AI, and publish routes
- Vitest tests for validators and PostForm component
- GitHub Actions CI workflow

**Files created/modified:**
- `backend/tests/test_auth.py`
- `backend/tests/test_posts.py`
- `backend/tests/test_ai.py`
- `backend/tests/test_publish.py`
- `frontend/src/utils/validators.test.js`
- `frontend/src/components/PostForm.test.jsx`
- `.github/workflows/ci.yml`

**Why needed:** Catches regressions; required for professional-grade projects.

**How tested:** `pytest` passes all tests; `npm run test` passes all tests; GitHub Actions runs green on push.

---

### Phase 11 — UI Polish
**Status:** [ ] pending

**What will be built:**
- Consistent spacing, typography, and color palette across all pages
- LoadingSpinner shown during API calls
- Empty states for dashboard (no posts yet) and calendar
- Toast notifications for success/error actions (react-hot-toast)
- Platform icons for Twitter, Instagram, YouTube, TikTok
- Responsive layout (mobile-friendly)

**Files created/modified:**
- `frontend/src/components/LoadingSpinner.jsx`
- `frontend/src/components/Navbar.jsx` (responsive hamburger)
- All page files (spacing and empty state pass)
- `frontend/package.json` (add react-hot-toast)

**Why needed:** A polished UI increases usability and credibility; poor UX would undermine the product.

**How tested:** Manually review all pages on desktop and mobile viewport; test all toast messages; verify loading states appear during slow network (devtools throttling).

---

### Phase 12 — Final Review and Deployment
**Status:** [ ] pending

**What will be built:**
- `render.yaml` for backend deployment with persistent disk config
- Production environment variables documented
- Frontend `VITE_API_URL` pointing to Render backend
- CORS config updated for production domain
- Final smoke test on deployed URLs

**Files created/modified:**
- `backend/render.yaml`
- `frontend/.env.production`
- `backend/main.py` (production CORS origins)
- `README.md` (setup and deploy instructions)

**Why needed:** The app must be reachable on the internet for real use.

**How tested:** Deploy to Render → open production URL → register account → create post → verify end-to-end in production environment.

---

## Open Decisions / Notes for Implementation

1. **SQLite + APScheduler on Render:** Render free tier spins down after inactivity. Scheduled jobs will not fire while the service is sleeping. For a student project this is acceptable; note it in README.
2. **Token encryption key:** Must be generated once and stored permanently in the environment — losing it makes all stored tokens unreadable.
3. **TikTok API access:** TikTok's Content Posting API requires a developer application approval. If not approved, TikTok publisher will be a stub that logs a warning.
4. **Instagram publishing:** Instagram Graph API only supports posting to Business/Creator accounts. Document this requirement for users.
5. **Media uploads:** For this build, `media_url` stores a URL (e.g. a link to an image already hosted). Full file upload (multipart) is out of scope.
