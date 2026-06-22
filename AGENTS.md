# AGENTS.md

## 项目概述

Racing Arcade Admin 是一个 sim racing 平台"Racing Arcade"的**纯前端管理后台原型**。所有数据来自 `src/data/` 下的 mock 文件，没有真实后端。状态通过 `localStorage` 持久化（`data/store.ts`）。部署在 GitHub Pages。

## 技术栈

- React 19 + TypeScript (~6.0)
- Vite 8（构建工具）
- TailwindCSS 4（使用 `@import "tailwindcss"` 语法，不是 v3 的 config 文件方式）
- React Router 7（BrowserRouter）
- i18next + react-i18next（中英文双语）
- lucide-react（图标）
- clsx + tailwind-merge（通过 `cn()` 工具函数合并样式）
- `useSyncExternalStore`（自建轻量外部 store，`data/store.ts`）

## 项目结构

```
src/
├── App.tsx                    # 路由定义，BrowserRouter basename="/Racing-Arcade-Admin"
├── main.tsx                   # 入口，启动时调用 hydrate() 恢复 localStorage 状态
├── index.css                  # TailwindCSS 4 入口（@import "tailwindcss"）
├── components/
│   ├── layout/
│   │   └── AdminLayout.tsx    # 侧边栏 + 顶栏布局，<main> 无 padding；末尾挂载 <FlowAssistant/>
│   ├── FlowAssistant.tsx      # ★ 浮窗式引导助手（默认待机，点「开始引导」才介入）
│   ├── PenaltyModal.tsx       # ★ 通用判罚弹窗（5 种判罚，成绩页与抗议页共用）
│   └── ui/                    # 基础 UI 组件库
│       ├── Button.tsx         # variant: primary | secondary | ghost | danger；size: sm | md | lg
│       ├── Card.tsx           # padding?: boolean (默认 true)，不支持 onClick
│       ├── Input.tsx          # forwardRef，label, value/onChange, defaultValue, error?
│       ├── Select.tsx         # label, options({value,label}), value/onChange, defaultValue（无 forwardRef）
│       ├── Textarea.tsx       # forwardRef，label, value/onChange, defaultValue, error?
│       ├── DataTable.tsx      # 泛型 <T>，columns, data, onRowClick?, keyExtractor, emptyMessage?
│       ├── StatusBadge.tsx    # status (string), label (string)，颜色由 statusColor() 决定
│       ├── Modal.tsx          # isOpen, onClose, title, children, size?(sm|md|lg|xl|2xl)
│       ├── ImageUpload.tsx    # label, value/onChange, defaultValue, aspectRatio?(video|square|banner)
│       └── Badge.tsx, EmptyState.tsx, Pagination.tsx（单页时自动隐藏）
├── data/                      # Mock 数据 + 持久化（所有数据的唯一来源）
│   ├── store.ts               # ★ useSyncExternalStore 外部 store + localStorage 持久化
│   ├── competitions.ts        # ★ 主数据模型：Competition → Round → Stage → Session/Split（见下）
│   ├── registrations.ts       # ★ 报名记录 Registration（driver↔round，status/payment/split/platformId）
│   ├── servers.ts             # ★ 服务器实例 ServerInstance（开服状态/日志模拟）
│   ├── demoScenario.ts        # ★ 演示赛事生成/重置（供 FlowAssistant 使用的端到端示例）
│   ├── options.ts             # ManagedOption + OptionGroup，13 个下拉选项组（6 个分类）
│   ├── admin.ts               # BanRecord、DashboardStats、ResultChangeLog
│   ├── drivers.ts             # Driver 接口 + 25 个车手
│   ├── teams.ts               # Team 接口 + 6 个车队
│   ├── news.ts                # NewsArticle 接口 + 5 条新闻
│   ├── protests.ts            # Protest 接口（绑定 competitionId/roundId/stageId/sessionId）+ 4 条抗议
│   └── notifications.ts       # Notification 接口 + addNotification() 助手 + 8 条通知
├── hooks/
│   ├── useAppStore.ts         # AppContext：isLoggedIn, currentUser, language（默认从 localStorage 读）, sidebarCollapsed
│   └── useManagedOptions.ts   # 从 options.ts 生成 Select 兼容的 options 数组，可传 allLabel
├── i18n/
│   ├── index.ts               # i18next 初始化
│   ├── en.ts / zh.ts          # 翻译（16 个命名空间，必须键一致）
├── lib/
│   ├── utils.ts               # cn(), formatDate(), formatDateTime(), statusColor(), ScoringTableEntry, getCompetitionStatus(), getRoundStatus()
│   ├── results.ts             # 成绩计算：findStageById(), getPointsForPosition(), getStageResultStatus()/getSessionResultStatus(), getRaceSessionId(), calculate*Standings()（均支持 sessionId 过滤）
│   ├── serverResults.ts       # 模拟服务器生成比赛成绩（种子化伪随机，从 entryList/报名车手生成 race 成绩）
│   ├── stageOps.ts            # ★ 开服/发布：startStageServers(), isStageServerRunning(), publishStageResults()
│   ├── advancement.ts         # ★ 晋级：computeAdvancers()/applyAdvancement()（position/points/lapTime 三种 metric）
│   ├── registrationOps.ts     # ★ 报名运营：approveAllPending(), autoAssign()(分 split), applyToEntryList()(写入 entryList)
│   ├── resultParser.ts        # ★ 解析真实 ACC/AC 成绩 JSON → reconcile 匹配车手 → SessionResult
│   ├── penalties.ts           # ★ 成绩处罚：applyPenalty()（warning/time/position/points/dsq，自动重算名次积分）
│   ├── flowSteps.ts           # ★ FlowAssistant 的 8 步引导定义（每步 isDone/route/run）
│   ├── timezone.ts            # ★ 赛事时区换算（UTC↔墙钟）+ 4 区时区选项 + 带后缀展示
│   ├── lang.ts                # 语言偏好持久化（localStorage，默认 'zh'）
│   └── scrollContainer.ts     # 滚动容器引用，路由切换时 scrollToTop
└── pages/
    ├── admin/
    │   └── OptionsPage.tsx     # /settings/options — 下拉选项管理
    ├── competitions/
    │   ├── CompetitionListPage.tsx   # /competitions — 赛事列表（筛选、取消、删除、整行点击）
    │   ├── CompetitionCreatePage.tsx # /competitions/create — 受控表单创建（含校验/状态预览/离开保护）
    │   ├── CompetitionEditPage.tsx   # /competitions/:id/edit — 非受控编辑，Info/Rounds 双 Tab
    │   ├── ServerConfigModal.tsx     # Stage 的 Split/Session/GameConfig 编辑弹窗（Create/Edit 共用，含模板）
    │   ├── serverFields.tsx          # ★ SplitServerFields + SessionsEditor（弹窗与模板页共用的服务器/Session 字段）
    │   ├── GameConfigEditor.tsx      # 游戏引擎参数编辑器（AC/ACC 专用配置）
    │   └── gameConfigOptions.ts      # 赛道、车型等常量下拉选项
    ├── registrations/
    │   ├── RegistrationListPage.tsx  # /registrations — 赛事列表（下钻入口）
    │   └── CompetitionRegistrationsPage.tsx # /registrations/competition/:id — 按分站审批 + 均分分组
    ├── templates/
    │   ├── TemplateListPage.tsx      # /templates — 服务器配置模板列表
    │   └── TemplateEditPage.tsx      # 模板编辑：服务器设置(SplitServerFields) + Session 时序 + GameConfig 三块
    ├── results/
    │   ├── ResultListPage.tsx        # /results — 赛事列表（点击进单赛事页）
    │   ├── CompetitionResultsPage.tsx # /results/competition/:competitionId — 单赛事分站/阶段 + 开服/同步成绩/发布/晋级 + 积分榜入口
    │   ├── StandingsPage.tsx         # ★ /results/competition/:id/standings — 独立积分榜（车手/车队 Tab + 积分构成展开）
    │   └── ResultEntryPage.tsx       # /results/:stageId — 按 Session+Split 录入成绩 + 自动积分 + 判罚 + 发布
    ├── protests/                     # ProtestListPage, ProtestDetailPage（绑定到 competition/round/stage）
    ├── users/                        # UserListPage, UserDetailPage（"用户"即 drivers）
    ├── news/                         # NewsListPage, NewsEditPage（create 与 edit 同组件）
    ├── teams/                        # TeamListPage, TeamDetailPage（只读，无编辑页）
    ├── notifications/NotificationPage.tsx
    └── LoginPage.tsx                 # 登录拦截页（未登录时任意路径都渲染此页）
```

