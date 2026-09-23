import * as React from "react"

import { Button } from "./button"
import {
  DATE_PRESETS,
  FilterBar,
  OPS_DATE,
  OPS_SELECT,
  OPS_TEXT,
  type FilterDef,
  type FilterValues,
} from "./filter-bar"
import { SearchBox } from "./search-box"

/* FilterBar 스토리 — 필터 스펙 표 6개(2026-09-08, 세일즈 365 PRD 6.1~6.6)를 그대로 옮긴 것.
 * 규칙: 유형이 연산자를 정하고, '다중 조건 O'가 multi를 정한다. Number 열은 정렬 전용이라 필터가 아니다.
 * '검색가능 O' 열은 검색창 placeholder 에 적는다. 값 문법·칩 문법은 filter-bar.tsx 머리 주석.
 * @storybook import 0 — 365 허브도 읽을 수 있는 순수 객체(현재 허브 「헤더 필터바」 카드는 자체 데모 유지).
 *
 * args 형(2026-09-23 Phase 2): 모든 스토리가 Demo 프롭을 args 로 선언한다 — /render/filter-bar/<스토리>?args={"keyword":"부산"} 처럼
 * 값을 바꿔 사진에 없는 상태를 받는다(keyword 가 있으면 검색창에 ✕ "검색어 지우기" — 2026-09-20 사고의 그 UI).
 * 조건부 커버(원문 {값 && …} ↔ 스토리):
 *   keyword → Keyword(값 있음 = ✕) · hasCondition → 값이 있는 모든 스토리([초기화] 노출) · picked → 값 있는 칩("is 유효" 등)
 *   removable → shown 으로 꺼낸 추가 필터 칩(ContractList customer·name 등 = 칩 ✕) · actions → WithActions
 *   active · ops · isText · operators · isRange → 열린 칩 패널 안(포털이라 스니펫에 없다, 원문 참조) */

export default {
  title: "DS/FilterBar",
  component: FilterBar,
}

// 화면 기준일 — 갤러리 페이지들이 쓰는 고정 TODAY 와 같다
const NOW = new Date(2026, 7, 20)

type DemoProps = {
  filters: FilterDef[]
  placeholder: string
  values?: FilterValues
  shown?: string[]
  /** 처음 입력돼 있는 검색어 — 비어 있지 않으면 ✕(검색어 지우기)와 [초기화]가 나온다 */
  keyword?: string
  /** 우측 액션 슬롯 — true 면 [내보내기] 버튼을 넣는다(스토리 표현용, 실제 프롭은 ReactNode) */
  actions?: boolean
  /** 검색 슬롯 옵트인(SearchBox 등) — 지정 시 내장 검색창 대신 렌더 */
  searchSlot?: React.ReactNode
}

/** FilterBar 는 제어 컴포넌트 — 스토리마다 state 를 쥐는 얇은 래퍼 */
function Demo({
  filters,
  placeholder,
  values: initial = {},
  shown = [],
  keyword: initialKeyword = "",
  actions,
  searchSlot,
}: DemoProps) {
  const [keyword, setKeyword] = React.useState(initialKeyword)
  const [values, setValues] = React.useState<FilterValues>(initial)
  const [extra, setExtra] = React.useState<string[]>(shown)
  return (
    <div style={{ width: 960 }}>
      <FilterBar
        searchSlot={searchSlot}
        searchPlaceholder={placeholder}
        keyword={keyword}
        onKeyword={setKeyword}
        filters={filters}
        values={values}
        onChange={(n, v) => setValues((s) => ({ ...s, [n]: v }))}
        extraShown={extra}
        onExtraShownChange={setExtra}
        actions={actions ? <Button variant="outline" size="sm">내보내기</Button> : undefined}
      />
    </div>
  )
}

const render = (args: DemoProps) => <Demo {...args} />

const ACCOUNTS = ["대양해운", "한성해운", "동보선사", "우진해운", "서해해운", "신광해운", "청해선사"]
const MANAGERS = ["김영업", "박세일", "이대리", "홍길동"]
const HULLS = ["Hull 1001", "Hull 1002", "Hull 1003", "Hull 1004", "Hull 1005", "Hull 1006"]
const PRODUCTS = ["Control", "SVM", "Navigation", "Cloud"]

