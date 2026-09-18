# HiNAS 365 디자인 시스템 — 화면 생성 지침

이 문서가 claude.ai 스킬의 본문이다. 스킬에는 "이 주소를 읽고 그대로 따르라"만 들어 있고,
규칙·주소·데이터는 전부 여기와 아래 주소들에 있다. 그래서 DS 가 바뀌어도 스킬을 다시 올릴 필요가 없다.

**원칙: Storybook 에 있는 것이 곧 DS 다.** 목록에 있는 컴포넌트만 쓴다. 없는 것은 직접 만들되 눈에 보이게 표시하고 보고한다.
색·크기·간격을 눈대중으로 정하지 않는다. 전부 아래 주소의 값에서 가져온다.

기준 주소(BASE): `https://designsystemin-md.vercel.app`

## 1. 원천 주소

| 무엇 | 주소 |
|---|---|
| 컴포넌트 목록 | `BASE/ds-registry.json` — `components` 중 `status: "adopted"` 만 사용 가능 |
| 스니펫 목록 | `BASE/story-html/index.json` — 컴포넌트별 스토리 이름·설명·파일 경로 |
| 스니펫 본문 | `BASE/story-html/<키>/<스토리>.html` — 렌더된 HTML, 복사해서 쓴다 |
| 컴포넌트 원문 | `BASE/ui-src/<키>.tsx.txt` · 스토리 원문 `BASE/ui-src/<키>.stories.tsx.txt` |
| 색 토큰 | `BASE/dstk/semantic-map.json` — 토큰 이름 = Tailwind 클래스 이름 |
| 타이포 | `BASE/dstk/typography.json` |
| 허용 클래스 | `BASE/ds-classes.json` — 자가 검사용 전체 클래스 목록 |
| 레이아웃 프레임 | `BASE/docs/layout/README.md` · `BASE/docs/layout/admin-console.md` |
| 본문 패턴 | `BASE/docs/layout/body-patterns.md` — A 리스트 · B 상세 · C 위저드 · D 대시보드 · E 폼 |
| 규칙서 **(필독 — 절차 0번)** | `BASE/docs/design.md` — 스니펫에 안 담기는 사용 규칙·금지 목록 |
| 제품 규정 | `BASE/docs/regulations/<제품>.md` — 해당 제품 화면이면 먼저 읽는다 |
| CSS 번들 | `BASE/ds.css` — 만드는 HTML 이 링크할 단 하나의 스타일시트 |

## 2. 절차 (순서 고정)

0. **규칙서를 읽는다.** `BASE/docs/design.md` 를 먼저 읽는다. 여기에만 있는 규칙이 있다 —
   Label 없는 Input 금지 · 카드 안에 카드 금지 · Badge 를 클릭 액션에 쓰지 않기 ·
   Select 는 선택지 4개 이상일 때 · Tabs 를 페이지 내비에 쓰지 않기 · 본문에 text-xs 금지 ·
   CTA 사이즈·간격·모서리 통일 · 페이지당 primary 1개. 스니펫에는 안 담기는 것들이다.
   제품 화면이면 `BASE/docs/regulations/<제품>.md` 도 함께 읽는다(있으면 규칙서보다 우선).
1. **프레임을 묻는다.** 생성 전에 반드시 한 번 묻고, 답을 받기 전에는 만들지 않는다.
   번호 선택지로 제시한다: `① 메인 레이아웃(사이드바 + 상단바)의 본문` · `② 단독 화면(셸 없음)` · `③ 잘 모르겠다(설명 듣고 정하기)`.
   본문 유형이 뚜렷하면 같이 선언한다. 예: "① 프레임 + A 리스트 본문".
2. **필요한 컴포넌트를 정한다.** `story-html/index.json` 에 있으면 쓸 수 있다(스토리가 있다 = DS 다).
   이름만 보고 짐작하지 않는다.
