# Theme × dstk 대조표

자동 생성 — `pnpm ds:build`가 `dstk/figma-theme-snapshot.json`에서 만든다. 손 편집 금지.
피그마 원본: 「Theme × dstk 대조표」 노드 2807:24 (fileKey i5IhnacRAjg6NJdmtctfn2).
마지막 업데이트: 2026-08-25

| Theme 변수 | Light (Cloud) | Dark (SVM·NAS) | Control | dstk 토큰 |
|---|---|---|---|---|
| General/primary | Product/HiNAS Brand #4477F9 | Product/HiNAS Brand #348FF4 | Product/HiNAS Brand #348FF4 | primary |
| General/background | Basic Foreground/White/100 #FFFFFF | Dusk mode/Gray/200 #1B1C21 | Dusk mode/Gray/100 #15161A | background · card · popover · primary-foreground (Control만) |
| General/foreground | Day mode/Gray/700 #3C3E47 | Day mode/Gray/50 #F2F4F8 | Day mode/Gray/50 #F2F4F8 | foreground · card-foreground · popover-foreground · accent-foreground |
| General/on-color | Basic Foreground/White/100 #FFFFFF | Basic Foreground/White/100 #FFFFFF | Basic Foreground/White/100 #FFFFFF | primary-foreground (Light·Dark) · destructive-foreground |
| General/secondary | Day mode/Gray/20 #F9FAFB | Dusk mode/Gray/300 #23252B | Dusk mode/Gray/400 #3C3E47 | secondary |
| General/secondary-foreground | Day mode/Gray/600 #5D6275 | Dusk mode/Gray/800 #D0D2D9 | Dusk mode/Gray/800 #D0D2D9 | secondary-foreground |
| General/muted | Day mode/Gray/50 #F2F4F8 | Dusk mode/Gray/350 #2F323B | Dusk mode/Gray/350 #2F323B | muted |
| General/muted-foreground — 흐림 톤 전용 — 오적용 427곳 교정 완료(가독 보조 텍스트는 secondary-foreground) | Basic Foreground/Black/20 #00000033 | Basic Foreground/White/20 #FFFFFF33 | Basic Foreground/White/20 #FFFFFF33 | muted-foreground |
| General/accent — 반투명 오버레이 — 면 위에 합성되므로 어느 표면에서도 분리도가 균일하다(불투명 Gray/100은 muted 위에서 1.063으로 사실상 소실됐다) | Basic Foreground/Black/6 #0000000F | Basic Foreground/White/12 #FFFFFF1F | Basic Foreground/White/12 #FFFFFF1F | accent |
| General/destructive | Dusk mode/SemanticRed/600 #FF5B5B | Day mode/SemanticRed/500 #FA454E | Dusk mode/SemanticRed/100 #A50000 | destructive |
| General/border | Day mode/Gray/100 #ECEDF0 | Basic Foreground/White/8 #FFFFFF14 | Basic Foreground/White/8 #FFFFFF14 | border |
| General/input — placeholder 텍스트용 확정(검색·입력 placeholder 글자색) — 폼 테두리는 border | Day mode/Gray/500 #858998 | Dusk mode/Gray/600 #858998 | Dusk mode/Gray/600 #858998 | input |
| General/ring | Day mode/Gray/200 #DBDEE8 | Dusk mode/Gray/400 #3C3E47 | Dusk mode/Gray/400 #3C3E47 | ring |
| Product/HiNAS Brand | (고유값) #4477F9 | Dusk mode/SemanticBlue/500 #348FF4 | Dusk mode/SemanticBlue/500 #348FF4 | (참조 전용) |
| Product/Cyber security | Dusk mode/SemanticBlue/300 #0367E0 | Dusk mode/SemanticBlue/300 #0367E0 | Dusk mode/SemanticBlue/300 #0367E0 | (참조 전용) |
| General/success | Day mode/SemanticGreen/500 #24A148 | Day mode/SemanticGreen/500 #24A148 | Day mode/SemanticGreen/500 #24A148 | success |
| Chart/chart-1 | Day mode/SemanticBlue/800 #002D9C | Day mode/SemanticBlue/800 #002D9C | Day mode/SemanticBlue/800 #002D9C | chart-1 |
| Chart/chart-2 | Day mode/SemanticBlue/700 #0043CE | Day mode/SemanticBlue/700 #0043CE | Day mode/SemanticBlue/700 #0043CE | chart-2 |
| Chart/chart-3 | Day mode/SemanticBlue/600 #0F62FE | Day mode/SemanticBlue/600 #0F62FE | Day mode/SemanticBlue/600 #0F62FE | chart-3 |
| Chart/chart-4 | Day mode/SemanticBlue/400 #78A9FF | Day mode/SemanticBlue/400 #78A9FF | Day mode/SemanticBlue/400 #78A9FF | chart-4 |
| Chart/chart-5 | Day mode/SemanticBlue/200 #D0E2FF | Day mode/SemanticBlue/200 #D0E2FF | Day mode/SemanticBlue/200 #D0E2FF | chart-5 |

## Theme 외 dstk 토큰 (상태 축·램프·비색상)

| 토큰 | 참조 | 비고 |
|---|---|---|
| radius | `{radius.base}` |  |
| shadow-card | `0 0 12px 0 color-mix(in srgb, var(--border) 55%, transparent)` | D 대시보드 카드 그림자 — border 55% 농도, 모드 자동 |
