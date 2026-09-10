import * as React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

/* Tabs 스토리 — 허브 카드 data-tabs(탭 3종)의 원문: TabsList default(bg-muted 필) + ToggleGroup outline sm(세그먼트).
 * cva tabsList variant default(bg-muted) · line(gap-1 bg-transparent, 밑줄). @storybook import 0. */

export default {
  title: "DS/Tabs",
  component: Tabs,
  argTypes: {
    variant: { control: "select", options: ["default", "line"] },
  },
}

export const Three = {
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
      <ToggleGroup type="single" defaultValue="user" variant="outline" size="sm">
        <ToggleGroupItem value="user">사용자용</ToggleGroupItem>
        <ToggleGroupItem value="dev">개발자용</ToggleGroupItem>
      </ToggleGroup>
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

export const __namedExportsOrder = ["Three", "Line"]
