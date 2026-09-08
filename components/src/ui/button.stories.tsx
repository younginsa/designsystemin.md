import * as React from "react"
import { ChevronDown, Copy, Download, Maximize2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"

import { Button } from "./button"
import { ButtonGroup } from "./button-group"
import { Spinner } from "./spinner"

/* Button 스토리 — 스파이크(2026-09-07, 옵션 3 역할 분리 검증).
 *
 * 형식은 Storybook CSF지만 **@storybook/* 를 하나도 import 하지 않는다.**
 * CSF는 "default export + 이름 붙은 객체 export"가 전부라서, Storybook 없이도
 * 그냥 자바스크립트 객체다. 그래서 두 소비자가 같은 파일을 읽을 수 있다:
 *   ① 365 허브 카드 — playground/app/hub/previews.tsx 가 직접 import (새 의존성 0)
 *   ② Storybook — 설치하면 이 파일을 그대로 인식
 *
 * parameters.vocab = 이 스토리가 어느 **채택 어휘 카드**에 속하는가.
 * 카드 목록은 approved.json 이 돌린다 — 여기 없는 어휘를 적으면 그냥 아무 데도 안 나온다
 * (실수하면 닫히는 쪽으로 떨어진다 · CLAUDE.md 6번 fail-closed 와 같은 방향).
 *
 * args = 설정을 값으로 분리해 적은 것. 이게 있어야 Storybook이 컨트롤 패널을 스스로 만든다.
 * 조합형(btn-split)은 args로 표현이 안 돼 render 로 떨어진다 — 컨트롤도 같이 포기된다.
 */

export default {
  title: "DS/Button",
  component: Button,
  // 컨트롤 패널 — 피그마 variant 패널의 코드 판. 선택지는 button.tsx 의 cva 정의와 같다.
  // (순수 데이터라 여전히 @storybook import 없음 · 365 는 이 필드를 무시한다)
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default", "destructive", "destructive-outline", "destructive-ghost", "primary-ghost",
        "outline", "secondary", "ghost", "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
}

/* ── btn-basic 「기본 버튼」 ─────────────────────────────────────── */

export const Filled = {
  args: { children: "채움" },
  parameters: { vocab: "btn-basic" },
}

export const Outline = {
  args: { variant: "outline", children: "아웃라인" },
  parameters: { vocab: "btn-basic" },
}

export const Ghost = {
  args: { variant: "ghost", children: "텍스트" },
  parameters: { vocab: "btn-basic" },
}

/* primary-ghost — 9/4에 코드에 들어갔지만 카드에는 그려지지 않던 변형.
   previews.tsx 를 손대지 않고 이 한 줄로 카드에 나타났다(스파이크 4번 항목 증명). */
export const PrimaryGhost = {
  args: { variant: "primary-ghost", children: "파랑 텍스트" },
  parameters: { vocab: "btn-basic" },
}

/* ── btn-destructive 「파괴 버튼」 ───────────────────────────────── */

export const Destructive = {
  args: { variant: "destructive", children: "삭제" },
  parameters: { vocab: "btn-destructive" },
}

export const DestructiveOutline = {
  args: { variant: "destructive-outline", children: "제품 삭제" },
  parameters: { vocab: "btn-destructive" },
}

/* ── btn-states 「비활성 · 로딩 변형」 ───────────────────────────── */

export const Disabled = {
  args: { disabled: true, children: "비활성" },
  parameters: { vocab: "btn-states" },
}

export const Loading = {
  args: {
    disabled: true,
    children: (
      <>
        <Spinner /> 처리 중…
      </>
    ),
  },
  parameters: { vocab: "btn-states" },
}

/* ── btn-icon 「아이콘 버튼」 ────────────────────────────────────── */

export const IconCopy = {
  args: { variant: "ghost", size: "icon", "aria-label": "복사", children: <Copy /> },
  parameters: { vocab: "btn-icon" },
}

export const IconRefresh = {
  args: { variant: "ghost", size: "icon", "aria-label": "새로고침", children: <RefreshCw /> },
  parameters: { vocab: "btn-icon" },
}

export const IconEdit = {
  args: { variant: "ghost", size: "icon", "aria-label": "편집", children: <Pencil /> },
  parameters: { vocab: "btn-icon" },
}

export const IconDelete = {
  args: { variant: "ghost", size: "icon", "aria-label": "삭제", children: <Trash2 /> },
  parameters: { vocab: "btn-icon" },
}

export const IconFullscreen = {
  args: { variant: "ghost", size: "icon", "aria-label": "전체화면", children: <Maximize2 /> },
  parameters: { vocab: "btn-icon" },
}

/* ── btn-dashed 「점선 추가 버튼」 ───────────────────────────────── */

export const Dashed = {
  args: {
    variant: "outline",
    className: "w-2/3 border-dashed",
    children: (
      <>
        <Plus /> Source 추가
      </>
    ),
  },
  parameters: { vocab: "btn-dashed" },
}

/* ── btn-split 「스플릿 드롭다운」 ───────────────────────────────── */
/* 조합형 — 버튼 하나가 아니라 ButtonGroup 묶음이라 args로 표현되지 않는다.
   render 로 내려가는 순간 자동 컨트롤 패널은 못 쓴다(스파이크 한계 항목 10번). */

export const Split = {
  parameters: { vocab: "btn-split" },
  render: () => (
    <ButtonGroup>
      <Button variant="outline">
        <Download /> 내보내기
      </Button>
      <Button variant="outline" size="icon" aria-label="옵션">
        <ChevronDown />
      </Button>
    </ButtonGroup>
  ),
}

/* 선언 순서 — 모듈에서 export 목록을 읽으면 **알파벳 순**으로 나온다(자바스크립트 규칙).
   그대로 두면 카드 안 버튼 차례가 뒤집힌다(2026-09-07 실측: 채움·아웃라인·텍스트 →
   채움·텍스트·아웃라인). Storybook은 이 배열을 컴파일러가 자동 생성해 해결한다 —
   지금은 스파이크라 손으로 적는다. 실제 도입 시 FE가 관리할 일은 없다. */
export const __namedExportsOrder = [
  "Filled", "Outline", "Ghost", "PrimaryGhost",
  "Destructive", "DestructiveOutline",
  "Disabled", "Loading",
  "IconCopy", "IconRefresh", "IconEdit", "IconDelete", "IconFullscreen",
  "Dashed",
  "Split",
]
