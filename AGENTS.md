# AGENTS.md

## 项目概述

Racing Arcade Admin 是一个 sim racing 平台"Racing Arcade"的**纯前端管理后台原型**。所有数据来自 `src/data/` 下的 mock 文件，没有真实后端。部署在 GitHub Pages。

## 技术栈

- React 19 + TypeScript (~6.0)
- Vite 8（构建工具）
- TailwindCSS 4（使用 `@import "tailwindcss"` 语法，不是 v3 的 config 文件方式）
- React Router 7（BrowserRouter）
- i18next + react-i18next（中英文双语）
- lucide-react（图标）
- clsx + tailwind-merge（通过 `cn()` 工具函数合并样式）

## 项目结构

```
src/
├── App.tsx                    # 路由定义，BrowserRouter basename="/Racing-Arcade-Admin"
├── main.tsx                   # 入口
├── index.css                  # TailwindCSS 4 入口（@import "tailwindcss"）
├── components/
│   ├── layout/
│   │   └── AdminLayout.tsx    # 侧边栏 + 顶栏布局，<main> 无 padding
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
├── data/                      # Mock 数据（所有数据的唯一来源）
│   ├── competitions.ts        # ★ 主数据模型：Competition → Round → Stage → Session/Split（见下）
│   ├── options.ts             # ManagedOption + OptionGroup，13 个下拉选项组（6 个分类）
│   ├── admin.ts               # BanRecord、DashboardStats、ResultChangeLog
│   ├── drivers.ts             # Driver 接口 + 25 个车手
│   ├── teams.ts               # Team 接口 + 6 个车队
│   ├── news.ts                # NewsArticle 接口 + 5 条新闻
│   ├── protests.ts            # Protest 接口 + 4 条抗议
│   ├── notifications.ts       # Notification 接口 + 8 条通知
│   ├── events.ts              # ⚠ 旧模型 SimEvent（仅被 protests/users/news 页面做名称查找引用）
│   └── championships.ts       # ⚠ 旧模型 Championship（已不再被路由页面使用，保留供参考）
├── hooks/
│   ├── useAppStore.ts         # AppContext：isLoggedIn, currentUser, language, sidebarCollapsed
│   └── useManagedOptions.ts   # 从 options.ts 生成 Select 兼容的 options 数组，可传 allLabel
├── i18n/
│   ├── index.ts               # i18next 初始化，默认 en
│   ├── en.ts                  # 英文翻译（~711 行，16 个命名空间）
│   └── zh.ts                  # 中文翻译（~711 行，必须与 en.ts 键完全一致）
├── lib/
│   ├── utils.ts               # cn(), formatDate(), formatDateTime(), statusColor(), ScoringTableEntry, getCompetitionStatus(), getRoundStatus()
│   ├── results.ts             # 成绩计算：findStageById(), getPointsForPosition(), getStageResultStatus()/getSessionResultStatus(), getRaceSessionId(), calculate*Standings()（均支持 sessionId 过滤）
│   └── scrollContainer.ts     # 滚动容器引用，路由切换时 scrollToTop
└── pages/
    ├── admin/
    │   └── OptionsPage.tsx     # /settings/options — 下拉选项管理（按分类分组 → 选中组后行内编辑）
    ├── competitions/
    │   ├── CompetitionListPage.tsx   # /competitions — 赛事列表（筛选、取消、删除、整行点击）
    │   ├── CompetitionCreatePage.tsx # /competitions/create — 受控表单创建
    │   ├── CompetitionEditPage.tsx   # /competitions/:id/edit — 非受控编辑，Info/Rounds 双 Tab
    │   ├── ServerConfigModal.tsx     # Stage 的 Split/Session/GameConfig 编辑弹窗（Create/Edit 共用）
    │   ├── GameConfigEditor.tsx      # 游戏引擎参数编辑器（AC/ACC 专用配置）
    │   └── gameConfigOptions.ts      # 赛道、车型等常量下拉选项
    ├── templates/
    │   ├── TemplateListPage.tsx      # /templates — 服务器配置模板列表
    │   └── TemplateEditPage.tsx      # /templates/create 和 /templates/:id/edit（同一组件）
    ├── results/
    │   ├── ResultListPage.tsx        # /results — 赛事列表（点击进单赛事页）
    │   ├── CompetitionResultsPage.tsx # /results/competition/:competitionId — 单赛事分站/阶段 + 从服务器同步成绩
    │   └── ResultEntryPage.tsx       # /results/:stageId — 按 Session+Split 录入成绩（session 选择器）+ 自动积分 + 发布
    ├── protests/                     # ProtestListPage, ProtestDetailPage
    ├── users/                        # UserListPage, UserDetailPage（"用户"即 drivers）
    ├── news/                         # NewsListPage, NewsEditPage（create 与 edit 同组件）
    ├── teams/                        # TeamListPage, TeamDetailPage（只读，无编辑页）
    ├── notifications/NotificationPage.tsx
    ├── LoginPage.tsx                 # 登录拦截页（未登录时任意路径都渲染此页）
    └── DashboardPage.tsx             # ⚠ 文件存在但已无路由
```

