import { Badge } from "@/components/ui/badge"

const toneByStatus: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CONNECTED: "default",
  SCHEDULED: "secondary",
  QUEUED: "secondary",
  WAITING: "secondary",
  ACTIVE: "secondary",
  PUBLISHED: "default",
  COMPLETED: "default",
  FAILED: "destructive",
  ERROR: "destructive",
  EXPIRED: "outline",
  DRAFT: "outline",
  RETRYING: "outline",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={toneByStatus[status] ?? "outline"}>
      {status.toLowerCase().replaceAll("_", " ")}
    </Badge>
  )
}
