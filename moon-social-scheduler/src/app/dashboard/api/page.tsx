import { ApiKeysManager } from "@/components/api/api-keys-manager"
import { OpenClawGuide } from "@/components/api/openclaw-guide"

export const metadata = {
  title: "API & Agentes · Postall",
}

export default function ApiPage() {
  return (
    <div className="flex flex-col gap-6">
      <ApiKeysManager />
      <OpenClawGuide />
    </div>
  )
}