## 路由结构

未登录时任意路径都渲染 `LoginPage`。已登录后由 `AdminLayout` 包裹：

```
/                              → CompetitionListPage（首页即赛事列表）
/competitions                  → 赛事列表
/competitions/create           → 创建赛事
/competitions/:id/edit         → 编辑赛事（Info / Rounds 双 Tab，Rounds Tab 内嵌套编辑 Round→Stage）
/templates                     → 模板列表
/templates/create              → 创建模板
/templates/:id/edit            → 编辑模板
/results                       → 成绩列表（赛事卡片列表，点击进入单赛事成绩页）
/results/competition/:competitionId → 单赛事成绩（按分站→阶段，含"从服务器同步成绩"）
/results/:stageId              → 成绩录入（:id 是 Stage ID，不是赛事 ID）
/protests, /protests/:id       → 抗议列表 / 抗议详情
/users, /users/:id             → 用户列表 / 用户详情
/news, /news/create, /news/:id/edit
/teams, /teams/:id             → 车队列表 / 车队详情（只读）
/notifications                 → 通知管理（单页，含发送弹窗）
/settings/options              → 下拉选项管理
```

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
> **成绩归属**：`Session` 是成绩归属的最小颗粒度。成绩记录（`SessionResult`）存放在 `Split.results` 上，但**每条记录带 `sessionId` 字段**指明所属的 Session（如 qualifying / race）。同一 Split 内不同 Session 的成绩各自独立，可分别查看；聚合时沿 Session → Split → Stage → Round → Competition 逐级汇总。

### Competition
- 状态 `CompetitionStatus`：`Draft | Upcoming | RegistrationOpen | RegistrationClosed | InProgress | Completed | ResultsPublished | Cancelled`（由 `getCompetitionStatus()` 从 rounds 聚合推导，除非设了 `statusOverride: 'Draft' | 'Cancelled'`）
- 双语字段后缀：`_zh` / `_en`（`name`, `description` 等）
- `regions: Region[]`（`'CN' | 'AP' | 'AM' | 'EU'`），`game: 'AC' | 'ACC'`，`carClass: string`
- `defaultRuleset`：含 `accessRequirements_zh/_en`、`scoringTable?: ScoringTableEntry[]`、`scoringNote_zh/_en`、`resources_zh/_en`、`streamUrl`
- `rounds: Round[]`
- `ScoringTableEntry`：`{ position, points, note_zh?, note_en? }`

### Round
- `stages: Stage[]`，`registeredDriverIds: string[]`，`currentRegistrations: number`
- `registrationOpenAt` / `registrationCloseAt` / `cancelRegistrationDeadline?`
- `cancelledReason_zh?/_en?`（有值则该分站视为已取消）

### Stage
- `type: StageType`：`qualifier | race_day | final | consolation | practice | custom`
- `sessions: Session[]`（共享的 Practice/Qualifying/Race 时序模板，所有 Split 按此统一时序运行）
- `splits: Split[]`（每个 Split = 一个并行服务器，含独立 `entryList`、`results`、服务器参数；`results` 按 `sessionId` 归属到具体 Session）
- `gameConfig?: SessionGameConfig`（绑定到 Stage 的共享开赛参数，AC/ACC 专用服务器配置）
- `eligibilitySource?`：`roundRegistration | previousStageResult | manualInvite`
- `advancementRule?`：`{ metric: 'lapTime'|'points'|'position'|'manual', lapTimeMultiplier?, limit?, targetStageId?, fallbackPolicy? }`
- `enableMultiSplit?`、`maxEntriesPerSplit?`、`maxSplits?`、`splitAssignmentRule?`、`minEntries?`
- 状态由 `getRoundStatus()` / `getStageResultStatus()`（整体）/ `getSessionResultStatus()`（单 Session）从时间与成绩推导

