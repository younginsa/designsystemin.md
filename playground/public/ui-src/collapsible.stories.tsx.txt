import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Badge } from "./badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"

/* Collapsible 스토리 — 허브 카드 data-tree(트리 목록)의 원문. 트리거 = px-2 py-1.5 text-sm medium hover:bg-accent + Chevron(열림 ▾ / 닫힘 ▸) + 개수 Badge,
 * 콘텐츠 = ml-4 border-l pl-3, 선택 항목 bg-accent mono text-xs. @storybook import 0. */

export default {
  title: "DS/Collapsible",
  component: Collapsible,
}

export const Tree = {
  parameters: { vocab: "data-tree" },
  render: () => (
    <>
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
          <ChevronDown className="size-4" /> v4.0 <Badge variant="secondary" className="ml-auto rounded-full">9</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="ml-4 border-l border-border pl-3">
          <div className="rounded-md bg-accent px-2 py-1.5 font-mono text-xs">v4.0.0-test.96</div>
          <div className="px-2 py-1.5 font-mono text-xs text-muted-foreground">v4.0.0-test.95</div>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
          <ChevronRight className="size-4" /> v1.0 <Badge variant="secondary" className="ml-auto rounded-full">1</Badge>
        </CollapsibleTrigger>
      </Collapsible>
    </>
  ),
}

export const __namedExportsOrder = ["Tree"]
