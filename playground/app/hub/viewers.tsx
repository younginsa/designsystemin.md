"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// 허브 뷰어 — 사용법·갤러리(대표 화면 목록 + 미리보기).
// 팔레트·시맨틱·타이포·Control 표 렌더러는 2026-09-16 은퇴 — Storybook Foundations 가 같은 dstk JSON 을 렌더한다.

import * as React from "react";

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
