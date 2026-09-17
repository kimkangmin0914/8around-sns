# 8around-sns

‘사이’는 짧은 글로 일상을 나누는 SNS 과제 앱입니다. 원문은 [docs/assignment.md](docs/assignment.md), 구현 계약은 [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)에 보존합니다.

공개 배포 URL: 아직 없음. P0 앱, P1 가입·로그인·프로필 설정·게시글, P2 사람 목록·프로필 방문·팔로우와 해제·관계 목록·댓글·한 단계 답글을 구현했습니다. 과제 전용 프로젝트의 초기 SQL 적용과 익명 로그인 비활성은 소유자가 확인했습니다. 승인된 실제 점검 계정 A·B로 앱 HTTP 요청과 DB 저장·조회·접근 거절을 확인했습니다. P3에서 실제 Chromium의 로그인·작성·답글·팔로우, 390px/1440px 화면, 키보드 이동·초안 보존·계정 전환·세션 갱신을 확인했습니다. 반복 가능한 실제 접근 검사와 CI 파일을 추가했습니다. P0~P3 구현을 `main`에 반영했고 GitHub CI의 설치·검사·빌드가 통과했습니다. 공개 배포 체험은 아직 미검증입니다. 상세 증거는 [docs/verification.md](docs/verification.md)에 구분해 기록했습니다.

## 로컬 실행과 소유자 설정

Node 24와 npm, Git을 사용합니다. DB를 로컬에서 띄우지 않으며 과제 전용 Supabase Cloud 한 프로젝트에 연결합니다.

