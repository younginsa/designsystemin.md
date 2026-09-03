"use client";

// S6 제품 목록 — 세일즈포스 대체 (① 프레임 셸 상속 + A 리스트)
// 원천: hinas365 와이어프레임 wireframe_s6_product_list.html
//
// 와이어프레임 대조 메모
// - 두 표 구성: ① 제품 목록(계약 항목에 등록 가능한 제품 단위 — 판매상태 도트)
//   ② 상품 패키지(포함 제품 구성·구독 여부·계약 건수)
// - 판매상태: 판매 중=success 도트 · 판매 중지=destructive 도트 (도트+텍스트 규칙)
//
// 어휘 게이트 메모: skeleton 채택 완료(DES-205 해소, 2026-08-25) — 로딩=스켈레톤 · 프로그레스 바=실제 진행률 전용

import * as React from "react";
import { LOADING_STATES, StatePreview } from "@ds/ui/ui/state-preview";
import { TableSkeleton } from "@ds/ui/ui/skeleton";
import { Check, Info } from "lucide-react";

import { Badge } from "@ds/ui/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";
import { ErrorState } from "@ds/ui/ui/error-state";
import { Progress } from "@ds/ui/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";

const PRODUCTS: { name: string; desc: string; packages: string[]; onSale: boolean }[] = [
  { name: "Control", desc: "AI 기반 자율운항 및 충돌회피 제어 기능 제공", packages: ["Enterprise", "Smart Standard"], onSale: true },
  { name: "Navigation", desc: "카메라와 AR(증강현실)을 활용한 항해 상황 인식 기능 제공", packages: ["Safety Forward", "Safety Around"], onSale: true },
  { name: "SVM", desc: "360도 서라운드 뷰 모니터링 기능 제공", packages: ["Enterprise", "Safety Around"], onSale: true },
  { name: "Cloud", desc: "육상에서 선대를 관리하고 데이터를 분석할 수 있는 플랫폼 제공", packages: ["Enterprise", "Smart Standard", "Safety Forward", "Safety Around"], onSale: true },
  { name: "Control Legacy", desc: "기존 Control 제품의 구버전 (x.x.x 이전 버전). 현재 판매 중단.", packages: [], onSale: false },
  { name: "자재납품", desc: "선박 탑재용 자재 공급. 설치에 필요한 하드웨어 자재 패키지를 납품합니다.", packages: ["자재 패키지"], onSale: true },
];

// v2 매트릭스 — 구성 제품별 ✓, 구독 포함은 구성 제품의 납품 유형에서, 계약 건수는 조회 시점 집계
const PKG_PRODUCTS = ["Control", "Navigation", "SVM", "Cloud"] as const;
const PACKAGES: { name: string; includes: string[]; subscription: boolean; contracts: number }[] = [
  { name: "Enterprise", includes: ["Control", "SVM", "Cloud"], subscription: true, contracts: 1 },
  { name: "Smart Standard", includes: ["Control", "Cloud"], subscription: true, contracts: 2 },
  { name: "Safety Forward", includes: ["Navigation", "Cloud"], subscription: true, contracts: 1 },
  { name: "Safety Around", includes: ["Navigation", "SVM", "Cloud"], subscription: true, contracts: 0 },
];

type ViewState = "default" | "loading" | "progress" | "error" | "empty";

export default function Sales365ProductsPage() {
  const [view, setView] = React.useState<ViewState>("default");

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">제품 목록</h1>
          <p className="text-sm text-secondary-foreground">
            계약 항목에 담을 수 있는 제품과, 판매 단위로 묶은 패키지입니다
          </p>
        </div>
        <StatePreview value={view} onChange={(v) => setView(v as ViewState)} states={LOADING_STATES} />
      </div>

      {view === "loading" && <TableSkeleton />}
      {view === "progress" && (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <Progress value={62} className="flex-1" />
            <span className="font-mono text-sm text-secondary-foreground">62%</span>
          </div>
          <p className="text-sm text-secondary-foreground">제품 목록을 불러오는 중입니다…</p>
        </div>
      )}

      {view === "error" && (
        <ErrorState
          title="제품 목록을 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          onRetry={() => setView("default")}
        />
      )}

      {view === "empty" && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>등록된 제품이 없습니다.</EmptyTitle>
            <EmptyDescription>제품 마스터가 등록되면 이 목록에 표시됩니다.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view === "default" && (
        <>
          {/* ── 제품 목록 ── */}
          <section className="space-y-2">
            <div>
              <h2 className="text-sm font-medium text-secondary-foreground">제품</h2>
              <p className="text-xs text-secondary-foreground">
                계약 항목에 등록 가능한 제품 단위입니다
              </p>
            </div>
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">제품명</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>속한 패키지</TableHead>
                  <TableHead className="w-32">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PRODUCTS.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="whitespace-normal text-secondary-foreground">
                      {p.desc}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.packages.length > 0 ? (
                          p.packages.map((pk) => (
                            <Badge key={pk} variant="secondary" className="font-normal">
                              {pk}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-secondary-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.onSale ? (
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className="size-2 rounded-full bg-success" /> 판매 중
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                          <span className="size-2 rounded-full bg-destructive" /> 판매 중지
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* ── 상품 패키지 ── */}
          <section className="space-y-2">
            <div>
              <h2 className="text-sm font-medium text-secondary-foreground">패키지</h2>
              <p className="text-xs text-secondary-foreground">
                제품과 납품 유형을 묶은 판매 단위입니다. 계약 항목을 만들 때 고르면 구성이 그대로
                채워지고, 계약 항목에는 패키지 코드만 남습니다
              </p>
            </div>
            <Table className="bg-card">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">패키지명</TableHead>
                  {/* v2 매트릭스 — 제품별 포함 여부 컬럼 */}
                  {PKG_PRODUCTS.map((n) => (
                    <TableHead key={n} className="w-28 text-center">
                      {n}
                    </TableHead>
                  ))}
                  <TableHead className="w-24 text-center">구독 포함</TableHead>
                  <TableHead className="w-28">계약 건수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PACKAGES.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    {PKG_PRODUCTS.map((n) => (
                      <TableCell key={n} className="text-center">
                        {p.includes.includes(n) ? (
                          <Check className="mx-auto size-4 text-success" aria-label={`${n} 포함`} />
                        ) : (
                          <span className="text-secondary-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {p.subscription ? (
                        <Check className="mx-auto size-4 text-success" aria-label="구독 포함" />
                      ) : (
                        <span className="text-secondary-foreground">—</span>
                      )}
                    </TableCell>
                    {/* 계약 건수 = 그 패키지 코드를 가진 계약 항목의 조회 시점 집계 — 0건은 — */}
                    <TableCell>
                      {p.contracts > 0 ? (
                        `${p.contracts}건`
                      ) : (
                        <span className="text-secondary-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}
