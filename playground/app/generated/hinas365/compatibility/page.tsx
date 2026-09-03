"use client";

// 버전 호환성 — ① HiNAS 365 메인 레이아웃, 탭 2개
// 원천: Avikus Design library 「버전 호환성」 캡처 6장 (모달 1장 중복 → 고유 5장)
//
// 탭 1 · 버전 호환성 — Common × 제품 호환 매트릭스 (data-matrix 관례)
//   열람 모드: 검색 + [수정] / 수정 모드: [+ Common 버전 추가] + [완료] +
//   실시간 수정 모드 배너(노랑 → DES-206 부재로 기본 Alert 대체), 셀 + 점선 버튼,
//   ★=설치 권장 버전, 행 삭제. 버전 추가 모달: 버전 칩 다중 선택 + 전체 선택 +
//   "설치 권장 버전으로 등록" + [추가(n개)]
// 탭 2 · 업데이트 호환성 — 좌 시작 버전(from) 트리 + 우 업데이트 대상(TO) 표.
//   추가 모달: from 페어 고정 + to 콤보(등록됨 배지) + 선택 칩 + 메모 + [n개 버전 등록]
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Checkbox } from "@ds/ui/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { Input } from "@ds/ui/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@ds/ui/ui/input-group";
import { Label } from "@ds/ui/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@ds/ui/ui/popover";
import { Progress } from "@ds/ui/ui/progress";
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

/* ---------------------------------------------------------------- 데이터 */

type VerChip = { v: string; star?: boolean };
type MatrixRow = {
  common: string;
  star?: boolean;
  navigation: VerChip[];
  svm: VerChip[];
  control: VerChip[];
  serverTypes: string[];
};

const MATRIX: MatrixRow[] = [
  { common: "v4.0.5-temp", navigation: [], svm: [], control: [], serverTypes: ["XE4"] },
  { common: "v4.0.3-fail1", navigation: [], svm: [], control: [], serverTypes: [] },
  { common: "v4.0.2-scenario", navigation: [], svm: [], control: [], serverTypes: ["XE4"] },
  { common: "v4.0.0-scenario-test", star: true, navigation: [{ v: "v3.5.3", star: true }], svm: [], control: [], serverTypes: [] },
  { common: "v4.0.0-update.15", star: true, navigation: [{ v: "v3.5.3" }], svm: [], control: [], serverTypes: [] },
  { common: "v3.7.0-rc.1", navigation: [], svm: [], control: [], serverTypes: [] },
  { common: "v3.6.0", navigation: [], svm: [], control: [], serverTypes: [] },
  { common: "v3.5.0", star: true, navigation: [{ v: "v3.5.0", star: true }], svm: [{ v: "v1.2.0", star: true }], control: [], serverTypes: [] },
  { common: "v3.4.2", star: true, navigation: [], svm: [{ v: "v1.1.2", star: true }], control: [], serverTypes: [] },
  { common: "v3.4.1", star: true, navigation: [], svm: [{ v: "v1.1.1", star: true }], control: [], serverTypes: [] },
  { common: "v3.3.1", star: true, navigation: [{ v: "v3.3.1", star: true }], svm: [], control: [{ v: "v1.4.4", star: true }], serverTypes: [] },
  { common: "v3.3.0", navigation: [{ v: "v3.3.0", star: true }], svm: [], control: [], serverTypes: [] },
  { common: "v3.2.0", navigation: [{ v: "v3.2.1", star: true }, { v: "v3.2.0", star: true }], svm: [], control: [], serverTypes: [] },
  { common: "v3.1.2", navigation: [{ v: "v3.1.1" }], svm: [{ v: "v1.0.0" }], control: [], serverTypes: [] },
];

const SVM_CANDIDATES = [
  "v2.0.0-rc.5", "v2.0.0-rc.4", "v2.0.0-rc.3", "v2.0.0-rc.1",
  "v2.0.0-test.16", "v2.0.0-test.15", "v2.0.0-test.9", "v2.0.0-test.1",
  "v2.0.0-update.1", "v1.2.2", "v1.2.1", "v1.2.0", "v1.1.3", "v1.1.2",
  "v1.1.1", "v1.1.0", "v1.0.0",
];

