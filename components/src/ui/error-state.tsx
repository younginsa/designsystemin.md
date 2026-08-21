"use client"

// 에러 상태 배너 프리셋 — Alert 조합(새 엔진 아님). 4상태 계약의 '에러' 표준 시각.
// 컨테이너: 라운드 유지·테두리 없음·bg-destructive/5 반투명 틴트(불투명 혼합 기각).
// 아이콘: filled CircleAlert 18px — 원의 면 destructive·획(느낌표) card(흰색).
//   filled 아이콘 규칙: Lucide Circle 계열(CircleAlert·CircleCheck·CircleX·Info)만 허용
//   — Lucide는 스트로크 세트라 삼각형 등은 fill 시 뭉개진다.
// CTA: 본문 아래 16px, ghost sm + destructive/5 틴트 + RefreshCw "재시도".
// success/warning/info 톤 확장(StatusBanner화)은 추후 결정 — 지금은 에러 단일 톤.

import * as React from "react"
import { CircleAlert, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Button } from "./button"
import { cn } from "../lib/utils"

// HTML title 속성(string)과 충돌하므로 Omit — 프로덕션 타입체크(next build)가 이걸로 깨졌었다
interface ErrorStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: React.ReactNode
}

function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "재시도",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <Alert
      className={cn(
        "rounded-lg border-0 bg-destructive/5 px-5 py-4 [&>svg]:size-[18px] [&>svg]:translate-y-0",
        className
      )}
      {...props}
    >
      {/* stroke를 CSS 속성으로 직접 지정 — Alert의 [&>svg]:text-current가 color를 덮어써도 stroke="currentColor" 프레젠테이션 속성을 이긴다 */}
      <CircleAlert className="fill-destructive stroke-card [&_circle]:stroke-destructive" />
      <AlertTitle className="font-semibold text-foreground">{title}</AlertTitle>
      {description ? (
        <AlertDescription className="text-sm text-muted-foreground">
          {description}
        </AlertDescription>
      ) : null}
      {onRetry ? (
        <div className="col-start-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            className="bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onRetry}
          >
            <RefreshCw /> {retryLabel}
          </Button>
        </div>
      ) : null}
    </Alert>
  )
}

export { ErrorState }
