# Setup Supabase para moon-social-scheduler

Este archivo documenta la migración de Redis/BullMQ a Supabase-only.

## Pasos

### 1. Conectar Supabase

```bash
# Si tienes Supabase CLI
supabase link --project-ref tu-project-ref

# O copia tu connection string al .env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.tu-project-ref.supabase.co:5432/postgres
```

### 2. Habilitar pg_cron

Desde Supabase Dashboard:
- Database → Extensions
- Habilita `pg_cron`

### 3. Ejecutar migrations

```bash
# Usando Supabase CLI
supabase db push

# O ejecuta el SQL manualmente desde Dashboard → SQL Editor
# Copia el contenido de supabase/migrations/001_publish_cron.sql
```

### 3.1 Crear bucket de media

Necesitas un bucket `media` en Supabase Storage con soporte para imágenes, GIFs y vídeo.

Puedes crearlo por SQL:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5368709120,
  array['image/*', 'video/*', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
```

### 4. Desplegar Edge Function

```bash
# Instalar Supabase CLI si no lo tienes
brew install supabase/tap/supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref tu-project-ref

# Desplegar la función
supabase functions deploy publish
```

### 5. Configurar el cron job

Ejecuta el SQL de `supabase/migrations/001_publish_cron.sql` en el SQL Editor de Supabase, reemplazando:
- `https://tu-project.supabase.co` → tu URL real
- `current_setting('app.service_role_key')` → o usa tu service_role_key directo

## Cambios en el código

### Eliminados:
- `bullmq` y `ioredis` dependencies
- `src/lib/queue/` directory (BullMQ worker)
- `REDIS_URL` y `WORKER_CONCURRENCY` env vars

### Reemplazados por:
- `supabase/functions/publish/index.ts` — Edge Function worker
- pg_cron — Scheduler

### Archivos modificados:
- API routes que usaban `enqueuePublishJob` → ahora crean `PublishJob` en DB directamente
- El cron llama la Edge Function cada 2 minutos

## Flujo nuevo

1. Usuario crea/schedule post → API crea `Post` + `PublishJob` en DB
2. pg_cron llama Edge Function cada 2 min
3. Edge Function busca jobs con `runAt <= now` y `status = WAITING`
4. Ejecuta `publishPostJob()` (misma lógica que antes)
5. Actualiza status en DB

## Testing

```bash
# Ver logs de Edge Function
supabase functions logs publish --tail

# Verificar cron job
SELECT * FROM cron.job;

# Test manual de la Edge Function
curl -X POST https://tu-project.supabase.co/functions/v1/publish \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## 6. Brand Agent y conectores (migración 006)

Ejecuta `supabase/migrations/006_brand_agent_connectors.sql` en SQL Editor.

Crea tablas:
- `BrandProfile`
- `ConnectorCredential`
- `GeneratedAsset`
- `AgentRun`

## 7. Crons adicionales (Vercel)

Además del publish cron en Supabase, Vercel ejecuta (ver `vercel.json`):

| Endpoint | Función |
|----------|---------|
| `/api/cron/poll-videos` | Completar videos HeyGen/Fliki |
| `/api/cron/sync-analytics` | Ingesta métricas IG/TikTok |
| `/api/cron/refresh-tokens` | Renovar OAuth |
| `/api/cron/renewal-reminders` | Emails Stripe |

Requiere `CRON_SECRET` en Vercel. Probar:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://tu-app.vercel.app/api/cron/poll-videos
```

Documentación: `docs/DEPLOYMENT.md`
