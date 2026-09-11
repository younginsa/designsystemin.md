"use client"

// SearchBox — 검색 제안 프리셋 (조합 제작, 새 엔진 아님). 2026-08-26 승격.
// 피그마 237-51963 focused2 문법 · 원본: 클론 _search/search-box.tsx (그대로 기준, 재해석 없음).
// 확정 결정(2026-08-26 디자이너):
// - 입력창 = 현행 InputGroup(filled·w-64) 그대로 — 포커스 링은 DS 기본(focused 병합형 기각)
// - 패널 = 분리 플로팅(ov-popover·PopoverAnchor) · 폭 = 입력창과 동일 토큰(w-64) · px-2 pt-3 pb-4
//   (하단만 +4px — 빠른검색 칩은 면이 있어 12px면 붙어 보임, 2026-08-26 확정)
// - 타이핑: 자동완성 최대 5 (돋보기 · 매칭 구간 볼드 + 보조줄) — 매칭 중엔 최근·빠른검색 숨김
// - 비어 있을 때: 최근 검색 3(시계 · hover ✕ 개별 삭제) + 빠른검색 칩 최대 5(최다 검색)
// - 항목 선택 = 즉시 적용·닫힘·최근 검색 편입(최대 3 유지)
// - 적용 범위: 페이지 옵트인(FilterBar searchSlot) — 기본 검색 문법은 불변

import * as React from "react"
import { Clock, Search, X } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"
import { Popover, PopoverAnchor, PopoverContent } from "./popover"

export type SearchSuggestion = { label: string; sub?: string }

/** 패널 빈 상태 한 줄 — 목록 행과 같은 문법(items-center · px-2 py-1.5 · 돋보기 size-3.5), 글자만 연하게. 캡션 없음(2026-09-11 확정).
 *  Empty 프리셋은 섹션 규모라 256px 패널엔 과함 */
function PanelEmpty({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-secondary-foreground">
      <Search className="size-3.5 shrink-0 text-input" />
      <span className="min-w-0 flex-1 truncate">{title}</span>
    </div>
  )
}

function SearchBox({
  placeholder,
  value,
  onChange,
  candidates,
  recentInitial = [],
  quick = [],
  defaultOpen = false,
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
  /** 미리보기 전용 — 패널을 처음부터 연 채로 렌더(스토리·피그마 state=search-open 정합, 2026-09-11). 제품 화면에서는 쓰지 않는다 */
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [recent, setRecent] = React.useState(recentInitial.slice(0, 3))
  const anchorRef = React.useRef<HTMLDivElement>(null)

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
    // 보여줄 게 없으면(입력 없음 + 최근 검색·빠른검색 둘 다 없음) 패널을 열지 않는다 — '기록 없음' 별도 상태 없음(2026-09-11 확정)
    <Popover open={open && (q.length > 0 || recent.length > 0 || quick.length > 0)} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup ref={anchorRef} variant="filled" className="w-64" data-searchbox-anchor>
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
          {value && (
            <InputGroupAddon align="inline-end">
              {/* 지우고 입력창 재포커스 + 패널 유지. Radix dismiss가 클릭 파이프라인 뒤에
                  한 번 더 닫으므로(실측) 재오픈은 rAF로 그 뒤에 예약한다 */}
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => {
                  onChange("")
                  requestAnimationFrame(() => {
                    anchorRef.current?.querySelector("input")?.focus()
                    setOpen(true)
                  })
                }}
              >
                <X className="size-3.5 text-secondary-foreground" />
              </button>
            </InputGroupAddon>
          )}
        </InputGroup>
      </PopoverAnchor>
      {/* 입력창 포커스를 뺏지 않고, 앵커(입력창·✕) 클릭은 dismiss로 치지 않는다 — 콤보박스 관례 */}
      <PopoverContent
        align="start"
        className="w-64 px-2 pt-3 pb-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement).closest("[data-searchbox-anchor]")) e.preventDefault()
        }}
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
                {/* 장식 아이콘 — size-3.5(✕와 동일)·text-input(한 단계 연하게), 2026-08-26 확정 */}
                <Search className="size-3.5 shrink-0 text-input" />
                <span className="min-w-0 flex-1 truncate text-left">{highlight(c.label)}</span>
                {c.sub && <span className="shrink-0 text-xs text-secondary-foreground">{c.sub}</span>}
              </button>
            ))}
          </div>
        ) : q ? (
          // ── 결과 없음(입력 중 후보 0) — 종전엔 최근 검색으로 되돌아가 매칭처럼 보였다. 자유 검색어는 그대로 유효(2026-09-11) ──
          <PanelEmpty title={`'${value.trim()}'에 맞는 후보가 없습니다`} />
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
                    <Clock className="size-3.5 shrink-0 text-input" />
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
                {/* 칩 hover = border 면 — muted 바탕 위 accent(6%)는 동톤이라 감지 불가(1.035:1), 2026-08-26 확정 */}
                <div className="flex flex-wrap gap-1.5 px-2">
                  {quick.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="rounded-sm bg-muted px-1.5 py-0.5 text-xs hover:bg-accent"
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
