"use client";

// 업데이트 히스토리 — ① admin-console 프레임 + B 상세
// 원천: 실물 캡처 1장(2026-09-30). 업데이트 허브(진행 중·지난 업데이트)의 [히스토리] 로 진입한다.
//
// 2026-09-30 디자이너 확정
// - 셸은 우리 ① 프레임을 쓴다(캡처의 햄버거·그리드 아이콘·UTC 표기는 재현하지 않는다)
// - 좌측 상태 목록은 도트+톤 색 텍스트 — 이 저장소의 통일된 상태 문법. 채움 칩은 DS 가 톤과 무관하게
//   전부 회색 한 벌이라 실물의 색 구분이 사라진다(2026-09-22 확정 전례)
// - 실물의 파란 상태들은 progress 톤(primary)으로 유지 — 진행 중이라는 뜻과도 맞는다
// - IMAGE READY 만 실물이 주황인데 DS 에 주황 토큰이 없어 neutral 로 내렸다
//   (업데이트 허브의 IMAGE READY · Unreachable 과 같은 처리, 2026-09-21)
//
// 상태: 진행률이 실재하지 않는 화면이라 DEFAULT_STATES 4종(기본·빈·로딩·에러). 프로그레스 없음

import * as React from "react";
import Link from "next/link";
import { Copy, FileText, TriangleAlert } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import { Card } from "@ds/ui/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { PageHeader } from "@ds/ui/ui/page-header";
import { BlockSkeleton } from "@ds/ui/ui/skeleton";
import { StatePreview, DEFAULT_STATES } from "@ds/ui/ui/state-preview";
import { StatusBadge } from "@ds/ui/ui/status-badge";
import { Timeline, TimelineItem, TimelineTitle } from "@ds/ui/ui/timeline";

const BASE = "/gallery/hinas365";

/* ---------------------------------------------------- 목업 데이터 */

const ATTEMPT = {
  id: "7b74ce89-1d94-4758-ba8e-b17608459505",
  product: "SVM",
  status: "UPDATING",
  common: ["v1.0.0", "v1.1.0"] as [string, string],
  prod: ["SVM v1.0.0", "SVM v1.1.0"] as [string, string],
};

// 12 단계 — 캡처 순서 그대로. 톤 매핑은 파일 머리 주석의 확정 사항
type Tone = "neutral" | "progress" | "error";
type Step = {
  label: string;
  tone: Tone;
  warn?: boolean;
  start: string;
  end: string;
  dur: string;
  reason?: string;
  stderr?: string[];
};

const STDERR_ROLLBACK = [
  "[ERROR] EXEC_INSTALL_FAILED",
  "Cause:      Command failed (exit 2): ansible-playbook. See log: /var/log/avikus-installer/20260707T101925Z-48193/update.log",
  "Scope:      execution",
  "Next step:  manual-resume",
  "Log:        /var/log/avikus-installer/20260707T101925Z-48193/update.log",
  "----- installctl log tail (/var/log/avikus-installer/20260707T101925Z-48193/update.log, last 100 lines) -----",
  "",
  "TASK [install_security_baseline : Enable rsyslog UDP/TCP input modules] ********",
  "ok: [localhost] => (item={'regexp': '^#(module\\\\(load=\"imudp\"\\\\))', 'replace': '\\\\1'})",
  "ok: [localhost] => (item={'regexp': '^#(input\\\\(type=\"imudp\".*\\\\))', 'replace': '\\\\1'})",
  "ok: [localhost] => (item={'regexp': '^#(module\\\\(load=\"imtcp\"\\\\))', 'replace': '\\\\1'})",
  "ok: [localhost] => (item={'regexp': '^#(input\\\\(type=\"imtcp\".*\\\\))', 'replace': '\\\\1'})",
  "",
  "TASK [install_security_baseline : Set rsyslog severity to warning] *************",
  "ok: [localhost]",
];

const STEPS: Step[] = [
  { label: "PENDING OPTION INPUT", tone: "neutral", start: "2026-07-07 10:12:00", end: "2026-07-07 10:12:30", dur: "30초" },
  { label: "INIT EXECUTED", tone: "neutral", start: "2026-07-07 10:12:30", end: "2026-07-07 10:12:45", dur: "15초" },
  { label: "INITIALIZED", tone: "neutral", start: "2026-07-07 10:12:45", end: "2026-07-07 10:13:00", dur: "15초" },
  { label: "DOWNLOAD REQUEST EXECUTED", tone: "progress", start: "2026-07-07 10:13:00", end: "2026-07-07 10:13:10", dur: "10초" },
  { label: "DOWNLOAD REQUESTED", tone: "progress", start: "2026-07-07 10:13:10", end: "2026-07-07 10:13:20", dur: "10초" },
  { label: "IMAGE DOWNLOADING", tone: "progress", start: "2026-07-07 10:13:20", end: "2026-07-07 10:17:05", dur: "3분 45초" },
  { label: "IMAGE READY", tone: "neutral", start: "2026-07-07 10:17:05", end: "2026-07-07 10:17:20", dur: "15초" },
  { label: "UPDATE REQUEST EXECUTED", tone: "progress", start: "2026-07-07 10:17:20", end: "2026-07-07 10:17:30", dur: "10초" },
  { label: "UPDATE REQUESTED", tone: "progress", start: "2026-07-07 10:17:30", end: "2026-07-07 10:17:40", dur: "10초" },
  { label: "SYSTEM UPDATING", tone: "progress", start: "2026-07-07 10:17:40", end: "2026-07-07 10:19:25", dur: "1분 45초" },
  {
    label: "SYSTEM ROLLING BACK",
    tone: "error",
    warn: true,
    start: "2026-07-07 10:19:25",
    end: "2026-07-07 10:21:02",
    dur: "1분 37초",
    reason: "installctl update exited with non-zero return code",
  },
  {
    label: "SYSTEM ROLLBACK FAILED",
    tone: "error",
    warn: true,
    start: "2026-07-07 10:21:02",
    end: "",
    dur: "",
    reason: "installctl update exited with non-zero return code",
    stderr: STDERR_ROLLBACK,
  },
];

