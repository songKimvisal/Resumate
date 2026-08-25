# Resumate Backend

FastAPI backend for Resumate. Currently just verifies Supabase auth end to end.

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

   - `SUPABASE_URL`: Supabase Dashboard > Project Settings > API > Project URL
   - `SUPABASE_JWT_SECRET`: Supabase Dashboard > Project Settings > API > JWT Settings > JWT Secret
   - `FRONTEND_ORIGIN`: your Vite dev server URL (default `http://localhost:5173`)

3. Run the server:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. Check it's alive: open http://localhost:8000/api/health - should return `{"status": "ok"}`.

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
    me.py               GET /api/me (test endpoint)
  services/             (empty for now - Gemini client goes here next)
```

## Next steps

- Add a `resumes` router that reads/writes the `resumes` table via Supabase's
  Python client, scoped to `get_current_user().id`.
- Add `services/gemini_client.py` + `routers/ai_design.py` for the AI Design
  suggestions feature.
