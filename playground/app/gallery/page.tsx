import Link from "next/link";
import { Button } from "@ds/ui/ui/button";
import { Input } from "@ds/ui/ui/input";
import { Label } from "@ds/ui/ui/label";
import { Badge } from "@ds/ui/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ds/ui/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@ds/ui/ui/alert";
import { Separator } from "@ds/ui/ui/separator";
import { Skeleton } from "@ds/ui/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";

const semanticColors = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
  "success",
  "border",
  "ring",
];

export default function Gallery() {
  return (
    <main className="mx-auto max-w-4xl space-y-10 p-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">디자인 시스템 갤러리</h1>
        <p className="text-muted-foreground">
          토큰과 컴포넌트 미리보기. 원천은 dstk/*.json과 design.md.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/samples/admin-users">샘플: 어드민 회원 관리</Link>
        </Button>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">시맨틱 컬러</h2>
        <div className="grid grid-cols-5 gap-3">
          {semanticColors.map((name) => (
            <div key={name} className="space-y-1">
              <div
                className="h-12 rounded-md border"
                style={{ background: `var(--${name})` }}
              />
              <p className="text-xs text-muted-foreground">--{name}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">타이포그래피</h2>
        <p className="text-3xl font-bold">페이지 제목 3xl/bold</p>
        <p className="text-xl font-semibold">섹션 제목 xl/semibold</p>
        <p className="text-base">본문 base — 기본 텍스트 크기입니다.</p>
        <p className="text-sm text-muted-foreground">보조 텍스트 sm/muted</p>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">컴포넌트</h2>

        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge>기본</Badge>
          <Badge variant="secondary">보조</Badge>
          <Badge variant="outline">아웃라인</Badge>
          <Badge variant="destructive">위험</Badge>
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="grid max-w-sm gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" placeholder="name@avikus.ai" />
        </div>

        <Alert>
          <AlertTitle>안내</AlertTitle>
          <AlertDescription>
            이 페이지의 모든 색상은 시맨틱 토큰만 사용합니다.
          </AlertDescription>
        </Alert>

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>카드 + 테이블</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>홍길동</TableCell>
                  <TableCell>
                    <Badge>활성</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>김철수</TableCell>
                  <TableCell>
                    <Badge variant="secondary">비활성</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
