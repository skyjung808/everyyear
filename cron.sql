-- 1) Extensions 메뉴에서 pg_cron, pg_net, supabase_vault 사용 가능 여부를 확인하고 활성화하세요.
-- 2) 아래 YOUR_PROJECT_URL 과 YOUR_CRON_SECRET 을 실제 값으로 바꾸세요.
-- 3) Vault에 저장: 같은 이름의 secret이 이미 있으면 먼저 기존 secret을 정리해야 합니다.
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'everyyear_project_url');
select vault.create_secret('YOUR_CRON_SECRET', 'everyyear_cron_secret');

-- 매 분 Edge Function을 호출합니다. 함수 안에서 KST 날짜와 분을 확인합니다.
select cron.schedule(
  'everyyear-check-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'everyyear_project_url')
      || '/functions/v1/check-lunar-reminders',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'everyyear_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
