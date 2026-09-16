import * as React from "react"
import { ExternalLink, RefreshCw } from "lucide-react"

import { Button } from "./button"
import { DetailPanel } from "./detail-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

/* DetailPanel 스토리 — 상세 패널(detail-panel 카드). Sheet(right) 위 헤더 스캐폴드: ① control 슬롯(상태 Select sm) ② title text-lg bold + titleLink ③ meta 줄(text-sm secondary-foreground, gap-x-4)
 * ④ utils(ghost 아이콘, X 왼쪽 top-3 right-12). size md(sm:max-w-md) · 4xl. 본문 flex-col gap-6 p-4. 허브 카드는 포털이라 /shadcn-preview/detail-panel 을 iframe 으로 담는다. @storybook import 0. */

export default {
  title: "DS/DetailPanel",
  component: DetailPanel,
  argTypes: {
    size: { control: "select", options: ["md", "4xl"] },
  },
}

const dot = (
  <span className="inline-flex items-center gap-1.5 text-sm">
    <span className="size-1.5 rounded-full bg-success" /> 정상
  </span>
)

export const Open = {
  parameters: { vocab: "detail-panel" },
  render: () => (
    <DetailPanel
      open
      size="md"
      control={
        <Select defaultValue="ok">
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ok">{dot}</SelectItem>
          </SelectContent>
        </Select>
      }
      title="SVM_BUSAN_1"
      titleLink={
        <a className="text-sm text-muted-foreground underline underline-offset-4" href="#">
          호선 상세 <ExternalLink className="ml-0.5 inline size-3.5" />
        </a>
      }
      meta={
        <>
          <span>IMO 9876543</span>
          <span>등록 2026-07-01</span>
          <span>담당 avikus_qa</span>
        </>
      }
      utils={
        <Button variant="ghost" size="icon" className="size-8">
          <RefreshCw />
        </Button>
      }
    >
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">업데이트 이력</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>버전</TableHead>
              <TableHead>일시</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-xs">v2.1.0</TableCell>
              <TableCell>2026-08-01</TableCell>
              <TableCell>{dot}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs">v2.0.4</TableCell>
              <TableCell>2026-07-11</TableCell>
              <TableCell>{dot}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </DetailPanel>
  ),
}

export const __namedExportsOrder = ["Open"]
