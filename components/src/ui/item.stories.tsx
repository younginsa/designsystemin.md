import * as React from "react"
import { Boxes, ChevronRight, Database, Monitor } from "lucide-react"

import { Badge } from "./badge"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "./item"

/* Item 스토리 — 허브 카드 data-kv(kv 정의 목록) · data-listrow(리스트 행)의 원문.
 * cva variant default · outline · muted / size default(gap-4 p-4) · sm(gap-2.5 px-4 py-3). ItemMedia variant default · icon(size-8 rounded-sm border bg-muted) · image. @storybook import 0. */

export default {
  title: "DS/Item",
  component: Item,
  argTypes: {
    variant: { control: "select", options: ["default", "outline", "muted"] },
    size: { control: "select", options: ["default", "sm"] },
  },
}

export const KeyValue = {
  parameters: { vocab: "data-kv" },
  render: () => (
    <ItemGroup>
      <Item size="sm"><ItemContent><ItemDescription>IMO</ItemDescription><ItemTitle>9876543</ItemTitle></ItemContent></Item>
      <Item size="sm"><ItemContent><ItemDescription>호선명</ItemDescription><ItemTitle>SVM_BUSAN_1</ItemTitle></ItemContent></Item>
      <Item size="sm"><ItemContent><ItemDescription>Yard</ItemDescription><ItemTitle>HMD</ItemTitle></ItemContent></Item>
    </ItemGroup>
  ),
}

export const ListRow = {
  parameters: { vocab: "data-listrow" },
  render: () => (
    <ItemGroup className="gap-2">
      <Item variant="outline" size="sm">
        <ItemMedia><Monitor className="size-4" /></ItemMedia>
        <ItemContent><ItemTitle>Remote Support</ItemTitle></ItemContent>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Item>
      <Item variant="outline" size="sm">
        <ItemMedia><Boxes className="size-4" /></ItemMedia>
        <ItemContent><ItemTitle>Docker Image List</ItemTitle></ItemContent>
        <Badge variant="secondary" className="rounded-full">34</Badge>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Item>
      <Item variant="outline" size="sm">
        <ItemMedia><Database className="size-4" /></ItemMedia>
        <ItemContent><ItemTitle>Storage Data List</ItemTitle></ItemContent>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Item>
    </ItemGroup>
  ),
}

export const Variants = {
  render: () => (
    <ItemGroup className="w-96 gap-2">
      <Item><ItemMedia variant="icon"><Monitor /></ItemMedia><ItemContent><ItemTitle>default · default</ItemTitle><ItemDescription>gap-4 p-4</ItemDescription></ItemContent></Item>
      <Item variant="outline"><ItemContent><ItemTitle>outline · default</ItemTitle><ItemDescription>border-border</ItemDescription></ItemContent></Item>
      <Item variant="muted" size="sm"><ItemContent><ItemTitle>muted · sm</ItemTitle><ItemDescription>bg-muted/50 · gap-2.5 px-4 py-3</ItemDescription></ItemContent></Item>
    </ItemGroup>
  ),
}

export const __namedExportsOrder = ["KeyValue", "ListRow", "Variants"]
