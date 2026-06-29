"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const curlExample = `curl -X POST https://app.postall.app/api/v1/posts \\
  -H "Authorization: Bearer pk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hola desde mi agente",
    "scheduledAt": "2026-07-01T10:00:00Z",
    "targetAccountIds": ["<accountId>"],
    "mediaAssetIds": []
  }'`

const mcpConfig = `{
  "mcpServers": {
    "postall": {
      "url": "https://app.postall.app/api/mcp",
      "headers": { "Authorization": "Bearer pk_live_..." }
    }
  }
}`

const mcpTools = [
  "list_accounts",
  "upload_media",
  "schedule_post",
  "publish_now",
  "get_post_status",
  "get_analytics",
  "run_brand_agent",
  "revise_content_plan",
  "get_brand_profile",
  "update_brand_profile",
  "generate_image",
  "generate_video",
]

export function OpenClawGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conecta tu OpenClaw en 2 minutos</CardTitle>
        <CardDescription>
          Postall expone API REST y servidor MCP autenticados con tu API key. Cualquier
          agente compatible (OpenClaw, Claude Desktop) puede publicar y orquestar campañas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold">1. API REST</h3>
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs">
            <code>{curlExample}</code>
          </pre>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">2. Servidor MCP</h3>
          <p className="mb-2 text-sm text-muted-foreground">
            Tools disponibles:
          </p>
          <ul className="mb-3 grid gap-1 text-xs sm:grid-cols-2">
            {mcpTools.map((tool) => (
              <li key={tool}>
                <code>{tool}</code>
              </li>
            ))}
          </ul>
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs">
            <code>{mcpConfig}</code>
          </pre>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Brand Agent vía MCP</p>
          <p className="mt-1">
            Usa <code>run_brand_agent</code> con brief + horizonWeeks (4|12). HeyGen e
            imágenes requieren conectores configurados en el dashboard. Videos async se
            completan con el cron poll-videos.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          API y MCP requieren plan Agent. Genera una key arriba y úsala como Bearer.
          Documentación: <code>docs/API_AND_MCP.md</code>
        </p>
      </CardContent>
    </Card>
  )
}
