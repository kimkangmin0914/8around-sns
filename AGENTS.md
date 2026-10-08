# 작업 규칙 (사람과 AI 에이전트 공통)

이 저장소에서 기능을 추가하거나 고칠 때 따르는 규칙이다. `CLAUDE.md`는 이 파일을 가리킨다.

## 읽는 순서

1. `docs/assignment.md` — 과제 원문. 필수 기능은 회원가입·로그인·팔로우/팔로잉 목록·글·댓글·답글(계층).
2. `DESIGN.md` — UI를 건드리기 전에 반드시. 색·크기·움직임은 토큰으로만 쓴다.
3. `README.md`의 구조·결정 절.

## 구조

```
src/
  app/                 라우트. 데이터 읽기 → 컴포넌트 조립만 한다.
  server/queries/      읽기(Supabase select). 실패는 { ok: false }로 돌려준다.
  server/actions/      "use server" 쓰기. 모두 ActionResult를 돌려준다.
  components/<영역>/   UI. 스타일은 같은 폴더의 *.module.css.
  lib/                 서버·클라이언트 공용 순수 함수(검증, 시간, 색, 본문 토큰).
  styles/              tokens.css · base.css · layout.css (전역은 이것뿐)
supabase/              migrations/(운영과 같은 스키마) · seed.sql(로컬 전용) · config.toml
tests/unit · tests/db  단위 검사 · 로컬 DB 규칙 검사
```

## 지켜야 할 것

- **쓰기는 서버가 신원을 다시 확인한다.** 새 쓰기 액션은 `requireAuthor()`를 거치고, 작성자·id·시간은 DB 기본값과 RLS가 정한다. 클라이언트가 보낸 id를 작성자로 쓰지 않는다.
- 폼 입력은 `readFields()`로 허용한 필드만 받는다. 검증 규칙은 `lib/validation.ts` 한 곳에 두고 화면과 서버가 같이 쓴다.
- 쓰기 결과는 `success / input / error / uncertain`으로 구분한다. `uncertain`이면 초안을 지우지 않는다.
- 읽기 실패를 빈 목록으로 보여주지 않는다(`ErrorState`).
- 스키마를 바꾸면 **새 마이그레이션 파일**을 추가하고(기존 파일 수정 금지), `tests/db`에 규칙 검사를 더한 뒤 `npm run db:reset && npm run test:db`로 확인한다. 운영 DB 적용은 소유자 확인 후에만 한다.
- `tests/db`와 `supabase/seed.sql`은 로컬 Supabase 전용이다. 운영 URL로 돌리지 않는다(테스트가 막는다).
- 컴포넌트에 색 값을 직접 쓰지 않는다. 사람의 색은 `toneFor(id)` + `data-tone`.
- 아이콘은 `components/icons/icon.tsx`에 추가한다. 외부 아이콘 라이브러리를 들이지 않는다.
- 문구는 해요체, 짧게. 오류는 "무엇이 / 어떻게" 순서로.
- 비밀번호·토큰·secret 키를 코드·로그·커밋에 남기지 않는다. 앱은 publishable key만 받는다(`lib/supabase/config.ts`가 검사).

## 확인 순서

```bash
npm run check      # prettier · eslint · tsc · 단위 검사
npm run test:db    # (로컬 Supabase 실행 중일 때) RLS·트리거·권한 검사
npm run build      # 배포 가능한지
```

UI 변경은 브라우저에서 320/390/768/1280px, 라이트/다크, 키보드만으로 한 번씩 확인한다. 단위 검사·DB 검사·브라우저 확인·배포 확인은 서로 다른 증거로 `docs/verification.md`에 남긴다.

## 배포

`main`에 push하면 GitHub Actions(검사 + DB 규칙)와 Netlify(빌드·배포)가 각각 돈다. Netlify 환경 변수는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 두 개뿐이다.
