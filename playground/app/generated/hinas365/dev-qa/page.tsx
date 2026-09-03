"use client";

// Developer/QA — ① HiNAS 365 메인 레이아웃, 탭 3개
// 원천: Avikus Design library 「Developer/QA」 캡처 4장
//   ① 제품 보안 취약점 현황 — 제품·버전 선택(미선택/선택 2상태) → 심각도 스탯 + 스캔 표
//   ② 번들 버전 비교 — 제품 + COMMON/제품 MODULE FROM→TO, [비교하기] → 비교 결과(빈 상태 캡처)
//   ③ 릴리즈 노트 갱신 — GitHub 바로가기 4개 + 제품·버전 + [갱신]
//
// 원본 심각도 색(CRITICAL 빨강·HIGH 주황·MEDIUM 노랑·LOW 초록·UNTRIAGED 회색·INFORMATIONAL 파랑)
// 은 상태 토큰 부족(DES-206)으로 destructive / success / muted / primary 로 대체 표기.
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  ArrowRight,
  ExternalLink,
  Github,
  Info,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { Label } from "@ds/ui/ui/label";
import { Progress } from "@ds/ui/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

const PRODUCTS = ["Common", "Navigation", "SVM", "Control"];
const VERSIONS: Record<string, string[]> = {
  Common: ["v4.0.3-fail1", "v4.0.0-test.19", "v3.0.1-base-kr", "v3.0.0-test20"],
  Navigation: ["v3.0.0-rc3-dnv", "v3.7.0-rc.7", "v3.99.6-anduril"],
  SVM: ["v1.0.0-rc.2", "v1.0.0-rc.3", "v3.2.1"],
  Control: ["v3.0.0-rc.5", "v3.0.0-rc.8", "v2.3.1"],
};

// 심각도 — 원본 색 → 토큰 대체(DES-206 사유 주석은 파일 머리 참조)
const SEVERITIES = [
  { key: "CRITICAL", value: 1, cls: "text-destructive" },
  { key: "HIGH", value: 53, cls: "text-destructive" },
  { key: "MEDIUM", value: 104, cls: "text-primary" },
  { key: "LOW", value: 7, cls: "text-success" },
  { key: "UNTRIAGED", value: 86, cls: "text-secondary-foreground" },
  { key: "INFORMATIONAL", value: 54, cls: "text-primary" },
] as const;

type ScanRow = {
  repo: string;
  tag: string;
  status: "COMPLETE" | "SCAN_ELIGIBILITY_EXPIRED";
  severity: [string, number][];
};