> 旧的 `events.ts`/`championships.ts`/`DashboardPage.tsx` 已彻底移除。

## 路由结构

未登录时任意路径都渲染 `LoginPage`。已登录后由 `AdminLayout` 包裹：

```
/                              → CompetitionListPage（首页即赛事列表）
/competitions                  → 赛事列表
/competitions/create           → 创建赛事
/competitions/:id/edit         → 编辑赛事（Info / Rounds 双 Tab）
/registrations                 → 报名赛事列表（下钻入口）
/registrations/competition/:id → 单赛事报名审批 + 均分分组（报名截止后定组数）
/templates, /templates/create, /templates/:id/edit
/results                       → 成绩列表（赛事卡片列表，点击进入单赛事成绩页）
/results/competition/:competitionId → 单赛事成绩（分站/阶段 + 开服/同步/发布/晋级）
/results/competition/:competitionId/standings → 独立积分榜（车手/车队 + 积分构成）
/results/:stageId              → 成绩录入（:id 是 Stage ID）
/protests, /protests/:id
/users, /users/:id
/news, /news/create, /news/:id/edit
/teams, /teams/:id             → 车队（只读）
/notifications
/settings/options
```

## 状态管理与持久化（`data/store.ts`）

原型使用自建的轻量外部 store 实现跨刷新持久化：

