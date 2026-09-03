"use client";

// HiNAS 365 통합 셸 — layout: ① HiNAS 365 메인 레이아웃 (2컬럼)
//
// layout/admin-console.md (1f724f3 기준) 상속:
// - 사이드바(좌)가 페이지 최상단~최하단 풀하이트, 상단바는 사이드바 우측 끝부터만.
// - 사이드바 최상단 브랜드 존: 워드마크 + 앱 그리드. 환경 배지(LOCAL 등) 없음.
// - 사이드바 하단 고정 존: 사용자 계정(아바타+이름) → 접기 토글("메뉴 접기").
//   햄버거를 상단바에 두지 않는다.
// - 상단바: 좌 브레드크럼, 우 시계(타임존)·알림만. 아바타 없음.
//
// 이 셸은 두 피그마 원천을 한 제품으로 잇는다:
//   호선 관리(Avikus Design library)  → /ships
//   세일즈포스 365 전환 UI(S1~S8)     → /contracts…, /contract-ships…

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Briefcase,
  Check,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Code,
  FlaskConical,
  GitCompare,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  RefreshCw,
  Ship,
  Tag,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@ds/ui/ui/avatar";
import { Badge } from "@ds/ui/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ds/ui/ui/breadcrumb";
import { Button } from "@ds/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ds/ui/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ds/ui/ui/dropdown-menu";
import { IconSelect } from "@ds/ui/ui/icon-select";
import { Label } from "@ds/ui/ui/label";
import { NotificationPanel } from "@ds/ui/ui/notification-panel";
import { Separator } from "@ds/ui/ui/separator";
import { Switch } from "@ds/ui/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";

const BASE = "/generated/hinas365";

const NAV_GROUPS: {
  label: string;
  items: { icon: React.ElementType; label: string; href: string }[];
}[] = [
  {
    label: "운영",
    items: [
      { icon: LayoutDashboard, label: "대시보드", href: `${BASE}/dashboard` },
      { icon: Activity, label: "자가 진단", href: `${BASE}/diagnostics` },
    ],
  },
  {
    label: "호선 관리",
    items: [
      { icon: Ship, label: "납품 호선", href: `${BASE}/ships/delivery` },
      { icon: FlaskConical, label: "테스트 호선", href: `${BASE}/ships/test` },
      // 세일즈포스 → 별도 앱(세일즈포스 대체)으로 이관 — 앱 전환 메뉴에서 진입
    ],
  },
  {
    label: "업데이트",
    items: [
      { icon: RefreshCw, label: "업데이트", href: `${BASE}/updates` },
      { icon: GitCompare, label: "버전 호환성", href: `${BASE}/compatibility` },
      { icon: Tag, label: "릴리즈 노트", href: `${BASE}/release-notes` },
    ],
  },
  {
    label: "관리",
    items: [
      { icon: Code, label: "Developer / QA", href: `${BASE}/dev-qa` },
      { icon: UserRound, label: "계정 관리", href: `${BASE}/accounts` },
      { icon: KeyRound, label: "기능별 계정권한", href: `${BASE}/permissions` },
    ],
  },
];

// icon-select 인스턴스 데이터 — 채택 어휘 icon-select 로 렌더(손 구현 금지, ds365.json)
const TIMEZONES = [
  { value: "KST", label: "KST", hint: "+9" },
  { value: "UTC", label: "UTC", hint: "+0" },
  { value: "SGT", label: "SGT", hint: "+8" },
  { value: "JST", label: "JST", hint: "+9" },
  { value: "EST", label: "EST", hint: "-5" },
];

// 알림 데이터 — 패널(요약)과 알림 센터 모달이 같은 상태를 공유
type Notif = {
  id: string;
  ship: string | null;
  title: string;
  ago: string;
  group: "오늘" | "어제";
  cat: "호선" | "업데이트";
  unread: boolean;
  detail: string;
};

