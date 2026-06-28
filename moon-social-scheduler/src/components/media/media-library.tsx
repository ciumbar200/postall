"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { useMediaAssets } from "@/hooks/use-dashboard-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MediaPreview } from "@/components/shared/media-preview"
import { StatusBadge } from "@/components/shared/status-badge"

async function uploadMedia(file: File) {
  const formData = new FormData()
  formData.set("file", file)

  const response = await fetch("/api/media", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? "Upload failed")
  }

  return response.json()
}

export function MediaLibrary() {
  const queryClient = useQueryClient()
  const { data: assets = [] } = useMediaAssets()
  const [file, setFile] = React.useState<File | null>(null)
  const localPreviewUrl = React.useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  )

  React.useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
    }
  }, [localPreviewUrl])

  const mutation = useMutation({
    mutationFn: uploadMedia,
    onSuccess: async (data: { asset: (typeof assets)[number] }) => {
      toast.success("Media uploaded")
      setFile(null)
      queryClient.setQueryData<{ assets: typeof assets }>(["media"], (current) => ({
        assets: [
          data.asset,
          ...(current?.assets ?? []).filter((asset) => asset.id !== data.asset.id),
        ],
      }))
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Upload failed"),
  })

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>Images, GIFs and video for reuse in posts.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="mediaFile">File</FieldLabel>
              <Input
                id="mediaFile"
                type="file"
                accept="image/*,video/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </Field>
            {localPreviewUrl ? (
              <MediaPreview
                publicUrl={localPreviewUrl}
                type={file?.type.startsWith("video/") ? "VIDEO" : "IMAGE"}
                mimeType={file?.type}
                alt={file?.name ?? "Selected file"}
                className="aspect-video w-full rounded-md border bg-background"
              />
            ) : null}
            <Button
              disabled={!file || mutation.isPending}
              onClick={() => file && mutation.mutate(file)}
            >
              <UploadIcon data-icon="inline-start" />
              Upload
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Library</CardTitle>
          <CardDescription>Organize and reuse media across scheduled posts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <div key={asset.id} className="rounded-lg border bg-muted/20 p-3">
                <MediaPreview
                  publicUrl={asset.publicUrl}
                  type={asset.type}
                  mimeType={asset.mimeType}
                  alt={asset.fileName}
                  className="aspect-video w-full rounded-md bg-background"
                />
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{asset.fileName}</div>
                    <div className="text-xs text-muted-foreground">{asset.mimeType}</div>
                  </div>
                  <StatusBadge status={asset.type} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
