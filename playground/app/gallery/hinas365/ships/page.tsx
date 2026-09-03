// /ships — 납품/테스트가 라우트로 분리되면서 기본은 납품 호선으로 보낸다
import { redirect } from "next/navigation";

export default function ShipsIndexPage() {
  redirect("/gallery/hinas365/ships/delivery");
}
