# 커버리지 보고서

Storybook 목차 빌드 BIbnlWFW · 스냅샷 빌드 BIbnlWFW · 2026-10-16 08:36 UTC

게시 관문: 통과 — 목차의 모든 스토리 스냅샷 있음 · 빌드 하나

| 검사 | 통과 | 다름·오류 | 검사 안 함 | 제외 | 해당 없음 | 검사 안 하는 이유 |
|---|---|---|---|---|---|---|
| 스냅샷 | 213 | 0 | 0 | 13 | 0 |  |
| 렌더 대조(라이트) | 208 | 0 | 0 | 13 | 5 |  |
| 렌더 대조(다크) | 0 | 0 | 208 | 13 | 5 | 다크 모드 렌더 대조가 없다(fe:parity 는 라이트만) |
| 렌더 대조(컨트롤) | 0 | 0 | 208 | 13 | 5 | 컨트롤 모드 렌더 대조가 없다(fe:parity 는 라이트만) |
| 열림·호버·args 상태 대조 | 0 | 0 | 69 | 13 | 144 | 열린·호버·args 상태는 찍기만 하고 대조하지 않는다 |
| 우리 사본(@ds/ui) 대조 | 0 | 0 | 141 | 13 | 72 | 우리 사본(components/src/ui)을 Storybook 과 대조하는 검사가 없다 — 맥 프로토타입이 이것을 쓴다 |
| 피그마 컴포넌트 대조 | 0 | 0 | 208 | 13 | 5 | 피그마 컴포넌트 세트를 Storybook 과 대조하는 검사가 없다 |
| 토큰 값 | 22 | 3 | 492 | — | — | fe-values 는 --general-* 색과 font-feature-settings 만 읽는다. 가족별: color 0/89 · day 0/75 · dusk 0/75 · night 0/74 · general 22/22 · text 0/20 · gray 0/13 · red 0/10 · orange 0/10 · yellow 0/10 · green 0/10 · blue 0/10 · magenta 0/10 · olive 0/10 · black 0/10 · white 0/10 · container 0/8 · sidebar 0/8 · font 0/7 · tracking 0/5 · chart 0/5 · leading 0/4 · default 0/4 · radius 0/3 · product 0/3 · ease 0/2 · animate 0/2 · blur 0/2 · spacing 0/1 · aspect 0/1 · cell 0/1 |

목차에 없는 낡은 스냅샷 없음

## 컴포넌트별

