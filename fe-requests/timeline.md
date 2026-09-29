# FE 요청 — 타임라인 (Timeline)
컴포넌트 키 `timeline` · 섹션 Navigation · 생성일 2026-09-29
## 무엇
FE Storybook 에 `timeline` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **2곳**에서 쓰고 있습니다.

- `playground/app/gallery/_detail/audit-log.tsx`
- `playground/app/gallery/hinas365/updates/page.tsx`
## 설계 노트 (우리 기록)

- 원본 재현 완료 — @ds/ui/ui/timeline. 점·선 마커 컬럼 정렬(구조적 고정)
- neutral 점 신설(2026-09-29) — border-muted-foreground bg-muted-foreground. "값은 있지만 의미색을 붙일 수 없는" 단계용. current 는 "지금 이 단계"라 건수가 있다는 이유로 쓰지 않는다(업데이트 현황 패널이 그렇게 써서 파란 점이 여러 개 생김). StatusBadge neutral 톤과 같은 회색.

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/timeline.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/timeline.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/timeline.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-timeline--docs |
### 스토리 2편 — 이만큼이 필요한 상태입니다
- **Default**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/timeline/default.html
- **AllStatuses**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/timeline/all-statuses.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `status` | enum | 선택 | `success` · `default` · `neutral` · `current` · `error` |  |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
