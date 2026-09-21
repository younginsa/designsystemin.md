# HiNAS 365 디자인 시스템 — 화면 생성 지침

이 문서가 claude.ai 스킬의 본문이다. 스킬에는 "이 주소를 읽고 그대로 따르라"만 들어 있고,
규칙·주소·데이터는 전부 여기와 아래 주소들에 있다. 그래서 DS 가 바뀌어도 스킬을 다시 올릴 필요가 없다.

**원칙: Storybook 에 있는 것이 곧 DS 다.** 목록에 있는 컴포넌트만 쓴다. 없는 것은 직접 만들되 눈에 보이게 표시하고 보고한다.
색·크기·간격을 눈대중으로 정하지 않는다. 전부 아래 주소의 값에서 가져온다.

기준 주소(BASE): `https://designsystemin-md.vercel.app`

## 1. 원천 주소

| 무엇 | 주소 |
|---|---|
| 컴포넌트 목록 | `BASE/story-html/index.json` — 여기 있으면 쓸 수 있다(스토리가 있다 = DS 다). 스토리마다 `slots`(그 사진에 찍힌 부품)·`filled`(값 채워진 입력이 있나), 컴포넌트마다 `conditional`(값이 있을 때만 나오는 UI — 사진에 없을 수 있다) |
| 관리 기록 | `BASE/ds-registry.json` — 피그마 세트·설계 노트. 생성에 꼭 필요하진 않다 |
| 스니펫 본문 | `BASE/story-html/<키>/<스토리>.html` — 렌더된 HTML, 복사해서 쓴다 |
| 컴포넌트 원문 | `BASE/ui-src/<키>.tsx.txt` · 스토리 원문 `BASE/ui-src/<키>.stories.tsx.txt` |
| 색 토큰 | `BASE/dstk/semantic-map.json` — 토큰 이름 = Tailwind 클래스 이름 |
| 타이포 | `BASE/dstk/typography.json` |
| 허용 클래스 | `BASE/ds-classes.json` — 자가 검사용 전체 클래스 목록 |
| 레이아웃 프레임 | `BASE/docs/layout/README.md` · `BASE/docs/layout/admin-console.md` |
| 본문 패턴 | `BASE/docs/layout/body-patterns.md` — A 리스트 · B 상세 · C 위저드 · D 대시보드 · E 폼 |
| 규칙서 **(필독 — 절차 0번)** | `BASE/docs/design.md` — 스니펫에 안 담기는 사용 규칙·금지 목록 |
| 제품 규정 | `BASE/docs/regulations/<제품>.md` — 해당 제품 화면이면 먼저 읽는다 |
| 검토 체크리스트 | `BASE/docs/review-checklist.md` — 디자이너가 결과물에서 보는 것(스펙 섹션 5줄) |
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
3. **스니펫을 가져온다 — 모양은 사진, 규칙은 원문.**
   (a) 쓰려는 컴포넌트마다 `story-html/index.json` 에서 **내가 만들 상태에 맞는 스토리**를 고른다. 고르는 기준은 이름이 아니라
       `slots` 와 `filled` 다 — 값이 들어간 검색창을 만들면 `filled: true` 인 스토리를, 칩이 붙은 필터바를 만들면 `slots` 에 칩이 있는 스토리를 고른다.
   (b) **부품은 부품의 스토리를 본다.** 필터바 안의 검색창을 채우려면 필터바 사진이 아니라 `search-box` 의 스토리를 본다.
       화면 단위로 고르다 부품 단위를 건너뛰면 ✕ 같은 조건부 UI 가 빠진다(2026-09-20 사고).
   (c) 그 HTML 을 읽어 **그대로 복사**한 뒤 글자·숫자만 바꾼다. 클래스 조합을 새로 만들지 않는다.
   (d) 값·개수·선택 상태를 사진과 **다르게** 넣으면, 그 컴포넌트의 `conditional` 목록을 본다. 거기 적힌 UI(클리어 ✕, 칩 제거 ✕,
       카운트 배지, 비활성 처리)는 값이 있을 때만 나오므로 사진에 안 찍혀 있다. 맞는 스토리가 없으면 `ui-src/<키>.tsx.txt` 원문에서
       그 값이 켜는 요소를 확인하고, **그 컴포넌트 이름을 스펙 섹션 "원문까지 읽은 컴포넌트" 줄에 적는다**(스토리 누락 신고).
   (e) `index.json` 에 없는 컴포넌트는 DS 가 아니다. 스토리가 없는 부품(separator·avatar·scroll-area·toggle)도 마찬가지 —
       클래스가 ds.css 에 있어도 직접 조립하지 않는다. 필요하면 DS 밖 요소로 표시한다.
