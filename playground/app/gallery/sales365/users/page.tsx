"use client";

// 유저 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트)
// 원천: hinas365 와이어프레임 wireframe_user_list.html
//
// 와이어프레임 대조 메모
// - 헤더 "총 N명" + [+ 유저 등록](모달: 이름·팀·이메일(중복 안내)·활성 여부)
// - 컬럼: 이름▾ / 팀▾ / 이메일 / 담당 계약 / 활성 여부▾ / 등록일
// - 활성=success 도트 · 비활성=muted 도트 (도트+텍스트 규칙)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { useRouter } from "next/navigation";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import Link from "next/link";
import { Info, Plus, Users } from "lucide-react";

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

const BASE = "/generated/sales365";

type Row = { name: string; team: string; email: string; contracts: number; active: boolean; createdOn: string };

const ROWS: Row[] = [
  { name: "김민준", team: "영업", email: "mj.kim@company.com", contracts: 3, active: true, createdOn: "2023-02-01" },
  { name: "홍길동", team: "기술영업", email: "gd.hong@company.com", contracts: 4, active: true, createdOn: "2023-05-10" },
  { name: "김담당", team: "영업", email: "dd.kim@company.com", contracts: 2, active: true, createdOn: "2024-01-20" },
  { name: "이대리", team: "기술영업", email: "dr.lee@company.com", contracts: 3, active: true, createdOn: "2024-03-05" },
  { name: "이수진", team: "PM", email: "sj.lee@company.com", contracts: 0, active: true, createdOn: "2024-07-11" },
  { name: "박전직", team: "영업", email: "jj.park@company.com", contracts: 0, active: false, createdOn: "2022-11-01" },
];

// 새 규칙(2026-08-26): 필터는 전부 FilterBar — 컬럼 헤더 필터 편입(이름은 검색으로).
const PAGE_FILTERS: FilterDef[] = [
  { name: "team", label: "팀", options: ["영업", "기술영업", "PM"], multi: true },
  { name: "active", label: "활성 여부", options: ["활성", "비활성"] },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365UsersPage() {
  const router = useRouter(); // 행 클릭 → 상세 (A 문법)
  const [view, setView] = React.useState<ViewState>("default");
  // 푸터 페이지네이션 문법(2026-08-26) — 페이지네이션 없어도 페이지당·전체 건수는 하단
  const [pageSize, setPageSize] = React.useState(ROWS_PER_PAGE_DEFAULT);
  const [keyword, setKeyword] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<FilterValues>({});
  const [extraShown, setExtraShown] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);

  const rows = view === "empty" ? [] : ROWS;


  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">유저</h1>
        </div>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {/* ── 툴바 — 새 규칙(2026-08-26): 필터는 전부 여기, 헤더는 정렬만 ── */}
      <FilterBar
        searchPlaceholder="이름 검색"
        keyword={keyword}
        onKeyword={setKeyword}
        filters={PAGE_FILTERS}
        values={filterValues}
        onChange={(name, v) => setFilterValues((prev) => ({ ...prev, [name]: v }))}
        extraShown={extraShown}
        onExtraShownChange={setExtraShown}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> 유저 등록
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
          <p className="text-sm text-secondary-foreground">유저 목록을 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="유저 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>등록된 유저가 없습니다.</EmptyTitle>
            <EmptyDescription>사내 유저를 등록하면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> 유저 등록
          </Button>
        </Empty>
      )}

      {view === "default" && (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>팀</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>담당 계약</TableHead>
              <TableHead>활성 여부</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.email}
                className={"cursor-pointer hover:bg-accent" + (!r.active ? " opacity-60" : "")}
                onClick={() => router.push(`${BASE}/users/detail`)}
              >
                <TableCell>
                  <Link
                    href={`${BASE}/users/detail`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell>{r.team}</TableCell>
                <TableCell className="font-mono text-sm">{r.email}</TableCell>
                <TableCell>
                  {r.contracts > 0 ? `${r.contracts}건` : <span className="text-secondary-foreground">—</span>}
                </TableCell>
                <TableCell>
                  {r.active ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="size-2 rounded-full bg-success" /> 활성
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="size-2 rounded-full bg-muted-foreground" /> 비활성
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{r.createdOn}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* ── 푸터 — 건수는 하단 규칙(2026-08-26): 페이지네이션 없어도 여기 ── */}
      {view === "default" && (
        <RowsPerPage value={pageSize} onChange={setPageSize} summary={`총 ${rows.length}명`} />
      )}

      {/* ── 유저 등록 모달 ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>유저 등록</DialogTitle>
            <DialogDescription>신규 등록 시 항상 활성으로 시작합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-name">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input id="u-name" />
            </div>
            <div className="space-y-2">
              <Label>팀</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {["영업", "기술영업", "PM"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">이메일</Label>
              <Input id="u-email" placeholder="name@company.com" />
              <p className="text-xs text-secondary-foreground">
                사내 계정 이메일. 이미 등록된 이메일은 사용할 수 없습니다.
              </p>
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
