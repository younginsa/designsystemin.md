// Vercel 함수 — Streamable HTTP(무상태·JSON 응답) MCP 엔드포인트. 요청마다 서버·전송 인스턴스를 새로 만든다.
// 접근 통제: 공유 값 DS_MCP_ACCESS(Vercel 환경변수) — 헤더 x-ds-access 또는 경로 /mcp/<값>(claude.ai 커넥터가 헤더를 못 붙일 때).
import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createServer } from "../src/server.js";

type Req = IncomingMessage & { body?: unknown; query?: Record<string, string | string[]> };

export default async function handler(req: Req, res: ServerResponse) {
  const expected = process.env.DS_MCP_ACCESS;
  if (!expected) { res.statusCode = 503; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ error: "DS_MCP_ACCESS 미설정 — Vercel 환경변수에 공유 값을 넣어야 열린다" })); return; }
  const url = new URL(req.url ?? "/", "http://x");
  const given = (req.headers["x-ds-access"] as string | undefined) ?? url.searchParams.get("access") ?? (Array.isArray(req.query?.access) ? req.query?.access[0] : req.query?.access);
  if (given !== expected) { res.statusCode = 401; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ error: "접근 거부 — x-ds-access 헤더 또는 /mcp/<값> 경로" })); return; }
  if (req.method !== "POST") { res.statusCode = 405; res.setHeader("allow", "POST"); res.end("MCP Streamable HTTP — POST only (stateless)"); return; }
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { transport.close(); server.close(); });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
