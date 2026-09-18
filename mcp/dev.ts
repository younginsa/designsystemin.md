// 로컬 HTTP 실행(선택) — Vercel 없이 http://localhost:8787/mcp 로 띄운다. DS_MCP_ACCESS 필수.
import { createServer as httpServer } from "node:http";

import handler from "./api/mcp.js";

const port = Number(process.env.PORT || 8787);
httpServer(async (req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", async () => {
    const r: any = req; r.body = raw ? JSON.parse(raw) : undefined;
    const u = new URL(req.url ?? "/", "http://x");
    const m = u.pathname.match(/^\/mcp\/([^/]+)$/); if (m) { r.url = "/api/mcp?access=" + encodeURIComponent(m[1]); }
    else if (u.pathname === "/mcp") r.url = "/api/mcp" + u.search;
    await handler(r, res);
  });
}).listen(port, () => console.log(`[mcp] http://localhost:${port}/mcp  (DS_BASE=${process.env.DS_BASE || "배포 사이트"})`));
