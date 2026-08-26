"use client";

// 암호화 스크린샷 시스템 — 구 index.html 스크립트의 포트.
// 복호화 결과(urls)는 두 경로로 소비된다:
//   ① React 카드 — <Shot>·<HoverCut> 컴포넌트 (data-react 표식)
//   ② 주입 프래그먼트(히스토리 표·템플릿 와이어) — hydrateFragments()가 DOM으로 채움
// 비밀번호는 sessionStorage(ds365pw)로만 유지 — 원본과 동일.

import * as React from "react";

const SALT = new TextEncoder().encode("hinas-ds-2026");
const ITERS = 120000;

async function makeAesKey(pw: string) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: ITERS, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"],
  );
}

async function decryptOne(k: CryptoKey, name: string) {
  const buf = await (await fetch("/screens/" + name + ".jpg.enc")).arrayBuffer();
  const iv = new Uint8Array(buf.slice(0, 12));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, k, buf.slice(12));
  return URL.createObjectURL(new Blob([plain], { type: "image/jpeg" }));
}

export function useScreens(names: string[]) {
  const [urls, setUrls] = React.useState<Record<string, string>>({});
  const [unlocked, setUnlocked] = React.useState(false);

  const unlock = React.useCallback(async (pw: string) => {
    try {
      const k = await makeAesKey(pw);
      const first = await decryptOne(k, names[0]);
      sessionStorage.setItem("ds365pw", pw);
      const rest = await Promise.all(names.slice(1).map(async (n) => [n, await decryptOne(k, n)] as const));
      setUrls({ [names[0]]: first, ...Object.fromEntries(rest) });
      setUnlocked(true);
      return true;
    } catch {
      return false;
    }
  }, [names]);

  React.useEffect(() => {
    const saved = sessionStorage.getItem("ds365pw");
    if (saved) void unlock(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { urls, unlocked, unlock };
}

/* ── 주입 프래그먼트 하이드레이션 (원본 hydrate() 포트) ── */

export function hydrateFragments(urls: Record<string, string>) {
  document.querySelectorAll<HTMLElement>(".shot[data-shot]:not([data-react])").forEach((el) => {
    if (el.firstChild || !urls[el.dataset.shot!]) return;
    const img = new Image();
    img.src = urls[el.dataset.shot!];
    el.appendChild(img);
  });
  document.querySelectorAll<HTMLElement>(".cut.hovercut[data-shot]:not([data-react])").forEach((el) => {
    if (el.firstChild || !urls[el.dataset.shot!]) return;
    const p = el.dataset.crop!.split(",").map(Number);
    const x = p[0], y = p[1], w = p[2], h = p[3];
    const win = document.createElement("div");
    win.className = "cropwin";
    win.style.aspectRatio = w + " / " + h;
    if (w / h >= 16 / 9) win.style.width = "86%"; else win.style.height = "86%";
    const img = new Image();
    img.src = urls[el.dataset.shot!];
    img.style.width = (1920 / w) * 100 + "%";
    img.style.height = (1080 / h) * 100 + "%";
    img.style.transform = "translate(" + (-x / 1920) * 100 + "%," + (-y / 1080) * 100 + "%)";
    win.appendChild(img);
    el.appendChild(win);
    el.classList.add("ready");
  });
  document.querySelectorAll<HTMLElement>(".cut[data-shot]:not(.hovercut):not([data-react])").forEach((el) => {
    if (el.firstChild || !urls[el.dataset.shot!]) return;
    const parts = el.dataset.crop!.split(",").map(Number);
    const x = parts[0], y = parts[1], w = parts[2], h = parts[3];
    const W = 280, sc = W / w;
    el.style.height = Math.round(h * sc) + "px";
    const img = new Image();
    img.src = urls[el.dataset.shot!];
    img.style.width = Math.round(1920 * sc) + "px";
    img.style.transform = "translate(" + -Math.round(x * sc) + "px," + -Math.round(y * sc) + "px)";
    el.appendChild(img);
  });
}

/* ── React 쪽 소비 컴포넌트 ── */

export function Shot({ name, urls }: { name: string; urls: Record<string, string> }) {
  return (
    <span className="shot" data-shot={name} data-react>
      {urls[name] ? <img src={urls[name]} alt="" /> : null}
    </span>
  );
}

export function HoverCut({ shot, crop, urls }: { shot: string; crop: string; urls: Record<string, string> }) {
  const u = urls[shot];
  if (!u) return <span className="cut hovercut" data-shot={shot} data-react />;
  const [x, y, w, h] = crop.split(",").map(Number);
  const winStyle: React.CSSProperties = { aspectRatio: `${w} / ${h}` };
  if (w / h >= 16 / 9) winStyle.width = "86%"; else winStyle.height = "86%";
  return (
    <span className="cut hovercut ready" data-shot={shot} data-react>
      <span className="cropwin" style={{ ...winStyle, display: "block" }}>
        <img
          src={u}
          alt=""
          style={{
            width: (1920 / w) * 100 + "%",
            height: (1080 / h) * 100 + "%",
            transform: `translate(${(-x / 1920) * 100}%, ${(-y / 1080) * 100}%)`,
          }}
        />
      </span>
    </span>
  );
}

export function Lockbar({ unlocked, unlock }: { unlocked: boolean; unlock: (pw: string) => Promise<boolean> }) {
  const [pw, setPw] = React.useState("");
  const [msg, setMsg] = React.useState("스크린샷은 암호화되어 있습니다. 비밀번호를 입력하면 이 페이지의 모든 썸네일·줌 컷이 열립니다.");
  const go = async () => {
    setMsg("해제 중…");
    const ok = await unlock(pw);
    if (!ok) setMsg("비밀번호가 올바르지 않습니다.");
  };
  return (
    <div className={"lockbar" + (unlocked ? " ok" : "")}>
      <input
        type="password"
        placeholder="비밀번호"
        autoComplete="off"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") void go(); }}
      />
      <button onClick={() => void go()}>시각 자료 잠금 해제</button>
      <span className="msg">{msg}</span>
    </div>
  );
}
