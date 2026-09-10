import * as React from "react"
import { Search, X } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "./input-group"

/* InputGroup 스토리 — 허브 카드 form-search(검색 인풋)의 원문. 애드온 align inline-start(기본) · inline-end · block-start · block-end,
 * InputGroupButton size xs(h-6) · sm · icon-xs · icon-sm. FilterBar 검색창 · SearchBox 의 바탕. @storybook import 0. */

export default {
  title: "DS/InputGroup",
  component: InputGroup,
}

export const Search_ = {
  name: "Search",
  parameters: { vocab: "form-search" },
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput placeholder="키워드 검색" />
    </InputGroup>
  ),
}

export const WithClear = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput defaultValue="SVM_BUSAN" aria-label="검색어" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="지우기">
          <X />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const PrefixSuffix = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <InputGroupText>IMO</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput defaultValue="9800685" aria-label="IMO" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>7자리</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const Invalid = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput defaultValue="!!" aria-invalid aria-label="invalid" />
    </InputGroup>
  ),
}

export const __namedExportsOrder = ["Search_", "WithClear", "PrefixSuffix", "Invalid"]
