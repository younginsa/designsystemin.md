// 피그마 Theme 적용(H3, 2026-10-14) — fe-requests/figma-plan.json 의 ops 를 아래 PLAN 에 붙여 넣고 use_figma 로 라이브러리(i5IhnacRAjg6NJdmtctfn2)에서 실행한다.
// **사람이 figma-report.md 를 보고 승인한 뒤에만.** 각 op 는 가능하면 Colors 팔레트 변수에 별칭으로 묶는다(값이 정확히 같은 것만) —
// 계획의 alias 이름이 값과 맞으면 그것, 아니면 같은 값의 팔레트 변수(빛 모드는 Day, 어두운 모드는 Dusk 우선), 없으면 원색 값.
// 실행 전 값(from)이 지금 피그마 값과 다르면 건너뛴다(그 사이 누가 바꿨다 — 다시 읽고 분류할 것). 게시(Publish)는 피그마에서 직접.
const PLAN = [/* figma-plan.json 의 ops 를 여기에 */];
const hex = (c) => { const h = (x) => Math.round(x * 255).toString(16).padStart(2, "0").toUpperCase(); const b = "#" + h(c.r) + h(c.g) + h(c.b); return c.a === undefined || c.a >= 0.999 ? b : b + "/" + Number(c.a.toFixed(2)); };
const norm = (s) => { s = String(s).toUpperCase(); const m = s.match(/^(#[0-9A-F]{6})\/([\d.]+)$/); return m ? (Number(m[2]) >= 1 ? m[1] : `${m[1]}/${Number(m[2]).toFixed(2)}`) : s; };
const MODE = (n) => (/^Light/.test(n) ? "light" : /^Dark/.test(n) ? "dark" : /^Control/.test(n) ? "control" : n);
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const theme = cols.find((c) => c.name.trim() === "Theme");
const modeId = Object.fromEntries(theme.modes.map((m) => [MODE(m.name), m.modeId]));
const palette = cols.find((c) => c.name.trim() === "Colors");
const pal = [];
for (const id of palette.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); const val = v.valuesByMode[palette.modes[0].modeId]; if (val && "r" in val) pal.push({ v, hex: norm(hex(val)) }); }
async function current(v, mode) {
  let val = v.valuesByMode[modeId[mode]];
  for (let i = 0; val && val.type === "VARIABLE_ALIAS" && i < 8; i++) { const t = await figma.variables.getVariableByIdAsync(val.id); val = t.valuesByMode[modeId[mode]] ?? t.valuesByMode[Object.keys(t.valuesByMode)[0]]; }
  return val && "r" in val ? norm(hex(val)) : null;
}
const done = [], skipped = [];
for (const op of PLAN) {
  const v = await figma.variables.getVariableByIdAsync(op.id);
  if (!v) { skipped.push({ ...op, why: "변수 없음" }); continue; }
  const now = await current(v, op.mode);
  if (now !== norm(op.from)) { skipped.push({ ...op, now, why: "피그마 값이 계획의 from 과 다름" }); continue; }
  const want = norm(op.to);
  const family = op.mode === "light" ? "Day mode/" : "Dusk mode/";
  let target = pal.find((p) => p.v.name === op.alias && p.hex === want)
    || pal.find((p) => p.hex === want && p.v.name.startsWith(family))
    || pal.find((p) => p.hex === want);
  if (target) v.setValueForMode(modeId[op.mode], figma.variables.createVariableAlias(target.v));
  else { const [h, a] = want.split("/"); const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255; v.setValueForMode(modeId[op.mode], { r: n(1), g: n(3), b: n(5), a: a ? Number(a) : 1 }); }
  done.push({ variable: op.variable, mode: op.mode, from: op.from, to: want, via: target ? target.v.name : "원색", after: await current(v, op.mode) });
}
return { done, skipped, mutatedVariableIds: [...new Set(done.map((d) => PLAN.find((p) => p.variable === d.variable).id))] };
