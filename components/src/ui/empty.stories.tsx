import * as React from "react"
import { Inbox, Plus } from "lucide-react"

import { Button } from "./button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty"

/* Empty 스토리 — 빈 상태(fb-empty 카드). Empty = flex-col items-center gap-6 rounded-lg border-dashed p-6 md:p-12 text-center,
 * EmptyMedia variant icon(size-10 rounded-lg bg-muted, svg 24) · EmptyTitle text-base medium · EmptyDescription text-sm secondary-foreground · 액션 Button outline sm.
 * 모든 생성 화면의 빈 상태 표준(StatePreview 빈). @storybook import 0. */

export default {
  title: "DS/Empty",
  component: Empty,
}

export const WithAction = {
  parameters: { vocab: "fb-empty" },
  render: () => (
    <Empty className="py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
        <EmptyTitle>등록된 메모가 없습니다</EmptyTitle>
        <EmptyDescription>새 메모를 추가하면 여기에 표시됩니다.</EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" size="sm"><Plus /> 새 메모</Button>
    </Empty>
  ),
}

export const NoResult = {
  render: () => (
    <Empty className="w-[560px] py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
        <EmptyTitle>검색 결과가 없습니다</EmptyTitle>
        <EmptyDescription>다른 검색어나 필터로 다시 시도해 보세요.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="ghost" size="sm">필터 초기화</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const __namedExportsOrder = ["WithAction", "NoResult"]
