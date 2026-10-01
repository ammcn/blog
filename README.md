# blog

Resume-styled personal site with a blog. Django + DRF serve the resume content
(edited in the admin); blog posts are MDX files committed to the repo.

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

Sign in at http://localhost:5173/secret-login (not linked from the UI) with a Django
user from `createsuperuser`. The nav then shows **Write** and each post gets an
**edit** link. Fill in the title, date, tags, and body (Markdown with live preview) and hit Save. That
writes `frontend/src/posts/<slug>.mdx`; each post in the blog list has an
**edit** link. Commit the file to publish. Tick **Draft** to keep it out of
production builds.

The editor and its `/__posts` endpoint exist only in `npm run dev`, and the
endpoint checks the Django session before touching disk. You can
also just create the file by hand:

```mdx
---
title: My post
date: 2026-10-01
excerpt: One line shown in the list.
tags: [thing, other]
draft: true
---

Body in Markdown (GFM + syntax-highlighted code). React components allowed.
```

## Deploying

**Frontend → Vercel.** Set the project root to `frontend/`. `vercel.json`
rewrites `/api/*` to the backend and everything else to `index.html`; replace
`REPLACE-WITH-BACKEND-HOST` with the API's hostname. Drafts are stripped from
production builds. Commit `public/photo.jpg` for the photo and OG image.

**Backend → any Docker host** (Render, Railway, Fly, …) using `backend/Dockerfile`.
It runs migrations on boot and serves with gunicorn and whitenoise. Required env
vars are listed in `backend/.env.example`: `SECRET_KEY`, `ALLOWED_HOSTS`,
`DATABASE_URL` (Postgres), `NUM_PROXIES=1`, and `FRONTEND_ORIGINS` only if the
frontend calls the API cross-origin instead of via the Vercel rewrite. With
`DEBUG` off, cookies are secure-only and HSTS is on.

After the first deploy: `python manage.py createsuperuser` on the host, then
enter the resume at `https://<api-host>/admin/`.

## API

- `GET /api/resume/` — profile (with `socials`), experience, education, proficiencies
- `GET /api/auth/me/`, `POST /api/auth/login/`, `POST /api/auth/logout/` — session auth
- `GET /api/likes/?slugs=a,b` — heart counts; `POST /api/likes/<slug>/toggle/` toggles the caller's heart. Both read an anonymous `X-Client-Id` header the frontend keeps in localStorage.
