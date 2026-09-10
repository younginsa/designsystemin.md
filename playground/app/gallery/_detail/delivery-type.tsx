// DeliveryType — 이행 종류 표기 요소 잠금 (2026-09-07 · 2026-09-09 5종으로 개정, 피그마 코멘트 반영)
// - 값 5종은 _detail/contract-name의 DELIVERY_KINDS: 제품 신규 납부 · 제품 신규 납부 + 구독 · 1회성 업데이트 ·
//   자재 변경·교체·수리 · 구독 갱신·신규 전환. 종전 납품 / 납품 + 구독 / 구독은 앞의 셋과 마지막에 대응.
// - "+ 구독"은 한 덩어리가 아니라 [제품 신규 납부][구독] 두 칩(2026-09-07 원자 칩 규칙 유지).
// - 색 위계(디자이너 확정 2026-09-07 승계): 납품 계열 = 파랑 채움(default) ·
//   구독 계열(구독 · 구독 갱신·신규 전환) = secondary-foreground 채움(Day Gray/600) + 흰 글자, 테두리 없음 ·
//   일회성 작업(1회성 업데이트 · 자재 변경·교체·수리) = 테두리(outline).
// - 반려된 안 2건: secondary 기본(밝은 회색 면 + 회색 글자)은 파랑 칩 옆에서 비활성 버튼처럼 읽혔고,
//   ring 색 면 + 흰 글자는 1.34:1로 사실상 안 보인다. Gray/600은 실측 6.05:1로 본문 기준 통과.
//   ⚠ background×secondary-foreground는 contrast-pairs 미선언 조합 — UX-DS 선언 대기.
// - 쓰는 곳 4곳: 납품 제품 목록 · 호선 상세 납품 탭 · 납품 상세 개요 · 계약 생성 폼(선택지 원천만)

import { Badge } from "@ds/ui/ui/badge";

import { DELIVERY_KINDS, type DeliveryKind } from "./contract-name";

export { DELIVERY_KINDS, type DeliveryKind };
/** 화면에 흐르는 값 — 계약 생성 폼의 선택지와 같은 문자열 */
export type DeliveryTypeValue = DeliveryKind;

type Atom = "제품 신규 납부" | "구독" | "1회성 업데이트" | "자재 변경·교체·수리" | "구독 갱신·신규 전환";

/** "제품 신규 납부 + 구독" → ["제품 신규 납부", "구독"] · 나머지는 그대로 한 칩 */
function atomsOf(value: string): Atom[] {
  return value.split(" + ").map((v) => v.trim() as Atom);
}

const VARIANT: Record<Atom, "default" | "secondary" | "outline"> = {
  "제품 신규 납부": "default",
  구독: "secondary",
  "구독 갱신·신규 전환": "secondary",
  "1회성 업데이트": "outline",
  "자재 변경·교체·수리": "outline",
};

/** 구독 계열만 면·글자를 덮어쓴다 — secondary 기본값이 비활성처럼 보이는 문제 교정 */
const EXTRA: Partial<Record<Atom, string>> = {
  구독: "bg-secondary-foreground text-background",
  "구독 갱신·신규 전환": "bg-secondary-foreground text-background",
};

export function DeliveryType({ value }: { value: string }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {atomsOf(value).map((a) => (
        <Badge
          key={a}
          variant={VARIANT[a] ?? "secondary"}
          className={"font-normal" + (EXTRA[a] ? " " + EXTRA[a] : "")}
        >
          {a}
        </Badge>
      ))}
    </span>
  );
}
