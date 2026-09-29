# FE 요청 — 버전 조건 필터 칩 (VersionFilterChip)
컴포넌트 키 `version-filter-chip` · 섹션 Form · 생성일 2026-09-29
## 무엇
FE Storybook 에 `version-filter-chip` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **1곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/ships/ships-view.tsx`
## 설계 노트 (우리 기록)

- 조합 제작 — @ds/ui/ui/version-filter-chip. 계층 캐스케이드 필터 칩(구 필터 모달 폐기 → 칩 아래 패널): 제품 선택 → 공통버전 등장 → 제품버전 등장 순차 노출. 다중 조건 [+ 추가] — 제품 간 AND · 같은 제품 OR(구 모달 규칙 승계). 칩 = FilterChip 기본형 문법(h-9 · muted 면 · 꺾쇠 · 활성 = 파란 테두리+글자). 라벨 기본 '제품'(한국어 헤더 규칙) · 적용 요약 = 버전 포함 '제품 · navigation · 1.2.0 · 1.5.2', 2건 이상은 '첫 조건 외 N건'(2026-08-26 개정). 패널 = 드래프트 편집 → [적용] 확정 · [취소] 폐기 · [초기화] 좌하단 · 풀블리드 구분선. 내부는 채택분 조합(ov-popover·form-select·btn-basic) — 손 구현 금지

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/version-filter-chip.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/version-filter-chip.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/version-filter-chip.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-versionfilterchip--docs |
### 스토리 3편 — 이만큼이 필요한 상태입니다
- **Applied**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/version-filter-chip/applied.html
- **Empty**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/version-filter-chip/empty.html
- **Multiple**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/version-filter-chip/multiple.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `label` | string | 선택 | 기본 `제품` |  |
| `products` | string[] | 필수 | - |  |
| `commonVersions` | string[] | 필수 | - |  |
| `productVersions` | Record<string, string[]> | 필수 | - |  |
| `value` | VersionRow[] | 필수 | - | 적용된 조건(빈 배열 = 미적용) |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
