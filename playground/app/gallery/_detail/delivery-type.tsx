// DeliveryType — 납품 유형 표기 요소 잠금 (2026-09-07)
// - 값은 원자 칩의 조합이다: "납품 + 구독"은 한 덩어리 문자열이 아니라 [납품][구독] 두 칩.
// - 색 위계(디자이너 확정 2026-09-07): 납품 = 파랑 채움(default) ·
//   구독 = secondary-foreground 채움(Day Gray/600) + 흰 글자, 테두리 없음 ·
//   1회성 업데이트 = 테두리(outline). 납품도 구독도 아닌 일회성 작업이라 위계가 다르다.
// - 반려된 안 2건: secondary(#F9FAFB + 회색 글자)는 파랑 칩 옆에서 비활성 버튼처럼 읽혔고,
//   ring(#DBDEE8) + 흰 글자는 1.34:1로 사실상 안 보인다(최소 3:1 미달). 흰 글자를 쓰려면
//   면이 어두워져야 해서 Gray/600으로 내렸다 — 실측 6.05:1로 본문 기준 통과.
//   near-black인 foreground(10:1)보다 밝게 둬서 파랑 납품 칩을 누르지 않는다.
//   ⚠ background×secondary-foreground는 contrast-pairs 미선언 조합 — UX-DS 선언 대기.
// - 쓰는 곳 4곳: 납품 제품 목록 · 호선 상세 납품 탭 · 납품 상세(헤더 · 개요 dl)

import { Badge } from "@ds/ui/ui/badge";

/** 화면에 흐르는 값 — 계약 생성 폼의 선택지와 같은 문자열 */
export type DeliveryTypeValue = "납품" | "납품 + 구독" | "구독" | "1회성 업데이트";

type Atom = "납품" | "구독" | "1회성 업데이트";

/** "납품 + 구독" → ["납품", "구독"] · 나머지는 그대로 한 칩 */
function atomsOf(value: string): Atom[] {
  return value.split(" + ").map((v) => v.trim() as Atom);
}

const VARIANT: Record<Atom, "default" | "secondary" | "outline"> = {
  납품: "default",
  구독: "secondary",
  "1회성 업데이트": "outline",
};

/** 구독만 면·글자를 덮어쓴다 — secondary 기본값이 비활성처럼 보이는 문제 교정 */
const EXTRA: Partial<Record<Atom, string>> = {
  구독: "bg-secondary-foreground text-background",
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