/* ── 6.1 계약 리스트 ──────────────────────────────────────────────── */
const CONTRACT_FILTERS: FilterDef[] = [
  { name: "cancelled", label: "취소 여부", options: ["유효", "취소"], operators: OPS_SELECT, base: true },
  { name: "name", label: "계약명", kind: "text", operators: OPS_TEXT, placeholder: "계약명" },
  { name: "customer", label: "고객", options: ACCOUNTS, multi: true, operators: OPS_SELECT },
  { name: "ctype", label: "계약 유형", options: ["신조", "개조"], multi: true, operators: OPS_SELECT },
  { name: "manager", label: "담당", options: MANAGERS, multi: true, operators: OPS_SELECT },
  { name: "date", label: "계약일", kind: "date", operators: OPS_DATE, now: NOW },
  // 척수(Number) — 정렬 전용, 필터 아님
]

const CONTRACT_ARGS: DemoProps = {
  placeholder: "계약명 · 고객 · 담당 검색",
  filters: CONTRACT_FILTERS,
  values: { cancelled: "is 유효", customer: "is 대양해운, 한성해운", name: "contains 구독" },
  shown: ["customer", "name"],
  keyword: "",
}

export const ContractList = {
  parameters: { vocab: "header-filter" },
  args: CONTRACT_ARGS,
  render,
}

/** 검색어 입력됨 — 검색창에 ✕(검색어 지우기), 우측 끝에 [초기화]. 사진 하나로는 안 보이던 상태(2026-09-20 사고) */
export const Keyword = {
  args: { ...CONTRACT_ARGS, keyword: "구독" },
  render,
}

/** 액션 슬롯 — 필터바 우측 끝 [내보내기](outline sm). 목록의 유틸 버튼은 제목 행이 아니라 여기(body-patterns A) */
export const WithActions = {
  args: { ...CONTRACT_ARGS, actions: true },
  render,
}

/* ── 6.2 계약 호선 리스트 ───────────────────────────────────────── */
const VESSEL_FILTERS: FilterDef[] = [
  { name: "hull", label: "Hull No.", kind: "text", operators: OPS_TEXT, placeholder: "Hull No." },
  { name: "shipName", label: "선명", kind: "text", operators: OPS_TEXT, placeholder: "선명(미입력 식별자 필터 별도)" },
  { name: "imo", label: "IMO", kind: "text", operators: OPS_TEXT, placeholder: "IMO" },
  { name: "owner", label: "선주", options: ACCOUNTS, multi: true, operators: OPS_SELECT, base: true },
  { name: "yard", label: "조선소", options: ["한빛중공업", "대건조선", "태평조선"], multi: true, operators: OPS_SELECT },
  { name: "shipType", label: "선종", options: ["Container", "Bulk Carrier", "Tanker", "LNG Carrier"], multi: true, operators: OPS_SELECT },
  { name: "shipClass", label: "선급", options: ["KR", "BV", "NK", "LR", "DNV", "ABS"], multi: true, operators: OPS_SELECT },
  { name: "seriesCode", label: "시리즈 코드", kind: "text", operators: OPS_TEXT, placeholder: "SER-2026-A" },
  { name: "deliveryOn", label: "인도 예정일", kind: "date", operators: OPS_DATE, now: NOW },
]

export const VesselList = {
  parameters: { vocab: "header-filter" },
  args: {
    placeholder: "Hull No. · 선명 · IMO · 선주 · 조선소 · 시리즈 코드 검색",
    filters: VESSEL_FILTERS,
    values: { owner: "is not 청해선사", shipType: "is Container, Tanker", deliveryOn: "before 2026-12-31" },
    shown: ["shipType", "deliveryOn"],
    keyword: "",
  } as DemoProps,
  render,
}

