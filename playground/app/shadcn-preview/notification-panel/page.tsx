"use client";

// notification-panel 렌더 캡처 — 열린 패널(unread 2 + read 1)
import * as React from "react";
import { NotificationPanel } from "@ds/ui/ui/notification-panel";

const ITEMS = [
  { id: "1", title: "SVM_BUSAN_1 업데이트 완료", ago: "5분 전", unread: true },
  { id: "2", title: "hidom-ui 자가진단 이상 감지", ago: "32분 전", unread: true },
  { id: "3", title: "계약 SALES-0821 검토 요청", ago: "2시간 전" },
];

export default function Page() {
  return (
    // 우측 여백 최소화 — 허브 카드 iframe(420×500)이 이 영역을 그대로 담는다
    <div className="flex h-screen items-start justify-end bg-white pt-6 pr-6">
      <style>{`nextjs-portal { display: none; }`}</style>
      <NotificationPanel items={ITEMS} onReadAll={() => {}} defaultOpen />
    </div>
  );
}