> **注意**：`Split` **没有** `sessionId` 字段（一个 Split 运行所有 Session，而非属于某个 Session）。`SessionResult` 才带 `sessionId?` 字段。成绩的 session 归属在 `SessionResult.sessionId` 上。

### 工厂函数（`src/data/competitions.ts`）
- `createDefaultRound(competitionId)`、`createDefaultStage(roundId, type?)`
- `createDefaultSession(type?)`、`createDefaultSplit(stageId, splitNumber)`、`createDefaultEntryListEntry(raceNumber)`
- `createDefaultGameConfig(game)`（按 AC/ACC 返回不同默认配置）
- `createDefaultTemplate(game)`
- `addCompetition(c)` / `updateCompetition(updated)`（直接 mutate 导入数组）

### StageTemplate（`src/data/competitions.ts`，导出为 `stageTemplates`）
服务器配置模板，应用到 Stage 可一次性载入完整开服配方：
- `gameConfig: SessionGameConfig`（赛道/天气/规则/辅助/门槛）
- `sessions: Session[]`（P/Q/R 时序——冲刺 vs 耐力的本质区别就在这里）
- `splitConfig?: Partial<Split>`（每个 Split 的服务器默认值，**含 serverName/passwords/ports/capacity/flags**；保存时仅排除 `id`/`splitNumber`/`entryList`/`results`/`resultsPublishedAt`）
- **不含** `bopEntries`（BoP 报名后按车手水平动态配置，属实例级）、不含 `maxSplits`/`maxEntriesPerSplit`（Stage 容量决策）
- 应用模板（`ServerConfigModal.handleApplyTemplate`）会载入 gameConfig + sessions + splitConfig；另存为模板（`handleSaveAsTemplate`）会捕获当前 Stage 的这三块

### 数据迁移说明
mock 原始数据（`_rawCompetitions`）里 Stage 用扁平 `sessions[]`（每个 session 内嵌 `splits`/`gameConfig`），导出前由 `migrateCompetitions()` 转换：把 race session 的 `gameConfig` 和 `splits` 上提到 Stage 层级，session 列表映射为 `Session[]`（id 加 `_gs` 后缀）。**成绩归属**：迁移时为每条 `SessionResult` 回填 `sessionId`（指向迁移后的 Session id）；若原始 result 已带 `sessionId`（如手工标注的 qualifying 成绩）则保留。迁移会清除 Split 上残留的 `sessionId` 字段（一个 Split 运行所有 Session，不再属于单个 Session）。最终导出的 `competitions` 数组里 Stage 结构是扁平的 `sessions` + `splits` + `gameConfig`，splits 上无 `sessionId`，results 上带 `sessionId`。

### ManagedOption / OptionGroup (`src/data/options.ts`)
- 13 个选项组，按 6 个 `OptionCategory` 分类：`competition`（game/carClass/region/splitRule/eligibilitySource）、`result`（resultStatus）、`protest`（protestStatus/penaltyType）、`user`（banType）、`news`（newsCategory）、`notification`（notificationType/notificationRecipient/notificationChannel）
- 通过 `useManagedOptions(groupKey, lang, allLabel?)` hook 生成 Select 组件所需的 `{ value, label }[]`；`allLabel` 会在首位插入一个空值的"全部"选项

## 侧边栏导航顺序

```
1. 赛事管理 (Competitions)        /competitions
2. 模板管理 (Templates)           /templates
3. 成绩管理 (Results)             /results
4. 抗议管理 (Protests)            /protests
5. 用户管理 (Users)               /users
6. 新闻管理 (News)                /news
7. 车队管理 (Teams)               /teams
8. 通知管理 (Notifications)       /notifications
9. 下拉选项管理 (Options)         /settings/options
```

## 双语系统架构

