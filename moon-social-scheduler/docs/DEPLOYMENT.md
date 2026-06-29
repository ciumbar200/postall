# Deployment — Vercel + Supabase

## Checklist producción

- [ ] Proyecto Supabase creado
- [ ] Migraciones 001–006 aplicadas
- [ ] Edge Function `publish` desplegada
- [ ] pg_cron configurado (publicación)
- [ ] Bucket `media` en Storage
- [ ] Proyecto Vercel conectado a GitHub
- [ ] Env vars en Vercel (Production + Preview)
- [ ] Stripe webhook apuntando a `/api/stripe/webhook`
- [ ] Dominio custom (opcional)

## Vercel

1. Import repo → root directory: `moon-social-scheduler`
2. Framework: Next.js (auto)
3. Build: `npm run build` (postinstall genera Prisma client)
4. Añadir variables de `.env.example`

### Pooler (importante)

En serverless usa el pooler de Supabase:

```env
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Supabase

### Migraciones

SQL Editor → ejecutar cada archivo en `supabase/migrations/` en orden.

### Edge Function

```bash
supabase link --project-ref tu-ref
supabase functions deploy publish
```

Ver `SUPABASE_SETUP.md` para pg_cron.

### Storage

Bucket `media`, público, límite 5GB, mime `image/*`, `video/*`.

## Crons Vercel

Definidos en `vercel.json`. En Hobby plan hay límite de frecuencia — los jobs están en horarios diarios distintos.

Probar manualmente:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://tu-app.vercel.app/api/cron/poll-videos
```

## Post-deploy

1. Crear usuario en `/signup`
2. Verificar login Supabase
3. Conectar una red social de prueba
4. Conectar HeyGen en Conectores
5. Generar campaña de prueba en Brand Agent
6. Verificar Stripe checkout en Billing

## Self-host

Postall es open source (MIT). Puedes self-hostear con Docker Compose (PostgreSQL local) + cron externo llamando los endpoints `/api/cron/*`.

Cloud Postall = conveniencia (auth, storage, crons, soporte).
