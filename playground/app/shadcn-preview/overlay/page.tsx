"use client";

// 내부 도구 — 포털형(오버레이) 컴포넌트의 열린 상태 캡처 전용.
// 사용: /shadcn-preview/overlay?c=dialog|sheet|menus|notif|tooltip|toast
// 900×600 뷰포트 전체를 캡처한다.

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@ds/ui/ui/badge";
import { Button } from "@ds/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Field, FieldLabel } from "@ds/ui/ui/field";
import { Input } from "@ds/ui/ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@ds/ui/ui/item";
import { Popover, PopoverContent, PopoverTrigger } from "@ds/ui/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ds/ui/ui/sheet";
import { Toaster } from "@ds/ui/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ds/ui/ui/tooltip";
import { toast } from "sonner";
import { Bell, ChevronDown, Info, Pencil, Settings2, Trash2 } from "lucide-react";

function Case() {
  const c = useSearchParams().get("c") ?? "dialog";

  useEffect(() => {
    if (c === "toast") {
      toast.success("업데이트가 시작되었습니다", {
        description: "SVM_BUSAN_1 · common v4.0.0",
      });
    }
  }, [c]);

  if (c === "dialog")
    return (
      <Dialog open>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>신규 호선 생성</DialogTitle>
            <DialogDescription>기본 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="d-imo">IMO Number <span className="text-destructive">*</span></FieldLabel>
            <Input id="d-imo" placeholder="예: 1234567" />
          </Field>
          <DialogFooter>
            <Button variant="outline">취소</Button>
            <Button>다음</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

  if (c === "sheet")
    return (
      <Sheet open>
        <SheetContent side="right" className="w-96">
          <SheetHeader>
            <SheetTitle>Quick View</SheetTitle>
            <SheetDescription>SVM_BUSAN_1</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <ItemGroup>
              <Item size="sm"><ItemContent><ItemDescription>Common</ItemDescription><ItemTitle>v3.4.2</ItemTitle></ItemContent></Item>
              <Item size="sm"><ItemContent><ItemDescription>Product</ItemDescription><ItemTitle>v3.4.0-rc.5</ItemTitle></ItemContent></Item>
              <Item size="sm"><ItemContent><ItemDescription>Agent</ItemDescription><ItemTitle><Badge variant="outline">Ready</Badge></ItemTitle></ItemContent></Item>
            </ItemGroup>
          </div>
        </SheetContent>
      </Sheet>
    );

  if (c === "menus")
    return (
      <div className="flex items-start gap-40 p-16">
        <DropdownMenu open>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">도구 및 관리 <ChevronDown /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>호선 관리</DropdownMenuLabel>
            <DropdownMenuItem><Pencil /> 정보 수정</DropdownMenuItem>
            <DropdownMenuItem><Settings2 /> 옵션 변경</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive"><Trash2 /> 제품 삭제</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover open>
          <PopoverTrigger asChild>
            <Button variant="outline">KST +9 <ChevronDown /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="text-sm font-medium">타임존</div>
            <div className="mt-2 rounded-md bg-accent px-2 py-1.5 text-sm">KST +9 · 2026-07-30</div>
            <div className="px-2 py-1.5 text-sm text-muted-foreground">UTC +0 · 2026-07-30</div>
          </PopoverContent>
        </Popover>
      </div>
    );

  if (c === "notif")
    return (
      <div className="p-16">
        <Popover open>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="알림"><Bell /></Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">알림 <Badge variant="secondary" className="rounded-full">3</Badge></span>
              <Button variant="ghost" size="sm">모두 읽음</Button>
            </div>
            <ItemGroup className="mt-2">
              <Item size="sm">
                <ItemContent>
                  <ItemTitle>업데이트 실패 확인 필요</ItemTitle>
                  <ItemDescription>EPS_RC-401 · control 업데이트 실패</ItemDescription>
                </ItemContent>
                <Badge variant="outline">Update</Badge>
              </Item>
              <Item size="sm">
                <ItemContent>
                  <ItemTitle>자가진단 이상 감지</ItemTitle>
                  <ItemDescription>navigation · disk 사용률 초과</ItemDescription>
                </ItemContent>
                <Badge variant="outline">Diagnostic</Badge>
              </Item>
            </ItemGroup>
          </PopoverContent>
        </Popover>
      </div>
    );

  if (c === "tooltip")
    return (
      <div className="p-24">
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="안내"><Info /></Button>
            </TooltipTrigger>
            <TooltipContent side="right">서버 타입은 설치 후 변경할 수 없습니다.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );

  return <Toaster position="bottom-right" />;
}

export default function OverlayPreview() {
  return (
    <main className="h-svh bg-background text-foreground">
      <style>{`nextjs-portal { display: none; }`}</style>
      <Suspense>
        <Case />
      </Suspense>
    </main>
  );
}
