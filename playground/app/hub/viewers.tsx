"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// 허브 뷰어 — 팔레트(모드 토글)·시맨틱 표·타이포 표·Control 토큰·Theme 대조표.
// 구 index.html 스크립트의 거의 그대로의 포트 — 주입된 pipeline 프래그먼트의
// 마운트 지점(#pal-grid 등)에 innerHTML로 그린다. 원천: /dstk/*.json (ds:build가 복사).

import * as React from "react";

// dstk JSON은 모듈 레벨 캐시 — StrictMode 재마운트로 이펙트가 두 번 돌아도 fetch는 1회
let dstkCache: Promise<any[]> | null = null;
const loadDstk = () => (dstkCache ??= Promise.all([
  fetch("/dstk/palette.json").then((r) => r.json()),
  fetch("/dstk/semantic.json").then((r) => r.json()),
  fetch("/dstk/typography.json").then((r) => r.json()),
  fetch("/dstk/products/control.json").then((r) => r.json()),
  fetch("/dstk/theme-map.json").then((r) => r.ok ? r.json() : null).catch(() => null),
  // 틴트 7종은 스냅샷에만 있다(Theme 컬렉션 Tint 그룹) — 대조표 아래쪽 Tint 행의 원천
  fetch("/dstk/figma-theme-snapshot.json").then((r) => r.ok ? r.json() : null).catch(() => null),
]));

