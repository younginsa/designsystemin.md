# design.md — AI 디자인 규칙서

> 이 문서는 사람용 가이드가 아니라 **AI에게 내리는 명령문**이다.
> 페이지·컴포넌트를 생성하는 모든 AI는 이 규칙을 따른다.
> 원천은 이 저장소(git)다. 다른 곳에 복사된 사본은 신뢰하지 않는다.
>
> **이 문서는 "어떻게 쓰는가"(규칙)만 담는다.** "무엇이 있는가"(목록)는 Storybook 이고,
> 토큰 값은 `dstk/*.json`(해석본 `/dstk/semantic-map.json`)이다. 여기에 목록이나 값을 다시 적지 않는다.
> 산출물이 tsx 페이지든 단독 HTML 이든 이 규칙은 같다(2026-09-18 현행화).

## 0. 규정 우선

디자인 규칙보다 **제품별 규정이 우선**한다. 페이지 생성 요청을 받으면:

1. `regulations/`에서 해당 제품 파일을 찾는다.
2. 요청과 충돌하거나 주의가 필요한 규정을 발견하면 **생성 전에 사용자에게 알리고 확인받는다**.
3. 해당 제품 규정 파일이 없으면 그 사실을 한 줄로 알리고 진행한다.

## 1. 강제 규칙

- 색·라운드·그림자는 **시맨틱 토큰만** 사용한다. Tailwind 클래스로는 `bg-background`,
  `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`,
  `bg-destructive`, `ring-ring` 등.
- **임의 값 금지**: `#3B82F6`, `bg-[#f00]`, `p-[13px]`, `rounded-[7px]`, `shadow-[...]` 전부 금지.
- 간격·크기는 Tailwind 기본 스케일만 사용한다 (`p-4`, `gap-3`, `size-8`).
- **Storybook 에 스토리가 있는 컴포넌트만 쓴다.** 없는 것을 직접 만들면 눈에 보이게 표시하고
  (`data-ds="fallback"` + 점선 + "DS에 없음: <이름>") 보고서 끝에 목록으로 적는다. 조용히 넣지 않는다.
- **산출물 위치**는 경로에 따라 다르다 — Claude Code 세션은 `playground/app/generated/<이름>/page.tsx`,
  claude.ai 경로는 단독 HTML 한 장(`/ds-skill.md` 규약). 나머지 규칙은 양쪽 동일.
- **생성물에 `dark:` 프리픽스를 쓰지 않는다** — 다크는 토큰이 처리한다.
  (컴포넌트 내부에 남은 `dark:` 는 shadcn 잔재이고 별도 정리 대상이다. 스니펫에 섞여 있어도 그대로 복사한다.)

## 2. 시맨틱 토큰 사전

| 토큰 | 용도 |
|---|---|
| `background` / `foreground` | 페이지 배경 / 기본 텍스트 |
| `card` / `card-foreground` | 카드·패널 표면 |
| `popover` / `popover-foreground` | 팝오버·드롭다운 표면 |
| `primary` / `primary-foreground` | 주요 액션 (페이지당 1개 원칙) |
| `secondary`, `accent` | 보조 액션, hover 표면 |
| `muted` / `muted-foreground` | 비활성 표면 / 보조 텍스트 |
| `destructive` | 삭제·위험 액션 |
| `success` | 성공 상태 |
| `border`, `input`, `ring` | 테두리, 입력 테두리, 포커스 링 |
| `radius` | 라운드 기준값 (`rounded-lg`) |

이 표는 **용도 사전**이고 값은 없다. 실제 값(제품 모드별 해석 hex)은 `/dstk/semantic-map.json` 이 원천이며,
`dstk/*.json` 을 고치고 `pnpm ds:build` 를 실행해 만든다.

## 3. 컴포넌트 사용 규칙

**여기 적힌 것이 컴포넌트의 전체 목록이 아니다** — 목록은 Storybook 이다.
이 절은 "언제 쓴다 / 언제 안 쓴다"만 담는다. 여기 없는 컴포넌트도 Storybook 에 있으면 쓸 수 있다.

- **Button** — 모든 클릭 액션. 페이지당 기본(primary) 버튼은 1개.
- **Input, Label** — 폼 입력. Label 없는 Input 금지 (placeholder는 label 대체 불가).
- **Select** — 4개 이상 고정 선택지. 2~3개면 Tabs나 버튼 그룹.
- **Checkbox** — 다중 선택, 동의.
- **Badge** — 상태 표시. 클릭 액션에는 쓰지 않는다.
- **Card** — 정보 묶음 표면. **카드 안에 카드 금지.**
- **Table** — 정형 데이터 목록. 모바일 대응이 필요하면 카드 리스트로 전환.
- **Dialog** — 짧은 확인·입력. 긴 폼은 별도 페이지로.
- **DropdownMenu** — 행 단위 액션 묶음 (테이블 우측 ⋯ 버튼).
- **Tabs** — 같은 데이터의 뷰 전환. 페이지 네비게이션에는 쓰지 않는다.
- **Avatar** — 사용자 표시. 이미지 없으면 이니셜 폴백.
- **필드 표면(2026-09-14 확정)** — Input·Textarea·Select 트리거·InputGroup 은 항상 `bg-card`(흰색),
  캔버스가 `bg-secondary`(대시보드)여도 같다. 종전 InputGroup `filled` 변형이 기본이 됐고 prop 은 호환용.
  피그마 필드 세트 fill = General/background(card 번들). 반경은 토큰 그대로 — md 8 · sm 6 · lg 10 · xl 14.
