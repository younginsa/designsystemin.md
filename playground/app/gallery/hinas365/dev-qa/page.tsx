"use client";

// Developer/QA — ① HiNAS 365 메인 레이아웃, 사이드바 자식 메뉴 3개(?view=vuln|bundle|notes)
// 원천: Avikus Design library 「Developer/QA」 캡처 4장 + 운영 화면 캡처 5장(2026-09-16)
//   ① 제품 보안 취약점 현황 — 제품·버전 선택(미선택/선택 2상태) → 심각도 스탯 스트립 + 스캔 표
//   ② 번들 버전 비교 — 제품 + COMMON/제품 MODULE FROM→TO(제품 선택 전 비활성), [비교하기] → 비교 결과(변경 파일 트리 / 빈 상태)
//   ③ 릴리즈 노트 갱신 — GitHub 바로가기 4개 + 제품·버전 + [갱신](회전 + 토스트)
//
// 카드 문법(2026-09-16): flat 카드 = 머리띠(제목·설명 · border-b p-6) + 본문 p-6. 셀렉트는 전폭 2열.
// 심각도 색(2026-09-16 확정): 원본은 CRITICAL 빨강·HIGH 주황·MEDIUM 노랑·LOW 초록·INFORMATIONAL 파랑이지만
// 주황·노랑 토큰을 들이지 않는다 — 대시보드 진단 위계(Camera 이상만 빨강)와 같은 규칙으로
// CRITICAL만 빨강(숫자·라벨·칩), 나머지는 기본색.
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { PageHeader } from "@ds/ui/ui/page-header";
import { Card } from "@ds/ui/ui/card";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCode,
  Github,
  Info,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { StatusBadge } from "@ds/ui/ui/status-badge";
import { Button } from "@ds/ui/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ds/ui/ui/collapsible";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

const PRODUCTS = ["Common", "Navigation", "SVM", "Control"];
const VERSIONS: Record<string, string[]> = {
  Common: ["v4.0.3-fail1", "v4.0.0-test.19", "v3.0.1-base-kr", "v3.0.0-test20"],
  Navigation: ["v3.0.0-rc3-dnv", "v3.7.0-rc.7", "v3.99.6-anduril"],
  SVM: ["v1.0.0-rc.2", "v1.0.0-rc.3", "v3.2.1"],
  Control: ["v3.0.0-rc.5", "v3.0.0-rc.8", "v2.3.1"],
};

// 심각도 스탯 — CRITICAL만 빨강, 나머지 기본색(파일 머리 참조)
const SEVERITIES = [
  { key: "CRITICAL", value: 1 },
  { key: "HIGH", value: 53 },
  { key: "MEDIUM", value: 104 },
  { key: "LOW", value: 7 },
  { key: "UNTRIAGED", value: 86 },
  { key: "INFORMATIONAL", value: 54 },
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

// 하위 페이지(2026-09-11): 탭 스위치 폐기 → 사이드바 자식 메뉴 + ?view=vuln|bundle|notes. useSearchParams는 Suspense 경계 필수(정적 export)
const SUB_LABEL = { vuln: "제품 보안 취약점 현황", bundle: "번들 버전 비교", notes: "릴리즈 노트 갱신" } as const;
type Sub = keyof typeof SUB_LABEL;

export default function DevQaPage() {
  return (
    <React.Suspense fallback={null}>
      <DevQaBody />
    </React.Suspense>
  );
}

function DevQaBody() {
  const [view, setView] = React.useState<ViewState>("default");
  const raw = useSearchParams().get("view");
  const sub: Sub = raw === "bundle" || raw === "notes" ? raw : "vuln";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title={SUB_LABEL[sub]}
          actions={<StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />}
        />

        {view === "loading" && <TableSkeleton />}
        {view === "progress" && (
          <Card variant="flat" className="space-y-4 p-6">
            <div className="flex items-center gap-4">
              <Progress value={62} className="flex-1" />
              <span className="font-mono text-sm text-secondary-foreground">62%</span>
            </div>
            <p className="text-sm text-secondary-foreground">데이터를 불러오는 중입니다…</p>
          </Card>
        )}

        {view === "error" && (
          <ErrorState
            title="데이터를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
        )}

        {(view === "default" || view === "empty") &&
          (sub === "bundle" ? <BundleTab /> : sub === "notes" ? <NotesTab /> : <VulnTab empty={view === "empty"} />)}
      </div>
    </TooltipProvider>
  );
}

