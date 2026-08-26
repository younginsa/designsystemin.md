// 허브 문서 사이트 — 서버 컴포넌트: 추출 프래그먼트를 읽어 클라이언트 셸에 넘긴다.
// output: "export"라 이 읽기는 빌드 시 1회 실행된다(런타임 서버 없음).

import fs from "node:fs";
import path from "node:path";

import HubApp from "./HubApp";
import "./hub.css";

export const metadata = { title: "HiNAS Design System document for AI" };

const FRAG_DIR = path.join(process.cwd(), "app/hub/fragments");
const frag = (name: string) => fs.readFileSync(path.join(FRAG_DIR, name), "utf8");

export default function Page() {
  const fragments = {
    usage: frag("usage.html"),
    pipeline: frag("pipeline.html"),
    resources: frag("resources.html"),
    templates: frag("templates.html"),
  };
  const histMeta: Array<{ date: string; summary: string; file: string }> = JSON.parse(frag("hist-meta.json"));
  const hist = histMeta.map((h) => ({ date: h.date, summary: h.summary, html: frag(h.file) }));

  // 암호화 스크린샷 이름 전수 — 프래그먼트 + 카드 데이터에서 수집 (구 페이지의 DOM 스캔 등가)
  const all = Object.values(fragments).join("\n") + hist.map((h) => h.html).join("\n") +
    fs.readFileSync(path.join(process.cwd(), "app/hub/cards-data.ts"), "utf8");
  const shotNames = [...new Set(
    [...all.matchAll(/data-shots?="([^"]+)"/g)].flatMap((m) => m[1].split(","))
      .concat([...all.matchAll(/"shot": "([^"]+)"/g)].map((m) => m[1]))
      .concat([...all.matchAll(/"shots": \[([^\]]+)\]/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().replace(/"/g, "")))),
  )].filter(Boolean);

  return <HubApp fragments={fragments} hist={hist} shotNames={shotNames} />;
}
