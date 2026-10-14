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
// Inter 글자 스타일의 SS02 — 스타일엔 OpenType 정보가 없어(플러그인 API 는 읽기만 가능) 스타일을 쓰는 레이어를 전수로 센다.
// 그룹 = 스타일 이름 첫 마디(Desktop · 2m Distance · 3m Distance). 빠진 곳은 페이지 › 최상위 프레임 상위 8개(사람이 피그마에서 직접 켠다)
const styles = (await figma.getLocalTextStylesAsync()).filter((s) => s.fontName.family === "Inter");
const ss = {};
for (const s of styles) {
  const g = s.name.split("/")[0]; const G = (ss[g] = ss[g] || { layers: 0, missing: 0, where: {} });
  for (const c of await s.getStyleConsumersAsync()) {
    const n = c.node; if (n.type !== "TEXT" || !n.characters.length) continue; G.layers++;
    const f = n.getRangeOpenTypeFeatures(0, 1); if (f && f !== figma.mixed && f.SS02) continue; G.missing++;
    let top = n; while (top.parent && top.parent.type !== "PAGE") top = top.parent;
    const k = (top.parent ? top.parent.name.replace(/^[^A-Za-z0-9가-힣_]+/, "") : "?") + " › " + top.name; G.where[k] = (G.where[k] || 0) + 1;
  }
  G.where = Object.fromEntries(Object.entries(G.where).sort((x, y) => y[1] - x[1]).slice(0, 8));
}
return { $note: "피그마 라이브러리 Theme 해석값(scripts/figma-theme-read.js 출력, 편집 금지) — figma:classify 가 FE 값·대기 장부와 대조한다", read: new Date().toISOString().slice(0, 10), file: figma.fileKey, collection: col.name.trim(), modes: col.modes.map((m) => MODE(m.name)), vars, interStyles: { styles: styles.length, ss02: ss } };
