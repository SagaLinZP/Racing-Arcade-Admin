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
│       ├── Button.tsx         # variant: primary | secondary | ghost | danger
│       ├── Card.tsx           # padding?: boolean (默认 true)，不支持 onClick
│       ├── Input.tsx          # label, value/onChange, defaultValue, type, placeholder
│       ├── Select.tsx         # label, options({value,label}), value/onChange, defaultValue
│       ├── Textarea.tsx       # label, value/onChange, defaultValue, placeholder
│       ├── DataTable.tsx      # 泛型 <T>，columns, data, onRowClick?, keyExtractor, emptyMessage?
│       ├── StatusBadge.tsx    # status (string), label (string)
│       ├── Modal.tsx          # isOpen, onClose, title, children, size?
│       └── Badge.tsx, EmptyState.tsx, Pagination.tsx
├── data/                      # Mock 数据（所有数据的唯一来源）
│   ├── events.ts              # SimEvent 接口 + mock 事件数组
│   ├── championships.ts       # Championship 接口 + mock 锦标赛数组
│   ├── options.ts             # ManagedOption + OptionGroup，下拉选项管理数据（天气、车型组）
│   ├── admin.ts               # Dashboard 统计数据、赛事模板
│   ├── drivers.ts, teams.ts, news.ts, protests.ts, notifications.ts, mozaDevices.ts
├── hooks/
│   ├── useAppStore.ts         # AppContext：isLoggedIn, currentUser, language, sidebarCollapsed
│   └── useManagedOptions.ts   # 从 options.ts 生成 Select 兼容的 options 数组
├── i18n/
│   ├── index.ts               # i18next 初始化，默认 en
│   ├── en.ts                  # 英文翻译（~400 行）
│   └── zh.ts                  # 中文翻译（~400 行，必须与 en.ts 键完全一致）
├── lib/
│   ├── utils.ts               # cn(), formatDate(), formatDateTime(), statusColor(), ScoringTableEntry 类型
│   └── scrollContainer.ts
└── pages/
    ├── admin/
    │   ├── SettingsPage.tsx    # /settings — 设置概览页，卡片入口
    │   └── OptionsPage.tsx     # /settings/options — 下拉选项管理（两级：选项组列表 → 具体选项编辑）
    ├── events/
    │   ├── EventListPage.tsx   # /events — 独立赛事列表（筛选、取消、删除、整行点击）
    │   ├── EventCreatePage.tsx # /events/create — 创建独立赛事
    │   ├── EventEditPage.tsx   # /events/:id/edit — 编辑独立赛事
    │   ├── ChampionshipListPage.tsx # /championships — 锦标赛列表
    │   ├── ChampionshipCreatePage.tsx # /championships/create
    │   ├── ChampionshipEditPage.tsx  # /championships/:id/edit — Tab 切换（信息/子赛事）
    │   └── TemplateListPage.tsx
    ├── results/, protests/, users/, news/, teams/, notifications/, devices/
    └── LoginPage.tsx, DashboardPage.tsx（已移除路由但文件仍存在）