type ViewState = "default" | "empty" | "loading" | "error";

/* ---------------------------------------------------- 페이지 */

export default function UpdateHistoryPage() {
  const [view, setView] = React.useState<ViewState>("default");
  // 마지막 단계가 기본 선택 — 실물 캡처도 가장 최근(SYSTEM ROLLBACK FAILED)이 열려 있다
  const [picked, setPicked] = React.useState(STEPS.length - 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="font-mono">{ATTEMPT.id}</span>}
        addon={
          <span className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-6" aria-label={`${ATTEMPT.id} 복사`}>
              <Copy className="size-3.5" />
            </Button>
            <Badge variant="outline">{ATTEMPT.product}</Badge>
            <Badge variant="secondary" className="font-normal">
              {ATTEMPT.status}
            </Badge>
          </span>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`${BASE}/ships/update`}>
                <FileText className="size-4" /> 변경사항 보기
              </Link>
            </Button>
            <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={DEFAULT_STATES} />
          </>
        }
      />

      {view === "loading" && <BlockSkeleton />}
      {view === "error" && (
        <ErrorState
          title="히스토리를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}
      {view === "empty" && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>상태 변경 기록이 없습니다.</EmptyTitle>
            <EmptyDescription>업데이트가 시작되면 단계별 기록이 여기에 쌓입니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <>
          {/* 버전 두 장 — FROM 은 보조색, TO 는 primary(업데이트 허브 STEP 3 과 같은 문법) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <VersionCard title="Common Version" from={ATTEMPT.common[0]} to={ATTEMPT.common[1]} />
            <VersionCard title="Product Version" from={ATTEMPT.prod[0]} to={ATTEMPT.prod[1]} />
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-secondary-foreground">상태 변경 히스토리</h2>
            {/* 두 단 — 좌 단계 목록 · 우 고른 단계의 상세. 테두리는 바깥 카드 하나만(이중 테두리 금지) */}
            <Card variant="flat" className="flex flex-row items-stretch">
              <div className="w-72 shrink-0 border-r p-4">
                <Timeline>
                  {STEPS.map((s, i) => (
                    <TimelineItem key={s.label} status={s.tone === "progress" ? "current" : s.tone === "error" ? "error" : "neutral"}>
                      {/* 고른 단계만 배경 잉크 — 선택 표시는 톤과 무관한 accent 한 벌이다 */}
                      <button
                        type="button"
                        onClick={() => setPicked(i)}
                        className={
                          "-mx-2 -my-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left" +
                          (i === picked ? " bg-accent" : " hover:bg-accent")
                        }
                      >
                        <TimelineTitle className={"font-normal " + TONE_TEXT[s.tone]}>{s.label}</TimelineTitle>
                        {s.warn && <TriangleAlert className={"size-3.5 shrink-0 " + TONE_TEXT[s.tone]} />}
                      </button>
                    </TimelineItem>
                  ))}
                </Timeline>
              </div>

              <div className="min-w-0 flex-1 space-y-4 p-4">
                <StepDetail step={STEPS[picked]} />
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------- 조각 */

// 톤별 글자색 — StatusBadge 와 같은 세 벌(회색·파랑·빨강)
const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  progress: "text-primary",
  error: "text-destructive",
};

function VersionCard({ title, from, to }: { title: string; from: string; to: string }) {
  return (
    <Card variant="flat" className="space-y-3 p-6">
      <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{title}</h3>
      <dl className="divide-y">
        {(
          [
            ["From", from, false],
            ["To", to, true],
          ] as [string, string, boolean][]
        ).map(([k, v, hi]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-xs uppercase text-secondary-foreground">{k}</dt>
            <dd className={"font-mono text-sm font-medium" + (hi ? " text-primary" : "")}>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function StepDetail({ step }: { step: Step }) {
  return (
    <>
      <StatusBadge label={step.label} tone={step.tone} bg={false} mono />

      <dl className="divide-y">
        {(
          [
            ["시작", step.start],
            ["종료", step.end],
            ["소요", step.dur],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-4 py-2">
            <dt className="w-10 shrink-0 text-xs text-secondary-foreground">{k}</dt>
            <dd className="font-mono text-sm">{v || "-"}</dd>
          </div>
        ))}
      </dl>

      {step.reason && <Console title="Reason" lines={[step.reason]} />}
      {step.stderr && <Console title="Stderr" lines={step.stderr} scroll />}
    </>
  );
}

// 검은 콘솔 — 전용 컴포넌트 파일이 없는 스토리 전용 패턴(DS/ErrorConsole)의 조립
function Console({ title, lines, scroll }: { title: string; lines: string[]; scroll?: boolean }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase text-secondary-foreground">{title}</h3>
      <div
        className={
          "relative rounded-lg bg-foreground p-4 font-mono text-xs text-background" +
          (scroll ? " max-h-64 overflow-auto" : "")
        }
      >
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-2 top-2 text-background hover:bg-background/20"
          aria-label="복사"
        >
          <Copy />
        </Button>
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre pr-8">
            {l || " "}
          </div>
        ))}
      </div>
    </section>
  );
}
