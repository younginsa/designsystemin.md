import { Button } from "@ds/ui/ui/button";
import { Input } from "@ds/ui/ui/input";
import { Badge } from "@ds/ui/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ds/ui/ui/table";

const users = [
  { name: "김항해", email: "kim@avikus.ai", role: "Admin", active: true },
  { name: "이선장", email: "lee@avikus.ai", role: "Viewer", active: true },
  { name: "박기관", email: "park@avikus.ai", role: "Editor", active: false },
];

export default function AdminUsers() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-card p-4">
        <p className="text-lg font-bold">Admin</p>
        <nav className="mt-6 space-y-1 text-sm">
          <p className="rounded-md bg-accent px-3 py-2 font-medium">회원 관리</p>
          <p className="px-3 py-2 text-muted-foreground">대시보드</p>
          <p className="px-3 py-2 text-muted-foreground">설정</p>
        </nav>
      </aside>

      <main className="flex-1 space-y-6 p-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">회원 관리</h1>
          <Button>유저 추가</Button>
        </header>

        <div className="flex gap-3">
          <Input placeholder="이름·이메일 검색" className="max-w-sm" />
          <Button variant="outline">필터</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.email}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