type FromEntry = { common: string; product: string; count: number };
const FROM_TREE: { group: string; icon: string; count: number; entries: FromEntry[] }[] = [
  {
    group: "Navigation",
    icon: "nav",
    count: 10,
    entries: [
      { common: "v4.0.0-scenario-test", product: "v3.5.3", count: 1 },
      { common: "v4.0.0-update.15", product: "v3.5.3", count: 0 },
      { common: "v3.5.0", product: "v3.5.0", count: 2 },
      { common: "v3.3.1", product: "v3.3.1", count: 0 },
      { common: "v3.3.0", product: "v3.3.0", count: 2 },
      { common: "v3.2.0", product: "v3.2.1", count: 0 },
      { common: "v3.2.0", product: "v3.2.0", count: 0 },
      { common: "v3.1.2", product: "v3.1.1", count: 0 },
      { common: "v3.1.1", product: "v3.1.1", count: 0 },
      { common: "v3.1.0", product: "v3.1.0", count: 0 },
    ],
  },
  { group: "Svm", icon: "svm", count: 6, entries: [] },
  { group: "Control", icon: "ctl", count: 1, entries: [] },
];

const TO_ROWS: { to: string; toP: string; memo: string; at: string; ago: string; by: string }[] = [
  { to: "v4.0.0-update.15", toP: "v3.5.3", memo: "2", at: "2026-06-10 10:09:13", ago: "1개월 전", by: "kwangwook.yun@avikus.ai" },
  { to: "v4.0.0-scenario-test", toP: "v3.5.3", memo: "-", at: "2026-06-10 10:08:59", ago: "1개월 전", by: "kwangwook.yun@avikus.ai" },
];

