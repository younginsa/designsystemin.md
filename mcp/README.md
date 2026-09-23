# HiNAS 365 DS — MCP 서버 (claude.ai 커넥터)

claude.ai 앱(웹·데스크톱)이 DS 를 읽고 **단독 HTML 한 장**으로 화면을 만들게 하는 플러그다.
저장소·DB 없이 **배포 사이트의 정적 파일만** 읽는다(`https://designsystemin-md.vercel.app`) — 푸시마다 자동 최신.

## 무엇을 주나 (도구 7종)

| 도구 | 답 |
|---|---|
| `list_components` | Storybook 에 있는 컴포넌트 전부(= 어휘) — key·이름·스토리 목록·Storybook 문서 URL |
| `get_component` | 한 컴포넌트의 노트·소스·스토리 소스·**스토리별 렌더 HTML 스니펫**(복사해서 쓴다) |
| `get_tokens` | 시맨틱 색(모드별 hex + 팔레트 참조)·허용 틴트·타이포 |
| `get_layout` | 레이아웃 프레임 목록 + 본문 패턴(A 리스트·B 상세·C 위저드·D 대시보드·E) |
| `get_generation_contract` | 단독 HTML 출력 규약 + CLAUDE.md 생성 절차 + design.md 규칙서 |
| `get_css_bundle` | `/ds.css` 링크 태그(토큰·유틸리티·컴포넌트 클래스 전부) |
| `check_html` | 자가 검사 — 임의 hex·임의 값·인라인 style·없는 클래스·틴트·4상태·상태 필 + 미채택 마커 목록 |

원천 파일(전부 `pnpm build` 산출): `/ds-registry.json` · `/dstk/semantic-map.json` · `/dstk/typography.json` · `/dstk/contrast-pairs.json` ·
`/docs/*`(CLAUDE.md·design.md·layout·regulations) · `/ui-src/*.txt` · `/story-html/*` · `/props/*`(컴포넌트 프롭, react-docgen-typescript) · `/ds.css`.

## /render — 스토리 라이브 렌더 (2026-09-21 Phase 1)

같은 Vercel 프로젝트의 두 번째 함수(`api/render.ts`). 접근 값 없이 열린다 — 정적 스니펫과 같은 내용이고, claude.ai 채팅은 헤더를 못 붙인다.

| 주소 | 답 |
|---|---|
| `GET /render` | 컴포넌트 키 목록 + 번들 생성일 |
| `GET /render/<컴포넌트>` | 그 컴포넌트의 스토리 목록(경로 포함) |
| `GET /render/<컴포넌트>/<스토리>` | 렌더된 HTML(`text/html`). 스토리 이름은 PascalCase·kebab 둘 다. 부품(스토리 없음)은 404 |
| `GET /render/<컴포넌트>/<스토리>?args={…}` | (Phase 2) 스토리 args 위에 덮어 다른 상태를 렌더. 허용 키 = 스토리 args 키 ∪ `/props/<키>.json` 의 propNames ∪ children(문자열). className·style·on* 거부, 4KB 상한, args 를 안 받는 스토리(render: () => …)는 400 |

동작: `buildCommand`(`scripts/bundle-stories.mjs`)가 `components/src/ui/*.stories.tsx` 전부 + 렌더 코어(`playground/scripts/story-render-core.tsx`)를
esbuild 로 `dist/stories.mjs` 한 파일(약 4.5 MB, React 한 벌)에 묶고, 함수가 요청마다 거기서 스토리를 꺼내 `renderToStaticMarkup` 한다.
정적 스니펫(`/story-html`)과 **같은 함수**를 쓰므로 결과는 바이트 단위로 같아야 한다 — `pnpm mcp:test:render`(로컬)와
`pnpm audit:published` F 섹션(배포)이 159편 전수 대조한다. 왜 두 경로인가: 정적 스니펫은 "한 상태의 사진"이라 값이 있을 때만 나오는 UI 가 안 찍힌다.
Phase 2 에서 `?args=` 로 프롭을 바꿔 그 천장을 넘는다(이 엔드포인트가 그 자리다).

## 배포 (Vercel 두 번째 프로젝트 — 관리자 1회)

