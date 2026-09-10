import * as React from "react"
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "./chart"

/* Chart 스토리 — 허브 카드 viz-donut(도넛) · viz-line(라인)의 원문. ChartContainer(recharts 래퍼) — 색은 CSS 변수(--foreground · --muted-foreground · --border · --accent)만 쓴다.
 * 피그마에는 렌더된 SVG 를 벡터로 옮긴다(차트 프리미티브 없음). @storybook import 0. */

export default {
  title: "DS/Chart",
  component: ChartContainer,
}

const lineData = [
  { d: "07-21", v: 24 }, { d: "07-22", v: 31 }, { d: "07-23", v: 28 },
  { d: "07-24", v: 42 }, { d: "07-25", v: 38 }, { d: "07-26", v: 47 }, { d: "07-27", v: 44 },
]
const lineConfig = { v: { label: "CPU", color: "var(--foreground)" } } satisfies ChartConfig
const pieData = [
  { name: "v3.2.1", value: 37.5, fill: "var(--foreground)" },
  { name: "v3.2.0", value: 29.2, fill: "var(--muted-foreground)" },
  { name: "v3.1.8", value: 18.8, fill: "var(--border)" },
  { name: "기타", value: 14.5, fill: "var(--accent)" },
]
const pieConfig = {} satisfies ChartConfig

export const Donut = {
  parameters: { vocab: "viz-donut" },
  render: () => (
    <ChartContainer config={pieConfig} className="mx-auto h-56 w-full">
      <PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
          {pieData.map((e) => (<Cell key={e.name} fill={e.fill} />))}
        </Pie>
      </PieChart>
    </ChartContainer>
  ),
}

export const LineTrend = {
  parameters: { vocab: "viz-line" },
  render: () => (
    <ChartContainer config={lineConfig} className="h-56 w-full">
      <LineChart data={lineData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="d" tickLine={false} axisLine={false} tickMargin={8} />
        <Line dataKey="v" type="monotone" stroke="var(--foreground)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  ),
}

export const __namedExportsOrder = ["Donut", "LineTrend"]
