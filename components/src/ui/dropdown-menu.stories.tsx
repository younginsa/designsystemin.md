import * as React from "react"
import { ChevronDown, Pencil, Settings2, Trash2 } from "lucide-react"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./dropdown-menu"

/* DropdownMenu 스토리 — 드롭다운 메뉴(ov-menus). 허브 카드는 포털이라 /shadcn-preview/overlay?c=menus 를 iframe 으로 담는다.
 * Content = min-w-[8rem] rounded-md border bg-popover p-1 shadow-md · Item px-2 py-1.5 gap-2 rounded-sm text-sm(svg 16 secondary-foreground) · variant destructive = text-destructive(focus bg-destructive/10).
 * @storybook import 0. */

export default {
  title: "DS/DropdownMenu",
  component: DropdownMenu,
}

export const Open = {
  parameters: { vocab: "ov-menus" },
  render: () => (
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">도구 및 관리 <ChevronDown /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>호선 관리</DropdownMenuLabel>
        <DropdownMenuItem><Pencil /> 정보 수정</DropdownMenuItem>
        <DropdownMenuItem><Settings2 /> 옵션 변경</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive"><Trash2 /> 제품 삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

export const CheckboxAndRadio = {
  render: () => (
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">표시 열 <ChevronDown /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>열</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>IMO</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>호선명</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>선주</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>정렬</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="created">
          <DropdownMenuRadioItem value="created">생성일 <DropdownMenuShortcut>⌘1</DropdownMenuShortcut></DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name">호선명 <DropdownMenuShortcut>⌘2</DropdownMenuShortcut></DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

export const __namedExportsOrder = ["Open", "CheckboxAndRadio"]
