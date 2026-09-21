#!/usr/bin/env node
// 생성 HTML 무게 실측 — 무엇이 크기를 차지하는지(2026-09-21 Phase 0 기준선).
//   node scripts/measure-html.mjs <파일.html>
// 기준선(납품 호선 리스트, 화면 2 + 상태 4): 91KB · class 문자열 48% · svg 17% · 사이드바 셸 17%(1회) · 스프라이트 절감 상한 5%.
// "셸이 상태마다 반복된다"는 가설은 실측에서 틀렸다 — 절반 감소 기대는 근거가 없었다.

import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) { console.error("사용법: node scripts/measure-html.mjs <파일.html>"); process.exit(2); }
const h = readFileSync(file, "utf8");
const T = h.length;
const sum = (re) => { let n = 0; for (const m of h.matchAll(re)) n += m[0].length; return n; };
const pct = (n) => (100 * n / T).toFixed(0) + "%";
const cls = sum(/class="[^"]*"/g);
const svg = sum(/<svg[\s\S]*?<\/svg>/g);
const seen = new Set(); let dup = 0;
for (const m of h.matchAll(/<svg[\s\S]*?<\/svg>/g)) { if (seen.has(m[0])) dup += m[0].length; else seen.add(m[0]); }
const states = (h.match(/<section data-state=/g) || []).length;
const views = (h.match(/data-view="/g) || []).length;
const sidebarCount = (h.match(/data-slot="sidebar"/g) || []).length;
const shellStart = h.indexOf('data-slot="sidebar"'), mainStart = h.indexOf("<main");
const shell = shellStart >= 0 && mainStart > shellStart ? mainStart - shellStart : 0;
const slots = new Set([...h.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1]));
console.log(`전체 ${(T / 1024).toFixed(0)}KB · 상태 섹션 ${states} · 뷰 ${views} · 사이드바 렌더 ${sidebarCount}회`);
console.log(`class 문자열 ${pct(cls)} · svg ${pct(svg)} (중복 ${pct(dup)} = 스프라이트 절감 상한) · 사이드바 셸 ${pct(shell)}`);
console.log(`data-slot 종류 ${slots.size}`);
