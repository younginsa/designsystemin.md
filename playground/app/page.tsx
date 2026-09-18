// 허브 문서 사이트(루트) — 서버 컴포넌트: 추출 프래그먼트를 읽어 클라이언트 셸에 넘긴다.
// output: "export"라 이 읽기는 빌드 시 1회 실행되고, 정적 export가 out/index.html을
// 만들므로 구 주소(/index.html#templates)도 프로덕션에서 계속 동작한다.
// 구 정적 허브(public/index.html)는 2026-08-26 실렌더 전환으로 은퇴 — 산문 원본은
// app/hub/fragments/*.html이 승계한다.

import fs from "node:fs";
import path from "node:path";

import HubApp from "./hub/HubApp";
import "./hub/hub.css";

export const metadata = { title: "HiNAS Design System document for AI" };

const FRAG_DIR = path.join(process.cwd(), "app/hub/fragments");
const frag = (name: string) => fs.readFileSync(path.join(FRAG_DIR, name), "utf8");

export default function Page() {
  const fragments = {
    usage: frag("usage.html"),
    pipeline: frag("pipeline.html"),
    templates: frag("templates.html"),
    usage365: frag("usage365.html"),
  };
  const histMeta: Array<{ date: string; summary: string; file: string }> = JSON.parse(frag("hist-meta.json"));
  const hist = histMeta.map((h) => ({ date: h.date, summary: h.summary, html: frag(h.file) }));

  // 암호화 스크린샷 이름 전수 — 산문 프래그먼트와 히스토리에서 수집.
  // 2026-09-18: 카드 데이터(cards-data.ts)는 채택 카탈로그와 함께 은퇴해 수집원에서 빠졌다.
  const all = Object.values(fragments).join("\n") + hist.map((h) => h.html).join("\n");
  const shotNames = [...new Set(
    [...all.matchAll(/data-shots?="([^"]+)"/g)].flatMap((m) => m[1].split(","))
      .concat([...all.matchAll(/"shot": "([^"]+)"/g)].map((m) => m[1]))
      .concat([...all.matchAll(/"shots": \[([^\]]+)\]/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().replace(/"/g, "")))),
  )].filter(Boolean);

  return <HubApp fragments={fragments} hist={hist} shotNames={shotNames} />;
}
