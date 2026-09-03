"use client";

// S2 계약 생성 — 단일 페이지 개편 (2026-08-28 디자이너 확정: 5단계 위저드 → 1단계 점진 노출)
// 원천: hinas365 와이어프레임 v2 wireframe_s2_contract_create.html (구조 개편)
//
// 확정 구조
// - ① 기본 계약 정보(5필드 필수) → 전부 채워지면 [+ 계약 항목 추가] 활성
// - ② 계약 항목 블록(반복 가능): 제품 타입 라디오 2행 5선택 → 선택 시
//   「선택된 제품 및 납품 유형」 패널이 라디오 아래 임베드 등장 →
//   슬롯 수 드롭다운 → N개 슬롯 콤보박스 행 등장
// - ③ 슬롯 콤보박스: 기존 등록 호선 검색 포함(Command) · 빈 상태 "생성된 호선 없음" ·
//   푸터 [+ 새 호선 추가] → 호선 생성 모달(개별 입력/시리즈 생성 탭 — 구 ③단계 이식)
// - ④ 호선 배정 완료 시 그 슬롯 행에 단가 입력(＋통화) 등장 — 구 ⑤단계 흡수
// - 가격·예정일 등 미입력분은 계약 상세에서 보완(미입력 문법)
//
// 어휘 게이트: 전부 채택분 — form-select(Select·Command) · ov-popover · ov-dialog ·
// form-controls(RadioGroup) · data-tabs(ToggleGroup) · form-text 계열

import * as React from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, ChevronsUpDown, Plus, Trash2 } from "lucide-react";

import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import { DEFAULT_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Calendar } from "@ds/ui/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@ds/ui/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@ds/ui/ui/popover";
import { RadioGroup, RadioGroupItem } from "@ds/ui/ui/radio-group";
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
import { ToggleGroup, ToggleGroupItem } from "@ds/ui/ui/toggle-group";

const BASE = "/generated/sales365";

/* ---------------------------------------------------------------- 선택지 */

const CUSTOMERS = ["○○해운", "△△해운", "▲▲선사", "☆☆해운", "□□해운"];
const OWNERS = ["홍길동", "김담당", "이대리"];

// 제품 타입 5선택(패키지 4종 + 직접 선택) — 2행 라디오
const PKG_OPTIONS = ["Enterprise", "Smart Standard", "Safety Forward", "Safety Around", "직접 선택"];
// 패키지 구성(제품 목록 매트릭스와 동일)
const PKG_COMPOSITION: Record<string, string[]> = {
  Enterprise: ["Control", "SVM", "Cloud"],
  "Smart Standard": ["Control", "Cloud"],
  "Safety Forward": ["Navigation", "Cloud"],
  "Safety Around": ["Navigation", "SVM", "Cloud"],
  "직접 선택": ["Control", "Navigation", "SVM", "Cloud"],
};
const DELIVERY_TYPES = ["납품", "납품 + 구독", "구독"];

// 기존 등록 호선 — 슬롯 콤보박스 후보(검색 포함). 모달에서 만든 호선이 뒤에 추가된다
const EXISTING_VESSELS = [
  "Hull 1005 · 미정",
  "Hull 1006 · 미정",
  "HN-2026-020 · MV NEW DAWN",
  "HN-2026-021 · 미정",
];

const SLOT_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 원본 호선 생성 화면의 선택지 전체
const SHIP_TYPES = ["Container", "Bulk Carrier", "Tanker", "LNG Carrier", "RoRo"];
const CLASSES = ["KR", "LR", "BV", "DNV", "ABS", "NK"];
const YARDS = ["△△중공업", "□□조선", "○○중공업", "XX중공업"];
const ENGINE_TYPES = ["diesel", "dual-fuel", "LNG", "electric"];

// 로컬 기준 yyyy-mm-dd — toISOString은 UTC라 하루 밀린다
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ---------------------------------------------------------------- 상태 모델 */