- **slice 注册**：可变数据数组（`registrations`、`serverInstances`）通过 `registerSlice({ key, get, replace })` 注册到 store
- **写操作**：任何 mutate 后必须调用 `bump()` —— 它会 `persist()`（写入 localStorage key `racing-arcade-state-v1`）并通知所有订阅者
- **订阅**：组件用 `useDataVersion()`（基于 `useSyncExternalStore`）订阅版本号变化以触发重渲染
- **恢复**：`main.tsx` 启动时调用 `hydrate()` 从 localStorage 恢复各 slice
- **重置**：`resetStore()` 清空 localStorage

> 注意：`competitions` 本身是模块级数组，其变更（如 `updateCompetition`）目前直接 mutate，依赖引用相关组件的重渲染；FlowAssistant 通过 `useDataVersion()` 感知 demo 场景变化。新增可变数据时优先走 store 的 `registerSlice` + `bump()` 模式。

## 核心数据模型

赛事采用统一的 **Competition** 模型（`src/data/competitions.ts`），四级嵌套：

```
Competition（赛事，如 MOZA GT3 Challenge）
  └─ Round[]（分站，如 Round 1 - Monza）
      └─ Stage[]（阶段：预选赛 qualifier / 正赛日 race_day / 决赛 final…）
          ├─ sessions: Session[]   游戏内 P/Q/R 共享时序模板（时长、时段、时间倍率）
          ├─ splits: Split[]       服务器实例（含 entryList + results；results 按 Session 归属）
          └─ gameConfig?: SessionGameConfig 共享开赛参数（赛道、天气、规则、辅助等，~70 字段）
```

> **重要**：Stage 的游戏时序字段名是 `sessions`（不是 `gameSessions`）。`sessions` 与 `splits` 是 Stage 下的平级数组——多 Split 时各服务器实例共享同一份 `gameConfig` 和 `sessions` 时序。
>
> **成绩归属**：`Session` 是成绩归属的最小颗粒度。成绩记录（`SessionResult`）存放在 `Split.results` 上，但**每条记录带 `sessionId` 字段**指明所属的 Session。聚合时沿 Session → Split → Stage → Round → Competition 逐级汇总。

