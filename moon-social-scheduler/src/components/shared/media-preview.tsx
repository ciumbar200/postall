"use client"

import * as React from "react"
import { FilmIcon, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type MediaPreviewProps = {
  publicUrl?: string | null
  type?: string
  mimeType?: string
  alt?: string
  className?: string
  fallbackClassName?: string
}

export function MediaPreview({
  publicUrl,
  type,
  mimeType,
  alt = "Media preview",
  className,
  fallbackClassName,
}: MediaPreviewProps) {
  const [failed, setFailed] = React.useState(false)
  const isVideo = type === "VIDEO" || mimeType?.startsWith("video/")

  React.useEffect(() => {
    setFailed(false)
  }, [publicUrl])

  if (!publicUrl || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName,
          className
        )}
      >
        {isVideo ? <FilmIcon className="size-5" /> : <ImageIcon className="size-5" />}
      </div>
    )
  }

  if (isVideo) {
    return (
      <video
        src={publicUrl}
        className={cn("object-cover", className)}
        muted
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <img
      src={publicUrl}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  )
}
