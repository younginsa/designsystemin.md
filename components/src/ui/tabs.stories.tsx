import * as React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

/* Tabs 스토리 — 허브 카드 data-tabs(탭 2종)의 원문: TabsList default(bg-muted 필) · line(밑줄).
 * ToggleGroup 세그먼트는 2026-09-15 은퇴(선택 상태 혼동) — 뷰 전환은 line 탭, 다중 선택은 Checkbox.
 * cva tabsList variant default(bg-muted) · line(gap-1 bg-transparent, 밑줄). @storybook import 0. */

export default {
  title: "DS/Tabs",
  component: Tabs,
  argTypes: {
    variant: { control: "select", options: ["default", "line"] },
  },
}

export const Default = {
  parameters: { vocab: "data-tabs" },
  render: () => (
    <>
      <Tabs defaultValue="common">
        <TabsList>
          <TabsTrigger value="common">COMMON</TabsTrigger>
          <TabsTrigger value="nav">NAVIGATION</TabsTrigger>
          <TabsTrigger value="svm">SVM</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs defaultValue="user">
        <TabsList variant="line">
          <TabsTrigger value="user">사용자용</TabsTrigger>
          <TabsTrigger value="dev">개발자용</TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  ),
}

export const Line = {
  render: () => (
    <Tabs defaultValue="common" className="w-96">
      <TabsList variant="line">
        <TabsTrigger value="common">COMMON</TabsTrigger>
        <TabsTrigger value="nav">NAVIGATION</TabsTrigger>
        <TabsTrigger value="svm">SVM</TabsTrigger>
      </TabsList>
      <TabsContent value="common" className="pt-3 text-sm text-secondary-foreground">공통 버전 v4.0.0</TabsContent>
    </Tabs>
  ),
}

export const __namedExportsOrder = ["Default", "Line"]