4. **HTML 한 장을 쓴다.** 3장의 규약을 따른다. 흐름(목록 → 상세 → 다이얼로그)이면 한 파일에 `data-view` 섹션으로 담는다.
5. **자가 검사한다.** 4장 체크리스트를 통과할 때까지 고친다.
6. **보고한다.** 파일 안의 **스펙 섹션**(8장)이 보고서다. 채팅에는 파일과 스펙 섹션 맨 위 5줄만 옮겨 적는다.

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
  <script>document.querySelectorAll("[data-pick]").forEach(function(b){b.addEventListener("click",function(){document.querySelectorAll("section[data-state]").forEach(function(s){s.hidden=s.dataset.state!==b.dataset.pick});document.querySelectorAll("[data-pick]").forEach(function(x){x.className=(x===b?"rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground":"rounded-full px-3 py-1 text-xs text-secondary-foreground hover:bg-accent")})})})</script>
  ```
  선택자는 반드시 `section[data-state]` 다. `[data-state]` 만 쓰면 탭·팝오버 트리거(같은 속성을 쓴다)까지 숨긴다.
- **DS 에 없는 요소**는 만들되 반드시 표시한다.
  ```html
  <div data-ds="fallback" class="rounded-md border border-dashed border-muted-foreground/40 p-2">
    <span class="mb-1 block text-xs text-muted-foreground">DS에 없음: 트리 선택기</span>
    …
  </div>
  ```
- **금지**: `#` 으로 시작하는 색값, `w-[300px]` 같은 대괄호 임의 값, `style="…"` 인라인 스타일, 임의 픽셀·색 지정.
  색은 토큰 클래스만 쓴다: `bg-primary` · `text-secondary-foreground` · `border-border` · `bg-muted` 등.
  투명도 변형(`bg-primary/10`)도 같은 규칙이다 — `ds-classes.json` 의 `classes` 에 있으면 쓰고, 없으면 못 쓴다.

## 4. 자가 검사 체크리스트

`BASE/ds-classes.json` 을 읽어 대조한다. 아래가 전부 통과해야 완성이다.

1. 내가 쓴 모든 `class` 값의 낱개 클래스가 `ds-classes.json` 의 `classes` 안에 있는가. 없으면 스타일이 안 먹으므로 스니펫의 조합으로 되돌린다.
2. `#색값`, 대괄호 임의 값, `style=` 이 하나도 없는가.
3. `data-state` 가 default·empty·loading·error 네 개 다 있는가. 진행률이 실재하는 화면이면 progress 까지 다섯 개인가.
4. 상단 전환 알약과 하단 스크립트가 있는가. 알약 버튼과 `data-state` 섹션이 1:1 로 맞는가.
5. 스타일시트 링크가 `BASE/ds.css` 한 줄뿐인가.
6. (1번 검사에 포함 — 투명도 변형도 클래스 목록으로 함께 판정한다)
7. `data-ds="fallback"` 으로 감싼 것들을 전부 보고서에 적었는가.
8. 보고서에 프로그레스 포함 여부와 이유를 한 줄 적었는가.
9. 규칙서(§0 에서 읽은 `docs/design.md`)의 금지 목록에 걸리는 것이 없는가 —
   Label 없는 Input · 카드 안 카드 · 클릭되는 Badge · 페이지당 primary 2개 이상 · 본문 text-xs · placeholder 로 라벨 대체.
10. **역산 검사.** 완성된 HTML 의 `data-slot` 값을 전부 뽑아 컴포넌트 이름으로 묶는다(`input-group-control` → input-group).
    그 목록의 컴포넌트가 전부 `index.json` 에 있는가. 없는 것(separator 등)을 썼으면 위반이다.
