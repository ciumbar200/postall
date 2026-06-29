# Postall

SaaS de programación y publicación social con Next.js 16, Prisma y Supabase. Multi-tenant, con autenticación real (Supabase Auth), facturación transparente (Stripe), refresco proactivo de tokens, alertas de fallo y una API REST + servidor MCP "agent-friendly" para que cualquier instancia de OpenClaw lo use.

> Esta es la app canónica de Postall. `moon-social-lite` queda como landing/demo y no forma parte del producto.

## Documentación

| Guía | Contenido |
|------|-----------|
| [**docs/README.md**](./docs/README.md) | Índice completo |
| [GETTING_STARTED](./docs/GETTING_STARTED.md) | Setup local y env vars |
| [DEPLOYMENT](./docs/DEPLOYMENT.md) | Vercel + Supabase |
| [BRAND_AGENT](./docs/BRAND_AGENT.md) | Agente de marca |
| [CONNECTORS](./docs/CONNECTORS.md) | HeyGen, Canva, OpenAI |
| [API_AND_MCP](./docs/API_AND_MCP.md) | REST v1 + MCP |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Edge Function + pg_cron |

## Stack

- Next.js 16 App Router, React 19, Tailwind CSS, shadcn/ui
- Zustand para estado del composer
- TanStack Query para data fetching
- Prisma 7 + Supabase PostgreSQL
- **Supabase Edge Functions + pg_cron** para publicación programada (reemplaza BullMQ/Redis)
- **Supabase Storage** para imágenes, GIFs y vídeo hasta 5GB

## Arquitectura de Publicación

Sin Redis/BullMQ — usando Supabase Edge Functions + pg_cron:

1. Usuario programa post → API crea `Post`, `PostVersion`, `PostTarget`, `PublishJob` en DB
2. **pg_cron** ejecuta Edge Function cada 2 minutos
3. Edge Function busca jobs con `runAt <= now` y `status = WAITING`
4. Ejecuta publicación via platform adapters
5. Actualiza status en DB
6. Media se persiste en bucket `media` de Supabase cuando existen `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

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
Si configuras Supabase Storage, la subida de vídeo deja de depender del filesystem local.

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

Variables adicionales para media:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (default `media`)

## Brand Agent (orquestador IA)

Postall **no reemplaza Canva ni HeyGen** — los conecta:

1. Define tu marca en `/dashboard/agent` (perfil de voz, tono, pilares)
2. Conecta conectores en `/dashboard/connectors` (HeyGen API key, OpenAI para imágenes, Canva OAuth)
3. Genera campañas de 4–12 semanas; el agente crea captions, dispara HeyGen/imagen y deja borradores programados
4. Videos HeyGen son async: cron `/api/cron/poll-videos` completa el media y lo adjunta al post
5. `POST /api/agent/revise` analiza métricas y propone cambios de estrategia

Prueba HeyGen directo: `HEYGEN_API_KEY=xxx node scripts/test-heygen.mjs`

Migración Supabase: `supabase/migrations/006_brand_agent_connectors.sql`

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
