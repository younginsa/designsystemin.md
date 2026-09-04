"use client";

// 세일즈포스 대체 — 별도 앱 셸 (① HiNAS 365 메인 레이아웃 프레임 상속)
// 원천: hinas365 와이어프레임 (S1~S10 + 계정·유저) — 이번 단계는 S1 계약 목록만.
// 앱 전환(그리드 아이콘)으로 HiNAS 365 ↔ 세일즈포스 대체를 오간다 (Jira↔Confluence 방식).
//
// 와이어프레임 대조 메모
// - 원본은 자체 상단 헤더(48px) 구조지만, 확정 답변에 따라 프레임 ① 셸(사이드바)을 상속
// - 내비 6종: 계약 · 계약 호선 · 납품 제품 · 계정 · 제품 · 유저 — 계약만 구현, 나머지 예정
// - 공통 헤더의 알림(태그 멘션)·로그인 유저(김민준/영업)는 상단바·계정존으로 이식

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Boxes,
  Briefcase,
  Building2,
  CalendarClock,
  Clock,
  FileText,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Ship,
  Users,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ds/ui/ui/breadcrumb";
import { Button } from "@ds/ui/ui/button";
// 사람 요소 잠금(2026-09-04): 계정 존 아바타 = DS Avatar default(32) — _detail/person 공유
import { PersonAvatar } from "../_detail/person";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@ds/ui/ui/dropdown-menu";
import { IconSelect } from "@ds/ui/ui/icon-select";
import { NotificationPanel } from "@ds/ui/ui/notification-panel";
import { Separator } from "@ds/ui/ui/separator";

const BASE = "/gallery/sales365";

// 와이어프레임 v2 내비 7종 — 구독(만료 임박 조회) 메뉴 추가(2026-08-26)
const NAV: { icon: React.ElementType; label: string; href: string }[] = [
  { icon: FileText, label: "계약", href: `${BASE}/contracts` },
  { icon: Anchor, label: "계약 호선", href: `${BASE}/vessels` },
  { icon: Package, label: "납품 제품", href: `${BASE}/deliveries` },
  { icon: CalendarClock, label: "구독", href: `${BASE}/subscriptions` },
  { icon: Building2, label: "계정", href: `${BASE}/accounts` },
  { icon: Boxes, label: "제품", href: `${BASE}/products` },
  { icon: Users, label: "유저", href: `${BASE}/users` },
];

// 브레드크럼 — 경로 프리픽스 → [상위 트레일, 현재 페이지] (구체 경로 우선)
const CRUMBS: { prefix: string; trail: [string, string][]; page: string }[] = [
  { prefix: `${BASE}/contracts/new`, trail: [["계약", `${BASE}/contracts`]], page: "계약 등록" },
  { prefix: `${BASE}/contracts/detail`, trail: [["계약", `${BASE}/contracts`]], page: "계약 상세" },
  { prefix: `${BASE}/contracts`, trail: [], page: "계약" },
  { prefix: `${BASE}/vessels/detail`, trail: [["계약 호선", `${BASE}/vessels`]], page: "계약 호선 상세" },
  { prefix: `${BASE}/vessels`, trail: [], page: "계약 호선" },
  { prefix: `${BASE}/deliveries/detail`, trail: [["납품 제품", `${BASE}/deliveries`]], page: "납품 제품 상세" },
  { prefix: `${BASE}/deliveries`, trail: [], page: "납품 제품" },
  { prefix: `${BASE}/subscriptions`, trail: [], page: "구독 만료 임박" },
  { prefix: `${BASE}/accounts/detail`, trail: [["계정", `${BASE}/accounts`]], page: "계정 상세" },
  { prefix: `${BASE}/accounts`, trail: [], page: "계정" },
  { prefix: `${BASE}/products`, trail: [], page: "제품" },
  { prefix: `${BASE}/users/detail`, trail: [["유저", `${BASE}/users`]], page: "유저 상세" },
  { prefix: `${BASE}/users`, trail: [], page: "유저" },
];

const TIMEZONES = [
  { value: "kst", label: "KST", hint: "+9" },
  { value: "utc", label: "UTC", hint: "+0" },
];

