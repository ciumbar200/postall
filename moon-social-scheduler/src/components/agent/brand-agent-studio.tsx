"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { SparklesIcon, Loader2Icon, RefreshCwIcon, CalendarIcon, ZapIcon, TargetIcon, CheckCircle2Icon } from "lucide-react"

type AgentResult = {
  agentRunId?: string
  plan?: { rationale?: string; horizonWeeks?: number; pieces?: unknown[] }
  results?: Array<{
    platform: string
    format: string
    caption: string
    scheduledAt: string
    postId: string
    videoPending?: boolean
    weekNumber?: number
    pillar?: string
  }>
}

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "#E1306C",
  TIKTOK: "#00F2EA",
  LINKEDIN: "#0077B5",
  PINTEREST: "#E60023",
  FACEBOOK: "#1877F2",
  X: "#000000",
}

const FORMAT_ICONS: Record<string, string> = {
  carousel: "▣",
  reel: "▶",
  static: "◼",
  story: "◁",
}

export function BrandAgentStudio() {
  const [brief, setBrief] = React.useState("")
  const [platforms, setPlatforms] = React.useState<string[]>(["INSTAGRAM"])
  const [horizonWeeks, setHorizonWeeks] = React.useState<4 | 12>(4)
  const [postsPerWeek, setPostsPerWeek] = React.useState(3)
  const [loading, setLoading] = React.useState(false)
  const [loadingProgress, setLoadingProgress] = React.useState(0)
  const [revising, setRevising] = React.useState(false)
  const [result, setResult] = React.useState<AgentResult | null>(null)
  const [revision, setRevision] = React.useState<unknown>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setLoadingProgress(0)
    setRevision(null)

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          platforms,
          horizonWeeks,
          postsPerWeek,
          scheduleStart: new Date().toISOString(),
        }),
      })
      clearInterval(progressInterval)
      setLoadingProgress(100)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error al generar")
      setResult(data)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Error")
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setLoadingProgress(0)
    }
  }

  const handleRevise = async () => {
    setRevising(true)
    try {
      const res = await fetch("/api/agent/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookbackDays: 28 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error al revisar")
      setRevision(data)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Error")
    } finally {
      setRevising(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-mono">
      {/* Animated background grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,234,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00F2EA]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#E1306C]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-[#00F2EA] via-[#7B2FFF] to-[#E1306C] bg-clip-text text-transparent">
                  BRAND AGENT
                </span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-md">
                PLANIFICA SEMANAS DE CONTENIDO • GENERA CON IA • PROGRAMA AUTOMÁTICAMENTE
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRevise}
              disabled={revising}
              className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white"
            >
              {revising ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin text-[#00F2EA]" />
              ) : (
                <RefreshCwIcon className="mr-2 h-4 w-4" />
              )}
              <span className="font-mono text-xs">REVISAR ESTRATEGIA</span>
            </Button>
          </div>
        </header>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F2EA] to-[#E1306C] rounded-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative bg-zinc-900/80 backdrop-blur-xl rounded-xl p-6 border border-zinc-800">
                <label className="text-xs text-[#00F2EA] font-mono tracking-wider mb-3 block">
                  [BRIEF DE CAMPAÑA]
                </label>
                <textarea
                  placeholder="Ej: Lanzamiento colección verano, 3 posts/semana IG + TikTok, tono cercano..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={6}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#00F2EA] transition-colors resize-none"
                />
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 font-mono">
                  <span>{brief.length} / 500</span>
                  <span className={brief.length >= 10 ? "text-[#00F2EA]" : "text-zinc-600"}>
                    {brief.length >= 10 ? "✓ LISTO PARA GENERAR" : "MIN 10 CARACTERES"}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-xl p-5 border border-zinc-800">
                <label className="text-xs text-[#E1306C] font-mono tracking-wider mb-3 block">
                  [HORIZONTE]
                </label>
                <div className="flex gap-2">
                  {[4, 12].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setHorizonWeeks(w as 4 | 12)}
                      className={`flex-1 py-3 px-4 text-sm font-mono rounded-lg transition-all ${
                        horizonWeeks === w
                          ? "bg-gradient-to-r from-[#00F2EA] to-[#7B2FFF] text-black font-bold"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {w}S
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-xl p-5 border border-zinc-800">
                <label className="text-xs text-[#7B2FFF] font-mono tracking-wider mb-3 block">
                  [RITMO]
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={postsPerWeek}
                  onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-sm font-mono text-center focus:outline-none focus:border-[#7B2FFF] transition-colors"
                />
                <div className="text-xs text-zinc-500 text-center mt-1">posts/semana</div>
              </div>
            </div>

            {/* Platforms */}
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-xl p-5 border border-zinc-800">
              <label className="text-xs text-zinc-400 font-mono tracking-wider mb-3 block">
                [PLATAFORMAS]
              </label>
              <div className="flex flex-wrap gap-2">
                {["INSTAGRAM", "TIKTOK", "LINKEDIN", "PINTEREST", "FACEBOOK", "X"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPlatforms((prev) =>
                        prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                      )
                    }}
                    className={`px-4 py-2 text-xs font-mono rounded-lg border transition-all ${
                      platforms.includes(p)
                        ? "border-transparent bg-white text-black"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
                    }`}
                    style={{
                      backgroundColor: platforms.includes(p) ? PLATFORM_COLORS[p] : undefined,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!brief || brief.length < 10 || loading}
              className="relative group w-full overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00F2EA] via-[#7B2FFF] to-[#E1306C]" />
              <div className="relative bg-zinc-900/90 rounded-xl px-8 py-5 transition-colors group-hover:bg-zinc-900/70 disabled:opacity-50">
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2Icon className="h-5 w-5 animate-spin text-[#00F2EA]" />
                    <span className="font-mono text-sm">
                      GENERANDO... {loadingProgress}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <SparklesIcon className="h-5 w-5 text-[#00F2EA]" />
                    <span className="font-bold">GENERAR CAMPAÑA</span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {horizonWeeks * postsPerWeek} PIEZAS
                    </span>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-7 space-y-6">
            {result?.plan?.rationale && (
              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <TargetIcon className="h-5 w-5 text-[#00F2EA]" />
                  <h2 className="text-sm font-mono tracking-wider text-zinc-400">
                    ESTRATEGIA GENERADA
                  </h2>
                </div>
                <p className="text-zinc-300 leading-relaxed">{result.plan.rationale}</p>
                <div className="mt-4 flex gap-4 text-xs font-mono text-zinc-500">
                  <span>{result.plan.horizonWeeks ?? horizonWeeks} semanas</span>
                  <span>•</span>
                  <span>{result.results?.length ?? 0} piezas</span>
                </div>
              </div>
            )}

            {result?.results && result.results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2Icon className="h-5 w-5 text-[#00F2EA]" />
                  <h2 className="text-sm font-mono tracking-wider text-zinc-400">
                    BORRADORES PROGRAMADOS
                  </h2>
                </div>

                {result.results.map((item, index) => (
                  <div
                    key={item.postId}
                    className="group relative bg-zinc-900/50 backdrop-blur rounded-lg p-5 border border-zinc-800/50 hover:border-[#00F2EA]/30 transition-all"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg bg-gradient-to-b from-[#00F2EA] to-[#7B2FFF]" />

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className="px-2 py-1 text-xs font-bold rounded text-black"
                            style={{ backgroundColor: PLATFORM_COLORS[item.platform] || "#666" }}
                          >
                            {item.platform}
                          </span>
                          <span className="text-zinc-500 text-xs font-mono">
                            {FORMAT_ICONS[item.format] || "?"} {item.format}
                          </span>
                          {item.weekNumber && (
                            <span className="text-[#7B2FFF] text-xs font-mono">
                              SEMANA {item.weekNumber}
                            </span>
                          )}
                          {item.pillar && (
                            <span className="text-zinc-500 text-xs font-mono">
                              / {item.pillar}
                            </span>
                          )}
                          {item.videoPending && (
                            <span className="flex items-center gap-1 text-amber-500 text-xs font-mono">
                              <Loader2Icon className="h-3 w-3 animate-spin" />
                              VIDEO EN PROCESO
                            </span>
                          )}
                        </div>

                        <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">
                          {item.caption}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(item.scheduledAt).toLocaleString("es-ES", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-mono text-[#00F2EA]">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {revision && (
              <div className="bg-zinc-900/80 backdrop-blur-xl rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <ZapIcon className="h-5 w-5 text-[#E1306C]" />
                  <h2 className="text-sm font-mono tracking-wider text-zinc-400">
                    REVISIÓN DE ESTRATEGIA
                  </h2>
                </div>
                <pre className="max-h-96 overflow-auto rounded-md bg-zinc-950/50 p-4 text-xs text-zinc-400 border border-zinc-800">
                  {JSON.stringify(revision, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
