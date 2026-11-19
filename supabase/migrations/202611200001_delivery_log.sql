-- 중복 푸시 방지용 발송 기록
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  solar_date date not null,
  created_at timestamptz not null default now(),
  unique(reminder_id, solar_date)
);
alter table public.notification_deliveries enable row level security;
-- 이 테이블은 Edge Function의 service role만 접근합니다. 일반 사용자 정책은 만들지 않습니다.
