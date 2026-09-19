# CreatorSync

A full-stack social media scheduling tool for content creators. Plan, schedule, and publish posts across YouTube, Instagram, TikTok, and Twitter — powered by an AI assistant (OpenAI GPT).

---

## Features

- **Authentication** — Email + password login with JWT tokens
- **Content Calendar** — Visual month/week/day calendar of scheduled posts
- **Post CRUD** — Create, edit, delete posts with title, content, media URL, status, and scheduling
- **Multi-platform Publishing** — Publish to Twitter, Instagram, YouTube, and TikTok via OAuth 2.0
- **AI Assistant** — Generate content ideas, captions, and hashtags with OpenAI GPT-4o-mini
- **Background Scheduler** — APScheduler fires publish jobs automatically at the scheduled time
- **Responsive UI** — Works on desktop and mobile

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| HTTP Client | Axios |
| Calendar UI | react-big-calendar |
| Backend | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.x |
| Database | SQLite |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| AI | OpenAI Python SDK (gpt-4o-mini) |
| Scheduler | APScheduler |
| Platform OAuth | Authlib |

---

## Project Structure

```
creator_sync/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   ├── services/
│   ├── publishers/
│   ├── middleware/
│   ├── utils/
│   └── tests/
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── utils/
```

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- An [OpenAI API key](https://platform.openai.com/api-keys) (for AI features)

---

## Install Dependencies

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

---

## Configure Environment Variables

### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
# Generate a real secret:  python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your_secret_key_here

# Generate a Fernet key:  python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_KEY=your_fernet_key_here

OPENAI_API_KEY=sk-...          # Required for AI features
DATABASE_URL=sqlite:///./creator_sync.db
FRONTEND_URL=http://localhost:5173
ENV=development

# Optional — needed for real platform publishing
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=
```

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

---

## Run the Application

### Backend (Terminal 1)

```bash
cd backend
# Activate venv first (see above)
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

---

## Run Tests

### Backend

```bash
cd backend
pytest -v
```

### Frontend

```bash
cd frontend
npm test
```

---

## API Overview

| Method | Path | Description |
|---|---|---|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login, returns JWT |
| GET | /auth/me | Current user profile |
| GET | /posts | List user's posts |
| POST | /posts | Create post |
| GET | /posts/{id} | Get post |
| PUT | /posts/{id} | Update post |
| DELETE | /posts/{id} | Delete post |
| POST | /posts/{id}/publish-now | Publish immediately |
| GET | /platforms/status | Platform connection status |
| GET | /platforms/{name}/connect | Start OAuth flow |
| DELETE | /platforms/{name}/disconnect | Remove platform token |
| POST | /ai/ideas | Generate content ideas |
| POST | /ai/caption | Generate a caption |
| POST | /ai/hashtags | Generate hashtags |

---

## Deploy to Render

### Backend

1. Create a **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo
3. Set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add a **Persistent Disk** mounted at `/data`
7. Set environment variables in the Render dashboard (see `.env.example`)

### Frontend

1. Create a **Static Site** on Render
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Set `VITE_API_URL` to your backend Render URL

---

## Known Limitations

1. **Render free tier sleep:** APScheduler runs in-process. If the service sleeps due to inactivity, scheduled jobs will not fire until the next request wakes the service.
2. **SQLite concurrency:** SQLite is single-writer. For multi-instance deployments, migrate to PostgreSQL.
3. **TikTok API approval:** TikTok's Content Posting API requires developer application approval. Without it, the TikTok publisher returns an error.
4. **Instagram requirement:** Instagram Graph API only supports Business/Creator accounts, not personal accounts.
5. **Media uploads:** `media_url` expects a publicly hosted URL. Direct file upload from the browser is out of scope.
6. **Token encryption:** The `FERNET_KEY` must be stored permanently. Losing it renders all stored OAuth tokens unreadable.

---

## Security Notes

- Passwords are bcrypt-hashed; never stored in plaintext
- JWTs are signed with `SECRET_KEY` — keep it secret
- OAuth tokens are Fernet-encrypted at rest
- All post mutations verify user ownership
- CORS is restricted to `FRONTEND_URL`
- AI endpoints are rate-limited to 15 requests/minute/user
