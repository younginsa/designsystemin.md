import * as React from "react"

import { SearchBox, type SearchSuggestion } from "./search-box"

/* SearchBox 스토리 — 검색 제안(search-box 카드). 입력 포커스 시 최근 검색(최대 3) + 빠른검색(최대 5) 패널, 입력 중엔 후보 자동완성.
 * 허브 카드는 패널이 포털이라 /shadcn-preview/search-box 라우트를 iframe 으로 담는다(같은 데이터). controlled — Demo 래퍼. @storybook import 0. */

export default {
  title: "DS/SearchBox",
  component: SearchBox,
}

const CANDIDATES: SearchSuggestion[] = [
  { label: "SVM_BUSAN_1", sub: "IMO 9876543" },
  { label: "SVM_BUSAN_2", sub: "IMO 9876544" },
  { label: "CONTROL_TEST", sub: "IMO 9876545" },
  { label: "REAL_FINAL_TEST", sub: "IMO 9876546" },
  { label: "NAV_ULSAN_1", sub: "IMO 9876547" },
]

function Demo({ initial = "" }: { initial?: string }) {
  const [value, setValue] = React.useState(initial)
  return (
    <div style={{ width: 480 }}>
      <SearchBox
        placeholder="호선 검색"
        value={value}
        onChange={setValue}
        candidates={CANDIDATES}
        recentInitial={["SVM_BUSAN_1", "CONTROL_TEST", "부산"]}
        quick={["SVM", "부산", "테스트 호선", "v4.0.0", "Pending"]}
      />
    </div>
  )
}

export const Default = {
  parameters: { vocab: "search-box" },
  render: () => <Demo />,
}

export const Typing = {
  render: () => <Demo initial="SVM" />,
}

export const __namedExportsOrder = ["Default", "Typing"]