- **Separator** — 섹션 구분. 여백으로 충분하면 쓰지 않는다.
- **ToggleGroup — 은퇴(2026-09-15)**: outline 세그먼트·칩 그리드는 선택 상태(accent 6%)가 안 보여
  혼동을 낳았다. 단일 선택 뷰 전환 = `Tabs variant="line"`, 다중 선택 = `Checkbox` 그룹.
  `form-segment`·`form-chipgrid` 삭제, 파일은 부품으로만 남는다(스토리 없음 = DS 아님).
- **필드 보조 요소(2026-09-15)** — ✕ 지우기 등 아이콘 액션 = `text-input`(hover `foreground`),
  힌트 접미어(`InputGroupText muted`, "7자리") = `text-input`. 라벨 접두어("IMO")는 `secondary-foreground`.
- **Alert** — 페이지 내 정적 안내·경고. 파괴 배너 표면 = `bg-destructive/5`
  (2026-09-02 개정 — /10은 hover·버튼 잉크로 이관).
- **hover 색(2026-09-10 확정)** — 중립 면 위 hover = `accent` 하나(오버레이라 light·dark·control 공통).
  ghost·outline·**secondary 버튼**(secondary도 중립 면 — 종전 `secondary/80`은 light Δ1·dark Δ2로 안 보여 폐기) 모두 여기 —
  배경 `accent` + 글자 `accent-foreground`, 세 변형 동일 문법.
  색 있는 면은 자기 색의 90%(`primary/90`·`destructive/90`), destructive-ghost·outline은
  `destructive/10`, primary-ghost는 `primary/5`. 표 행 상태 = hover `accent` · expanded `secondary` ·
  selected `muted`(예약 — 두 앱 어디도 행 선택 미사용). `bg-muted/50`은 `secondary`로 교체 — 시스템에 없다.
  컴포넌트 내부 틴트(hover 90·80, disabled 50, ring 50/20, border 40, progress 20)는 허용 목록 대상이 아니다 —
  365 「04 프론트 연동」 틴트 규칙 표 참조.
- **Skeleton** — 로딩 상태. 스피너보다 우선.

import 경로는 `@ds/ui/ui/<컴포넌트>` 형식이다. 예: `import { Button } from "@ds/ui/ui/button"`.

## 4. 레이아웃 규칙

- **어드민 셸**: 좌측 사이드바(`w-64 border-r bg-card p-4`) + 우측 콘텐츠(`p-8`).
  사이드바는 **일반 토큰만 쓴다** — 면 `bg-card`, 구분선 `border-border`, hover `accent`.
  전용 sidebar 색 변수 8종은 2026-09-18 은퇴(shadcn 기본값 잔재였고 유틸리티가 생성되지도 않았다).
- **인증 셸**: 중앙 정렬 단일 카드(`max-w-sm`), 배경 `bg-muted`.
- 페이지 헤더: `PageHeader` 프리셋(2026-09-16) — 제목 `text-lg font-bold`(text-2xl 아님) + `actions`(우측 페이지 레벨 액션), 부제는 `description`, 제목 옆 배지·툴팁은 `addon`. 타이틀 행 손 조합 금지.
- 콘텐츠 최대폭: 테이블 페이지는 전체폭, 폼·문서형은 `max-w-2xl`.
- 수직 리듬: 섹션 간 `space-y-6`, 폼 필드 간 `space-y-4`.

### 본문 문법은 layout/body-patterns.md 가 원천이다 (2026-09-18 일원화)

목록 페이지 문법(제목 행 · FilterBar · Table · ListFooter 순서와 각 규칙), CTA 문법,
본문 패턴 A~E 는 **`layout/body-patterns.md` 한 곳에만 둔다.** 종전에는 같은 내용이 이 문서 §4 에도
있었고 두 곳의 날짜가 갈라져 있었다(여기 2026-08-26·08-28 확정분 / 저기 09-02·09-10·09-16 개정분).
목록이 둘이면 반드시 어긋난다 — 그래서 더 새것 한쪽만 남긴다.

여기 남는 것은 **셸과 페이지 뼈대**뿐이다(위의 어드민 셸·인증 셸·페이지 헤더·최대폭·수직 리듬).

## 5. 금지 목록 (안티패턴)

- 그라데이션 배경, 임의 그림자, 유리효과(backdrop-blur)
- 카드 안의 카드, 3중 이상 중첩 테두리
- 이모지를 아이콘 대용으로 사용 (아이콘은 lucide-react만)
- 페이지당 primary 버튼 2개 이상
- 본문 텍스트에 `text-xs` (보조 정보에만 허용)
- placeholder를 label 대신 사용

## 6. 생성 절차 요약

요청 접수 → 규정 검토(§0) → 이 문서 확인 → **프레임 질문**(어느 레이아웃의 본문인가, 단독 화면인가) →
생성 → self-check(임의 값·DS 밖 클래스) → 전달.

경로별 차이는 이것뿐이다.

| | Claude Code 세션 | claude.ai 경로 |
|---|---|---|
| 산출물 | `playground/app/generated/<이름>/page.tsx` | 단독 HTML 한 장 |
| 확인 | dev 서버 렌더 | 내려받아 브라우저로 열기 |
| 검사 | grep self-check + `check_html` | `/ds-classes.json` 대조 |

상태는 양쪽 같다 — 기본·빈·로딩·에러 4개, 진행률이 실재하는 화면만 프로그레스 추가.
