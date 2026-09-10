import * as React from "react"
import { Copy } from "lucide-react"

import { Button } from "./button"

/* 에러 콘솔(fb-console 카드) — 전용 파일 없는 손 조합 패턴(vocab-map files 빈 배열).
 * rounded-lg bg-foreground p-4 font-mono text-xs text-background · 오른쪽 위 복사 Button ghost icon(size-6, text-background, hover bg-background/20) · 에러 줄 text-destructive.
 * 이 파일이 패턴의 원문이다(허브 카드가 읽는다). @storybook import 0. */

function ErrorConsole({ lines }: { lines: { text: string; error?: boolean }[] }) {
  return (
    <div className="relative rounded-lg bg-foreground p-4 font-mono text-xs text-background">
      <Button variant="ghost" size="icon" className="absolute right-2 top-2 size-6 text-background hover:bg-background/20" aria-label="복사"><Copy /></Button>
      {lines.map((l, i) => (
        <div key={i} className={l.error ? "text-destructive" : undefined}>{l.text}</div>
      ))}
    </div>
  )
}

export default {
  title: "DS/ErrorConsole",
  component: ErrorConsole,
}

export const Default = {
  parameters: { vocab: "fb-console" },
  render: () => (
    <ErrorConsole
      lines={[
        { text: "[2026-07-28 15:23:01] update requested (id: 7b74)" },
        { text: "[2026-07-28 15:23:04] pulling image hidom-2.0-backend:v3.5.0" },
        { text: "[2026-07-28 15:24:12] ERROR: agent unreachable", error: true },
      ]}
    />
  ),
}

export const __namedExportsOrder = ["Default"]