1. Vercel → Add New Project → 같은 저장소(designsystemin.md) 선택.
2. **Root Directory = `mcp`** (Include source files outside of the Root Directory 켜짐 유지).
3. Framework Preset = Other. 대시보드 Override 는 전부 끈다 — Install·Build Command·Output Directory 는 `mcp/vercel.json` 이 지정한다
   (2026-09-21: buildCommand = 스토리 번들, outputDirectory = `public`). **Other 프레임워크에 Build Command 가 있으면 Output Directory 가
   있어야 한다** — 없으면 빌드가 실패하고 이전 배포가 그대로 남아 새 함수만 404 로 보인다(Phase 1 첫 배포에서 30분 헤맴).
4. Environment Variables:
   - `DS_MCP_ACCESS` = 공유 값(팀만 아는 문자열, 길게). 미설정이면 503 으로 닫혀 있다(fail-closed).
   - `DS_BASE` (선택) = 원천 사이트. 기본 `https://designsystemin-md.vercel.app`.
5. Deploy → 엔드포인트 `https://<프로젝트>.vercel.app/mcp`.

## claude.ai 연결 (조직 관리자 1회)

Settings → Connectors → **Add custom connector** → URL 입력.

- 헤더를 붙일 수 있으면: URL `https://<프로젝트>.vercel.app/mcp` + 헤더 `x-ds-access: <공유 값>`.
- 커넥터 UI 가 헤더를 못 붙이면(현재 claude.ai 기본): **URL 에 값을 넣는다** `https://<프로젝트>.vercel.app/mcp/<공유 값>`.

연결 후 팀 프로젝트 "DS 페이지 생성"을 만들고 아래를 프로젝트 지침으로 넣는다:

```
너는 HiNAS 365 디자인 시스템으로 화면 목업을 만드는 도우미다. 커넥터 "hinas-365-ds" 만 쓴다.
1. 요청을 받으면 먼저 get_generation_contract 를 읽는다.
2. get_layout 으로 프레임 목록을 보고 "어느 프레임의 본문인가, 단독 화면인가"를 번호 선택지로 묻는다. 답 없이는 만들지 않는다.
3. list_components 의 컴포넌트만 쓴다. 쓰려는 컴포넌트마다 get_component 로 스니펫을 받아 복사하고 내용만 바꾼다. 목록에 없는 요소는 미채택 마커로 감싼다.
4. 산출물은 HTML 파일 한 장(규약대로 /ds.css 링크 · 4상태 섹션 · 상단 상태 필). 코드 블록이 아니라 다운로드 가능한 파일로 준다.
5. 완성 전 check_html 로 검사해 위반 0 을 만든다. 보고 끝에 미채택 목록(컴포넌트 · 자리 · 이유)을 적는다 — 디자이너가 Jira DES 로 판정한다.
```

## 로컬 검증

```
pnpm mcp:artifacts                      # docs · ds.css · story-html 생성(빌드 전 단계와 동일)
pnpm dev                                # :3000 이 산출물을 서빙
DS_BASE=http://localhost:3000 pnpm mcp:test   # 인메모리 전송으로 도구 7종 실제 호출
DS_MCP_ACCESS=test DS_BASE=http://localhost:3000 pnpm --filter @ds/mcp dev   # http://localhost:8787/mcp/test · /render/<컴포넌트>/<스토리>
pnpm mcp:bundle                          # dist/stories.mjs 생성(/render 전제, Vercel 은 buildCommand 로 자동)
DS_BASE=http://localhost:3000 pnpm mcp:test:render   # 번들 렌더 ↔ 정적 스니펫 159편 바이트 대조
```

## 경계

- 읽기 전용. 저장소·피그마·Jira 를 쓰지 않는다(Jira 자동 발행은 다음 배치).
- 커넥터가 여는 것은 사이트에 이미 공개된 문서·코드뿐 — 공유 값은 무단 사용을 막는 문턱이지 비밀 자료 보호가 아니다.
- `/render` 는 공유 값 없이 열린다(정적 스니펫과 같은 내용). Phase 2 의 `?args=` 가 붙으면 남용 시 문턱을 다시 판단한다.
- 클론·세션(Claude Code) 경로는 그대로다 — 이 서버는 claude.ai 앱 경로 전용.
