// 목록 행 거르기 — 2026-09-15 DS 승격 완료: 매처 4종(passText · passSelect · passDate · passDateSpan)은
// @ds/ui/ui/filter-bar 가 본체다(값 문법 "<op> <value>"의 주인이 같은 파일). 이 모듈은 경로 호환용 재수출만 한다.
// - 세일즈 365 목록 6개 + HiNAS 365 목록 3개 + AuditLog 가 이 경로(또는 sales365/_filter)로 들어온다 — 호출부 무수정.
// - DS 매처의 now 기본값은 실제 시계. 화면 기준일(BASE_NOW)은 갤러리 고유 값이라 여기 남긴다.
export { passDate, passDateSpan, passSelect, passText } from "@ds/ui/ui/filter-bar";

/** 화면 기준일 — 셸 헤더 시계(2026-08-20 15:30)와 같다. 자체 TODAY가 있는 화면(구독 2026-08-21)은 그 값을 넘긴다 */
export const BASE_NOW = new Date(2026, 7, 20);
