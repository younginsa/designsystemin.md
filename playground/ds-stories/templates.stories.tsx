import * as React from "react"

// Templates — 페이지 템플릿(레이아웃 프레임 + 본문 패턴). 규칙 원문 = layout/*.md(?raw 임포트, 손으로 옮겨 적지 않는다) +
// 실물 = 배포 365 갤러리 라우트 iframe. 365 허브 「페이지 템플릿」과 같은 원천(2026-09-16, 배치 1).

import readme from "../../layout/README.md?raw"
import adminConsole from "../../layout/admin-console.md?raw"
import bodyPatterns from "../../layout/body-patterns.md?raw"

export default {
  title: "Templates/Overview",
  parameters: { layout: "padded" },
}

const SITE = "https://designsystemin-md.vercel.app"

/** 아주 작은 마크다운 → HTML(제목·불릿·굵게·인라인 코드·문단). 규칙 문서는 이 네 가지만 쓴다 */
function md(src: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  const inline = (s: string) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
  const out: string[] = []
  let list: string[] = []
  const flush = () => { if (list.length) { out.push("<ul>" + list.map((l) => "<li>" + inline(l) + "</li>").join("") + "</ul>"); list = [] } }
  for (const raw of src.split("\n")) {
    const line = raw.replace(/\s+$/, "")
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    if (h) { flush(); out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`); continue }
    const li = /^\s*[-*]\s+(.*)$/.exec(line)
    if (li) { list.push(li[1]); continue }
    if (/^\s{2,}\S/.test(line) && list.length) { list[list.length - 1] += " " + line.trim(); continue }
    if (!line.trim()) { flush(); continue }
    flush(); out.push("<p>" + inline(line) + "</p>")
  }
  flush()
  return out.join("\n")
}

function Doc({ text }: { text: string }) {
  return <div className="prose-sm max-w-3xl text-sm leading-6 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:font-medium [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: md(text) }} />
}

function Live({ route, height = 720 }: { route: string; height?: number }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <iframe src={`${SITE}/gallery/${route}/`} title={route} style={{ width: "100%", height, border: 0 }} loading="lazy" />
      <div className="border-t border-border px-3 py-1.5 font-mono text-[11px] text-secondary-foreground">{SITE}/gallery/{route}/</div>
    </div>
  )
}

const TEMPLATES: { id: string; title: string; route: string; desc: string }[] = [
  { id: "1", title: "① HiNAS 365 메인 레이아웃", route: "hinas365/dashboard", desc: "2컬럼 — 풀하이트 사이드바(브랜드·메뉴·계정/접기) + 상단바(시계·알림) + 본문. 요청 문장: \"스샷을 메인 레이아웃 본문에 넣어줘\"." },
  { id: "A", title: "A 리스트", route: "hinas365/ships/delivery", desc: "타이틀 행 → FilterBar → Table → ListFooter. 필터 = FilterBar 전담 · 헤더 = 정렬 전담." },
  { id: "B", title: "B 상세", route: "sales365/contracts/detail", desc: "좌측 요약 패널(kv) + 우측 본문(아코디언·탭·타임라인). 패널 = Card variant=flat." },
  { id: "B-2", title: "B-2 상세 · 3컬럼 구분선", route: "hinas365/release-notes", desc: "탭 행(line 탭 = 페이지 뷰 스위치 + 우측 액션) 아래 세로 구분선 3컬럼이 뷰포트 바닥까지. 제자리 편집." },
  { id: "C", title: "C 위저드", route: "hinas365/updates", desc: "상단 스테퍼 + 단계별 폼 + 하단 이전/다음 바 — 사이드바를 덮지 않는다." },
  { id: "D", title: "D 대시보드", route: "hinas365/dashboard", desc: "bg-secondary 캔버스 + 무보더 카드(shadow-card). KPI 카드 행 → 타이틀+테이블 카드." },
  { id: "E", title: "E 프로그레시브 폼", route: "sales365/contracts/new", desc: "조건 노출 단일 페이지 생성 폼 — 게이트 충족 시 다음 섹션 자동 노출, sticky 하단 바." },
]

export const Frames = {
  render: () => (
    <div className="space-y-10">
      <Doc text={readme} />
      {TEMPLATES.map((t) => (
        <section key={t.id}>
          <h3 className="text-base font-semibold">{t.title}</h3>
          <p className="mt-1 text-sm text-secondary-foreground">{t.desc}</p>
          <Live route={t.route} />
        </section>
      ))}
    </div>
  ),
}

export const AdminConsoleRules = { name: "① 메인 레이아웃 규칙", render: () => <Doc text={adminConsole} /> }
export const BodyPatternRules = { name: "본문 패턴 규칙 (A–E · B-2)", render: () => <Doc text={bodyPatterns} /> }

export const __namedExportsOrder = ["Frames", "AdminConsoleRules", "BodyPatternRules"]
