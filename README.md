# Postall

**Orquestador de marketing open source** — conecta Canva, HeyGen e IA, planifica meses de contenido, publica en todas las redes y ajusta la estrategia según resultados.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Repositorio

| App | Descripción |
|-----|-------------|
| **[moon-social-scheduler](./moon-social-scheduler/)** | SaaS canónico — Next.js 16, Supabase, Stripe, Brand Agent, MCP |
| [moon-social-lite](./moon-social-lite/) | Demo/landing archivada (no producto principal) |

## Qué es Postall

No es Canva. No es un scheduler más.

Es el **hub agent-first** que:

- Orquesta **HeyGen, Canva, DALL-E** (BYOK — traes tus keys)
- **Planifica 4–12 semanas** con Brand Agent + IA
- **Publica** en Instagram, TikTok, LinkedIn, etc.
- **Revisa estrategia** según analytics
- Expone **REST + MCP** para OpenClaw y Claude Code

## Quick start

```bash
cd moon-social-scheduler
cp .env.example .env
npm install && npm run prisma:generate && npm run dev
```

Documentación completa: [`moon-social-scheduler/docs/README.md`](./moon-social-scheduler/docs/README.md)

## Planes (Cloud)

| Plan | ~Precio | Para quién |
|------|---------|------------|
| Free | 0€ | Probar, 3 canales |
| Creator | 9€ | Creator solo |
| Agent | 19€ | API, MCP, Brand Agent, conectores |
| Agency | 39€ | White-label, multi-cliente |

Self-host gratis (MIT). Cloud = conveniencia.

## Stack

Next.js 16 · Prisma · Supabase (Auth, DB, Storage, Edge Functions) · Stripe · Vercel AI SDK

## Licencia

MIT — ver [LICENSE](./LICENSE)
