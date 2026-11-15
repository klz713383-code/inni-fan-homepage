이니와 인즈들 - 팬사이트 시작 파일

포함 파일
- index.html : 홈페이지 구조
- style.css : 하늘색/별빛 디자인 및 모바일 레이아웃
- app.js : 공지/사진 표시, 갤러리 이동, 달력 UI
- supabase.js : Supabase 프로젝트 연결 설정
- supabase/schema.sql : 데이터베이스 테이블과 읽기 정책

시작 방법
1. 이 폴더를 기존 VS Code 프로젝트 폴더에 백업 후 복사합니다.
2. VS Code에서 index.html을 Live Server로 실행합니다.
3. Supabase 대시보드 > SQL Editor에서 supabase/schema.sql을 실행합니다.
4. Supabase > Project Settings > API에서 Project URL과 publishable/anon key를 확인합니다.
5. supabase.js의 두 설정값을 교체합니다.
6. 새로고침해 화면과 데이터 읽기를 확인합니다.

중요한 보안 안내
- sb_secret_ 또는 service_role 키는 절대 supabase.js에 넣지 마세요.
- 현재 파일은 공개 방문자가 공지/사진/달력 UI를 볼 수 있는 시작 버전입니다.
- 이니만 업로드/수정/삭제하게 하려면 서버 측에서 비밀 링크 토큰을 검증하는 Supabase Edge Function을 추가해야 합니다.
- 비밀번호 없이 운영하는 것은 가능하지만, 비공개 업로드 링크가 유출되면 권한이 넘어갈 수 있습니다. 링크를 공개 페이지나 소스 코드에 올리지 마세요.
- 현재 달력은 화면 기능만 있고, 달력 이벤트와 월간 하트/스푼/MVP 저장·관리 기능은 데이터 연결 후 구현해야 합니다.
- 실제 Spoon 수치 등 외부 서비스 데이터는 자동으로 가져올 수 있다고 가정하지 않습니다. 제공 가능한 자료/API가 있어야 합니다.


Spoon 자동 연동 검토
- spoon-sync.js가 추가되었습니다.
- 공식 Spoon API 또는 공식 데이터 내보내기 수단과 접근 권한이 확인되기 전에는 자동 수집을 시도하지 않습니다.
- 공식 연동이 가능해지면 Supabase Edge Function을 중계 서버로 두고, 검증된 월간 집계 결과만 홈페이지에 전달합니다.
- 브라우저 코드에 Spoon 로그인 정보/쿠키/token 또는 Supabase service_role 키를 넣지 마세요.
- 현재 상태 문구는 '공식 연동 경로 확인 중 · 현재 자동 집계 미연결'로 표시됩니다.
- MVP는 기준(하트, 스푼, 방송 참여 등)과 원천 데이터가 확정되어야 공정하게 자동 산출할 수 있습니다.


Spoon 공식 API 연동 확인 사항 (2026-11)
1. 공식 개발자 센터: https://developers.spooncast.net/kr
2. 앱 등록 후 필요한 권한을 요청해야 합니다:
   - me.read
   - events.like
   - events.donation
   - events.presence (입장 기반 참여 분석을 원할 경우, DJ의 봇 매니저 지정 필요)
   - events.chat (채팅 활동을 MVP에 반영할 경우)
3. DJ가 Spoon 동의 화면에서 앱 권한을 직접 승인해야 합니다.
4. 이벤트 스트림에 연결하면 봇 계정으로 방송에 청취자 고지가 표시됩니다. 숨길 수 없습니다.
5. 이벤트 스트림은 서버에서만 연결합니다. 브라우저 EventSource는 Authorization 헤더를 붙일 수 없어 직접 연결할 수 없습니다.
6. 공식 API의 실시간 후원 내역은 현재 방송 기준이며 방송 종료 후 조회할 수 없습니다. 매 방송 중 수집 서버가 실행되어야 월간 누적을 만들 수 있습니다.
7. access token은 1시간, refresh token은 기본 30일이며 refresh token은 갱신할 때마다 교체됩니다. Client Secret과 토큰은 서버 비밀값으로만 보관해야 합니다.
8. 월간 MVP 산정 기준은 아직 확정하지 않았습니다. API에서 얻을 수 있는 이벤트(하트/스푼/입장/채팅)를 실제 수집한 뒤, 공개 가능한 공정한 점수 기준을 정해야 합니다.
9. 이 폴더는 홈페이지에서 monthly_records를 읽어 표시하는 부분과 이벤트 저장 테이블을 준비합니다. Spoon OAuth, 장기 실행 이벤트 수집기, 안전한 토큰 보관은 별도 서버 배포 단계에서 구성해야 하며 아직 자동 수집이 작동하는 상태는 아닙니다.


월간 하트왕 / 스푼왕 / 채팅왕 수기 입력
- monthly-awards.js 파일을 메모장 또는 VS Code로 엽니다.
- month 항목을 해당 월로 바꿉니다.
- heartKing, spoonKing, chatKing 각각 name과 value를 직접 입력합니다.
- 저장 후 홈페이지를 새로고침하면 수상자와 기록이 표시됩니다.
- 예시:
  heartKing: { name: "인즈A", value: "하트 1,250개" }
  spoonKing: { name: "인즈B", value: "스푼 850개" }
  chatKing: { name: "인즈C", value: "채팅 320회" }
- 이 방식은 사이트 파일을 수정할 수 있는 운영자만 수상자 기록을 변경합니다.
- 방문자 화면에는 수상자 기록만 표시되며 별도 관리자 화면/로그인 화면은 없습니다.
