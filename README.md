# Maccabi Workshops — Promotional Website Clone

Clone of [workshops.maccabi4u.co.il](https://workshops.maccabi4u.co.il/).

## Stack

| Layer | Technology |
|-------|-----------|
| Front-end | Next.js 14 (React, TypeScript, CSS Modules, SSR/ISR) |
| CMS | Strapi v4 (Node.js, REST API) |
| Database | PostgreSQL 15 |
| Local deploy | Docker Compose |

## Project Structure

```
maccabi-workshops/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/
│   │   └── lib/api.ts # Strapi REST client
│   └── public/images/ # Static assets (logos, icons, hero image)
├── cms/               # Strapi CMS
│   ├── src/api/
│   │   ├── category/  # Workshop category content type
│   │   └── workshop/  # Workshop content type
│   └── config/        # Strapi config (DB, middleware, CORS)
└── docker-compose.yml
```

## Quick Start (Docker)

```bash
# 1. Copy and edit environment variables
cp .env.example .env
# Edit .env — change secrets for production!

# 2. Start all services
docker compose up --build

# Services:
#   Strapi admin:  http://localhost:1337/admin
#   Frontend:      http://localhost:3000
```

On first start, create a Strapi admin account at http://localhost:1337/admin, then:

1. Go to **Settings → API Tokens → Create new token** (Full access)
2. Copy the token into your `.env` as `STRAPI_API_TOKEN`
3. Restart the frontend: `docker compose restart frontend`

## Seeding Content

In the Strapi admin panel, create **Categories** (Content Manager → Category):

| Name | Slug | Icon URL | Sort |
|------|------|----------|------|
| תזונה לחיים בריאים | nutrition | /images/icons/meal.svg | 1 |
| מפסיקים לעשן | quit-smoking | /images/icons/smoking.svg | 2 |
| קשר משפחתי | family | /images/icons/family.svg | 3 |
| לנהל את הסוכרת | diabetes | /images/icons/heart.svg | 4 |
| גיל שלישי | seniors | /images/icons/seniors.svg | 5 |

Then create **Workshops** under each category.

## Local Development (without Docker)

```bash
# Terminal 1 — PostgreSQL (or use SQLite by setting DATABASE_CLIENT=sqlite in .env)
# Terminal 2 — Strapi CMS
cd cms && npm install && npm run develop

# Terminal 3 — Next.js frontend
cd frontend && npm install && npm run dev
```

For SQLite (simpler local dev), add to your `.env`:
```
DATABASE_CLIENT=sqlite
```

## Design

- Hebrew RTL layout with Heebo font
- Color palette: Navy `#1E3C95`, Pink `#BE6090`, Light pink `#DFB6C0`
- Responsive — mobile-first with card layout
- SSR + ISR (60s revalidation) for SEO
- Fallback to static categories when CMS is offline
