import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"

/* Select 스토리 — 허브 카드 form-select 의 셀렉트 부분(콤보박스 트리거는 command.stories). size default(h-9) · sm(h-8),
 * placeholder · disabled · 그룹 목록. @storybook import 0. */

export default {
  title: "DS/Select",
  component: Select,
}

const PRODUCTS = (
  <SelectContent>
    <SelectItem value="nav">Navigation</SelectItem>
    <SelectItem value="svm">SVM</SelectItem>
    <SelectItem value="ctrl">Control</SelectItem>
  </SelectContent>
)

export const Default = {
  parameters: { vocab: "form-select" },
  render: () => (
    <Select defaultValue="nav">
      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
      {PRODUCTS}
    </Select>
  ),
}

export const Small = {
  render: () => (
    <Select defaultValue="svm">
      <SelectTrigger size="sm" className="w-56"><SelectValue /></SelectTrigger>
      {PRODUCTS}
    </Select>
  ),
}

export const Placeholder = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56"><SelectValue placeholder="제품 선택" /></SelectTrigger>
      {PRODUCTS}
    </Select>
  ),
}

export const Disabled = {
  render: () => (
    <Select defaultValue="ctrl" disabled>
      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
      {PRODUCTS}
    </Select>
  ),
}

export const Grouped = {
  render: () => (
    <Select defaultValue="kr">
      <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>선급</SelectLabel>
          <SelectItem value="kr">KR</SelectItem>
          <SelectItem value="nk">NK</SelectItem>
          <SelectItem value="bv">BV</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>해외</SelectLabel>
          <SelectItem value="lr">LR</SelectItem>
          <SelectItem value="dnv">DNV</SelectItem>
          <SelectItem value="abs" disabled>ABS (준비 중)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const __namedExportsOrder = ["Default", "Small", "Placeholder", "Disabled", "Grouped"]
