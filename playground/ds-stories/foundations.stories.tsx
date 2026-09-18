import * as React from "react"

// Foundations — 팔레트 · 시맨틱 · 타이포. 원천 = public/dstk/*.json(ds:build 가 dstk/ 에서 복사·해석).
// 값을 손으로 적지 않는다 — 전부 JSON 에서 그린다. 피그마와 무관 — 저장소가 원천이고 피그마가 따른다(2026-09-18).

import palette from "../public/dstk/palette.json"
import typography from "../public/dstk/typography.json"
import semanticMap from "../public/dstk/semantic-map.json"

export default {
  title: "Foundations/Overview",
  parameters: { layout: "padded" },
}

/* ── 팔레트 ──────────────────────────────────────────────────────── */
type Lighting = "day" | "dusk" | "night"
const pal = palette as any

function PaletteView({ lighting }: { lighting: Lighting }) {
  const anchor = pal.$anchor[lighting]
  const fams = Object.keys(pal).filter((k) => !k.startsWith("$"))
  return (
    <div className="space-y-6 text-sm">
      <p className="text-secondary-foreground">
        번호는 밝기가 아니라 역할(50=배경 · 100=면 · 900=최대 대비). ★ = 대비 인증 앵커(Day=600 · Dusk·Night=500). 조명 모드: <b>{lighting}</b>
      </p>
      {fams.map((fam) => {
        if (fam === "basic") {
          const tones = Object.keys(pal.basic).filter((k) => !k.startsWith("$"))
          return (
            <div key={fam}>
              <p className="mb-2 font-mono text-xs text-secondary-foreground">basic — 모드 무관(100% + 불투명도 단계)</p>
              {tones.map((t) => (
                <div key={t} className="mb-2 flex flex-wrap gap-2">
                  {Object.keys(pal.basic[t]).filter((k) => !k.startsWith("$")).map((s) => (
                    <div key={s} className="w-16 text-center">
                      <div className="h-8 rounded border border-border" style={{ background: pal.basic[t][s].$value }} />
                      <div className="mt-1 font-mono text-[10px] text-secondary-foreground">{t}-{s}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        }
        const steps = Object.keys(pal[fam]).filter((k) => !k.startsWith("$"))
        return (
          <div key={fam}>
            <p className="mb-2 font-mono text-xs text-secondary-foreground">{fam}</p>
            <div className="flex flex-wrap gap-2">
              {steps.map((s) => {
                const v0 = pal[fam][s].$value
                const v = typeof v0 === "string" ? v0 : v0[lighting]
                if (v === undefined) return null
                const todo = v === "TODO"
                const isA = fam !== "gray" && s === anchor
                return (
                  <div key={s} className="w-16 text-center">
                    <div className={"relative h-8 rounded border border-border" + (todo ? " bg-muted" : "")} style={todo ? undefined : { background: v }}>
                      {isA && <span className="absolute top-0.5 right-1 text-[10px] text-white drop-shadow">★</span>}
                    </div>
                    <div className="mt-1 font-mono text-[10px] leading-tight text-secondary-foreground">{s}<br />{todo ? "TODO" : v}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const Palette = {
  args: { lighting: "day" as Lighting },
  argTypes: { lighting: { control: "select", options: ["day", "dusk", "night"] } },
  render: (args: { lighting: Lighting }) => <PaletteView lighting={args.lighting} />,
}

/* ── 시맨틱 — dstk 토큰 표(원천 semantic.json + palette.json, ds:build 가 semantic-map.json 으로 해석) ───────────── */
const MODES = ["light", "dark", "control"] as const
const chipName = (ref: string | null) => (ref && !ref.startsWith("#") ? ref.replace(/[{}]/g, "").replace(/^palette\./, "") : "(고유값)")
const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }

function Cell({ bg, label, hex }: { bg: string; label: string; hex: string }) {
  return (
    <td className="border-b border-border py-2 pr-3 align-top">
      <span className="mr-1.5 inline-block size-3 border border-border align-top" style={{ background: bg }} />
      <span className="inline-block font-mono text-xs leading-4"><span>{label}</span><br /><span className="text-secondary-foreground">{hex}</span></span>
    </td>
  )
}

function SemanticView() {
  const map = semanticMap as any
  const rows = (map.rows || []) as any[]
  const tints = (map.tints || []) as any[]
  return (
    <div className="text-sm">
      <p className="mb-3 text-secondary-foreground">
        이름 = dstk 토큰 = Tailwind 클래스 · 셀 = 스와치 + 팔레트 참조 + 해석 hex(제품 모드 Light=Cloud · Dark=SVM·NAS · Control). 원천 dstk/semantic.json + palette.json — ds:build 가 해석한다. 틴트(/N)는 contrast-pairs 허용 목록. 갱신 {map.updated}
      </p>
      <table className="w-full border-collapse">
        <thead><tr className="text-left font-mono text-[11px] font-medium text-secondary-foreground">{["이름", "Light (Cloud)", "Dark (SVM·NAS)", "Control", "비고"].map((h) => <th key={h} className="border-b border-border py-2 pr-3">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.name}>
              <td className="border-b border-border py-2 pr-3 font-mono text-xs">{r.name}</td>
              {MODES.map((m) => r[m] && r[m].hex
                ? <Cell key={m} bg={r[m].hex} label={chipName(r[m].ref)} hex={r[m].hex} />
                : <td key={m} className="border-b border-border py-2 pr-3 font-mono text-xs text-secondary-foreground">{r[m] ? r[m].ref : "—"}</td>)}
              <td className="border-b border-border py-2 text-xs text-secondary-foreground">{r.note || ""}</td>
            </tr>
          ))}
          {tints.map((t: any) => {
            const base = String(t.class).replace(/\/\d+$/, "")
            return (
              <tr key={t.class}>
                <td className="border-b border-border py-2 pr-3 font-mono text-xs">{t.class}</td>
                {MODES.map((m) => { const v = t[m]; const pct = Math.round(v.alpha * 100) + "%"; return <Cell key={m} bg={rgba(v.hex, v.alpha)} label={base + " " + pct} hex={v.hex + " @" + pct} /> })}
                <td className="border-b border-border py-2 text-xs text-secondary-foreground">틴트 — Tailwind 투명도 변형(bg-{t.class})</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const Semantic = { render: () => <SemanticView /> }

/* ── 타이포 — Desktop 10종 + mono 3종(피그마 텍스트 스타일 정합) + 시거리 스케일 ─── */
function TypographyView() {
  const t = typography as any
  const rows = Object.entries(t).filter(([k]) => !k.startsWith("$")) as [string, any][]
  const desktop = rows.filter(([k]) => k.startsWith("desktop-"))
  const distance = rows.filter(([k]) => !k.startsWith("desktop-"))
  return (
    <div className="space-y-8 text-sm">
      <div>
        <p className="mb-3 text-secondary-foreground">Desktop — Inter(한글은 시스템 폴백) · mono = Roboto Mono. 피그마 Desktop/* 텍스트 스타일과 1:1.</p>
        <table className="w-full border-collapse">
          <tbody>
            {desktop.map(([k, v]) => {
              const spec = v.$value
              const mono = k.includes("mono")
              return (
                <tr key={k}>
                  <td className="w-48 border-b border-border py-2 pr-3 font-mono text-xs">{k.replace("desktop-", "")}</td>
                  <td className="w-40 border-b border-border py-2 pr-3 font-mono text-xs text-secondary-foreground">{spec.size} / {spec.lineHeight} · {spec.weight}</td>
                  <td className="border-b border-border py-2">
                    <span className={mono ? "font-mono" : undefined} style={{ fontSize: spec.size, lineHeight: spec.lineHeight, fontWeight: Number(spec.weight) }}>
                      {mono ? "v3.0.0-rc.26 · 2026-09-16 14:20" : "납품 호선 리스트 — HYUNDAI GLOBE 001"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div>
        <p className="mb-3 text-secondary-foreground">시거리 스케일(Control, 2m/1m — ISO 8468 연동). 4K 캔버스 px. TODO = 실측 대기.</p>
        <div className="flex flex-wrap gap-2 font-mono text-xs">
          {distance.map(([k, v]) => <span key={k} className="rounded border border-border px-2 py-1">{k} = {v.$value === "TODO" ? "TODO" : v.$value.size}{v.$note ? " · " + v.$note : ""}</span>)}
        </div>
      </div>
    </div>
  )
}

export const Typography = { render: () => <TypographyView /> }

export const __namedExportsOrder = ["Palette", "Semantic", "Typography"]
