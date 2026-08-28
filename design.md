# design.md — AI 디자인 규칙서

> 이 문서는 사람용 가이드가 아니라 **AI에게 내리는 명령문**이다.
> 페이지·컴포넌트를 생성하는 모든 AI는 이 규칙을 따른다.
> 원천은 이 저장소(git)다. 다른 곳에 복사된 사본은 신뢰하지 않는다.

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
- 컴포넌트는 `@ds/ui`에 있는 것만 사용한다. 없는 컴포넌트가 필요하면 **만들지 말고 사용자에게 보고**한다.
- 새 페이지는 `playground/app/<이름>/page.tsx`에 만든다.
- 다크 모드는 토큰이 처리한다. 색상에 `dark:` 프리픽스를 붙이지 않는다.

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

원천은 `dstk/*.json`. 값 변경은 반드시 거기서 하고 `pnpm ds:build`를 실행한다.

## 3. 컴포넌트 카탈로그 (@ds/ui)

각 항목은 "언제 쓴다 / 언제 안 쓴다" 기준이다.

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
- **Separator** — 섹션 구분. 여백으로 충분하면 쓰지 않는다.
- **Alert** — 페이지 내 정적 안내·경고.
- **Skeleton** — 로딩 상태. 스피너보다 우선.

import 경로는 `@ds/ui/ui/<컴포넌트>` 형식이다. 예: `import { Button } from "@ds/ui/ui/button"`.

## 4. 레이아웃 규칙

- **어드민 셸**: 좌측 사이드바(`w-64 border-r bg-card p-4`) + 우측 콘텐츠(`p-8`).
- **인증 셸**: 중앙 정렬 단일 카드(`max-w-sm`), 배경 `bg-muted`.
- 페이지 헤더: 제목(`text-2xl font-bold`) + 우측 주요 액션 버튼.
- 콘텐츠 최대폭: 테이블 페이지는 전체폭, 폼·문서형은 `max-w-2xl`.
- 수직 리듬: 섹션 간 `space-y-6`, 폼 필드 간 `space-y-4`.

### 목록 페이지 문법 (2026-08-26 확정 — 전 제품 공통)

- **정렬은 테이블 컬럼 헤더 전담 · 필터는 전부 FilterBar** — 컬럼 헤더 필터(▾) 문법은
  폐기한다. 헤더에는 정렬만 남는다.
- **목록 푸터**: 페이지네이션이 없어도 하단 좌측 = `페이지당: [N ˅] │ 전체 N건`
  (`RowsPerPage` 프리셋). **건수는 푸터가 소유한다** — 제목 아래 부제로 "총 N건"을
  표기하는 문법은 폐기.
- **푸터 보조 카운트는 괄호** — `전체 247척 (● 미입력 38척)`. 구분점(·) 중복 금지:
  경고 도트가 있는 보조 카운트를 ·로 이으면 구분점이 겹쳐 읽힌다.
- **페이지 헤더 행**: 단일 줄 제목이면 `items-center`. 실제 부제(설명 텍스트)가 있을
  때만 `items-start`.
- **목록 액션**(내보내기·등록 CTA)은 **FilterBar `actions` 슬롯**(툴바 우측)에 둔다 —
  제목 행에 두지 않는다.
- **테이블 헤더는 한국어 기본** — 식별자(IMO·Hull 등)와 제품명(Control 등)만 영문 유지.

### CTA 문법 (2026-08-28 확정 — 전 제품 공통)

- **사이즈 통일**: 같이 쓰이는 CTA 페어/그룹(가로·세로)은 동일 사이즈만 조합한다 —
  텍스트 크기 혼용 금지(예: sm 옆에 xs 금지).
- **간격**: CTA 페어 간격 = `gap-1`(4px) — 한 덩어리로 읽히게.
- **모서리**: 모든 CTA는 `rounded-md` 통일 — rounded-full 등 개별 라운드 금지.
- **파괴 위계**: 파괴 보조 액션(항목·행 레벨) = `destructive-ghost`(텍스트/아이콘 동형) ·
  페이지 레벨 파괴 액션 = `destructive-outline` 유지.
  **Control 제외** — Control의 destructive는 면 색이라 글자 대비가 안 나온다
  (가독성 게이트 destructive×background light·dark 한정). Control의 파괴 보조는
  `destructive-outline`(면+글자)을 쓴다.
- **카드 내부 보조 CTA** = outline sm · 텍스트 온리(아이콘 없음).
  수정 토글 = ghost [수정]↔[완료], 편집성 액션(액션 컬럼 등)은 수정 모드에서만 노출.
- **듀얼 CTA 표기**: [주 텍스트 버튼 + 보조 아이콘 버튼] 구성도 같은 변형 계열을 쓴다
  (예: destructive-ghost 텍스트 + destructive-ghost 아이콘).

## 5. 금지 목록 (안티패턴)

- 그라데이션 배경, 임의 그림자, 유리효과(backdrop-blur)
- 카드 안의 카드, 3중 이상 중첩 테두리
- 이모지를 아이콘 대용으로 사용 (아이콘은 lucide-react만)
- 페이지당 primary 버튼 2개 이상
- 본문 텍스트에 `text-xs` (보조 정보에만 허용)
- placeholder를 label 대신 사용

## 6. 생성 절차 요약

요청 접수 → 규정 검토(§0) → 이 문서 확인 → 페이지 생성 → 임의 값 self-check(§1) →
dev 서버 미리보기 제공 → 사용자 승인.