const NOTIFICATIONS: Notif[] = [
  { id: "n1", ship: "HYUNDAI GLOBE 001", title: "업데이트 완료", ago: "방금 전", group: "오늘", cat: "호선", unread: true, detail: "common 2.1.0 적용이 완료되었습니다. 업데이트 화면에서 결과를 확인하세요." },
  { id: "n2", ship: "MAERSK SEOUL 002", title: "자가 진단 실패", ago: "2시간 전", group: "오늘", cat: "호선", unread: true, detail: "SVM 카메라 모듈 진단이 실패했습니다. 자가 진단 화면에서 로그를 확인하세요." },
  { id: "n3", ship: null, title: "common 2.1.0 릴리즈", ago: "어제", group: "어제", cat: "업데이트", unread: false, detail: "변경 사항은 릴리즈 노트에서 확인하세요." },
  { id: "n4", ship: null, title: "v3.99.20-anduril 다운로드 대기", ago: "어제", group: "어제", cat: "업데이트", unread: true, detail: "다운로드 대기 중인 업데이트가 있습니다. 업데이트 화면에서 진행하세요." },
];

// 계정 전환 데모 — 로그인 계정에 따라 보이는 페이지 분기가 갈리므로 로고 옆에 (dev)/(qa)를 표기
// 실제 분기·인증은 제품 몫, 여기서는 표기 규칙 시연용
const ACCOUNTS = [
  { id: "dev", name: "Jiyoung Yoon", email: "jy@avikus.ai", initials: "JY", marker: "dev" },
  { id: "qa", name: "QA Avikus", email: "qa@avikus.ai", initials: "QA", marker: "qa" },
] as const;
type Account = (typeof ACCOUNTS)[number];

// 경로 → 브레드크럼 (상단바 좌측)
const CRUMBS: { prefix: string; trail: [string, string][]; page: string }[] = [
  { prefix: `${BASE}/dashboard`, trail: [], page: "대시보드" },
  { prefix: `${BASE}/diagnostics/detail`, trail: [["자가 진단", `${BASE}/diagnostics`]], page: "SVM_TEST3" },
  { prefix: `${BASE}/diagnostics`, trail: [], page: "자가 진단" },
  { prefix: `${BASE}/updates`, trail: [], page: "업데이트" },
  { prefix: `${BASE}/release-notes`, trail: [], page: "릴리즈 노트" },
  { prefix: `${BASE}/compatibility`, trail: [], page: "버전 호환성" },
  { prefix: `${BASE}/dev-qa`, trail: [], page: "Developer / QA" },
  { prefix: `${BASE}/accounts`, trail: [], page: "계정 관리" },
  { prefix: `${BASE}/permissions`, trail: [], page: "기능별 계정권한" },
  { prefix: `${BASE}/ships/delivery`, trail: [], page: "납품 호선" },
  { prefix: `${BASE}/ships/test`, trail: [], page: "테스트 호선" },
];

