# API REST v1 y MCP

## API Keys

Generar en `/dashboard/api` (plan Agent).

Formato: `pk_live_...` / `pk_test_...`

Header: `Authorization: Bearer pk_live_...`

## REST v1

Base: `/api/v1`

| Endpoint | Scope | Descripción |
|----------|-------|-------------|
| `GET /accounts` | accounts:read | Cuentas conectadas |
| `GET /posts` | posts:read | Listar posts |
| `POST /posts` | posts:write | Crear/programar |
| `GET /posts/:id` | posts:read | Detalle |
| `GET /analytics` | analytics:read | Métricas agregadas |
| `POST /media` | media:write | Registrar media |

## MCP Server

URL: `https://tu-app/api/mcp`

Mismo Bearer token que API key.

### Tools de publicación

- `list_accounts`
- `upload_media`
- `schedule_post`
- `publish_now`
- `get_post_status`
- `get_analytics`

### Tools Brand Agent (Agent plan)

- `run_brand_agent` — brief → campaña + drafts
- `revise_content_plan` — analytics → recomendaciones
- `get_brand_profile` / `update_brand_profile`
- `generate_image` — IMAGE_GEN
- `generate_video` — HeyGen async

## OpenClaw / Claude Desktop

```json
{
  "mcpServers": {
    "postall": {
      "url": "https://tu-app.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer pk_live_..."
      }
    }
  }
}
```

## Webhooks salientes (Agent)

`POST /api/webhooks` — eventos `post.published`, `post.failed`, etc.

Firma HMAC: header `Postall-Signature`.

## Ejemplo: campaña desde agente

```bash
curl -X POST https://tu-app/api/mcp \
  -H "Authorization: Bearer pk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "run_brand_agent",
      "arguments": {
        "brief": "Q3 content plan for sustainable fashion brand",
        "horizonWeeks": 4,
        "platforms": ["INSTAGRAM", "TIKTOK"]
      }
    }
  }'
```

(Formato exacto depende del cliente MCP; en OpenClaw se configura el servidor y se invocan tools por nombre.)
