"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarClockIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"
import { Platform } from "@/lib/domain/enums"
import { useAccounts, useMediaAssets } from "@/hooks/use-dashboard-data"
import { mvpPlatforms, platformMeta } from "@/lib/ui/platforms"
import { useComposerStore } from "@/stores/composer-store"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MediaPreview } from "@/components/shared/media-preview"
import { PlatformPill } from "@/components/shared/platform-pill"
import { StatusBadge } from "@/components/shared/status-badge"

async function createPost(payload: Record<string, unknown>) {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? "Post creation failed.")
  }

  return response.json()
}

export function ComposerWorkspace() {
  const queryClient = useQueryClient()
  const accountsQuery = useAccounts()
  const mediaQuery = useMediaAssets()
  const accounts = accountsQuery.data ?? []
  const mediaAssets = mediaQuery.data ?? []
  const {
    baseText,
    scheduledAt,
    targetAccountIds,
    mediaAssetIds,
    versions,
    setBaseText,
    setScheduledAt,
    toggleTargetAccount,
    setMediaAssetIds,
    setPlatformText,
    setPlatformSetting,
    reset,
  } = useComposerStore()

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: async () => {
      toast.success("Post scheduled")
      reset()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posts"] }),
        queryClient.invalidateQueries({ queryKey: ["queue"] }),
      ])
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not schedule post")
    },
  })

  const selectedMedia = mediaAssets.filter((asset) =>
    mediaAssetIds.includes(asset.id)
  )

  function submit(publishNow: boolean) {
    const selectedPlatforms = new Set(
      accounts
        .filter((account) => targetAccountIds.includes(account.id))
        .map((account) => account.platform)
    )

    mutation.mutate({
      baseText,
      scheduledAt: publishNow ? null : new Date(scheduledAt).toISOString(),
      publishNow,
      targetAccountIds,
      mediaAssetIds,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      versions: Array.from(selectedPlatforms).map((platform) => ({
        platform,
        text: versions[platform]?.text ?? baseText,
        settings: versions[platform]?.settings ?? {},
      })),
    })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_380px]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Compose</CardTitle>
            <CardDescription>
              Create once, tailor per platform, and schedule through direct APIs.
            </CardDescription>
            <CardAction>
              <StatusBadge status="draft" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="baseText">Base content</FieldLabel>
                <Textarea
                  id="baseText"
                  value={baseText}
                  onChange={(event) => setBaseText(event.target.value)}
                  className="min-h-36 resize-none"
                />
                <FieldDescription>
                  This text is copied into each platform version by default.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Accounts</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {accounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => toggleTargetAccount(account.id)}
                      className={[
                        "flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors",
                        targetAccountIds.includes(account.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/20 hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="font-medium">{account.displayName ?? account.username}</span>
                        <span className="text-xs text-muted-foreground">@{account.username}</span>
                      </span>
                      <PlatformPill platform={account.platform} />
                    </button>
                  ))}
                </div>
              </Field>
              <Field>
                <FieldLabel>Media</FieldLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {mediaAssets.map((asset) => {
                    const selected = mediaAssetIds.includes(asset.id)

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() =>
                          setMediaAssetIds(
                            selected
                              ? mediaAssetIds.filter((id) => id !== asset.id)
                              : [...mediaAssetIds, asset.id]
                          )
                        }
                        className={[
                          "flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/20 hover:bg-muted/50",
                        ].join(" ")}
                      >
                        <MediaPreview
                          publicUrl={asset.publicUrl}
                          type={asset.type}
                          mimeType={asset.mimeType}
                          alt={asset.fileName}
                          className="size-10 shrink-0 rounded-md"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{asset.fileName}</span>
                          <span className="block text-xs text-muted-foreground">{asset.type}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Versions</CardTitle>
            <CardDescription>
              Adjust captions and API settings without changing the base post.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Platform.INSTAGRAM}>
              <TabsList>
                {mvpPlatforms.map((platform) => (
                  <TabsTrigger key={platform} value={platform}>
                    {platformMeta[platform].name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {mvpPlatforms.map((platform) => {
                const value = versions[platform]?.text ?? baseText
                const remaining = platformMeta[platform].limit - value.length

                return (
                  <TabsContent key={platform} value={platform}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>{platformMeta[platform].name} caption</FieldLabel>
                        <Textarea
                          value={value}
                          onChange={(event) =>
                            setPlatformText(platform, event.target.value)
                          }
                          className="min-h-28 resize-none"
                        />
                        <FieldDescription>
                          {String(remaining)} characters remaining.
                        </FieldDescription>
                      </Field>
                      {platform === Platform.TIKTOK ? (
                        <div className="grid gap-4 md:grid-cols-3">
                          <Field>
                            <FieldLabel>Privacy</FieldLabel>
                            <Select
                              value={
                                String(
                                  versions[platform]?.settings.privacyLevel ??
                                    "SELF_ONLY"
                                )
                              }
                              onValueChange={(value) =>
                                setPlatformSetting(platform, "privacyLevel", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Privacy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="SELF_ONLY">Self only</SelectItem>
                                  <SelectItem value="MUTUAL_FOLLOW_FRIENDS">
                                    Friends
                                  </SelectItem>
                                  <SelectItem value="PUBLIC_TO_EVERYONE">
                                    Public
                                  </SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>Comments</FieldLabel>
                            <Switch
                              checked={
                                !Boolean(
                                  versions[platform]?.settings.disableComment
                                )
                              }
                              onCheckedChange={(checked) =>
                                setPlatformSetting(
                                  platform,
                                  "disableComment",
                                  !checked
                                )
                              }
                            />
                          </Field>
                          <Field orientation="horizontal">
                            <FieldLabel>Auto music</FieldLabel>
                            <Switch
                              checked={Boolean(
                                versions[platform]?.settings.autoAddMusic
                              )}
                              onCheckedChange={(checked) =>
                                setPlatformSetting(platform, "autoAddMusic", checked)
                              }
                            />
                          </Field>
                        </div>
                      ) : (
                        <Field orientation="horizontal">
                          <FieldLabel>Share Reels to feed</FieldLabel>
                          <Switch
                            checked={Boolean(
                              versions[platform]?.settings.shareToFeed ?? true
                            )}
                            onCheckedChange={(checked) =>
                              setPlatformSetting(platform, "shareToFeed", checked)
                            }
                          />
                        </Field>
                      )}
                    </FieldGroup>
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Queue the post or publish immediately.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="scheduledAt">Publish time</FieldLabel>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={mutation.isPending || !targetAccountIds.length}
                  onClick={() => submit(false)}
                >
                  <CalendarClockIcon data-icon="inline-start" />
                  Schedule
                </Button>
                <Button
                  disabled={mutation.isPending || !targetAccountIds.length}
                  onClick={() => submit(true)}
                >
                  <SendIcon data-icon="inline-start" />
                  Publish now
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Platform-specific render checks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mvpPlatforms.map((platform) => {
              const text = versions[platform]?.text ?? baseText
              const meta = platformMeta[platform]

              return (
                <div key={platform} className="rounded-lg border bg-muted/20 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <PlatformPill platform={platform} />
                    <span className="text-xs text-muted-foreground">
                      {text.length}/{meta.limit}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-md border bg-background/70">
                    {(selectedMedia.length ? selectedMedia : mediaAssets.slice(0, 1)).map(
                      (asset) => (
                        <MediaPreview
                          key={asset.id}
                          publicUrl={asset.publicUrl}
                          type={asset.type}
                          mimeType={asset.mimeType}
                          alt={asset.fileName}
                          className="aspect-[4/5] w-full"
                        />
                      )
                    )}
                    <div className="p-3">
                      <p className="line-clamp-5 text-sm leading-6">{text || "Your caption will appear here."}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
