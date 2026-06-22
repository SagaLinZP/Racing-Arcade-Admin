# Racing Arcade Admin

Sim racing 竞赛平台 **Racing Arcade** 的管理后台原型。纯前端实现，所有数据来自 `src/data/` 下的 mock 文件，无真实后端，部署于 GitHub Pages。

## 技术栈

- **React 19** + **TypeScript 6**
- **Vite 8**（构建工具）
- **TailwindCSS 4**（`@import "tailwindcss"` 语法，无 `tailwind.config.js`）
- **React Router 7**（BrowserRouter）
- **i18next** + **react-i18next**（中英双语）
- **lucide-react**（图标）
- `clsx` + `tailwind-merge`（通过 `cn()` 合并样式）

## 开发

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run preview    # 预览生产构建
```

- 路径别名 `@/` → `src/`
- Vite `base` 与 Router `basename` 均为 `/Racing-Arcade-Admin/`
- 推送到 `master` 分支后，由 GitHub Actions 自动构建并部署到 <https://sagalinzp.github.io/Racing-Arcade-Admin/>

## 核心数据模型

赛事采用统一的 **Competition** 模型（`src/data/competitions.ts`），四级嵌套：

```
Competition  赛事
└─ Round     分站
   └─ Stage  阶段（预选 / 正赛 / 决赛…）
      ├─ sessions: Session[]   游戏内 P/Q/R 时序模板（多 Split 共享）
      ├─ splits:   Split[]     并行服务器实例（各含 entryList + results）
      └─ gameConfig            AC/ACC 开服参数
```

- 成绩 `SessionResult` 存于 `Split.results`，每条带 `sessionId` 标明所属 Session。
- 赛事 / 分站状态不是存储字段，而是由 `src/lib/utils.ts` 的 `getCompetitionStatus()` / `getRoundStatus()` 按时间与成绩**推导**得出。
- mock 原始数据为嵌套结构，文件末尾的 `migrateCompetitions()` 会将其转换为上述扁平的 Stage 形状。
- 时区为 Competition 级字段（`timezone`），时间统一以 UTC 存储，输入/展示按赛事时区换算（`src/lib/timezone.ts`）。
- 是否计入积分由 `Stage.awardsPoints` 控制（仅 race session 计分）；积分榜为独立页面（`StandingsPage`）。

## 目录结构

```
src/
├── App.tsx              路由定义
├── main.tsx            入口
├── components/
│   ├── layout/         AdminLayout（侧边栏 + 顶栏）
│   └── ui/             基础组件库（Button / Card / Input / DataTable / Modal…）
├── data/               Mock 数据（唯一数据源）
├── hooks/              useAppStore / useManagedOptions
├── i18n/               en.ts / zh.ts（键结构须完全一致）
├── lib/                utils / results / timezone / penalties / registrationOps …
└── pages/              各功能模块页面
```

## 功能模块

赛事管理 · 模板管理 · 报名管理 · 成绩管理 · 抗议 · 用户 · 新闻 · 车队 · 通知 · 下拉选项管理

## 开发约定

完整约定见 [`AGENTS.md`](AGENTS.md)，要点：

- **纯前端原型**：不引入后端调用，数据只来自 `src/data/`
- **双语**：界面语言（`state.language`）与编辑语言（`editLang`）分离；用户内容字段统一用 `_zh` / `_en` 后缀
- **i18n**：新增 UI 文本须同时在 `zh.ts` 和 `en.ts` 添加，且键路径一致
- **构建必过**：修改后须 `tsc -b` 与 `vite build` 均无错误

## 相关文档

- [`AGENTS.md`](AGENTS.md) — 架构与开发约定
- [`PRD.md`](PRD.md) — 产品需求与中文术语基准
- `AC Dedicated Server Guide.md` / `ACC Dedicated Server Guide.md` — 游戏专用服务器搭建指南
