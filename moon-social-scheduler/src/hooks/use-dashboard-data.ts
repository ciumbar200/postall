"use client"

import { useQuery } from "@tanstack/react-query"
import {
  demoAccounts,
  demoMedia,
  demoPosts,
  demoQueueJobs,
} from "@/lib/ui/demo-data"

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function useAccounts() {
  const query = useQuery({
    queryKey: ["accounts"],
    queryFn: () => fetchJson<{ accounts: typeof demoAccounts }>("/api/accounts"),
    select: (data) => data.accounts,
    placeholderData: { accounts: demoAccounts },
    retry: false,
  })

  return { ...query, data: query.data ?? demoAccounts }
}

export function usePosts() {
  const query = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchJson<{ posts: typeof demoPosts }>("/api/posts"),
    select: (data) => data.posts,
    placeholderData: { posts: demoPosts },
    retry: false,
  })

  return { ...query, data: query.data ?? demoPosts }
}

export function useMediaAssets() {
  const query = useQuery({
    queryKey: ["media"],
    queryFn: () => fetchJson<{ assets: typeof demoMedia }>("/api/media"),
    select: (data) => data.assets,
    placeholderData: { assets: demoMedia },
    retry: false,
  })

  return { ...query, data: query.data ?? demoMedia }
}

export function useQueue() {
  const query = useQuery({
    queryKey: ["queue"],
    queryFn: () =>
      fetchJson<{
        jobs: typeof demoQueueJobs
        slots: Array<Record<string, unknown>>
      }>("/api/queue"),
    select: (data) => data,
    placeholderData: { jobs: demoQueueJobs, slots: [] },
    retry: false,
  })

  return { ...query, data: query.data ?? { jobs: demoQueueJobs, slots: [] } }
}
