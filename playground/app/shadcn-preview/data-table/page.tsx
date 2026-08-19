"use client";

// data-table 스톡 렌더 캡처용 — 내장 아웃라인·muted 헤더·흐린 헤더 폰트 + 상태 색 쌍 예시
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

export default function Page() {
  return (
    <div className="flex h-screen items-start justify-center bg-white pt-16">
      <style>{`nextjs-portal { display: none; }`}</style>
      <div className="w-[640px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>모듈 이름</TableHead>
              <TableHead>버전</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
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
                        (r.tone === "bad" ? "bg-destructive" : "bg-primary")
                      }
                    />
                    {r.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
