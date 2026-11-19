EveryYear 자동 음력 알림 — 초기 파일 패키지

중요: 이 프로젝트는 코드/초기 구성 파일입니다. 업로드만으로 완성되지 않습니다. Supabase Function 배포, 비밀키 설정, Cron 등록, GitHub Pages 설정이 필요합니다.

포함 파일
- index.html, app.js, styles.css, sw.js, manifest.webmanifest: 웹앱
- config.js / config.example.js: Supabase URL/공개키 설정 자리표시자. config.js를 실제 공개 설정값으로 수정할 것
- vapid-generator.html: 브라우저에서 VAPID 키 쌍 생성
- supabase/migrations/...sql: 푸시 중복 방지 테이블
- supabase/functions/check-lunar-reminders/index.ts: 분 단위 음력 날짜 확인 및 웹푸시 발송
- cron.sql: 매 분 Edge Function 호출 예약 예시
- supabase/config.toml: 함수 JWT 검증 설정

필수 환경변수(Edge Function Secrets)
CRON_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY는 Supabase Edge Function 런타임 기본 환경변수 사용

안전
- config.js의 Supabase anon/publishable key는 프런트엔드 공개용 키입니다. RLS가 반드시 켜져 있어야 합니다.
- service_role/secret key, CRON_SECRET, VAPID_PRIVATE_KEY는 절대 GitHub에 올리지 마세요.
- 사용자 데이터 보호 정책은 기존 SQL 단계에서 생성한 RLS 정책을 사용합니다.
- notification_deliveries는 서버 전용 테이블이며 일반 사용자 정책을 만들지 않습니다.

한계와 확인사항
- iPhone은 iOS 16.4 이상에서 Safari로 접속해 홈 화면에 추가한 웹앱에서 푸시를 허용해야 합니다.
- 사용자가 알림 권한을 끄거나 기기를 초기화하면 해당 기기의 구독을 다시 등록해야 합니다.
- 서버는 매 분 실행되므로 실제 도착 시각은 네트워크/푸시 서비스 사정에 따라 지연될 수 있습니다.
- kor-lunar 데이터는 KASI 공개 데이터 기반이며 현재 패키지 설명 기준 1890~2050 지원, 2025-05-20 기준 데이터입니다. 2050년 이후에는 업데이트가 필요합니다.
- 윤달을 선택한 경우 해당 연도에 같은 윤달이 없으면 알림이 없습니다.
- 이 버전은 이메일 인증을 켠 Supabase 프로젝트를 전제로 합니다. Supabase Auth URL Configuration에 GitHub Pages 주소를 추가해야 합니다.

배포 순서는 안내에 따라 단계별로 진행하세요. 처음부터 모든 파일을 GitHub에 올리고 secrets를 절대 포함하지 마세요.
