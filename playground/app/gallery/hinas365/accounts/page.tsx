"use client";

// 계정 권한 관리 — ① HiNAS 365 메인 레이아웃 + A 리스트 본문
// 원천: Avikus Design library 「계정 관리」 캡처
//
// 원본 대조 메모
// - 이메일/이름 검색 + 우측 [저장](primary) · [취소]
// - 컬럼: Email · Name · Role(정렬) · Delete
// - Role 셀: 역할 태그 칩(× 제거) + 점선 (+) 버튼 → 팝오버(검색 + 체크박스 목록:
//   Avikus / Sales / Research / Service Engineer / QA / DEV / Admin) — data-roletag 관례
// - 원본 역할 칩 색상(빨강·노랑·초록 구분)은 상태 토큰 부족(DES-206)으로 secondary 통일
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import { Check, Info, Plus, Search, Trash2, X } from "lucide-react";

import { Alert, AlertTitle } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Checkbox } from "@ds/ui/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
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
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";

const ALL_ROLES = ["Avikus", "Sales", "Research", "Service Engineer", "QA", "DEV", "Admin"];

type Account = { email: string; name: string; roles: string[] };

const INITIAL: Account[] = [
  { email: "user001@avikus.ai", name: "user-001", roles: ["Avikus"] },
  { email: "user002@avikus.ai", name: "user-002", roles: ["Admin"] },
  { email: "user003@avikus.ai", name: "user-003", roles: ["Service Engineer"] },
  { email: "user004@avikus.ai", name: "user-004", roles: ["Avikus"] },
  { email: "user005@avikus.ai", name: "user-005", roles: ["Avikus"] },
  { email: "user006@avikus.ai", name: "user-006", roles: ["Avikus"] },
  { email: "user007@avikus.ai", name: "user-007", roles: ["Admin"] },
  { email: "user008@avikus.ai", name: "user-008", roles: ["Service Engineer"] },
  { email: "user009@avikus.ai", name: "user-009", roles: ["Avikus", "Admin"] },
  { email: "user010@avikus.ai", name: "user-010", roles: ["Avikus", "Service Engineer"] },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function AccountsPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [keyword, setKeyword] = React.useState("");
  const [accounts, setAccounts] = React.useState<Account[]>(INITIAL);
  const [dirty, setDirty] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const rows = (view === "empty" ? [] : accounts).filter(
    (a) =>
      !keyword.trim() ||
      a.email.includes(keyword.trim()) ||
      a.name.includes(keyword.trim()),
  );

  const mutate = (fn: (prev: Account[]) => Account[]) => {
    setAccounts(fn);
    setDirty(true);
    setSaved(false);
  };

  const toggleRole = (email: string, role: string) =>
    mutate((prev) =>
      prev.map((a) =>
        a.email === email
          ? {
              ...a,
              roles: a.roles.includes(role)
                ? a.roles.filter((r) => r !== role)
                : [...a.roles, role],
            }
          : a,
      ),
    );

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold">계정 권한 관리</h1>
        <div className="flex items-center gap-2">
          <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
          {/* CTA 순서 관례: Primary는 맨 오른쪽 */}
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setAccounts(INITIAL);
              setDirty(false);
              setSaved(false);
            }}
          >
            <X className="size-4" /> 취소
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              setDirty(false);
              setSaved(true);
            }}
          >
            <Check className="size-4" /> 저장
          </Button>
        </div>
      </div>

      <InputGroup variant="filled" className="w-72">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="이메일/이름 검색"
          aria-label="이메일 또는 이름 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </InputGroup>

      {saved && (
        <Alert>
          <Check className="size-4" />
          <AlertTitle className="text-success">권한 변경이 저장되었습니다</AlertTitle>
        </Alert>
      )}

      {/* ── 상태별 본문 ── */}
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
            <EmptyDescription>사용자가 초대되면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <div>
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-20">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.email}>
                  <TableCell>
                    <a href="#" className="font-medium text-primary hover:underline">
                      {a.email}
                    </a>
                  </TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {a.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="font-normal">
                          {r}
                          <button
                            type="button"
                            aria-label={`${a.name}에서 ${r} 역할 제거`}
                            onClick={() => toggleRole(a.email, r)}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                      <RoleAddPopover
                        assigned={a.roles}
                        onToggle={(role) => toggleRole(a.email, role)}
                        ariaLabel={`${a.name} 역할 추가`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${a.name} 삭제`}
                      className="text-destructive"
                      onClick={() => mutate((prev) => prev.filter((x) => x.email !== a.email))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function RoleAddPopover({
  assigned,
  onToggle,
  ariaLabel,
}: {
  assigned: string[];
  onToggle: (role: string) => void;
  ariaLabel: string;
}) {
  const [query, setQuery] = React.useState("");
  const shown = ALL_ROLES.filter((r) => r.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={ariaLabel}
          className="size-6 rounded-full border-dashed text-secondary-foreground"
        >
          <Plus className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-2 p-2">
        <InputGroup variant="filled">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="검색..."
            aria-label="역할 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <div className="space-y-0.5">
          {shown.length === 0 && (
            <p className="px-2 py-2 text-sm text-secondary-foreground">검색 결과 없음</p>
          )}
          {shown.map((r) => (
            <Label
              key={r}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 font-normal hover:bg-accent"
            >
              <Checkbox checked={assigned.includes(r)} onCheckedChange={() => onToggle(r)} />
              {r}
            </Label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

