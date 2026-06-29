import { ConnectorType } from "@/generated/prisma/enums"

export type ConnectorGuide = {
  type: ConnectorType
  title: string
  description: string
  authType: "api_key" | "oauth"
  docsUrl: string
  fields: Array<{
    key: string
    label: string
    placeholder: string
    type?: "password" | "text"
  }>
  steps: string[]
  testPayload?: Record<string, unknown>
}

export const connectorGuides: Record<ConnectorType, ConnectorGuide> = {
  IMAGE_GEN: {
    type: ConnectorType.IMAGE_GEN,
    title: "Generación de imágenes (OpenAI)",
    description: "DALL-E para thumbnails, posts estáticos y assets de campaña.",
    authType: "api_key",
    docsUrl: "https://platform.openai.com/docs/guides/images",
    fields: [
      {
        key: "apiKey",
        label: "API Key de OpenAI",
        placeholder: "sk-proj-...",
        type: "password",
      },
      {
        key: "imageModel",
        label: "Modelo de imagen",
        placeholder: "dall-e-3",
        type: "text",
      },
    ],
    steps: [
      "Crea una API key en platform.openai.com",
      "Pégala abajo y elige el modelo (por defecto dall-e-3)",
      "Pulsa Guardar y luego Probar generación",
    ],
    testPayload: {
      type: "image",
      prompt: "Minimal product photo, soft light, 1:1",
      aspectRatio: "1:1",
    },
  },
  HEYGEN: {
    type: ConnectorType.HEYGEN,
    title: "HeyGen (video con avatar)",
    description: "Videos con avatar para Reels, TikTok y LinkedIn. Generación async (~2–10 min).",
    authType: "api_key",
    docsUrl: "https://docs.heygen.com/reference/create-an-avatar-video-v2",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "hg_...",
        type: "password",
      },
      {
        key: "avatarId",
        label: "Avatar ID",
        placeholder: "avatar_xxxxxxxx",
        type: "text",
      },
      {
        key: "voiceId",
        label: "Voice ID",
        placeholder: "voice_xxxxxxxx",
        type: "text",
      },
    ],
    steps: [
      "Obtén tu API key en app.heygen.com → Settings → API",
      "Copia avatar_id y voice_id desde la consola HeyGen",
      "El cron poll-videos completa el render y adjunta el MP4 al post",
    ],
    testPayload: {
      type: "video",
      script: "Hola, este es un test de Postall con HeyGen.",
    },
  },
  CANVA: {
    type: ConnectorType.CANVA,
    title: "Canva Connect",
    description: "Diseños desde plantillas con Autofill + export PNG.",
    authType: "oauth",
    docsUrl: "https://www.canva.dev/docs/connect/",
    fields: [
      {
        key: "clientId",
        label: "Client ID (solo Agency)",
        placeholder: "OC-xxxxxxxx",
        type: "text",
      },
      {
        key: "clientSecret",
        label: "Client Secret (solo Agency)",
        placeholder: "cnvca...",
        type: "password",
      },
    ],
    steps: [
      "Registra una app en canva.dev → Your integrations",
      "Redirect URI: {APP_URL}/api/connectors/canva/callback",
      "Agency: pega Client ID y Secret abajo. Luego pulsa Conectar con Canva",
    ],
    testPayload: {
      type: "design",
      title: "Test Postall",
      body: ["Línea 1", "Línea 2"],
    },
  },
  FLIKI: {
    type: ConnectorType.FLIKI,
    title: "Fliki (text-to-video)",
    description: "Alternativa a HeyGen para voiceover y video corto.",
    authType: "api_key",
    docsUrl: "https://fliki.ai/api",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "fliki_...",
        type: "password",
      },
    ],
    steps: [
      "Obtén API key en tu cuenta Fliki",
      "Pégala abajo y pulsa Guardar",
    ],
    testPayload: { type: "video", script: "Test de voz Fliki desde Postall." },
  },
}

export function getConnectorGuide(type: ConnectorType) {
  return connectorGuides[type]
}
