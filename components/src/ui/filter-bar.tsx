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
// - 칩 행은 한 줄 고정(2026-09-09 디자이너 확정 — 종전 "최대 2줄 자동 줄바꿈" 폐기): 칩은 남은 폭까지 늘어나고,
//   행이 모자라면 값이 말줄임(…)된다. 넓은 칩부터 줄어들고 검색창·[+ 필터 추가]·[필터초기화]·우측 액션은 줄지 않는다.
//   전체 값은 title(hover)과 패널이 보여준다
// - 정렬은 이 바에 없다 — 테이블 컬럼 헤더가 전담
// - 상세 조건(2026-09-08, 필터 스펙 표 '상세 조건' 열 · 레퍼런스 Lemon Squeezy 테이블 필터):
//   FilterDef.operators 를 주면 패널 상단에 연산자 라디오, 값은 "<op> <value>" 문자열로 저장,
//   칩에 op 항상 병기("계약명 · contains 대양"). text kind 신설(자유 입력). 미지정 정의는 현행 그대로.
//   유형→연산자: text = is·is not·contains·does not contain / select = is·is not(다중 조건 O = multi) /
//   date = before·after·between·is(단일일은 single 캘린더). Number 열은 필터 아님(정렬 전용).
//
// 어휘 게이트: 전부 채택분 조합 — form-search(InputGroup) · ov-popover(Popover) ·
// form-controls(Checkbox) · form-daterange(Calendar) · btn-basic(Button).
// 신규 틴트 없음. 대비 선언: secondary-foreground×muted(body) · primary×muted(aux).

import * as React from "react"
import { Check, ChevronDown, Plus, RotateCcw, Search, X } from "lucide-react"

import { Button } from "./button"
import { Calendar } from "./calendar"
import { Checkbox } from "./checkbox"
import { Input } from "./input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { RadioGroup, RadioGroupItem } from "./radio-group"

/** 상세 조건(연산자) — 필터 스펙 표 '상세 조건' 열 그대로(영문 확정 2026-09-08) */
export type FilterOp = "is" | "is not" | "contains" | "does not contain" | "before" | "after" | "between"
const OPS_TEXT: FilterOp[] = ["is", "is not", "contains", "does not contain"]
const OPS_SELECT: FilterOp[] = ["is", "is not"]
const OPS_DATE: FilterOp[] = ["before", "after", "between", "is"]

export type FilterDef = {
  /** 상태 맵의 키 */
  name: string
  label: string
  /** 단순형: 옵션 목록에서 값 하나 선택 */
  options?: string[]
  /** 다중 선택: 체크박스 토글, 값은 옵션 순서대로 ", " 병합(예: "Cloud, Security") — 스펙 표 '다중 조건 O' */
  multi?: boolean
  /** 기본 노출 여부 — false면 [+ 필터 추가]에서 꺼내 쓴다 */
  base?: boolean
  /** complex: 값 편집을 모달에 위임(버전 조건 등) · date: 프리셋 레일 + 두 달 range 캘린더(operators 지정 시 연산자 레일) ·
      text: 자유 입력(2026-09-08, operators와 함께 쓴다) */
  kind?: "select" | "complex" | "date" | "text"
  /** 날짜형 프리셋(오늘·어제·최근 7일…·직접 지정 / 앞으로 30일…·이미 만료) */
  presets?: string[]
  /** 날짜형 기준일 — 화면이 고정 기준일(와이어프레임 TODAY 등)을 쓰면 넘긴다. 기본 = 실제 오늘(2026-09-08) */
  now?: Date
  /** 상세 조건(연산자) 목록 — 지정하면 값이 "<op> <value>"로 저장되고 칩에 op가 항상 병기된다(2026-09-08).
      미지정 = 현행 문법(값만). 스펙 표 매핑: text=OPS_TEXT · select=OPS_SELECT · date=OPS_DATE */
  operators?: FilterOp[]
  /** text kind 입력 힌트 */
  placeholder?: string
}

export type FilterValues = Record<string, string | undefined>

