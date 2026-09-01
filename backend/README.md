# Resumate Backend

FastAPI backend for Resumate: auth, smart rewrite, AI design, and writing credits.

For a plain-language guide to the credits update (what to set up once, why the service role key is needed, how the countdown works), see [docs/AI_CREDITS.md](../docs/AI_CREDITS.md).

## Setup

1. Create a virtual environment and install dependencies:

   ```bash
   python -m venv venv
   venv\Scripts\activate        # Windows
   # source venv/bin/activate   # macOS/Linux
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase values:

   ```bash
   copy .env.example .env        # Windows
   # cp .env.example .env        # macOS/Linux
   ```

   - `SUPABASE_URL`: Project Settings > API > Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Project Settings > API > service_role (secret). Used only on the server to grant and spend credits. Never put this in the frontend.
   - `FRONTEND_ORIGIN`: your Vite dev server URL (default `http://localhost:5173`)
   - `GEMINI_API_KEY`: Gemini API key for smart rewrite / AI design

3. Apply the credits migration (`frontend/supabase/migrations/20260826120000_create_ai_credits.sql`) in the Supabase SQL editor, or with the Supabase CLI. Also apply later entitlement migrations (`pdf_saves`, templates, `job_journeys`, and `job_analyses`).

4. Run the server:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Check it's alive: open http://localhost:8000/api/health - should return `{"status": "ok"}`.

## Credits and analyses

Writing credits live in `ai_credits`. Job-analysis quota lives in `job_analyses`. The frontend never writes them.

- `GET /api/credits` — Smart Rewrite total / used / remaining
- `POST /api/credits/grant` — `{ "pack_id": "ai-plus" }` after a purchase
- `POST /api/smart-rewrite` — spends 1 writing credit first; refunds it if the AI falls back
- `GET /api/analyses` — job-analysis quota (interview + skill-gap included)
- `POST /api/analyses/grant` — `{ "pack_id": "ai-plus" }` adds 1 / 3 / 5 analyses by pack
- `POST /api/job-analysis` — spends 1 analysis quota, not a writing credit; refunds on fallback

## Testing the authenticated endpoint

`GET /api/me` requires a Supabase access token. From your frontend (browser console,
while logged in):

```js
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);
```

Then:

```bash
curl http://localhost:8000/api/me -H "Authorization: Bearer <paste token here>"
```

You should get back `{"id": "...", "email": "..."}` matching your logged-in user.

## Project layout

```
app/
  main.py              FastAPI app + CORS setup
  config.py            Settings loaded from .env
  auth/
    supabase_jwt.py     Verifies Supabase JWTs, provides get_current_user()
  routers/
    me.py               GET /api/me
    credits.py          GET /api/credits, POST /api/credits/grant
    smart_rewrite.py    POST /api/smart-rewrite (consumes a credit)
    ai_design.py        POST /api/ai-design/recommend
  services/
    credits.py          Grant / consume / refund via Supabase RPCs
```
