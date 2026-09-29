# FE 요청 — 페이지 헤더 (타이틀 행) (PageHeader)
컴포넌트 키 `page-header` · 섹션 Navigation · 생성일 2026-09-29
## 무엇
FE Storybook 에 `page-header` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **23곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/accounts/page.tsx`
- `playground/app/gallery/hinas365/compatibility/page.tsx`
- `playground/app/gallery/hinas365/dashboard/page.tsx`
- `playground/app/gallery/hinas365/dev-qa/page.tsx`
- `playground/app/gallery/hinas365/diagnostics/detail/page.tsx`
- `playground/app/gallery/hinas365/diagnostics/page.tsx`
- `playground/app/gallery/hinas365/permissions/page.tsx`
- `playground/app/gallery/hinas365/release-notes/page.tsx`
- `playground/app/gallery/hinas365/ships/ships-view.tsx`
- `playground/app/gallery/hinas365/updates/page.tsx`
- `playground/app/gallery/sales365/accounts/detail/page.tsx`
- `playground/app/gallery/sales365/accounts/page.tsx`
- `playground/app/gallery/sales365/contracts/detail/page.tsx`
- `playground/app/gallery/sales365/contracts/new/page.tsx`
- `playground/app/gallery/sales365/contracts/page.tsx`
- `playground/app/gallery/sales365/deliveries/detail/page.tsx`
- `playground/app/gallery/sales365/deliveries/page.tsx`
- `playground/app/gallery/sales365/products/page.tsx`
- `playground/app/gallery/sales365/subscriptions/page.tsx`
- `playground/app/gallery/sales365/users/detail/page.tsx`
- `playground/app/gallery/sales365/users/page.tsx`
- `playground/app/gallery/sales365/vessels/detail/page.tsx`
- `playground/app/gallery/sales365/vessels/page.tsx`
## 설계 노트 (우리 기록)

- 조합 제작 — @ds/ui/ui/page-header(2026-09-16 신설). 갤러리 22면의 타이틀 행 손 조합(flex flex-wrap items-center justify-between gap-4 + h1 text-lg font-bold)을 한 프리셋으로. props: title(h1 text-lg font-bold) · description(부제 — 있을 때만 items-start, design.md §4) · addon(제목 옆 인라인: StatusBadge·Info 툴팁) · leading(제목 앞: 아바타) · actions(우측 페이지 레벨 액션 — 파괴적 액션·StatePreview). 목록 액션·CTA는 여기가 아니라 FilterBar actions 슬롯, "총 N건" 부제 금지(ListFooter 소유). 손 조합 금지 — 갤러리 22면 치환은 클론 프롬프트.

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/page-header.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/page-header.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/page-header.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-pageheader--docs |
### 스토리 3편 — 이만큼이 필요한 상태입니다
- **Default** — 제목 + 우측 페이지 레벨 액션(파괴적 액션은 아웃라인 파괴형)
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/page-header/default.html
- **Description** — 부제 — 설명 텍스트가 있을 때만 행이 items-start
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/page-header/description.html
- **Addon** — 제목 옆 addon — 상태 배지 · 설명 툴팁(Info)
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/page-header/addon.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `title` | ReactNode | 필수 | - | 페이지 제목 — h1 text-lg font-bold |
| `description` | ReactNode | 선택 | - | 부제(설명 텍스트). 있을 때만 행이 items-start 가 된다 |
| `addon` | ReactNode | 선택 | - | 제목 옆 인라인 — 상태 배지·설명 툴팁 등 |
| `leading` | ReactNode | 선택 | - | 제목 앞 — 아바타 등 |
| `actions` | ReactNode | 선택 | - | 우측 페이지 레벨 액션(파괴적 액션·StatePreview 등) |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