| 컴포넌트 | 키 | 스토리 | 스냅샷 | 렌더(라이트) | 우리 사본 |
|---|---|---|---|---|---|
| Components/AppBreadcrumb | breadcrumb | 3 | 3/3 | 3/3 | 검사 안 함 |
| components/Badge | badge-ext | 4 | 4/4 | 4/4 | — |
| Components/BoardBox | page-header | 5 | 5/5 | 5/5 | 검사 안 함 |
| Components/CopyIconButton | copy-icon-button | 2 | 2/2 | 2/2 | — |
| Components/DataTable | table | 7 | 7/7 | 7/7 | 검사 안 함 |
| Components/EmptyState | empty | 4 | 4/4 | 4/4 | 검사 안 함 |
| components/filter/AddFilterButton | add-filter-button | 1 | 1/1 | 1/1 | — |
| components/filter/FilterBar | filter-bar | 4 | 4/4 | 4/4 | 검사 안 함 |
| components/filter/FilterOptions | filter-options | 2 | 2/2 | 2/2 | — |
| components/filter/FilterSelect | filter-select | 6 | 6/6 | 6/6 | — |
| components/form/SelectField | select-field | 8 | 8/8 | 8/8 | — |
| Components/InfoTooltip | info-tooltip | 4 | 4/4 | 4/4 | — |
| Components/LoadingSpinner | spinner | 2 | 2/2 | 2/2 | 검사 안 함 |
| Components/PageSizeSelect | rows-per-page | 2 | 2/2 | 2/2 | 검사 안 함 |
| components/PersonCell | person-cell | 2 | 2/2 | 2/2 | — |
| components/ProductBadge | product-badge | 7 | 7/7 | 7/7 | — |
| Components/ProductFilterHeader | product-filter-header | 3 | 3/3 | 3/3 | — |
| Components/ScrollTable | scroll-table | 2 | 2/2 | 2/2 | — |
| Components/SearchInput | search-box | 6 | 6/6 | 6/6 | 검사 안 함 |
| components/StatusBadge | status-badge | 5 | 5/5 | 5/5 | 검사 안 함 |
| Components/Stepper | stepper | 6 | 6/6 | 6/6 | 검사 안 함 |
| Components/TableFetchingOverlay | table-fetching-overlay | 2 | 2/2 | 2/2 | — |
| Components/UnderlineTabs | underline-tabs | 4 | 4/4 | 4/4 | — |
| Design Tokens/Color | foundation-color | 2 | 2/2 | 해당 없음 | — |
| Design Tokens/Icons | icons | 1 | 1/1 | 1/1 | — |
| Design Tokens/Typography | foundation-typography | 3 | 3/3 | 해당 없음 | — |
| Diagnostic/DiagnosticToolsPanel | diagnostic-tools-panel | 1 | 1/1 | 1/1 | — |
| Diagnostic/PodResourceGroupRow | pod-resource-group-row | 3 | 3/3 | 3/3 | — |
| Features/AddProduct/ProductConfigStep | —(미등록) | 3 | 0/3 | 0/3 | — |
| Features/Installation/ActivationRefreshButton | —(미등록) | 1 | 0/1 | 0/1 | — |
| Features/Installation/ActivationStatusBadge | —(미등록) | 5 | 0/5 | 0/5 | — |
| Features/ShipInfoDetail/ProductInfoSection | —(미등록) | 4 | 0/4 | 0/4 | — |
| Layout/AppShell | sidebar | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Accordion | accordion | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Alert | alert | 6 | 6/6 | 6/6 | 검사 안 함 |
| Primitives/AlertDialog | alert-dialog | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Avatar | avatar | 3 | 3/3 | 3/3 | — |
| Primitives/Badge | badge | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Button | button | 4 | 4/4 | 4/4 | 검사 안 함 |
| primitives/ButtonGroup | button-group | 4 | 4/4 | 4/4 | 검사 안 함 |
| Primitives/Calendar | calendar | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Card | card | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Chart | chart | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Checkbox | checkbox | 6 | 6/6 | 6/6 | 검사 안 함 |
| Primitives/Collapsible | collapsible | 1 | 1/1 | 1/1 | 검사 안 함 |
| Primitives/Command | command | 1 | 1/1 | 1/1 | 검사 안 함 |
| Primitives/Dialog | dialog | 4 | 4/4 | 4/4 | 검사 안 함 |
| Primitives/DropdownMenu | dropdown-menu | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Field | field | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Input | input | 4 | 4/4 | 4/4 | 검사 안 함 |
| primitives/InputGroup | input-group | 4 | 4/4 | 4/4 | 검사 안 함 |
| primitives/Item | item | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Label | label | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Pagination | pagination | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Popover | popover | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Progress | progress | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/RadioGroup | radio-group | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Select | select | 4 | 4/4 | 4/4 | 검사 안 함 |
| Primitives/Separator | separator | 2 | 2/2 | 2/2 | — |
| Primitives/Sheet | sheet | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Skeleton | skeleton | 3 | 3/3 | 3/3 | 검사 안 함 |
| Primitives/Switch | switch | 5 | 5/5 | 5/5 | 검사 안 함 |
| Primitives/Tabs | tabs | 2 | 2/2 | 2/2 | 검사 안 함 |
| Primitives/Textarea | textarea | 4 | 4/4 | 4/4 | 검사 안 함 |
| Primitives/Toast | sonner | 4 | 4/4 | 4/4 | 검사 안 함 |
| Primitives/Tooltip | tooltip | 2 | 2/2 | 2/2 | 검사 안 함 |
| Shared/ErrorIndicator | error-indicator | 2 | 2/2 | 2/2 | — |
| Shared/OptionSchemaRenderer | option-schema-renderer | 2 | 2/2 | 2/2 | — |
| Widgets/ShipActionButtons/ShipSpecHistoryModal | ship-spec-history-modal | 3 | 3/3 | 3/3 | — |
| Widgets/ShipInformationOverview/ShipOptionSection | ship-option-section | 3 | 3/3 | 3/3 | — |
