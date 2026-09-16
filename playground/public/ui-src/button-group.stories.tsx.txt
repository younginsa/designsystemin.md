import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "./button"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group"

/* ButtonGroup 스토리 — 붙은 버튼 묶음(cva orientation horizontal · vertical: 이웃 모서리 0 · 테두리 겹침 제거). btn-split 카드(스플릿 드롭다운)는 button.stories Split 이 ButtonGroup 을 쓴다. @storybook import 0. */

export default {
  title: "DS/ButtonGroup",
  component: ButtonGroup,
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
}

export const Horizontal = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">일</Button>
      <Button variant="outline">주</Button>
      <Button variant="outline">월</Button>
    </ButtonGroup>
  ),
}

export const Split = {
  render: () => (
    <ButtonGroup>
      <Button>업데이트</Button>
      <ButtonGroupSeparator />
      <Button size="icon" aria-label="더 보기"><ChevronDown /></Button>
    </ButtonGroup>
  ),
}

export const WithText = {
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>IMO</ButtonGroupText>
      <Button variant="outline">9800685</Button>
    </ButtonGroup>
  ),
}

export const Vertical = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">위로</Button>
      <Button variant="outline">아래로</Button>
    </ButtonGroup>
  ),
}

export const __namedExportsOrder = ["Horizontal", "Split", "WithText", "Vertical"]
