import * as React from "react"
import { Activity, LayoutDashboard, RefreshCw, Ship } from "lucide-react"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./breadcrumb"
import { Separator } from "./separator"
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
} from "./sidebar"

/* Sidebar 스토리 — 허브 카드 app-shell(앱 셸) · sidebar-nav(사이드바 내비)의 원문. 셸 = SidebarProvider + Sidebar(collapsible none, border-r) + SidebarInset(헤더 h-12: SidebarTrigger · Separator · Breadcrumb, 본문 p-4).
 * 내비 = SidebarGroup(SidebarGroupLabel) › SidebarMenu › SidebarMenuItem › SidebarMenuButton(isActive = bg-sidebar-accent). layout/ 프레임 ① 의 셸. @storybook import 0. */

export default {
  title: "DS/Sidebar",
  component: Sidebar,
}

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
  )
}

export const AppShell = {
  parameters: { vocab: "app-shell" },
  render: () => (
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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="#">테스트 호선</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="#">SHIP_A</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>업데이트</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
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
  ),
}

export const Nav = {
  parameters: { vocab: "sidebar-nav" },
  render: () => (
    <SidebarProvider className="min-h-0 w-fit">
      <Sidebar collapsible="none" style={{ height: 480 }}>
        <SidebarContent>
          <NavGroups />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  ),
}

export const __namedExportsOrder = ["AppShell", "Nav"]
