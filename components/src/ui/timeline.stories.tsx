import * as React from "react"

import { Timeline, TimelineItem, TimelineMeta, TimelineTitle } from "./timeline"

/* Timeline 스토리 — 허브 카드 timeline 의 원문. TimelineItem status default(border-muted-foreground bg-background) · current(primary) · success · error(destructive, 제목도 destructive).
 * 도트 size-2.5 border-2 + 세로선 w-px bg-border(마지막 항목 없음) · TimelineTitle text-sm medium · TimelineMeta mt-1.5 text-xs secondary-foreground · 항목 pb-6. @storybook import 0. */

export default {
  title: "DS/Timeline",
  component: Timeline,
}

export const Default = {
  parameters: { vocab: "timeline" },
  render: () => (
    <Timeline>
      <TimelineItem status="error">
        <TimelineTitle>SYSTEM ROLLBACK FAILED</TimelineTitle>
        <TimelineMeta>20일 20시간 전</TimelineMeta>
      </TimelineItem>
      <TimelineItem status="error">
        <TimelineTitle>SYSTEM ROLLING BACK</TimelineTitle>
        <TimelineMeta>20일 20시간 전 · 소요 1분 37초</TimelineMeta>
      </TimelineItem>
      <TimelineItem>
        <TimelineTitle>SYSTEM UPDATING</TimelineTitle>
        <TimelineMeta>20일 20시간 전 · 소요 3분 4초</TimelineMeta>
      </TimelineItem>
    </Timeline>
  ),
}

export const AllStatuses = {
  render: () => (
    <Timeline className="w-80">
      <TimelineItem status="success">
        <TimelineTitle>UPDATE COMPLETED</TimelineTitle>
        <TimelineMeta>2026-09-10 11:20 · 소요 4분 12초</TimelineMeta>
      </TimelineItem>
      <TimelineItem status="current">
        <TimelineTitle>APPLYING</TimelineTitle>
        <TimelineMeta>진행 중</TimelineMeta>
      </TimelineItem>
      <TimelineItem status="error">
        <TimelineTitle>ROLLBACK FAILED</TimelineTitle>
        <TimelineMeta>2026-09-09 08:02</TimelineMeta>
      </TimelineItem>
      <TimelineItem>
        <TimelineTitle>REQUESTED</TimelineTitle>
        <TimelineMeta>2026-09-09 07:55</TimelineMeta>
      </TimelineItem>
    </Timeline>
  ),
}

export const __namedExportsOrder = ["Default", "AllStatuses"]