1. `npm ci`로 잠금 파일의 의존성을 설치합니다.
2. Supabase 대시보드에서 **신규 과제 전용 프로젝트**를 선택합니다. 기존 다른 서비스의 DB를 사용하지 않습니다. 기존 제출 DB가 있다면 재현을 위해 초기 SQL을 다시 실행하지 않습니다.
3. 신규 재현 프로젝트에서는 **SQL Editor → New query**에 [202609170001_initial.sql](supabase/migrations/202609170001_initial.sql) 전체를 넣고 **한 번** 실행합니다. 프로필·게시글·댓글·팔로우 테이블, 제약·인덱스·RLS·열별 INSERT 권한을 생성합니다. 현재 과제 프로젝트는 소유자가 적용을 완료했으므로 다시 실행하지 않습니다. 기존 테이블과 충돌하면 삭제·reset 없이 멈추고 적용 이력을 확인합니다. 후속 변경은 별도 추가 migration으로 기록합니다.
4. **Authentication → Sign In / Providers**에서 `Allow new users to sign up`을 켜고, Email 제공자를 활성화하고, Email의 `Confirm Email`을 끄고, `Allow anonymous sign-ins`를 끕니다. 기본 요청 제한을 완화하지 않습니다. 현재 과제 프로젝트에서는 앞의 세 설정을 공개 조회로, 익명 로그인 비활성을 소유자 확인으로 기록했습니다. [공식 설정 문서](https://supabase.com/docs/guides/auth/general-configuration)
5. **Project Settings → API Keys**의 publishable key와 **Project Settings → Data API**의 프로젝트 URL을 `.env.example` 이름에 맞춰 `.env.local`에 넣습니다. 기존 `.env.local`은 덮어쓰지 않습니다. `sb_publishable_` 키를 사용하며 DB 비밀번호·secret·service_role 키는 넣지 않습니다.
6. `npm run dev` 후 `http://localhost:3000`을 엽니다. Codespaces는 Ports의 3000번 전달 주소로 접속할 수 있습니다. 설정 누락·DB 미적용·통신 실패는 오류 상태로 표시됩니다.

체험 순서는 `/signup` 가입 → `/onboarding` 공개 프로필 → `/` 글 작성 → `/posts/[id]` 상세입니다. 프로필 사용자명 충돌은 같은 계정의 설정 화면에서 재시도합니다. 별도 브라우저 B로 로그인하고 `/people`에서 A를 찾아 프로필을 방문합니다. 팔로우 후 B의 팔로잉과 A의 팔로워 목록을 확인하고 해제할 수 있습니다. A의 글에 B가 댓글을 남기고 A가 그 댓글에 답글을 답니다. ‘답글 보기’로 부모 아래의 답글을 펼칩니다. 새로고침과 로그아웃·재로그인 후에도 저장된 글·댓글·관계를 확인합니다.

현재 과제 프로젝트에는 승인된 점검 계정 2개·공개 프로필 2개·`[점검]` 게시글 5개·댓글 5개(최상위 2개·답글 3개)·A→B 팔로우 1개를 남겼습니다. P3의 접근 검사에서 글 2개·댓글 2개, 실제 브라우저에서 글 1개·답글 1개를 추가했습니다. 계정은 재사용했으며 관계 해제는 점검 계정 본인의 관계에만 수행했습니다. 점검 계정의 자격 증명은 Git 제외 `.env.test.local`의 `ACCESS_CHECK_EMAIL_A`, `ACCESS_CHECK_PASSWORD_A`, `ACCESS_CHECK_EMAIL_B`, `ACCESS_CHECK_PASSWORD_B`에 보관하며 파일 권한은 `600`입니다. 값은 문서·로그에 게시하지 않습니다. 이 계정으로 브라우저 체험을 이어갈 수 있으며 계정이나 DB를 초기화하지 않습니다.

이메일 확인과 메일 기반 계정 복구는 제공하지 않습니다. 초기 프로필 설정 후 수정·삭제는 지원하지 않습니다.

## Netlify 연결: 소유자가 수행할 작업

P0~P3 구현은 이 저장소의 `main`에 push했습니다. 사이트 생성·배포는 아직 수행하지 않았으며, 소유자 요청에 따라 교차 검토와 디자인 수정을 먼저 진행할 예정입니다. 이후 P4에서 Netlify의 **Add new project → Import an existing project → GitHub → 이 저장소**를 선택합니다. Production branch는 `main`, 프레임워크는 Next.js, 빌드 명령은 `npm run check && npm run build`, publish 디렉터리는 `.next`, Node는 24입니다. [netlify.toml](netlify.toml)에 동일한 값을 둡니다.

**Project configuration → Environment variables**에 `.env.example`의 두 이름으로 실제 값을 등록하고 Builds와 Functions 런타임에 전달되도록 설정합니다. Free 플랜·기존 허용 사용량에서만 진행합니다. Netlify의 기본 Next.js 어댑터를 사용하며 정적 export로 바꾸지 않습니다. Server Actions와 쿠키 세션을 배포에서도 확인합니다. [Netlify 공식 Next.js 안내](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)

배포 URL이 생기면 Supabase **Authentication → URL Configuration → Site URL**에 해당 공개 URL을 설정합니다. 외부 신규 가입·로그인·게시글 작성·새로고침 유지가 실제로 통과한 뒤 [docs/verification.md](docs/verification.md)에 URL과 deploy ID·commit을 기록합니다. 이 단계의 배포만으로 과제의 댓글·팔로우 흐름까지 완료됐다고 표시하지 않습니다.

## 기술 스택과 선택 이유

Next.js App Router + TypeScript로 한 앱에서 서버 조회와 Server Action 쓰기를 처리합니다. Supabase Auth와 PostgreSQL을 사용해 실제 세션·저장을 제공하고 RLS로 Data API 직접 호출도 보호합니다. Tailwind CSS, 필요한 shadcn/ui Radix Button, Lucide 아이콘을 사용했습니다. Pretendard 1.3.9 폰트는 자체 제공하며 외부 폰트 호출에 빌드를 의존하지 않습니다. 정확한 버전은 `package.json`·`package-lock.json`, 라이선스는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있습니다.

Next.js 16의 `proxy.ts`와 `@supabase/ssr` 쿠키 갱신을 구성하고, 보호된 쓰기에서 `getUser()`로 사용자를 확인합니다. [Supabase 공식 SSR 구성](https://supabase.com/docs/guides/auth/server-side/creating-a-client)을 기준으로 설치 버전의 쿠키·캐시 헤더 인터페이스를 반영했습니다.

현재 환경에서는 Turbopack의 CSS 처리 내부 포트 생성이 권한 승인을 받은 실행에서도 실패했습니다. 동일 Next.js의 지원되는 `--webpack` 옵션으로 개발·빌드를 고정했습니다. ESLint 10은 현재 Next.js React 규칙과 런타임 오류가 있어 동작 확인된 9.39.5를 고정했습니다. 해당 버전의 지원 종료 경고는 남아 있어 호환 업데이트 시 함께 갱신해야 합니다.

## 하네스와 검증 범위

- `AGENTS.md`: 변경 범위, 보안·데이터 보존, 실제 검사·기록 규칙입니다.
- `npm run check`: Prettier → ESLint → TypeScript → Vitest. Unicode 길이, 요청 형태, 작성자 사칭 입력과 쓰기 경계를 검사합니다. Server Action 단위 검사는 모의 SDK 응답을 사용하며 실제 RLS 성공 증거가 아닙니다.
- `npm run build`: 실제 DB 연결 없이 배포용 앱을 빌드합니다. DB 조회 페이지는 동적 처리합니다.
- migration: 테이블 제약, RLS, 입력 가능한 열을 명시합니다. 적용·실제 권한 검사는 별도 증거가 필요합니다.
- `npm run test:access`: [scripts/check-access.mjs](scripts/check-access.mjs)가 실제 Supabase 일반 사용자·익명 Data API의 소유권·댓글 계층·팔로우 제약을 검사합니다. 승인된 과제 프로젝트·기존 A·B 계정에서 실행해 통과했습니다.
- [.github/workflows/ci.yml](.github/workflows/ci.yml): `main` push·PR에서 Node 24로 `npm ci` → `npm run check` → `npm run build`를 수행합니다. 읽기 권한만 부여하고 실제 DB·Codex 자격 증명은 사용하지 않습니다. 별도 소스 복사본의 로컬 검증에 이어, 구현 commit `ee0c460`의 [GitHub CI 실행](https://github.com/kimkangmin0914/8around-sns/actions/runs/35212085700)도 세 명령 모두 통과했습니다.
- 실행 결과·미검증은 `docs/verification.md`, AI 도구는 `tool.md`, 실제 대화 기록은 `exports/`에 있습니다.

실제 접근 검사는 소유자가 확인한 **과제 전용 프로젝트와 프로필을 완료한 점검 계정 A·B**에서만 실행합니다. Git 제외 `.env.test.local`에 아래 이름으로 값을 직접 설정합니다. 현재 작업 환경에는 이미 준비돼 있으므로 새 계정 생성이나 SQL 재적용은 필요하지 않습니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://CONFIRMED_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
ACCESS_CHECK_PROJECT_REF=CONFIRMED_PROJECT_REF
ACCESS_CHECK_EMAIL_A=CHECK_ACCOUNT_A_EMAIL
ACCESS_CHECK_PASSWORD_A=CHECK_ACCOUNT_A_PASSWORD
ACCESS_CHECK_EMAIL_B=CHECK_ACCOUNT_B_EMAIL
ACCESS_CHECK_PASSWORD_B=CHECK_ACCOUNT_B_PASSWORD
```

URL의 프로젝트 참조와 별도 확인값이 다르거나 두 계정이 같으면 연결 전에 종료합니다. 관리 키는 허용하지 않습니다. `npm run test:access`는 앱 서버 없이 실행할 수 있고 매 실행마다 UUID 표식을 붙인 게시글 2개·댓글 2개와, 기존에 없다면 A→B 관계 1개를 소량 추가합니다. 응답 오류와 실제 행·관계 수를 모두 검사하며 실패 시 종료 코드가 0이 아닙니다. 기존 자료를 초기화하거나 삭제하지 않고 검사 세션만 로그아웃합니다. CI나 일정 작업에서 자동 실행하지 않습니다. 앱 HTTP·브라우저 검증과도 별개의 증거입니다.

## 구현 결정과 제한

서버와 폼은 같은 입력 함수를 쓰고 SQL도 공백·길이를 제한합니다. 폼 전송에서 바뀔 수 있는 CRLF/CR 줄바꿈은 LF로 통일해 화면과 서버의 글자 수를 맞춥니다. 일반 텍스트·줄바꿈을 보존하고 HTML로 해석하지 않습니다. 게시글은 500 Unicode 코드 포인트 이내, 피드는 `created_at DESC, id DESC`의 20개 단위 offset 조회입니다. ‘더 보기’는 다음 20개로 이동하며 최신 글로 복귀할 수 있습니다. 읽는 중 새 글이 삽입되면 페이지 간 중복·누락 가능성이 있습니다.

게시글 작성자·ID·시각은 DB 기본값에서 나오며 클라이언트가 임의 지정할 수 없습니다. UPDATE는 허용하지 않고 DELETE는 본인 팔로우 해제만 허용합니다. 댓글 복합 외래키는 다른 글의 부모를 거절하고 호출자 권한 트리거는 한 단계 답글만 허용합니다. 댓글·답글은 최상위와 답글을 각각 최신순 20개로 나누고 선택한 부모 아래에서만 답글을 조회합니다. 현재 댓글 페이지 밖의 부모로 직접 연결해도 그 부모를 함께 표시합니다. 댓글 수에는 답글이 포함됩니다. 사람 목록은 사용자명순, 팔로워·팔로잉은 관계 대상 ID순으로 20개씩 조회하며 관계 수는 같은 `follows` 데이터에서 집계합니다. 팔로우는 요청한 상태가 실제 저장된 관계와 일치하는지 재확인하며 중복 요청은 한 관계로 유지합니다.

저장 중 반복 제출을 막고 성공 응답과 반환 행을 확인한 뒤 초안을 비웁니다. 응답 유실은 결과 미확인으로 표시하고 초안을 보존합니다. 쓰기를 자동 재전송하지 않으며, 사람이 재작성하면 중복될 수 있습니다. 화면 안의 ‘초안을 유지하고 목록 확인’은 초안을 유지합니다. 브라우저 전체 새로고침·페이지 이탈 후 영구 보존하지 않습니다. 다른 탭에서 계정이 바뀌거나 로그아웃하면 탭 복귀 시 실제 사용자를 다시 확인하고 이전 초안을 제거합니다. 이 확인 자체의 통신 실패는 초안을 지우지 않습니다.

개발과 제출 앱이 과제 전용 DB 하나를 공유합니다. 무료 환경의 한도·일시정지 가능성이 있고 환경 격리·무중단을 보장하지 않습니다. reset·일괄 삭제·부하 검사를 하지 않습니다. 작업 종료 시 소유자가 Codespace를 중지합니다.

## 남은 필수 작업과 개선점

남은 필수 작업은 P4 공개 배포·외부 신규 가입부터 전체 흐름·원본 대화 형식 확인·제출입니다. 소유자 요청에 따라 교차 검토·디자인 수정을 먼저 진행하며 P4는 아직 착수하지 않습니다. GitHub CI 성공은 공개 배포 성공을 의미하지 않습니다. 실제 브라우저에서 긴 표시 이름과 전체 빈 초기 피드는 기존 점검 자료를 변경하지 않아 미검증이며, 글이 없는 프로필과 빈 다음 피드 페이지는 확인했습니다. OS 한글 입력기 조합의 수동 확인도 남아 있습니다.

추가 시간이 있다면 이메일 확인·계정 복구, 남용 방어, 개발/제출 환경 분리, 브라우저 자동 회귀 검사를 개선합니다. 위 필수 미완료를 선택 개선으로 간주하지 않습니다.
