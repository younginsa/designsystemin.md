"use client";

// notification-panel 렌더 캡처 — 열린 패널(unread 2 + read 1)
// onReadAll은 실제로 unread를 해제한다(버튼 라벨 전이 '새 알림 (N)' → '모두 읽음' 시연).
// ?state=read 로 열면 전부 읽음 상태로 시작(헤드리스 캡처용 — 클릭 없이 두 상태 확보).
import * as React from "react";
import { NotificationPanel } from "@ds/ui/ui/notification-panel";

const ITEMS = [
  { id: "1", title: "SVM_BUSAN_1 업데이트 완료", ago: "5분 전", unread: true },
  { id: "2", title: "hidom-ui 자가진단 이상 감지", ago: "32분 전", unread: true },
  { id: "3", title: "계약 SALES-0821 검토 요청", ago: "2시간 전" },
];

export default function Page() {
  const [items, setItems] = React.useState(ITEMS);
  const readAll = React.useCallback(
    () => setItems((prev) => prev.map((i) => ({ ...i, unread: false }))),
    []
  );
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("state") === "read") readAll();
  }, [readAll]);
  return (
    // 우측 여백 최소화 — 허브 카드 iframe(420×500)이 이 영역을 그대로 담는다
    <div className="flex h-screen items-start justify-end bg-white pt-6 pr-6">
      <style>{`nextjs-portal { display: none; }`}</style>
      <NotificationPanel items={items} onReadAll={readAll} defaultOpen />
    </div>
  );
}