3. **스니펫을 가져온다.** 쓰려는 컴포넌트마다 `story-html/index.json` 에서 알맞은 스토리를 고르고 그 HTML 을 읽어 **그대로 복사**한 뒤 글자·숫자만 바꾼다. 클래스 조합을 새로 만들지 않는다.
4. **HTML 한 장을 쓴다.** 3장의 규약을 따른다.
5. **자가 검사한다.** 4장 체크리스트를 통과할 때까지 고친다.
6. **보고한다.** 파일을 주고, 끝에 **미채택 목록**(컴포넌트 · 쓰인 자리 · 이유)을 적는다. 없으면 "미채택 없음". 그리고 **프로그레스 포함 여부와 이유**를 한 줄 적는다.

## 3. HTML 규약

- 산출물은 **HTML 파일 한 장**. 사용자가 내려받아 바로 열 수 있어야 한다.
- `<head>` 에 스타일시트는 이 한 줄만. 다른 CSS·CDN·폰트 링크·`<style>` 블록을 넣지 않는다.
  ```html
  <link rel="stylesheet" href="https://designsystemin-md.vercel.app/ds.css">
  ```
- `<body class="bg-background text-foreground antialiased">` 로 시작한다.
  다크는 `<html class="dark">`, Control 제품은 `<html class="theme-control">`.
- **기본 4개 상태를 모두 담는다.** 기본·빈·로딩·에러를 각각 `<section data-state="...">` 로 만들고 기본만 보이게 한다.
  ```html
  <section data-state="default">…</section>
  <section data-state="empty" hidden>…</section>
  <section data-state="loading" hidden>…</section>
  <section data-state="error" hidden>…</section>
  ```
  빈 상태는 Empty 컴포넌트, 로딩은 Skeleton, 에러는 ErrorState 스니펫을 쓴다.
- **프로그레스는 조건부다(2026-09-18 확정).** 업데이트 실행·진단 실행·대량 처리·업로드처럼 **"몇 %"가 실제로 있는 화면**에만
  `<section data-state="progress" hidden>` 을 더해 5개로 한다. 목록·권한 표·상세처럼 진행 개념이 없으면 **넣지 않는다**.
  넣을 때는 진행률 막대가 있는 카드로 그린다(`progress` 컴포넌트 스니펫 사용).
  섹션을 넣었으면 알약 버튼도 같이 넣는다. 한쪽만 있으면 자가 검사에서 걸린다.
  보고서 끝에 **"프로그레스 포함 여부와 이유"를 한 줄** 적는다. 앞 화면을 복사하다 진행률 없는 화면까지 막대가 번진 전례가 있다.
- **상단 중앙 전환 알약**을 넣는다(상태를 눈으로 바꿔 보는 장치). 담은 섹션과 버튼이 1:1 이어야 한다.
  ```html
  <div class="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-card p-1 shadow-card">
    <button data-pick="default" class="rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground">기본</button>
    <button data-pick="empty" class="rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">빈</button>
    <button data-pick="loading" class="rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">로딩</button>
    <button data-pick="error" class="rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">에러</button>
  </div>
  ```
  진행률 화면이면 로딩과 에러 사이에 이 버튼을 넣는다.
  ```html
  <button data-pick="progress" class="rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">프로그레스</button>
  ```
  그리고 `</body>` 앞에:
  ```html
  <script>document.querySelectorAll("[data-pick]").forEach(function(b){b.addEventListener("click",function(){document.querySelectorAll("[data-state]").forEach(function(s){s.hidden=s.dataset.state!==b.dataset.pick});document.querySelectorAll("[data-pick]").forEach(function(x){x.className=(x===b?"rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground":"rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent")})})})</script>
  ```
- **DS 에 없는 요소**는 만들되 반드시 표시한다.
  ```html
  <div data-ds="fallback" class="rounded-md border border-dashed border-muted-foreground/40 p-2">
    <span class="mb-1 block text-xs text-muted-foreground">미채택: 트리 선택기</span>
    …
  </div>
  ```