### 两种语言概念
1. **界面语言**（`state.language`）— 控制侧边栏、按钮、标签等 UI 文本的显示语言，通过顶栏右上角按钮切换（同时调用 `i18n.changeLanguage`）
2. **编辑语言**（`editLang`）— 每个编辑/创建页面顶部独立控制，决定当前正在编辑哪个语言版本的内容字段

### editLang 工作方式
- 每个创建/编辑页面有自己的 `editLang` 状态（`'en' | 'zh'`）
- 切换 editLang 时，所有双语字段只显示当前语言的输入框
- 例如：`value={editLang === 'en' ? form.name_en : form.name_zh}`
- 编辑页使用 `key={editLang}` 让 `defaultValue` 在语言切换时重新挂载
- 积分表备注也遵循此模式：只显示一列备注，跟随 editLang

### 双语字段命名规范
所有用户可编辑的内容字段使用 `_zh` / `_en` 后缀：
- `name_zh` / `name_en`
- `description_zh` / `description_en`
- `accessRequirements_zh` / `accessRequirements_en`
- `note_zh` / `note_en`（积分表备注）
- `cancelledReason_zh` / `cancelledReason_en`
- `coverImage` 封面图片也区分中英文

### i18n 翻译文件
- `src/i18n/zh.ts` 和 `src/i18n/en.ts` 必须保持键结构完全一致（各约 711 行）
- 翻译键按 16 个命名空间组织：`admin.*`, `common.*`, `region.*`, `event.*`, `championship.*`, `competition.*`, `gameConfig.*`, `serverConfig.*`, `result.*`, `protest.*`, `user.*`, `news.*`, `team.*`, `notification.*`, `template.*`, `dashboard.*`
- 嵌套对象仅用于状态/枚举分组：`event.status.*`、`championship.status.*`、`protest.status.*`、`protest.penaltyTypes.*`
- 仅 2 处使用 `{{}}` 插值（`gameConfig.errNoServerName`、`gameConfig.splitCountFixed`）
- 中文翻译必须与 `PRD.md` 术语一致，不要自行翻译

## 页面布局模式

### Sticky Header 模式（创建/编辑页）
```
<>  (Fragment)
  <div sticky top-0 z-10 bg-white border-b shadow-sm>  ← 固定头部
    <div max-w-5xl mx-auto px-6 pt-5 pb-0>
      返回按钮 | 标题 | editLang切换 | 保存/发布按钮
      Tab 栏（Info / Rounds）
    </div>
  </div>
  <div max-w-5xl mx-auto p-6 space-y-6>  ← 可滚动内容区
    <Card>...</Card>
  </div>
</>
```

### 列表页模式
```
<div p-6 space-y-4>
  <标题 + 创建按钮>
  <Card>
    <筛选栏>
    <DataTable onRowClick={...} />
  </Card>
  <取消/删除模态框>
</div>
```

### 详情页模式
```
<div p-6 max-w-4xl mx-auto space-y-6>
  <返回按钮 + 标题 + 操作按钮>
  <Card>...</Card>
</div>
```

### AdminLayout 结构
- `<main>` 没有 padding，由各页面自行控制 `p-6`
- 侧边栏可折叠，宽度 `w-60`（240px）展开 / `w-16`（64px）折叠
- 路由切换时通过 `ScrollToTop` 组件 + `scrollContainer.ts` 滚动到顶部

## 组件使用规范

### 受控 vs 非受控
- **Create 页面**：所有表单用 `value` + `onChange`（受控），通过 `form` state 统一管理（如 `CompetitionCreatePage`）
- **Edit 页面**：用 `defaultValue`（非受控），语言切换时通过 `key={editLang}` 重新挂载；用 `localComp ?? foundComp` 快照模式管理修改（如 `CompetitionEditPage`）
- **Edit 页面的 Select**：用 `defaultValue`（非受控），**不要**用 `value` 而不给 `onChange`
- **ServerConfigModal**：内部维护 `local: Stage` 副本，保存时一次性 emit 整个 Stage 给父组件

### Card 组件
- `Card` **不支持** `onClick`，需要点击交互时在外层包一个 `<div onClick={...}>`

### Select 组件
- options 格式：`{ value: string, label: string }[]`
- 管理型下拉（车型组、区域、处罚类型等）使用 `useManagedOptions(groupKey, lang, allLabel?)` 获取 options

