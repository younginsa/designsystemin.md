"use client";

// 내부 도구 페이지 — 365 탭 § 03 카드에 넣을 shadcn 기본형 미리보기를 렌더링한다.
// browse 헤드리스 캡처 대상: #pv-app-shell, #pv-sidebar-nav, #pv-page-header, #pv-breadcrumb
// 제품 페이지가 아니므로 배포 내비에 연결하지 않는다.

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@ds/ui/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ds/ui/ui/breadcrumb";
import { Button } from "@ds/ui/ui/button";
import { Separator } from "@ds/ui/ui/separator";
import {
  Activity,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  RefreshCw,
  Ship,
  Star,
} from "lucide-react";

function NavGroups() {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>운영</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <LayoutDashboard />
                <span>대시보드</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Activity />
                <span>자가 진단</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>호선 관리</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Ship />
                <span>납품 호선</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <RefreshCw />
                <span>업데이트</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

function DemoBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">테스트 호선</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">SHIP_A</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>업데이트</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function ShadcnPreview() {
  return (
    <main className="flex flex-col gap-10 bg-background p-10 text-foreground">
      {/* 1. 앱 셸 — Sidebar + SidebarInset */}
      <section id="pv-app-shell" className="w-fit border border-border">
        <SidebarProvider className="min-h-0 w-fit">
          <div className="flex" style={{ width: 960, height: 540 }}>
            <Sidebar collapsible="none" className="border-r border-border">
              <SidebarHeader>
                <div className="px-2 py-1 text-sm font-semibold">HiNAS 365</div>
              </SidebarHeader>
              <SidebarContent>
                <NavGroups />
              </SidebarContent>
            </Sidebar>
            <SidebarInset className="min-h-0">
              <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <DemoBreadcrumb />
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-video rounded-lg bg-muted" />
                  <div className="aspect-video rounded-lg bg-muted" />
                  <div className="aspect-video rounded-lg bg-muted" />
                </div>
                <div className="min-h-0 flex-1 rounded-lg bg-muted" />
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </section>

      {/* 2. 사이드바 내비 — SidebarMenu 단독 */}
      <section id="pv-sidebar-nav" className="w-fit border border-border">
        <SidebarProvider className="min-h-0 w-fit">
          <Sidebar collapsible="none" style={{ height: 480 }}>
            <SidebarContent>
              <NavGroups />
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </section>

      {/* 3. 페이지 헤더 — 조합 (직접 대응 컴포넌트 없음) */}
      <section
        id="pv-page-header"
        className="flex items-center justify-between border border-border bg-background px-6"
        style={{ width: 960, height: 76 }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">SHIP_A</h1>
          <Star className="size-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <KeyRound /> 비밀번호
          </Button>
          <Button variant="outline" size="sm">
            도구 및 관리 <ChevronDown />
          </Button>
          <Button variant="secondary" size="sm">
            자가 진단
          </Button>
          <Button size="sm">업데이트</Button>
        </div>
      </section>

      {/* 4. 브레드크럼 — Breadcrumb */}
      <section
        id="pv-breadcrumb"
        className="flex items-center border border-border bg-background px-6"
        style={{ width: 640, height: 56 }}
      >
        <DemoBreadcrumb />
      </section>
    </main>
  );
}
