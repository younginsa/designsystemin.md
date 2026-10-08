// 생성 HTML 자가 검사 — MCP check_html 을 인메모리로 호출한다(2026-09-30). claude.ai 프로젝트가 받는 것과 같은 검사.
//   pnpm check:html <file.html> [...]            (루트 스크립트 → pnpm --filter @ds/mcp check-html)
//   DS_BASE=http://localhost:3000 … 로 원천을 로컬 dev 서버로 바꾼다(기본 배포 사이트)
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "./src/server.js";

// 루트 `pnpm check:html <file>` 는 pnpm 이 "--" 를 그대로 넘기고 mcp/ 에서 실행된다 — "--" 를 빼고 상대 경로는 명령을 친 폴더(INIT_CWD) 기준으로 푼다(2026-10-08)
const files = process.argv.slice(2).filter((a) => a !== "--").map((f) => resolve(process.env.INIT_CWD || process.cwd(), f));
if (!files.length) { console.error("사용법: pnpm check:html <file.html> [...]"); process.exit(2); }
const [ct, st] = InMemoryTransport.createLinkedPair();
const server = createServer(); await server.connect(st);
const client = new Client({ name: "check-html", version: "0" }); await client.connect(ct);
let bad = 0;
for (const f of files) {
  const html = readFileSync(f, "utf8");
  const r: any = await client.callTool({ name: "check_html", arguments: { html } });
  const j = JSON.parse(r.content?.[0]?.text ?? "{}");
  const rules = Object.entries(j.byRule || {}).map(([k, v]) => `${k} ${v}`).join(" · ");
  console.log(`[check:html] ${f} — 위반 ${j.violations}${rules ? " (" + rules + ")" : ""} · 사용 컴포넌트 ${(j.usedComponents || []).length} · DS 밖 ${(j.fallbacks || []).length} · 값 채운 입력 ${j.filledInputs ?? 0}`);
  for (const d of (j.details || []).slice(0, 15)) console.log(`   ${d.rule}: ${d.detail}`);
  if (j.violations) bad++;
}
await client.close();
process.exit(bad ? 1 : 0);
