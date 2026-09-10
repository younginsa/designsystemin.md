import * as React from "react"
import { ArrowRight, X } from "lucide-react"

import { Badge } from "./badge"

/* Badge 스토리 — 허브 카드 data-badge(칩 · 뱃지: 일반 · 버전 · 역할 태그) · data-status(상태 필 · 도트)의 원문.
 * cva variant: default · secondary · destructive · outline · ghost · link. 상태색 통합(2026-08-21): 정상 = success 도트, 이상 = destructive 도트.
 * form-tags 카드는 input.stories Tags 가 Badge 를 조합한다. @storybook import 0. */

export default {
  title: "DS/Badge",
  component: Badge,
  argTypes: {
    variant: { control: "select", options: ["default", "secondary", "destructive", "outline", "ghost", "link"] },
  },
}

export const Variants = {
  parameters: { vocab: "data-badge" },
  render: () => (
    <>
      <Badge>NAVIGATION</Badge>
      <Badge variant="secondary">SVM</Badge>
      <Badge variant="outline">CONTROL</Badge>
      <Badge variant="destructive">HIGH 9</Badge>
      <Badge variant="secondary" className="rounded-full">34</Badge>
      <Badge variant="outline" className="font-mono">v3.5.0-test.15</Badge>
      <ArrowRight className="size-4 text-muted-foreground" />
      <Badge variant="outline" className="font-mono">v4.0.0-update.1</Badge>
      <Badge variant="secondary">avikus <X className="size-3" /></Badge>
      <Badge variant="outline">+ 역할 추가</Badge>
    </>
  ),
}

export const Status = {
  parameters: { vocab: "data-status" },
  render: () => (
    <>
      <Badge variant="secondary"><span className="size-1.5 rounded-full bg-success"></span> 정상</Badge>
      <Badge variant="secondary"><span className="size-1.5 rounded-full bg-destructive"></span> 이상</Badge>
      <Badge variant="outline">CAUTION</Badge>
      <Badge variant="outline">COMPLETED</Badge>
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><span className="size-2 rounded-full bg-success"></span> Ready</span>
    </>
  ),
}

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>default</Badge>
      <Badge variant="secondary">secondary</Badge>
      <Badge variant="destructive">destructive</Badge>
      <Badge variant="outline">outline</Badge>
      <Badge variant="ghost">ghost</Badge>
      <Badge variant="link">link</Badge>
    </div>
  ),
}

export const __namedExportsOrder = ["Variants", "Status", "AllVariants"]
