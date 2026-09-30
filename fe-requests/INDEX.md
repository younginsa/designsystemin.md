# FE Storybook 요청 목록

컴포넌트의 원천은 FE Storybook 하나입니다(2026-09-29 확정). 여기 있는 것은 **아직 FE 에 없어서 우리 저장소가 임시로 들고 있는 것**이고,
FE 가 만들면 원천이 FE 로 넘어갑니다. 자동 생성: `pnpm fe:request` — FE 에 생긴 항목은 다음 실행에서 이 목록에서 빠집니다.

생성일 2026-09-30 · 요청 1건 · 이관 완료 42건

| 컴포넌트 | 이름 | 스토리 | 쓰이는 화면 | 요청서 |
|---|---|---|---|---|
| `error-state` | 에러 상태 배너 · ErrorState | 2편 | 22곳 | [error-state.md](./error-state.md) |

## 이관 완료 42건

`accordion` · `alert` · `alert-dialog` · `badge` · `breadcrumb` · `button` · `button-group` · `calendar` · `card` · `chart` · `checkbox` · `collapsible` · `command` · `dialog` · `dropdown-menu` · `empty` · `field` · `filter-bar` · `input` · `input-group` · `item` · `label` · `page-header` · `pagination` · `popover` · `progress` · `radio-group` · `rows-per-page` · `search-box` · `select` · `sheet` · `sidebar` · `skeleton` · `sonner` · `spinner` · `status-badge` · `stepper` · `switch` · `table` · `tabs` · `textarea` · `tooltip`

## FE 판정: 공통 컴포넌트 아님 8건 — 요청하지 않는다(우리 조합·레시피로 유지)

- `detail-panel` — 공통 컴포넌트 아님 — Sheet 조합, 2면 — 우리 조합 유지. FE Storybook 요청 대상에서 제외(fe:request).
- `error-console` — 공통 컴포넌트 아님 — 0면 — 우리 조합 유지. FE Storybook 요청 대상에서 제외(fe:request).
- `heatmap-grid` — 공통 컴포넌트 아님 — 진단 상세 1면 — 우리 조합 유지. FE Storybook 요청 대상에서 제외(fe:request).
- `icon-select` — 공통 컴포넌트 아님 — 셸 타임존 선택(DropdownMenu 조합) — 우리 조합 유지. FE Storybook 요청 대상에서 제외(fe:request).
- `list-footer` — 공통 컴포넌트 아님 — 레시피(Pagination + PageSizeSelect + 건수) — body-patterns A 푸터 항. FE Storybook 요청 대상에서 제외(fe:request).
- `notification-panel` — 공통 컴포넌트 아님 — 셸 알림(Popover 조합) — 우리 조합 유지. FE Storybook 요청 대상에서 제외(fe:request).
- `timeline` — 공통 컴포넌트 아님 — 특정 페이지 전용(감사 로그·업데이트 현황) — 우리 조합 유지. FE Storybook 요청 대상에서 제외(fe:request).
- `version-filter-chip` — 공통 컴포넌트 아님 — Select 조합, 1면 — 우리 조합 유지. FE Storybook 요청 대상에서 제외(fe:request).
