// 로컬 HTTP 실행(선택) — Vercel 없이 http://localhost:8787/mcp 와 /render/<컴포넌트>/<스토리> 를 띄운다. /mcp 만 DS_MCP_ACCESS 필수. /render 는 먼저 pnpm --filter @ds/mcp bundle.
import { createServer as httpServer } from "node:http";

import handler from "./api/mcp.js";
import renderHandler from "./api/render.js";

const port = Number(process.env.PORT || 8787);
httpServer(async (req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", async () => {
    const r: any = req; r.body = raw ? JSON.parse(raw) : undefined;
    const u = new URL(req.url ?? "/", "http://x");
    const rm = u.pathname.match(/^\/render(?:\/([^/]+))?(?:\/([^/]+))?\/?$/);
    if (rm) { r.url = "/api/render?component=" + encodeURIComponent(rm[1] ?? "") + "&story=" + encodeURIComponent(rm[2] ?? "") + (u.searchParams.has("args") ? "&args=" + encodeURIComponent(u.searchParams.get("args") ?? "") : ""); await renderHandler(r, res); return; }
    const m = u.pathname.match(/^\/mcp\/([^/]+)$/); if (m) { r.url = "/api/mcp?access=" + encodeURIComponent(m[1]); }
    else if (u.pathname === "/mcp") r.url = "/api/mcp" + u.search;
    await handler(r, res);
  });
}).listen(port, () => console.log(`[mcp] http://localhost:${port}/mcp  (DS_BASE=${process.env.DS_BASE || "배포 사이트"})`));
