"use client";

// AuditLog 시안 — 상세 화면 공통 「변경 이력」 탭 (와이어프레임 v2 6.1 문법, 2026-08-26)
// - 조회 축 = 대상 테이블 + 대상 ID → 삭제 레코드는 여기 안 보인다(전역 감사 로그 몫) — 안내 고정
// - 행: 변경 일시 내림차순 · 액션 배지(생성/수정) · 행위자 · 필드별 from → to
// - cross: 마스터성 데이터 수정이 계약 경계를 넘어 보일 때의 부연(호선 등)
// - 5개 상세 화면 공유 — 확정 후 DS 승격 후보

import { Info } from "lucide-react";

import { Alert, AlertDescription } from "@ds/ui/ui/alert";
import { Badge } from "@ds/ui/ui/badge";

export type AuditField = { label: string; from: string | null; to: string };
export type AuditEntry = {
  at: string;
  action: "C" | "U";
  actor: string;
  fields: AuditField[];
  /** 계약 경계를 넘는 반영 부연(마스터성 데이터) */
  cross?: string;
};

export function AuditLog({ subject, entries }: { subject: string; entries: AuditEntry[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-secondary-foreground">
        변경 일시 내림차순 · 최근 50건 · {subject}
      </p>
      {/* 삭제가 안 보이는 이유 — 조회 축 설명(와이어프레임 6.1·6.2) */}
      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          이 목록에 삭제가 보이지 않는 것은 정상입니다. 조회가 대상 테이블 + 대상 ID 기준이라
          지워진 행에는 상세 화면 자체가 없습니다 — 삭제 레코드는 전역 감사 로그에서만 찾을 수
          있습니다.
        </AlertDescription>
      </Alert>

      <div className="divide-y rounded-lg border bg-card">
        {entries.map((e, i) => (
          <div key={i} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={e.action === "C" ? "secondary" : "outline"} className="font-normal">
                {e.action === "C" ? "생성" : "수정"}
              </Badge>
              <span className="font-mono text-xs text-secondary-foreground">{e.at}</span>
              <span>{e.actor}</span>
            </div>
            <div className="space-y-1">
              {e.fields.map((f) => (
                <div key={f.label} className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="w-28 shrink-0 text-secondary-foreground">{f.label}</span>
                  <span className="text-secondary-foreground line-through">
                    {f.from ?? "— (없음)"}
                  </span>
                  <span aria-hidden>→</span>
                  <span className="font-medium">{f.to}</span>
                </div>
              ))}
            </div>
            {e.cross && <p className="text-xs text-secondary-foreground">{e.cross}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
