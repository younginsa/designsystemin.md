"use client"

// FilterBar — header-filter 시스템 프리셋 (조합 제작, 새 엔진 아님).
// 피그마 세일즈포스 365 전환 UI 209-17188 구조 · 날짜 패널 209-36201.
//
// 확정 스펙 (2026-08-24 디자이너 결정, 2026-08-25 승격 · 2026-09-04 패널 문법 개정)
// - 행: 검색 → 적용 필터 칩 → [+ 필터 추가] │ 우측 액션 슬롯
// - 칩 문법 2종:
//   · 기본 필터(base) = 삭제 불가 → ✕ 없이 꺾쇠만
//   · 추가 필터([+ 필터 추가]로 꺼낸 것) = ✕만(꺾쇠 없음). 칩 본문 클릭이 패널을 연다
// - 값 패널 문법(2026-09-04 개정 — 즉시 반영 드롭다운 폐기, 전 kind 「고르고 적용」):
//   · 상단 타이틀 없음 — 칩이 바로 위에서 이름을 말하므로 중복이다
//   · 단일 = ✓ 오른쪽 ml-auto(shadcn Select 문법) · 다중 = 왼쪽 Checkbox 상시 노출
//   · 고른 값은 pending — [적용]으로 확정·닫힘, [취소]·바깥 클릭·Esc = 버림, [초기화] = 값 해제·닫힘
//   · 푸터 = 날짜 패널과 동일: 좌 [초기화] / 우 [취소][적용]
// - [+ 필터 추가] = 2열 팝오버(2026-09-04, 이미지 레퍼런스: 목록 옆에 패널이 붙는 구조):
//   좌 필터 목록(클릭 = 선택, 목록은 계속 보임) → 우 그 필터의 값 패널 → [적용]에야 칩이 생긴다.
//   [취소]·바깥 클릭이면 칩 없음. complex(모달 위임)만 예외 — 고르면 칩 추가 + 모달 오픈
// - 칩은 최대 2줄까지 자동 줄바꿈
// - 정렬은 이 바에 없다 — 테이블 컬럼 헤더가 전담
//
// 어휘 게이트: 전부 채택분 조합 — form-search(InputGroup) · ov-popover(Popover) ·
// form-controls(Checkbox) · form-daterange(Calendar) · btn-basic(Button).
// 신규 틴트 없음. 대비 선언: secondary-foreground×muted(body) · primary×muted(aux).

import * as React from "react"
import { Check, ChevronDown, Plus, RotateCcw, Search, X } from "lucide-react"

import { Button } from "./button"
import { Calendar } from "./calendar"
import { Checkbox } from "./checkbox"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export type FilterDef = {
  /** 상태 맵의 키 */
  name: string
  label: string
  /** 단순형: 옵션 목록에서 값 하나 선택 */
  options?: string[]
  /** 다중 선택: 체크박스 토글, 값은 옵션 순서대로 ", " 병합(예: "Cloud, Security") */
  multi?: boolean
  /** 기본 노출 여부 — false면 [+ 필터 추가]에서 꺼내 쓴다 */
  base?: boolean
  /** complex: 값 편집을 모달에 위임(버전 조건 등) · date: 프리셋 레일 + 두 달 range 캘린더 */
  kind?: "select" | "complex" | "date"
  /** 날짜형 프리셋(오늘·어제·최근 7일…·직접 지정) */
  presets?: string[]
}

export type FilterValues = Record<string, string | undefined>

