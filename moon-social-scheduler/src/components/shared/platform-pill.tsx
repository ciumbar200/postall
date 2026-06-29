import { Badge } from "@/components/ui/badge"
import type { Platform } from "@/lib/domain/enums"
import { platformMeta } from "@/lib/ui/platforms"

export function PlatformPill({ platform }: { platform: Platform }) {
  const meta = platformMeta[platform]

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.name}
    </Badge>
  )
}
