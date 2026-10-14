// 피그마 Theme 읽기(H3, 2026-10-14) — 관리자 세션이 Figma MCP use_figma 로 라이브러리(i5IhnacRAjg6NJdmtctfn2)에서 실행한다. 읽기 전용.
// 반환 JSON 을 fe-requests/figma-values.json 으로 저장한 뒤 pnpm figma:classify. (Node 로 실행하는 파일이 아니다 — use_figma 의 code 로 붙여 넣는다)
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name.trim() === "Theme");
const MODE = (n) => (/^Light/.test(n) ? "light" : /^Dark/.test(n) ? "dark" : /^Control/.test(n) ? "control" : n);
const hex = (c) => { const h = (x) => Math.round(x * 255).toString(16).padStart(2, "0").toUpperCase(); const b = "#" + h(c.r) + h(c.g) + h(c.b); return c.a === undefined || c.a >= 0.999 ? b : b + "/" + Number(c.a.toFixed(2)); };
// 별칭 대상이 같은 모드를 가진 변수(Theme 안의 Product/HiNAS Brand 등)면 그 모드 값을, 아니면(단일 모드 팔레트) 첫 값을 쓴다
async function resolve(val, modeId) {
  for (let i = 0; val && val.type === "VARIABLE_ALIAS" && i < 8; i++) { const t = await figma.variables.getVariableByIdAsync(val.id); val = t.valuesByMode[modeId] ?? t.valuesByMode[Object.keys(t.valuesByMode)[0]]; }
  return val && typeof val === "object" && "r" in val ? hex(val) : null;
}
const vars = {};
for (const id of col.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id);
  const row = { id: v.id };
  for (const m of col.modes) { const raw = v.valuesByMode[m.modeId]; row[MODE(m.name)] = await resolve(raw, m.modeId); if (raw && raw.type === "VARIABLE_ALIAS") row[MODE(m.name) + "Alias"] = (await figma.variables.getVariableByIdAsync(raw.id)).name; }
  vars[v.name] = row;
}
// Inter 글자 스타일의 SS02 — 스타일 자체엔 OpenType 정보가 없어 쓰는 레이어 최대 5개를 표본으로 읽는다(전부 SS02 여야 통과, 아니면 "이름(있음/표본)")
const styles = (await figma.getLocalTextStylesAsync()).filter((s) => s.fontName.family === "Inter");
let sampled = 0, ss02 = 0; const noSs02 = [];
for (const s of styles) {
  const uses = (await s.getStyleConsumersAsync()).filter((c) => c.node.type === "TEXT" && c.node.characters.length).slice(0, 5);
  if (!uses.length) continue; sampled++;
  const has = uses.filter((u) => { const f = u.node.getRangeOpenTypeFeatures(0, 1); return f && f !== figma.mixed && f.SS02; }).length;
  if (has === uses.length) ss02++; else noSs02.push(`${s.name}(${has}/${uses.length})`);
}
return { $note: "피그마 라이브러리 Theme 해석값(scripts/figma-theme-read.js 출력, 편집 금지) — figma:classify 가 FE 값·대기 장부와 대조한다", read: new Date().toISOString().slice(0, 10), file: figma.fileKey, collection: col.name.trim(), modes: col.modes.map((m) => MODE(m.name)), vars, interStyles: { total: styles.length, sampled, ss02, noSs02 } };
