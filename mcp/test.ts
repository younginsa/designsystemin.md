// 로컬 검증 — 인메모리 전송으로 도구 7종을 실제 호출한다(HTTP 없이). DS_BASE 로 원천을 바꾼다(기본 배포 사이트).
//   DS_BASE=http://localhost:3000 pnpm --filter @ds/mcp test   ← dev 서버 + pnpm mcp:artifacts 산출물로 검증
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "./src/server.js";

const [ct, st] = InMemoryTransport.createLinkedPair();
const server = createServer();
await server.connect(st);
const client = new Client({ name: "test", version: "0" });
await client.connect(ct);

const tools = await client.listTools();
console.log("tools:", tools.tools.map((t) => t.name).join(", "));
const call = async (name: string, args: any) => {
  const r: any = await client.callTool({ name, arguments: args });
  const t = r.content?.[0]?.text ?? "";
  return t;
};
const list = JSON.parse(await call("list_components", {}));
console.log("list_components:", list.count, "adopted · first", list.components[0]?.key, "stories", list.components[0]?.stories?.length);
const comp = JSON.parse(await call("get_component", { key: "list-footer" }));
console.log("get_component list-footer: snippets", comp.snippets.length, "· html chars", comp.snippets[0]?.html?.length, "· source", !!comp.componentSource);
const tok = JSON.parse(await call("get_tokens", {}));
console.log("get_tokens light: colors", tok.colors.length, "tints", tok.tints.length, "primary", tok.colors.find((c: any) => c.name === "primary")?.hex);
const lay = await call("get_layout", {});
console.log("get_layout chars", lay.length, "has body-patterns", lay.includes("## A"));
const con = await call("get_generation_contract", {});
console.log("contract chars", con.length, "has HTML rules", con.includes("단독 HTML 출력 규약"), "has 절차", con.includes("페이지 생성 요청을 받으면"));
const css = JSON.parse(await call("get_css_bundle", {}));
console.log("css bytes", css.bytes);
const sample = `<html><head><link rel="stylesheet" href="${css.url}"></head><body class="bg-background text-foreground"><div class="flex items-center gap-2 bg-primary/5 text-[13px]" style="color:#ff0000"><span class="text-foo">x</span></div><section data-state="default"></section></body></html>`;
const chk = JSON.parse(await call("check_html", { html: sample }));
console.log("check_html violations", chk.violations, JSON.stringify(chk.byRule));
const good = `<html><head><link rel="stylesheet" href="${css.url}"></head><body class="bg-background text-foreground antialiased"><div data-pick="default"></div><div data-pick="empty"></div><div data-pick="loading"></div><div data-pick="error"></div><section data-state="default"><div class="flex items-center gap-2 bg-primary/5 text-sm">${comp.snippets[0]?.html ?? ""}</section><section data-state="empty" hidden></section><section data-state="loading" hidden></section><section data-state="error" hidden></section></body></html>`;
const chk2 = JSON.parse(await call("check_html", { html: good }));
console.log("check_html(good) violations", chk2.violations, JSON.stringify(chk2.byRule), chk2.violations ? JSON.stringify(chk2.details.slice(0, 12)) : "");
if (chk2.violations) { console.error("스니펫 그대로 넣은 HTML 이 위반이면 검사기가 틀린 것"); process.exit(1); }
const res = await client.listResources();
console.log("resources:", res.resources.map((r) => r.uri).join(", "));
await client.close();
