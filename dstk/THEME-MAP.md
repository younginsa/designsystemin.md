# Theme × dstk 대조표

자동 생성 — `pnpm ds:build`가 `dstk/figma-theme-snapshot.json`에서 만든다. 손 편집 금지.
피그마 원본: 「Theme × dstk 대조표」 노드 2806:24 (fileKey i5IhnacRAjg6NJdmtctfn2).
마지막 업데이트: 2026-08-21

| Theme 변수 | Light (Cloud) | Dark (SVM·NAS) | Control | dstk 토큰 |
|---|---|---|---|---|
| General/background-card-popover-primaryF | Basic Foreground/White/100 #FFFFFF | Dusk mode/Gray/200 #1B1C21 | Dusk mode/Gray/100 #15161A | background · card · popover · primary-foreground |
| General/foreground-card-popover | Day mode/Gray/700 #3C3E47 | Day mode/Gray/50 #F2F4F8 | Day mode/Gray/50 #F2F4F8 | foreground · card-foreground · popover-foreground |
| General/primary | Product/HiNAS Brand #4477F9 | Product/HiNAS Brand #348FF4 | Product/HiNAS Brand #348FF4 | primary |
| General/primary-accent | Dusk mode/SemanticBlue/400 #1379F3 | Dusk mode/SemanticBlue/400 #1379F3 | Dusk mode/SemanticBlue/400 #1379F3 | primary-accent |
| General/secondary | Day mode/Gray/20 #F9FAFB | Dusk mode/Gray/300 #23252B | Dusk mode/Gray/400 #3C3E47 | secondary |
| General/secondary-foreground | Day mode/Gray/600 #5D6275 | Dusk mode/Gray/800 #D0D2D9 | Dusk mode/Gray/800 #D0D2D9 | secondary-foreground |
| General/muted | Day mode/Gray/50 #F2F4F8 | Dusk mode/Gray/350 #2F323B | Dusk mode/Gray/350 #2F323B | muted |
| General/muted-foreground | Basic Foreground/Black/20 #00000033 | Basic Foreground/White/20 #FFFFFF33 | Basic Foreground/White/20 #FFFFFF33 | muted-foreground |
| General/accent | Day mode/Gray/10 #FBFBFB | Dusk mode/Gray/400 #3C3E47 | Dusk mode/Gray/300 #23252B | accent |
| General/accent-foreground | Day mode/Gray/700 #3C3E47 | Day mode/Gray/50 #F2F4F8 | Day mode/Gray/50 #F2F4F8 | accent-foreground |
| General/destructive | Dusk mode/SemanticRed/600 #FF5B5B | Day mode/SemanticRed/500 #FA454E | Dusk mode/SemanticRed/100 #A50000 | destructive |
| General/border | Day mode/Gray/100 #ECEDF0 | Basic Foreground/White/8 #FFFFFF14 | Basic Foreground/White/8 #FFFFFF14 | border |
| General/input | Day mode/Gray/500 #858998 | Dusk mode/Gray/600 #858998 | Dusk mode/Gray/600 #858998 | input |
| General/ring | Day mode/Gray/200 #DBDEE8 | Dusk mode/Gray/400 #3C3E47 | Dusk mode/Gray/400 #3C3E47 | ring |
| Sidebar/background | Day mode/Gray/10 #FBFBFB | Dusk mode/Gray/100 #15161A | Dusk mode/Gray/100 #15161A | sidebar |
| Sidebar/foreground | Day mode/Gray/600 #5D6275 | Dusk mode/Gray/800 #D0D2D9 | Dusk mode/Gray/800 #D0D2D9 | sidebar-foreground |
| Sidebar/primary | Product/Cyber security #0367E0 | Product/Cyber security #0367E0 | Product/Cyber security #0367E0 | sidebar-primary |
| Sidebar/accent | Day mode/Gray/50 #F2F4F8 | Dusk mode/Gray/350 #2F323B | Dusk mode/Gray/350 #2F323B | sidebar-accent |
| Sidebar/accent-foreground | Day mode/Gray/700 #3C3E47 | Day mode/Gray/50 #F2F4F8 | Day mode/Gray/50 #F2F4F8 | sidebar-accent-foreground |
| Sidebar/border | Dusk mode/Gray/700 #B0B3BF | Dusk mode/Gray/500 #535661 | Dusk mode/Gray/500 #535661 | sidebar-border |
| Sidebar/ring | Day mode/Gray/200 #DBDEE8 | Dusk mode/Gray/400 #3C3E47 | Dusk mode/Gray/400 #3C3E47 | sidebar-ring |
| Chart/background | Day mode/SemanticBlue/100 #EDF5FF | Basic Foreground/White/6 #FFFFFF0F | Basic Foreground/White/6 #FFFFFF0F | chart-background |
| Chart/primary | Product/Cyber security #0367E0 | Product/Cyber security #0367E0 | Product/Cyber security #0367E0 | chart-primary |
| Chart/gray | Day mode/Gray/600 #5D6275 | Day mode/Gray/600 #5D6275 | Day mode/Gray/600 #5D6275 | chart-gray |
| Chart/yellow | Day mode/SemanticOrange/300 #FF9639 | Day mode/SemanticOrange/300 #FF9639 | Day mode/SemanticOrange/300 #FF9639 | chart-yellow |
| Chart/red | Day mode/SemanticRed/600 #DA1E28 | Day mode/SemanticRed/600 #DA1E28 | Day mode/SemanticRed/600 #DA1E28 | chart-red |
| Chart/green | Day mode/SemanticGreen/500 #24A148 | Day mode/SemanticGreen/500 #24A148 | Day mode/SemanticGreen/500 #24A148 | chart-green |
| Product/HiNAS Brand | (고유값) #4477F9 | Dusk mode/SemanticBlue/500 #348FF4 | Dusk mode/SemanticBlue/500 #348FF4 | (참조 전용) |
| Product/Cyber security | Dusk mode/SemanticBlue/300 #0367E0 | Dusk mode/SemanticBlue/300 #0367E0 | Dusk mode/SemanticBlue/300 #0367E0 | (참조 전용) |

## Theme 외 dstk 토큰 (상태 축·램프·비색상)

| 토큰 | 참조 | 비고 |
|---|---|---|
| destructive-foreground | `{"light":"{palette.basic.white.100}","dark":"{palette.basic.white.100}","control":"{palette.basic.white.100}"}` |  |
| success | `{palette.green.anchor}` | Theme 외 — 상태 축(모드별 조명 매핑으로 해석) |
| info | `{palette.blue.anchor}` | Theme 외 — 상태 축 |
| info-foreground | `{palette.basic.white.100}` |  |
| warning | `{palette.orange.anchor}` | Theme 외 — 상태 축. yellow는 차트·면 틴트용 유보 |
| chart-1 | `{palette.blue.800}` |  |
| chart-2 | `{palette.blue.700}` |  |
| chart-3 | `{palette.blue.600}` |  |
| chart-4 | `{palette.blue.400}` |  |
| chart-5 | `{palette.blue.200}` |  |
| radius | `{radius.base}` |  |
| shadow-card | `0 0 12px 0 color-mix(in srgb, var(--border) 55%, transparent)` | D 대시보드 카드 그림자 — border 55% 농도, 모드 자동 |
