import * as React from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion"

/* Accordion 스토리 — 허브 카드 data-accordion 의 원문. type single collapsible, 트리거 py-4 text-sm medium + ChevronDown 회전, 항목 border-b. @storybook import 0. */

export default {
  title: "DS/Accordion",
  component: Accordion,
}

export const Default = {
  parameters: { vocab: "data-accordion" },
  render: () => (
    <Accordion type="single" collapsible defaultValue="sys">
      <AccordionItem value="cam">
        <AccordionTrigger>CAMERA</AccordionTrigger>
        <AccordionContent>카메라 진단 상세</AccordionContent>
      </AccordionItem>
      <AccordionItem value="sys">
        <AccordionTrigger>SYSTEM</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">CPU 9.2% · Memory 25.0%</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const Multiple = {
  render: () => (
    <Accordion type="multiple" defaultValue={["cam", "sys"]} className="w-96">
      <AccordionItem value="cam">
        <AccordionTrigger>CAMERA</AccordionTrigger>
        <AccordionContent>카메라 진단 상세</AccordionContent>
      </AccordionItem>
      <AccordionItem value="sys">
        <AccordionTrigger>SYSTEM</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">CPU 9.2% · Memory 25.0%</AccordionContent>
      </AccordionItem>
      <AccordionItem value="net">
        <AccordionTrigger>NETWORK</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">NTP 동기화 · pod 3/3</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

/** 꺾쇠 앞(트리 목록 — 릴리즈 노트 버전 목록) · 꺾쇠 없음. chevron prop(2026-09-15) — 종전 화면의 [&>svg]:hidden 대체 */
export const ChevronStart = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="a" className="w-80">
      <AccordionItem value="a">
        <AccordionTrigger chevron="start" className="py-2 text-sm">v3.0.0-rc.26</AccordionTrigger>
        <AccordionContent className="pl-8">2026-08-13 발행 · 사용자용 노트</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger chevron="start" className="py-2 text-sm">v3.0.0-rc.25</AccordionTrigger>
        <AccordionContent className="pl-8">2026-08-01 발행</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const NoChevron = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="a" className="w-80">
      <AccordionItem value="a">
        <AccordionTrigger chevron="none" className="py-2 text-sm hover:no-underline">SYSTEM</AccordionTrigger>
        <AccordionContent>CPU 9.2% · Memory 25.0%</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

export const __namedExportsOrder = ["Default", "Multiple", "ChevronStart", "NoChevron"]
