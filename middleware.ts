// /gallery 이하 서버 측 잠금 (Vercel Routing Middleware, 2026-10-09)
//
// 배경: 허브의 비밀번호는 스크린샷(.enc)만 암호화한다. 갤러리 실물 라우트
// (/gallery/<slug>/…)는 정적 HTML이라 주소를 직접 치면 비밀번호 없이 그대로 내려갔다.
// 이 파일은 정적 파일이 응답되기 전에 실행되어, 인증 쿠키가 없으면 내용을 보내지 않는다.
//
// - 비밀번호는 Vercel 환경변수 GALLERY_PASSWORD 에서만 읽는다(코드·번들에 없음).
//   허브 잠금 해제와 한 번에 풀리게 하려면 스크린샷 암호화 비밀번호와 같은 값으로 둔다.
// - 환경변수가 없으면 열지 않는다(fail-closed) — 503.
// - 쿠키 값은 비밀번호의 SHA-256 파생값이다. 비밀번호를 바꾸면 기존 쿠키는 전부 무효가 된다.
// - 범위는 matcher 가 정한다. 허브(/)·스토리북(/storybook)·MCP 산출물은 건드리지 않는다.

export const config = {
  matcher: ["/gallery", "/gallery/:path*", "/gallery-unlock"],
};

const COOKIE = "ds_gallery";
const MAX_AGE = 60 * 60 * 24 * 7; // 7일
const UNLOCK_PATH = "/gallery-unlock";

async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode("ds-gallery-v1:" + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// 길이·내용 차이가 응답 시간으로 새지 않게 비교한다.
function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function readCookie(request: Request, name: string): string {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

// 열린 리다이렉트 방지 — 갤러리 내부 경로만 허용.
function safeNext(value: string | null): string {
  if (value && value.startsWith("/gallery/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return "/";
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function lockPage(next: string, status: number, message = ""): Response {
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>잠긴 화면</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
    font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  form { width: min(320px, calc(100vw - 32px)); display: grid; gap: 12px; }
  h1 { margin: 0; font-size: 16px; font-weight: 600; }
  p { margin: 0; opacity: .7; }
  input, button { font: inherit; padding: 10px 12px; border-radius: 8px; border: 1px solid #8884; }
  button { cursor: pointer; font-weight: 600; }
  .err { color: #c0392b; opacity: 1; }
</style>
</head>
<body>
<form method="post" action="${UNLOCK_PATH}">
  <h1>잠긴 화면입니다</h1>
  <p>이 화면은 비밀번호가 있어야 볼 수 있습니다.</p>
  ${message ? `<p class="err">${escapeHtml(message)}</p>` : ""}
  <input type="hidden" name="next" value="${escapeHtml(next)}">
  <input type="password" name="password" placeholder="비밀번호" autocomplete="current-password" autofocus required>
  <button type="submit">열기</button>
</form>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const password = process.env.GALLERY_PASSWORD || "";

  if (!password) {
    return new Response("Gallery is locked: GALLERY_PASSWORD is not configured.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store" },
    });
  }

  const expected = await tokenFor(password);

  // 잠금 해제 엔드포인트 — 잠금 화면의 폼(HTML)과 허브의 fetch(JSON) 둘 다 여기로 온다.
  if (url.pathname === UNLOCK_PATH || url.pathname === UNLOCK_PATH + "/") {
    if (request.method !== "POST") return lockPage("/", 200);

    const wantsJson = (request.headers.get("accept") || "").includes("application/json");
    let submitted = "";
    let next = "/";
    try {
      const form = await request.formData();
      submitted = String(form.get("password") || "");
      next = safeNext(form.get("next") as string | null);
    } catch {
      // 본문을 읽지 못하면 틀린 비밀번호로 취급한다.
    }

    if (!safeEqual(await tokenFor(submitted), expected)) {
      if (wantsJson) {
        return new Response(JSON.stringify({ ok: false }), {
          status: 401,
          headers: { "content-type": "application/json", "cache-control": "private, no-store" },
        });
      }
      return lockPage(next, 401, "비밀번호가 올바르지 않습니다.");
    }

    const cookie = `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
    if (wantsJson) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json", "cache-control": "private, no-store", "set-cookie": cookie },
      });
    }
    return new Response(null, {
      status: 303,
      headers: { location: next, "cache-control": "private, no-store", "set-cookie": cookie },
    });
  }

  // /gallery 이하 — 쿠키가 맞으면 정적 파일로 통과시킨다.
  if (safeEqual(readCookie(request, COOKIE), expected)) {
    return new Response(null, { headers: { "x-middleware-next": "1" } });
  }

  return lockPage(safeNext(url.pathname + url.search), 401);
}
