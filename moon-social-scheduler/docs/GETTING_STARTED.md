# Getting Started — Postall

## Para quién es esta guía

| Rol | Qué configura |
|-----|----------------|
| **Operador** (despliega Postall en Vercel/self-host) | `.env` del servidor: DB, Stripe, CRON, IA por defecto, apps OAuth compartidas |
| **Usuario final** (cliente del SaaS) | Solo el dashboard: Accounts, Conectores, Brand Agent — sin tocar `.env` |

---

## Operador: setup en 5 minutos

```bash
cd moon-social-scheduler
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate   # o aplicar SQL en Supabase
npm run dev
```

Abre http://localhost:3000

Aplica también `supabase/migrations/007_workspace_integrations.sql` para credenciales por workspace (BYOK Agency).

## Variables del operador (servidor)

### Obligatorias

```env
DATABASE_URL=postgresql://...
CREDENTIAL_ENCRYPTION_KEY=   # 64 hex chars en producción
```

Generar clave de cifrado:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Auth (recomendado)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### IA incluida por defecto (todos los usuarios)

Los usuarios Free/Creator/Agent usan estas claves sin configurar nada:

```env
AI_PROVIDER=openrouter
AI_MODEL=deepseek/deepseek-chat-v3-0324
OPENROUTER_API_KEY=sk-or-...
```

### Apps OAuth compartidas Postall (hosted default)

Configura una vez; los usuarios solo pulsan «Conectar» en Accounts:

```env
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
# ... resto de redes en .env.example
```

### Conectores opcionales (fallback global)

Los usuarios Agent pueden pegar sus propias API keys en `/dashboard/connectors`. Estas vars son fallback si el operador quiere ofrecerlas incluidas:

```env
HEYGEN_API_KEY=
HEYGEN_DEFAULT_AVATAR_ID=
HEYGEN_DEFAULT_VOICE_ID=
OPENAI_API_KEY=
CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=
```

### Cron y Stripe

Ver `.env.example` para `CRON_SECRET`, `STRIPE_*`.

---

## Usuario final: primer recorrido

1. **Accounts** → `/dashboard/accounts` — conectar Instagram/TikTok con un clic
2. **Conectores** → `/dashboard/connectors` — pegar API keys de HeyGen, OpenAI Images, etc. (plan Agent)
3. **Brand Agent** → `/dashboard/agent` — perfil de marca + campaña
4. **Compose** → revisar borradores y programar
5. **Ajustes** → `/dashboard/settings` — hub de integraciones e IA

### Plan Agency (BYOK)

En Accounts y Ajustes → IA, los workspaces Agency pueden pegar **sus propias** credenciales OAuth (Client ID/Secret) y API keys de IA, sin depender de las apps compartidas de Postall.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Red «Próximamente» en Accounts | El operador debe configurar las apps OAuth compartidas en el servidor |
| Brand Agent 403 | Plan Agent en billing |
| Video stuck PENDING | Cron poll-videos o schedule Vercel |
| `/api/integrations/*` 500 | Migración `007_workspace_integrations.sql` |
| `/api/connectors` 500 | Migración `006_brand_agent_connectors.sql` |
| Prisma migrate falla | SQL en `supabase/migrations/` |