/* ---------------------------------------------------- 공용 조각 */

// 카드 머리띠 — 제목·설명 + 우측 액션(선택). 본문(p-6)과 border-b로 분리
function CardHead({
  title,
  description,
  action,
}: {
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b p-6">
      <div>
        <h2 className="text-sm font-medium text-secondary-foreground">{title}</h2>
        <p className="text-xs text-secondary-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ProductSelect({
  id,
  value,
  onChange,
  options = PRODUCTS,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        제품 <span className="text-destructive">*</span>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="제품을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          {options.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// 버전 셀렉트 — 제품 선택 전 비활성 + 안내 플레이스홀더
function VersionSelect({
  id,
  product,
  value,
  onChange,
  required,
  hint,
}: {
  id: string;
  product: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        버전 {required && <span className="text-destructive">*</span>}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="버전 설명">
                <Info className="size-3.5 text-secondary-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        )}
      </Label>
      <Select value={value} disabled={!product} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
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
  );
}

// 백그라운드 갱신 목업(릴리즈 노트 「업데이트」와 같은 문법): 1.5초 회전 후 토스트. 화면 자체는 바뀌지 않는다
function useMockRefresh(done: () => void) {
  const [busy, setBusy] = React.useState(false);
  const run = () => {
    if (busy) return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      done();
    }, 1500);
  };
  return { busy, run };
}

/* ---------------------------------------------------- ① 제품 보안 취약점 현황 */

