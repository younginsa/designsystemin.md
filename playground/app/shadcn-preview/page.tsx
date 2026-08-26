"use client";

// 내부 도구 페이지 — 헤드리스 캡처·QA용 프리뷰 시트.
// 2026-08-26 허브 실렌더 전환: 섹션 정의는 app/hub/previews.tsx(단일 원천)로 이동했고
// 이 페이지는 같은 레지스트리를 원래의 #pv-<id> 섹션 순서로 나열만 한다.
// 허브(/hub) 채택 카드가 같은 노드를 라이브로 그리므로, 여기 수정하면 허브도 함께 바뀐다.
// 제품 페이지가 아니므로 배포 내비에 연결하지 않는다.

import { PREVIEWS, CAPTURE_EXTRAS, CAPTURE_ORDER } from "../hub/previews";

export default function ShadcnPreview() {
  return (
    <main className="flex flex-col gap-10 bg-background p-10 text-foreground">
      {/* 캡처 오염 방지 — Next dev 인디케이터 숨김 */}
      <style>{`nextjs-portal { display: none; }`}</style>
      {CAPTURE_ORDER.map((key) => {
        const pv = PREVIEWS[key] ?? CAPTURE_EXTRAS[key];
        if (!pv) return null;
        const id = "pv-" + (pv.captureId ?? key);
        return (
          <section key={key} id={id} className={pv.className} style={pv.style}>
            {pv.node}
          </section>
        );
      })}
    </main>
  );
}
