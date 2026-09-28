import * as React from "react"

import { SearchBox, type SearchSuggestion } from "./search-box"

/* SearchBox 스토리 — 검색 제안(search-box 카드). 입력 포커스 시 최근 검색(최대 3) + 빠른검색(최대 5) 패널, 입력 중엔 후보 자동완성.
 * 허브 카드는 패널이 포털이라 /shadcn-preview/search-box 라우트를 iframe 으로 담는다(같은 데이터). controlled — Demo 래퍼. @storybook import 0.
 * args 형(2026-09-23 Phase 2): initial(입력값)·open(패널 열림) — /render/search-box/<스토리>?args={"initial":"SVM"} 으로 값 있는 상태(✕ 클리어 버튼)를 받는다.
 * 조건부 커버: value → Typing·NoMatch(값 있음 = ✕ 노출) · open → NoMatch(패널 열림) */

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

type DemoProps = {
  /** 처음 입력돼 있는 값 — 비어 있지 않으면 ✕(검색어 지우기)가 나온다 */
  initial?: string
  recent?: string[]
  quick?: string[]
  /** 미리보기 전용 — 패널 열린 채 렌더 */
  open?: boolean
}

function Demo({
  initial = "",
  recent = ["SVM_BUSAN_1", "CONTROL_TEST", "부산"],
  quick = ["SVM", "부산", "테스트 호선", "v4.0.0", "Pending"],
  open = false,
}: DemoProps) {
  const [value, setValue] = React.useState(initial)
  return (
    <div style={{ width: 480 }}>
      <SearchBox
        placeholder="호선 검색"
        value={value}
        onChange={setValue}
        candidates={CANDIDATES}
        recentInitial={recent}
        quick={quick}
        defaultOpen={open}
      />
    </div>
  )
}

export const Default = {
  parameters: { vocab: "search-box" },
  args: { initial: "", open: false },
  render: (args: DemoProps) => <Demo {...args} />,
}

/** 입력 중 — 값이 있으면 ✕(검색어 지우기)가 붙고 후보 자동완성이 뜬다 */
export const Typing = {
  args: { initial: "SVM" },
  render: (args: DemoProps) => <Demo {...args} />,
}

/** 결과 없음 — 입력 중 후보 0건, 한 줄(2026-09-11 확정). 자유 검색어는 그대로 유효(종전엔 최근 검색으로 되돌아가 매칭처럼 보였다).
 *  기록 없음(최근·빠른검색 둘 다 없음)은 별도 상태가 아니다 — 보여줄 게 없으면 패널이 안 열린다 */
export const NoMatch = {
  args: { initial: "zzz", open: true },
  render: (args: DemoProps) => <Demo {...args} />,
}

export const __namedExportsOrder = ["Default", "Typing", "NoMatch"]
