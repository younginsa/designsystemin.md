// 계약명·계약 항목명 조립 규칙(2026-09-09 유현수 공유 — 오전의 피그마 코멘트 규칙 "계약일-고객-패키지-N척"을 대체)
//   {계약일} {고객 표시명} {계약 항목}[ / {계약 항목} …]
//   계약 항목 = {제품·이행 그룹}[, {제품·이행 그룹} …] {척수}척 · 제품·이행 그룹 = "{제품} {이행 단축}"
//   예) 2026-03-15 HHI Control 신규 납품·구독, SVM 구독 5척 · 2026-03-15 HHI Control 구독 5척 / Navigation 자재 2척
// - 고객 표시명: 샘플 계정에 표시명 필드가 없어 계정명(대양해운)을 그대로 쓴다 — 표시명이 생기면 여기서만 바꾼다.
// - 사람이 입력하지 않는다: 생성 폼은 읽기 전용 표시, 수정 모달도 읽기 전용. 길이 제한 없음(목록은 2줄 말줄임).
// - 쓰는 곳: 계약 생성 폼 · 계약 목록 샘플 · 계약 상세(계약명·항목명) · 계정/유저/구독/납품 상세의 계약명 · 호선 상세 계약 이력 — 요소 잠금

/** 이행 종류 5종(2026-09-09 피그마 코멘트) — DeliveryType 배지·필터 옵션·생성 폼 선택지가 같은 배열을 본다 */
export const DELIVERY_KINDS = [
  "제품 신규 납부",
  "제품 신규 납부 + 구독",
  "1회성 업데이트",
  "자재 변경·교체·수리",
  "구독 갱신·신규 전환",
] as const;
export type DeliveryKind = (typeof DELIVERY_KINDS)[number];

/** 이름 안에서 쓰는 이행 단축 표기(공유 규칙의 예시에서 읽은 값) */
export const DELIVERY_SHORT: Record<DeliveryKind, string> = {
  "제품 신규 납부": "신규 납품",
  "제품 신규 납부 + 구독": "신규 납품·구독",
  "1회성 업데이트": "업데이트",
  "자재 변경·교체·수리": "자재",
  "구독 갱신·신규 전환": "구독",
};

/** 패키지 구성(제품 목록 매트릭스와 동일) — 생성 폼 라디오와 목록 샘플이 같은 표를 본다 */
export const PKG_COMPOSITION: Record<string, string[]> = {
  Enterprise: ["Control", "SVM", "Cloud"],
  "Smart Standard": ["Control", "Cloud"],
  "Safety Forward": ["Navigation", "Cloud"],
  "Safety Around": ["Navigation", "SVM", "Cloud"],
  "직접 선택": ["Control", "Navigation", "SVM", "Cloud"],
};

/** 샘플·초기값용 기본 이행 종류 — 하드웨어 제품은 신규 납품 + 구독, Cloud는 구독 */
export const defaultDelivery = (product: string): DeliveryKind =>
  product === "Cloud" ? "구독 갱신·신규 전환" : "제품 신규 납부 + 구독";

export type ProductDelivery = { product: string; delivery: string };
export type ContractItemSpec = { groups: ProductDelivery[]; count: number };

/** 패키지 + 척수 → 항목 스펙. 패키지 표에 없는 이름(Cloud·Shield 단품)은 제품 하나로 본다 */
export const itemFromPackage = (
  pkg: string,
  count: number,
  delivery: (product: string) => string = defaultDelivery,
): ContractItemSpec => ({
  groups: (PKG_COMPOSITION[pkg] ?? [pkg]).map((product) => ({ product, delivery: delivery(product) })),
  count,
});

const shortOf = (d: string) => (DELIVERY_SHORT as Record<string, string>)[d] ?? d;

/** 계약 항목명 — "Control 신규 납품·구독, SVM 구독 5척" */
export const itemName = (item: ContractItemSpec) =>
  `${item.groups.map((g) => `${g.product} ${shortOf(g.delivery)}`).join(", ")} ${item.count}척`;

/** 계약명 — "2026-03-15 HHI Control 신규 납품·구독, SVM 구독 5척 / Navigation 자재 2척" */
export const contractName = (date: string, customer: string, items: ContractItemSpec[]) =>
  [date, customer, items.map(itemName).join(" / ")].filter(Boolean).join(" ");
