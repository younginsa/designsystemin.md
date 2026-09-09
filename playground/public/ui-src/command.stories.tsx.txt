import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command"

/* Command 스토리 — 허브 카드 form-select 의 콤보박스 트리거(Combobox) + 열린 명령 목록(Palette).
 * 콤보박스 = Button outline role=combobox 트리거 + Popover 안의 Command(검색 · 목록). @storybook import 0. */

export default {
  title: "DS/Command",
  component: Command,
}

export const Combobox = {
  parameters: { vocab: "form-select" },
  render: () => (
    <Button variant="outline" role="combobox" className="w-56 justify-between font-normal text-muted-foreground">
      버전 검색… <ChevronDown className="opacity-50" />
    </Button>
  ),
}

export const Palette = {
  render: () => (
    <Command className="w-72 rounded-md border">
      <CommandInput placeholder="Hull 번호 또는 선명 검색" />
      <CommandList>
        <CommandEmpty>결과 없음</CommandEmpty>
        <CommandGroup heading="호선">
          <CommandItem>Hull 1001 · ONE APUS 005</CommandItem>
          <CommandItem>Hull 1002 · HYUNDAI GLOBE 001</CommandItem>
          <CommandItem disabled>Hull 1003 · (인도 완료)</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="동작">
          <CommandItem>새 호선 등록 <CommandShortcut>⌘N</CommandShortcut></CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

export const __namedExportsOrder = ["Combobox", "Palette"]
