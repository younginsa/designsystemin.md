# CLAUDE.md — 이 저장소에서의 작업 절차

AI 친화 디자인 시스템 저장소다.
설계서: docs/superpowers/specs/2026-07-29-ai-design-system-design.md

## 페이지 생성 요청을 받으면 (순서 고정)

1. **규정 검토** — `regulations/`에서 해당 제품 파일 확인. 충돌·주의사항이 있으면
   생성 전에 알리고 확인받는다. 파일이 없으면 한 줄 보고 후 진행.
2. **규칙 로드** — `design.md` 전체를 읽는다.
3. **생성** — `playground/app/<이름>/page.tsx`에 작성. `@ds/ui` 컴포넌트와 시맨틱 토큰만 사용.
4. **self-check** — 임의 값이 없는지 확인:
   `grep -nE '#[0-9a-fA-F]{3,6}|-\[' playground/app/<이름>/page.tsx` → 결과 없어야 함.
5. **미리보기** — `pnpm dev` 후 URL 안내.
6. **승인 후 커밋.**

## 금지

- `dist/dstk.css`, `playground/app/dstk.css` 직접 편집 금지.
  `dstk/*.json`을 고치고 `pnpm ds:build`를 실행한다.
- `@ds/ui`에 없는 컴포넌트 임의 생성 금지 — 필요하면 사용자에게 보고.

## 명령어

- `pnpm dev` — playground 미리보기 (http://localhost:3000)
- `pnpm ds:build` — 토큰 CSS 재생성
- `pnpm build` — 전체 빌드 검증

## 환경 참고

사내 보안 훅이 `TOKEN`이 포함된 셸 명령을 차단한다. 그래서 디자인 토큰 원천
디렉터리 이름은 `dstk/`이고 스크립트는 `ds:build`다. 이 명칭을 바꾸지 않는다.
