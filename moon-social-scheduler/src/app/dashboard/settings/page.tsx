import { SettingsPanel } from "@/components/shared/settings-panel"
import { LabelsManager } from "@/components/labels/labels-manager"
import { WebhooksManager } from "@/components/webhooks/webhooks-manager"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Integraciones, IA y preferencias del workspace.
        </p>
      </div>
      <SettingsPanel />
      <LabelsManager />
      <WebhooksManager />
    </div>
  )
}
