# FE 요청 — 에러 콘솔 (ErrorConsole)
컴포넌트 키 `error-console` · 섹션 Feedback · 생성일 2026-09-29
## 무엇
FE Storybook 에 `error-console` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
아직 생성 화면에서 쓰지 않지만 DS 목록에 있어 언제든 쓰입니다.
## 설계 노트 (우리 기록)

- 스토리 전용 패턴(error-console.stories.tsx 안의 로컬 ErrorConsole) — 전용 컴포넌트 파일 없음. 어휘 files 는 빈 배열(손 조합 패턴).

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/error-console.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/error-console.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/error-console.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-errorconsole--docs |
### 스토리 1편 — 이만큼이 필요한 상태입니다
- **Default**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/error-console/default.html
## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
