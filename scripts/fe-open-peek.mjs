#!/usr/bin/env node
// 열린 상태 스냅샷 들여다보기 — 포털 부분의 구조를 클래스·svg 없이 출력한다(조립 전에 트리거·콘텐츠 id 를 확인하는 용도).
//   node scripts/fe-open-peek.mjs filter-bar/states/empty--open [max-chars]
import { readFileSync } from "node:fs";
const [rel, max = "2000"] = process.argv.slice(2);
const html = readFileSync(new URL(`../playground/fe-stories/${rel}.html`, import.meta.url), "utf8");
const [root, portal = ""] = html.split("\n<!-- portal -->\n");
const slim = (s) => s.replace(/ class="[^"]*"/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "<svg/>").replace(/<path[^>]*>/g, "");
const triggers = [...root.matchAll(/<(button|div)[^>]*(aria-haspopup|role="combobox")[^>]*>/g)].map((m) => slim(m[0]));
console.log("== 트리거(루트)\n" + triggers.join("\n"));
console.log("== 포털 " + portal.length + "자\n" + slim(portal).slice(0, Number(max)));
