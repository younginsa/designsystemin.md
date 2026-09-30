# FE 요청 — 에러 상태 배너 (ErrorState)
컴포넌트 키 `error-state` · 섹션 Feedback · 생성일 2026-09-30
## 무엇
FE Storybook 에 `error-state` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **22곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/accounts/page.tsx`
- `playground/app/gallery/hinas365/compatibility/page.tsx`
- `playground/app/gallery/hinas365/dashboard/page.tsx`
- `playground/app/gallery/hinas365/dev-qa/page.tsx`
- `playground/app/gallery/hinas365/diagnostics/detail/page.tsx`
- `playground/app/gallery/hinas365/diagnostics/page.tsx`
- `playground/app/gallery/hinas365/release-notes/page.tsx`
- `playground/app/gallery/hinas365/ships/ships-view.tsx`
- `playground/app/gallery/hinas365/updates/page.tsx`
- `playground/app/gallery/sales365/accounts/detail/page.tsx`
- `playground/app/gallery/sales365/accounts/page.tsx`
- `playground/app/gallery/sales365/contracts/detail/page.tsx`
- `playground/app/gallery/sales365/contracts/new/page.tsx`
- `playground/app/gallery/sales365/contracts/page.tsx`
- `playground/app/gallery/sales365/deliveries/detail/page.tsx`
- `playground/app/gallery/sales365/deliveries/page.tsx`
- `playground/app/gallery/sales365/products/page.tsx`
- `playground/app/gallery/sales365/subscriptions/page.tsx`
- `playground/app/gallery/sales365/users/detail/page.tsx`
- `playground/app/gallery/sales365/users/page.tsx`
- `playground/app/gallery/sales365/vessels/detail/page.tsx`
- `playground/app/gallery/sales365/vessels/page.tsx`
## 설계 노트 (우리 기록)

- 조합 제작 — @ds/ui/ui/error-state. Alert 프리셋(4상태 계약의 에러 표준): 라운드·테두리 없음·bg-destructive/5 틴트(2026-09-02 /10→/5 완화 — 과하게 붉음, 배너 표면 표준), filled CircleAlert 18px(원 destructive·획 card — filled 아이콘은 Lucide Circle 계열만 허용), 타이틀 검정 semibold, CTA ghost sm /10 틴트(hover /20) '재시도' — /10 유지로 연해진 표면 위 위계. success/warning/info 톤 확장은 추후 — 손 구현 금지

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/error-state.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/error-state.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/error-state.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-errorstate--docs |
### 스토리 2편 — 이만큼이 필요한 상태입니다
- **WithRetry**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/error-state/with-retry.html
- **NoRetry**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/error-state/no-retry.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `title` | ReactNode | 필수 | - |  |
| `description` | ReactNode | 선택 | - |  |
| `retryLabel` | ReactNode | 선택 | 기본 `재시도` |  |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