export default function HiNAS365Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  // 계정 전환 데모 — 하단 사용자 메뉴에서 전환하면 로고 옆 (dev)/(qa) 표기가 따라간다
  const [account, setAccount] = React.useState<Account>(ACCOUNTS[0]);
  const [tz, setTz] = React.useState("KST");
  const [notifs, setNotifs] = React.useState(NOTIFICATIONS);
  const [centerOpen, setCenterOpen] = React.useState(false);
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [centerTab, setCenterTab] = React.useState<"호선" | "업데이트">("호선");

  const crumb = CRUMBS.find((c) => pathname.startsWith(c.prefix));
  const isActive = (href: string) =>
    href !== BASE && (pathname === href || pathname.startsWith(`${href}/`));
  const unread = notifs.filter((n) => n.unread).length;
  const markRead = (id: string) =>
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="flex min-h-screen">
      {/* ── 사이드바 — 풀하이트 ── */}
      <aside
        className={
          "flex shrink-0 flex-col border-r bg-card " + (collapsed ? "w-16" : "w-64")
        }
      >
        {/* 브랜드 존 */}
        <div
          className={
            "flex h-14 shrink-0 items-center border-b " +
            (collapsed ? "justify-center" : "justify-between px-4")
          }
        >
          {collapsed ? (
            <Link href={BASE} aria-label="메인으로 이동">
              <Ship className="size-5 text-primary" />
            </Link>
          ) : (
            <>
              <div className="min-w-0">
                <Link href={BASE} className="flex items-center gap-2" aria-label="메인으로 이동">
                  <Ship className="size-5 text-primary" />
                  <span className="text-base font-bold text-primary">HiNAS 365</span>
                  {/* 계정 분기 표기 — dev/qa 계정으로 로그인하면 로고 뒤에 환경이 붙는다. 로고와 같은 파랑 */}
                  <span className="font-mono text-xs text-primary">({account.marker})</span>
                </Link>
                {/* 버전 표기 — 실제품은 사이드바 최하단, 로고 밑 이동 스펙(2026-09-02 확정). 접힘 모드 생략.
                    caption_xs(10/16) dstk 변수 참조 · text-input(placeholder 토큰, 3모드 동일값) — 디자이너 직접 지정.
                    input×card 게이트 선언은 UX-DS 반영 대기(aux 3:1 전 모드 통과 실측) */}
                <p
                  className="pl-7 font-mono text-input"
                  style={{
                    fontSize: "var(--type-desktop-caption-xs-size)",
                    lineHeight: "var(--type-desktop-caption-xs-line-height)",
                  }}
                >
                  v3.0.0-rc.26
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="앱 전환">
                    <LayoutGrid className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel>앱 전환</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Ship className="size-4" />
                    <span className="font-mono font-semibold">HiNAS 365</span>
                  </DropdownMenuItem>
                  {/* Jira↔Confluence식 앱 전환 — 세일즈포스 대체(별도 앱) */}
                  <DropdownMenuItem asChild>
                    <Link href="/generated/sales365/contracts">
                      <Briefcase className="size-4" />
                      <span>세일즈포스 대체</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* 중앙 메뉴 */}
        <nav
          className={
            "min-h-0 flex-1 overflow-y-auto py-4 " +
            (collapsed ? "flex flex-col items-center gap-1" : "space-y-6 px-4 text-sm")
          }
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={collapsed ? "contents" : undefined}>
              {!collapsed && (
                <p className="px-3 text-xs font-medium uppercase tracking-wide text-secondary-foreground">
                  {group.label}
                </p>
              )}
              <div className={collapsed ? "contents" : "mt-1 space-y-1"}>
                {group.items.map(({ icon: Icon, label, href }) => {
                  const active = isActive(href);
                  if (collapsed) {
                    return (
                      <Link
                        key={group.label + label}
                        href={href}
                        title={label}
                        className={
                          "flex size-10 items-center justify-center rounded-md " +
                          (active ? "bg-accent text-foreground" : "text-secondary-foreground")
                        }
                      >
                        <Icon className="size-4" />
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={label}
                      href={href}
                      className={
                        "flex items-center gap-2 rounded-md px-3 py-2 " +
                        (active
                          ? "bg-accent font-medium"
                          : "text-secondary-foreground hover:bg-accent")
                      }
                    >
                      <Icon className="size-4" /> {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 하단 고정 존 — 계정 → 접기 토글 (계정 위 상단 줄 없음 — 피그마 172-3899) */}
        <div className={"shrink-0 " + (collapsed ? "py-2" : "p-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {collapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mx-auto flex"
                  aria-label={`${account.name} 메뉴`}
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{account.initials}</AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start gap-2 px-2 py-2"
                  aria-label={`${account.name} 메뉴`}
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{account.initials}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium">{account.name}</span>
                    <span className="block truncate text-xs font-normal text-secondary-foreground">
                      {account.email}
                    </span>
                  </span>
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-60">
              <div className="flex items-start gap-2 p-2">
                <Avatar className="size-8">
                  <AvatarFallback>{account.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold">{account.name}</p>
                  <p className="truncate text-xs text-secondary-foreground">{account.email}</p>
                  <Badge variant="secondary" className="font-normal">
                    avikus
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              {/* 계정 전환 데모 — 단일 선택 = 왼쪽 체크 상시 슬롯(IconSelect 문법, 2026-08-25 반전 확정) */}
              {ACCOUNTS.map((a) => (
                <DropdownMenuItem key={a.id} onSelect={() => setAccount(a)}>
                  <Check
                    className={
                      "size-4 shrink-0 " + (account.id === a.id ? "opacity-100" : "opacity-0")
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{a.name}</span>
                    <span className="block truncate text-xs text-secondary-foreground">
                      {a.email} · {a.marker}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="size-4" /> 로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* layout 관례: 계정 → 구분선 → 접기 토글 */}
          <Separator className="my-1" />
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={
              collapsed
                ? "mx-auto flex text-secondary-foreground"
                : "w-full justify-start gap-2 px-2 text-secondary-foreground"
            }
            aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" /> 메뉴 접기
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ── 우측: 상단바(사이드바 우측 끝~페이지 우측 끝) + 본문 ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-card px-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={BASE}>HiNAS 365</BreadcrumbLink>
              </BreadcrumbItem>
              {crumb?.trail.map(([label, href]) => (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
              {crumb && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{crumb.page}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <IconSelect
              icon={Clock}
              value={tz}
              items={TIMEZONES}
              onValueChange={setTz}
              heading="Timezone"
              sub={`${TIMEZONES.find((t) => t.value === tz)?.hint ?? ""} · 2026-08-18 11:30`}
              className="bg-card"
            />

            <Separator orientation="vertical" className="h-5" />

            {/* 알림 — ov-notif 프리셋(NotificationPanel), 손 조합 금지. 모두 보기 → 알림 센터 모달 */}
            <NotificationPanel
              align="end"
              items={notifs.map((n) => ({
                id: n.id,
                title: n.ship ? `${n.ship} ${n.title}` : n.title,
                ago: n.ago,
                unread: n.unread,
              }))}
              onReadAll={() => setNotifs((p) => p.map((n) => ({ ...n, unread: false })))}
              onViewAll={() => setCenterOpen(true)}
            />
          </div>
        </header>

        {/* flex-col: 자식 페이지가 하단 바를 컬럼 맨 아래로 밀 수 있게(mt-auto)
            본문 배경 연회색 — 카드가 떠 보이는 바탕 (피그마 172-3899) */}
        {/* 본문 배경 — secondary 토큰(배경 2 =gray-20, 배경 1보다 반 톤 어두운 캔버스) */}
        <main className="flex min-w-0 flex-1 flex-col bg-secondary p-8">{children}</main>

        {/* ── 알림 센터 모달 — NotificationCenter 시안 (ov-dialog·data-tabs·form-controls 조합) ── */}
        <Dialog open={centerOpen} onOpenChange={setCenterOpen}>
          {/* 내장 X 제거 — 닫기는 푸터 전담(레퍼런스 양식) */}
          <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base">알림</DialogTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="nc-unread" className="text-xs font-normal text-secondary-foreground">
                    안 읽음만
                  </Label>
                  <Switch id="nc-unread" checked={unreadOnly} onCheckedChange={setUnreadOnly} />
                </div>
              </div>
            </DialogHeader>

            <Tabs value={centerTab} onValueChange={(v) => setCenterTab(v as "호선" | "업데이트")}>
              <TabsList>
                {(["호선", "업데이트"] as const).map((cat) => {
                  const cnt = notifs.filter((n) => n.cat === cat && n.unread).length;
                  return (
                    <TabsTrigger key={cat} value={cat}>
                      {cat}
                      {/* 배지도 탭 선택 상태를 따라감 — 선택=진빨강 · 비선택=destructive/12 틴트(허용 목록) */}
                      {cnt > 0 && (
                        <Badge
                          variant={centerTab === cat ? "destructive" : "secondary"}
                          className={
                            "ml-1.5 rounded-full px-1.5" +
                            (centerTab === cat ? "" : " bg-destructive/12 text-destructive")
                          }
                        >
                          {cnt}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {(["호선", "업데이트"] as const).map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-3 space-y-4">
                  {(["오늘", "어제"] as const).map((g) => {
                    const items = notifs.filter(
                      (n) => n.cat === cat && n.group === g && (!unreadOnly || n.unread)
                    );
                    if (items.length === 0) return null;
                    return (
                      <div key={g} className="space-y-1">
                        <p className="text-xs text-secondary-foreground">{g}</p>
                        {items.map((n) => (
                          <div
                            key={n.id}
                            className={
                              // 여백은 이 컨테이너 한 곳에서만 관리한다(자식 마진 금지 — 흩어지면 어긋난다).
                              // 펼침 하단 12px = 상단 8px의 광학 등가: 위는 글자(줄 간격이 얹힌다),
                              // 아래는 테두리 있는 카드(하드 에지)를 마주 보기 때문.
                              "rounded-md px-2 " +
                              (expanded === n.id ? "bg-muted pt-2 pb-3" : "py-2")
                            }
                          >
                            <div className="flex items-center gap-2">
                              {/* 도트 고정 슬롯 — 패널과 동일 규칙 */}
                              <span
                                className={
                                  "size-1.5 shrink-0 rounded-full " +
                                  (n.unread ? "bg-primary" : "bg-transparent")
                                }
                              />
                              {n.ship && (
                                <Badge
                                  variant="outline"
                                  className="w-36 shrink-0 rounded-sm font-mono font-normal"
                                >
                                  {n.ship}
                                </Badge>
                              )}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={
                                    "truncate text-sm " +
                                    (n.unread ? "font-medium" : "text-secondary-foreground")
                                  }
                                >
                                  {n.title}
                                </p>
                                <p className="text-xs text-secondary-foreground">{n.ago}</p>
                              </div>
                              {n.unread ? (
                                <Button size="sm" className="h-7 text-xs" onClick={() => markRead(n.id)}>
                                  읽음 처리
                                </Button>
                              ) : (
                                <span className="text-xs text-secondary-foreground">읽음</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                aria-label="상세 펼치기"
                                onClick={() => setExpanded((e) => (e === n.id ? null : n.id))}
                              >
                                {/* 닫힘=오른쪽 꺾쇠 · 열림=아래(90° 회전) */}
                                <ChevronRight
                                  className={
                                    "size-4 transition-transform " +
                                    (expanded === n.id ? "rotate-90" : "")
                                  }
                                />
                              </Button>
                            </div>
                            {expanded === n.id && (
                              <p className="mt-2 rounded-md border bg-card px-3 py-2 text-xs text-secondary-foreground">
                                {n.detail}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>

            <DialogFooter className="sm:justify-between">
              {/* 안 읽음 있으면 파란 글자(누를 수 있음이 보이게) · 전부 읽으면 회색 disabled */}
              <Button
                variant="outline"
                disabled={unread === 0}
                className={unread > 0 ? "text-primary" : ""}
                onClick={() => setNotifs((p) => p.map((n) => ({ ...n, unread: false })))}
              >
                모두 읽음{unread > 0 ? ` (${unread}건)` : ""}
              </Button>
              {/* 모달 닫기 = secondary CTA (2026-08-25 확정 — 전 모달 통일) */}
              <Button variant="secondary" onClick={() => setCenterOpen(false)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
