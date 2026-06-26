# MoOn Social Scheduler

Social media scheduler con Next.js 16, Prisma, y Supabase. La primera versión conecta Instagram y TikTok mediante adapters directos de API.

## Stack

- Next.js 16 App Router, React 19, Tailwind CSS, shadcn/ui
- Zustand para estado del composer
- TanStack Query para data fetching
- Prisma 7 + Supabase PostgreSQL
- **Supabase Edge Functions + pg_cron** para publicación programada (reemplaza BullMQ/Redis)
- Local media storage bajo `public/uploads/`

## Arquitectura de Publicación

Sin Redis/BullMQ — usando Supabase Edge Functions + pg_cron:

1. Usuario programa post → API crea `Post`, `PostVersion`, `PostTarget`, `PublishJob` en DB
2. **pg_cron** ejecuta Edge Function cada 2 minutos
3. Edge Function busca jobs con `runAt <= now` y `status = WAITING`
4. Ejecuta publicación via platform adapters
5. Actualiza status en DB

Ver `SUPABASE_SETUP.md` para configurar el cron job y desplegar la Edge Function.

## First Milestone Flow

1. Conectar Instagram o TikTok desde `/dashboard/accounts`
2. Subir/seleccionar media desde `/dashboard/media`
3. Crear post en `/dashboard/compose`
4. Programarlo o publicar ahora
5. Verificar en `/dashboard/calendar` y `/dashboard/queue`

## Local Development

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

PostgreSQL debe correr (local o Supabase). No necesitas Redis — el publishing está en Supabase.

## Docker

```bash
docker compose up --build
```

La app corre en `http://localhost:3000`. Redis y worker eliminados — ahora usa Supabase.

## Deployment a Vercel

1. Conecta tu repo de GitHub a Vercel
2. Configura environment variables (ver `.env.example`)
3. **Importante**: Despliega la Edge Function de Supabase primero (ver `SUPABASE_SETUP.md`)
4. Deploy automático en cada push a main

## Platform Credentials

Instagram:
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- Redirect URL: `http://localhost:3000/api/accounts/instagram/callback`
- Scopes: `instagram_business_basic`, `instagram_business_content_publish`

TikTok:
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- Redirect URL: `http://localhost:3000/api/accounts/tiktok/callback`
- Scopes: `user.info.basic`, `video.publish`, `video.upload`

## Architecture Notes

Cada plataforma vive en `src/lib/platforms/<platform>/` con módulos separados de OAuth, API client, formatting, publishing y metrics. El código compartido solo usa la interfaz `PlatformAdapter` de `src/lib/platforms/types.ts`.
