import * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

/* ToggleGroup 스토리 — 허브 카드 form-segment(3상태 세그먼트) · form-chipgrid(칩 멀티셀렉트 그리드)의 원문.
 * cva(toggle): variant default · outline / size sm(h-8) · default(h-9) · lg(h-10). spacing 0 = 붙은 세그먼트(끝만 둥글게).
 * data-tabs 카드(탭 3종)도 이 파일을 쓴다 — 배치 3. @storybook import 0. */

export default {
  title: "DS/ToggleGroup",
  component: ToggleGroup,
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["sm", "default", "lg"] },
  },
}

export const Segment = {
  parameters: { vocab: "form-segment" },
  render: () => (
    <ToggleGroup type="single" defaultValue="all" variant="outline">
      <ToggleGroupItem value="all">전체</ToggleGroupItem>
      <ToggleGroupItem value="installed">설치됨</ToggleGroupItem>
      <ToggleGroupItem value="not">미설치</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const ChipGrid = {
  parameters: { vocab: "form-chipgrid" },
  render: () => (
    <ToggleGroup type="multiple" defaultValue={["v350", "v342"]} variant="outline" className="grid grid-cols-4 gap-2">
      <ToggleGroupItem value="v350" className="font-mono text-xs">v3.5.0</ToggleGroupItem>
      <ToggleGroupItem value="v342" className="font-mono text-xs">v3.4.2</ToggleGroupItem>
      <ToggleGroupItem value="v341" className="font-mono text-xs">v3.4.1</ToggleGroupItem>
      <ToggleGroupItem value="v331" className="font-mono text-xs">v3.3.1</ToggleGroupItem>
      <ToggleGroupItem value="v330" className="font-mono text-xs">v3.3.0</ToggleGroupItem>
      <ToggleGroupItem value="v320" className="font-mono text-xs">v3.2.0</ToggleGroupItem>
      <ToggleGroupItem value="v312" className="font-mono text-xs">v3.1.2</ToggleGroupItem>
      <ToggleGroupItem value="v360" className="font-mono text-xs">v3.6.0</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Ghost = {
  render: () => (
    <ToggleGroup type="single" defaultValue="all">
      <ToggleGroupItem value="all">전체</ToggleGroupItem>
      <ToggleGroupItem value="installed">설치됨</ToggleGroupItem>
      <ToggleGroupItem value="not">미설치</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Small = {
  render: () => (
    <ToggleGroup type="single" defaultValue="all" variant="outline" size="sm">
      <ToggleGroupItem value="all">전체</ToggleGroupItem>
      <ToggleGroupItem value="installed">설치됨</ToggleGroupItem>
      <ToggleGroupItem value="not">미설치</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Large = {
  render: () => (
    <ToggleGroup type="single" defaultValue="all" variant="outline" size="lg">
      <ToggleGroupItem value="all">전체</ToggleGroupItem>
      <ToggleGroupItem value="installed">설치됨</ToggleGroupItem>
      <ToggleGroupItem value="not">미설치</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Disabled = {
  render: () => (
    <ToggleGroup type="single" defaultValue="all" variant="outline" disabled>
      <ToggleGroupItem value="all">전체</ToggleGroupItem>
      <ToggleGroupItem value="installed">설치됨</ToggleGroupItem>
      <ToggleGroupItem value="not">미설치</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const __namedExportsOrder = ["Segment", "ChipGrid", "Ghost", "Small", "Large", "Disabled"]
