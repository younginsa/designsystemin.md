"use client"

// 알림 패널 프리셋 — shadcn DropdownMenu 조합(새 엔진 아님). ov-notif 어휘의 실물.
// 트리거: Bell ghost 아이콘 버튼 + unread 존재 시 우상단 destructive 도트 배지.
// 아이템: 도트 슬롯 상시 렌더(unread=primary · read=투명 — 제목 좌정렬 유지) + 제목 + 시간(pl-3.5 제목 좌정렬).
// 헤더 우측 버튼 = 모두 읽음 액션. 라벨은 상태 전이(2026-08-28 확정):
//   새 알림 있음 → '새 알림 (N)' · 클릭(전체 unread 해제, 도트·벨 배지 소멸) 후·없음 → '모두 읽음' 비활성.
// '모두 보기' 푸터는 onViewAll 전달 시에만
// 렌더 — NotificationCenter(2단계 신설 예정) 진입용 예약 슬롯. 손 조합 금지.

import * as React from "react"
import { Bell } from "lucide-react"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { cn } from "../lib/utils"

export interface NotificationItem {
  id: string
  title: React.ReactNode
  ago: React.ReactNode
  unread?: boolean
}

interface NotificationPanelProps {
  items: NotificationItem[]
  onReadAll?: () => void
  /** 예약 — NotificationCenter(2단계) 진입. 전달 시에만 '모두 보기' 푸터가 렌더된다 */
  onViewAll?: () => void
  align?: "start" | "end"
  className?: string
  defaultOpen?: boolean
}

function NotificationPanel({
  items,
  onReadAll,
  onViewAll,
  align = "end",
  className,
  defaultOpen,
}: NotificationPanelProps) {
  const unreadCount = items.filter((i) => i.unread).length
  const hasUnread = unreadCount > 0
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell />
          {hasUnread ? (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
          ) : null}
          <span className="sr-only">알림</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-80">
        <div className="flex items-center justify-between px-2 py-0.5">
          <span className="text-sm font-medium text-secondary-foreground">알림</span>
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 h-6 text-xs text-secondary-foreground"
            onClick={onReadAll}
            disabled={!hasUnread}
          >
            {hasUnread ? `새 알림 (${unreadCount})` : "모두 읽음"}
          </Button>
        </div>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.id} className="flex flex-col items-start gap-0.5">
            <span className="flex w-full items-center gap-2">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  item.unread ? "bg-primary" : "bg-transparent"
                )}
              />
              <span className="truncate text-sm font-medium">{item.title}</span>
            </span>
            <span className="pl-3.5 text-xs text-secondary-foreground">{item.ago}</span>
          </DropdownMenuItem>
        ))}
        {onViewAll ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-sm text-secondary-foreground"
              onSelect={onViewAll}
            >
              모두 보기
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { NotificationPanel }