```

## 路由结构

```
/                              → ChampionshipListPage（首页即锦标赛列表）
/events                        → 独立赛事列表
/events/create                 → 创建独立赛事
/events/:id/edit               → 编辑独立赛事（championshipId 事件会重定向到锦标赛编辑页）
/championships                 → 锦标赛列表
/championships/create          → 创建锦标赛
/championships/:id/edit        → 编辑锦标赛
/templates                     → 模板列表
/results, /results/:id         → 成绩
/protests, /protests/:id       → 抗议
/users, /users/:id             → 用户
/news, /news/create, /news/:id/edit
/teams, /teams/:id
/notifications
/devices
/settings                      → 设置概览页
/settings/options              → 下拉选项管理
```

## 核心数据模型

### SimEvent (`src/data/events.ts`)
- 状态类型 `EventStatus`：`Draft | Upcoming | RegistrationOpen | RegistrationClosed | InProgress | Completed | ResultsPublished | Cancelled`
- 双语字段后缀：`_zh` / `_en`（如 `name_zh`, `name_en`, `rules_zh`, `rules_en`）
- `championshipId` 可选，有值则为锦标赛子赛事，不出现在独立赛事列表中
- `scoringTable?: ScoringTableEntry[]`，每行 `{ position, points, note_zh?, note_en? }`

### Championship (`src/data/championships.ts`)
- 状态：`'upcoming' | 'active' | 'completed'`（注意小写，与 SimEvent 的 PascalCase 不同）
- `eventIds: string[]` 关联子赛事
- 同样有大量双语 `_zh`/`_en` 字段

### ManagedOption / OptionGroup (`src/data/options.ts`)
- 下拉选项的统一管理结构，目前有 `weather`（天气）和 `carClass`（车型组）两个组
- 通过 `useManagedOptions(groupKey, lang)` hook 生成 Select 组件所需的 `{ value, label }[]`

## 侧边栏导航顺序

```
1. 锦标赛管理 (Championships)
2. 独立赛事管理 (Standalone Events)
3. 模板管理 (Templates)
4. 成绩管理 (Results)
5. 抗议管理 (Protests)
6. 用户管理 (Users)
7. 新闻管理 (News)
8. 车队管理 (Teams)
9. 通知管理 (Notifications)
10. MOZA 设备管理 (Devices)
11. 其他设置 (Settings)
```

## 双语系统架构

### 两种语言概念
1. **界面语言**（`state.language`）— 控制侧边栏、按钮、标签等 UI 文本的显示语言，通过顶栏右上角按钮切换
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
- `rules_zh` / `rules_en`
- `accessRequirements_zh` / `accessRequirements_en`
- `note_zh` / `note_en`（积分表备注）
- `coverImage` 封面图片也区分中英文

### i18n 翻译文件
- `src/i18n/zh.ts` 和 `src/i18n/en.ts` 必须保持键结构完全一致
- 翻译键按模块组织：`admin.*`, `common.*`, `event.*`, `championship.*`, `result.*`, `protest.*`, `user.*`, `news.*`, `team.*`, `notification.*`, `device.*`, `region.*`
- 中文翻译必须与 `PRD.md` 术语一致，不要自行翻译

## 页面布局模式

### Sticky Header 模式（创建/编辑页）
```
<>  (Fragment)
  <div sticky top-0 w-full bg-white border-b>  ← 固定头部
    <div max-w-5xl mx-auto px-6>
      返回按钮 | 标题 | editLang切换 | 保存/发布按钮
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

### AdminLayout 结构
- `<main>` 没有 padding，由各页面自行控制 `p-6`
- 侧边栏可折叠，宽度 260px / 64px

## 组件使用规范

### 受控 vs 非受控
- **Create 页面**：所有表单用 `value` + `onChange`（受控），通过 `form` state 统一管理
- **Edit 页面**：用 `defaultValue`（非受控），语言切换时通过 `key={editLang}` 重新挂载
- **Edit 页面的 Select**：用 `defaultValue`（非受控），**不要**用 `value` 而不给 `onChange`

### Card 组件
- `Card` **不支持** `onClick`，需要点击交互时在外层包一个 `<div onClick={...}>`

### Select 组件
- options 格式：`{ value: string, label: string }[]`
- 天气、车型组等管理型下拉使用 `useManagedOptions(groupKey, lang)` 获取 options

### DataTable 组件
- 泛型 `<T>`，必须提供 `columns`、`data`、`keyExtractor`
- `onRowClick` 可选，设置后行会显示 hover 样式和 cursor-pointer
- 行内按钮需要 `ev.stopPropagation()` 阻止冒泡到 onRowClick

## 构建与部署

```bash
npm run dev        # 开发服务器
npm run build      # tsc -b && vite build
npm run lint       # eslint
```

- `vite.config.ts`：`base: '/Racing-Arcade-Admin/'`
- `App.tsx`：`BrowserRouter basename="/Racing-Arcade-Admin"`
- GitHub Actions 部署到 `https://sagalinzp.github.io/Racing-Arcade-Admin/`

## 关键决策记录

| 决策 | 原因 |
|------|------|
| `<main>` 无 padding，各页面自行 `p-6` | 让 sticky header 能全宽显示 |
| Edit 页用 `defaultValue` + `key={editLang}` | 切换语言时需要重新挂载以加载对应语言数据 |
| Create 页用受控 `value`+`onChange` | 创建时需要收集完整表单数据 |
| 子赛事通过 `championshipId` 关联 | 独立赛事 `!e.championshipId` 过滤 |
| 锦标赛子赛事重定向到锦标赛编辑页 | 子赛事在锦标赛的"子赛事"tab 内管理 |
| 取消 vs 删除 | 取消改状态为 Cancelled（前台仍可见），删除从列表彻底移除 |
| 下拉选项通过 `options.ts` 统一管理 | 天气、车型组等需要后台可配置，在"其他设置→下拉选项管理"中增删改 |

## 开发约束

### 必须遵守
- **纯前端原型**：不引入任何后端调用，所有数据来自 `src/data/`
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
