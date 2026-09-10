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

export const __namedExportsOrder = ["Default", "Multiple"]