11. 값을 채운 컨트롤마다 그 컴포넌트의 `conditional` 에 적힌 UI 가 HTML 에 있는가. 없으면 3(d) 로 돌아간다.
12. 스펙 섹션(8장)이 있고 맨 위 5줄이 채워져 있는가.

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
- DS 에 없는 요소를 조용히 넣지 않는다. 반드시 마커와 목록에 남긴다.
- 스니펫에 없다는 이유로 "그 UI 는 DS 에 없다"고 단정하지 않는다. 스니펫은 한 상태만 찍혀 있다. 없다고 말하기 전에 `conditional` 과 원문을 본다.
- 값이 안 읽히면 지어내지 않는다. "주소를 읽지 못했다"고 말하고 멈춘다.
- **"최신이냐"고 물으면** 기억으로 답하지 않는다. `index.json` 의 `generated` 와 `ds-registry.json` 의 `updated` 를 읽어
  "컴포넌트 목록 YYYY-MM-DD · 스니펫 YYYY-MM-DD" 형식으로만 답한다.

## 8. 스펙 섹션 — 파일 안의 보고서

산출물 HTML 에 `<section data-view="spec" hidden>` 을 하나 둔다. 화면 우상단의 「스펙」 버튼으로 연다.
이 섹션이 보고서다. 엔지니어는 이걸로 개발 요청을 받고, 디자이너는 맨 위 5줄만 본다.

**맨 위 5줄(순서 고정)** — 검토자가 이것만 읽는다.
```html
<section data-view="spec" hidden class="space-y-6">
  <dl class="grid grid-cols-[12rem_1fr] gap-x-6 gap-y-2 text-sm">
    <dt class="text-secondary-foreground">DS 갱신일</dt><dd>컴포넌트 목록 2026-09-21 · 스니펫 2026-09-21</dd>
    <dt class="text-secondary-foreground">DS 밖 요소</dt><dd>0개</dd>
    <dt class="text-secondary-foreground">원문까지 읽은 컴포넌트</dt><dd>0개</dd>
    <dt class="text-secondary-foreground">값 채운 컨트롤</dt><dd>2개 · 조건부 확인됨(search-box ✕, filter-chip ✕)</dd>
    <dt class="text-secondary-foreground">프로그레스</dt><dd>제외 — 목록 화면, 진행률 없음</dd>
  </dl>
  …
</section>
```
- **DS 갱신일**: `index.json.generated` · `ds-registry.json.updated`.
- **DS 밖 요소**: `data-ds="fallback"` 개수. 0 이 아니면 아래 표에 "컴포넌트 · 쓰인 자리 · 이유"를 적고,
  파일 상단에 배너 `DS 밖 요소 N개 — 개발 전 디자이너 확인` 을 띄운다.
- **원문까지 읽은 컴포넌트**: 3(d) 에서 스토리가 없어 원문을 본 것. 0 이 아니면 스토리 누락 신고다.
- **값 채운 컨트롤**: 값·선택을 넣은 컨트롤 수와, 각각 `conditional` UI 를 확인했다는 표시.
- **프로그레스**: 포함/제외와 이유 한 줄.

**그 아래(엔지니어용)**
- 화면 목록(흐름이면 각 `data-view` 이름과 역할)
- 필드 표: 이름 · 타입 · 필수 · 예시 값(샘플 표시) — BE 가 데이터 모델을 여기서 읽는다
- 상태: 기본·빈·로딩·에러(·프로그레스) 각각 무엇을 보여주나
- 액션: 버튼·링크마다 "누르면 무엇이 일어나나"
- 내가 정한 것: 컬럼 선택·상태 이름·정보 위계처럼 규칙이 아니라 판단으로 정한 항목과 그 이유
- 원본 프롬프트

**뷰 전환** — 알약 옆에 「스펙」 버튼 하나. `data-view` 섹션은 상태 섹션과 별개로 동작한다.
```html
<button data-view-pick="spec" class="fixed top-4 right-4 z-50 rounded-full border border-border bg-card px-3 py-1 text-xs text-secondary-foreground hover:bg-accent">스펙</button>
<script>document.querySelectorAll("[data-view-pick]").forEach(function(b){b.addEventListener("click",function(){var on=document.querySelector('section[data-view="'+b.dataset.viewPick+'"]');if(!on)return;var show=on.hidden;document.querySelectorAll("section[data-view]").forEach(function(s){s.hidden=true});on.hidden=!show;if(!show){var d=document.querySelector('section[data-view="default"]');if(d)d.hidden=false}})})</script>
```
흐름의 화면들은 `section[data-view="list"]`, `"detail"` 처럼 이름을 붙이고, 기본 화면 하나는 `data-view="default"` 로 둔다.
