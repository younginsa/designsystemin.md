// 목록 행 거르기 — FilterBar 상세 조건(연산자) 층 공용 매처(2026-09-08 세일즈 365 → 2026-09-09 두 앱 공용으로 이동).
// 값 문법은 "<op> <value>"(filter-bar.tsx 머리 주석). 세일즈 365 목록 6개 + HiNAS 365 목록 3개가 같은 규칙을 쓴다 — 요소 잠금.
// - text   = parseFilterValue + matchText(is · is not · contains · does not contain)
// - select = 값을 ", "로 나눠 is(하나라도 포함) / is not(하나도 포함 안 함). 셀이 배열(선급)이면 원소 단위
// - date   = resolveDateRange(value, now)로 from~to 판정. 조건이 있는데 셀이 비면(미입력) 탈락.
//            셀은 "YYYY-MM-DD"(시각이 붙은 값은 호출부에서 slice(0, 10))
// _detail/ 에 두는 이유: gallery:sync 이식 대상 폴더(hinas365 · sales365 · _detail)이고 두 앱이 함께 본다

import {
  matchText,
  parseFilterValue,
  resolveDateRange,
} from "@ds/ui/ui/filter-bar";

/** 화면 기준일 — 셸 헤더 시계(2026-08-20 15:30)와 같다. 자체 TODAY가 있는 화면(구독 2026-08-21)은 그 값을 넘긴다 */
export const BASE_NOW = new Date(2026, 7, 20);

const pad2 = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** text 칩. 값 없음 = 통과. 셀 null(미입력)은 빈 문자열로 비교 */
export function passText(chip: string | undefined, cell: string | null | undefined): boolean {
  const { op, value } = parseFilterValue(chip);
  const v = value.trim();
  if (!v) return true;
  return matchText(op, cell ?? "", v);
}

/** select 칩. 셀은 단일값 또는 배열(선급처럼 한 행에 여러 값) */
export function passSelect(
  chip: string | undefined,
  cell: string | null | undefined | readonly string[],
): boolean {
  const { op, value } = parseFilterValue(chip);
  if (!value) return true;
  const wanted = value.split(", ");
  const cells: string[] = typeof cell === "string" || cell == null ? [cell ?? ""] : [...cell];
  const hit = cells.some((c) => wanted.includes(c));
  return op === "is not" ? !hit : hit;
}

/** date 칩 — before/after/is/between(구형 프리셋도 해석). 해석 불가 값(입력 중)은 거르지 않는다 */
export function passDate(
  chip: string | undefined,
  cell: string | null | undefined,
  now: Date = BASE_NOW,
): boolean {
  if (!chip) return true;
  const r = resolveDateRange(chip, now);
  if (!r) return true;
  if (!cell) return false;
  return cell >= ymd(r.from) && cell <= ymd(r.to);
}

/** 기간 셀(시작~끝)이 조건 기간과 겹치는지 — 구독 유효 기간용. 시작 없음 = 탈락, 끝 없음 = 열린 기간 */
export function passDateSpan(
  chip: string | undefined,
  start: string | null | undefined,
  end: string | null | undefined,
  now: Date = BASE_NOW,
): boolean {
  if (!chip) return true;
  const r = resolveDateRange(chip, now);
  if (!r) return true;
  if (!start) return false;
  return start <= ymd(r.to) && (end ?? "9999-12-31") >= ymd(r.from);
}