### Competition
- 状态 `CompetitionStatus`：`Draft | Upcoming | RegistrationOpen | RegistrationClosed | InProgress | Completed | ResultsPublished | Cancelled`（由 `getCompetitionStatus()` 从 rounds 聚合推导，除非设了 `statusOverride: 'Draft' | 'Cancelled'`）
- `isDemo?: boolean`（标记由 demoScenario 生成的示例赛事）
- `timezone?: string`（**赛事级时区**，如 `'UTC+8'`；时间统一以 UTC 存储，输入/展示按此时区换算，见下「时区系统」）
- 双语字段后缀：`_zh` / `_en`（`name`, `description` 等）
- `regions: Region[]`（`'CN' | 'AP' | 'AM' | 'EU'`），`game: 'AC' | 'ACC'`，`carClass: string`
- `defaultRuleset`：含 `accessRequirements_zh/_en`、`scoringTable?: ScoringTableEntry[]`、`scoringNote_zh/_en`、`resources_zh/_en`、`streamUrl`
- `ScoringTableEntry`：`{ position, points, note_zh?, note_en? }`

### Round / Stage
- Round：`stages: Stage[]`、`registeredDriverIds: string[]`、`currentRegistrations`、报名时间窗口、`cancelledReason_zh?/_en?`
- Stage：`type`、`sessions`、`splits`、`gameConfig?`、`eligibilitySource?`、`advancementRule?`、多 Split 配置、`awardsPoints?`
- `Stage.awardsPoints?: boolean`（**是否计入积分**，默认 true / undefined 视为计分）：关闭时该 Stage 成绩照常展示但不进任何积分榜；仅 race session 成绩计分（见「计分规则」）
- `splitAssignmentRule?: string`：默认分组方式，取值 `'time' | 'random' | 'skill'`（`skill` 即将推出）；实际分组在报名页按此默认值进行
- `Split` **没有** `sessionId` 字段（一个 Split 运行所有 Session）；`SessionResult` 才带 `sessionId?`
- `Split` 服务器字段已覆盖 AC/ACC server guide 全部非报名字段（含 AC 高级：`numThreads`/`sleepTime`/`udpPlugin*`/`authPluginAddress`），由 `SplitServerFields` 统一编辑

### Registration（`data/registrations.ts`，新）
- driver ↔ round 的报名记录：`status`(pending/approved/rejected/waitlisted/withdrawn)、`paymentStatus`(none/unpaid/paid/refunded)、`splitNumber?`、`platformId`(Steam GUID)、`preferredNumber?`、`teamId?`
- 助手：`getRoundRegistrations()`、`getApprovedDriverIds()`、`setRegistrationStatus()`、`assignSplit()`、`addRegistration()`
- 已注册到 store slice（持久化）

### ServerInstance（`data/servers.ts`，新）
- 每个 Split 一个：`splitId`、`stageId`、`status`(stopped/running/error)、`startedAt?`、`onlineCount?`、`logs: ServerLog[]`
- `startServer(stageId, split, gameConfig)` / `stopServer(splitId)` 模拟开服生命周期（含模拟日志）
- 已注册到 store slice（持久化）

### Protest（已迁移到 Competition 模型）
- 绑定 `competitionId`/`roundId`/`stageId`/`sessionId?`（不再用 `eventId`）
- `status`: pending/reviewing/resolved/dismissed
- `resolution?: ProtestResolution`（`decision`: violation/noFault + 处罚明细 + reason + appliedAt）
- 助手：`updateProtest()`

### 工厂函数（`src/data/competitions.ts`）
- `createDefaultRound`、`createDefaultStage`（sessions 默认空，应用模板后填）、`createDefaultSession`、`createDefaultSplit(stageId, splitNumber)`、`createDefaultEntryListEntry`、`createDefaultGameConfig`、`createDefaultTemplate`
- `addCompetition(c)` / `updateCompetition(updated)`（直接 mutate）
- `migrateCompetitions()` 把扁平 raw `sessions[]` 转为扁平 `sessions` + `splits` + `gameConfig`，并回填 `SessionResult.sessionId`