type Item = {
  id: number;
  pkg: string | null;
  slotCount: number;
  /** 슬롯 수 직접 입력 모드(2026-09-01 확정) */
  custom?: boolean;
  assigns: (string | null)[];
};

type ViewState = "default" | "empty" | "loading" | "error";

/* ---------------------------------------------------------------- 화면 */

// 제원·메이커 필드 — 개별 입력·시리즈 공통(원본 호선 생성 화면 전체 필드 이식, 2026-09-01)
function SpecFields() {
  return (
    <>
      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium text-secondary-foreground">제원 정보</p>
        <div className="space-y-1.5">
          <Label>선급 (복수 선택 · ★ 주선급)</Label>
          <ToggleGroup type="multiple" variant="outline" size="sm" className="justify-start">
            {CLASSES.map((c) => (
              <ToggleGroupItem key={c} value={c}>
                {c}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-xs text-secondary-foreground">
            선급 미정 — 확정 후 호선 상세에서 추가할 수 있습니다
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>GT (총톤수, t)</Label>
            <Input placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>DWT (재화중량, t)</Label>
            <Input placeholder="—" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>LOA (전장, m)</Label>
            <Input placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>LBP (수선간장, m)</Label>
            <Input placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>Beam (형폭, m)</Label>
            <Input placeholder="—" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Depth (형심, m)</Label>
            <Input placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>Scantling Draft (m)</Label>
            <Input placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>엔진 수</Label>
            <Input placeholder="—" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>엔진 타입</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="— 미정 —" />
              </SelectTrigger>
              <SelectContent>
                {ENGINE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>UR E27 적용</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="— 미정 —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">예</SelectItem>
                <SelectItem value="no">아니오</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium text-secondary-foreground">메이커 정보</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>AMS Maker</Label>
            <Input placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>BMS Maker</Label>
            <Input placeholder="—" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>ECDIS Maker</Label>
            <Input placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label>Auto Pilot Maker</Label>
            <Input placeholder="—" />
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sales365ContractCreatePage() {
  const [view, setView] = React.useState<ViewState>("default");

  // ① 기본 계약 정보 — 5필드 전부 채워야 항목 추가 활성
  const [name, setName] = React.useState("");
  const [customer, setCustomer] = React.useState("");
  const [ctype, setCtype] = React.useState("");
  const [date, setDate] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const basicComplete = [name, customer, ctype, date, owner].every((v) => v.trim() !== "");

  // ② 계약 항목 블록(반복)
  const [items, setItems] = React.useState<Item[]>([]);
  const [nextId, setNextId] = React.useState(1);

  // 호선 후보 = 기존 등록 + 모달에서 생성
  const [vessels, setVessels] = React.useState<string[]>(EXISTING_VESSELS);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createMode, setCreateMode] = React.useState("individual");
  const [newHull, setNewHull] = React.useState("");
  const [newShip, setNewShip] = React.useState("");
  const [newDue, setNewDue] = React.useState("");
  // 새 호선 추가를 요청한 슬롯 위치 — 생성 즉시 그 슬롯에 배정
  const [pendingSlot, setPendingSlot] = React.useState<{ item: number; slot: number } | null>(null);

  // 5필드 완성 시 첫 계약 항목 블록 자동 오픈(2026-08-28 확정) — 한 번만
  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (basicComplete && !autoOpened.current && items.length === 0) {
      autoOpened.current = true;
      setItems([{ id: nextId, pkg: null, slotCount: 0, assigns: [] }]);
      setNextId((n) => n + 1);
    }
  }, [basicComplete, items.length, nextId]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: nextId, pkg: null, slotCount: 0, assigns: [] }]);
    setNextId((n) => n + 1);
  };
  const patchItem = (id: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  const assignVessel = (itemId: number, slotIdx: number, vessel: string) =>
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const assigns = [...it.assigns];
        assigns[slotIdx] = vessel;
        return { ...it, assigns };
      }),
    );

  const createVessel = () => {
    const label = `${newHull}${newShip ? ` · ${newShip}` : " · 미정"}`;
    setVessels((prev) => [...prev, label]);
    if (pendingSlot) assignVessel(pendingSlot.item, pendingSlot.slot, label);
    setNewHull("");
    setNewShip("");
    setNewDue("");
    setPendingSlot(null);
    setCreateOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-bold">계약 생성</h1>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={DEFAULT_STATES} />
      </div>

      {view === "loading" && <BlockSkeleton />}
      {view === "error" && (
        <ErrorState
          title="계약 생성 화면을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}
      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>계약을 생성할 수 없습니다.</EmptyTitle>
            <EmptyDescription>계정에 생성 권한이 없습니다. 관리자에게 문의하세요.</EmptyDescription>
          </EmptyHeader>
          <Button asChild variant="outline">
            <Link href={`${BASE}/contracts`}>계약 목록으로</Link>
          </Button>
        </Empty>
      )}

      {view === "default" && (
        <>
          {/* ══ ① 기본 계약 정보 ══ */}
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-sm font-medium text-secondary-foreground">기본 계약 정보</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="c-name">
                  계약명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="c-name"
                  className="max-w-sm"
                  placeholder="예: ○○해운 Navi + SVM 구독 5척"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  고객(계정) <span className="text-destructive">*</span>
                </Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="계정을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMERS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  계약 유형 <span className="text-destructive">*</span>
                </Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={ctype}
                  onValueChange={(v) => v && setCtype(v)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="신조">신조</ToggleGroupItem>
                  <ToggleGroupItem value="개조">개조</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-date">
                  계약일 <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="c-date"
                      variant="outline"
                      className="w-full max-w-sm justify-start font-normal"
                    >
                      <CalendarIcon className="size-4 text-secondary-foreground" />
                      {date || <span className="text-secondary-foreground">날짜 선택</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date ? new Date(date) : undefined}
                      onSelect={(d) => d && setDate(fmtDate(d))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>
                  담당자 <span className="text-destructive">*</span>
                </Label>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="담당자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 5필드 전부 채워지면 계약 항목 블록이 자동으로 열린다 — 버튼 중복 제거(2026-08-28) */}
            {!basicComplete && (
              <p className="mt-4 border-t pt-4 text-xs text-secondary-foreground">
                기본 계약 정보 5개 항목을 모두 입력하면 계약 항목이 자동으로 열립니다.
              </p>
            )}
          </section>

          {/* ══ ② 계약 항목 블록 (반복) ══ */}
          {items.map((it, itemIdx) => (
            <section key={it.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-secondary-foreground">
                  계약 항목 {itemIdx + 1}
                </h2>
                <Button
                  variant="destructive-ghost"
                  size="icon"
                  className="size-8"
                  aria-label="계약 항목 제거"
                  onClick={() => removeItem(it.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* 제품 타입 — 2행 라디오 5선택 */}
              <div className="mt-6 space-y-2">
                <Label>제품 타입</Label>
                <RadioGroup
                  value={it.pkg ?? ""}
                  onValueChange={(v) => patchItem(it.id, { pkg: v })}
                  className="grid max-w-xl grid-cols-3 gap-1"
                >
                  {PKG_OPTIONS.map((p) => (
                    <Label
                      key={p}
                      className="flex items-center gap-2 rounded-md px-2 py-2 font-normal hover:bg-accent"
                    >
                      <RadioGroupItem value={p} /> {p}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* 선택된 제품 및 납품 유형 — 제품 타입 선택 시 임베드 등장 */}
              {it.pkg && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>선택된 제품 및 납품 유형</Label>
                    <Badge variant="outline" className="border-primary text-primary">
                      {it.pkg}
                    </Badge>
                  </div>
                  <div className="max-w-2xl overflow-hidden rounded-md border">
                    <Table variant="plain" className="bg-card">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-36">제품</TableHead>
                          <TableHead className="w-44">납품 유형</TableHead>
                          <TableHead>구독 기간</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {PKG_COMPOSITION[it.pkg].map((product) => (
                          <TableRow key={product}>
                            <TableCell className="font-medium">{product}</TableCell>
                            <TableCell>
                              <Select defaultValue="납품">
                                <SelectTrigger size="sm" className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DELIVERY_TYPES.map((d) => (
                                    <SelectItem key={d} value={d}>
                                      {d}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1.5">
                                <Input className="h-8 w-16" placeholder="—" />
                                <span className="text-sm text-secondary-foreground">개월</span>
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* 슬롯 수 — 선택 시 슬롯 행 N개 등장 */}
              {it.pkg && (
                <div className="mt-8 space-y-2">
                  <Label>슬롯 수</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={it.custom ? "custom" : it.slotCount ? String(it.slotCount) : ""}
                      onValueChange={(v) => {
                        if (v === "custom") {
                          patchItem(it.id, { custom: true });
                          return;
                        }
                        const n = Number(v);
                        patchItem(it.id, {
                          custom: false,
                          slotCount: n,
                          assigns: Array.from({ length: n }, (_, i) => it.assigns[i] ?? null),
                        });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SLOT_COUNTS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}척
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">직접 입력</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* 직접 입력 — 숫자 인풋이 슬롯 행 수를 그대로 몬다 */}
                    {it.custom && (
                      <span className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          className="h-9 w-24"
                          value={it.slotCount || ""}
                          onChange={(e) => {
                            const n = Math.max(0, Math.min(99, Number(e.target.value)));
                            patchItem(it.id, {
                              slotCount: n,
                              assigns: Array.from({ length: n }, (_, i) => it.assigns[i] ?? null),
                            });
                          }}
                        />
                        <span className="text-sm text-secondary-foreground">척</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 슬롯 행들 — 콤보박스(기존 호선 검색) + 배정 시 단가 입력 등장 */}
              {it.slotCount > 0 && (
                <div className="mt-6 space-y-1.5">
                  {Array.from({ length: it.slotCount }, (_, slotIdx) => {
                    const assigned = it.assigns[slotIdx];
                    return (
                      <div key={slotIdx} className="flex flex-wrap items-center gap-2">
                        <span className="w-12 shrink-0 text-sm text-secondary-foreground">
                          {slotIdx + 1}번
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-64 justify-between font-normal">
                              {assigned ?? (
                                <span className="text-secondary-foreground">호선 선택</span>
                              )}
                              <ChevronsUpDown className="size-4 text-secondary-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-64 p-0">
                            <Command>
                              <CommandInput placeholder="Hull 번호 또는 선명 검색" />
                              <CommandList>
                                <CommandEmpty>생성된 호선 없음</CommandEmpty>
                                <CommandGroup>
                                  {vessels.map((v) => (
                                    <CommandItem
                                      key={v}
                                      value={v}
                                      onSelect={() => assignVessel(it.id, slotIdx, v)}
                                    >
                                      {v}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                              {/* 푸터 — 새 호선 추가(호선 생성 모달) */}
                              <div className="border-t p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => {
                                    setPendingSlot({ item: it.id, slot: slotIdx });
                                    setCreateOpen(true);
                                  }}
                                >
                                  <Plus className="size-4" /> 새 호선 추가
                                </Button>
                              </div>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {/* 배정 완료 시 단가 입력 등장 — 구 ⑤단계 흡수 */}
                        {assigned && (
                          <span className="flex items-center gap-1.5">
                            <Input className="h-8 w-36" placeholder="단가 입력" />
                            <Select defaultValue="USD">
                              <SelectTrigger size="sm" className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="KRW">KRW</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}

          {/* 항목 블록 반복 — 기본 정보 완성 후 상시 노출 */}
          {basicComplete && (
            <div>
              <Button variant="outline" onClick={addItem}>
                <Plus className="size-4" /> 계약 항목 추가
              </Button>
            </div>
          )}

          {/* ── 하단 고정 완료 바 — 본문 컬럼 안에서만 ── */}
          {/* 하단 고정 완료 바 — 셸 본문면(bg-secondary)과 동일 토큰: 줄무늬 없이 비침만 차단 */}
          <div className="sticky bottom-0 flex items-center justify-between bg-secondary py-3">
            <Button asChild variant="outline">
              <Link href={`${BASE}/contracts`}>취소</Link>
            </Button>
            <Button disabled={!basicComplete || items.length === 0} asChild>
              <Link href={`${BASE}/contracts/detail`}>계약 등록 완료</Link>
            </Button>
          </div>
        </>
      )}

      {/* ══ 새 호선 추가 모달 — 구 ③단계(개별/시리즈) 이식 ══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 호선 추가</DialogTitle>
            <DialogDescription>
              Hull 번호(필수) 외 정보는 등록 후 호선 상세에서 보완할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={createMode}
            onValueChange={(v) => v && setCreateMode(v)}
            className="justify-start"
          >
            <ToggleGroupItem value="individual">개별 입력</ToggleGroupItem>
            <ToggleGroupItem value="series">시리즈 생성</ToggleGroupItem>
          </ToggleGroup>

          {createMode === "individual" ? (
            <div className="space-y-4">
              {/* 그룹 아웃라인 박스(2026-09-01 확정) */}
              <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium text-secondary-foreground">기본 정보</p>
              <div className="space-y-2">
                <Label htmlFor="v-hull">
                  Hull 번호 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="v-hull"
                  placeholder="예: Hull 2001"
                  value={newHull}
                  onChange={(e) => setNewHull(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-ship">선명</Label>
                <Input
                  id="v-ship"
                  placeholder="예: MV SUNRISE"
                  value={newShip}
                  onChange={(e) => setNewShip(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="v-imo">IMO 번호</Label>
                  <Input id="v-imo" placeholder="예: 9876543" />
                </div>
                <div className="space-y-2">
                  <Label>선종</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="— 미정 —" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Container", "Bulk Carrier", "Tanker", "LNG Carrier", "RoRo"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-due">인도 예정일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="v-due"
                      variant="outline"
                      className="w-full max-w-sm justify-start font-normal"
                    >
                      <CalendarIcon className="size-4 text-secondary-foreground" />
                      {newDue || <span className="text-secondary-foreground">날짜 선택</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newDue ? new Date(newDue) : undefined}
                      onSelect={(d) => d && setNewDue(fmtDate(d))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              </div>
              {/* 원본 호선 생성 화면 전체 필드(2026-09-01 확정) */}
              <SpecFields />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium text-secondary-foreground">기본 정보</p>
              <div className="space-y-2">
                <Label htmlFor="s-code">
                  시리즈 코드 <span className="text-destructive">*</span>
                </Label>
                <Input id="s-code" placeholder="예: S-2026-001" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>선주 계정</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMERS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>조선소 계정</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {YARDS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-count">생성 척수</Label>
                <Input id="s-count" type="number" defaultValue={5} className="max-w-32" />
              </div>
              </div>
              {/* 공통 제원 — 시리즈 내 모든 호선에 동일 적용 */}
              <SpecFields />
              <p className="text-xs text-secondary-foreground">
                공통 제원은 시리즈 내 모든 호선에 동일하게 적용됩니다. 생성 후 각 호선의 Hull
                번호를 입력하세요.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
            <Button disabled={createMode === "individual" && !newHull.trim()} onClick={createVessel}>
              {createMode === "individual" ? "호선 추가" : "호선 목록 생성"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
