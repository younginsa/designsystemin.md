// 파일럿 HTML 렌더 확인 — 배포 주소의 ds.css/ds.js/fe-assets 를 로컬 파일로 가로채 찍는다(pnpm pilot:shot).
//   PILOT_REMOTE=1 pnpm pilot:shot  → 가로채지 않고 배포 사이트의 /pilot/*.html 을 그대로 연다(배포 확인용)
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
const ROOT = "/Users/younginsa/Documents/Claude/Projects/UX-DS";
const SITE = "https://designsystemin-md.vercel.app";
const OUT = join(ROOT, "screens/pilot"); mkdirSync(OUT, { recursive: true });
function chromePath() {
  for (const cache of [join(homedir(), "Library/Caches/ms-playwright")]) for (const d of readdirSync(cache).filter((x) => /^chromium(_headless_shell)?-/.test(x)).sort().reverse()) { const p = join(cache, d, "chrome-headless-shell-mac-arm64/chrome-headless-shell"); if (existsSync(p)) return p; }
}
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const REMOTE = !!process.env.PILOT_REMOTE;
if (!REMOTE) await page.route(SITE + "/**", (route) => {
  const u = new URL(route.request().url()); const p = join(ROOT, "playground/public", u.pathname);
  if (!existsSync(p)) return route.fulfill({ status: 404, body: "" });
  const ct = p.endsWith(".css") ? "text/css" : p.endsWith(".js") ? "text/javascript" : p.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
  route.fulfill({ status: 200, contentType: ct, body: readFileSync(p) });
});
const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
for (const f of ["vessels-list", "vessel-detail"]) {
  await page.goto(REMOTE ? `${SITE}/pilot/${f}.html` : "file://" + join(ROOT, "playground/public/pilot", f + ".html"), { waitUntil: "load" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, f + "-default.png"), fullPage: true });
  for (const s of ["empty", "loading", "error"]) { await page.click(`[data-pick="${s}"]`); await page.waitForTimeout(100); await page.screenshot({ path: join(OUT, `${f}-${s}.png`), fullPage: false }); }
  await page.click('[data-pick="default"]');
  if (f === "vessel-detail") {
    const tabs = await page.$$('[role="tab"]');
    await tabs[1].click(); await page.waitForTimeout(100);
    const visible = await page.evaluate(() => [...document.querySelectorAll('[role="tabpanel"]')].map((p) => ({ id: p.id, hidden: p.hidden, state: p.dataset.state })));
    console.log("tabs after click:", JSON.stringify(visible));
    await page.screenshot({ path: join(OUT, f + "-tab2.png"), fullPage: false });
  }
  await page.click('[data-view-pick="spec"]'); await page.waitForTimeout(100);
  await page.screenshot({ path: join(OUT, f + "-spec.png"), fullPage: true });
  const m = await page.evaluate(() => { const h2 = document.querySelector("main h2"); const cs = getComputedStyle(h2); const main = document.querySelector("main.flex-1"); const th = document.querySelector("th"); return { title: h2.textContent, titleSize: cs.fontSize, titleWeight: cs.fontWeight, mainBg: getComputedStyle(main).backgroundColor, bodyBg: getComputedStyle(document.body).backgroundColor, th: th && getComputedStyle(th).fontSize, sidebarW: document.querySelector('[data-slot="sidebar"]') && document.querySelector('[data-slot="sidebar"]').getBoundingClientRect().width }; });
  console.log(f, JSON.stringify(m));
}
console.log("errors:", errors.length ? errors : "none");
await browser.close();
