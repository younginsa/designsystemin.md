"use client";

// 기능별 계정권한 — 자리표시
// 원천 확인 결과: 피그마 「기능별 계정권한」 프레임의 캡처(localhost_5173_dev (6) 1)가
// 「계정 관리」 프레임의 캡처(… (6) 2)와 동일본이다 — 이 메뉴 고유 화면은 아직 없다.
// 발명하지 않고 자리만 잡는다. (예상: 역할 × 기능 권한 매트릭스 — data-perm 관례)

import Link from "next/link";
import { KeyRound, UserRound } from "lucide-react";

import { Button } from "@ds/ui/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@ds/ui/ui/empty";

const BASE = "/generated/hinas365";

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">기능별 계정권한</h1>

      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>화면 미확정</EmptyTitle>
          <EmptyDescription>
            피그마 원본에서 이 메뉴의 캡처가 「계정 관리」와 동일본입니다 — 고유 화면이 아직
            없습니다. 역할 × 기능 권한 매트릭스(data-perm)로 예상되며, 설계가 확정되면 채웁니다.
            계정별 역할 부여는 계정 관리에서 합니다.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={`${BASE}/accounts`}>
            <UserRound className="size-4" /> 계정 관리로 이동
          </Link>
        </Button>
      </Empty>
    </div>
  );
}
