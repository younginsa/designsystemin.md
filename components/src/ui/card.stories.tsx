import * as React from "react"

import { Button } from "./button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"

/* Card 스토리 — 허브 카드 data-stat(스탯 · 퍼널 · 랭킹)의 원문(py-4 · px-4 · Description 라벨 + text-3xl mono 숫자) + 전체 구조(Header · Title · Description · Action · Content · Footer).
 * Card = bg-card text-card-foreground rounded-xl border shadow-sm py-6 gap-6. @storybook import 0. */

export default {
  title: "DS/Card",
  component: Card,
}

export const Stat = {
  parameters: { vocab: "data-stat" },
  render: () => (
    <>
      <Card className="py-4">
        <CardContent className="px-4">
          <CardDescription>운영 호선</CardDescription>
          <CardTitle className="text-3xl font-mono">48</CardTitle>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardContent className="px-4">
          <CardDescription>업데이트 진행</CardDescription>
          <CardTitle className="text-3xl font-mono">6</CardTitle>
        </CardContent>
      </Card>
    </>
  ),
}

export const Full = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>SVM_BUSAN_1</CardTitle>
        <CardDescription>IMO 9876543 · HMD</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">편집</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Navigation 2.0.0 · Control 2.3.1 · SVM 1.1.0</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm">취소</Button>
        <Button size="sm">저장</Button>
      </CardFooter>
    </Card>
  ),
}

/** flat 패널 — 본문(A·B·C)의 보더 카드. 그림자·내장 패딩 없음: 섹션 p-6 · 우측 레일 p-4(2026-09-15 신설, 갤러리 74곳 손 조합 대체) */
export const FlatPanel = {
  parameters: { vocab: "data-stat" },
  render: () => (
    <Card variant="flat" className="p-6">
      <p className="text-sm font-medium">계약 정보</p>
      <p className="mt-2 text-sm text-secondary-foreground">대양해운 · Control 신규 납품 · 2026-01-15</p>
    </Card>
  ),
}

export const __namedExportsOrder = ["Stat", "Full", "FlatPanel"]
