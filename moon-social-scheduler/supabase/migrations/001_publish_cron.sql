-- Supabase pg_cron: Ejecutar el publish worker cada 2 minutos
-- Habilitar pg_cron primero en tu dashboard de Supabase

-- 1. Habilitar la extensión pg_cron (desde Supabase Dashboard > Database > Extensions)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Crear el job que llama a la Edge Function cada 2 minutos
-- La Edge Function debe estar desplegada en Supabase

SELECT cron.schedule(
  'moon-publish-worker',
  '*/2 * * * *', -- Cada 2 minutos
  $$
  SELECT
    net.http_post(
      url := 'https://tu-project.supabase.co/functions/v1/publish',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);

-- Ver job programado
SELECT * FROM cron.job;

-- Para eliminar el job:
-- SELECT cron.unschedule('moon-publish-worker');
