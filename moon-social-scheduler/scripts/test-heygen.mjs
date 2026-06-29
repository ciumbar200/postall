#!/usr/bin/env node
/**
 * Prueba HeyGen vía API de Postall (requiere servidor en :3000 y sesión/cookie o usar directo).
 * Uso directo a HeyGen:
 *   HEYGEN_API_KEY=xxx node scripts/test-heygen.mjs
 */
const apiKey = process.env.HEYGEN_API_KEY
if (!apiKey) {
  console.error("Set HEYGEN_API_KEY")
  process.exit(1)
}

const script =
  process.argv[2] ||
  "Hola, este es un test de Postall con HeyGen. Conectamos herramientas, no las reemplazamos."

const avatarId = process.env.HEYGEN_DEFAULT_AVATAR_ID
const voiceId = process.env.HEYGEN_DEFAULT_VOICE_ID

const videoInput = {
  voice: {
    type: "text",
    input_text: script,
    ...(voiceId ? { voice_id: voiceId } : {}),
  },
}

if (avatarId) {
  videoInput.character = {
    type: "avatar",
    avatar_id: avatarId,
    avatar_style: "normal",
  }
}

const res = await fetch("https://api.heygen.com/v2/video/generate", {
  method: "POST",
  headers: {
    "X-Api-Key": apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    video_inputs: [videoInput],
    dimension: { width: 1080, height: 1920 },
  }),
})

const body = await res.text()
console.log("Status:", res.status)
console.log(body)

if (!res.ok) process.exit(1)

const { data } = JSON.parse(body)
const videoId = data?.video_id
if (!videoId) process.exit(0)

console.log("\nPolling video_id:", videoId)
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 5000))
  const statusRes = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
    { headers: { "X-Api-Key": apiKey } }
  )
  const statusBody = await statusRes.json()
  const status = statusBody.data?.status
  console.log(`  [${i + 1}] ${status}`)
  if (status === "completed") {
    console.log("URL:", statusBody.data?.video_url)
    break
  }
  if (status === "failed") {
    console.error("Failed")
    process.exit(1)
  }
}
