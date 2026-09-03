import { redirect } from "next/navigation";

// 랜딩 = 대시보드 (구 화면 모음 인덱스는 제거 — 로고 클릭 시 대시보드로)
export default function HiNAS365Index() {
  redirect("/generated/hinas365/dashboard");
}
