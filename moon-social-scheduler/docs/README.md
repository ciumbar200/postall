# Postall — Documentación

Índice de guías para desplegar y operar el SaaS.

| Documento | Descripción |
|-----------|-------------|
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Setup local, env vars, primer login |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel + Supabase producción |
| [BRAND_AGENT.md](./BRAND_AGENT.md) | Agente de marca, planificación, revisión |
| [CONNECTORS.md](./CONNECTORS.md) | HeyGen, Canva, OpenAI Images, Fliki |
| [API_AND_MCP.md](./API_AND_MCP.md) | REST v1, MCP, OpenClaw |

Documentación de infraestructura Supabase: [`../SUPABASE_SETUP.md`](../SUPABASE_SETUP.md)

## Visión del producto

**Postall orquesta, no compite con Canva.**

- Conecta herramientas creativas (HeyGen, Canva, DALL-E)
- Planifica campañas de 4–12 semanas con IA
- Publica en redes vía adapters
- Ajusta estrategia según analytics
- Expone MCP para agentes (OpenClaw, Claude Code)

## Planes

| Plan | Precio orientativo | Highlights |
|------|-------------------|------------|
| Free | 0€ | 3 canales, calendario |
| Creator | 9€ | Analytics, aprobaciones |
| Agent | 19€ | API, MCP, Brand Agent, conectores |
| Agency | 39€ | White-label, clientes |

Ver `src/lib/billing/plans.ts` para límites exactos.

## Migraciones SQL (orden)

1. `001_publish_cron.sql`
2. `002_storage_and_seed.sql`
3. `003_rls.sql`
4. `004_billing_apikeys_notifications.sql`
5. `005_agency_labels_webhooks.sql`
6. `006_brand_agent_connectors.sql`

Ejecutar en Supabase SQL Editor o `supabase db push`.

## Crons (Vercel)

| Ruta | Schedule | Función |
|------|----------|---------|
| `/api/cron/refresh-tokens` | 06:00 UTC | Renovar OAuth |
| `/api/cron/renewal-reminders` | 09:00 UTC | Emails renovación |
| `/api/cron/poll-videos` | 07:00 UTC | Completar HeyGen/Fliki |
| `/api/cron/sync-analytics` | 08:00 UTC | Ingesta métricas |

Requiere `CRON_SECRET` en env y header `Authorization: Bearer $CRON_SECRET`.