export function useDsViewers() {
  React.useEffect(() => {
    // 재마운트마다 전체 재실행 — 렌더 함수는 innerHTML 덮어쓰기라 멱등이다.
    // (ran 가드를 쓰면 StrictMode가 프래그먼트 DOM을 재생성한 뒤 아무도 다시 안 그린다)
    const palGrid = document.getElementById("pal-grid");
    if (!palGrid) return;
    let dead = false;

    const MODES = ["day", "dusk", "night"] as const;
    const LABEL: Record<string, string> = { day: "Day", dusk: "Dusk", night: "Night" };
    let pal: any = null, sem: any = null, typo: any = null, ctl: any = null;
    let mode: string = "day";

    const LIGHT_OF: Record<string, string> = { light: "day", dark: "dusk", control: "dusk" };
    function resolveRef(ref: string, m: string): string | null {
      const mm = /^\{palette\.([^}@]+)(?:@(day|dusk|night))?\}$/.exec(ref);
      if (!mm) return null;
      const lighting = mm[2] || LIGHT_OF[m] || m;
      const path = mm[1].split(".");
      let node: any = pal;
      for (let i = 0; i < path.length; i++) {
        const k = path[i];
        if (k === "anchor" && i === path.length - 1) { node = node[pal.$anchor[lighting]]; break; }
        node = node && node[k];
      }
      const v = node && node.$value;
      return typeof v === "string" ? v : (v ? v[lighting] : null);
    }

    function renderPal() {
      document.getElementById("pal-modes")!.innerHTML = MODES.map((m) =>
        '<button type="button" class="chip' + (m === mode ? " on" : "") + '" data-m="' + m + '">' + LABEL[m] + "</button>").join("");
      const anchor = pal.$anchor[mode];
      const fams = Object.keys(pal).filter((k) => !k.startsWith("$"));
      palGrid!.innerHTML = fams.map((fam) => {
        if (fam === "basic") {
          const tones = Object.keys(pal.basic).filter((k) => !k.startsWith("$"));
          return '<div class="pal-fam"><div class="pf-name">basic — 모드 무관 (100% + 불투명도 단계)</div>' +
            tones.map((t) => '<div class="pal-row">' + Object.keys(pal.basic[t]).filter((k) => !k.startsWith("$")).map((s) =>
              '<div class="pal-chip"><div class="swatch" style="background:' + pal.basic[t][s].$value + '"></div><div class="cap"><span>' + t + "-" + s + "</span></div></div>").join("") + "</div>").join("") + "</div>";
        }
        const steps = Object.keys(pal[fam]).filter((k) => !k.startsWith("$"));
        return '<div class="pal-fam" data-fam="' + fam + '"><div class="pf-name">' + fam + '</div><div class="pal-row">' +
          steps.map((s) => {
            const v0 = pal[fam][s].$value;
            const v = typeof v0 === "string" ? v0 : v0[mode];
            if (v === undefined) return "";
            const todo = v === "TODO";
            const isA = fam !== "gray" && s === anchor;
            return '<div class="pal-chip"><div class="swatch' + (todo ? " todo" : "") + '"' + (todo ? "" : ' style="background:' + v + '"') + ">" +
              (isA ? '<span class="anch">★</span>' : "") + '</div><div class="cap"><span>' + s + "</span><span>" + (todo ? "TODO" : v) + "</span></div></div>";
          }).join("") + "</div></div>";
      }).join("");
    }

    // 시맨틱 표 = 대조표 한 장(2026-09-15 병합 — 종전 「공통 시맨틱」 + Design system 「Theme × dstk 대조표」 두 표).
    // 이름 = dstk 토큰(= Tailwind 클래스, 피그마 폴더 General/… 제거) · 모드 셀 = 12px 스와치 + 팔레트 칩 이름(mono) + hex ·
    // 비고 = 피그마 그룹(Tint · Chart · Product)·번들(card · popover)·주석. 원천 theme-map.json(스냅샷, ds:build 대조 검증) +
    // Theme 밖 dstk 토큰(extras: 상태 축·램프·비색상)은 같은 표 아래쪽에 semantic.json 해석값으로 이어 붙인다.
    function renderSem(map: any, tints?: any[] | null) {
      const box = document.getElementById("sem-table");
      if (!box) return;
      const SMODES = ["light", "dark", "control"];
      const shortName = (theme: string) => theme.replace(/^(General|Tint|Chart|Product)\//, "");
      const groupOf = (theme: string) => (theme.match(/^(Tint|Chart|Product)\//) || [])[1] || "";
      const chipName = (a: string | null) => a ? a.replace(" mode/", " ").replace("Basic Foreground/", "") : "(고유값)";
      const swatchCell = (hex: string, label: string) =>
        '<td><span class="map-sw" style="background:' + hex + '"></span><span class="mono cellblock"><span class="al">' + label + '</span><br><span class="hx">' + hex + "</span></span></td>";
      const dash = '<td><span class="mono" style="color:var(--doc-muted)">—</span></td>';
      let rows = "";
      if (map && map.rows) {
        rows += map.rows.map((r: any) => {
          const tokens: string[] = r.tokens || [];
          const name = tokens[0] || shortName(r.theme);
          const note = [groupOf(r.theme), tokens.length > 1 ? tokens.slice(1).join(" · ") + " 번들" : "", r.note || ""].filter(Boolean).join(" · ");
          return '<tr><td class="mono al">' + name + "</td>" + swatchCell(r.light.hex, chipName(r.light.alias)) + swatchCell(r.dark.hex, chipName(r.dark.alias)) + swatchCell(r.control.hex, chipName(r.control.alias)) +
            '<td class="hx" style="font-size:12px">' + note + "</td></tr>";
        }).join("");
      }
      // Tint 7종(Theme 컬렉션 Tint 그룹) — 스와치는 원색 위 알파(rgba), 칩 이름 = 원색 시맨틱 + 알파
      const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; };
      rows += (tints || []).map((t: any) => {
        const name = t.class || t.name.replace(/^Tint\//, "");
        const base = name.replace(/\/\d+$/, "");
        const cells = SMODES.map((m) => { const v = t[m]; if (!v) return dash; const pct = Math.round(v.alpha * 100) + "%"; return '<td><span class="map-sw" style="background:' + rgba(v.hex, v.alpha) + '"></span><span class="mono cellblock"><span class="al">' + base + " " + pct + '</span><br><span class="hx">' + v.hex + " @" + pct + "</span></span></td>"; }).join("");
        return '<tr><td class="mono al">' + name + "</td>" + cells + '<td class="hx" style="font-size:12px">Tint · ' + t.name + "</td></tr>";
      }).join("");
      // Theme 밖 dstk 토큰 — 색이면 semantic.json 참조를 모드별로 해석해 같은 셀 문법, 아니면 참조 원문
      const clean = (r: string) => (r || "").replace("{palette.", "").replace("}", "");
      const extras: any[] = (map && map.extras) || [];
      rows += extras.map((e: any) => {
        const tok = sem && sem[e.name];
        if (tok && tok.$type === "color") {
          const val = tok.$value;
          const cells = SMODES.map((m) => { const ref = typeof val === "string" ? val : val[m]; const hex = ref ? resolveRef(ref, m) : null; return hex && hex !== "TODO" ? swatchCell(hex, clean(ref)) : dash; }).join("");
          return '<tr><td class="mono al">' + e.name + "</td>" + cells + '<td class="hx" style="font-size:12px">Theme 밖 · ' + (e.note || "") + "</td></tr>";
        }
        return '<tr><td class="mono al">' + e.name + '</td><td class="mono hx" colspan="3">' + e.ref + '</td><td class="hx" style="font-size:12px">Theme 밖 · ' + (e.note || "") + "</td></tr>";
      }).join("");
      box.innerHTML =
        '<table class="map-t map-main"><thead><tr><th>이름</th><th>Light (Cloud)</th><th>Dark (SVM·NAS)</th><th>Control</th><th>비고</th></tr></thead><tbody>' + rows + "</tbody></table>";
    }

    function renderTypo() {
      const rows = Object.entries(typo).filter(([k]) => !k.startsWith("$")).map(([name, tok]: [string, any]) => {
        const v = tok.$value;
        if (v === "TODO") return '<tr><td class="mono">' + name + '</td><td class="mono" style="color:var(--doc-muted)" colspan="2">실측 대기</td></tr>';
        // desktop-*: 행간 병기 + 피그마 제공 4무게 전부 명기(미리보기 전개는 안 함 — 대표 무게로만 렌더)
        const sz = v.size + (v.lineHeight ? "/" + v.lineHeight : "");
        const wt = name.startsWith("desktop-")
          ? '<span class="typo-w">regular(400)·medium(500)·semi bold(600)·bold(700)</span>'
          : (v.weight ? v.weight : "");
        const spec = sz + (wt ? " · " + wt : "") + (v.family ? " · " + v.family : "") + (tok.$note ? " (" + tok.$note + ")" : "");
        const fam = v.family === "mono" ? "var(--mono)" : "inherit";
        return '<tr><td class="mono">' + name + '</td><td class="mono">' + spec + "</td>" +
          '<td><span style="font-size:' + Math.min(parseInt(v.size, 10), 44) + "px;font-weight:" + (v.weight || 400) + ";font-family:" + fam + ';line-height:1.1">가나 Aa 09</span></td></tr>';
      }).join("");
      document.getElementById("typo-table")!.innerHTML =
        '<table class="typo-t"><thead><tr><th>토큰</th><th>스펙(4K px)</th><th>미리보기</th></tr></thead><tbody>' + rows + "</tbody></table>";
    }

    function renderCtl() {
      const el = document.getElementById("ctl-tokens");
      if (el && ctl && sem) {
        const parts: string[] = [];
        const dv = sem.destructive && (typeof sem.destructive.$value === "string" ? sem.destructive.$value : sem.destructive.$value.control);
        if (dv) parts.push('<span class="sem-sw" style="background:' + resolveRef(dv, "control") + '"></span><span class="mono">destructive(면) = ' + dv.replace("{palette.", "").replace("}", "") + " → " + resolveRef(dv, "control") + "</span>");
        if (ctl["destructive-accent"]) {
          const av = ctl["destructive-accent"].$value;
          parts.push('<span class="sem-sw" style="background:' + resolveRef(av, "control") + '"></span><span class="mono">destructive-accent(강조) = ' + av.replace("{palette.", "").replace("}", "") + " → " + resolveRef(av, "control") + "</span>");
        }
        el.innerHTML = parts.join("<br>");
      }
      const tv = document.getElementById("ctl-typo");
      if (tv && typo) tv.innerHTML = Object.entries(typo).filter(([k]) => !k.startsWith("$")).map(([k, t]: [string, any]) =>
        '<span class="mono">' + k + " = " + (t.$value === "TODO" ? "실측 대기" : t.$value.size) + "</span>").join(" · ");
    }

    const onPalClick = (e: Event) => {
      const b = (e.target as HTMLElement).closest("button[data-m]") as HTMLElement | null;
      if (!b) return;
      mode = b.dataset.m!;
      renderPal();
    };
    const palModes = document.getElementById("pal-modes")!;
    palModes.addEventListener("click", onPalClick);

    loadDstk().then(([p, s, t, c, map, snap]) => {
      pal = p; sem = s; typo = t; ctl = c;
      renderPal(); renderSem(map, snap && snap.tints); renderTypo(); renderCtl();
      const up = document.getElementById("theme-map-updated");
      if (up && map && map.updated) up.textContent = "· 마지막 업데이트 " + map.updated;
    }).catch(() => {
      if (!dead) palGrid.innerHTML = '<span class="mono" style="color:var(--doc-muted)">dstk/*.json 로드 실패 — ds:build 실행 여부 확인</span>';
    });

    return () => { dead = true; palModes.removeEventListener("click", onPalClick); };
  }, []);
}

/* 사용법·갤러리 — 대표 화면 목록 + 미리보기 (템플릿 프래그먼트의 #gen-list에 그린다) */
let pagesCache: Promise<any[]> | null = null;
const loadPages = () => (pagesCache ??= fetch("/generated/pages.json").then((r) => r.ok ? r.json() : []).catch(() => []));

export function useGallery() {
  React.useEffect(() => {
    const listBox = document.getElementById("gen-list");
    if (!listBox) return;
    let dead = false;
    loadPages().then((pages: any[]) => {
      if (dead || listBox.dataset.done) return;
      listBox.dataset.done = "1";
      if (!Array.isArray(pages) || !pages.length) {
        listBox.innerHTML = '<div class="gen-empty">아직 전시된 화면이 없다 — 세션에서 만든 화면 중 대표작을 디자이너가 등재한다.</div>';
        return;
      }
      pages.forEach((pg) => {
        const draft = pg.stage === "draft";
        const row = document.createElement("div");
        row.className = "gen-row";
        row.innerHTML = '<span class="t"></span><span class="chip stage"></span><span class="req"></span><span class="d"></span>';
        row.querySelector(".t")!.textContent = pg.title || pg.slug;
        const st = row.querySelector(".stage")!;
        st.textContent = draft ? "다듬는 중" : "완성";
        st.classList.toggle("p1", !draft);
        row.querySelector(".req")!.textContent = pg.requested || "";
        row.querySelector(".d")!.textContent = pg.created || "";
        row.addEventListener("click", () => {
          const url = "/generated/" + pg.slug + "/";
          (document.getElementById("gen-preview") as HTMLElement).style.display = "";
          document.getElementById("gen-prev-title")!.textContent = pg.title || pg.slug;
          (document.getElementById("gen-prev-open") as HTMLAnchorElement).href = url;
          (document.getElementById("gen-frame") as HTMLIFrameElement).src = url;
        });
        listBox.appendChild(row);
      });
    });
    return () => { dead = true; };
  }, []);
}
