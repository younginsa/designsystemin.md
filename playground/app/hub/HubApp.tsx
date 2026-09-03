"use client";

// 허브 셸 — 구 playground/public/index.html의 React 포트 (2026-08-26 실렌더 전환).
// 구조·클래스·동작은 원본과 동일하게 유지한다:
//   내비 탭(HINAS DS·365) → 좌측 레일(패널 목록) → 본문 패널 → 우측 시각 컬럼.
// 산문 패널은 fragments/*.html(원본에서 추출)을 주입하고, 컴포넌트 채택·365 DS 패널만
// React로 다시 그렸다(카드 = 실물 렌더). 딥링크 해시(#adopt 등)도 원본과 동일.

import * as React from "react";

import { AdoptPanel, AdoptRail, useAdoption, useHubData } from "./adopt";
import { CatalogPanel } from "./catalog";
import { Lockbar, hydrateFragments, useScreens } from "./screens";
import { useDsViewers, useGallery } from "./viewers";

type DocKey = "hinas" | "d365";

type HistEntry = { date: string; summary: string; html: string };

// 365 탭 스탬프는 최신 히스토리 항목에서 파생한다(아래 stampOf) — 하드코딩 날짜가
// '마지막 업데이트'처럼 읽히던 문제(2026-08-26). HINAS DS 탭은 실제 문서 승인일이라 고정.
const META: Record<DocKey, { label: string; stamp: string }> = {
  hinas: { label: "Contents", stamp: "2026-07-29 · 승인됨" },
  d365: { label: "365", stamp: "" },
};

const DEEP_LINKS: Record<string, [DocKey, string]> = {
  "#templates": ["d365", "페이지 템플릿"],
  "#usage365": ["d365", "프론트 연동"],
  "#adopt": ["d365", "컴포넌트 채택"],
  "#ds365": ["d365", "365 DS"],
  "#history": ["d365", "히스토리"],
  "#pipeline": ["hinas", "공통 DS"],
  "#resources": ["hinas", "Resources"],
};

const pad = (n: number) => String(n + 1).padStart(2, "0");

// 산문 프래그먼트 — props가 완전히 정적인 memo 컴포넌트라 리렌더가 절대 닿지 않는다.
// 중요: 뷰어·갤러리 스크립트가 이 서브트리를 직접 변형(innerHTML)하는데, React가
// dangerouslySetInnerHTML을 다시 적용하는 순간 전부 초기화된다(원인 규명 2026-08-26).
// 가시성은 바깥 .pwrap 래퍼가 담당한다 — 이 엘리먼트의 prop은 영원히 안 바뀐다.
const FragSec = React.memo(function FragSec({ html }: { html: string }) {
  return <section className="panel on hubdoc" dangerouslySetInnerHTML={{ __html: html }} />;
});

