# Conectores creativos

Postall integra herramientas externas vía el patrón `ContentConnector` (`src/lib/connectors/`).

## Conectores disponibles

| Conector | Tipo | Auth | Capacidad |
|----------|------|------|-----------|
| IMAGE_GEN | OpenAI | API key | Imagen |
| HEYGEN | HeyGen | API key | Video avatar |
| CANVA | Canva Connect | OAuth | Diseño PNG |
| FLIKI | Fliki | API key | Video/voice |

## Configuración

### UI

`/dashboard/connectors` — plan **Agent** requerido.

### Env (fallback servidor)

Si el usuario no guarda key en UI, el servidor puede usar:

- `HEYGEN_API_KEY` → HEYGEN
- `OPENAI_API_KEY` → IMAGE_GEN
- `FLIKI_API_KEY` → FLIKI

Canva siempre requiere OAuth por usuario/workspace.

## HeyGen

```env
HEYGEN_API_KEY=
HEYGEN_DEFAULT_AVATAR_ID=   # recomendado
HEYGEN_DEFAULT_VOICE_ID=    # recomendado
```

API v2: `POST https://api.heygen.com/v2/video/generate`

Test:

```bash
node scripts/test-heygen.mjs "Tu script aquí"
```

## Canva

```env
CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=
CANVA_REDIRECT_URI=https://tu-app.vercel.app/api/connectors/canva/callback
CANVA_DEFAULT_TEMPLATE=     # template ID para autofill
```

Redirect URI debe coincidir en canva.dev.

Flujo: `/api/connectors/canva/connect` → OAuth → callback guarda tokens cifrados.

## OpenAI Images

Usa `OPENAI_IMAGE_MODEL` (default `dall-e-3`). Respuesta base64 → subida a Storage.

## API

### `GET /api/connectors`

Lista conectores + `configured` + guía de setup.

### `PUT /api/connectors/{connector}`

```json
{ "apiKey": "..." }
```

### `POST /api/connectors/{connector}/generate`

Discriminated union:

```json
{ "type": "image", "prompt": "...", "aspectRatio": "9:16" }
{ "type": "video", "script": "...", "avatarId": "...", "voiceId": "..." }
{ "type": "design", "title": "...", "body": ["..."], "templateId": "..." }
```

## Seguridad

- Credenciales cifradas con `CONNECTOR_ENCRYPTION_KEY` (AES-256-GCM)
- En dev sin clave, se almacenan en JSON plano (solo local)
- RLS habilitado en tablas (defense in depth)

## Añadir un conector

1. Implementar `ContentConnector` en `src/lib/connectors/{name}/`
2. Registrar en `registry.ts`
3. Añadir enum en Prisma `ConnectorType` + migración
4. Añadir guía en `setup-guides.ts`
