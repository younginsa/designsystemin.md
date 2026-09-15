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
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Code,
  FlaskConical,
  GitCompare,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
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
import { Toaster } from "@ds/ui/ui/sonner";
import { Switch } from "@ds/ui/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ds/ui/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ds/ui/ui/tooltip";

const BASE = "/gallery/hinas365";

// 하위 페이지(2026-09-11 디자이너 확정, 레퍼런스 Statsig): 페이지 탭 스위치가 있던 항목은 사이드바에서 한 단계 펼친다.
// 자식 = 같은 페이지의 ?view= 값(정적 export 호환). 부모 행 클릭 = 펼치기/접기만, 이동은 자식에서.
// 접힌 레일에서는 부모 아이콘 = 첫 자식으로 이동 + 툴팁에 자식 목록.
const NAV_GROUPS: {
  label: string;
  items: {
    icon: React.ElementType;
    label: string;
    href: string;
    children?: { label: string; view: string }[];
  }[];
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
      {
        icon: GitCompare,
        label: "버전 호환성",
        href: `${BASE}/compatibility`,
        children: [
          { label: "버전 호환성", view: "matrix" },
          { label: "업데이트 호환성", view: "update" },
        ],
      },
      {
        icon: Tag,
        label: "릴리즈 노트",
        href: `${BASE}/release-notes`,
        // 제품 탭(COMMON·NAVIGATION·SVM·CONTROL) → 하위 페이지. 데이터는 동일, 제목·강조만 따라간다
        children: [
          { label: "COMMON", view: "common" },
          { label: "NAVIGATION", view: "navigation" },
          { label: "SVM", view: "svm" },
          { label: "CONTROL", view: "control" },
        ],
      },
    ],
  },
  {
    label: "관리",
    items: [
      {
        icon: Code,
        label: "Developer / QA",
        href: `${BASE}/dev-qa`,
        children: [
          { label: "제품 보안 취약점 현황", view: "vuln" },
          { label: "번들 버전 비교", view: "bundle" },
          { label: "릴리즈 노트 갱신", view: "notes" },
        ],
      },
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
// 날짜 그룹 4단(2026-09-15 — 80건 목업에 맞춰 이번 주·이전 신설)
const NOTIF_GROUPS = ["오늘", "어제", "이번 주", "이전"] as const;
type NotifGroup = (typeof NOTIF_GROUPS)[number];
type Notif = {
  id: string;
  ship: string | null;
  title: string;
  ago: string;
  group: NotifGroup;
  cat: "호선" | "업데이트";
  unread: boolean;
  detail: string;
};

const NOTIF_SEEDS: Notif[] = [
  { id: "n1", ship: "HYUNDAI GLOBE 001", title: "업데이트 완료", ago: "방금 전", group: "오늘", cat: "호선", unread: true, detail: "common 2.1.0 적용이 완료되었습니다. 업데이트 화면에서 결과를 확인하세요." },
  { id: "n2", ship: "MAERSK SEOUL 002", title: "자가 진단 실패", ago: "2시간 전", group: "오늘", cat: "호선", unread: true, detail: "SVM 카메라 모듈 진단이 실패했습니다. 자가 진단 화면에서 로그를 확인하세요." },
  { id: "n3", ship: null, title: "common 2.1.0 릴리즈", ago: "어제", group: "어제", cat: "업데이트", unread: false, detail: "변경 사항은 릴리즈 노트에서 확인하세요." },
  { id: "n4", ship: null, title: "v3.99.20-anduril 다운로드 대기", ago: "어제", group: "어제", cat: "업데이트", unread: true, detail: "다운로드 대기 중인 업데이트가 있습니다. 업데이트 화면에서 진행하세요." },
];
// 80건 목업(2026-09-15 디자이너 확정 — 대량 알림에서 스크롤·그룹·읽음 처리 확인용). 씨앗 4건 뒤로 결정적 생성, 호선:업데이트 = 2:1, 미읽음 약 30%
const NOTIF_SHIPS = ["HYUNDAI GLOBE 001", "MAERSK SEOUL 002", "EVER GIVEN 003", "COSCO PRIDE 006", "HMM ALGECIRAS 004", "MSC GULSUN 007", "ONE APUS 005"];
const SHIP_EVENTS: [string, string][] = [
  ["업데이트 완료", "적용이 완료되었습니다. 업데이트 화면에서 결과를 확인하세요."],
  ["자가 진단 실패", "진단 항목 중 이상이 감지되었습니다. 자가 진단 화면에서 로그를 확인하세요."],
  ["구독 만료 임박", "구독이 30일 안에 만료됩니다. 계약 화면에서 갱신을 진행하세요."],
  ["다운로드 완료", "업데이트 이미지 다운로드가 끝났습니다. 적용 대기 상태로 넘어갑니다."],
  ["인터넷 미연결", "호선과의 연결이 끊겼습니다. 마지막 수신 이후 상태가 갱신되지 않습니다."],
];
const UPDATE_EVENTS: [string, string][] = [
  ["common 2.1.0 릴리즈", "변경 사항은 릴리즈 노트에서 확인하세요."],
  ["v3.99.20-anduril 다운로드 대기", "다운로드 대기 중인 업데이트가 있습니다. 업데이트 화면에서 진행하세요."],
  ["navigation 3.7.0-rc.7 릴리즈", "릴리즈 노트가 발행되었습니다."],
  ["번들 검증 완료", "번들 버전 비교 결과 호환성 문제가 없습니다."],
];
function buildNotifications(total: number): Notif[] {
  const out = [...NOTIF_SEEDS];
  for (let i = out.length; i < total; i++) {
    const cat: Notif["cat"] = i % 3 === 2 ? "업데이트" : "호선";
    const group: NotifGroup = i < 8 ? "오늘" : i < 20 ? "어제" : i < 44 ? "이번 주" : "이전";
    const ago =
      group === "오늘" ? `${(i % 8) + 3}시간 전` : group === "어제" ? "어제" : group === "이번 주" ? `${(i % 5) + 2}일 전` : `${(i % 3) + 1}주 전`;
    const ship = cat === "호선" ? NOTIF_SHIPS[i % NOTIF_SHIPS.length] : null;
    const [title, detail] = cat === "호선" ? SHIP_EVENTS[i % SHIP_EVENTS.length] : UPDATE_EVENTS[i % UPDATE_EVENTS.length];
    const unread = i < 8 ? i % 2 === 0 : i % 4 === 0;
    out.push({ id: `n${i + 1}`, ship, title, ago, group, cat, unread, detail });
  }
  return out;
}
const NOTIFICATIONS: Notif[] = buildNotifications(80);

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

type Crumb = (typeof CRUMBS)[number];
/** 하위 페이지가 있는 항목(버전 호환성 · Developer / QA)의 자식 목록 — 브레드크럼·사이드바가 같은 원천을 본다 */
const childrenOf = (prefix: string) =>
  NAV_GROUPS.flatMap((g) => g.items).find((i) => i.href === prefix)?.children;

// 브레드크럼 꼬리 — 자식이 있으면 "부모 › 자식", 없으면 페이지 이름. useSearchParams는 Suspense 안에서만(정적 export)
function CrumbTail({ crumb, view }: { crumb: Crumb; view: string | null }) {
  const kids = childrenOf(crumb.prefix);
  const child = kids ? (kids.find((c) => c.view === view) ?? kids[0]) : null;
  return (
    <>
      {kids && (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`${crumb.prefix}?view=${kids[0].view}`}>{crumb.page}</BreadcrumbLink>
          </BreadcrumbItem>
        </>
      )}
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{child ? child.label : crumb.page}</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
function CrumbTailParams({ crumb }: { crumb: Crumb }) {
  const view = useSearchParams().get("view");
  return <CrumbTail crumb={crumb} view={view} />;
}

// 사이드바 메뉴 — 자식이 있는 항목은 펼침 행(부모 = 토글 버튼, 자식 = 링크). 현재 페이지의 부모는 자동으로 열린다
type NavMenuProps = {
  collapsed: boolean;
  pathname: string;
  view: string | null;
  open: Record<string, boolean>;
  onToggle: (label: string, next: boolean) => void;
};
function NavMenu({ collapsed, pathname, view, open, onToggle }: NavMenuProps) {
  const isActive = (href: string) =>
    href !== BASE && (pathname === href || pathname.startsWith(`${href}/`));
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className={collapsed ? "contents" : undefined}>
          {!collapsed && (
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-secondary-foreground">
              {group.label}
            </p>
          )}
          <div className={collapsed ? "contents" : "mt-1 space-y-1"}>
            {group.items.map(({ icon: Icon, label, href, children }) => {
              const active = isActive(href);
              if (collapsed) {
                // 접힌 레일 — 자식이 있으면 첫 자식으로, 툴팁에 자식 목록
                const link = (
                  <Link
                    href={children ? `${href}?view=${children[0].view}` : href}
                    title={children ? undefined : label}
                    className={
                      "flex size-10 items-center justify-center rounded-md " +
                      (active ? "bg-accent text-foreground" : "text-secondary-foreground hover:bg-accent")
                    }
                  >
                    <Icon className="size-4" />
                  </Link>
                );
                if (!children) return <React.Fragment key={group.label + label}>{link}</React.Fragment>;
                return (
                  <Tooltip key={group.label + label}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{label}</p>
                      {children.map((c) => (
                        <p key={c.view} className="text-xs">
                          {c.label}
                        </p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              if (children) {
                const isOpen = open[label] ?? active;
                const current = view ?? children[0].view;
                return (
                  <div key={label}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => onToggle(label, !isOpen)}
                      className={
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 " +
                        (active ? "font-medium" : "text-secondary-foreground hover:bg-accent")
                      }
                    >
                      <Icon className="size-4" />
                      <span className="flex-1 text-left">{label}</span>
                      <ChevronDown
                        className={"size-3.5 transition-transform " + (isOpen ? "" : "-rotate-90")}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-0.5 ml-5 space-y-0.5 border-l pl-3">
                        {children.map((c) => {
                          const on = active && current === c.view;
                          return (
                            <Link
                              key={c.view}
                              href={`${href}?view=${c.view}`}
                              className={
                                "block rounded-md px-3 py-1.5 " +
                                (on ? "bg-accent font-medium" : "text-secondary-foreground hover:bg-accent")
                              }
                            >
                              {c.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={label}
                  href={href}
                  className={
                    "flex items-center gap-2 rounded-md px-3 py-2 " +
                    (active ? "bg-accent font-medium" : "text-secondary-foreground hover:bg-accent")
                  }
                >
                  <Icon className="size-4" /> {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
function NavMenuParams(props: Omit<NavMenuProps, "view">) {
  const view = useSearchParams().get("view");
  return <NavMenu {...props} view={view} />;
}

export default function HiNAS365Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  // 하위 페이지 펼침 상태 — 값 없음 = 현재 페이지의 부모만 자동 펼침
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  const toggleGroup = (label: string, next: boolean) => setOpenGroups((s) => ({ ...s, [label]: next }));
  // 계정 전환 데모 — 하단 사용자 메뉴에서 전환하면 로고 옆 (dev)/(qa) 표기가 따라간다
  const [account, setAccount] = React.useState<Account>(ACCOUNTS[0]);
  const [tz, setTz] = React.useState("KST");
  const [notifs, setNotifs] = React.useState(NOTIFICATIONS);
  const [centerOpen, setCenterOpen] = React.useState(false);
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  // 펼침은 여러 행 동시에(2026-09-15 디자이너 확정) — id 집합
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // 탭 = 전체 · 호선 · 업데이트(2026-09-15 전체 신설)
  type CenterTab = "전체" | "호선" | "업데이트";
  const CENTER_TABS: CenterTab[] = ["전체", "호선", "업데이트"];
  const [centerTab, setCenterTab] = React.useState<CenterTab>("전체");

  const crumb = CRUMBS.find((c) => pathname.startsWith(c.prefix));
  const unread = notifs.filter((n) => n.unread).length;
  const markRead = (id: string) =>
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="flex min-h-screen">
      {/* ── 사이드바 — 뷰포트에 고정(2026-09-07). sticky+h-dvh가 없으면 문서 높이만큼
           늘어나, 목록이 길 때 하단 계정 존과 [메뉴 접기]가 화면 밖으로 밀려난다.
           내부 nav가 flex-1 overflow-y-auto라 메뉴가 길면 안에서 스크롤된다 ── */}
      <aside
        className={
          "sticky top-0 flex h-dvh shrink-0 flex-col border-r bg-card " +
          (collapsed ? "w-16" : "w-64")
        }
      >
        {/* 브랜드 존 — 64px(상단바와 동일 높이, 경계선 정렬). 좌: 워드마크(+환경 마커) + 버전(행간 12px, 바짝) /
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
                href={BASE}
                className="flex items-center gap-2 text-base font-bold text-primary"
                aria-label="메인으로 이동"
              >
                HiNAS 365
                {/* 계정 분기 표기 — dev/qa 계정으로 로그인하면 로고 뒤에 환경이 붙는다. 로고와 같은 파랑 */}
                <span className="font-mono text-xs font-normal text-primary">({account.marker})</span>
              </Link>
              {/* 버전 표기 — 실제품은 사이드바 최하단, 로고 밑 이동 스펙(2026-09-02 확정). caption_xs 크기 dstk 변수 ·
                  text-input(3모드 동일값). input×card 쌍은 dstk/contrast-pairs.json에 선언됨(장식 표기 한정) */}
              <p
                className="font-mono leading-3 text-input"
                style={{ fontSize: "var(--type-desktop-caption-xs-size)" }}
              >
                v3.0.0-rc.26
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
              <DropdownMenuItem>
                <Ship className="size-4" />
                <span className="font-mono font-semibold">HiNAS 365</span>
              </DropdownMenuItem>
              {/* Jira↔Confluence식 앱 전환 — 세일즈포스 대체(별도 앱) */}
              <DropdownMenuItem asChild>
                <Link href="/gallery/sales365/contracts">
                  <Briefcase className="size-4" />
                  <span>세일즈포스 대체</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 중앙 메뉴 */}
        <nav
          className={
            "min-h-0 flex-1 overflow-y-auto py-4 " +
            (collapsed ? "flex flex-col items-center gap-1" : "space-y-6 px-4 text-sm")
          }
        >
          {/* 메뉴 본체 — ?view= 를 읽는 판은 Suspense 안(정적 export), 폴백은 같은 메뉴를 view 없이 */}
          <TooltipProvider>
            <React.Suspense
              fallback={
                <NavMenu collapsed={collapsed} pathname={pathname} view={null} open={openGroups} onToggle={toggleGroup} />
              }
            >
              <NavMenuParams collapsed={collapsed} pathname={pathname} open={openGroups} onToggle={toggleGroup} />
            </React.Suspense>
          </TooltipProvider>
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
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-card px-6">
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
                <React.Suspense fallback={<CrumbTail crumb={crumb} view={null} />}>
                  <CrumbTailParams crumb={crumb} />
                </React.Suspense>
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
              // 벨 드롭다운은 요약 — 최근 5건만(80건 목업에서 메뉴가 화면을 덮지 않게, 2026-09-15). 전체는 알림 센터 모달
              items={notifs.slice(0, 5).map((n) => ({
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
        {/* 본문 배경 흰색(2026-09-08 확정, 두 셸 공통) — sales365와 같은 이유·같은 값 */}
        <main className="flex min-w-0 flex-1 flex-col bg-background p-8">{children}</main>

        {/* 토스트(어휘 ov-toast) — 셸에 한 번만. 위치 하단 오른쪽(2026-09-14 디자이너 확정, DS 스토리 기본과 동일).
            페이지는 sonner의 toast()만 부른다(첫 사용: 릴리즈 노트 개발자용 업데이트 결과).
            theme="light" 고정 — DS 래퍼는 next-themes(없으면 system=OS)를 따라 OS 다크에서 설명 글자가 흰색이 됐다.
            앱은 라이트 고정이라 셸에서 못 박는다(래퍼가 앱 모드를 보도록 하는 건 UX-DS 요청 #10) */}
        <Toaster position="bottom-right" theme="light" />

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

            <TooltipProvider>
            <Tabs value={centerTab} onValueChange={(v) => setCenterTab(v as CenterTab)}>
              {/* line 탭 좌정렬 + 전폭 밑줄은 래퍼가(2026-09-15 디자이너 확정, 레퍼런스 Notification) — 목록이 w-full이면 트리거가 늘어난다.
                  배지 = 연빨강 원(destructive/12, 허용 틴트) + 빨간 숫자, 선택 여부 무관(채운 원은 너무 튀었다 — 2026-09-15) */}
              <div className="border-b">
                <TabsList variant="line">
                  {CENTER_TABS.map((cat) => {
                    const cnt = notifs.filter((n) => (cat === "전체" || n.cat === cat) && n.unread).length;
                    return (
                      <TabsTrigger key={cat} value={cat}>
                        {cat}
                        {cnt > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-5 justify-center rounded-full bg-destructive/12 px-1 text-destructive"
                          >
                            {cnt}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
              {CENTER_TABS.map((cat) => (
                // 목록만 스크롤(약 480px) — 머리·탭·푸터는 고정. 80건 목업 기준
                <TabsContent key={cat} value={cat} className="mt-3 max-h-120 space-y-4 overflow-y-auto pr-1">
                  {NOTIF_GROUPS.map((g) => {
                    const items = notifs.filter(
                      (n) => (cat === "전체" || n.cat === cat) && n.group === g && (!unreadOnly || n.unread)
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
                              // 행 높이 확대(2026-09-15 디자이너 확정, 레퍼런스 Notification): py-3, 펼침 하단은 16px(테두리 카드 마주 봄)
                              "rounded-md px-3 " +
                              (expanded.has(n.id) ? "bg-muted pt-3 pb-4" : "py-3")
                            }
                          >
                            {/* 열 = 도트(=읽음 처리 버튼) | 메시지(제목+시각, 남은 폭) | 맥락 태그(분류 라벨 · 호선 칩, 우측) | 꺾쇠 — 전부 상단 정렬, 열 간격 24px.
                                메시지 먼저·맥락은 뒤(2026-09-15 디자이너 확정): 칩이 앞에 서면 칩 없는 행의 제목이 왼쪽으로 튀어 열이 들쭉날쭉했다.
                                읽음 처리 버튼·'읽음' 라벨 폐기(2026-09-15, 레퍼런스 Jira): 왼쪽 파란 도트가 곧 액션 — hover 툴팁 '읽음 처리', 클릭하면 읽음.
                                읽은 행은 같은 폭의 빈 슬롯(제목 정렬 유지) */}
                            <div className="flex items-start gap-6">
                              {n.unread ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="-mt-1 size-7 shrink-0"
                                      aria-label="읽음 처리"
                                      onClick={() => markRead(n.id)}
                                    >
                                      <span className="size-1.5 rounded-full bg-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>읽음 처리</TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="-mt-1 size-7 shrink-0" aria-hidden />
                              )}
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p
                                  className={
                                    "truncate text-sm leading-5 " +
                                    (n.unread ? "font-medium" : "text-secondary-foreground")
                                  }
                                >
                                  {n.title}
                                </p>
                                <p className="text-xs text-secondary-foreground">{n.ago}</p>
                              </div>
                              {/* 맥락 = 호선 칩만(우측). 분류 라벨(호선·업데이트)은 칩이 이미 말해 폐기(2026-09-15).
                                  칩은 펼친 행(bg-muted) 위에서도 흰 면(bg-card) */}
                              {n.ship && (
                                <Badge variant="outline" className="shrink-0 rounded-sm bg-card font-mono font-normal">
                                  {n.ship}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="-mt-1 size-7 shrink-0"
                                aria-label="상세 펼치기"
                                onClick={() => toggleExpanded(n.id)}
                              >
                                {/* 닫힘=오른쪽 꺾쇠 · 열림=아래(90° 회전) */}
                                <ChevronRight
                                  className={
                                    "size-4 transition-transform " +
                                    (expanded.has(n.id) ? "rotate-90" : "")
                                  }
                                />
                              </Button>
                            </div>
                            {/* 상세 행 = 도트 열 다음부터 오른쪽 끝까지 전폭(칩 유무 무관, 2026-09-15 디자이너 확정 — 업데이트 행과 같은 동작) */}
                            {expanded.has(n.id) && (
                              <div className="flex gap-6 pt-2">
                                <span className="size-7 shrink-0" aria-hidden />
                                <p className="min-w-0 flex-1 rounded-md border bg-card px-3 py-2 text-xs text-secondary-foreground">
                                  {n.detail}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
            </TooltipProvider>

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
