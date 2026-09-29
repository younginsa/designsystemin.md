# FE 요청 — 아이콘 셀렉터 (IconSelect)
컴포넌트 키 `icon-select` · 섹션 Form · 생성일 2026-09-29
## 무엇
FE Storybook 에 `icon-select` 가 없습니다. 만들어 주세요. 만들어지면 우리 쪽 원천이 자동으로 FE 로 바뀝니다(매시간 동기화).
## 왜
현재 생성 화면 **2곳**에서 쓰고 있습니다.

- `playground/app/gallery/hinas365/layout.tsx`
- `playground/app/gallery/sales365/layout.tsx`
## 설계 노트 (우리 기록)

- 조합 제작 — @ds/ui/ui/icon-select. shadcn DropdownMenu 프리셋. 타입 3종: 아이콘형(icon 지정)·텍스트형(icon 생략)·다중형(multiple — 왼쪽 Checkbox 상시, 토글해도 안 닫힘, 값은 items 순서 ", " 병합). 단일 ✓는 오른쪽 ml-auto(2026-08-26 select-grammar 개정). h-9(36px)·아이콘 간격 8px·그림자 없음(플랫) — 손 구현 금지

## 사양 — 우리 구현이 사양서입니다
| 무엇 | 주소 |
|---|---|
| 컴포넌트 원문 | https://designsystemin-md.vercel.app/ui-src/icon-select.tsx.txt |
| 스토리 원문 | https://designsystemin-md.vercel.app/ui-src/icon-select.stories.tsx.txt |
| 프롭 목록 | https://designsystemin-md.vercel.app/props/icon-select.json |
| Storybook | https://designsystemin-md.vercel.app/storybook/?path=/docs/ds-iconselect--docs |
### 스토리 4편 — 이만큼이 필요한 상태입니다
- **Default**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/icon-select/default.html
- **Text**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/icon-select/text.html
- **Multiple**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/icon-select/multiple.html
- **Open**
  렌더 HTML: https://designsystemin-md.vercel.app/story-html/icon-select/open.html
### 프롭

| 이름 | 타입 | 필수 | 값·기본 | 설명 |
|---|---|---|---|---|
| `icon` | LucideIcon | 선택 | - | 아이콘형/텍스트형 — 아이콘을 생략하면 텍스트형 트리거가 된다 |
| `value` | string | 선택 | - |  |
| `items` | IconSelectItem[] | 필수 | - |  |
| `multiple` | boolean | 선택 | - | 다중형 — 항목이 Checkbox가 되고 토글해도 패널이 닫히지 않는다 |
| `values` | string[] | 선택 | - | 다중형 선택값. items 순서로 정규화되어 전달된다 |
| `heading` | string | 선택 | - |  |
| `sub` | string | 선택 | - |  |
| `align` | enum | 선택 | `start` · `end` |  |
| `defaultOpen` | boolean | 선택 | - |  |

## 확인 방법
만드신 뒤 Storybook 을 배포하시면 됩니다. 우리 쪽에서 매시간 확인해 가져가고,
우리 토큰 CSS 위에서 렌더가 같은지 자동으로 대조합니다(다르면 우리 쪽에서 잡습니다).
색·타이포는 우리 토큰 파일을 그대로 쓰시면 됩니다: https://designsystemin-md.vercel.app/dstk/semantic-map.json · https://designsystemin-md.vercel.app/dstk/typography.json
