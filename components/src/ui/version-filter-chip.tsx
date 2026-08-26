"use client";

// VersionFilterChip — PRODUCT 계층 필터 프리셋 (조합 제작, 새 엔진 아님). 2026-08-26 승격.
// 원본: 클론 _version-filter/version-filter-chip.tsx (그대로 기준, 재해석 없음 — 모달 폐기 → 캐스케이드 패널)
// 칩 문법 = FilterChip 기본형과 동일(muted 면·꺾쇠·활성 파랑) — FilterBar 툴바용
// 캐스케이드(순차 노출): 제품 선택 → 공통버전 등장 → 공통 선택 → 제품버전 등장
// 다중 제품 = [+ 버전 조건 추가] — 제품 간 AND · 같은 제품 버전 OR(기존 모달 규칙 승계)
// 프리셋 문법 승계: 드래프트 편집 → [적용] 확정 · [취소] 폐기 · [초기화] 좌하단(기본 칩엔 ✕ 없음)

import * as React from "react";
import { ChevronDown, Plus, X } from "lucide-react";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export type VersionRow = {
  id: number;
  product: string;
  commonVersion: string;
  productVersion: string;
};

export function VersionFilterChip({
  // 한국어 헤더 규칙 정합(2026-08-26) — 식별자·제품명만 영문 유지
  label = "제품",
  products,
  commonVersions,
  productVersions,
  value,
  onChange,
}: {
  label?: string;
  products: string[];
  commonVersions: string[];
  productVersions: Record<string, string[]>;
  /** 적용된 조건(빈 배열 = 미적용) */
  value: VersionRow[];
  onChange: (rows: VersionRow[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<VersionRow[]>([]);
  const [nextId, setNextId] = React.useState(1000);

  const active = value.length > 0;
  // 적용 요약 = 제품 + 버전까지(2026-08-26 확정, 구분자 ·). 2건 이상은 첫 조건 외 N건.
  const condLabel = (r: VersionRow) =>
    [r.product, r.commonVersion, r.productVersion].filter(Boolean).join(" · ");
  const summary =
    value.length <= 1
      ? value.map(condLabel).join(", ")
      : `${condLabel(value[0])} 외 ${value.length - 1}건`;

  const openPanel = (o: boolean) => {
    if (o)
      setDraft(
        value.length
          ? value
          : [{ id: 1, product: "", commonVersion: "", productVersion: "" }],
      );
    setOpen(o);
  };

  const patch = (id: number, p: Partial<VersionRow>) =>
    setDraft((rows) => rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <Popover open={open} onOpenChange={openPanel}>
      <PopoverTrigger asChild>
        {/* 기본 필터 칩 문법 — muted 면 · 꺾쇠 · 활성 = 파란 테두리+글자.
            h-9 = 툴바 표준(검색창 정합, 2026-08-26) — FilterChip h-9 승격 요청과 함께 확정 */}
        <button
          type="button"
          aria-label={`${label} 필터`}
          className={
            "inline-flex h-9 items-center gap-1 rounded-md border bg-muted px-2.5 text-sm " +
            (active
              ? "border-primary text-primary"
              : "border-transparent text-foreground hover:bg-accent hover:text-accent-foreground")
          }
        >
          <span>{label}</span>
          {active && <span className="font-medium">· {summary}</span>}
          <ChevronDown className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="space-y-3">
          {draft.map((row, idx) => (
            <div key={row.id} className="space-y-2 rounded-md border p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-secondary-foreground">제품 버전 {idx + 1}</p>
                {draft.length > 1 && (
                  <button
                    type="button"
                    aria-label="조건 삭제"
                    className="rounded-sm p-0.5 hover:bg-accent"
                    onClick={() => setDraft((rows) => rows.filter((r) => r.id !== row.id))}
                  >
                    <X className="size-3.5 text-secondary-foreground" />
                  </button>
                )}
              </div>
              <Select
                value={row.product}
                onValueChange={(v) =>
                  patch(row.id, { product: v, commonVersion: "", productVersion: "" })
                }
              >
                <SelectTrigger size="sm" className="w-full" aria-label="제품">
                  <SelectValue placeholder="제품을 선택하세요." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* 캐스케이드 ① — 제품 선택 후 공통버전 등장 */}
              {row.product && (
                <Select
                  value={row.commonVersion}
                  onValueChange={(v) => patch(row.id, { commonVersion: v })}
                >
                  <SelectTrigger size="sm" className="w-full" aria-label="공통 버전">
                    <SelectValue placeholder="공통 버전" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonVersions.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* 캐스케이드 ② — 공통버전 선택 후 제품버전 등장 */}
              {row.product && row.commonVersion && (
                <Select
                  value={row.productVersion}
                  onValueChange={(v) => patch(row.id, { productVersion: v })}
                >
                  <SelectTrigger size="sm" className="w-full" aria-label="제품 버전">
                    <SelectValue placeholder="제품 버전" />
                  </SelectTrigger>
                  <SelectContent>
                    {(productVersions[row.product] ?? []).map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-secondary-foreground"
            onClick={() => {
              setDraft((rows) => [
                ...rows,
                { id: nextId, product: "", commonVersion: "", productVersion: "" },
              ]);
              setNextId((n) => n + 1);
            }}
          >
            <Plus className="size-4" /> 추가
          </Button>

          {/* 풀 블리드 구분선 — 패널 패딩(p-3)을 음수 마진으로 상쇄 */}
          <div className="-mx-3 flex items-center justify-between border-t px-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary-foreground"
              disabled={!active}
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
            >
              초기화
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button
                size="sm"
                disabled={draft.every((r) => !r.product)}
                onClick={() => {
                  onChange(draft.filter((r) => r.product));
                  setOpen(false);
                }}
              >
                적용
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