### DataTable 组件
- 泛型 `<T>`，必须提供 `columns`、`data`、`keyExtractor`
- `onRowClick` 可选，设置后行会显示 hover 样式和 cursor-pointer
- 行内按钮需要 `ev.stopPropagation()` 阻止冒泡到 onRowClick
- 列无 `render` 时回退到按 `key` 取属性值

### 嵌套结构编辑（Competition → Round → Stage）
- Round 和 Stage 以手风琴（Accordion）形式行内编辑，单层展开
- Stage 的 Split / Session / GameConfig 编辑统一委托给 `ServerConfigModal`（含 splits/sessions/gameSettings 三个 Tab、模板加载/保存、BoP、Entry List）
- 深层更新采用不可变 patch 模式：`setLocal(prev => ({ ...prev, rounds: prev.rounds.map(r => r.id === rid ? { ...r, stages: r.stages.map(s => s.id === sid ? updated : s) } : r) }))`

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
| 统一 Competition 模型（取代旧的 Championship + Event） | 一套结构表达"锦标赛"和"独立赛"，Round 数量区分两者 |
| `<main>` 无 padding，各页面自行 `p-6` | 让 sticky header 能全宽显示 |
| Edit 页用 `defaultValue` + `key={editLang}` | 切换语言时需要重新挂载以加载对应语言数据 |
| Create 页用受控 `value`+`onChange` | 创建时需要收集完整表单数据 |
| Stage 用平级 `sessions` + `splits`（非嵌套） | 多 Split 共享同一份游戏配置和 Session 时序 |
| 游戏配置绑定到 Stage（非 Session） | 一个 Stage = 一份服务器配置，Split 只是并行实例 |
| 取消 vs 删除 | 取消设 `statusOverride: 'Cancelled'`（前台仍可见），删除从列表彻底移除 |
| 下拉选项通过 `options.ts` 统一管理 | 车型组、处罚类型等需要后台可配置，在"下拉选项管理"中增删改 |
| 旧 `events.ts`/`championships.ts` 保留 | protests/users/news 页面仍引用其名称查找，未一并迁移 |

## 开发约束

### 必须遵守
- **纯前端原型**：不引入任何后端调用，所有数据来自 `src/data/`
- **数据字段命名**：Stage 的游戏时序字段是 `sessions`（`Session[]`），不要写成 `gameSessions`；成绩归属字段是 `SessionResult.sessionId`（指向 `Stage.sessions[].id`），`Split` 不带 `sessionId`
- **i18n 键完整**：新增 UI 文本必须同时在 `zh.ts` 和 `en.ts` 中添加对应键
- **双语字段**：新增用户内容字段必须提供 `_zh` 和 `_en` 两个版本
- **editLang 一致**：双语输入必须跟随 `editLang`，不能同时显示两个语言的输入框
- **中文术语**：必须对照 `PRD.md`，不得自行翻译
- **TailwindCSS v4**：使用 `@import "tailwindcss"` 语法，不使用 v3 的 `tailwind.config.js`
- **构建必须通过**：修改后必须 `tsc -b` 和 `vite build` 都无错误
- **路径别名**：使用 `@/` 代替 `src/`（如 `@/components/ui/Card`）

### 禁止事项
- **不要**在 `Card` 上直接使用 `onClick`
- **不要**在 Edit 页的 Select 上使用 `value` 而不提供 `onChange`（会导致选择无响应）
- **不要**自行创造中文术语，必须参照 `PRD.md`
- **不要**添加代码注释（除非用户明确要求）
- **不要**自行 commit（除非用户明确要求）
- **不要**引入 `src/data/` 之外的数据源
- **不要**使用 `@tailwind` 指令或 v3 配置语法
- **不要**在 `zh.ts` / `en.ts` 中出现重复的键
- **不要**在积分表中同时显示中英文两列备注

### 修改后必做
1. `npx tsc -b` 确认类型检查通过
2. `npx vite build` 确认构建成功
3. 如果新增了页面路由，同步更新 `App.tsx` 路由表
4. 如果新增了侧边栏入口，同步更新 `AdminLayout.tsx` 的 `navItems` 数组
5. 如果新增了 i18n 键，确保 `zh.ts` 和 `en.ts` 都已添加且键路径一致
