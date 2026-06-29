import { Suspense } from "react"
import { ConnectorsManager } from "@/components/connectors/connectors-manager"
import { Loader2Icon } from "lucide-react"

function ConnectorsFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2Icon className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default function ConnectorsPage() {
  return (
    <Suspense fallback={<ConnectorsFallback />}>
      <ConnectorsManager />
    </Suspense>
  )
}
