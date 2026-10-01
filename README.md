# blog

Resume-styled personal site with a blog. Django + DRF serve the resume and the
blog posts; the React frontend renders them and includes a sign-in-gated editor.

## Run

```sh
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed            # placeholder content
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py runserver       # :8000

# frontend
cd frontend
npm install
npm run dev                                # :5173, proxies /api to :8000
```

If 8000 is busy, run `runserver 8765` and `API_URL=http://localhost:8765 npm run dev`.

Edit resume content at http://localhost:8000/admin/.

## Writing a post

Sign in at `/secret-login` (not linked from the UI) with a Django user from
`createsuperuser`. The nav then shows **Write**, and each post gets an **Edit**
link. Posts are Markdown (GFM, syntax-highlighted code) stored in the database,
so you can write and publish from the live site. Tick **Draft** to keep a post
visible only to you. The Django admin at `/admin/` can edit posts too.

## Deploying (Vercel)

One Vercel project runs both halves as [Services](https://vercel.com/docs/services):
`vercel.json` at the repo root declares `web` (Vite, `frontend/`) and `api`
(Django, `backend/`) and routes `/api`, `/admin`, and `/static` to Django and
everything else to the SPA. Both share one domain, so no CORS or cross-site cookies.

1. Import the repo into Vercel. Leave the root directory at the repo root.
2. Add a Postgres database from the Vercel marketplace (Neon's free tier works).
   It sets `DATABASE_URL`. Use the pooled connection string if offered.
3. Set `SECRET_KEY` (long and random) and `DEBUG=False` in project env vars.
   Set `ALLOWED_HOSTS` to your custom domain once you attach one; `*.vercel.app`
   is accepted automatically.
4. Deploy. The backend build runs migrations; Vercel runs `collectstatic` itself
   and serves the admin's assets from its CDN.
5. Create your login once, from your machine, against the production database:

   ```sh
   cd backend
   npx vercel env pull .env.local        # writes DATABASE_URL etc.
   set -a; source .env.local; set +a
   .venv/bin/python manage.py createsuperuser
   ```

   Then enter the resume at `https://<your-domain>/admin/`.

Commit `frontend/public/photo.jpg` for the photo and OG image. `backend/Dockerfile` remains for any Docker host.

## API

- `GET /api/resume/` — profile (with `socials`), experience, education, proficiencies
- `GET /api/blog/posts/`, `GET /api/blog/posts/<slug>/` — published posts; drafts included for a signed-in session. `POST`, `PATCH`, `DELETE` need a session.
- `GET /api/auth/me/`, `POST /api/auth/login/`, `POST /api/auth/logout/` — session auth
- `GET /api/likes/?slugs=a,b` — heart counts; `POST /api/likes/<slug>/toggle/` toggles the caller's heart. Both read an anonymous `X-Client-Id` header the frontend keeps in localStorage.