export default function Sales365Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [tz, setTz] = React.useState("kst");
  const [unread, setUnread] = React.useState(1);

  return (
    <div className="flex min-h-screen">
      {/* ── 사이드바 — 풀하이트 ── */}
      <aside
        className={
          "flex shrink-0 flex-col border-r bg-card " + (collapsed ? "w-16" : "w-64")
        }
      >
        {/* 브랜드 존 — 64px(상단바와 동일 높이, 경계선 정렬). 좌: 워드마크 + 버전(행간 12px, 바짝) /
            우: 앱 전환 햄버거(존 전체 높이 기준 수직 중앙). 2026-09-04 디자이너 확정: 제품 아이콘 제거 ·
            그리드 → 햄버거(Menu). 접힘 모드는 햄버거만 남는다 */}
        <div
          className={
            "flex h-16 shrink-0 items-center border-b " +
            (collapsed ? "justify-center" : "justify-between px-4")
          }
        >
          {!collapsed && (
            <div className="min-w-0">
              <Link
                href={`${BASE}/contracts`}
                className="block truncate text-base font-bold text-primary"
                aria-label="계약 목록으로 이동"
              >
                세일즈포스 대체
              </Link>
              {/* 버전 표기 — 셸 관례(로고 밑 작게, 2026-09-02). caption_xs 크기 dstk 변수 · text-input.
                  input×card 쌍은 dstk/contrast-pairs.json에 선언됨(장식 표기 한정) */}
              <p
                className="font-mono leading-3 text-input"
                style={{ fontSize: "var(--type-desktop-caption-xs-size)" }}
              >
                v1.4.0
              </p>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="primary-ghost" size="icon" className="shrink-0" aria-label="앱 전환">
                <Menu className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel>앱 전환</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/gallery/hinas365">
                  <Ship className="size-4" />
                  <span>HiNAS 365</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Briefcase className="size-4" />
                <span className="font-semibold">세일즈포스 대체</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 중앙 메뉴 — 와이어프레임 내비 순서 그대로 */}
        <nav
          className={
            "min-h-0 flex-1 overflow-y-auto py-4 " +
            (collapsed ? "flex flex-col items-center gap-1" : "space-y-1 px-4 text-sm")
          }
        >
          {NAV.map(({ icon: Icon, label, href }) => {
            const active = pathname.startsWith(href);
            return collapsed ? (
              <Link
                key={label}
                href={href}
                title={label}
                className={
                  "flex size-10 items-center justify-center rounded-md " +
                  (active ? "bg-accent text-foreground" : "text-secondary-foreground")
                }
              >
                <Icon className="size-4" />
              </Link>
            ) : (
              <Link
                key={label}
                href={href}
                className={
                  "flex items-center gap-2 rounded-md px-3 py-2 " +
                  (active
                    ? "bg-accent font-medium text-foreground"
                    : "text-secondary-foreground hover:bg-accent")
                }
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 존 — 계정(김민준·영업) + 메뉴 접기 */}
        <div className={"shrink-0 pb-3 " + (collapsed ? "px-2" : "px-4")}>
          {!collapsed && (
            <div className="flex items-center gap-2 py-2">
              <PersonAvatar name="김민준" size="default" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">김민준 · 영업</span>
                <span className="block truncate text-xs text-secondary-foreground">
                  mj.kim@company.com
                </span>
              </span>
            </div>
          )}
          <Separator className="my-2" />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-secondary-foreground"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" /> 메뉴 접기
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ── 본문 컬럼 ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`${BASE}/contracts`}>세일즈포스 대체</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {(() => {
                const crumb = CRUMBS.find((c) => pathname.startsWith(c.prefix));
                if (!crumb) return null;
                return (
                  <>
                    {crumb.trail.map(([label, href]) => (
                      <React.Fragment key={href}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link href={href}>{label}</Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{crumb.page}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                );
              })()}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <IconSelect
              icon={Clock}
              value={tz}
              items={TIMEZONES}
              onValueChange={setTz}
              heading="Timezone"
              sub={`${TIMEZONES.find((t) => t.value === tz)?.hint ?? ""} · 2026-08-20 15:30`}
              className="bg-card"
            />

            <Separator orientation="vertical" className="h-5" />

            {/* 알림 — ov-notif 프리셋(NotificationPanel), 손 조합 금지 */}
            <NotificationPanel
              align="end"
              items={[
                {
                  id: "m1",
                  title: (
                    <>
                      이수진 님이 계약{" "}
                      <span className="font-mono font-medium">C-2026-001</span> 댓글에서
                      회원님을 태그했습니다.
                    </>
                  ),
                  ago: "방금 전",
                  unread: unread > 0,
                },
              ]}
              onReadAll={() => setUnread(0)}
            />
          </div>
        </header>

        {/* 본문 배경 — secondary 토큰(배경 2 — 배경 1보다 반 톤 어두운 캔버스) */}
        <main className="flex min-w-0 flex-1 flex-col bg-secondary p-8">{children}</main>
      </div>
    </div>
  );
}