const SCAN_ROWS: ScanRow[] = [
  { repo: "hidom-2.0-frontend", tag: "v3.1.5-rc.7", status: "COMPLETE", severity: [["HIGH", 9], ["MEDIUM", 7], ["LOW", 4]] },
  { repo: "avikus-sensor-fusion", tag: "v1.0.10-rc.7", status: "COMPLETE", severity: [] },
  { repo: "detector-app", tag: "v1.1.0-rc.1", status: "COMPLETE", severity: [["HIGH", 3], ["MEDIUM", 16], ["UNTRIAGED", 1]] },
  { repo: "standard-nas-stitch-app", tag: "v1.0.14-rc.1", status: "SCAN_ELIGIBILITY_EXPIRED", severity: [["HIGH", 9], ["MEDIUM", 30], ["UNTRIAGED", 43], ["INFORMATIONAL", 18]] },
  { repo: "hidom-2.0-rtsp", tag: "v3.3.0-test.42", status: "COMPLETE", severity: [["CRITICAL", 1], ["HIGH", 23], ["MEDIUM", 30], ["LOW", 2]] },
  { repo: "hidom-2.0-backend", tag: "v3.5.0-rc.7", status: "COMPLETE", severity: [["HIGH", 5], ["MEDIUM", 16], ["LOW", 1], ["UNTRIAGED", 42], ["INFORMATIONAL", 36]] },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function DevQaPage() {
  const [view, setView] = React.useState<ViewState>("default");

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-bold">Developer/QA</h1>
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
        </div>

        {view === "loading" && <TableSkeleton />}
        {view === "progress" && (
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-4">
              <Progress value={62} className="flex-1" />
              <span className="font-mono text-sm text-secondary-foreground">62%</span>
            </div>
            <p className="text-sm text-secondary-foreground">데이터를 불러오는 중입니다…</p>
          </div>
        )}

        {view === "error" && (
          <ErrorState
            title="데이터를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {(view === "default" || view === "empty") && (
          <Tabs defaultValue="vuln" className="space-y-4">
            <TabsList>
              <TabsTrigger value="vuln">제품 보안 취약점 현황</TabsTrigger>
              <TabsTrigger value="bundle">번들 버전 비교</TabsTrigger>
              <TabsTrigger value="notes">릴리즈 노트 갱신</TabsTrigger>
            </TabsList>

            <TabsContent value="vuln">
              <VulnTab empty={view === "empty"} />
            </TabsContent>
            <TabsContent value="bundle">
              <BundleTab />
            </TabsContent>
            <TabsContent value="notes">
              <NotesTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ---------------------------------------------------- ① 제품 보안 취약점 현황 */

function VulnTab({ empty }: { empty: boolean }) {
  const [product, setProduct] = React.useState("");
  const [version, setVersion] = React.useState("");
  const selected = product && version;

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-sm font-medium text-secondary-foreground">제품 &amp; 버전 선택</h2>
          <p className="text-xs text-secondary-foreground">
            제품과 버전을 선택하면 해당 버전의 모든 이미지 스캔 결과를 볼 수 있습니다.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vuln-product">
              제품 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={product}
              onValueChange={(v) => {
                setProduct(v);
                setVersion("");
              }}
            >
              <SelectTrigger id="vuln-product" className="w-full max-w-sm">
                <SelectValue placeholder="제품을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vuln-version" className="flex items-center gap-1.5">
              버전 <span className="text-destructive">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="버전 설명">
                    <Info className="size-3.5 text-secondary-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>스캔이 수행된 번들 버전만 표시됩니다.</TooltipContent>
              </Tooltip>
            </Label>
            <Select value={version} disabled={!product} onValueChange={setVersion}>
              <SelectTrigger id="vuln-version" className="w-full max-w-sm">
                <SelectValue placeholder={product ? "버전을 선택하세요" : "제품을 먼저 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                {(VERSIONS[product] ?? []).map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {selected && (
        <>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-6">
            <div>
              <h2 className="text-sm font-medium text-secondary-foreground">스캔 결과</h2>
              <p className="text-xs text-secondary-foreground">
                {product} · {version} 버전의 취약점 현황입니다.
              </p>
            </div>
            <Button variant="outline">
              <RefreshCw className="size-4" /> 데이터 새로고침
            </Button>
          </section>

          {empty ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyTitle>스캔 결과가 없습니다.</EmptyTitle>
                <EmptyDescription>이 버전에서 스캔된 이미지가 없습니다.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {SEVERITIES.map((s) => (
                  <div key={s.key} className="rounded-lg border bg-card p-4">
                    <p className={"text-xs font-semibold uppercase " + s.cls}>{s.key}</p>
                    <p className={"text-3xl font-bold " + s.cls}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <Table className="bg-card">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="uppercase">Repository</TableHead>
                      <TableHead className="uppercase">Tag</TableHead>
                      <TableHead className="uppercase">Status</TableHead>
                      <TableHead className="uppercase">Severity</TableHead>
                      <TableHead className="uppercase">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SCAN_ROWS.map((r) => (
                      <TableRow key={r.repo}>
                        <TableCell className="font-medium">{r.repo}</TableCell>
                        <TableCell className="font-mono text-sm">{r.tag}</TableCell>
                        <TableCell>
                          {/* data-status 확정 스펙 — 도트 8px·text-sm·배경 없음 */}
                          {r.status === "COMPLETE" ? (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span className="size-2 rounded-full bg-success" /> COMPLETE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-secondary-foreground">
                              <span className="size-2 rounded-full bg-muted-foreground" /> SCAN_ELIGIBILITY_EXPIRED
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.severity.length === 0 ? (
                            <span className="text-secondary-foreground">-</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {r.severity.map(([k, n]) => (
                                <Badge
                                  key={k}
                                  variant="outline"
                                  className={
                                    "font-normal " +
                                    (k === "CRITICAL" || k === "HIGH"
                                      ? "border-destructive text-destructive"
                                      : k === "LOW"
                                        ? "border-success text-success"
                                        : k === "MEDIUM"
                                          ? "border-primary text-primary"
                                          : "text-secondary-foreground")
                                  }
                                >
                                  {k} {n}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-secondary-foreground">
                            <ExternalLink className="size-4" /> 상세 보기
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------- ② 번들 버전 비교 */

function BundleTab() {
  const [product, setProduct] = React.useState("SVM");
  const [compared, setCompared] = React.useState(false);

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-sm font-medium text-secondary-foreground">제품 &amp; 버전 선택</h2>
          <p className="text-xs text-secondary-foreground">
            제품과 버전을 선택하면 선택한 버전의 diff를 확인할 수 있습니다.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bd-product">
            제품 <span className="text-destructive">*</span>
          </Label>
          <Select value={product} onValueChange={setProduct}>
            <SelectTrigger id="bd-product" className="w-full max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCTS.filter((p) => p !== "Common").map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(["COMMON MODULE", `${product.toUpperCase()} MODULE`] as const).map((module, mi) => (
          <div key={module} className="space-y-2">
            <p className="text-xs font-semibold uppercase text-secondary-foreground">
              {module} <span className="text-destructive">*</span>
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-secondary-foreground">From</Label>
                <Select defaultValue={mi === 0 ? "v3.0.1-base-kr" : "v1.0.0-rc.2"}>
                  <SelectTrigger className="w-64" aria-label={`${module} From`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(mi === 0 ? VERSIONS.Common : VERSIONS.SVM).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="mb-2.5 size-4 shrink-0 text-secondary-foreground" />
              <div className="space-y-1">
                <Label className="text-xs uppercase text-secondary-foreground">To</Label>
                <Select defaultValue={mi === 0 ? "v3.0.0-test20" : "v1.0.0-rc.3"}>
                  <SelectTrigger className="w-64" aria-label={`${module} To`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(mi === 0 ? VERSIONS.Common : VERSIONS.SVM).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button onClick={() => setCompared(true)}>비교하기</Button>
        </div>
      </section>

      {compared && (
        <section className="rounded-lg border bg-card">
          <div className="border-b p-6">
            <h2 className="text-sm font-medium text-secondary-foreground">비교 결과</h2>
            <p className="text-xs text-secondary-foreground">
              Common · v3.0.1-base-kr → v3.0.0-test20 / {product} · v1.0.0-rc.2 → v1.0.0-rc.3의 번들
              버전 비교 결과입니다.
            </p>
          </div>
          <div className="p-6">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>업데이트 내용 없음</EmptyTitle>
                <EmptyDescription>변경된 파일이 없거나 모든 항목이 최신 상태입니다.</EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" onClick={() => setCompared(false)}>
                다시 확인하기
              </Button>
            </Empty>
          </div>
        </section>
      )}
    </div>
  );
}

/* ---------------------------------------------------- ③ 릴리즈 노트 갱신 */

function NotesTab() {
  const [product, setProduct] = React.useState("");
  const [version, setVersion] = React.useState("");

  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <div>
        <h2 className="text-sm font-medium text-secondary-foreground">제품 &amp; 버전 선택</h2>
        <p className="text-xs text-secondary-foreground">
          제품과 버전을 선택하고 Refresh 버튼을 눌러 릴리즈 노트를 갱신하세요.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-secondary-foreground">GitHub 바로가기</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {PRODUCTS.map((p) => (
            <Button key={p} variant="outline">
              <Github className="size-4" /> {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="rn-product">
            제품 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={product}
            onValueChange={(v) => {
              setProduct(v);
              setVersion("");
            }}
          >
            <SelectTrigger id="rn-product" className="w-72" aria-label="제품">
              <SelectValue placeholder="제품을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rn-version">버전</Label>
          <Select value={version} disabled={!product} onValueChange={setVersion}>
            <SelectTrigger id="rn-version" className="w-72" aria-label="버전">
              <SelectValue placeholder={product ? "버전을 선택하세요" : "제품을 먼저 선택하세요."} />
            </SelectTrigger>
            <SelectContent>
              {(VERSIONS[product] ?? []).map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={!product}>갱신</Button>
      </div>
    </section>
  );
}

