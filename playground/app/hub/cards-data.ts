// 자동 생성 — hub_extract.py 가 playground/public/index.html 의 채택 카드에서 추출
// slug=null 카드는 「예시」(원본 화면 썸네일 스트립). pv(사진) 필드는 실렌더 전환으로 은퇴(2026-08-26)
export type HubCard = { slug: string | null; name: string; prio?: string; shadcn?: string;
  shot?: string; crop?: string; ph?: [string, string]; shots?: string[] }
export type HubGroup = { title: string; cards: HubCard[] }
export const CARD_GROUPS: HubGroup[] = [
  {
    "title": "셸 · 내비게이션",
    "cards": [
      {
        "slug": null,
        "name": "예시",
        "shots": [
          "ships-list",
          "ship-detail"
        ]
      },
      {
        "slug": "app-shell",
        "name": "앱 셸",
        "shadcn": "Sidebar",
        "shot": "ships-list",
        "crop": "0,0,1920,1080"
      },
      {
        "slug": "sidebar-nav",
        "name": "사이드바 내비",
        "shadcn": "SidebarMenu",
        "shot": "ships-list",
        "crop": "0,55,215,720"
      },
      {
        "slug": "page-header",
        "name": "페이지 헤더",
        "shadcn": "조합",
        "shot": "ship-detail",
        "crop": "233,75,1450,60"
      },
      {
        "slug": "breadcrumb",
        "name": "브레드크럼",
        "prio": "P1",
        "shadcn": "Breadcrumb",
        "shot": "update-wizard",
        "crop": "225,10,570,35"
      },
      {
        "slug": "icon-select",
        "name": "아이콘 셀렉터 — 타입 3종: 아이콘형·텍스트형·다중형(체크박스)",
        "prio": "P1",
        "shadcn": "DropdownMenu 조합",
        "shot": "timezone",
        "crop": "1630,50,190,360"
      }
    ]
  },
  {
    "title": "버튼",
    "cards": [
      {
        "slug": null,
        "name": "예시",
        "shots": [
          "install-modal",
          "update-overview"
        ]
      },
      {
        "slug": "btn-basic",
        "name": "기본 버튼 (채움·아웃라인·텍스트)",
        "shadcn": "Button",
        "shot": "ship-detail",
        "crop": "1255,75,640,60"
      },
      {
        "slug": "btn-destructive",
        "name": "파괴 버튼",
        "shadcn": "Button(destructive)",
        "shot": "product-delete",
        "crop": "1070,640,150,60"
      },
      {
        "slug": "btn-states",
        "name": "비활성 · 로딩 변형",
        "shadcn": "Button+Spinner",
        "shot": "install-modal",
        "crop": "1120,630,225,140"
      },
      {
        "slug": "btn-split",
        "name": "스플릿 드롭다운",
        "shadcn": "ButtonGroup",
        "shot": "ships-list",
        "crop": "1760,115,150,55"
      },
      {
        "slug": "btn-icon",
        "name": "아이콘 버튼",
        "shadcn": "Button(icon)",
        "shot": "sysdiag-detail",
        "crop": "1555,30,340,50"
      },
      {
        "slug": "btn-dashed",
        "name": "점선 추가 버튼",
        "shadcn": "Button 변형",
        "shot": "topo-3",
        "crop": "730,630,455,60"
      },
      {
        "slug": "btn-fab",
        "name": "원형 FAB",
        "prio": "P3",
        "shadcn": "Button 변형",
        "shot": "diagnosis",
        "crop": "1595,1000,300,65"
      }
    ]
  },
  {
    "title": "폼",
    "cards": [
      {
        "slug": null,
        "name": "예시",
        "shots": [
          "version-options",
          "filter-modal",
          "release-editor"
        ]
      },
      {
        "slug": "form-text",
        "name": "텍스트 인풋 (필수·placeholder)",
        "shadcn": "Field+Input",
        "shot": "update-wizard",
        "crop": "575,875,630,160"
      },
      {
        "slug": "form-number",
        "name": "숫자 인풋",
        "shadcn": "Input(number)",
        "shot": "ship-create",
        "crop": "980,440,205,80"
      },
      {
        "slug": "form-search",
        "name": "검색 인풋",
        "shadcn": "InputGroup",
        "shot": "ships-list",
        "crop": "233,115,325,60"
      },
      {
        "slug": "search-box",
        "name": "검색 제안 (자동완성·최근·빠른검색)",
        "prio": "P1",
        "shadcn": "조합(InputGroup·Popover)"
      },
      {
        "slug": "form-textarea",
        "name": "텍스트에어리어 · 글자수",
        "shadcn": "Textarea 조합",
        "shot": "compat-add-2",
        "crop": "725,635,470,100"
      },
      {
        "slug": "form-select",
        "name": "셀렉트 계열",
        "prio": "P1",
        "shadcn": "Select·Combobox",
        "shot": "version-options",
        "crop": "795,260,620,95"
      },
      {
        "slug": "form-controls",
        "name": "체크박스 · 라디오 · 토글",
        "prio": "P1",
        "shadcn": "Checkbox·Radio·Switch",
        "shot": "version-options",
        "crop": "1115,425,330,440"
      },
      {
        "slug": "form-choicecard",
        "name": "라디오 · 체크 카드",
        "shadcn": "RadioGroup 조합",
        "shot": "ship-create",
        "crop": "735,330,480,190"
      },
      {
        "slug": "form-segment",
        "name": "3상태 세그먼트",
        "shadcn": "ToggleGroup",
        "shot": "filter-modal",
        "crop": "745,590,430,120"
      },
      {
        "slug": "form-tags",
        "name": "태그 인풋",
        "prio": "P2",
        "shadcn": "Badge+Input 조합",
        "shot": "ship-detail",
        "crop": "233,150,1200,80"
      },
      {
        "slug": "form-daterange",
        "name": "날짜 범위 피커",
        "prio": "P2",
        "shadcn": "Calendar(range)",
        "shot": "datepicker",
        "crop": "1120,220,395,250"
      },
      {
        "slug": "markdown-editor",
        "name": "마크다운 에디터",
        "prio": "P2",
        "shadcn": "없음",
        "shot": "release-editor",
        "crop": "650,235,625,510",
        "ph": [
          "UI 예정",
          "컴포넌트 제작 후 교체"
        ]
      },
      {
        "slug": "form-file",
        "name": "파일 첨부",
        "shadcn": "Input(file)",
        "shot": "release-editor",
        "crop": "650,780,625,90"
      },
      {
        "slug": "form-chipgrid",
        "name": "칩 멀티셀렉트 그리드",
        "prio": "P3",
        "shadcn": "ToggleGroup(multiple)",
        "shot": "compat-chips",
        "crop": "700,340,520,400"
      }
    ]
  },
  {
    "title": "데이터 표시",
    "cards": [
      {
        "slug": null,
        "name": "예시",
        "shots": [
          "compat",
          "sysdiag",
          "dashboard"
        ]
      },
      {
        "slug": "data-table",
        "name": "테이블",
        "shadcn": "Table",
        "shot": "ships-list",
        "crop": "233,185,1660,280"
      },
      {
        "slug": "data-kv",
        "name": "kv 정의 목록",
        "shadcn": "Item 조합",
        "shot": "ship-detail",
        "crop": "250,270,600,330"
      },
      {
        "slug": "data-colhead",
        "name": "정렬 · 컬럼 필터 헤더",
        "shadcn": "DataTable 패턴",
        "shot": "ships-colfilter",
        "crop": "1225,190,190,240"
      },
      {
        "slug": "data-cells",
        "name": "테이블 셀 변형 (링크·2줄·행 액션·중첩 헤더)",
        "shadcn": "Table 조합",
        "shot": "ships-list",
        "crop": "233,250,1660,150"
      },
      {
        "slug": "data-status",
        "name": "상태 필 · 도트",
        "prio": "P1",
        "shadcn": "Badge",
        "shot": "sysdiag",
        "crop": "1000,325,545,55"
      },
      {
        "slug": "data-badge",
        "name": "칩 · 뱃지",
        "shadcn": "Badge",
        "shot": "ships-list",
        "crop": "905,960,290,100"
      },
      {
        "slug": "data-verchip",
        "name": "버전 칩 (before→after)",
        "shadcn": "Badge(mono)",
        "shot": "update-wizard",
        "crop": "245,240,260,90"
      },
      {
        "slug": "data-roletag",
        "name": "역할 태그 칩",
        "prio": "P2",
        "shadcn": "Badge 조합",
        "shot": "accounts",
        "crop": "945,235,390,330"
      },
      {
        "slug": "stepper",
        "name": "스테퍼",
        "prio": "P1",
        "shadcn": "없음",
        "shot": "update-wizard",
        "crop": "600,150,1200,75",
        "ph": [
          "UI 예정",
          "컴포넌트 제작 후 교체"
        ]
      },
      {
        "slug": "data-matrix",
        "name": "매트릭스 편집 표",
        "prio": "P2",
        "shadcn": "Table 조합",
        "shot": "compat-edit",
        "crop": "233,355,1010,310"
      },
      {
        "slug": "data-perm",
        "name": "권한 매트릭스",
        "shadcn": "Table+Checkbox",
        "shot": "permissions",
        "crop": "233,150,1600,280"
      },
      {
        "slug": "data-stat",
        "name": "스탯 · 퍼널 · 랭킹",
        "prio": "P2",
        "shadcn": "Card 조합",
        "shot": "dashboard",
        "crop": "1005,130,890,170"
      },
      {
        "slug": "timeline",
        "name": "타임라인",
        "prio": "P1",
        "shadcn": "없음",
        "shot": "timeline-detail",
        "crop": "228,350,300,555",
        "ph": [
          "UI 예정",
          "컴포넌트 제작 후 교체"
        ]
      },
      {
        "slug": "data-accordion",
        "name": "아코디언",
        "prio": "P1",
        "shadcn": "Accordion",
        "shot": "diagnosis",
        "crop": "240,300,270,580"
      },
      {
        "slug": "data-tabs",
        "name": "탭 3종",
        "prio": "P1",
        "shadcn": "Tabs·ToggleGroup",
        "shot": "release-notes",
        "crop": "233,130,420,55"
      },
      {
        "slug": "data-pagination",
        "name": "페이지네이션",
        "prio": "P1",
        "shadcn": "Pagination",
        "shot": "sysdiag-detail",
        "crop": "1635,920,255,50"
      },
      {
        "slug": "heatmap",
        "name": "히트맵 그리드",
        "prio": "P2",
        "shadcn": "없음",
        "shot": "diagnosis-heatmap",
        "crop": "555,290,1340,420",
        "ph": [
          "UI 예정",
          "컴포넌트 제작 후 교체"
        ]
      },
      {
        "slug": "data-progress",
        "name": "진행률 바",
        "prio": "P2",
        "shadcn": "Progress",
        "shot": "progress",
        "crop": "545,450,1335,95"
      },
      {
        "slug": "data-tree",
        "name": "트리 목록",
        "shadcn": "Collapsible 조합",
        "shot": "compat-tree",
        "crop": "233,240,300,430"
      },
      {
        "slug": "data-listrow",
        "name": "리스트 행 (아이콘·라벨·카운트·셰브론)",
        "shadcn": "Item",
        "shot": "diagnosis-heatmap",
        "crop": "245,945,260,130"
      }
    ]
  },
  {
    "title": "피드백 · 오버레이",
    "cards": [
      {
        "slug": null,
        "name": "예시",
        "shots": [
          "update-result",
          "notif",
          "timeline-detail"
        ]
      },
      {
        "slug": "ov-dialog",
        "name": "모달",
        "shadcn": "Dialog·AlertDialog",
        "shot": "ship-create",
        "crop": "450,130,1020,830"
      },
      {
        "slug": "ov-sheet",
        "name": "슬라이드오버 패널",
        "prio": "P1",
        "shadcn": "Sheet",
        "shot": "sysdiag-detail",
        "crop": "1005,5,910,520"
      },
      {
        "slug": "detail-panel",
        "name": "상세 패널 (우측 시트 프리셋)",
        "prio": "P1",
        "shadcn": "Sheet 프리셋",
        "shot": "diag-quickview",
        "crop": "0,0,1920,1080"
      },
      {
        "slug": "ov-menus",
        "name": "드롭다운 메뉴",
        "prio": "P1",
        "shadcn": "DropdownMenu",
        "shot": "timezone",
        "crop": "1630,50,190,360"
      },
      {
        "slug": "ov-notif",
        "name": "알림 패널",
        "shadcn": "DropdownMenu 프리셋",
        "shot": "notif",
        "crop": "1420,55,435,570"
      },
      {
        "slug": "ov-popover",
        "name": "팝오버",
        "prio": "P1",
        "shadcn": "Popover"
      },
      {
        "slug": "fb-banner",
        "name": "배너 · 결과 카드",
        "prio": "P1",
        "shadcn": "Alert",
        "shot": "update-download",
        "crop": "595,350,1290,95"
      },
      {
        "slug": "fb-empty",
        "name": "빈 상태",
        "prio": "P1",
        "shadcn": "Empty",
        "shot": "bundle-compare",
        "crop": "870,770,390,180"
      },
      {
        "slug": "error-state",
        "name": "에러 상태 배너",
        "prio": "P1",
        "shadcn": "Alert 프리셋"
      },
      {
        "slug": "fb-console",
        "name": "에러 콘솔",
        "prio": "P2",
        "shadcn": "조합(mono 로그)",
        "shot": "timeline-detail",
        "crop": "525,585,1360,280"
      },
      {
        "slug": "ov-tooltip",
        "name": "툴팁 (ⓘ)",
        "prio": "P1",
        "shadcn": "Tooltip",
        "shot": "update-wizard",
        "crop": "1230,355,340,130"
      },
      {
        "slug": "fb-note",
        "name": "안내 노트",
        "shadcn": "Alert",
        "shot": "release-notes",
        "crop": "638,258,684,72"
      },
      {
        "slug": "ov-toast",
        "name": "토스트",
        "shadcn": "Sonner"
      },
      {
        "slug": "skeleton",
        "name": "스켈레톤 (로딩)",
        "shadcn": "Skeleton",
        "ph": [
          "캡처 예정",
          "기성품 — 미리보기 이미지만 미제작"
        ]
      },
      {
        "slug": "header-filter",
        "name": "헤더 필터바",
        "prio": "P1",
        "shadcn": "조합(InputGroup·DropdownMenu·Popover·Calendar)",
        "ph": [
          "캡처 예정",
          "프리뷰 라우트 제작 후 교체"
        ]
      }
    ]
  },
  {
    "title": "시각화",
    "cards": [
      {
        "slug": null,
        "name": "예시",
        "shots": [
          "diagnosis",
          "version-donut",
          "topology"
        ]
      },
      {
        "slug": "viz-line",
        "name": "라인 차트",
        "prio": "P2",
        "shadcn": "Chart(Line)",
        "shot": "diagnosis",
        "crop": "555,165,1340,370"
      },
      {
        "slug": "viz-donut",
        "name": "도넛 차트",
        "prio": "P2",
        "shadcn": "Chart(Pie)",
        "shot": "version-donut",
        "crop": "1240,210,660,470"
      },
      {
        "slug": "topology",
        "name": "노드-링크 토폴로지",
        "prio": "P3",
        "shadcn": "없음",
        "shot": "topology",
        "crop": "245,195,970,660",
        "ph": [
          "UI 예정",
          "컴포넌트 제작 후 교체"
        ]
      }
    ]
  }
]