- **금지**: `#` 으로 시작하는 색값, `w-[300px]` 같은 대괄호 임의 값, `style="…"` 인라인 스타일, 임의 픽셀·색 지정.
  색은 토큰 클래스만 쓴다: `bg-primary` · `text-secondary-foreground` · `border-border` · `bg-muted` 등.
  투명도 변형(`bg-primary/10`)은 `ds-classes.json` 의 `tints` 목록에 있는 것만.

## 4. 자가 검사 체크리스트

`BASE/ds-classes.json` 을 읽어 대조한다. 아래가 전부 통과해야 완성이다.

1. 내가 쓴 모든 `class` 값의 낱개 클래스가 `ds-classes.json` 의 `classes` 안에 있는가. 없으면 스타일이 안 먹으므로 스니펫의 조합으로 되돌린다.
2. `#색값`, 대괄호 임의 값, `style=` 이 하나도 없는가.
3. `data-state` 가 default·empty·loading·error 네 개 다 있는가. 진행률이 실재하는 화면이면 progress 까지 다섯 개인가.
4. 상단 전환 알약과 하단 스크립트가 있는가. 알약 버튼과 `data-state` 섹션이 1:1 로 맞는가.
5. 스타일시트 링크가 `BASE/ds.css` 한 줄뿐인가.
6. 투명도 변형이 `tints` 목록 안인가.
7. `data-ds="fallback"` 으로 감싼 것들을 전부 보고서의 미채택 목록에 적었는가.
8. 보고서에 프로그레스 포함 여부와 이유를 한 줄 적었는가.
9. 규칙서(§0 에서 읽은 `docs/design.md`)의 금지 목록에 걸리는 것이 없는가 —
   Label 없는 Input · 카드 안 카드 · 클릭되는 Badge · 페이지당 primary 2개 이상 · 본문 text-xs · placeholder 로 라벨 대체.

## 5. 레이아웃 요약

- **메인 레이아웃**: 좌측 사이드바(`w-64 border-r bg-card p-4`) + 우측 본문(`p-8`). 상단바는 사이드바 우측부터 화면 끝까지, `bg-card`.
- **페이지 제목**: `text-lg font-bold`. 제목 행은 좌측 제목 + 우측 페이지 액션. 목록의 필터·내보내기 버튼은 제목 행이 아니라 FilterBar 쪽에 둔다.
- **세로 리듬**: 섹션 사이 `space-y-6`, 카드 그리드 `gap-4`, 폼 필드 `space-y-4`.
- **A 리스트 본문 순서**: 제목 행 → FilterBar → Table → ListFooter.
- **B 상세**: 제목 행 → 좌측 요약 패널 + 우측 본문. 패널은 `Card variant="flat"`.
- **D 대시보드**: 스탯 카드 행(`grid-cols-3` 또는 4) + 그 아래 표 카드.
- 더 필요하면 `BASE/docs/layout/body-patterns.md` 를 읽는다.

## 6. 자주 쓰는 컴포넌트 키

`page-header` · `filter-bar` · `table` · `list-footer` · `button` · `badge` · `status-badge` · `card` · `empty` ·
`skeleton` · `error-state` · `tabs` · `dialog` · `sheet` · `select` · `input` · `checkbox` · `sidebar` · `breadcrumb` ·
`timeline` · `stepper` · `heatmap-grid` · `detail-panel` · `progress` · `item`

전체 목록은 항상 `ds-registry.json` 이 기준이다.

## 7. 하지 않는 것

- 프레임 질문을 건너뛰고 바로 만들지 않는다.
- 스니펫을 안 읽고 기억으로 마크업을 쓰지 않는다.
- 미채택 요소를 조용히 넣지 않는다. 반드시 마커와 목록에 남긴다.
- 값이 안 읽히면 지어내지 않는다. "주소를 읽지 못했다"고 말하고 멈춘다.
