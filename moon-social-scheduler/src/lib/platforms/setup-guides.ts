import type { PlatformSlug } from "@/lib/platforms/types"

export type SetupLink = {
  label: string
  href: string
}

export type SetupStep = {
  title: string
  detail: string
}

export type PlatformFieldLabels = {
  clientId: string
  clientSecret: string
  clientIdPlaceholder: string
  clientSecretPlaceholder: string
}

export type PlatformSetupGuide = {
  slug: PlatformSlug
  name: string
  authType: "oauth" | "token"
  summary: string
  devConsoleLinks: SetupLink[]
  fieldLabels?: PlatformFieldLabels
  steps: SetupStep[]
  notes: string[]
  requiresAppReview?: boolean
}

export const platformSetupGuides: Record<PlatformSlug, PlatformSetupGuide> = {
  instagram: {
    slug: "instagram",
    name: "Instagram",
    authType: "oauth",
    summary: "Cuenta Business o Creator con Instagram Login (API oficial de Meta).",
    devConsoleLinks: [
      { label: "Meta for Developers — Apps", href: "https://developers.facebook.com/apps/" },
      {
        label: "Documentación Instagram API",
        href: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login",
      },
    ],
    fieldLabels: {
      clientId: "App ID",
      clientSecret: "App Secret",
      clientIdPlaceholder: "1234567890123456",
      clientSecretPlaceholder: "a1b2c3d4e5f6...",
    },
    steps: [
      {
        title: "Crea una app en Meta",
        detail:
          "Entra en Meta for Developers → Create App → tipo Business. Añade el producto «Instagram» con «API setup with Instagram login».",
      },
      {
        title: "Configura OAuth redirect",
        detail:
          "En Instagram → Set up business login, añade la URL de callback de Postall (la verás abajo en esta pantalla).",
      },
      {
        title: "Credenciales propias (Agency)",
        detail:
          "Si usas tu propia app de Meta, pega el App ID y App Secret en el formulario de abajo. Si no, pulsa Conectar directamente.",
      },
      {
        title: "Cuenta de prueba",
        detail:
          "Usa una cuenta Instagram Business/Creator vinculada a una Page de Facebook. En modo desarrollo puedes añadir testers en Roles de la app.",
      },
    ],
    notes: [
      "Scopes necesarios: instagram_business_basic, instagram_business_content_publish.",
      "Sin app en modo Live, solo publican cuentas añadidas como testers.",
    ],
  },
  tiktok: {
    slug: "tiktok",
    name: "TikTok",
    authType: "oauth",
    summary: "Content Posting API — requiere app en TikTok for Developers.",
    devConsoleLinks: [
      { label: "TikTok for Developers", href: "https://developers.tiktok.com/" },
      {
        label: "Content Posting API",
        href: "https://developers.tiktok.com/doc/content-posting-api-get-started",
      },
    ],
    fieldLabels: {
      clientId: "Client Key",
      clientSecret: "Client Secret",
      clientIdPlaceholder: "awxxxxxxxxxxxx",
      clientSecretPlaceholder: "xxxxxxxxxxxxxxxx",
    },
    steps: [
      {
        title: "Registra tu app",
        detail: "developers.tiktok.com → Manage apps → Connect an app. Solicita acceso a Content Posting API.",
      },
      {
        title: "Redirect URI",
        detail: "Añade la callback URL de Postall en Login Kit → Redirect URI.",
      },
      {
        title: "Credenciales propias (Agency)",
        detail:
          "Opcional: pega Client Key y Client Secret abajo. Si Postall ya está configurado, solo pulsa Conectar.",
      },
      {
        title: "Modo sandbox",
        detail:
          "Hasta la auditoría de TikTok, los posts van en SELF_ONLY (solo tú los ves). Usa una cuenta tester autorizada.",
      },
    ],
    notes: [
      "El access token de TikTok caduca ~24h; Postall lo renueva automáticamente si hay refresh token.",
    ],
    requiresAppReview: true,
  },
  linkedin: {
    slug: "linkedin",
    name: "LinkedIn",
    authType: "oauth",
    summary: "Publicación en perfil o página de empresa vía LinkedIn API.",
    devConsoleLinks: [
      { label: "LinkedIn Developers", href: "https://www.linkedin.com/developers/apps" },
      {
        label: "Share on LinkedIn",
        href: "https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin",
      },
    ],
    fieldLabels: {
      clientId: "Client ID",
      clientSecret: "Client Secret",
      clientIdPlaceholder: "86xxxxxxxxxx",
      clientSecretPlaceholder: "WPLxxxxxxxxxx",
    },
    steps: [
      {
        title: "Crea una app",
        detail: "LinkedIn Developers → Create app → asocia una Page de empresa si publicas como organización.",
      },
      {
        title: "OAuth redirect",
        detail: "Auth → Authorized redirect URLs → pega la callback de Postall.",
      },
      {
        title: "Productos",
        detail: "Solicita «Share on LinkedIn» y «Sign In with LinkedIn using OpenID Connect».",
      },
      {
        title: "Credenciales propias (Agency)",
        detail: "Pega Client ID y Client Secret abajo, o conecta con la app de Postall.",
      },
    ],
    notes: ["En desarrollo, solo miembros de la app pueden autorizar la conexión."],
  },
  facebook: {
    slug: "facebook",
    name: "Facebook Pages",
    authType: "oauth",
    summary: "Publicación en páinas de Facebook (no perfil personal).",
    devConsoleLinks: [
      { label: "Meta for Developers", href: "https://developers.facebook.com/apps/" },
      {
        label: "Pages API",
        href: "https://developers.facebook.com/docs/pages-api",
      },
    ],
    fieldLabels: {
      clientId: "App ID",
      clientSecret: "App Secret",
      clientIdPlaceholder: "1234567890123456",
      clientSecretPlaceholder: "a1b2c3d4e5f6...",
    },
    steps: [
      {
        title: "App Meta Business",
        detail: "Create App → Business. Añade producto Facebook Login for Business.",
      },
      {
        title: "Redirect URI",
        detail: "Facebook Login → Valid OAuth Redirect URIs → callback de Postall.",
      },
      {
        title: "Permisos",
        detail: "pages_manage_posts, pages_read_engagement. Asigna la Page como tester si la app no está Live.",
      },
      {
        title: "Credenciales propias (Agency)",
        detail: "Pega App ID y App Secret abajo, o conecta con la app de Postall.",
      },
    ],
    notes: ["Necesitas ser admin de la Page que quieres conectar."],
  },
  youtube: {
    slug: "youtube",
    name: "YouTube",
    authType: "oauth",
    summary: "Subida de vídeos vía YouTube Data API v3 (Google Cloud).",
    devConsoleLinks: [
      {
        label: "Google Cloud Console",
        href: "https://console.cloud.google.com/apis/credentials",
      },
      {
        label: "YouTube Data API",
        href: "https://developers.google.com/youtube/v3",
      },
    ],
    fieldLabels: {
      clientId: "Client ID",
      clientSecret: "Client Secret",
      clientIdPlaceholder: "123456789-abc.apps.googleusercontent.com",
      clientSecretPlaceholder: "GOCSPX-xxxxxxxx",
    },
    steps: [
      {
        title: "Proyecto Google Cloud",
        detail: "Crea proyecto → habilita YouTube Data API v3.",
      },
      {
        title: "OAuth client",
        detail: "Credentials → Create OAuth client ID → Web application.",
      },
      {
        title: "Redirect URI",
        detail: "Authorized redirect URIs → callback de Postall. En local usa http://localhost:3000/...",
      },
      {
        title: "Credenciales propias (Agency)",
        detail: "Pega Client ID y Client Secret abajo, o conecta con la app de Postall.",
      },
    ],
    notes: [
      "Modo Testing: solo usuarios añadidos como Test users en OAuth consent screen pueden conectar.",
      "El token de acceso caduca ~1h; Postall intenta refrescarlo automáticamente.",
    ],
  },
  threads: {
    slug: "threads",
    name: "Threads",
    authType: "oauth",
    summary: "Threads API vía app de Meta (misma consola que Instagram/Facebook).",
    devConsoleLinks: [
      { label: "Meta for Developers", href: "https://developers.facebook.com/apps/" },
      {
        label: "Threads API",
        href: "https://developers.facebook.com/docs/threads",
      },
    ],
    fieldLabels: {
      clientId: "App ID",
      clientSecret: "App Secret",
      clientIdPlaceholder: "1234567890123456",
      clientSecretPlaceholder: "a1b2c3d4e5f6...",
    },
    steps: [
      {
        title: "App Meta con Threads",
        detail: "En tu app Meta, añade el producto Threads API.",
      },
      {
        title: "OAuth redirect",
        detail: "Configura la callback URL de Postall en la sección Threads.",
      },
      {
        title: "Credenciales propias (Agency)",
        detail: "Pega App ID y App Secret abajo, o conecta con la app de Postall.",
      },
    ],
    notes: ["Requiere cuenta Threads vinculada a Instagram Business."],
  },
  bluesky: {
    slug: "bluesky",
    name: "Bluesky",
    authType: "token",
    summary: "Conexión con handle + contraseña de aplicación (sin OAuth).",
    devConsoleLinks: [
      { label: "Bluesky — App passwords", href: "https://bsky.app/settings/app-passwords" },
      { label: "AT Protocol docs", href: "https://docs.bsky.app/" },
    ],
    steps: [
      {
        title: "Contraseña de aplicación",
        detail:
          "En bsky.app → Settings → App passwords → Add App Password. Copia el código generado (solo se muestra una vez).",
      },
      {
        title: "Conectar en Postall",
        detail:
          "Usa el formulario «Conectar con token» abajo: tu handle (ej. usuario.bsky.social) y la app password.",
      },
    ],
    notes: ["No compartas la app password; revócala desde Bluesky si la filtras."],
  },
  telegram: {
    slug: "telegram",
    name: "Telegram",
    authType: "token",
    summary: "Bot de Telegram + ID del canal o grupo.",
    devConsoleLinks: [
      { label: "BotFather (@BotFather)", href: "https://t.me/BotFather" },
      {
        label: "Telegram Bot API",
        href: "https://core.telegram.org/bots/api",
      },
    ],
    steps: [
      {
        title: "Crea un bot",
        detail: "Abre @BotFather en Telegram → /newbot → copia el token HTTP API.",
      },
      {
        title: "Canal o grupo",
        detail:
          "Añade el bot como admin del canal. Obtén el chat_id (ej. @micanal o -1001234567890).",
      },
      {
        title: "Conectar en Postall",
        detail: "Formulario «Conectar con token»: pega el bot token y el chat ID.",
      },
    ],
    notes: ["El bot debe tener permiso de publicar en el canal."],
  },
}
