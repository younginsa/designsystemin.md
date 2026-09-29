# FE 요청 — 목록 푸터 (행 수 · 전체 건수 · 페이지네이션) (ListFooter)
컴포넌트 키 `list-footer` · 섹션 Navigation · 생성일 2026-09-29
## 무엇
FE Storybook 에 `list-footer` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **5곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/diagnostics/page.tsx`
- `playground/app/gallery/hinas365/ships/ships-view.tsx`
- `playground/app/gallery/sales365/accounts/page.tsx`
- `playground/app/gallery/sales365/subscriptions/page.tsx`
- `playground/app/gallery/sales365/users/page.tsx`
## 설계 노트 (우리 기록)

- 조합 제작 — @ds/ui/ui/list-footer(2026-09-10 신설, 채택 55종째). body-patterns A 리스트 「푸터」 규칙의 컴포넌트판: 좌 RowsPerPage(페이지당 · │ · 전체 N건) + 우 Pagination, flex justify-between 한 행. 창 규칙 Previous · 1 · … · p−1 p p+1 · … · N · Next(간격 있을 때만 …), 양 끝 Previous/Next aria-disabled(흐림 50%·클릭 차단 — PaginationLink 공통). 단일 페이지면 페이지네이션 생략·건수는 남는다. 행 수 변경 시 1페이지 리셋 내장. pageCount 생략 시 total÷pageSize. summary 생략 시 '전체 {total}{unit}'(천 단위 구분) — 리치 표기는 summary 노드. 손 조합(ships-view·updates·diagnostics 등 갤러리 9면) → 이 프리셋으로 치환 예정(클론 프롬프트)

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/list-footer.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/list-footer.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/list-footer.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-listfooter--docs |
### 스토리 3편 — 이만큼이 필요한 상태입니다
- **Default** — 첫 페이지 — Previous 비활성, 1 2 … 17
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/list-footer/default.html
- **Middle** — 중간 페이지 — 양쪽 … 노출
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/list-footer/middle.html
- **SinglePage** — 단일 페이지 — 페이지네이션 생략, 건수만
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/list-footer/single-page.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `pageSize` | number | 필수 | - | 페이지당 행 수(controlled) |
| `pageSizeOptions` | number[] | 선택 | - | RowsPerPage 옵션 — 기본 10/15/30/50 |
| `total` | number | 필수 | - | 전체 건수 — summary 미지정 시 `전체 {total}{unit}` 로 표기 |
| `unit` | string | 선택 | 기본 `건` | 건수 단위 — 예: "척" · "건"(기본) · "개" |
| `summary` | ReactNode | 선택 | - | 구분선 오른쪽 전체 건수 표기를 직접 지정(단위가 문장에 안 맞을 때) — 예: "검색 결과 12건". 보조 카운트 병기 규칙은 폐기(2026- |
| `page` | number | 필수 | - | 현재 페이지(1부터, controlled) |
| `pageCount` | number | 선택 | - | 전체 페이지 수 — 생략 시 ceil(total / pageSize) |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