### StageTemplate（导出为 `stageTemplates`）
服务器配置模板，应用到 Stage 可一次性载入完整开服配方：
- `gameConfig`（赛道/天气/规则/辅助/门槛）、`sessions`（P/Q/R 时序）、`splitConfig?`（**含 serverName/passwords/ports/capacity/flags**，排除 id/splitNumber/entryList/results/resultsPublishedAt）
- **不含** `bopEntries`（BoP 报名后按车手水平动态配置）、不含 `maxSplits`/`maxEntriesPerSplit`
- 应用模板载入 gameConfig + sessions + splitConfig；另存为模板捕获这三块
- **模板编辑页（`TemplateEditPage`）已暴露全部三块**：服务器设置（`SplitServerFields` 编辑 `splitConfig`，除报名名单外的全部服务器字段）+ Session 时序（`SessionsEditor`）+ GameConfig（`GameConfigEditor`）。新模板用 `defaultSplitConfig()` 初始化
- `SplitServerFields` / `SessionsEditor`（`pages/competitions/serverFields.tsx`）由 `ServerConfigModal` 与模板页**共用**——新增 Split/Session 字段只改这一处即可两边同步

### ManagedOption / OptionGroup (`data/options.ts`)
13 个选项组，6 个 `OptionCategory`。通过 `useManagedOptions(groupKey, lang, allLabel?)` 生成 Select options。

## 赛事运营操作层（`lib/`）

把"报名→开服→收成绩→发布→晋级"串成可执行的业务操作：

| 模块 | 关键函数 | 作用 |
|------|---------|------|
| `registrationOps.ts` | `approveAllPending`、`assignSplitsEvenly`(报名后按组数**均分**，按报名时间/随机)、`getSplitPlan`/`getSplitWarning`(超容量/每组过少强提示)、`applyToEntryList`(approved → 各 Stage entryList) | 报名→分组→参赛名单 |
| `stageOps.ts` | `startStageServers`(按 split 开服)、`isStageServerRunning`、`publishStageResults`(标记发布) | 开服/发布 |
| `serverResults.ts` | `syncStageResults`(从 entryList/报名车手种子化生成 race 成绩) | 模拟服务器上报成绩 |
| `resultParser.ts` | `parseResultsJson`(真实 ACC/AC JSON)、`reconcileRows`(按 playerId/raceNumber/name 匹配)、`rowsToSessionResults` | 导入真实成绩文件 |
| `advancement.ts` | `computeAdvancers`(position/points/lapTime)、`applyAdvancement`(写入目标 Stage entryList) | 阶段间晋级 |
| `penalties.ts` | `applyPenalty`(warning/time/position/points/dsq，自动重算名次积分)、`applyPenaltyWithAudit`(判罚+写 `auditLogs` 留痕+持久化) | 成绩处罚 |
| `timezone.ts` | `isoToLocalInput`/`localInputToIso`(UTC↔墙钟)、`formatDateTimeTz`(带 `(UTC±X)` 后缀)、`tzSelectOptions` | 赛事时区换算 |

### FlowAssistant（`components/FlowAssistant.tsx` + `lib/flowSteps.ts`）
全局浮窗式引导（挂载在 `AdminLayout` 末尾），演示完整闭环的 **8 步**：
```
create → review → server(push) → results(pull) → protest(可选) → publish → advance → done
```
- 每步 `FlowStep`：`id`、`isDone()`、`route()`、`run?()`（"替我执行"）、`target?`（页面元素 `data-flow` 钩子）、`serverDir?`(push/pull)
- 用 `data-flow="<target>"` 属性标记页面控件，助手会 spotlight 高亮 + 气泡提示
- demo 数据由 `demoScenario.ts` 提供（`createDemoScenario`/`resetDemoScenario`）
- 进度条 + 完成动效；订阅 `useDataVersion()` 自动推进
- **默认待机**：组件初始 `active=false`，仅渲染右下角「开始引导」启动按钮，不 spotlight、不自动跳转；点启动后才介入，面板底部有「退出引导」回到待机