// 값 "<op> <value>" 분해 — 긴 연산자부터 대야 "is not"이 "is"로 잘리지 않는다
const OP_ORDER: FilterOp[] = ["does not contain", "is not", "contains", "between", "before", "after", "is"]
function parseFilterValue(v: string | undefined): { op: FilterOp | null; value: string } {
  if (!v) return { op: null, value: "" }
  for (const op of OP_ORDER) {
    if (v === op) return { op, value: "" }
    if (v.startsWith(op + " ")) return { op, value: v.slice(op.length + 1) }
  }
  return { op: null, value: v }
}
/** text 연산자 판정(대소문자 무시) — 페이지가 행을 거를 때 쓴다. op 없음 = is */
function matchText(op: FilterOp | null, cell: string, value: string): boolean {
  const a = cell.toLowerCase()
  const b = value.toLowerCase()
  switch (op) {
    case "is not":
      return a !== b
    case "contains":
      return a.includes(b)
    case "does not contain":
      return !a.includes(b)
    default:
      return a === b
  }
}

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
    <div className="flex items-start justify-between gap-2">
      {/* 좌: 검색 + 필터 칩 + 필터 추가 — 한 줄 고정, 칩이 남은 폭을 쓰고 넘치면 값 말줄임(2026-09-09) */}
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2">
        {searchSlot ?? (
          <InputGroup variant="filled" className="w-64 shrink-0">
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
              <Button variant="ghost" size="sm" className="shrink-0 text-secondary-foreground">
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
                // flex-col — 목록이 패널보다 길 때 패널이 열 높이를 채우고 푸터는 바닥에 붙는다(2026-09-09)
                <div className="flex flex-col border-l">
                  {picked.kind === "date" ? (
                    <DateRangePanel
                      key={picked.name}
                      value={undefined}
                      presets={picked.presets ?? DATE_PRESETS}
                      operators={picked.operators}
                      now={picked.now}
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
          <Button variant="destructive-ghost" size="sm" className="shrink-0" onClick={clearAll}>
            {/* 파괴 보조 액션 프리셋(CTA ④) — 아이콘은 같은 빨강의 60% */}
            <RotateCcw className="size-4 opacity-60" /> 필터초기화
          </Button>
        )}
      </div>

      {/* 우: 페이지별 액션(내보내기·CTA) */}
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
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
      <span className="shrink-0">{def.label}</span>
      {/* 값은 남은 폭까지 늘어나고 행이 모자라면 말줄임(2026-09-09 디자이너 확정 — 고정 상한 없음).
          전체 값은 title(hover)과 패널이 보여준다 */}
      {active && (
        <span className="truncate font-medium" title={value}>
          · {value}
        </span>
      )}
      {/* 꺾쇠는 ✕가 없는 기본 필터에만 — 추가 필터는 ✕가 패널 어포던스를 대신한다 */}
      {!removable && <ChevronDown className="size-3.5" />}
    </>
  )
  const triggerCls =
    // 칩 높이는 래퍼(h-9, 보더 포함 36px = 검색창 InputGroup과 동일)가 쥔다 — 2026-08-26 확정
    "inline-flex h-full min-w-0 items-center gap-1 px-2.5 text-sm " +
    (removable ? "rounded-l-md " : "rounded-md ") +
    (active ? "text-primary" : "text-foreground group-hover:text-accent-foreground")

  return (
    // 칩 면: 전 상태 muted 채움 — 비활성 secondary-foreground×muted(body) ·
    // 활성 primary×muted(aux) 둘 다 게이트 통과. 활성 구분은 파란 테두리+글자.
    // hover = 표준 hover 잉크(accent), 비활성만 — 활성은 primary×accent 미선언이라 보류.
    <span
      className={
        "group inline-flex h-9 min-w-0 items-center rounded-md border bg-muted " +
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
                operators={def.operators}
                now={def.now}
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
            "flex h-full shrink-0 items-center rounded-r-md pr-2 " +
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
  const ops = def.operators
  const isText = def.kind === "text"
  // operators 있으면 저장값이 "<op> <value>" — 현재 값에서 op와 순수 값을 분리해 시작한다
  const parsed = parseFilterValue(value)
  const initial = ops ? parsed.value : (value ?? "")
  const [op, setOp] = React.useState<FilterOp>(parsed.op ?? ops?.[0] ?? "is")
  const [text, setText] = React.useState(isText ? initial : "")
  const [pending, setPending] = React.useState<string[]>(!isText && initial ? initial.split(", ") : [])
  const toggle = (o: string) => {
    if (!def.multi) return [o]
    return pending.includes(o)
      ? pending.filter((x) => x !== o)
      : options.filter((x) => pending.includes(x) || x === o) // 옵션 순서 고정
  }
  const canApply = isText ? text.trim() !== "" : pending.length > 0
  const compose = () => {
    const v = isText ? text.trim() : pending.join(", ")
    return ops ? `${op} ${v}` : v
  }

  return (
    <div className="flex h-full w-56 flex-col">
      {/* 상세 조건 — 연산자 라디오(레퍼런스: is / is not / contains 세로 목록). 값 위에 둔다 */}
      {ops && (
        <RadioGroup
          value={op}
          onValueChange={(v) => setOp(v as FilterOp)}
          className="gap-0.5 border-b p-1"
          aria-label={`${def.label} 조건`}
        >
          {ops.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <RadioGroupItem value={o} aria-label={o} />
              {o}
            </label>
          ))}
        </RadioGroup>
      )}
      {isText ? (
        // text kind — 자유 입력. Enter = 적용
        <div className="p-2">
          <Input
            value={text}
            placeholder={def.placeholder ?? "값 입력"}
            aria-label={def.label}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canApply) onApply(compose())
            }}
          />
        </div>
      ) : (
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
      )}
      {/* 푸터 — 날짜 패널과 동일: 좌 [초기화] / 우 [취소][적용] */}
      <div className="mt-auto flex items-center justify-between gap-2 px-2 pt-1 pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary-foreground"
          disabled={!value && !canApply}
          onClick={() => onApply(undefined)}
        >
          초기화
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button size="sm" disabled={!canApply} onClick={() => onApply(compose())}>
            적용
          </Button>
        </div>
      </div>
    </div>
  )
}

