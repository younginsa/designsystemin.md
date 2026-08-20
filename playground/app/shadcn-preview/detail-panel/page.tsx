"use client";

// detail-panel 렌더 캡처 — md 요약 패널 defaultOpen (헤더 스캐폴드 + 표준 표 섹션)
import * as React from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { DetailPanel } from "@ds/ui/ui/detail-panel";
import { Button } from "@ds/ui/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ds/ui/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";

const dot = (
  <span className="inline-flex items-center gap-1.5 text-sm">
    <span className="size-1.5 rounded-full bg-success" /> 정상
  </span>
);

export default function Page() {
  return (
    <div className="h-screen bg-white">
      <style>{`nextjs-portal { display: none; }`}</style>
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
    </div>
  );
}
