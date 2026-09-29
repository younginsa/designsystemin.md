# FE 요청 — 상세 패널 (DetailPanel)
컴포넌트 키 `detail-panel` · 섹션 Navigation · 생성일 2026-09-29
## 무엇
FE Storybook 에 `detail-panel` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **2곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/diagnostics/detail/page.tsx`
- `playground/app/gallery/hinas365/diagnostics/page.tsx`
## 설계 노트 (우리 기록)

- 조합 제작 — @ds/ui/ui/detail-panel. Sheet 프리셋: 폭 md(요약)·4xl(상세), 스크림 basic black-20(overlayClassName 노출), overflow-y-auto 기본, 헤더 스캐폴드(①컨트롤 ②타이틀+보조링크 ③메타 ④유틸 ghost — X 왼쪽 고정). 본문 섹션 = 타이틀 + 표준 Table, 섹션 박스로 감싸지 않음(이중 테두리 금지). 모션 500/300 유지 — 손 구현 금지

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/detail-panel.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/detail-panel.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/detail-panel.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-detailpanel--docs |
### 스토리 1편 — 이만큼이 필요한 상태입니다
- **Open**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/detail-panel/open.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `trigger` | ReactNode | 선택 | - |  |
| `size` | enum | 선택 | `md` · `4xl` | md = 요약 패널 · 4xl = 상세 패널 |
| `control` | ReactNode | 선택 | - | ① 좌상단 컨트롤 슬롯 — 상태 Select(sm, 도트 포함 옵션) 등 |
| `title` | ReactNode | 필수 | - |  |
| `titleLink` | ReactNode | 선택 | - | ② 타이틀 우측 보조 링크 |
| `meta` | ReactNode | 선택 | - | ③ 메타 줄(키-값) |
| `utils` | ReactNode | 선택 | - | ④ 우상단 유틸 슬롯(ghost 버튼) — X 닫기 왼쪽에 고정 |
| `overlayClassName` | string | 선택 | - |  |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
