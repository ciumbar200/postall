// Supabase Edge Function: Publish Worker
// Simplificado para Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PLATFORM_ADAPTERS: Record<string, any> = {
  INSTAGRAM: { name: 'Instagram', publish: async () => ({ externalPostId: 'ig_' + Date.now() }) },
  TIKTOK: { name: 'TikTok', publish: async () => ({ externalPostId: 'tt_' + Date.now() }) },
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const now = new Date().toISOString()

    // Buscar jobs pendientes (sin joins complejos)
    const { data: jobs, error } = await supabase
      .from('PublishJob')
      .select('*')
      .eq('status', 'WAITING')
      .lte('runAt', now)
      .limit(50)

    if (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No pending jobs' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${jobs.length} jobs to process`)

    let processed = 0

    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id}`)

        // Marcar como activo
        await supabase.from('PublishJob').update({
          status: 'ACTIVE',
          updatedAt: now,
        }).eq('id', job.id)

        // Actualizar post a PUBLISHING
        await supabase.from('Post').update({
          status: 'PUBLISHING',
        }).eq('id', job.postId)

        // Buscar targets del post
        const { data: targets } = await supabase
          .from('PostTarget')
          .select('*')
          .eq('postId', job.postId)

        if (targets) {
          for (const target of targets) {
            const adapter = PLATFORM_ADAPTERS[target.platform]
            if (!adapter) {
              console.log(`No adapter for platform: ${target.platform}`)
              continue
            }

            try {
              const result = await adapter.publish()

              await supabase.from('PostTarget').update({
                status: 'PUBLISHED',
                publishedAt: now,
                externalPostId: result.externalPostId,
                updatedAt: now,
              }).eq('id', target.id)
            } catch (err) {
              await supabase.from('PostTarget').update({
                status: 'FAILED',
                errorMessage: err instanceof Error ? err.message : String(err),
                updatedAt: now,
              }).eq('id', target.id)
            }
          }
        }

        // Marcar job como completado
        await supabase.from('PublishJob').update({
          status: 'COMPLETED',
          updatedAt: now,
        }).eq('id', job.id)

        // Actualizar post final
        await supabase.from('Post').update({
          status: 'PUBLISHED',
          publishedAt: now,
        }).eq('id', job.postId)

        processed++
      } catch (err) {
        console.error(`Error processing job ${job.id}:`, err)

        await supabase.from('PublishJob').update({
          status: job.attempts >= 2 ? 'FAILED' : 'RETRYING',
          lastError: err instanceof Error ? err.message : String(err),
          updatedAt: now,
        }).eq('id', job.id)
      }
    }

    return new Response(
      JSON.stringify({ processed, total: jobs.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        processed: 0
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