/* ── 6.3 납품 제품 리스트 ───────────────────────────────────────── */
const DTYPES = ["제품 신규 납부", "제품 신규 납부 + 구독", "1회성 업데이트", "자재 변경·교체·수리", "구독 갱신·신규 전환"]
const DELIVERY_FILTERS: FilterDef[] = [
  { name: "cancelled", label: "취소 여부", options: ["유효", "취소"], multi: true, operators: OPS_SELECT, base: true },
  { name: "productName", label: "납품 제품 이름", kind: "text", operators: OPS_TEXT, placeholder: "납품 제품 이름" },
  { name: "product", label: "제품", options: PRODUCTS, multi: true, operators: OPS_SELECT },
  { name: "vessel", label: "호선", options: HULLS, multi: true, operators: OPS_SELECT },
  { name: "dtype", label: "이행 종류", options: DTYPES, multi: true, operators: OPS_SELECT },
  { name: "contract", label: "계약", options: ["C-2026-001", "C-2026-017", "C-2025-003", "C-2024-016"], multi: true, operators: OPS_SELECT },
  { name: "dueOn", label: "납품 예정일", kind: "date", operators: OPS_DATE, now: NOW },
  { name: "commissioningOn", label: "커미셔닝 예정일", kind: "date", operators: OPS_DATE, now: NOW },
  { name: "drawing", label: "도면", options: ["승인도면", "작업도면", "최종도면", "도면 없음"], multi: true, operators: OPS_SELECT },
]

export const DeliveryList = {
  parameters: { vocab: "header-filter" },
  args: {
    placeholder: "납품 제품 이름 · 호선 · 계약 검색",
    filters: DELIVERY_FILTERS,
    values: { cancelled: "is 유효", dtype: "is 제품 신규 납부 + 구독", dueOn: "between 2026-09-01–2026-12-31" },
    shown: ["dtype", "dueOn"],
    keyword: "",
  } as DemoProps,
  render,
}

/* ── 검색 제안 옵트인 — searchSlot 에 SearchBox(2026-09-11) ─────────────
 * FilterBar 기본 검색은 InputGroup. 검색 제안(최근 검색 3 · 빠른검색 5 · 입력 중 자동완성)이 필요한 화면만
 * searchSlot 으로 SearchBox 를 넣는다(현재 납품 호선 리스트). defaultOpen 은 미리보기 전용 — 피그마 FilterBar state=search-open 과 같은 그림. */
type SearchSuggestProps = {
  /** 처음 입력돼 있는 검색어 — SearchBox 의 ✕는 search-box 스토리(Typing)를 본다 */
  keyword?: string
}

function SearchSuggestDemo({ keyword: initial = "" }: SearchSuggestProps) {
  const [keyword, setKeyword] = React.useState(initial)
  return (
    <Demo
      placeholder="IMO · 호선명 · Hull · 선사 검색"
      filters={DELIVERY_FILTERS}
      searchSlot={
        <SearchBox
          placeholder="IMO · 호선명 · Hull · 선사 검색"
          value={keyword}
          onChange={setKeyword}
          candidates={[
            { label: "9800137", sub: "HYUNDAI GLOBE 001" },
            { label: "9800274", sub: "MAERSK SEOUL 002" },
            { label: "HYUNDAI GLOBE 001", sub: "IMO 9800137" },
          ]}
          recentInitial={["9800137", "9800274", "HYUNDAI GLOBE 001"]}
          quick={["HYUNDAI GLOBE", "MAERSK", "SVM", "BUSAN", "TEST"]}
          defaultOpen
        />
      }
    />
  )
}

export const SearchSuggest = {
  parameters: { vocab: "header-filter" },
  args: { keyword: "" } as SearchSuggestProps,
  render: (args: SearchSuggestProps) => <SearchSuggestDemo {...args} />,
}

/* ── 6.4 구독 리스트 ────────────────────────────────────────────── */
const SUBSCRIPTION_FILTERS: FilterDef[] = [
  { name: "status", label: "상태", options: ["진행중", "중단", "예정", "만료", "취소"], multi: true, operators: OPS_SELECT, base: true },
  { name: "vessel", label: "호선", options: HULLS, multi: true, operators: OPS_SELECT },
  { name: "product", label: "제품", options: PRODUCTS, multi: true, operators: OPS_SELECT },
  { name: "expiresOn", label: "구독 만료일", kind: "date", operators: OPS_DATE, now: NOW },
  { name: "untilExpiry", label: "만료까지", options: ["30일", "60일", "90일", "만료됨"], operators: OPS_SELECT },
  { name: "validity", label: "유효 기간", kind: "date", operators: OPS_DATE, now: NOW },
]