function VulnTab({ empty }: { empty: boolean }) {
  const [product, setProduct] = React.useState("");
  const [version, setVersion] = React.useState("");
  const selected = product && version;
  const refresh = useMockRefresh(() =>
    toast.success("스캔 결과를 새로고침했습니다", {
      description: `${product} · ${version} · 이미지 ${SCAN_ROWS.length}건`,
    }),
  );

  return (
    <div className="space-y-4">
      <Card variant="flat">
        <CardHead
          title="제품 & 버전 선택"
          description="제품과 버전을 선택하면 해당 버전의 모든 이미지 스캔 결과를 볼 수 있습니다."
        />
        <div className="grid gap-4 p-6 lg:grid-cols-2">
          <ProductSelect
            id="vuln-product"
            value={product}
            onChange={(v) => {
              setProduct(v);
              setVersion("");
            }}
          />
          <VersionSelect
            id="vuln-version"
            product={product}
            value={version}
            onChange={setVersion}
            required
            hint="스캔이 수행된 번들 버전만 표시됩니다."
          />
        </div>
      </Card>

      {selected && (
        <Card variant="flat">
          <CardHead
            title="스캔 결과"
            description={`${product} · ${version} 버전의 취약점 현황입니다.`}
            action={
              <Button variant="outline" onClick={refresh.run} disabled={refresh.busy} aria-busy={refresh.busy}>
                <RefreshCw className={refresh.busy ? "size-4 animate-spin" : "size-4"} /> 데이터 새로고침
              </Button>
            }
          />

          {empty ? (
            <div className="p-6">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>스캔 결과가 없습니다.</EmptyTitle>
                  <EmptyDescription>이 버전에서 스캔된 이미지가 없습니다.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              {/* data-stat — 대시보드 스탯 스트립 문법(균등 분할 · 세로 구분선 · 숫자 2xl bold · 라벨 sm 아래). 좁은 폭은 가로 스크롤 */}
              <div className="flex items-stretch divide-x overflow-x-auto">
                {SEVERITIES.map((s) => {
                  const critical = s.key === "CRITICAL";
                  return (
                    <div key={s.key} className="min-w-36 flex-1 px-4 py-1 first:pl-0">
                      <p className={"text-2xl font-bold" + (critical ? " text-destructive" : "")}>{s.value}</p>
                      <p className={"mt-1 truncate text-sm uppercase " + (critical ? "text-destructive" : "text-secondary-foreground")}>
                        {s.key}
                      </p>
                    </div>
                  );
                })}
              </div>

              <Table>
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
                        {/* data-status — DS StatusBadge(도트 8px·text-sm·배경 없음). 운영 화면은 채움 필이지만 DS 도트 문법 유지 */}
                        {r.status === "COMPLETE" ? (
                          <StatusBadge label="COMPLETE" tone="success" bg={false} />
                        ) : (
                          <StatusBadge label="SCAN_ELIGIBILITY_EXPIRED" tone="neutral" bg={false} mono />
                        )}
                      </TableCell>
                      <TableCell>
                        {r.severity.length === 0 ? (
                          <span className="text-secondary-foreground">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {/* 심각도 칩 — CRITICAL만 빨강 외곽선, 나머지 기본 outline */}
                            {r.severity.map(([k, n]) => (
                              <Badge
                                key={k}
                                variant="outline"
                                className={"font-normal" + (k === "CRITICAL" ? " border-destructive text-destructive" : "")}
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
          )}
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------- ② 번들 버전 비교 */

type Pair = { from: string; to: string };
const EMPTY_PAIR: Pair = { from: "", to: "" };

type ChangedFile = { path: string; from: string; to: string };

// 비교 결과 목업 — FROM≠TO인 모듈마다 values.yaml 한 파일이 바뀐 것으로 시연
function diffLines(from: string, to: string): [string, string][] {
  return [
    [" ", "image:"],
    [" ", "  pullPolicy: IfNotPresent"],
    ["-", `  tag: ${from}`],
    ["+", `  tag: ${to}`],
    [" ", "resources:"],
    [" ", "  limits:"],
    ["-", "    memory: 2Gi"],
    ["+", "    memory: 4Gi"],
  ];
}

// data-tree — DS Collapsible(채택 어휘). 화살표는 제어 상태로 ▸/▾ 교체(data-state 셀렉터 미사용)
function DiffFile({ file }: { file: ChangedFile }) {
  const [open, setOpen] = React.useState(true);
  const Chevron = open ? ChevronDown : ChevronRight;
  const lines = diffLines(file.from, file.to);
  const removed = lines.filter(([sign]) => sign === "-").length;
  const added = lines.filter(([sign]) => sign === "+").length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
        >
          <Chevron className="size-4 shrink-0 text-secondary-foreground" />
          <FileCode className="size-4 shrink-0 text-secondary-foreground" />
          <span className="min-w-0 flex-1 truncate font-mono">{file.path}</span>
          <span className="shrink-0 font-mono text-xs">
            <span className="text-destructive">-{removed}</span> <span className="text-success">+{added}</span>
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="mt-1 overflow-x-auto rounded-md border p-3 font-mono text-xs leading-5">
          {lines.map(([sign, text], i) => (
            <span
              key={i}
              className={"block" + (sign === "-" ? " text-destructive" : sign === "+" ? " text-success" : "")}
            >
              {sign} {text}
            </span>
          ))}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function BundleTab() {
  const [product, setProduct] = React.useState("");
  const [common, setCommon] = React.useState<Pair>(EMPTY_PAIR);
  const [module, setModule] = React.useState<Pair>(EMPTY_PAIR);
  const [compared, setCompared] = React.useState(false);

  const ready = Boolean(product && common.from && common.to && module.from && module.to);
  const changedFiles: ChangedFile[] = [];
  if (common.from !== common.to) changedFiles.push({ path: "helm/common/values.yaml", ...common });
  if (module.from !== module.to) changedFiles.push({ path: `helm/${product.toLowerCase()}/values.yaml`, ...module });

  const pickProduct = (v: string) => {
    setProduct(v);
    setCommon(EMPTY_PAIR);
    setModule(EMPTY_PAIR);
    setCompared(false);
  };

  const rows = [
    { id: "bd-common", label: "COMMON MODULE", options: VERSIONS.Common, pair: common, set: setCommon },
    {
      id: "bd-module",
      label: `${product ? product.toUpperCase() : "제품"} MODULE`,
      options: VERSIONS[product] ?? [],
      pair: module,
      set: setModule,
    },
  ];

  return (
    <div className="space-y-4">
      <Card variant="flat">
        <CardHead
          title="제품 & 버전 선택"
          description="제품과 버전을 선택하면 선택한 버전의 diff를 확인할 수 있습니다."
        />
        <div className="space-y-6 p-6">
          <ProductSelect
            id="bd-product"
            value={product}
            onChange={pickProduct}
            options={PRODUCTS.filter((p) => p !== "Common")}
          />

          {/* 모듈 행 — FROM → TO 전폭 2열, 제품 선택 전 비활성 */}
          {rows.map((row) => (
            <div key={row.id} className="space-y-2">
              <p className="text-xs font-semibold uppercase text-secondary-foreground">
                {row.label} <span className="text-destructive">*</span>
              </p>
              <div className="flex items-end gap-3">
                {(["from", "to"] as const).map((side, i) => (
                  <React.Fragment key={side}>
                    {i === 1 && <ArrowRight className="mb-2.5 size-4 shrink-0 text-secondary-foreground" />}
                    <div className="min-w-0 flex-1 space-y-2">
                      <Label htmlFor={`${row.id}-${side}`} className="text-xs uppercase text-secondary-foreground">
                        {side}
                      </Label>
                      <Select
                        value={row.pair[side]}
                        disabled={!product}
                        onValueChange={(v) => {
                          row.set({ ...row.pair, [side]: v });
                          setCompared(false);
                        }}
                      >
                        <SelectTrigger id={`${row.id}-${side}`} className="w-full" aria-label={`${row.label} ${side}`}>
                          <SelectValue placeholder={product ? "버전을 선택하세요" : "제품을 먼저 선택하세요."} />
                        </SelectTrigger>
                        <SelectContent>
                          {row.options.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button disabled={!ready} onClick={() => setCompared(true)}>
              비교하기
            </Button>
          </div>
        </div>
      </Card>

      {compared && (
        <Card variant="flat">
          <CardHead
            title="비교 결과"
            description={`Common · ${common.from} → ${common.to} / ${product} · ${module.from} → ${module.to}의 번들 버전 비교 결과입니다.`}
          />
          <div className="p-6">
            {changedFiles.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>업데이트 내용 없음</EmptyTitle>
                  <EmptyDescription>변경된 파일이 없거나 모든 항목이 최신 상태입니다.</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" onClick={() => setCompared(false)}>
                  다시 확인하기
                </Button>
              </Empty>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">
                  변경 파일 <span className="font-mono">{changedFiles.length}</span>
                </p>
                <div className="space-y-1">
                  {changedFiles.map((f) => (
                    <DiffFile key={f.path} file={f} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------- ③ 릴리즈 노트 갱신 */

function NotesTab() {
  const [product, setProduct] = React.useState("");
  const [version, setVersion] = React.useState("");
  const refresh = useMockRefresh(() =>
    toast.success("릴리즈 노트를 갱신했습니다", {
      description: version ? `${product} · ${version}` : `${product} · 전체 버전`,
    }),
  );

  return (
    <Card variant="flat">
      <CardHead
        title="제품 & 버전 선택"
        description="제품과 버전을 선택하고 갱신 버튼을 눌러 릴리즈 노트를 갱신하세요."
      />
      <div className="space-y-6 p-6">
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

        {/* 제품·버전 전폭 + 행 끝 [갱신] — 제품 선택 전 비활성, 갱신은 회전 + 토스트 */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <ProductSelect
              id="rn-product"
              value={product}
              onChange={(v) => {
                setProduct(v);
                setVersion("");
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <VersionSelect id="rn-version" product={product} value={version} onChange={setVersion} />
          </div>
          <Button
            className="shrink-0"
            disabled={!product || refresh.busy}
            aria-busy={refresh.busy}
            onClick={refresh.run}
          >
            <RefreshCw className={refresh.busy ? "size-4 animate-spin" : "size-4"} /> 갱신
          </Button>
        </div>
      </div>
    </Card>
  );
}
