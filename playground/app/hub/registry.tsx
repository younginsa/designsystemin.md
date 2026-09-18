"use client";

// Storybook 컴포넌트 패널 — ds-registry.json(단일 원천)의 읽기 전용 뷰(2026-09-15).
// 종전 「컴포넌트 채택」(approved.json 토글)을 대체한다 — 채택·은퇴는 레지스트리 status 를 고치고 pnpm registry.
// 섹션 = 피그마 Component 페이지 섹션 순서, 행 = 스토리 파일 1개. 피그마 링크는 세트 node-id 딥링크.

import * as React from "react";

export type FigmaRef = { id: string; name: string; variants: number };
export type Entry = {
  name: { ko: string; en: string };
  status: "adopted" | "primitive" | "retired";
  role?: string;
  section: string;
  stories: string | null;
  file: string;
  aliases: { slug: string; name: string; files: string[]; approved: boolean }[];
  coveredBy: string[];
  hub: { slug: string; group: string; name: string; shadcn: string | null; prio: string | null }[];
  figma: FigmaRef[];
  note: string | null;
};
export type Registry = { fileKey: string; updated: string; components: Record<string, Entry> };

/** 스토리 docs 딥링크 — Storybook id 는 제목 "DS/<Pascal>" 의 소문자(sonner 파일의 제목은 Toaster) */
export const storybookDocsUrl = (key: string) => "/storybook/?path=/docs/ds-" + (key === "sonner" ? "toaster" : key.replace(/-/g, "")) + "--docs";
export const figmaNodeUrl = (fileKey: string, id: string) => `https://www.figma.com/design/${fileKey}/?node-id=${id.replace(":", "-")}`;

const SECTION_ORDER = ["Button", "FilterBar", "Form", "Data", "Overlay", "Feedback", "Navigation", "—"];
// status 표기(2026-09-16 새 모델): adopted = Storybook 에 있다 = DS · primitive = shadcn 대체 전용(스토리 없음) · retired = 은퇴
const STATUS_KO: Record<string, string> = { adopted: "Storybook", primitive: "shadcn 대체", retired: "은퇴" };

let cache: Promise<Registry | null> | null = null;
const load = () => (cache ??= fetch("/ds-registry.json").then((r) => (r.ok ? r.json() : null)).catch(() => null));

export function useRegistry() {
  const [reg, setReg] = React.useState<Registry | null>(null);
  React.useEffect(() => { let dead = false; load().then((r) => { if (!dead) setReg(r); }); return () => { dead = true; }; }, []);
  return reg;
}

const figmaUrl = figmaNodeUrl;

export function RegistryPanel() {
  const reg = useRegistry();
  if (!reg) return <p className="mono" style={{ color: "var(--doc-muted)" }}>ds-registry.json 로드 중…</p>;
  const entries = Object.entries(reg.components);
  const bySection = new Map<string, [string, Entry][]>();
  for (const e of entries) { const s = e[1].section || "—"; if (!bySection.has(s)) bySection.set(s, []); bySection.get(s)!.push(e); }
  const sections = [...bySection.keys()].sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
  const counts = entries.reduce((a, [, e]) => ((a[e.status] = (a[e.status] || 0) + 1), a), {} as Record<string, number>);
  return (
    <>
      <h3>Storybook 컴포넌트 — 레지스트리 <span className="mono" style={{ fontSize: 12, color: "var(--doc-muted)" }}>ds-registry.json · {reg.updated}</span></h3>
      <p className="lead">
        컴포넌트의 <strong>단일 원천</strong>. 행 1개 = 스토리 파일 1개. <strong>Storybook 에 있는 것이 곧 DS</strong>다 — 파이프라인은
        레지스트리 → Storybook → 생성(없는 컴포넌트는 shadcn 으로 대체·표시하고 Jira DES 티켓 자동 발행) 세 단계.
        Storybook <strong>{counts.adopted || 0}</strong> · shadcn 대체 전용 <strong>{counts.primitive || 0}</strong> · 은퇴 <strong>{counts.retired || 0}</strong>.
        추가·은퇴는 레지스트리의 <span className="mono">status</span>를 고치고 <span className="mono">pnpm registry</span>로 approved.json·vocab-map.json 을 다시 만든다.
        보는 곳 = <a href="/storybook/" target="_blank" rel="noreferrer">Storybook</a>, 만드는 곳 = 피그마 Component 페이지(열의 딥링크).
      </p>
      {sections.map((sec) => (
        <React.Fragment key={sec}>
          <h4 style={{ marginTop: 28 }}>{sec === "—" ? "섹션 없음 (프리미티브 · 은퇴)" : sec}</h4>
          <table className="map-t">
            <thead><tr><th>이름</th><th>상태</th><th>스토리</th><th>피그마</th><th>어휘(구 슬러그)</th></tr></thead>
            <tbody>
              {bySection.get(sec)!.sort((a, b) => a[0].localeCompare(b[0])).map(([key, e]) => (
                <tr key={key}>
                  <td><span className="mono al">{key}</span><br /><span className="hx" style={{ fontSize: 12 }}>{e.name.ko}{e.name.ko !== e.name.en ? " · " + e.name.en : ""}</span></td>
                  <td><span className={"chip" + (e.status === "adopted" ? " approve on" : "")}>{STATUS_KO[e.status] || e.status}</span></td>
                  <td className="mono hx" style={{ fontSize: 12 }}>{e.stories ? e.stories.replace("components/src/ui/", "") : "—"}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {e.figma.length ? e.figma.map((f) => (
                      <span key={f.id} style={{ display: "block" }}>
                        <a href={figmaUrl(reg.fileKey, f.id)} target="_blank" rel="noreferrer">{f.name}</a>
                        <span className="hx"> · {f.variants}</span>
                      </span>
                    )) : <span className="hx">—</span>}
                  </td>
                  <td className="mono hx" style={{ fontSize: 12 }}>
                    {e.aliases.map((a) => a.slug).join(" · ") || (e.coveredBy.length ? "(" + e.coveredBy.join(" · ") + " 안에서)" : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </React.Fragment>
      ))}
    </>
  );
}

/** 우측 레일 — 상태 집계 + 원천 링크 */
export function RegistryRail() {
  const reg = useRegistry();
  if (!reg) return null;
  const entries = Object.values(reg.components);
  const counts = entries.reduce((a, e) => ((a[e.status] = (a[e.status] || 0) + 1), a), {} as Record<string, number>);
  const sets = entries.reduce((a, e) => a + e.figma.length, 0);
  const variants = entries.reduce((a, e) => a + e.figma.reduce((b, f) => b + f.variants, 0), 0);
  return (
    <div className="kv" style={{ padding: "24px 28px", fontSize: 13 }}>
      <div className="k">항목</div><div className="v">{entries.length} (Storybook {counts.adopted || 0} · shadcn 대체 {counts.primitive || 0} · 은퇴 {counts.retired || 0})</div>
      <div className="k">피그마</div><div className="v">세트 {sets} · 변형 {variants} · <a href={`https://www.figma.com/design/${reg.fileKey}/`} target="_blank" rel="noreferrer">Component 페이지</a></div>
      <div className="k">원천</div><div className="v mono">playground/public/ds-registry.json</div>
      <div className="k">파생</div><div className="v mono">approved.json · vocab-map.json ← pnpm registry</div>
      <div className="k">피그마 갭</div><div className="v mono">pnpm registry --figma-gap — 주간, 저장소 → 피그마 한 방향</div>
    </div>
  );
}
