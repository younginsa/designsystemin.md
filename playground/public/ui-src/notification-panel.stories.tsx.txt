import * as React from "react"

import { NotificationPanel, type NotificationItem } from "./notification-panel"

/* NotificationPanel 스토리 — 알림 패널(ov-notif). Bell 트리거(unread 있으면 destructive 도트) + DropdownMenu 패널: 헤더 "새 알림 (N)" ↔ "모두 읽음" 전이, 항목(제목 · 경과 시간, unread 강조).
 * 허브 카드는 포털이라 /shadcn-preview/notification-panel 을 iframe 으로 담는다(같은 데이터). @storybook import 0. */

export default {
  title: "DS/NotificationPanel",
  component: NotificationPanel,
}

const ITEMS: NotificationItem[] = [
  { id: "1", title: "SVM_BUSAN_1 업데이트 완료", ago: "5분 전", unread: true },
  { id: "2", title: "hidom-ui 자가진단 이상 감지", ago: "32분 전", unread: true },
  { id: "3", title: "계약 SALES-0821 검토 요청", ago: "2시간 전" },
]

function Demo({ allRead = false }: { allRead?: boolean }) {
  const [items, setItems] = React.useState(allRead ? ITEMS.map((i) => ({ ...i, unread: false })) : ITEMS)
  const readAll = React.useCallback(() => setItems((prev) => prev.map((i) => ({ ...i, unread: false }))), [])
  return (
    <div className="flex w-96 justify-end">
      <NotificationPanel items={items} onReadAll={readAll} defaultOpen />
    </div>
  )
}

export const Unread = {
  parameters: { vocab: "ov-notif" },
  render: () => <Demo />,
}

export const AllRead = {
  render: () => <Demo allRead />,
}

export const __namedExportsOrder = ["Unread", "AllRead"]