export default function HubApp({ fragments, hist, shotNames }: {
  fragments: { usage: string; pipeline: string; resources: string; templates: string; usage365: string };
  hist: HistEntry[];
  shotNames: string[];
}) {
  const [doc, setDoc] = React.useState<DocKey>("hinas");
  const [sel, setSel] = React.useState(0);
  const [histIdx, setHistIdx] = React.useState(0);
  const [dsnavSec, setDsnavSec] = React.useState("pipeline");
  const [stack, setStack] = React.useState<{ title: string; names: string[] } | null>(null);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const [live, setLive] = React.useState<string | null>(null); // 실물 팝업 — /generated/<slug>/ iframe
  const [flash, setFlash] = React.useState<string | null>(null);

  const { urls, unlocked, unlock } = useScreens(shotNames);
  const { approvedFile, ds365File } = useHubData();
  const rebuilt = React.useMemo(
    () => Object.keys(ds365File?.components ?? {}).filter((k) => ds365File!.components[k].build === "done"),
    [ds365File],
  );
  const adoption = useAdoption(approvedFile, rebuilt);

  useDsViewers();
  useGallery();

  const PANELS: Record<DocKey, Array<{ title: string; visual?: "adopt" | "dsnav" | "stack" }>> = {
    hinas: [
      { title: "사용방법" },
      { title: "공통 DS", visual: "dsnav" },
      { title: "Resources" },
    ],
    d365: [
      { title: "컴포넌트 채택", visual: "adopt" },
      { title: "365 DS" },
      { title: "페이지 템플릿" },
      { title: "프론트 연동" },
      { title: "히스토리", visual: "stack" },
    ],
  };

  const panels = PANELS[doc];
  const panel = panels[sel];
  const isAdopt = panel.title === "컴포넌트 채택";
  const isDsnav = panel.title === "공통 DS";
  const isHist = panel.title === "히스토리";
  const hasVisual = panel.visual !== undefined;

  const select = (i: number) => { setSel(i); setStack(null); window.scrollTo(0, 0); };
  const switchDoc = (k: DocKey) => { setDoc(k); setSel(0); setStack(null); window.scrollTo(0, 0); };

  /* 딥링크 — 원본과 동일한 해시 */
  React.useEffect(() => {
    // #code=<슬러그> — 코드 드로어 딥링크: 365 탭 · 02 패널로 전환(드로어는 CatalogPanel이 연다)
    if (/^#code=[\w-]+$/.test(location.hash)) { setDoc("d365"); setSel(1); return; }
    const target = DEEP_LINKS[location.hash];
    if (!target) return;
    const idx = PANELS[target[0]].findIndex((p) => p.title === target[1]);
    if (idx >= 0) { setDoc(target[0]); setSel(idx); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 주입 프래그먼트 하이드레이션 — 잠금 해제·패널 전환 후 재실행(멱등) */
  React.useEffect(() => { hydrateFragments(urls); }, [urls, doc, sel, histIdx]);

  /* dsnav 섹션 토글 — pipeline 프래그먼트 내부 DOM */
  React.useEffect(() => {
    document.querySelectorAll<HTMLElement>(".dsnav-sec").forEach((s) => {
      s.style.display = s.dataset.sec === dsnavSec ? "" : "none";
    });
  }, [dsnavSec, doc, sel]);

  /* 문서 레벨 리스너 — rowlink 스택 · 라이트박스 · 365 탭 점프 · Escape */
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const open365 = t.closest("#dsnav-open-365");
      if (open365) { e.preventDefault(); switchDoc("d365"); return; }
      const lc = t.closest(".livecut") as HTMLElement | null;
      if (lc && lc.dataset.live) { setLive(lc.dataset.live); return; }
      const r = t.closest(".rowlink") as HTMLElement | null;
      if (r) {
        setStack({
          names: (r.dataset.shots || "").split(","),
          title: (r.querySelector("td")?.textContent || "").trim(),
        });
        return;
      }
      if (t.classList.contains("stack-img")) { setLightbox((t as HTMLImageElement).src); return; }
      const sc = t.closest(".shot, .cut") as HTMLElement | null;
      if (sc && sc.dataset.shot && urls[sc.dataset.shot]) setLightbox(urls[sc.dataset.shot]);
    };
    const onKey = (e: KeyboardEvent) => { if (e.code === "Escape") { setLightbox(null); setLive(null); } };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls]);

  const jumpToCard = (slug: string) => {
    document.querySelector(`#doc-365 [data-comp="${slug}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(slug);
    setTimeout(() => setFlash(null), 1400);
  };

  const shellClass =
    "shell" +
    (hasVisual ? " wide-visual" : "") +
    (isAdopt ? " adopt-visual" : "") +
    (isDsnav ? " dsnav-visual" : "");

  return (
    <div className="hub-root">
      <div className="nav">
        <span className={"item" + (doc === "hinas" ? " on" : "")} onClick={() => switchDoc("hinas")}>HINAS DS</span>
        <span className={"item" + (doc === "d365" ? " on" : "")} onClick={() => switchDoc("d365")}>365</span>
        <span className="item off">CLOUD</span>
        <span className="item off">CONTROL</span>
        <span className="sp"></span>
        <span className="stamp">
          {doc === "d365" && hist[0]
            ? `${hist[0].date} · ${hist[0].summary.split(" — ")[0]}`
            : META[doc].stamp}
        </span>
      </div>

      <div className={shellClass}>
        <aside className="rail">
          <div className="strip"><span>{META[doc].label}</span><span className="sub">{panels.length}</span></div>
          <div className="list">
            {panels.map((p, i) => (
              <button key={p.title} className={i === sel ? "on" : ""} onClick={() => select(i)}>
                <span className="num">{pad(i)}</span>
                <span className="grow">{p.title}</span>
                <span className="hchev"></span>
              </button>
            ))}
          </div>
        </aside>

        <div className="maincol">
          <div className="strip">
            <span style={{ display: isHist ? "none" : "" }}>{panel.title}</span>
            {isHist ? (
              <select id="hist-select" value={histIdx} onChange={(e) => setHistIdx(Number(e.target.value))} style={{ display: "" }}>
                {hist.map((h, i) => (
                  <option key={h.date} value={i}>{h.date} — {h.summary}</option>
                ))}
              </select>
            ) : null}
            <span className="sub">{pad(sel)}</span>
          </div>
          <div className="content full">
            <div className="doc" id="doc-hinas" style={{ display: doc === "hinas" ? "" : "none" }}>
              <div className={"pwrap" + (doc === "hinas" && sel === 0 ? " on" : "")}>
                <FragSec html={fragments.usage} />
              </div>
              <div className={"pwrap" + (doc === "hinas" && sel === 1 ? " on" : "")}>
                <FragSec html={fragments.pipeline} />
              </div>
              <div className={"pwrap" + (doc === "hinas" && sel === 2 ? " on" : "")}>
                <FragSec html={fragments.resources} />
              </div>
            </div>
            <div className="doc" id="doc-365" style={{ display: doc === "d365" ? "" : "none" }}>
              <Lockbar unlocked={unlocked} unlock={unlock} />
              <section className={"panel hubdoc" + (doc === "d365" && sel === 0 ? " on" : "")}>
                <AdoptPanel urls={urls} adoption={adoption} flash={flash} />
              </section>
              <section className={"panel hubdoc" + (doc === "d365" && sel === 1 ? " on" : "")}>
                <CatalogPanel approvals={adoption} ds365={ds365File} urls={urls} />
              </section>
              <div className={"pwrap" + (doc === "d365" && sel === 2 ? " on" : "")}>
                <FragSec html={fragments.templates} />
              </div>
              <div className={"pwrap" + (doc === "d365" && sel === 3 ? " on" : "")}>
                <FragSec html={fragments.usage365} />
              </div>
              <section className={"panel hubdoc" + (doc === "d365" && sel === 4 ? " on" : "")}>
                {hist.map((h, i) => (
                  <div
                    key={h.date}
                    className="hist-entry"
                    style={{ display: i === histIdx ? "" : "none" }}
                    dangerouslySetInnerHTML={{ __html: h.html }}
                  />
                ))}
              </section>
            </div>
          </div>
        </div>

        {hasVisual ? (
          <aside className="visual">
            <div className="strip">
              <span>{isAdopt || isDsnav ? "" : stack ? stack.title : "Visual"}</span>
              <span className="sub">{isAdopt || isDsnav ? "" : stack ? stack.names.length + "장" : "준비 중"}</span>
              {isAdopt ? (
                <span style={{ marginLeft: "auto" }}>
                  <button type="button" className="chip" onClick={adoption.exportApproved}>approved.json 내보내기</button>
                </span>
              ) : null}
            </div>
            {isAdopt ? (
              <AdoptRail adoption={adoption} onJump={jumpToCard} />
            ) : isDsnav ? (
              <div id="visual-dsnav" style={{ display: "flex" }}>
                {([
                  ["pipeline", "파이프라인", false],
                  ["common", "Design system", false],
                  ["palette", "팔레트", true],
                  ["semantic", "시맨틱", true],
                  ["typo", "타이포", true],
                  ["d365", "365", false],
                  ["cloud", "Cloud", false],
                  ["control", "Control", false],
                ] as Array<[string, string, boolean]>).map(([sec, label, sub]) => (
                  <button
                    key={sec}
                    type="button"
                    className={"dn-item" + (sub ? " sub" : "") + (dsnavSec === sec ? " on" : "")}
                    onClick={() => { setDsnavSec(sec); window.scrollTo(0, 0); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : stack ? (
              <div className="vstack">
                {stack.names.map((n) =>
                  urls[n]
                    ? <img key={n} src={urls[n]} className="stack-img" alt="" />
                    : <div key={n} className="stack-locked">잠김 — 상단에서 비밀번호를 해제하세요</div>,
                )}
              </div>
            ) : (
              <div>
                <div className="frame"><span className="lb">PLACEHOLDER</span><span className="cap">행을 클릭하면 화면이 표시됩니다</span></div>
              </div>
            )}
          </aside>
        ) : null}
      </div>

      <div className={"lightbox" + (lightbox ? " on" : "")} onClick={() => setLightbox(null)}>
        {lightbox ? <img src={lightbox} alt="" /> : null}
      </div>

      <div className={"livebox" + (live ? " on" : "")} onClick={() => setLive(null)}>
        {live ? (
          <div className="frame-wrap" onClick={(e) => e.stopPropagation()}>
            <div className="bar">
              <span className="mono">/generated/{live}/</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <a className="chip" href={"/generated/" + live + "/"} target="_blank" rel="noopener">새 탭에서 열기</a>
                <button type="button" className="chip" onClick={() => setLive(null)}>닫기</button>
              </span>
            </div>
            <iframe src={"/generated/" + live + "/"} title="실물 미리보기" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
