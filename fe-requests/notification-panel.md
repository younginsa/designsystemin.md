# FE 요청 — 알림 패널 (NotificationPanel)
컴포넌트 키 `notification-panel` · 섹션 Overlay · 생성일 2026-09-29
## 무엇
FE Storybook 에 `notification-panel` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **2곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/layout.tsx`
- `playground/app/gallery/sales365/layout.tsx`
## 설계 노트 (우리 기록)

- 조합 제작 — @ds/ui/ui/notification-panel(어휘 ov-notif의 실물). Bell ghost 트리거 + unread 도트 배지(destructive), 패널 w-80, 헤더 알림·모두 읽음 양끝 대칭(py-0.5), 아이템 도트 슬롯 상시 렌더(unread=primary·read=투명 — 제목 좌정렬 유지) + 시간 pl-3.5. 헤더 우측 버튼(=모두 읽음 액션) 라벨은 상태 전이(2026-08-28 확정): unread 있음 '새 알림 (N)' primary 파랑(hover 동형 — contrast-pairs primary×popover aux) → 클릭(전체 읽음)·없음 '모두 읽음' 비활성. '모두 보기' 푸터는 onViewAll 예약(NotificationCenter 2단계). 손 조합 금지

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/notification-panel.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/notification-panel.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/notification-panel.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-notificationpanel--docs |
### 스토리 2편 — 이만큼이 필요한 상태입니다
- **Unread**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/notification-panel/unread.html
- **AllRead**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/notification-panel/all-read.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `items` | NotificationItem[] | 필수 | - |  |
| `align` | enum | 선택 | `start` · `end` |  |
| `defaultOpen` | boolean | 선택 | - |  |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