// 날짜 프리셋 — 피그마 209-36201 구조 한글화(확정). 뒤를 보는 기본 세트(갱신일·생성일·요청 기간용).
// 앞을 보는 화면(만료일·예정일)은 FilterDef.presets로 "앞으로 30일·60일·90일 · 이미 만료 · 직접 지정"을 넘긴다(2026-09-08)
const DATE_PRESETS = ["오늘", "어제", "최근 7일", "최근 14일", "최근 30일", "직접 지정"]

const pad2 = (n: number) => String(n).padStart(2, "0")
// 직접 지정 값은 연도를 품는다(2026-09-08) — 만료일처럼 해를 넘기는 기간 때문. 구형 "MM/DD–MM/DD"도 계속 읽는다
const fmtYMD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/** 칩 값 → 실제 기간. 프리셋은 이름으로 계산(기준일 now — 화면 고정 기준일이 있으면 넘긴다),
    직접 지정은 "YYYY-MM-DD–YYYY-MM-DD"(구형 "MM/DD–MM/DD"는 올해 가정) */
function resolveDateRange(value: string, now: Date = new Date()): { from: Date; to: Date } | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = 86_400_000
  const endOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  // 상세 조건(2026-09-08): "before YYYY-MM-DD" · "after …" · "is …" 는 단일일, "between A–B" 는 기간
  const parsed = parseFilterValue(value)
  if (parsed.op === "before" || parsed.op === "after" || parsed.op === "is") {
    const m = parsed.value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return null
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    if (parsed.op === "is") return { from: d, to: endOf(d) }
    if (parsed.op === "before") return { from: new Date(2000, 0, 1), to: new Date(d.getTime() - 1) }
    return { from: new Date(d.getTime() + day), to: new Date(2100, 0, 1) }
  }
  if (parsed.op === "between") value = parsed.value
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
    // 앞을 보는 프리셋(2026-09-08) — 오늘부터 N일 뒤 자정 직전까지
    case "앞으로 30일":
      return { from: today, to: endOf(new Date(today.getTime() + 30 * day)) }
    case "앞으로 60일":
      return { from: today, to: endOf(new Date(today.getTime() + 60 * day)) }
    case "앞으로 90일":
      return { from: today, to: endOf(new Date(today.getTime() + 90 * day)) }
    // 열린 과거 — 오늘까지 지난 것 전부(만료일 당일 = 만료)
    case "이미 만료":
      return { from: new Date(2000, 0, 1), to: endOf(today) }
  }
  const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})–(\d{4})-(\d{2})-(\d{2})$/)
  if (ymd) {
    return {
      from: new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])),
      to: new Date(Number(ymd[4]), Number(ymd[5]) - 1, Number(ymd[6]), 23, 59, 59),
    }
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
  operators,
  now,
  onSelect,
}: {
  value?: string
  presets: string[]
  /** 상세 조건(2026-09-08) — 지정 시 좌 레일이 프리셋 대신 연산자(before·after·between·is).
      between = range 캘린더, 나머지 = 단일일 캘린더. 값은 "<op> <날짜>" */
  operators?: FilterOp[]
  /** 프리셋 미리보기 기준일 — 화면 고정 기준일이 있으면 넘긴다(기본 = 실제 오늘) */
  now?: Date
  onSelect: (v: string | undefined) => void
}) {
  const parsed = parseFilterValue(value)
  const [op, setOp] = React.useState<FilterOp>(parsed.op ?? operators?.[0] ?? "between")
  const isRange = !operators || op === "between"
  // 열릴 때 현재 값을 캘린더에 되비춘다(operators 문법) — 단일일은 그 날, between은 기간
  const initialSingle = React.useMemo(() => {
    if (!operators || parsed.op === "between" || !parsed.op) return undefined
    const r = resolveDateRange(value ?? "", now)
    if (!r) return undefined
    return parsed.op === "before" ? new Date(r.to.getTime() + 1) : parsed.op === "after" ? new Date(r.from.getTime() - 86_400_000) : r.from
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const initialRange = React.useMemo(() => {
    if (!operators || parsed.op !== "between") return undefined
    const r = resolveDateRange(value ?? "", now)
    return r ? { from: r.from, to: new Date(r.to.getFullYear(), r.to.getMonth(), r.to.getDate()) } : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [range, setRange] = React.useState<{ from?: Date; to?: Date } | undefined>(initialRange)
  const [single, setSingle] = React.useState<Date | undefined>(initialSingle)
  // 프리셋도 즉시 적용하지 않는다 — 캘린더에 기간을 먼저 비추고 [적용]으로 확정
  const [pendingPreset, setPendingPreset] = React.useState<string | null>(null)
  const [month, setMonth] = React.useState<Date | undefined>(
    initialSingle ? new Date(initialSingle.getFullYear(), initialSingle.getMonth(), 1)
      : initialRange?.from ? new Date(initialRange.from.getFullYear(), initialRange.from.getMonth(), 1)
        : undefined,
  )
  const railChecked = (p: string) =>
    pendingPreset
      ? pendingPreset === p
      : p === "직접 지정"
        ? Boolean(value && /–/.test(value))
        : value === p
  const canApply = isRange ? Boolean(range?.from && range?.to) : Boolean(single)
  const compose = () => {
    if (operators) {
      return isRange
        ? `between ${fmtYMD(range!.from!)}–${fmtYMD(range!.to!)}`
        : `${op} ${fmtYMD(single!)}`
    }
    return pendingPreset ?? `${fmtYMD(range!.from!)}–${fmtYMD(range!.to!)}`
  }

  return (
    <div className="flex">
      {operators ? (
        // 연산자 레일 — 라디오 문법(값 패널의 상세 조건과 동일). 바꾸면 선택은 비운다
        <RadioGroup
          value={op}
          onValueChange={(v) => {
            setOp(v as FilterOp)
            setRange(undefined)
            setSingle(undefined)
          }}
          // content-start — 레일이 캘린더 높이만큼 늘어나도 항목은 위에 붙는다(프리셋 레일과 같은 자세)
          className="w-36 content-start gap-0.5 border-r p-2"
          aria-label="날짜 조건"
        >
          {operators.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <RadioGroupItem value={o} aria-label={o} />
              {o}
            </label>
          ))}
        </RadioGroup>
      ) : (
        // 프리셋 레일 — 클릭 = 미리보기, 확정은 [적용]
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
                  const r = resolveDateRange(p, now)
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
      )}

      {/* From/to(또는 단일일) + 캘린더 + 푸터 — flex-col: 푸터는 열 바닥에 붙는다 */}
      <div className="flex flex-col p-3">
        <div className="flex items-center gap-2 pb-2 text-sm">
          {isRange ? (
            <>
              <span className="text-secondary-foreground">From</span>
              <span className="rounded-md border px-2 py-1 font-mono text-xs">
                {range?.from ? fmtYMD(range.from) : "—"}
              </span>
              <span className="text-secondary-foreground">to</span>
              <span className="rounded-md border px-2 py-1 font-mono text-xs">
                {range?.to ? fmtYMD(range.to) : "—"}
              </span>
            </>
          ) : (
            <>
              <span className="text-secondary-foreground">{op}</span>
              <span className="rounded-md border px-2 py-1 font-mono text-xs">
                {single ? fmtYMD(single) : "—"}
              </span>
            </>
          )}
        </div>
        {isRange ? (
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
        ) : (
          <Calendar
            mode="single"
            numberOfMonths={1}
            month={month}
            onMonthChange={setMonth}
            selected={single as never}
            onSelect={(d: Date | undefined) => setSingle(d)}
          />
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
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
            <Button size="sm" disabled={!canApply} onClick={() => onSelect(compose())}>
              적용
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export {
  FilterBar,
  FilterChip,
  OptionPanel,
  DateRangePanel,
  resolveDateRange,
  DATE_PRESETS,
  OPS_TEXT,
  OPS_SELECT,
  OPS_DATE,
  parseFilterValue,
  matchText,
}
