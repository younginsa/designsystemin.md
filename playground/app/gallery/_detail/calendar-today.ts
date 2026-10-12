// 달력 「오늘」 표시 — 로컬 공용 상수(2026-10-08)
// DS 기본(bg-accent 칠)은 기간·주 선택 띠와 구분되지 않는다 → 회색 외곽선 + bold.
// 버튼이 자체 font-weight 를 쥐고 있어 셀에서 *:font-bold 로 내려준다.
// FE Storybook 반영 전까지 생성 화면에서만 쓰는 임시본 — FilterBar 기간 패널은 컴포넌트 내부라 미적용(FE 요청).
// 사용: <Calendar classNames={TODAY_CLASS} … />
export const TODAY_CLASS = {
  today: "rounded-md text-foreground ring-1 ring-inset ring-muted-foreground *:font-bold",
};