## 时区系统（`lib/timezone.ts`）

- **粒度**：每个 Competition 一个 `timezone`（建赛/编辑页 Info 区选择；4 区：中国 UTC+8 / 亚太 UTC+9 / 欧洲 UTC+1 / 美洲 UTC-5）
- **存储恒为 UTC**：所有时间字段仍以 UTC ISO 存储；时区只用于**输入换算**（`localInputToIso`）与**展示换算**（`isoToLocalInput` / `formatDateTimeTz`/`formatDateTz`，带 `(UTC±X)` 后缀）
- 所有 `datetime-local` 输入（Round 报名三时间、Stage 起止）标签都带时区后缀并按赛事时区换算；列表/成绩页等展示也带后缀
- 新增赛事字段时若含时间，输入用 `localInputToIso(v, comp.timezone)`，展示用 `formatDateTimeTz(iso, comp.timezone)`

## 计分规则（`Stage.awardsPoints` + `lib/results.ts`）

- Stage 级开关 `awardsPoints`（默认计分；`undefined` 视为 true）。`collectResultsFromStages` 对 `awardsPoints === false` 的 Stage 直接跳过，不进任何积分榜
- 仅每个 Stage 的 **race session** 成绩计分（`getRaceSessionId`），多 Split 自动汇总
- 独立积分榜页 `StandingsPage`：车手/车队双 Tab；车手行可展开「积分构成」（分站/阶段 · 名次 · 最快圈速 · 积分），不再展示胜场/领奖台

## 判罚（`components/PenaltyModal.tsx` + `lib/penalties.ts`）

- 通用大弹窗 `PenaltyModal`，5 种判罚（罚时/取消成绩 DSQ/降名次/扣分/警告）+ 原因，**成绩录入页**每行「判罚」按钮与**抗议详情页**裁决共用
- 应用走 `applyPenaltyWithAudit`：调 `applyPenalty` 重算名次积分 → 每条变更写 `auditLogs`（带 `protestId`）留痕 → `updateCompetition` 持久化
- 弹窗 `onApplied(summary)` 回传判罚明细，抗议页据此回填 `ProtestResolution`
- 成绩页打开弹窗前先 `commitLocal()`（本地编辑落到 live results），应用后 `resyncFromStage()` 回灌本地副本

## 分组（报名截止后均分，`lib/registrationOps.ts`）

- 分组在**报名管理下钻页**（`/registrations/competition/:id`）进行：管理员选组数 + 分配方式（按报名时间/随机；按水平即将推出）→ `assignSplitsEvenly` 把 approved 报名**均分**（组间人数差 ≤1，写 `splitNumber` 并回写 Stage 的 `maxSplits/enableMultiSplit`）
- 未手动分组时沿用赛事编辑里的 split 配置；`getSplitWarning` 在超总容量或每组人数低于 `minEntries` 时强提示
- 仅对 `eligibilitySource === 'roundRegistration'` 的 Stage 分组；晋级类 Stage 不参与

## 侧边栏导航顺序（10 项）

```
1. 赛事管理 (Competitions)        /competitions
2. 模板管理 (Templates)           /templates
3. 报名管理 (Registrations)       /registrations
4. 成绩管理 (Results)             /results
5. 抗议管理 (Protests)            /protests
6. 用户管理 (Users)               /users
7. 新闻管理 (News)                /news
8. 车队管理 (Teams)               /teams
9. 通知管理 (Notifications)       /notifications
10. 下拉选项管理 (Options)        /settings/options
```

## 双语系统架构

### 两种语言概念
1. **界面语言**（`state.language`，默认从 `lib/lang.ts` 的 localStorage 读取，默认 `'zh'`）— 控制侧边栏、按钮、标签等 UI 文本，顶栏切换（同时 `i18n.changeLanguage` + `setStoredLang`）
2. **编辑语言**（`editLang`）— 每个编辑/创建页面顶部独立控制，决定当前正在编辑哪个语言版本的内容字段

