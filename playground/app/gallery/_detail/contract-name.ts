// 계약명 자동 생성 규칙(2026-09-09 디자이너 확정, 피그마 코멘트) — 사람이 입력하지 않는다.
// 형식: 계약일-고객-패키지-N척. 계약 항목이 여럿이면 "-패키지-N척"이 항목 수만큼 이어 붙는다.
// 예) 2026-01-15-대양해운-Enterprise-5척 · 2026-08-20-서해해운-Enterprise-3척-Smart Standard-2척-…
// 글자 수 제한은 없다(대략 100자까지 길어질 수 있다). 목록 셀은 2줄 말줄임(line-clamp-2)으로 받고 전체는 상세가 답한다.
// 쓰는 곳: 계약 생성 폼(읽기 전용 표시) · 계약 목록 샘플 데이터 · 계약 상세(수정 모달도 읽기 전용) — 요소 잠금
export type ContractItemSpec = { pkg: string; count: number };

export const contractName = (date: string, customer: string, items: ContractItemSpec[]) =>
  [date, customer, ...items.flatMap((i) => [i.pkg, `${i.count}척`])].join("-");
