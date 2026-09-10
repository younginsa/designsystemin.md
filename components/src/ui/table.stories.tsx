import * as React from "react"
import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "./badge"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

/* Table 스토리 — 허브 카드 data-table(테이블: 셀 변형 · 정렬 헤더) · data-matrix(매트릭스 편집 표) · data-perm(권한 매트릭스)의 원문.
 * 정렬 헤더 = Button ghost sm -ml-2 + ArrowUpDown. 셀 변형: 링크(primary underline) · 2줄(이름 + text-xs 보조) · Badge · 아이콘 액션 · —.
 * @storybook import 0. */

export default {
  title: "DS/Table",
  component: Table,
}

export const Basic = {
  parameters: { vocab: "data-table" },
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" size="sm" className="-ml-2">호선명 <ArrowUpDown /></Button>
          </TableHead>
          <TableHead>제품</TableHead>
          <TableHead>
            <Button variant="ghost" size="sm" className="-ml-2">생성일 <ArrowUpDown /></Button>
          </TableHead>
          <TableHead className="text-right">액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell><a href="#" className="text-primary underline underline-offset-4">SVM_BUSAN_1</a></TableCell>
          <TableCell><Badge variant="secondary">SVM</Badge></TableCell>
          <TableCell className="text-muted-foreground">2026-07-27</TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="icon" aria-label="편집"><Pencil /></Button>
            <Button variant="ghost" size="icon" aria-label="삭제"><Trash2 /></Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <div>CONTROL_TEST</div>
            <div className="text-xs text-muted-foreground">REAL_FINAL_TEST_1</div>
          </TableCell>
          <TableCell><Badge variant="secondary">CONTROL</Badge></TableCell>
          <TableCell className="text-muted-foreground">2026-07-23</TableCell>
          <TableCell className="text-right text-muted-foreground">—</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const Matrix = {
  parameters: { vocab: "data-matrix" },
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>COMMON</TableHead><TableHead>NAVIGATION</TableHead><TableHead>SVM</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-mono text-xs">v4.0.0</TableCell>
          <TableCell><Badge variant="outline" className="font-mono">v3.5.3 ★</Badge></TableCell>
          <TableCell><Button variant="ghost" size="icon" aria-label="추가"><Plus /></Button></TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">v3.5.0</TableCell>
          <TableCell><Badge variant="outline" className="font-mono">v3.5.0 ★</Badge></TableCell>
          <TableCell><Badge variant="outline" className="font-mono">v1.2.0</Badge></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const Permissions = {
  parameters: { vocab: "data-perm" },
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Permission</TableHead>
          <TableHead className="text-center">qa</TableHead>
          <TableHead className="text-center">dev</TableHead>
          <TableHead className="text-center">admin</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-mono text-xs">account:read</TableCell>
          <TableCell className="text-center"><Checkbox /></TableCell>
          <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
          <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-mono text-xs">account:update</TableCell>
          <TableCell className="text-center"><Checkbox /></TableCell>
          <TableCell className="text-center"><Checkbox /></TableCell>
          <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const __namedExportsOrder = ["Basic", "Matrix", "Permissions"]
