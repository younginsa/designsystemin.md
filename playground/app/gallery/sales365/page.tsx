import { redirect } from "next/navigation";

// 세일즈포스 대체 앱 진입점 — 첫 화면(S1 계약 목록)으로 보낸다
export default function Sales365Index() {
  redirect("/gallery/sales365/contracts");
}
