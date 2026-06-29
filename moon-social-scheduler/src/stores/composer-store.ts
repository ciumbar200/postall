"use client"

import { create } from "zustand"
import { Platform } from "@/lib/domain/enums"

type PlatformVersion = {
  text: string
  settings: Record<string, unknown>
}

type ComposerState = {
  baseText: string
  scheduledAt: string
  targetAccountIds: string[]
  mediaAssetIds: string[]
  versions: Partial<Record<Platform, PlatformVersion>>
  setBaseText: (value: string) => void
  setScheduledAt: (value: string) => void
  toggleTargetAccount: (id: string) => void
  setMediaAssetIds: (ids: string[]) => void
  setPlatformText: (platform: Platform, text: string) => void
  setPlatformSetting: (platform: Platform, key: string, value: unknown) => void
  reset: () => void
}

const initialText =
  "New drop is live. Schedule once, tailor by network, and publish through official APIs."

export const useComposerStore = create<ComposerState>((set) => ({
  baseText: initialText,
  scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
  targetAccountIds: [],
  mediaAssetIds: [],
  versions: {
    [Platform.INSTAGRAM]: {
      text: initialText,
      settings: { shareToFeed: true },
    },
    [Platform.TIKTOK]: {
      text: initialText,
      settings: {
        privacyLevel: "SELF_ONLY",
        disableComment: false,
        autoAddMusic: false,
      },
    },
  },
  setBaseText: (value) =>
    set((state) => ({
      baseText: value,
      versions: Object.fromEntries(
        Object.entries(state.versions).map(([platform, version]) => [
          platform,
          { ...version, text: value },
        ])
      ) as ComposerState["versions"],
    })),
  setScheduledAt: (value) => set({ scheduledAt: value }),
  toggleTargetAccount: (id) =>
    set((state) => ({
      targetAccountIds: state.targetAccountIds.includes(id)
        ? state.targetAccountIds.filter((item) => item !== id)
        : [...state.targetAccountIds, id],
    })),
  setMediaAssetIds: (ids) => set({ mediaAssetIds: ids }),
  setPlatformText: (platform, text) =>
    set((state) => ({
      versions: {
        ...state.versions,
        [platform]: {
          text,
          settings: state.versions[platform]?.settings ?? {},
        },
      },
    })),
  setPlatformSetting: (platform, key, value) =>
    set((state) => ({
      versions: {
        ...state.versions,
        [platform]: {
          text: state.versions[platform]?.text ?? state.baseText,
          settings: {
            ...(state.versions[platform]?.settings ?? {}),
            [key]: value,
          },
        },
      },
    })),
  reset: () =>
    set({
      baseText: initialText,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
      targetAccountIds: [],
      mediaAssetIds: [],
    }),
}))
