import * as React from "react"

import { StatusBadge, type StatusTone } from "./status-badge"

/* StatusBadge 스토리 — 상태 필 · 도트(data-status 카드)의 원문. FE status-badge.tsx 와 같은 API(label · tone · dot · bg · mono), 톤은 DS 색 4종.
 * 스토리 이름은 FE Storybook(Default · All Tones · With Dot · Without Background · Mono)과 맞춘다. @storybook import 0. */

export default {
  title: "DS/StatusBadge",
  component: StatusBadge,
  argTypes: {
    tone: { control: "select", options: ["neutral", "success", "error", "progress"] },
    dot: { control: "boolean" },
    bg: { control: "boolean" },
    mono: { control: "boolean" },
  },
}

const ALL_TONES: StatusTone[] = ["neutral", "success", "error", "progress"]

export const Default = {
  render: () => <StatusBadge label="활성화 완료" tone="success" />,
}

export const AllTones = {
  parameters: { vocab: "data-status" },
  render: () => (
    <>
      {ALL_TONES.map((tone) => <StatusBadge key={tone} label={tone} tone={tone} />)}
    </>
  ),
}

export const WithDot = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {ALL_TONES.map((tone) => <StatusBadge key={tone} label={tone} tone={tone} dot />)}
    </div>
  ),
}

export const WithoutBackground = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {ALL_TONES.map((tone) => <StatusBadge key={tone} label={tone} tone={tone} bg={false} />)}
    </div>
  ),
}

export const Mono = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge label="v1.2.3" tone="success" mono />
      <StatusBadge label="2026-09-10" tone="progress" mono />
      <StatusBadge label="IMO9876543" tone="neutral" mono />
    </div>
  ),
}

export const __namedExportsOrder = ["Default", "AllTones", "WithDot", "WithoutBackground", "Mono"]
