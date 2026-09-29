# FE 요청 — 히트맵 그리드 (HeatmapGrid)
컴포넌트 키 `heatmap-grid` · 섹션 Data · 생성일 2026-09-29
## 무엇
FE Storybook 에 `heatmap-grid` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **1곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/diagnostics/detail/page.tsx`
## 설계 노트 (우리 기록)

- 원본 재현 — @ds/ui/ui/heatmap-grid(2026-09-16, 시스템 진단 상세 Camera Status · Pod Status 에서 추출). HeatmapGrid(columns · rows{name, group?, cells} · rowLabel · cellTitle) + HeatmapLegend(items{label, tone}). 셀 톤 4종뿐 — success · primary · destructive · none(bg-muted opacity-40); DES-206 노랑·파랑 계열은 primary 대체. 셀 h-5 min-w-8 rounded-sm, 행 이름 font-mono text-sm(그룹 행 + 접두), 열 헤더 text-xs. 카드 셸(제목·설명·Expand All)은 화면의 Card variant="flat" — 컴포넌트 밖.

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/heatmap-grid.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/heatmap-grid.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/heatmap-grid.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-heatmapgrid--docs |
### 스토리 3편 — 이만큼이 필요한 상태입니다
- **Default** — 카메라 상태 — 정상(success) · 이상(destructive) · 데이터 없음(none)
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/heatmap-grid/default.html
- **Legend** — 범례 + 표 — 진단 상세의 카드 안 구성
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/heatmap-grid/legend.html
- **Grouped** — 파드 상태 — 그룹 행(+) · 완료/대기는 primary
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/heatmap-grid/grouped.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `columns` | string[] | 필수 | - | 열 라벨(시간대) |
| `rows` | HeatmapRow[] | 필수 | - |  |
| `rowLabel` | string | 선택 | - | 첫 열 헤더(항목 종류 — Camera · Pod) |
| `cellTitle` | (row: HeatmapRow, column: string) => string | 선택 | 기본 `(row, column) => `${row.name} · ${column}`` | 셀 title(툴팁) — 기본 "행 이름 · 열 라벨" |
| `items` | { label: string; tone: HeatmapTone; }[] | 필수 | - |  |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
