"use client";

// data-table 렌더 캡처 — 상단: 순정 shadcn 원형(내장 조정을 CSS로 되돌린 재구성) / 하단: 365 조정판(컴포넌트 내장 룩)
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";

const ROWS = [
  { name: "hinas-api", ver: "v2.1.0", status: "정상", tone: "ok" },
  { name: "hinas-worker", ver: "v2.1.0", status: "정상", tone: "ok" },
  { name: "hidom-ui", ver: "v1.8.0", status: "이상", tone: "bad" },
];

function Rows() {
  return (
    <TableBody>
      {ROWS.map((r) => (
        <TableRow key={r.name}>
          <TableCell className="font-medium">{r.name}</TableCell>
          <TableCell className="font-mono text-xs">{r.ver}</TableCell>
          <TableCell>
            <span
              className={
                "inline-flex items-center gap-1.5 text-sm " +
                (r.tone === "bad" ? "text-destructive" : "text-foreground")
              }
            >
              <span
                className={
                  "size-1.5 rounded-full " +
                  (r.tone === "bad" ? "bg-destructive" : "bg-emerald-500")
                }
              />
              {r.status}
            </span>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function Head() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>모듈 이름</TableHead>
        <TableHead>버전</TableHead>
        <TableHead>상태</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export default function Page() {
  return (
    <div className="flex h-screen flex-col items-center justify-start gap-24 bg-white pt-16">
      <style>{`nextjs-portal { display: none; }`}</style>
      {/* 순정 shadcn 원형 — 내장 조정(테두리·헤더 배경·패딩·헤더 색) 되돌림 */}
      <div className="w-[640px] [&>div]:rounded-none [&>div]:border-0 [&_thead]:bg-transparent [&_th]:text-foreground [&_th]:px-2 [&_td]:px-2 [&_td]:py-2">
        <Table>
          <Head />
          <Rows />
        </Table>
      </div>
      {/* 365 조정판 — 컴포넌트 내장 룩 그대로 */}
      <div className="w-[640px]">
        <Table>
          <Head />
          <Rows />
        </Table>
      </div>
    </div>
  );
}
