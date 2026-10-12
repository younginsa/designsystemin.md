"use client";

// 계정 권한 관리 — ① HiNAS 365 메인 레이아웃 + A 리스트 본문
// 원천: Avikus Design library 「계정 관리」 캡처
//
// 원본 대조 메모
// - 이메일/이름 검색 + 우측 [저장](primary) · [취소]
// - 컬럼: Email · Name · Role(정렬) · Delete
// - Role 셀: 역할 태그 칩(× 제거) + 점선 (+) 버튼 → 팝오버(검색 + 체크박스 목록:
//   Avikus / Sales / Research / Service Engineer / QA / DEV / Admin) — data-roletag 관례
// - 일괄 역할 편집(2026-10-08): 맨 앞 체크박스 열(헤더 = 보이는 행 전체) → 표 위 「N명 선택됨 · [역할 편집▾] · 선택 해제」 바.
//   역할 편집 = 체크 목록 + 보유 수(N/전체) — 누르면 고른 전원에게 추가/제거, 확정은 기존 [저장]
// - 역할 이니셜 원(2026-10-08): 칩·두 팝오버 목록 앞에 두 글자 원(AV·SA·RE·SE·QA·DV·AD) + 칩 호버 툴팁(역할 설명) — _detail/role-mark.tsx 공용
// - 원본 역할 칩 색상(빨강·노랑·초록 구분)은 상태 토큰 부족(DES-206)으로 secondary 통일
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { PageHeader } from "@ds/ui/ui/page-header";
import { Card } from "@ds/ui/ui/card";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import { Check, ChevronDown, Info, Plus, Search, Trash2, X } from "lucide-react";

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

import { RoleMark, RoleTip } from "../../_detail/role-mark";

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

  // 일괄 역할 편집(2026-10-08) — 체크박스로 사람을 고르고 표 위 바에서 역할을 한 번에 더하거나 뺀다
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const pickedRows = accounts.filter((a) => picked.has(a.email));
  const allPicked = rows.length > 0 && rows.every((a) => picked.has(a.email));
  const togglePick = (email: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  // 고른 전원에게 역할 추가(add) 또는 전원에게서 제거
  const bulkRole = (role: string, add: boolean) =>
    mutate((prev) =>
      prev.map((a) =>
        !picked.has(a.email)
          ? a
          : add
            ? a.roles.includes(role) ? a : { ...a, roles: [...a.roles, role] }
            : { ...a, roles: a.roles.filter((r) => r !== role) },
      ),
    );

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
      <PageHeader
        title="계정 권한 관리"
        actions={
          <>
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
          </>
        }
      />

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
        <Card variant="flat" className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">계정 목록을 불러오는 중입니다…</p>
        </Card>
      )}

      {view === "error" && (
        <ErrorState
            title="계정 목록을 불러오지 못했습니다."
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => setView("default")}
          />
      )}

      {view === "empty" && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>등록된 계정이 없습니다.</EmptyTitle>
            <EmptyDescription>사용자가 초대되면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <div className="space-y-2">
          {/* 일괄 작업 바 — 1명 이상 고르면 표 위에 나타난다 */}
          {picked.size > 0 && (
            <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
              <span className="text-sm font-medium">{picked.size}명 선택됨</span>
              <BulkRolePopover selected={pickedRows} onApply={bulkRole} />
              <Button variant="ghost" size="sm" className="ml-auto text-secondary-foreground" onClick={() => setPicked(new Set())}>
                선택 해제
              </Button>
            </div>
          )}
          <Table className="bg-card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="보이는 계정 전체 선택"
                    // 일부 선택(indeterminate)은 표시하지 않는다 — DS Checkbox 에 ▣ 표시가 없어 체크(☑)처럼 보였다(FE 요청 항목)
                    checked={allPicked}
                    onCheckedChange={() =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        rows.forEach((a) => (allPicked ? next.delete(a.email) : next.add(a.email)));
                        return next;
                      })
                    }
                  />
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-20">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.email} data-state={picked.has(a.email) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      aria-label={`${a.name} 선택`}
                      checked={picked.has(a.email)}
                      onCheckedChange={() => togglePick(a.email)}
                    />
                  </TableCell>
                  <TableCell>
                    <a href="#" className="font-medium text-primary hover:underline">
                      {a.email}
                    </a>
                  </TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {a.roles.map((r) => (
                        <RoleTip key={r} role={r}>
                        <Badge variant="secondary" className="gap-1.5 pl-0.5 font-normal">
                          <RoleMark role={r} />
                          {r}
                          <button
                            type="button"
                            aria-label={`${a.name}에서 ${r} 역할 제거`}
                            onClick={() => toggleRole(a.email, r)}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                        </RoleTip>
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
                      onClick={() => {
                        mutate((prev) => prev.filter((x) => x.email !== a.email));
                        setPicked((prev) => {
                          const next = new Set(prev);
                          next.delete(a.email);
                          return next;
                        });
                      }}
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

// 일괄 역할 편집 — ☑ 고른 전원이 가짐 · ☐ 일부 또는 아무도 없음(오른쪽 숫자 N/전체로 구분).
// ☐ 를 누르면 전원에게 추가, ☑ 를 누르면 전원에게서 제거. 행 (+) 팝오버와 같은 목록 문법(검색 + 체크 목록)
function BulkRolePopover({
  selected,
  onApply,
}: {
  selected: Account[];
  onApply: (role: string, add: boolean) => void;
}) {
  const [query, setQuery] = React.useState("");
  const shown = ALL_ROLES.filter((r) => r.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          역할 편집 <ChevronDown className="size-4 text-secondary-foreground" />
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
          {shown.map((r) => {
            const has = selected.filter((a) => a.roles.includes(r)).length;
            const all = has === selected.length;
            return (
              <Label
                key={r}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 font-normal hover:bg-accent"
              >
                {/* 일부만 가진 역할은 체크 없이 오른쪽 숫자(2/5)로 읽힌다 — DS Checkbox ▣(indeterminate) 표시 대기 */}
                <Checkbox checked={all} onCheckedChange={() => onApply(r, !all)} />
                <RoleMark role={r} />
                {r}
                <span className="ml-auto text-xs text-secondary-foreground">
                  {has}/{selected.length}
                </span>
              </Label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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
              <RoleMark role={r} />
              {r}
            </Label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