const TO_CANDIDATES = [
  { label: "common v4.0.0-scenario-test · navigation v3.5.3", registered: true },
  { label: "common v4.0.0-update.15 · navigation v3.5.3", registered: true },
  { label: "common v3.5.0 · navigation v3.5.0", registered: false },
  { label: "common v3.3.1 · navigation v3.3.1", registered: false },
  { label: "common v3.3.0 · navigation v3.3.0", registered: false },
  { label: "common v3.2.0 · navigation v3.2.1", registered: false },
  { label: "common v3.1.2 · navigation v3.1.1", registered: false },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

/* ---------------------------------------------------------------- 페이지 */

export default function CompatibilityPage() {
  const [view, setView] = React.useState<ViewState>("default");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold">버전 호환성</h1>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">호환성 정보를 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
            title="호환성 정보를 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>등록된 호환성 정보가 없습니다.</EmptyTitle>
            <EmptyDescription>Common 버전을 추가하면 매트릭스가 표시됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <Tabs defaultValue="matrix" className="space-y-4">
          <TabsList>
            <TabsTrigger value="matrix">버전 호환성</TabsTrigger>
            <TabsTrigger value="update">업데이트 호환성</TabsTrigger>
          </TabsList>
          <TabsContent value="matrix">
            <MatrixTab />
          </TabsContent>
          <TabsContent value="update">
            <UpdateTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ---------------------------------------------------- 탭 1 · 버전 호환성 매트릭스 */

function MatrixTab() {
  const [editing, setEditing] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [keyword, setKeyword] = React.useState("");

  const rows = MATRIX.filter((r) => !keyword.trim() || r.common.includes(keyword.trim()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <InputGroup variant="filled" className="w-72">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Common 버전 검색"
            aria-label="Common 버전 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </InputGroup>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Common 버전 추가
            </Button>
            <Button onClick={() => setEditing(false)}>
              <Check className="size-4" /> 완료
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="size-4" /> 수정
          </Button>
        )}
      </div>

      {/* 실시간 수정 모드 배너 — 원본 노랑 → warning 부재(DES-206)로 기본 Alert 대체 */}
      {editing && (
        <Alert>
          <Zap className="size-4" />
          <AlertTitle>실시간 수정 모드</AlertTitle>
          <AlertDescription>
            <p>
              별 아이콘을 눌러 권장 버전을 설정하고, 체크박스로 여러 버전을 선택해 한 번에 삭제할 수
              있습니다. 모든 변경사항은 즉시 반영됩니다.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead>공통</TableHead>
              <TableHead className="uppercase">Navigation</TableHead>
              <TableHead className="uppercase">SVM</TableHead>
              <TableHead className="uppercase">Control</TableHead>
              <TableHead>서버 유형</TableHead>
              {editing && <TableHead className="w-14">삭제</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.common}>
                <TableCell>
                  <span className="flex items-center gap-1.5 font-mono font-medium">
                    {r.common}
                    {(r.star || editing) && (
                      <Star
                        className={
                          "size-4 " +
                          (r.star ? "fill-primary text-primary" : "text-secondary-foreground")
                        }
                      />
                    )}
                  </span>
                </TableCell>
                {([r.navigation, r.svm, r.control] as VerChip[][]).map((chips, ci) => (
                  <TableCell key={ci}>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {chips.map((c) => (
                        <Badge key={c.v} variant="outline" className="gap-1 font-mono font-normal">
                          {editing && <Checkbox className="size-3.5" aria-label={`${c.v} 선택`} />}
                          {c.v}
                          {c.star && <Star className="size-3 fill-primary text-primary" />}
                        </Badge>
                      ))}
                      {editing && (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="버전 추가"
                          className="size-6 rounded-full border-dashed text-secondary-foreground"
                          onClick={() => setAddOpen(true)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      )}
                    </span>
                  </TableCell>
                ))}
                <TableCell>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {r.serverTypes.map((s) => (
                      <Badge key={s} variant="outline" className="gap-1 font-mono font-normal">
                        {s}
                        {editing && (
                          <button type="button" aria-label={`${s} 삭제`}>
                            <Trash2 className="size-3 text-destructive" />
                          </button>
                        )}
                      </Badge>
                    ))}
                    {editing && (
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="서버 타입 추가"
                        className="size-6 rounded-full border-dashed text-secondary-foreground"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    )}
                  </span>
                </TableCell>
                {editing && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${r.common} 삭제`}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 버전 추가 모달 */}
      <AddVersionDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddVersionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const toggle = (v: string) =>
    setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSelected([]);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">COMMON VERSION: v4.0.5-temp / SVM</DialogTitle>
          <DialogDescription>
            Common v4.0.5-temp에 추가할 SVM 버전을 선택하세요. 여러 개를 선택할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Label className="flex items-center gap-2 text-sm font-normal">
            <Checkbox
              checked={selected.length === SVM_CANDIDATES.length}
              onCheckedChange={(v) => setSelected(v === true ? [...SVM_CANDIDATES] : [])}
            />
            전체 선택
          </Label>
        </div>

        <div className="flex flex-wrap gap-2">
          {SVM_CANDIDATES.map((v) => {
            const on = selected.includes(v);
            return (
              <Button
                key={v}
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={on}
                className={"font-mono " + (on ? "border-primary bg-primary/5 text-primary" : "")}
                onClick={() => toggle(v)}
              >
                {v}
              </Button>
            );
          })}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <Label className="flex items-center gap-2 text-sm font-normal">
            <Checkbox /> 설치 권장 버전으로 등록
          </Label>
          <Button disabled={selected.length === 0} onClick={() => onOpenChange(false)}>
            추가({selected.length}개)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------- 탭 2 · 업데이트 호환성 */

function UpdateTab() {
  const [selectedFrom, setSelectedFrom] = React.useState("v3.5.0");
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-start gap-4 xl:flex-row">
      {/* 좌: 시작 버전(from) 트리 */}
      <aside className="w-full shrink-0 space-y-3 rounded-lg border bg-card p-4 xl:w-80">
        <p className="text-sm font-medium">업데이트 시작 버전 (from)</p>
        <InputGroup variant="filled">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput placeholder="제품 · 버전 검색" aria-label="제품 버전 검색" />
        </InputGroup>

        <div className="space-y-1">
          {FROM_TREE.map((g) => (
            <div key={g.group}>
              <div className="flex items-center justify-between px-1 py-1.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {g.entries.length > 0 ? (
                    <ChevronDown className="size-4 text-secondary-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-secondary-foreground" />
                  )}
                  {g.group}
                </span>
                <span className="text-xs text-secondary-foreground">{g.count}</span>
              </div>
              {g.entries.map((e) => {
                const active = e.common === selectedFrom;
                return (
                  <button
                    key={e.common + e.product}
                    type="button"
                    className={
                      "flex w-full items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left " +
                      (active ? "bg-accent" : "hover:bg-accent")
                    }
                    onClick={() => setSelectedFrom(e.common)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-sm">
                        {e.common} · {e.product}
                      </span>
                      <span className="block text-xs text-secondary-foreground">
                        common · navigation
                      </span>
                    </span>
                    {e.count > 0 && (
                      <span className="shrink-0 text-xs text-secondary-foreground">{e.count}개 버전</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* 우: 업데이트 대상(TO) */}
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-mono text-lg font-bold">
            <Badge variant="secondary" className="font-sans font-normal uppercase">
              From
            </Badge>
            Navigation {selectedFrom} · {selectedFrom}
          </h2>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> 업데이트 버전 추가
          </Button>
        </div>

        <div>
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox aria-label="전체 선택" />
                </TableHead>
                <TableHead />
                <TableHead>업데이트 대상 (TO)</TableHead>
                <TableHead>메모</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>등록자</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TO_ROWS.map((r) => (
                <TableRow key={r.to}>
                  <TableCell>
                    <Checkbox aria-label={`${r.to} 선택`} />
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="size-4 text-secondary-foreground" />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1.5 font-mono font-normal">
                      <span className="text-secondary-foreground">c</span> {r.to}
                      <span className="text-secondary-foreground">· p</span> {r.toP}
                      <Star className="size-3 fill-primary text-primary" />
                    </Badge>
                  </TableCell>
                  <TableCell className="text-secondary-foreground">{r.memo}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{r.at}</span>{" "}
                    <span className="text-xs text-secondary-foreground">({r.ago})</span>
                  </TableCell>
                  <TableCell className="text-sm">{r.by}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 업데이트 버전 추가 모달 */}
      <AddUpdateDialog open={addOpen} onOpenChange={setAddOpen} from={selectedFrom} />
    </div>
  );
}

function AddUpdateDialog({
  open,
  onOpenChange,
  from,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  from: string;
}) {
  const [picked, setPicked] = React.useState<string[]>([]);
  const [comboOpen, setComboOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const shown = TO_CANDIDATES.filter(
    (c) => !query.trim() || c.label.includes(query.trim()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setPicked([]);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>업데이트 버전 추가</DialogTitle>
          <DialogDescription>
            시작 버전(from)에서 업데이트 가능한 대상 버전(to)을 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>시작 버전 페어 (from)</Label>
            <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
              <Badge variant="secondary" className="uppercase">
                Navigation
              </Badge>
              <span className="font-mono text-sm">
                <span className="text-secondary-foreground">c</span> {from}{" "}
                <span className="text-secondary-foreground">· p</span> {from}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>업데이트 대상 (to) — 여러 개 추가 가능</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  버전 페어 선택
                  <ChevronDown className="size-4 text-secondary-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-full space-y-2 p-2 sm:w-96">
                <InputGroup variant="filled">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="검색..."
                    aria-label="버전 페어 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </InputGroup>
                <div className="max-h-64 space-y-0.5 overflow-y-auto">
                  {shown.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      disabled={c.registered}
                      className={
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm " +
                        (c.registered
                          ? "cursor-not-allowed text-secondary-foreground"
                          : "hover:bg-accent")
                      }
                      onClick={() => {
                        if (!picked.includes(c.label)) setPicked((p) => [...p, c.label]);
                        setComboOpen(false);
                      }}
                    >
                      <span className="truncate">{c.label}</span>
                      {c.registered && (
                        <Badge variant="secondary" className="shrink-0 font-normal">
                          등록됨
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {picked.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {picked.map((p) => (
                  <Badge key={p} variant="outline" className="gap-1 font-mono font-normal text-primary">
                    → {p.replace("common ", "C ").replace("navigation ", "P ")}
                    <button
                      type="button"
                      aria-label={`${p} 제거`}
                      onClick={() => setPicked((prev) => prev.filter((x) => x !== p))}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="upd-memo">메모 (선택)</Label>
            <Input id="upd-memo" placeholder="메모를 입력하세요." />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button disabled={picked.length === 0} onClick={() => onOpenChange(false)}>
            {picked.length}개 버전 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