function FilterBar({
  searchPlaceholder,
  keyword,
  onKeyword,
  filters,
  values,
  onChange,
  extraShown = [],
  onExtraShownChange,
  onComplexOpen,
  actions,
  searchSlot,
}: {
  searchPlaceholder: string
  keyword: string
  onKeyword: (v: string) => void
  filters: FilterDef[]
  values: FilterValues
  onChange: (name: string, value: string | undefined) => void
  /** 추가 필터 중 현재 화면에 꺼내둔 것 */
  extraShown?: string[]
  onExtraShownChange?: (names: string[]) => void
  onComplexOpen?: (name: string) => void
  actions?: React.ReactNode
  /** 검색 슬롯 — 지정 시 내장 InputGroup 대신 렌더(SearchBox 옵트인용, 2026-08-26).
      미지정 = 현행 그대로. 페이지별 옵트인이며 기본 검색 문법은 불변이다. */
  searchSlot?: React.ReactNode
}) {
  // 화면에 보일 필터 = 기본 필터 + 사용자가 추가한 것
  const shown = filters.filter((f) => f.base || extraShown.includes(f.name))
  const addable = filters.filter((f) => !f.base && !extraShown.includes(f.name))
  const hasCondition = keyword.trim() !== "" || shown.some((f) => values[f.name])

  // 열린 패널의 단일 소유자 — 칩별 내부 state로 두면 패널이 겹친다(2026-08-26 버그).
  // FilterBar가 하나만 쥔다: 칩 패널(openName)과 필터추가 팝오버(addOpen)는 서로 배타.
  const [openName, setOpenName] = React.useState<string | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  // 필터추가 팝오버 좌열에서 고른 필터 — 우열에 그 값 패널이 붙는다
  const [addPick, setAddPick] = React.useState<string | null>(null)
  const picked = addable.find((f) => f.name === addPick) ?? null

  const removeFilter = (f: FilterDef) => {
    onChange(f.name, undefined)
    onExtraShownChange?.(extraShown.filter((n) => n !== f.name))
  }

  const clearAll = () => {
    onKeyword("")
    filters.forEach((f) => onChange(f.name, undefined))
    onExtraShownChange?.([])
  }

  // 필터추가 [적용] — 값이 있을 때만 칩이 생긴다. 취소·초기화(undefined)는 칩 없이 닫힘
  const commitAdd = (f: FilterDef, v: string | undefined) => {
    if (v !== undefined) {
      onExtraShownChange?.([...extraShown, f.name])
      onChange(f.name, v)
    }
    setAddOpen(false)
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      {/* 좌: 검색 + 필터 칩 + 필터 추가 (최대 2줄 흐름) */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {searchSlot ?? (
          <InputGroup variant="filled" className="w-64">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={keyword}
              onChange={(e) => onKeyword(e.target.value)}
            />
            {keyword && (
              <InputGroupAddon align="inline-end">
                {/* 값 있을 때만 ✕ — mousedown 차단으로 입력창 포커스 유지(2026-08-26) */}
                <button
                  type="button"
                  aria-label="검색어 지우기"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onKeyword("")}
                >
                  <X className="size-3.5 text-secondary-foreground" />
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>
        )}

        {shown.map((f) => (
          <FilterChip
            key={f.name}
            def={f}
            value={values[f.name]}
            onSelect={(v) => onChange(f.name, v)}
            onRemove={() => removeFilter(f)}
            onComplexOpen={() => onComplexOpen?.(f.name)}
            open={openName === f.name}
            onOpenChange={(o) => {
              setOpenName(o ? f.name : null)
              if (o) setAddOpen(false)
            }}
          />
        ))}

        {addable.length > 0 && onExtraShownChange && (
          // 필터추가 = 2열 팝오버. 열리면 떠 있던 칩 패널을 닫는다 — 단일 오픈 보장
          <Popover
            open={addOpen}
            onOpenChange={(o) => {
              setAddOpen(o)
              setAddPick(null)
              if (o) setOpenName(null)
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-secondary-foreground">
                <Plus className="size-4" /> 필터 추가
              </Button>
            </PopoverTrigger>
            {/* 타이틀 없음 — 트리거가 "필터 추가"라고 말하고 있다 */}
            <PopoverContent align="start" className="flex w-auto p-0">
              {/* 좌열: 필터 목록 — 클릭 = 선택(하이라이트), 목록은 계속 보인다 */}
              <div className="w-40 space-y-0.5 p-1" role="listbox" aria-label="추가할 필터">
                {addable.map((f) => {
                  const on = addPick === f.name
                  return (
                    <button
                      key={f.name}
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={
                        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground " +
                        (on ? "bg-accent text-accent-foreground" : "")
                      }
                      onClick={() => {
                        if (f.kind === "complex") {
                          // 모달 위임형은 예외 — 칩 추가 + 모달 오픈(모달이 자체 적용·취소를 가진다)
                          setAddOpen(false)
                          onExtraShownChange([...extraShown, f.name])
                          onComplexOpen?.(f.name)
                        } else {
                          setAddPick(f.name)
                        }
                      }}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>

              {/* 우열: 고른 필터의 값 패널 — [적용]에야 칩이 생긴다 */}
              {picked && (
                <div className="border-l">
                  {picked.kind === "date" ? (
                    <DateRangePanel
                      key={picked.name}
                      value={undefined}
                      presets={picked.presets ?? DATE_PRESETS}
                      onSelect={(v) => commitAdd(picked, v)}
                    />
                  ) : (
                    <OptionPanel
                      key={picked.name}
                      def={picked}
                      value={undefined}
                      onApply={(v) => commitAdd(picked, v)}
                      onCancel={() => setAddOpen(false)}
                    />
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}

        {hasCondition && (
          <Button variant="destructive-ghost" size="sm" onClick={clearAll}>
            {/* 파괴 보조 액션 프리셋(CTA ④) — 아이콘은 같은 빨강의 60% */}
            <RotateCcw className="size-4 opacity-60" /> 필터초기화
          </Button>
        )}
      </div>

      {/* 우: 페이지별 액션(내보내기·CTA) */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// 필터 칩 — 값이 있으면 파란 테두리·파란 글자, 없으면 기본. 클릭하면 그 자리에서 값 패널.
function FilterChip({
  def,
  value,
  onSelect,
  onRemove,
  onComplexOpen,
  open,
  onOpenChange,
}: {
  def: FilterDef
  value?: string
  onSelect: (v: string | undefined) => void
  onRemove: () => void
  onComplexOpen: () => void
  /** 패널 열림은 FilterBar가 단일 소유 — 단일 오픈 보장용 (2026-08-26) */
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const active = Boolean(value)
  const options = def.presets ?? def.options ?? []
  // 제거 가능 = 추가 필터. 기본 필터는 화면에서 뺄 수 없다.
  const removable = !def.base
  const setOpen = onOpenChange

  const label = (
    <>
      <span>{def.label}</span>
      {active && <span className="font-medium">· {value}</span>}
      {/* 꺾쇠는 ✕가 없는 기본 필터에만 — 추가 필터는 ✕가 패널 어포던스를 대신한다 */}
      {!removable && <ChevronDown className="size-3.5" />}
    </>
  )
  const triggerCls =
    // 칩 높이는 래퍼(h-9, 보더 포함 36px = 검색창 InputGroup과 동일)가 쥔다 — 2026-08-26 확정
    "inline-flex h-full items-center gap-1 px-2.5 text-sm " +
    (removable ? "rounded-l-md " : "rounded-md ") +
    (active ? "text-primary" : "text-foreground group-hover:text-accent-foreground")

  return (
    // 칩 면: 전 상태 muted 채움 — 비활성 secondary-foreground×muted(body) ·
    // 활성 primary×muted(aux) 둘 다 게이트 통과. 활성 구분은 파란 테두리+글자.
    // hover = 표준 hover 잉크(accent), 비활성만 — 활성은 primary×accent 미선언이라 보류.
    <span
      className={
        "group inline-flex h-9 items-center rounded-md border bg-muted " +
        (active ? "border-primary" : "border-transparent hover:bg-accent")
      }
    >
      {def.kind === "complex" ? (
        <button
          type="button"
          className={triggerCls}
          onClick={onComplexOpen}
          aria-label={`${def.label} 필터 편집`}
        >
          {label}
        </button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={triggerCls} aria-label={`${def.label} 필터`}>
              {label}
            </button>
          </PopoverTrigger>
          {/* 상단 타이틀 없음 · 값은 pending → [적용]으로 확정 (2026-09-04) */}
          <PopoverContent align="start" className="w-auto p-0">
            {def.kind === "date" ? (
              <DateRangePanel
                key={value ?? ""}
                value={value}
                presets={options}
                onSelect={(v) => {
                  onSelect(v)
                  setOpen(false)
                }}
              />
            ) : (
              <OptionPanel
                key={value ?? ""}
                def={def}
                value={value}
                onApply={(v) => {
                  onSelect(v)
                  setOpen(false)
                }}
                onCancel={() => setOpen(false)}
              />
            )}
          </PopoverContent>
        </Popover>
      )}
      {removable && (
        <button
          type="button"
          aria-label={`${def.label} 필터 제거`}
          className={
            "flex h-full items-center rounded-r-md pr-2 " +
            (active ? "text-primary" : "text-secondary-foreground")
          }
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  )
}

// 옵션 패널 — 단일/다중 공통. 고른 값은 pending, [적용]으로 확정. 푸터는 날짜 패널과 같은 문법.
// 부모가 key={value}로 리마운트해 열릴 때마다 현재 값에서 시작한다.
function OptionPanel({
  def,
  value,
  onApply,
  onCancel,
}: {
  def: FilterDef
  value?: string
  /** undefined = 초기화(값 해제) */
  onApply: (v: string | undefined) => void
  onCancel: () => void
}) {
  const options = def.options ?? []
  const [pending, setPending] = React.useState<string[]>(value ? value.split(", ") : [])
  const toggle = (o: string) => {
    if (!def.multi) return [o]
    return pending.includes(o)
      ? pending.filter((x) => x !== o)
      : options.filter((x) => pending.includes(x) || x === o) // 옵션 순서 고정
  }

  return (
    <div className="w-56">
      <div
        className="space-y-0.5 p-1"
        role="listbox"
        aria-multiselectable={def.multi}
        aria-label={def.label}
      >
        {options.map((o) => {
          const on = pending.includes(o)
          return (
            <button
              key={o}
              type="button"
              role="option"
              aria-selected={on}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => setPending(toggle(o))}
            >
              {/* 다중 = 왼쪽 Checkbox 상시 노출 · 단일 = ✓ 오른쪽(shadcn Select 문법) */}
              {def.multi && <Checkbox checked={on} className="pointer-events-none" />}
              {o}
              {!def.multi && (
                <Check className={"ml-auto size-4 " + (on ? "opacity-100" : "opacity-0")} />
              )}
            </button>
          )
        })}
      </div>
      {/* 푸터 — 날짜 패널과 동일: 좌 [초기화] / 우 [취소][적용] */}
      <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary-foreground"
          disabled={!value && pending.length === 0}
          onClick={() => onApply(undefined)}
        >
          초기화
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button
            size="sm"
            disabled={pending.length === 0}
            onClick={() => onApply(pending.join(", "))}
          >
            적용
          </Button>
        </div>
      </div>
    </div>
  )
}

// 날짜 프리셋 — 피그마 209-36201 구조 한글화(확정)
const DATE_PRESETS = ["오늘", "어제", "최근 7일", "최근 14일", "최근 30일", "직접 지정"]

const pad2 = (n: number) => String(n).padStart(2, "0")
const fmtMD = (d: Date) => `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`

/** 칩 값 → 실제 기간. 프리셋은 이름으로 계산, 직접 지정은 "MM/DD–MM/DD"(올해 가정) */
function resolveDateRange(value: string): { from: Date; to: Date } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = 86_400_000
  switch (value) {
    case "오늘":
      return { from: today, to: now }
    case "어제":
      return { from: new Date(today.getTime() - day), to: new Date(today.getTime() - 1) }
    case "최근 7일":
      return { from: new Date(today.getTime() - 6 * day), to: now }
    case "최근 14일":
      return { from: new Date(today.getTime() - 13 * day), to: now }
    case "최근 30일":
      return { from: new Date(today.getTime() - 29 * day), to: now }
  }
  const m = value.match(/^(\d{2})\/(\d{2})–(\d{2})\/(\d{2})$/)
  if (!m) return null
  const y = now.getFullYear()
  return {
    from: new Date(y, Number(m[1]) - 1, Number(m[2])),
    to: new Date(y, Number(m[3]) - 1, Number(m[4]), 23, 59, 59),
  }
}

// 날짜 패널 — 좌 프리셋 레일(단일 문법: ✓ 오른쪽) + 우 From/to + 두 달 range 캘린더.
// 프리셋 클릭 = 캘린더 미리보기 → [적용]으로 확정·닫힘. [취소]/[초기화] 좌하단.
function DateRangePanel({
  value,
  presets,
  onSelect,
}: {
  value?: string
  presets: string[]
  onSelect: (v: string | undefined) => void
}) {
  const [range, setRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined)
  // 프리셋도 즉시 적용하지 않는다 — 캘린더에 기간을 먼저 비추고 [적용]으로 확정
  const [pendingPreset, setPendingPreset] = React.useState<string | null>(null)
  const [month, setMonth] = React.useState<Date | undefined>(undefined)
  const railChecked = (p: string) =>
    pendingPreset
      ? pendingPreset === p
      : p === "직접 지정"
        ? Boolean(value && /–/.test(value))
        : value === p

  return (
    <div className="flex">
      {/* 프리셋 레일 — 클릭 = 미리보기, 확정은 [적용] */}
      <div className="w-36 space-y-0.5 border-r p-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              if (p === "직접 지정") {
                setPendingPreset(null)
                setRange(undefined)
              } else {
                const r = resolveDateRange(p)
                setPendingPreset(p)
                setRange(r ?? undefined)
                if (r) setMonth(new Date(r.from.getFullYear(), r.from.getMonth(), 1))
              }
            }}
          >
            {p}
            <Check className={"ml-auto size-4 " + (railChecked(p) ? "opacity-100" : "opacity-0")} />
          </button>
        ))}
      </div>

      {/* From/to + 두 달 캘린더 + 푸터 */}
      <div className="p-3">
        <div className="flex items-center gap-2 pb-2 text-sm">
          <span className="text-secondary-foreground">From</span>
          <span className="rounded-md border px-2 py-1 font-mono text-xs">
            {range?.from ? fmtMD(range.from) : "—"}
          </span>
          <span className="text-secondary-foreground">to</span>
          <span className="rounded-md border px-2 py-1 font-mono text-xs">
            {range?.to ? fmtMD(range.to) : "—"}
          </span>
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          month={month}
          onMonthChange={setMonth}
          selected={range as never}
          onSelect={(r: { from?: Date; to?: Date } | undefined) => {
            setPendingPreset(null) // 그리드 직접 선택 = 직접 지정 모드
            setRange(r ?? undefined)
          }}
        />
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary-foreground"
            disabled={!value}
            onClick={() => onSelect(undefined)}
          >
            초기화
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onSelect(value)}>
              취소
            </Button>
            <Button
              size="sm"
              disabled={!range?.from || !range?.to}
              onClick={() =>
                range?.from &&
                range?.to &&
                onSelect(pendingPreset ?? `${fmtMD(range.from)}–${fmtMD(range.to)}`)
              }
            >
              적용
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { FilterBar, FilterChip, OptionPanel, DateRangePanel, resolveDateRange, DATE_PRESETS }
