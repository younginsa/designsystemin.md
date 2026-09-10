import * as React from "react"
import { Globe, Layers } from "lucide-react"

import { IconSelect } from "./icon-select"

/* IconSelect 스토리 — 허브 카드 icon-select(아이콘 셀렉터)의 원문. 아이콘형(icon) · 텍스트형(icon 생략) · 다중형(multiple, 항목 = Checkbox).
 * 플로팅 패널은 Popover(포털) — 직접 포지셔닝 금지 규칙의 프리셋. @storybook import 0. */

export default {
  title: "DS/IconSelect",
  component: IconSelect,
}

const TZ = [
  { value: "kst", label: "KST +9" },
  { value: "utc", label: "UTC +0" },
]

export const Default = {
  parameters: { vocab: "icon-select" },
  render: () => <IconSelect icon={Globe} value="kst" sub="2026-07-30" items={TZ} />,
}

export const Text = {
  render: () => (
    <IconSelect
      value="nav"
      heading="제품"
      items={[
        { value: "nav", label: "Navigation", hint: "v3.5.3" },
        { value: "svm", label: "SVM", hint: "v1.2.0" },
        { value: "ctrl", label: "Control", hint: "v2.1.0" },
      ]}
    />
  ),
}

export const Multiple = {
  render: () => (
    <IconSelect
      icon={Layers}
      multiple
      heading="표시 열"
      values={["imo", "name"]}
      items={[
        { value: "imo", label: "IMO" },
        { value: "name", label: "호선명" },
        { value: "owner", label: "선주" },
      ]}
    />
  ),
}

export const Open = {
  render: () => <IconSelect icon={Globe} value="kst" sub="2026-07-30" items={TZ} defaultOpen />,
}

export const __namedExportsOrder = ["Default", "Text", "Multiple", "Open"]
