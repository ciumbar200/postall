# Deploy Vercel + subdominio + OpenClaw

## 1. Deploy (ya en marcha)

Proyecto Vercel: **moon-social-scheduler**  
URL producción: https://moon-social-scheduler.vercel.app  
Repo: https://github.com/ciumbar200/postall  

Desde la carpeta de la app:

```bash
cd moon-social-scheduler
vercel --prod --yes
```

Si conectas GitHub en Vercel, **Root Directory** = `moon-social-scheduler` (monorepo).

> El código local tiene cambios sin push. Para que GitHub/OpenClaw vean lo último: commit + push a `main`.

---

## 2. Subdominio

1. Vercel → **moon-social-scheduler** → Settings → **Domains**
2. Añade p. ej. `app.tudominio.com`
3. En tu DNS: **CNAME** `app` → `cname.vercel-dns.com`
4. Actualiza env vars (Production):

```env
APP_URL=https://app.tudominio.com
NEXT_PUBLIC_APP_URL=https://app.tudominio.com
```

Redeploy después de cambiar URLs.

---

## 3. Env vars mínimas (Production)

Sin esto OpenClaw/MCP fallará:

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | PostgreSQL (pooler Supabase `:6543`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage / server |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | OAuth redirects |
| `CRON_SECRET` | Crons Vercel |
| `CREDENTIAL_ENCRYPTION_KEY` | Conectores (32 bytes hex) |
| `OPENROUTER_API_KEY` o `OPENAI_API_KEY` | Brand Agent / captions |

**No** uses `DEV_SKIP_DATABASE` en producción.

Migraciones SQL en Supabase: `001` → `007` (ver `supabase/migrations/`).

---

## 4. OpenClaw — conectar MCP

1. Despliega y entra en `/signup` → crea usuario
2. `/dashboard/api` → genera API key (`pk_live_...`, plan Agent en dev o billing)
3. Config OpenClaw / Claude Desktop:

```json
{
  "mcpServers": {
    "postall": {
      "url": "https://app.tudominio.com/api/mcp",
      "headers": {
        "Authorization": "Bearer pk_live_TU_KEY"
      }
    }
  }
}
```

4. Prueba rápida:

```bash
curl https://app.tudominio.com/api/health
curl -X POST https://app.tudominio.com/api/mcp \
  -H "Authorization: Bearer pk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Tools útiles: `list_accounts`, `schedule_post`, `run_brand_agent`, `generate_image`.

---

## 5. Qué darle a OpenClaw

- **Repo:** https://github.com/ciumbar200/postall  
- **MCP URL:** `https://TU-SUBDOMINIO/api/mcp`  
- **API key:** la de `/dashboard/api`  
- **Docs:** `moon-social-scheduler/docs/API_AND_MCP.md`

OpenClaw no necesita clonar para usar MCP; el repo sirve para contexto/skill.
