"use client";

// DS 컴포넌트 패널 — ds-registry.json 의 읽기 전용 뷰.
// 2026-09-18: 채택 개념을 없앴다. 판정은 하나다 — **스토리가 있으면 DS, 없으면 부품.**
// 사람이 켜고 끄는 status 필드는 폐기(label 이 스토리가 있는데도 목록에서 빠져 있던 사고가 근거).
// 섹션 = 피그마 Component 페이지 섹션 순서, 행 = 컴포넌트 파일 1개. 피그마 링크는 세트 node-id 딥링크.

import * as React from "react";

export type FigmaRef = { id: string; name: string; variants: number; built?: string };
export type Entry = {
  name: { ko: string; en: string };
  section: string;
  stories: string | null; // 채워져 있으면 DS, 비어 있으면 부품
  file: string | null;
  figma: FigmaRef[];
  note: string | null;
};
export type Registry = { fileKey: string; updated: string; components: Record<string, Entry> };

/** 스토리 docs 딥링크 — Storybook id 는 제목 "DS/<Pascal>" 의 소문자(sonner 파일의 제목은 Toaster) */
export const storybookDocsUrl = (key: string) => "/storybook/?path=/docs/ds-" + (key === "sonner" ? "toaster" : key.replace(/-/g, "")) + "--docs";
export const figmaNodeUrl = (fileKey: string, id: string) => `https://www.figma.com/design/${fileKey}/?node-id=${id.replace(":", "-")}`;

const SECTION_ORDER = ["Button", "FilterBar", "Form", "Data", "Overlay", "Feedback", "Navigation", "—"];

let cache: Promise<Registry | null> | null = null;
const load = () => (cache ??= fetch("/ds-registry.json").then((r) => (r.ok ? r.json() : null)).catch(() => null));

export function useRegistry() {
  const [reg, setReg] = React.useState<Registry | null>(null);
  React.useEffect(() => { let dead = false; load().then((r) => { if (!dead) setReg(r); }); return () => { dead = true; }; }, []);
  return reg;
}

const figmaUrl = figmaNodeUrl;
const isDs = (e: Entry) => !!e.stories;

export function RegistryPanel() {
  const reg = useRegistry();
  if (!reg) return <p className="mono" style={{ color: "var(--doc-muted)" }}>ds-registry.json 로드 중…</p>;
  const entries = Object.entries(reg.components);
  const bySection = new Map<string, [string, Entry][]>();
  for (const e of entries) { const s = e[1].section || "—"; if (!bySection.has(s)) bySection.set(s, []); bySection.get(s)!.push(e); }
  const sections = [...bySection.keys()].sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
  const ds = entries.filter(([, e]) => isDs(e)).length;
  return (
    <>
      <h3>Storybook 컴포넌트 <span className="mono" style={{ fontSize: 12, color: "var(--doc-muted)" }}>ds-registry.json · {reg.updated}</span></h3>
      <p className="lead">
        <strong>스토리가 있으면 DS</strong>다. 사람이 켜고 끄는 채택 단계는 없다 — 스토리를 만들면 그 순간 쓸 수 있고, 지우면 아니다.
        스토리가 없는 항목은 다른 컴포넌트가 내부에서 쓰는 <strong>부품</strong>이라 화면에서 직접 쓰지 않는다.
        DS <strong>{ds}</strong> · 부품 <strong>{entries.length - ds}</strong>.
        생성에 쓰이는 목록은 <span className="mono">/story-html/index.json</span>이고, 이 표는 관리 기록(피그마 세트·설계 노트)이다.
        보는 곳 = <a href="/storybook/" target="_blank" rel="noreferrer">Storybook</a>, 그리는 곳 = 피그마 Component 페이지(열의 딥링크).
      </p>
      {sections.map((sec) => (
        <React.Fragment key={sec}>
          <h4 style={{ marginTop: 28 }}>{sec === "—" ? "섹션 없음 (부품)" : sec}</h4>
          <table className="map-t">
            <thead><tr><th>이름</th><th>구분</th><th>스토리</th><th>피그마</th><th>노트</th></tr></thead>
            <tbody>
              {bySection.get(sec)!.sort((a, b) => a[0].localeCompare(b[0])).map(([key, e]) => (
                <tr key={key}>
                  <td>
                    {isDs(e)
                      ? <a className="mono al" href={storybookDocsUrl(key)} target="_blank" rel="noreferrer">{key}</a>
                      : <span className="mono al">{key}</span>}
                    <br /><span className="hx" style={{ fontSize: 12 }}>{e.name.ko}{e.name.ko !== e.name.en ? " · " + e.name.en : ""}</span>
                  </td>
                  <td><span className={"chip" + (isDs(e) ? " approve on" : "")}>{isDs(e) ? "DS" : "부품"}</span></td>
                  <td className="mono hx" style={{ fontSize: 12 }}>{e.stories ? e.stories.replace("components/src/ui/", "") : "—"}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {e.figma.length ? e.figma.map((f) => (
                      <span key={f.id} style={{ display: "block" }}>
                        <a href={figmaUrl(reg.fileKey, f.id)} target="_blank" rel="noreferrer">{f.name}</a>
                        <span className="hx"> · {f.variants}</span>
                      </span>
                    )) : <span className="hx">—</span>}
                  </td>
                  <td className="hx" style={{ fontSize: 12, maxWidth: 420 }}>{e.note ? e.note.split("\n")[0].slice(0, 140) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </React.Fragment>
      ))}
    </>
  );
}

/** 우측 레일 — 집계 + 원천 링크 */
export function RegistryRail() {
  const reg = useRegistry();
  if (!reg) return null;
  const entries = Object.values(reg.components);
  const ds = entries.filter(isDs).length;
  const sets = entries.reduce((a, e) => a + e.figma.length, 0);
  const variants = entries.reduce((a, e) => a + e.figma.reduce((b, f) => b + f.variants, 0), 0);
  return (
    <div className="kv" style={{ padding: "24px 28px", fontSize: 13 }}>
      <div className="k">항목</div><div className="v">{entries.length} (DS {ds} · 부품 {entries.length - ds})</div>
      <div className="k">판정</div><div className="v">스토리가 있으면 DS — 채택 단계 없음(2026-09-18)</div>
      <div className="k">피그마</div><div className="v">세트 {sets} · 변형 {variants} · <a href={`https://www.figma.com/design/${reg.fileKey}/`} target="_blank" rel="noreferrer">Component 페이지</a></div>
      <div className="k">원천</div><div className="v mono">playground/public/ds-registry.json</div>
      <div className="k">소비자 목록</div><div className="v mono">/story-html/index.json — 생성이 읽는다</div>
      <div className="k">검사</div><div className="v mono">pnpm registry · audit:published · audit:rules</div>
    </div>
  );
}
