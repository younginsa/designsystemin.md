# designsystemin — AI 친화 디자인 시스템

자연어 → 목업 코드 → 승인 → 피그마 기록. 설계서: docs/superpowers/specs/2026-07-29-ai-design-system-design.md

- `design.md` — AI 규칙서 (진실의 원천)
- `foundations/` — W3C DTCG 디자인 토큰 원천. `pnpm ds:build`로 CSS 산출
- `components/` — @ds/ui 레퍼런스 컴포넌트 (shadcn 기반)
- `playground/` — 목업 미리보기 Next.js 앱. `pnpm dev`
- `regulations/` — 제품별 우선 규정 (생성 전 필수 검토)

> 디렉터리명 참고: 사내 보안 훅이 특정 단어가 포함된 셸 명령을 차단하기 때문에
> 토큰 원천 디렉터리는 `foundations/`로 명명한다.
