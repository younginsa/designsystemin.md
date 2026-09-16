import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog"

/* AlertDialog 스토리 — 확인 모달(ov-dialog 의 파괴 확인형). size default(max-w-lg) · sm(max-w-xs). Action = 파괴 액션이면 destructive. @storybook import 0. */

export default {
  title: "DS/AlertDialog",
  component: AlertDialog,
}

export const Destructive = {
  parameters: { vocab: "ov-dialog" },
  render: () => (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>제품을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>SVM_BUSAN_1 의 Navigation 2.0.0 납품 이력이 함께 삭제됩니다. 되돌릴 수 없습니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive">삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const __namedExportsOrder = ["Destructive"]