### editLang 工作方式
- 切换 editLang 时所有双语字段只显示当前语言的输入框
- 例如：`value={editLang === 'en' ? form.name_en : form.name_zh}`
- 编辑页用 `key={editLang}` 让 `defaultValue` 在语言切换时重新挂载
- 弹窗（封禁/发通知）也遵循 editLang 单语切换模式，不同时显示双语输入

### 双语字段命名规范
所有用户可编辑内容用 `_zh` / `_en` 后缀：`name`、`description`、`accessRequirements`、`note`(积分表备注)、`cancelledReason`、`coverImage`。

### i18n 翻译文件
- `src/i18n/zh.ts` 和 `en.ts` 必须保持键结构完全一致
- 16 个命名空间：`admin`、`common`、`region`、`event`、`competition`、`gameConfig`、`serverConfig`、`result`、`protest`、`user`、`news`、`team`、`notification`、`registration`、`template`、`flowAssistant`
- 嵌套对象仅用于状态/枚举分组（`event.status.*`、`protest.status.*`、`protest.penaltyTypes.*`）
- 插值用 `{{}}`（如 `result.syncDoneCount`、`gameConfig.errNoServerName`）
- 中文翻译必须与 `PRD.md` 术语一致

## 页面布局模式

### Sticky Header 模式（创建/编辑页）
```
<>
  <div sticky top-0 z-10 bg-white border-b shadow-sm>
    <div max-w-5xl mx-auto px-6 pt-5 pb-0>
      返回按钮 | 标题 | editLang切换 | 保存/发布按钮
      Tab 栏（Info / Rounds）
    </div>
  </div>
  <div max-w-5xl mx-auto p-6 space-y-6">...</div>
</>
```

### 列表页 / 详情页模式
列表：`<div p-6 space-y-4>` + 标题 + Card(筛选+DataTable) + 模态框。详情：`<div p-6 max-w-4xl mx-auto space-y-6>`。

### AdminLayout 结构
- `<main>` 无 padding，由各页面自行 `p-6`
- 侧边栏可折叠，`w-60`（240px）/ `w-16`（64px）
- 路由切换时 `ScrollToTop` + `scrollContainer.ts` 滚顶
- 末尾挂载 `<FlowAssistant/>`（全局浮窗）

## 组件使用规范

### 受控 vs 非受控
- **Create 页**：`value` + `onChange`（受控），`form` state 统一管理
- **Edit 页**：`defaultValue`（非受控），`key={editLang}` 重新挂载；`localComp ?? foundComp` 快照
- **Edit 页 Select**：用 `defaultValue`，**不要**用 `value` 而不给 `onChange`
- **ServerConfigModal**：内部 `local: Stage` 副本，保存时一次性 emit

### Card / Select / DataTable
- `Card` **不支持** `onClick`，需在外层包 `<div onClick>`
- `Select` options：`{ value, label }[]`；管理型下拉用 `useManagedOptions`
- `DataTable`：泛型 `<T>`，`onRowClick` 可选；行内按钮需 `e.stopPropagation()`

### 嵌套结构编辑（Competition → Round → Stage）
- Round/Stage 手风琴行内编辑；Stage 的 Split/Session/GameConfig 委托 `ServerConfigModal`
- 深层不可变 patch：`setLocal(prev => ({ ...prev, rounds: prev.rounds.map(...stages.map...) }))`

### FlowAssistant 钩子
需要被助手 spotlight 高亮的控件加 `data-flow="<target>"` 属性（target 名来自 `flowSteps.ts` 各步的 `target` 字段，如 `review`/`server`/`results`/`publish`/`advance`）。

## 构建与部署

```bash
npm run dev        # 开发服务器
npm run build      # tsc -b && vite build
npm run lint       # eslint
```

- `vite.config.ts`：`base: '/Racing-Arcade-Admin/'`，路径别名 `@` → `./src`
- `App.tsx`：`BrowserRouter basename="/Racing-Arcade-Admin"`
- GitHub Actions 部署到 `https://sagalinzp.github.io/Racing-Arcade-Admin/`

## 关键决策记录

