"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2Icon, SaveIcon, PaletteIcon, FeatherIcon, UsersIcon } from "lucide-react"

type BrandProfile = {
  voice: string
  tone: string
  audience: string
  keywords: string[]
  bannedWords: string[]
  sampleCaptions: string[]
}

const VOICE_OPTIONS = ["Profesional", "Casual", "Provocativo", "Inspirador", "Técnico", "Juguetón"]
const TONE_OPTIONS = ["Serio", "Cercano", "Sarcástico", "Empático", "Directo", "Poético"]

export function BrandProfileForm() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [profile, setProfile] = React.useState<BrandProfile>({
    voice: "",
    tone: "",
    audience: "",
    keywords: [],
    bannedWords: [],
    sampleCaptions: [],
  })
  const [focusedField, setFocusedField] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/brand/profile")
      const data = await res.json()
      if (data) {
        setProfile({
          voice: data.voice || "",
          tone: data.tone || "",
          audience: data.audience || "",
          keywords: data.keywords || [],
          bannedWords: data.bannedWords || [],
          sampleCaptions: data.sampleCaptions || [],
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/brand/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error(error)
      alert("Error al guardar perfil")
    } finally {
      setSaving(false)
    }
  }

  const updateList = (field: "keywords" | "bannedWords" | "sampleCaptions", value: string) => {
    const items = value.split(",").map((s) => s.trim()).filter(Boolean)
    setProfile((prev) => ({ ...prev, [field]: items }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-stone-400 mx-auto mb-4" />
          <p className="text-stone-500 text-sm tracking-widest uppercase">Cargando perfil</p>
        </div>
      </div>
    )
  }

  const completionScore =
    (profile.voice ? 15 : 0) +
    (profile.tone ? 15 : 0) +
    (profile.audience ? 20 : 0) +
    (profile.keywords.length > 0 ? 20 : 0) +
    (profile.bannedWords.length > 0 ? 10 : 0) +
    (profile.sampleCaptions.length > 0 ? 20 : 0)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Editorial background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-100/50 via-transparent" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 text-xs text-stone-500 tracking-widest uppercase mb-6">
            <PaletteIcon className="h-4 w-4" />
            Brand Identity System
          </div>
          <h1 className="text-6xl md:text-7xl font-light tracking-tight text-stone-900 mb-4">
            Brand
            <span className="font-serif italic text-rose-600"> Profile</span>
          </h1>
          <p className="text-stone-500 text-lg max-w-xl mx-auto leading-relaxed">
            Define la voz, tono y personalidad de tu marca para que el Agente genere contenido
            coherente y auténtico.
          </p>
        </header>

        {/* Completion indicator */}
        <div className="mb-12 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs tracking-widest uppercase text-stone-400">
              Perfil de marca
            </span>
            <span className="text-2xl font-light text-stone-900">{completionScore}%</span>
          </div>
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Voice & Tone */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <FeatherIcon className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-stone-900">Voz y Tono</h2>
                <p className="text-sm text-stone-500">Cómo habla tu marca</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div
                className={`space-y-3 p-4 rounded-xl transition-all ${
                  focusedField === "voice" ? "bg-rose-50 ring-2 ring-rose-200" : "bg-stone-50"
                }`}
              >
                <label className="text-xs font-medium tracking-wider uppercase text-stone-400">
                  Voz
                </label>
                <div className="flex flex-wrap gap-2">
                  {VOICE_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setProfile((prev) => ({ ...prev, voice: v }))}
                      onFocus={() => setFocusedField("voice")}
                      onBlur={() => setFocusedField(null)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        profile.voice === v
                          ? "bg-rose-600 text-white shadow-md"
                          : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {profile.voice && (
                  <p className="text-xs text-stone-500 italic">{profile.voice.toLowerCase()}</p>
                )}
              </div>

              <div
                className={`space-y-3 p-4 rounded-xl transition-all ${
                  focusedField === "tone" ? "bg-amber-50 ring-2 ring-amber-200" : "bg-stone-50"
                }`}
              >
                <label className="text-xs font-medium tracking-wider uppercase text-stone-400">
                  Tono
                </label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setProfile((prev) => ({ ...prev, tone: t }))}
                      onFocus={() => setFocusedField("tone")}
                      onBlur={() => setFocusedField(null)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        profile.tone === t
                          ? "bg-amber-500 text-white shadow-md"
                          : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {profile.tone && (
                  <p className="text-xs text-stone-500 italic">{profile.tone.toLowerCase()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Audience */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <UsersIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-stone-900">Audiencia</h2>
                <p className="text-sm text-stone-500">A quién te diriges</p>
              </div>
            </div>

            <Textarea
              placeholder="Describe tu público objetivo: edad, intereses, valores, comportamientos..."
              value={profile.audience}
              onChange={(e) => setProfile((prev) => ({ ...prev, audience: e.target.value }))}
              rows={4}
              className="min-h-[120px] text-base leading-relaxed resize-none border-stone-200 focus:border-emerald-400 focus:ring-emerald-400"
            />
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <label className="text-xs font-medium tracking-wider uppercase text-stone-400 mb-4 block">
              Palabras clave
            </label>
            <Input
              placeholder="sostenibilidad, innovación, calidad, diseño..."
              value={profile.keywords.join(", ")}
              onChange={(e) => updateList("keywords", e.target.value)}
              className="border-stone-200 focus:border-rose-400"
            />
            {profile.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Banned Words */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <label className="text-xs font-medium tracking-wider uppercase text-stone-400 mb-4 block">
              Palabras prohibidas
            </label>
            <Input
              placeholder="barato, descuento, oferta..."
              value={profile.bannedWords.join(", ")}
              onChange={(e) => updateList("bannedWords", e.target.value)}
              className="border-stone-200 focus:border-red-400"
            />
            {profile.bannedWords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.bannedWords.map((bw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm line-through"
                  >
                    {bw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sample Captions */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <label className="text-xs font-medium tracking-wider uppercase text-stone-400 mb-4 block">
              Ejemplos de captions
            </label>
            <Textarea
              placeholder="Caption 1, Caption 2, Caption 3..."
              value={profile.sampleCaptions.join(", ")}
              onChange={(e) => updateList("sampleCaptions", e.target.value)}
              rows={3}
              className="border-stone-200 focus:border-emerald-400"
            />
            {profile.sampleCaptions.length > 0 && (
              <div className="mt-4 space-y-2">
                {profile.sampleCaptions.map((sc, i) => (
                  <div
                    key={i}
                    className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800 border border-emerald-200"
                  >
                    "{sc}"
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-8"
            >
              {saving ? (
                <>
                  <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-5 w-5" />
                  Guardar perfil
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
