"use client";

// 기능별 권한 — ① HiNAS 365 메인 레이아웃 + A 리스트 본문(필터 없는 표)
// 원천: 피그마 9bDM5hVObGhrFM6vLyeL3K 「permission 1」(1033:6125) — 2026-10-08 자리표시 → 실화면
//
// 원본 대조 메모
// - 헤더 우측 [수정](outline) 하나 — 누르면 편집 모드: [취소] · [저장](primary 맨 오른쪽)
// - 컬럼: Category · Permission(mono 파랑) · Description · 역할 7열(avikus … admin, 가운데 정렬)
// - Category 는 같은 그룹의 첫 행에만 표기 + 세로 병합(rowSpan) — 그룹 경계만 구분
// - 역할 셀 = Checkbox. 열람 모드는 disabled(읽기 전용), 편집 모드에서만 토글
// 상태: DEFAULT_STATES 4종 — 진행률 개념 없음(프로그레스 없음)

import * as React from "react";
import { Check, Pencil, X } from "lucide-react";

import { Alert, AlertTitle } from "@ds/ui/ui/alert";
import { Button } from "@ds/ui/ui/button";
import { Checkbox } from "@ds/ui/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { PageHeader } from "@ds/ui/ui/page-header";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import { DEFAULT_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";

import { RoleMark, RoleTip } from "../../_detail/role-mark";

const ROLES = ["avikus", "sales", "research", "service_engineer", "qa", "dev", "admin"] as const;
type Role = (typeof ROLES)[number];

type Perm = { category: string; key: string; description: string; roles: Role[] };

// 원본 캡처에서 읽은 체크 — 엔지니어 계열(research·service_engineer·qa·dev·admin)이 같은 묶음으로 반복된다
const ENG: Role[] = ["research", "service_engineer", "qa", "dev", "admin"];

const INITIAL: Perm[] = [
  { category: "account", key: "account:create", description: "Create a new account", roles: ["admin"] },
  { category: "account", key: "account:delete", description: "Delete account information", roles: ["admin"] },
  { category: "account", key: "account:read", description: "Read account information", roles: ["admin"] },
  { category: "account", key: "account:update", description: "Update account information", roles: ["admin"] },
  { category: "aws", key: "aws:ecr", description: "Create ECR Token", roles: ["avikus", ...ENG] },
  { category: "aws", key: "aws:iot:delete", description: "Delete AWS retained messages", roles: ["admin"] },
  { category: "codecommit", key: "codecommit:update", description: "Description for new permission", roles: ENG },
  { category: "developer", key: "developer:read", description: "Read Developer/QA information", roles: ENG },
  { category: "installation", key: "installation:create", description: "Create install", roles: ENG },
  { category: "installation", key: "installation:read", description: "Get install status & download", roles: ENG },
  { category: "permission", key: "permission:create", description: "Create permission information", roles: ["admin"] },
  { category: "permission", key: "permission:delete", description: "Delete permission information", roles: ["admin"] },
  { category: "permission", key: "permission:read", description: "Read permission information", roles: ["admin"] },
  { category: "permission", key: "permission:update", description: "Update permission information", roles: ["admin"] },
];

type ViewState = "default" | "empty" | "loading" | "error";

export default function PermissionsPage() {
  const [view, setView] = React.useState<ViewState>("default");
  const [perms, setPerms] = React.useState<Perm[]>(INITIAL);
  // 편집 중 사본 — null 이면 열람 모드
  const [draft, setDraft] = React.useState<Perm[] | null>(null);
  const [saved, setSaved] = React.useState(false);

  const editing = draft !== null;
  const rows = view === "empty" ? [] : (draft ?? perms);

  // Category 병합 — 그룹 첫 행에만 rowSpan, 나머지 행은 0(셀 생략)
  const span = (i: number) => {
    if (i > 0 && rows[i - 1].category === rows[i].category) return 0;
    let n = 1;
    while (rows[i + n]?.category === rows[i].category) n++;
    return n;
  };

  const toggle = (key: string, role: Role) =>
    setDraft((d) =>
      (d ?? perms).map((p) =>
        p.key === key
          ? { ...p, roles: p.roles.includes(role) ? p.roles.filter((r) => r !== role) : [...p.roles, role] }
          : p,
      ),
    );

  return (
    <div className="space-y-6">
      <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={DEFAULT_STATES} />

      <PageHeader
        title="기능별 권한"
        actions={
          editing ? (
            <>
              <Button variant="outline" onClick={() => setDraft(null)}>
                <X className="size-4" /> 취소
              </Button>
              <Button
                onClick={() => {
                  setPerms(draft);
                  setDraft(null);
                  setSaved(true);
                }}
              >
                <Check className="size-4" /> 저장
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              disabled={view !== "default"}
              onClick={() => {
                setDraft(perms);
                setSaved(false);
              }}
            >
              <Pencil className="size-4" /> 수정
            </Button>
          )
        }
      />

      {saved && (
        <Alert>
          <Check className="size-4" />
          <AlertTitle className="text-success">권한 변경이 저장되었습니다</AlertTitle>
        </Alert>
      )}

      {view === "loading" && <TableSkeleton />}

      {view === "error" && (
        <ErrorState
          title="권한 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>등록된 권한이 없습니다.</EmptyTitle>
            <EmptyDescription>권한이 생성되면 역할별로 이 표에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <Table className="bg-card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Category</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Description</TableHead>
              {/* 역할 열 머리 = 이니셜 원 위 + 이름 아래, 호버 툴팁(계정 관리와 같은 _detail/role-mark, 2026-10-08) */}
              {ROLES.map((r) => (
                <TableHead key={r} className="h-auto py-2 text-center">
                  <RoleTip role={r}>
                    <span className="inline-flex flex-col items-center gap-1">
                      <RoleMark role={r} />
                      {r}
                    </span>
                  </RoleTip>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p, i) => {
              const n = span(i);
              return (
                <TableRow key={p.key} className="hover:bg-transparent">
                  {n > 0 && (
                    <TableCell rowSpan={n} className="border-r align-top">
                      {p.category}
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-primary">{p.key}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r} className="text-center">
                      <Checkbox
                        aria-label={`${p.key} — ${r}`}
                        checked={p.roles.includes(r)}
                        disabled={!editing}
                        onCheckedChange={() => toggle(p.key, r)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