| 决策 | 原因 |
|------|------|
| 统一 Competition 模型（取代旧 Championship + Event） | 一套结构表达"锦标赛"和"独立赛"，Round 数量区分两者 |
| 自建 store（useSyncExternalStore + localStorage） | 纯前端原型实现跨刷新持久化，无需后端 |
| 报名 Registration 独立模型 + store slice | 审批/支付/分 split 是独立业务流，且需持久化 |
| 服务器 ServerInstance 模拟层 | 演示开服生命周期（状态/日志），无真实开服工具 |
| FlowAssistant 引导 + demoScenario | 把分散能力串成可演示的端到端闭环 |
| Stage 用平级 `sessions` + `splits` | 多 Split 共享同一份游戏配置和 Session 时序 |
| 成绩归属在 `SessionResult.sessionId` | Session 是成绩最小颗粒度，qualify/race 分离 |
| 模板含 serverName/passwords/ports | 单 Split 直接用，多 Split 作基准再微调 |
| 模板不含 BoP | BoP 报名后按车手水平动态配置，属实例级 |
| 取消 vs 删除 | 取消设 `statusOverride: 'Cancelled'`，删除从列表移除 |
| 时区按赛事级、存储恒 UTC | 一个赛事一套时区最简单一致；UTC 存储不破坏既有数据，仅输入/展示换算 |
| 计分开关在 Stage 级、仅 race session | 并非每个阶段都计分（如预选）；积分只认正赛成绩 |
| 分组在报名截止后均分 | 组数由实际报名人数决定，均分更公平；建赛期仅设默认方式与容量 |
| 判罚抽成通用弹窗 + 留痕 | 成绩页与抗议裁决复用同一判罚逻辑，全部判罚写 `auditLogs` 可追溯 |
| 服务器/Session 字段抽成共享组件 | 模板与 ServerConfigModal 共用 `serverFields.tsx`，避免字段两边漂移 |
| 引导默认待机 | 进入页面不应被强制引导，需用户主动点「开始引导」 |

## 开发约束

### 必须遵守
- **纯前端原型**：不引入任何后端调用，所有数据来自 `src/data/`
- **数据字段命名**：Stage 游戏时序字段是 `sessions`（不是 `gameSessions`）；成绩归属是 `SessionResult.sessionId`，`Split` 不带 `sessionId`
- **可变数据走 store**：新增可变数据用 `registerSlice` + 写后 `bump()`；组件用 `useDataVersion()` 订阅
- **i18n 键完整**：新增 UI 文本必须同时在 `zh.ts` 和 `en.ts` 添加
- **双语字段**：新增用户内容字段必须 `_zh` + `_en`；输入跟随 `editLang`，不同时显示双语
- **中文术语**：必须对照 `PRD.md`，不得自行翻译
- **TailwindCSS v4**：`@import "tailwindcss"`，不用 v3 config
- **构建必须通过**：修改后 `tsc -b` 和 `vite build` 都无错误
- **路径别名**：使用 `@/` 代替 `src/`

### 禁止事项
- **不要**在 `Card` 上直接用 `onClick`
- **不要**在 Edit 页 Select 上用 `value` 而不给 `onChange`
- **不要**自行创造中文术语
- **不要**添加代码注释（除非用户明确要求）
- **不要**自行 commit
- **不要**引入 `src/data/` 之外的数据源
- **不要**使用 `@tailwind` 指令或 v3 配置
- **不要**在 `zh.ts`/`en.ts` 出现重复键
- **不要**在积分表同时显示中英文两列备注
- **不要**在显示/编辑语境同时渲染双语（下拉项、列表、详情只按界面语言显示一种）

### 修改后必做
1. `npx tsc -b` 类型检查通过
2. `npx vite build` 构建成功
3. 新增页面路由 → 同步 `App.tsx`
4. 新增侧边栏入口 → 同步 `AdminLayout.tsx` 的 `navItems`
5. 新增 i18n 键 → `zh.ts` 和 `en.ts` 键路径一致
6. 新增可变数据 → 走 `store.ts` 的 `registerSlice` + `bump()`
