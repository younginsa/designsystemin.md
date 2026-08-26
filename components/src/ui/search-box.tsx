"use client"

// SearchBox — 검색 제안 프리셋 (조합 제작, 새 엔진 아님). 2026-08-26 승격.
// 피그마 237-51963 focused2 문법 · 원본: 클론 _search/search-box.tsx (그대로 기준, 재해석 없음).
// 확정 결정(2026-08-26 디자이너):
// - 입력창 = 현행 InputGroup(filled·w-64) 그대로 — 포커스 링은 DS 기본(focused 병합형 기각)
// - 패널 = 분리 플로팅(ov-popover·PopoverAnchor) · 폭 = 입력창과 동일 토큰(w-64) · px-2 py-3
// - 타이핑: 자동완성 최대 5 (돋보기 · 매칭 구간 볼드 + 보조줄) — 매칭 중엔 최근·빠른검색 숨김
// - 비어 있을 때: 최근 검색 3(시계 · hover ✕ 개별 삭제) + 빠른검색 칩 최대 5(최다 검색)
// - 항목 선택 = 즉시 적용·닫힘·최근 검색 편입(최대 3 유지)
// - 적용 범위: 페이지 옵트인(FilterBar searchSlot) — 기본 검색 문법은 불변

import * as React from "react"
import { Clock, Search, X } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"
import { Popover, PopoverAnchor, PopoverContent } from "./popover"

export type SearchSuggestion = { label: string; sub?: string }

function SearchBox({
  placeholder,
  value,
  onChange,
  candidates,
  recentInitial = [],
  quick = [],
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
  /** 자동완성 후보 — 데이터의 검색 가능 필드 값들 */
  candidates: SearchSuggestion[]
  /** 최근 검색 시드(최대 3 유지) */
  recentInitial?: string[]
  /** 빠른검색 = 최다 검색 항목(최대 5) */
  quick?: string[]
}) {
  const [open, setOpen] = React.useState(false)
  const [recent, setRecent] = React.useState(recentInitial.slice(0, 3))

  const q = value.trim().toLowerCase()
  const matches = q
    ? candidates.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 5)
    : []

  const commit = (v: string) => {
    onChange(v)
    setRecent((r) => [v, ...r.filter((x) => x !== v)].slice(0, 3))
    setOpen(false)
  }

  // 매칭 구간 볼드 — 타이핑한 부분이 어디에 걸렸는지 보이게
  const highlight = (label: string) => {
    const i = label.toLowerCase().indexOf(q)
    if (i < 0 || !q) return label
    return (
      <>
        {label.slice(0, i)}
        <b>{label.slice(i, i + q.length)}</b>
        {label.slice(i + q.length)}
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup variant="filled" className="w-64">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={placeholder}
            aria-label={placeholder}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
        </InputGroup>
      </PopoverAnchor>
      {/* 입력창 포커스를 뺏지 않는다 — 콤보박스 관례 */}
      <PopoverContent
        align="start"
        className="w-64 px-2 py-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {matches.length > 0 ? (
          // ── 자동완성 (최대 5) ──
          <div className="space-y-0.5">
            {matches.map((c) => (
              <button
                key={c.label}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => commit(c.label)}
              >
                <Search className="size-4 shrink-0 text-secondary-foreground" />
                <span className="min-w-0 flex-1 truncate text-left">{highlight(c.label)}</span>
                {c.sub && <span className="shrink-0 text-xs text-secondary-foreground">{c.sub}</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recent.length > 0 && (
              <div className="space-y-0.5">
                <p className="px-2 text-xs text-secondary-foreground">최근 검색</p>
                {recent.map((r) => (
                  <div
                    key={r}
                    className="group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Clock className="size-4 shrink-0 text-secondary-foreground" />
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left"
                      onClick={() => commit(r)}
                    >
                      {r}
                    </button>
                    {/* hover 시에만 노출 — 기록 개별 삭제 */}
                    <button
                      type="button"
                      aria-label={`${r} 기록 삭제`}
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        setRecent((list) => list.filter((x) => x !== r))
                      }}
                    >
                      <X className="size-3.5 text-secondary-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {quick.length > 0 && (
              <div className="space-y-1.5">
                <p className="px-2 text-xs text-secondary-foreground">빠른검색</p>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {quick.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="rounded-sm bg-muted px-1.5 py-0.5 text-xs hover:bg-accent hover:text-accent-foreground"
                      onClick={() => commit(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { SearchBox }