export const SubscriptionList = {
  parameters: { vocab: "header-filter" },
  args: {
    placeholder: "호선 검색",
    filters: SUBSCRIPTION_FILTERS,
    values: { status: "is 진행중, 예정", untilExpiry: "is 30일" },
    shown: ["untilExpiry"],
    keyword: "",
  } as DemoProps,
  render,
}

/* ── 6.5 계정 리스트 ────────────────────────────────────────────── */
const ACCOUNT_FILTERS: FilterDef[] = [
  { name: "type", label: "계정 유형", options: ["선사", "조선소", "운항사"], multi: true, operators: OPS_SELECT, base: true },
  { name: "accountName", label: "계정명", kind: "text", operators: OPS_TEXT, placeholder: "계정명" },
  { name: "country", label: "국가", options: ["대한민국", "그리스", "싱가포르", "일본", "중국", "노르웨이"], multi: true, operators: OPS_SELECT },
  { name: "contact", label: "연락처", kind: "text", operators: OPS_TEXT, placeholder: "연락처" },
  { name: "tier", label: "티어", options: ["Tier 1", "Tier 2", "Tier 3"], multi: true, operators: OPS_SELECT },
  { name: "createdOn", label: "등록일", kind: "date", operators: OPS_DATE, now: NOW },
  // 관련 계약 · 관련 호선(Number) — 정렬 전용, 필터 아님
]

export const AccountList = {
  parameters: { vocab: "header-filter" },
  args: {
    placeholder: "계정명 · 국가 · 연락처 검색",
    filters: ACCOUNT_FILTERS,
    values: { type: "is 선사", tier: "is not Tier 3", accountName: "does not contain 조선" },
    shown: ["tier", "accountName"],
    keyword: "",
  } as DemoProps,
  render,
}

/* ── 6.6 유저 리스트 ────────────────────────────────────────────── */
const USER_FILTERS: FilterDef[] = [
  { name: "active", label: "활성 여부", options: ["활성", "비활성"], operators: OPS_SELECT, base: true },
  { name: "userName", label: "이름", kind: "text", operators: OPS_TEXT, placeholder: "이름" },
  { name: "role", label: "역할", options: ["admin", "service engineer", "avikus", "guest", "dev", "qa", "sales", "research"], multi: true, operators: OPS_SELECT },
  { name: "createdOn", label: "등록일", kind: "date", operators: OPS_DATE, now: NOW },
  // 담당 계약(Number) — 정렬 전용, 필터 아님
]

export const UserList = {
  parameters: { vocab: "header-filter" },
  args: {
    placeholder: "이름 · 역할 검색",
    filters: USER_FILTERS,
    values: { active: "is 활성", role: "is sales, dev", createdOn: "after 2024-01-01" },
    shown: ["role", "createdOn"],
    keyword: "",
  } as DemoProps,
  render,
}

/* ── 회귀 — operators 없는 현행 문법(hinas365 날짜 프리셋)이 그대로인지 ── */
export const Presets = {
  parameters: { vocab: "header-filter" },
  args: {
    placeholder: "호선명 검색",
    filters: [
      { name: "status", label: "상태", options: ["정상", "주의", "에러"], multi: true, base: true },
      { name: "updatedOn", label: "갱신일", kind: "date", presets: DATE_PRESETS, now: NOW, base: true },
    ],
    values: { status: "정상, 주의", updatedOn: "최근 7일" },
    keyword: "",
  } as DemoProps,
  render,
}

export const __namedExportsOrder = [
  "ContractList",
  "Keyword",
  "WithActions",
  "VesselList",
  "DeliveryList",
  "SearchSuggest",
  "SubscriptionList",
  "AccountList",
  "UserList",
  "Presets",
]
