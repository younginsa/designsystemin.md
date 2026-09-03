"use client";

// 계정 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트)
// 원천: hinas365 와이어프레임 wireframe_account_list.html
//
// 와이어프레임 대조 메모
// - 헤더 "총 6개" + [+ 계정 등록](모달: 유형 카드 선사/조선소/운항사, 계정명·사업자번호·
//   국가·티어·메모 + 담당자 추가)
// - 컬럼: 계정명▾ / 계정 유형▾ / 국가▾ / 담당자 / 관련 계약 / 관련 호선 / 티어▾ / 등록일
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useRouter } from "next/navigation";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { Anchor, Building2, ChevronDown, Factory, Info, Plus, Ship } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Input } from "@ds/ui/ui/input";
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
import {
  ROWS_PER_PAGE_DEFAULT,
  RowsPerPage,
} from "@ds/ui/ui/rows-per-page";

// 새 규칙(2026-08-26): 정렬은 헤더 전담 · 필터는 전부 FilterBar(2026-08-26 승격 완료)
import {
  FilterBar,
  type FilterDef,
  type FilterValues,
} from "@ds/ui/ui/filter-bar";
import { Textarea } from "@ds/ui/ui/textarea";

const BASE = "/gallery/sales365";

type Row = {
  name: string;
  type: "선사" | "조선소" | "운항사";
  country: string;
  manager: string;
  contracts: number;
  vessels: number;
  tier: string;
  createdOn: string;
};

const ROWS: Row[] = [
  { name: "○○해운", type: "선사", country: "대한민국", manager: "김영업", contracts: 3, vessels: 8, tier: "Tier 1", createdOn: "2024-03-01" },
  { name: "△△해운", type: "선사", country: "대한민국", manager: "박세일", contracts: 1, vessels: 3, tier: "Tier 2", createdOn: "2024-06-12" },
  { name: "▲▲선사", type: "운항사", country: "그리스", manager: "김영업", contracts: 2, vessels: 5, tier: "Tier 2", createdOn: "2024-09-20" },
  { name: "☆☆해운", type: "선사", country: "싱가포르", manager: "이대리", contracts: 1, vessels: 2, tier: "Tier 3", createdOn: "2025-01-15" },
  { name: "△△중공업", type: "조선소", country: "대한민국", manager: "박세일", contracts: 0, vessels: 12, tier: "Tier 1", createdOn: "2024-02-01" },
  { name: "□□조선", type: "조선소", country: "중국", manager: "이대리", contracts: 0, vessels: 4, tier: "Tier 3", createdOn: "2025-04-08" },
];

const TYPE_CARDS = [
  { icon: Ship, label: "선사", desc: "Ship Owner / 해운사" },
  { icon: Factory, label: "조선소", desc: "Shipyard / 건조사" },
  { icon: Anchor, label: "운항사", desc: "Ship Operator / 운항사" },
] as const;

// 새 규칙(2026-08-26): 필터는 전부 FilterBar — 컬럼 헤더 필터 편입(계정명은 검색으로).
const PAGE_FILTERS: FilterDef[] = [
  { name: "type", label: "계정 유형", options: ["선사", "조선소", "운항사"], multi: true },
  { name: "country", label: "국가", options: ["대한민국", "일본", "중국", "노르웨이", "그리스", "싱가포르", "기타"], multi: true },
  { name: "tier", label: "티어", options: ["Tier 1", "Tier 2", "Tier 3"], multi: true },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365AccountsPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  // 푸터 페이지네이션 문법(2026-08-26) — 페이지네이션 없어도 페이지당·전체 건수는 하단
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [accountType, setAccountType] = React.useState("선사");

  const rows = view === "empty" ? [] : ROWS;


  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">계정</h1>
        </div>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {/* ── 툴바 — 새 규칙(2026-08-26): 필터는 전부 여기, 헤더는 정렬만 ── */}
      <FilterBar
        searchPlaceholder="계정명 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={PAGE_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> 계정 등록
          </Button>
        }
      />

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">계정 목록을 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="계정 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>등록된 계정이 없습니다.</EmptyTitle>
            <EmptyDescription>고객사·조선소 계정을 등록하면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> 계정 등록
          </Button>
        </Empty>
      )}

      {view === "default" && (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead>계정명</TableHead>
              <TableHead>계정 유형</TableHead>
              <TableHead>국가</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>관련 계약</TableHead>
              <TableHead>관련 호선</TableHead>
              <TableHead>티어</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.name}
                className="cursor-pointer hover:bg-accent"
                onClick={() => router.push(`${BASE}/accounts/detail`)}
              >
                <TableCell>
                  <Link
                    href={`${BASE}/accounts/detail`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {r.type}
                  </Badge>
                </TableCell>
                <TableCell>{r.country}</TableCell>
                <TableCell>{r.manager}</TableCell>
                <TableCell>{r.contracts > 0 ? `${r.contracts}건` : <span className="text-secondary-foreground">—</span>}</TableCell>
                <TableCell>{r.vessels}척</TableCell>
                <TableCell>{r.tier}</TableCell>
                <TableCell className="font-mono text-sm">{r.createdOn}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* ── 푸터 — 건수는 하단 규칙(2026-08-26): 페이지네이션 없어도 여기 ── */}
      {view === "default" && (
        <RowsPerPage value={pageSize} onChange={setPageSize} summary={`총 ${rows.length}개`} />
      )}

      {/* ── 계정 등록 모달 ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>계정 등록</DialogTitle>
            <DialogDescription>고객사·조선소·운항사 계정을 등록합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                계정 유형 <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_CARDS.map(({ icon: Icon, label, desc }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAccountType(label)}
                    className={
                      "rounded-md border p-3 text-left text-sm " +
                      (accountType === label
                        ? "border-primary bg-accent"
                        : "hover:bg-accent")
                    }
                  >
                    <Icon className="size-4 text-secondary-foreground" />
                    <p className="mt-1 font-medium">{label}</p>
                    <p className="text-xs text-secondary-foreground">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="a-name">계정명</Label>
                <Input id="a-name" placeholder="예) ○○해운" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-brn">사업자등록번호</Label>
                <Input id="a-brn" placeholder="000-00-00000" />
              </div>
              <div className="space-y-2">
                <Label>국가</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="— 선택 —" />
                  </SelectTrigger>
                  <SelectContent>
                    {["대한민국", "일본", "중국", "노르웨이", "그리스", "싱가포르", "기타"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>티어</Label>
                <Select defaultValue="Tier 2">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Tier 1", "Tier 2", "Tier 3"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-memo">메모</Label>
              <Textarea id="a-memo" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>담당자</Label>
                <Button variant="ghost" size="sm">
                  <Plus className="size-4" /> 추가
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="이름 *" aria-label="담당자 이름" />
                <Input placeholder="직책 / 직급" aria-label="담당자 직책" />
                <Input placeholder="전화번호" aria-label="담당자 전화번호" />
                <Input placeholder="이메일" aria-label="담당자 이메일" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setCreateOpen(false)}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
