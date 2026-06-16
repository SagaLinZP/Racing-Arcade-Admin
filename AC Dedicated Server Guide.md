# AC Server 配置文件说明

Assetto Corsa Dedicated Server（`acServer.exe`）配置文件完整字段说明

> **说明**：与 ACC 使用 JSON 配置不同，**AC 使用 INI 格式**。所有配置文件位于 AC 安装目录的 `server/cfg/` 下，由官方 GUI 工具 `acServerManager.exe` 生成，也可手动编辑。
>
> **权威参考**：Kunos Simulazioni 官方手册（assettocorsa.net/forum FAQ #28）。本文档基于官方手册整理，并标注了来自第三方扩展（Content Manager / Custom Shaders Patch / AssettoServer）的非官方字段。

---

## 目录结构

```
server/
├── acServer.exe                 # 专用服务器可执行文件
├── acServer.bat                 # 启动批处理（带时间戳日志）
├── acServerManager.exe          # 官方 GUI 配置工具
├── blacklist.txt                # 封禁名单（Steam64 GUID，每行一个）
├── cfg/
│   ├── server_cfg.ini           # ★ 主配置文件（会话 / 规则 / 天气）
│   ├── entry_list.ini           # ★ 车位 / 车手名单
│   └── csp_extra_options.ini    # CSP 服务端扩展（第三方）
├── content/
│   ├── cars/<车模文件夹>/        # 车辆模组（文件夹名 == MODEL）
│   ├── tracks/<赛道文件夹>/      # 赛道模组（文件夹名 == TRACK）
│   └── weather/<天气预设>/       # 天气预设（文件夹名 == GRAPHICS）
└── setups/                      # 固定调校文件（被 entry_list 引用）
```

---

## 配置文件列表

| 文件名 | 用途 |
|--------|------|
| `server_cfg.ini` | 服务器主配置（名称、赛道、会话、规则、天气） |
| `entry_list.ini` | 车位 / 车手名单 |
| `blacklist.txt` | 封禁的 Steam64 GUID 列表 |
| `csp_extra_options.ini` | Custom Shaders Patch 服务端扩展（第三方） |
| `setups/*.ini` | 固定调校文件（被 `entry_list.ini` 的 `FIXED_SETUP` 引用） |

> **必须的两个文件**：`server_cfg.ini` 和 `entry_list.ini`。

---

## 1. server_cfg.ini - 服务器主配置

INI 格式，`;` 开头为注释，段在 `[括号]` 中。完整示例：

```ini
[SERVER]
NAME=MOZA RACING AC
CARS=ferrari_458;ks_porsche_911_gt3_r_2017
TRACK=monza
CONFIG_TRACK=grand_prix
SUN_ANGLE=-8
MAX_CLIENTS=20
UDP_PORT=9600
TCP_PORT=9600
HTTP_PORT=8081
PASSWORD=
LOOP_MODE=1
REGISTER_TO_LOBBY=1
PICKUP_MODE_ENABLED=1
ADMIN_PASSWORD=adminpw
DAMAGE_MULTIPLIER=100
FUEL_RATE=100
TYRE_WEAR_RATE=100
TC_ALLOWED=1
ABS_ALLOWED=1
STABILITY_ALLOWED=0
AUTOCLUTCH_ALLOWED=0
FORCE_VIRTUAL_MIRROR=1
LEGAL_TYRES=S;M;H
TIME_OF_DAY_MULT=1
```

### [SERVER] 段字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `NAME` | string | 服务器名称，显示在大厅列表 |
| `CARS` | string | 允许的车型，**用 `;` 分隔**，值为 `content/cars/` 下精确的车模文件夹名（如 `ferrari_458;abarth500_s1`） |
| `TRACK` | string | 赛道，值为 `content/tracks/` 下的赛道文件夹名 |
| `CONFIG_TRACK` | string | 赛道布局版本，值为 `content/tracks/TRACK/ui/` 下的子文件夹名 |
| `SUN_ANGLE` | int | 太阳角度（决定时间），公式：`16*((H*3600)+(M*60)+S-46800)/(50400-46800)`，负值=正午前 |
| `MAX_CLIENTS` | int | 最大客户端数，**不能超过赛道维修区车位数量** |
| `RACE_OVER_TIME` | int | 头车冲线后剩余时间（秒），到时未完赛车手被结束 |
| `ALLOWED_TYRES_OUT` | int | 切弯 / 轮胎越线处罚阈值，`-1` = 禁用 |
| `UDP_PORT` | int | UDP 端口（防火墙需开放），默认 `9600` |
| `TCP_PORT` | int | TCP 端口（防火墙需开放），默认 `9600` |
| `HTTP_PORT` | int | HTTP / 大厅端口，**需同时开放 TCP 和 UDP**，默认 `8081` |
| `PASSWORD` | string | 服务器加入密码，空 = 公开 |
| `LOOP_MODE` | 0/1 | `1` = 服务器循环会话列表；`0` = 不循环 |
| `REGISTER_TO_LOBBY` | 0/1 | **重要**：`1` = 注册到 Kunos 大厅（公开可见）；`0` = 仅直连。官方建议保持 `1` |
| `PICKUP_MODE_ENABLED` | 0/1 | `1` = pickup 模式（推荐）；`0` = booking 模式（官方标注"未完全支持"，勿用） |
| `SLEEP_TIME` | int | 内部 tick，官方标注"勿动" |
| `VOTING_QUORUM` | int (%) | 会话投票通过所需百分比 |
| `VOTE_DURATION` | int | 投票持续时间（秒） |
| `BLACKLIST_MODE` | int | `0` = 普通踢出（可重连）；`1` = 踢出至服务器重启；`2` = 踢出并写入 `blacklist.txt` |
| `TC_ALLOWED` | int | 牵引力控制：`0` = 禁用；`1` = 仅原生支持 TC 的车；`2` = 全部允许 |
| `ABS_ALLOWED` | int | 防抱死：`0` = 禁用；`1` = 仅原生支持 ABS 的车；`2` = 全部允许 |
| `STABILITY_ALLOWED` | 0/1 | 稳定控制辅助 |
| `AUTOCLUTCH_ALLOWED` | 0/1 | 自动离合辅助 |
| `DAMAGE_MULTIPLIER` | int 0–100 | 伤害倍率，`0` = 无损，`100` = 完整伤害 |
| `FUEL_RATE` | int | 燃油消耗倍率，`100` = 真实 |
| `TYRE_WEAR_RATE` | int | 轮胎磨损倍率，`100` = 真实 |
| `CLIENT_SEND_INTERVAL_HZ` | int | 服务端发包频率（Hz），10 ≈ 100ms，越高联机质量越好但越占带宽 |
| `TYRE_BLANKETS_ALLOWED` | 0/1 | `1` = 轮胎起始温度为最佳（维修区出车 / 进站换胎后） |
| `ADMIN_PASSWORD` | string | 管理员密码，**必填**才能使用聊天管理指令（`/admin <pw>`） |
| `QUALIFY_MAX_WAIT_PERC` | int (%) | 排位结束后允许完成 in-lap 的时间因子，`120` = 最快圈 120% |
| `WELCOME_MESSAGE` | string | 欢迎信息文件路径 |
| `START_RULE` | int | 起步规则：`0` = 起跑前车辆锁定；`1` = 传送；`2` = drive-through（≤3 圈赛事启用传送处罚） |
| `NUM_THREADS` | int | 工作线程数，默认 `2` |
| `FORCE_VIRTUAL_MIRROR` | 0/1 | `1` = 强制所有客户端开启后视镜；`0` = 可选 |
| `LEGAL_TYRES` | string | 允许的轮胎配方简称，分号分隔（如 `V;E;HR;ST` 或 `S;M;H`） |
| `MAX_BALLAST_KG` | int | 管理员可通过 `/ballast` 添加的最大配重（kg） |
| `RACE_GAS_PENALTY_DISABLED` | 0/1 | `0` = 切弯处罚强制断油；`1` = 不强制（但写入结果 JSON） |
| `RESULT_SCREEN_TIME` | int | 比赛会话间结果屏停留时间（秒） |
| `RACE_EXTRA_LAP` | 0/1 | 计时赛：`1` = 头车在时间结束后需多跑一圈 |
| `LOCKED_ENTRY_LIST` | 0/1 | `1` = 仅 entry_list 内车手可加入（无需密码，类似 booking） |
| `RACE_PIT_WINDOW_START` | int | 进站窗口起始（圈数，或计时赛的分钟数） |
| `RACE_PIT_WINDOW_END` | int | 进站窗口结束 |
| `REVERSED_GRID_RACE_POSITIONS` | int | `0` = 无倒序赛；`1..X` = 前若干位倒序；`-1` = 全部倒序 |
| `TIME_OF_DAY_MULT` | int | 时间倍率：`1` = 实时；`2` = 2 倍速 |
| `UDP_PLUGIN_LOCAL_PORT` | int | UDP 插件本地监听端口 |
| `UDP_PLUGIN_ADDRESS` | string | UDP 插件远端地址 |
| `AUTH_PLUGIN_ADDRESS` | string | 鉴权插件地址 |

**重要提示：**
- `PASSWORD=` 空 + `REGISTER_TO_LOBBY=1` = 完全公开服务器
- `PASSWORD=xxx` + `REGISTER_TO_LOBBY=1` = 公开显示但需密码
- `REGISTER_TO_LOBBY=0` 时，玩家需通过 IP 直连或 Steam 好友加入
- 公开服务器**无 30 辆车的硬限制**（这是 ACC 的限制），AC 上限取决于赛道车位数
- Pickup 模式下，`entry_list.ini` 必须配置 ≥ `MAX_CLIENTS` 个 `[CAR_N]` 段

---

## 2. server_cfg.ini - [DYNAMIC_TRACK] 段（赛道抓地力演化）

模拟赛道随会话推进逐渐"上胶"的过程。

```ini
[DYNAMIC_TRACK]
SESSION_START=90
RANDOMNESS=1
LAP_GAIN=1
SESSION_TRANSFER=90
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `SESSION_START` | int (%) | 会话起始抓地力百分比（如 `90` = 90%） |
| `RANDOMNESS` | int | 起始抓地力的随机扰动 |
| `LAP_GAIN` | int | 每增加 1% 抓地力所需的圈数 |
| `SESSION_TRANSFER` | int (%) | 多少比例的累积抓地力传递到下一会话。`100` = 全部。例：90→96（+6%），`SESSION_TRANSFER=50` 则下一会话从 93 开始 |

---

## 3. server_cfg.ini - 会话段（PRACTICE / QUALIFY / RACE）

可启用 0~3 个会话段，**缺省的段会被跳过**（如删掉 `[PRACTICE]` 即为排位→正赛模式）。

### [PRACTICE] - 练习赛

```ini
[PRACTICE]
NAME=Free Practice
TIME=120
IS_OPEN=1
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `NAME` | string | 会话名称 |
| `TIME` | int (分钟) | 时长，配 `LOOP_MODE=1` 可近似无限 |
| `IS_OPEN` | int | `0` = 不可加入；`1` = 自由加入 |
| `INFINITE` | 0/1 | *(AssettoServer 扩展)* `1` = 会话永不结束/重置 |

### [QUALIFY] - 排位赛

```ini
[QUALIFY]
NAME=Qualifying
TIME=20
IS_OPEN=1
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `NAME` | string | 会话名称 |
| `TIME` | int (分钟) | 时长 |
| `IS_OPEN` | int | `0` = 不可加入；`1` = 自由加入 |

### [RACE] - 正赛

```ini
[RACE]
NAME=Race
LAPS=15
TIME=0
WAIT_TIME=120
IS_OPEN=2
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `NAME` | string | 会话名称 |
| `LAPS` | int | 圈数赛的总圈数 |
| `TIME` | int (分钟) | 计时赛时长（仅当 `LAPS=0` 时生效） |
| `WAIT_TIME` | int (秒) | 会话开始前等待时间 |
| `IS_OPEN` | int | `0` = 不可加入；`1` = 自由加入；**`2` = 绿灯前 20 秒仍可加入** |

### 会话类型一览

| 会话 | 段名 | 时长字段 | 加入字段 |
|------|------|---------|---------|
| Booking（勿用） | `[BOOK]` | `TIME` | — |
| 练习 | `[PRACTICE]` | `TIME` | `IS_OPEN` (0/1) |
| 排位 | `[QUALIFY]` | `TIME` | `IS_OPEN` (0/1) |
| 圈数正赛 | `[RACE]` | `LAPS` | `IS_OPEN` (0/1/2) |
| 计时正赛 | `[RACE]` | `TIME`（`LAPS=0`） | `IS_OPEN` (0/1/2) |

---

## 4. server_cfg.ini - [WEATHER_N] 段（天气）

至少配置一个 `[WEATHER_0]`，可堆叠多个（`[WEATHER_1]`、`[WEATHER_2]`…），每次新会话**随机选择一个**。

```ini
[WEATHER_0]
GRAPHICS=3_clear
BASE_TEMPERATURE_AMBIENT=18
VARIATION_AMBIENT=2
BASE_TEMPERATURE_ROAD=6
VARIATION_ROAD=1
WIND_BASE_SPEED_MIN=3
WIND_BASE_SPEED_MAX=15
WIND_BASE_DIRECTION=30
WIND_VARIATION_DIRECTION=15
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `GRAPHICS` | string | 天气预设，值为 `content/weather/` 下的文件夹名（如 `3_clear`；CSP/Sol 形如 `sol_03_scattered_clouds_type=17`） |
| `BASE_TEMPERATURE_AMBIENT` | int (°C) | 基础环境温度 |
| `VARIATION_AMBIENT` | int | 环境温度浮动范围（±） |
| `BASE_TEMPERATURE_ROAD` | int | 赛道温度相对附加值（**叠加**到最终环境温度上，可为负） |
| `VARIATION_ROAD` | int | 赛道温度浮动范围（±） |
| `WIND_BASE_SPEED_MIN` | int (m/s) | 风速下限 |
| `WIND_BASE_SPEED_MAX` | int (m/s) | 风速上限（最大 40） |
| `WIND_BASE_DIRECTION` | int (度) | 基础风向（风吹**去的方向**），`0` = 北，`90` = 东 |
| `WIND_VARIATION_DIRECTION` | int (度) | 风向浮动范围（±） |

**注意：**
- 风在整个会话内是**静态**的，速度和方向在会话开始时于给定范围内随机一次
- **官方字段名**是 `WIND_BASE_SPEED_MIN/MAX` + `WIND_BASE_DIRECTION` + `WIND_VARIATION_DIRECTION`，不存在单值的 `WIND_SPEED` / `WIND_DIRECTION`
- **路面温度公式**：`(BASE_TEMPERATURE_AMBIENT ± VARIATION_AMBIENT) + (BASE_TEMPERATURE_ROAD ± VARIATION_ROAD)`。例如 `BASE_TEMPERATURE_AMBIENT=18`、`VARIATION_AMBIENT=2`、`BASE_TEMPERATURE_ROAD=6`、`VARIATION_ROAD=1` → 路面 22~26°C

---

## 5. entry_list.ini - 车位 / 车手名单

每个车位是一个 `[CAR_N]` 段，`N` 从 `0` 开始递增。

```ini
[CAR_0]
DRIVERNAME=A. Rossi
TEAM=Team Apex
MODEL=ks_porsche_911_gt3_r_2017
SKIN=00_white
GUID=76561197983XXXXXX
SPECTATOR_MODE=0
BALLAST=0
RESTRICTOR=0
FIXED_SETUP=

[CAR_1]
DRIVERNAME=
TEAM=
MODEL=ferrari_458
SKIN=black_matte
GUID=
SPECTATOR_MODE=0
BALLAST=0
RESTRICTOR=0
FIXED_SETUP=
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `DRIVERNAME` | string | 大厅显示的车手名（留空时显示玩家 Steam 名） |
| `TEAM` | string | 车队名 |
| `MODEL` | string | 车模，**必须**在 `[SERVER] CARS` 允许列表中，值为 `content/cars/` 下文件夹名 |
| `SKIN` | string | 涂装，值为 `content/cars/MODEL/skins/` 下文件夹名。CSP 扩展可在涂装后附加代码：`/ACA3`（传送）、`/ABAH`（改色）、`/ADAn`（两者） |
| `GUID` | string | Steam64 GUID。**多个 GUID 用 `;` 分隔**可实现共享车位（同一时刻仅一人驾驶），用于耐力赛换人 |
| `PASSWORD` | string | 单车位密码（服务端识别但官方手册未文档化；建议用 `[SERVER] PASSWORD`） |
| `SPECTATOR_MODE` | 0/1 | `0` = 驾驶员；`1` = 观众。官方建议保持 `0` |
| `BALLAST` | int (kg) | 配重，**过大会严重影响操控** |
| `RESTRICTOR` | int 0–100 | 引擎功率限制器，`0` = 无限制；`100` = 全限制。仅削减高转速功率，不影响总功率，**优势是不影响操控** |
| `FIXED_SETUP` | string | 留空 → 服务端查找 `setups/<MODELNAME>.ini`；填文件名 → 使用该调校。删除 ini 中某些段（如 `[FUEL]`）可部分锁定 |
| `AI` | enum | *(AssettoServer 扩展)* `auto` = 空位 AI 占位；`fixed` = AI 永久占位；`none` = 不用（默认） |

**注意：**
- Pickup 模式下，`entry_list.ini` 必须配置 ≥ `MAX_CLIENTS` 个车位
- 查找个人 Steam64 GUID：跑一圈 AC 后查看 `Documents/Assetto Corsa/logs/log.txt` 中 `Steam Community ID:76561197983XXXXXX` 一行
- 跨 IP 的"换人"（driver swap）建议用 `;` 分隔多 GUID，并搭配 `FIXED_SETUP` 保证调校一致

---

## 6. blacklist.txt - 封禁名单

纯文本，每行一个 Steam64 GUID：

```
76561197983XXXXXX
76561197983YYYYYY
```

由 `BLACKLIST_MODE=2` 自动追加，也可手动维护。

---

## 7. csp_extra_options.ini - CSP 服务端扩展（第三方）

由 Custom Shaders Patch 识别，非官方。常见用途：
- 服务端灯光 / 反射
- 实时天气联动（CSP WeatherFX）
- 雨面 / 雪面动态渲染
- 客户端扩展命令

> 不属于 Kunos 官方规范，详细字段请参考 [CSP 文档](https://acstuff.ru/patch/)。

---

## 管理员聊天指令

`[SERVER] ADMIN_PASSWORD` 必须已配置。在聊天框输入：

| 指令 | 作用 |
|------|------|
| `/help` | 列出所有指令 |
| `/admin <密码>` | 登录管理员（如 `/admin kunos`） |
| `/next_session`（`/ksns`） | 跳到下一会话 |
| `/restart_session`（`/ksrs`） | 重启当前会话 |
| `/kick <名字>` | 按名字踢出 |
| `/kick_id <车位ID>` | 按车位 ID 踢出 |
| `/ban_id <车位ID>` | 按车位 ID 封禁 |
| `/ballast <车位ID> <kg>` | 添加配重（如 `/ballast 15 200`） |
| `/restrictor <车位ID> %` | 添加进气限制 |
| `/client_list` | 列出车位（`车位ID : 车手名`） |

---

## 模组规格约定

- **车模**：`content/cars/` 下文件夹名 == `[SERVER] CARS` 与 `[CAR_N] MODEL` 的值
- **赛道**：`content/tracks/` 下文件夹名 == `[SERVER] TRACK`
- **布局**：`content/tracks/TRACK/ui/` 下子文件夹名 == `CONFIG_TRACK`
- **涂装**：`content/cars/MODEL/skins/` 下文件夹名 == `SKIN`
- **天气**：`content/weather/` 下文件夹名 == `[WEATHER_N] GRAPHICS`

**向客户端分发模组**：官方方法为 `acServerManager.exe` → *Update Server Content*（打包 `content/` 目录树）；远程部署则上传整个 `server/` 文件夹（先备份三个 cfg 文件）。

---

## 端口与大厅注册

- **公开大厅**：`REGISTER_TO_LOBBY=1`（官方建议保持），服务器出现在全球服务器列表
- **局域网发现**：客户端使用 *Online → LAN* 标签页扫描
- **防火墙 / 路由器需转发的端口**：
  - `UDP_PORT`（默认 **9600**）— UDP
  - `TCP_PORT`（默认 **9600**）— TCP
  - `HTTP_PORT`（默认 **8081**）— **TCP 和 UDP 都要开**（大厅）

常见启动错误：`Error during Kunos lobby registration: ERROR, INVALID SERVER, CHECK YOUR PORT FORWARDING SETTINGS` → 检查上述端口转发和防火墙白名单。

**同一台机跑多个服务器**：每个实例需独立端口（`UDP_PORT` / `TCP_PORT` / `HTTP_PORT`），建议用独立可执行名（如 `acServer2.exe`）或独立文件夹。

---

## 常见配置示例

### A) 公开练习服务器

```ini
; server_cfg.ini
[SERVER]
NAME=AC Public Practice
CARS=ferrari_458;abarth500_s1
TRACK=vallelunga
CONFIG_TRACK=extended_circuit
SUN_ANGLE=-8
MAX_CLIENTS=15
UDP_PORT=9600
TCP_PORT=9600
HTTP_PORT=8081
PASSWORD=
LOOP_MODE=1
REGISTER_TO_LOBBY=1
PICKUP_MODE_ENABLED=1
SLEEP_TIME=1
VOTING_QUORUM=75
VOTE_DURATION=20
BLACKLIST_MODE=0
TC_ALLOWED=1
ABS_ALLOWED=1
STABILITY_ALLOWED=0
AUTOCLUTCH_ALLOWED=1
DAMAGE_MULTIPLIER=0
FUEL_RATE=100
TYRE_WEAR_RATE=100
CLIENT_SEND_INTERVAL_HZ=15
TYRE_BLANKETS_ALLOWED=1
ADMIN_PASSWORD=changeme
FORCE_VIRTUAL_MIRROR=1
TIME_OF_DAY_MULT=1

[PRACTICE]
NAME=Free Practice
TIME=120
IS_OPEN=1

[WEATHER_0]
GRAPHICS=3_clear
BASE_TEMPERATURE_AMBIENT=18
VARIATION_AMBIENT=2
BASE_TEMPERATURE_ROAD=6
VARIATION_ROAD=1
WIND_BASE_SPEED_MIN=3
WIND_BASE_SPEED_MAX=15
WIND_BASE_DIRECTION=30
WIND_VARIATION_DIRECTION=15
```

```ini
; entry_list.ini（至少 MAX_CLIENTS 个车位，MODEL 必须在 CARS 内）
[CAR_0]
DRIVERNAME=
TEAM=
MODEL=ferrari_458
SKIN=black_matte
GUID=
SPECTATOR_MODE=0
BALLAST=0
RESTRICTOR=0
FIXED_SETUP=

[CAR_1]
DRIVERNAME=
TEAM=
MODEL=abarth500_s1
SKIN=...
GUID=
SPECTATOR_MODE=0
BALLAST=0
RESTRICTOR=0
FIXED_SETUP=

; ... 重复至 [CAR_14]（共 15 个车位）
```

---

### B) 私密联赛短赛（排位 + 正赛）

```ini
; server_cfg.ini
[SERVER]
NAME=League Race (Private)
CARS=ks_porsche_911_gt3_r_2017;ks_ferrari_488_gt3;ks_audi_r8_lms_2016
TRACK=ks_silverstone
CONFIG_TRACK=gp
SUN_ANGLE=-8
MAX_CLIENTS=20
UDP_PORT=9600
TCP_PORT=9600
HTTP_PORT=8081
PASSWORD=leaguesecret
LOOP_MODE=0
REGISTER_TO_LOBBY=1
PICKUP_MODE_ENABLED=1
LOCKED_ENTRY_LIST=1
DAMAGE_MULTIPLIER=100
FUEL_RATE=100
TYRE_WEAR_RATE=100
TC_ALLOWED=1
ABS_ALLOWED=1
STABILITY_ALLOWED=0
FORCE_VIRTUAL_MIRROR=1
LEGAL_TYRES=S;M;H
ADMIN_PASSWORD=stewardpw
RACE_PIT_WINDOW_START=0
RACE_PIT_WINDOW_END=0
REVERSED_GRID_RACE_POSITIONS=0
START_RULE=0
RESULT_SCREEN_TIME=60

[QUALIFY]
NAME=Qualifying
TIME=20
IS_OPEN=1

[RACE]
NAME=Race
LAPS=15
WAIT_TIME=120
IS_OPEN=2

[DYNAMIC_TRACK]
SESSION_START=92
RANDOMNESS=1
LAP_GAIN=2
SESSION_TRANSFER=80
```

```ini
; entry_list.ini（绑定 GUID）
[CAR_0]
DRIVERNAME=A. Rossi
TEAM=Team Apex
MODEL=ks_porsche_911_gt3_r_2017
SKIN=00_white
GUID=76561197983XXXXXX
SPECTATOR_MODE=0
BALLAST=0
RESTRICTOR=0
```

---

### C) 耐力赛（计时 + 强制进站 + 换人）

```ini
; server_cfg.ini
[SERVER]
NAME=Endurance 3h
CARS=ks_ferrari_488_gt3;ks_lambo_huracan_gt3
TRACK=ks_nordschleife
CONFIG_TRACK=endurance
MAX_CLIENTS=30
UDP_PORT=9600
TCP_PORT=9600
HTTP_PORT=8081
PASSWORD=
LOOP_MODE=0
PICKUP_MODE_ENABLED=1
DAMAGE_MULTIPLIER=100
FUEL_RATE=100
TYRE_WEAR_RATE=100
TYRE_BLANKETS_ALLOWED=1
TC_ALLOWED=1
ABS_ALLOWED=1
RACE_EXTRA_LAP=1
RACE_PIT_WINDOW_START=60
RACE_PIT_WINDOW_END=150
LEGAL_TYRES=S;M;H
ADMIN_PASSWORD=enduro_admin
FORCE_VIRTUAL_MIRROR=1
TIME_OF_DAY_MULT=4

[QUALIFY]
NAME=Qualifying
TIME=30
IS_OPEN=1

[RACE]
NAME=3 Hour Race
LAPS=0
TIME=180
WAIT_TIME=180
IS_OPEN=2

[DYNAMIC_TRACK]
SESSION_START=88
RANDOMNESS=2
LAP_GAIN=3
SESSION_TRANSFER=100
```

```ini
; entry_list.ini（多 GUID 分号分隔，实现共享车位 / 换人）
[CAR_0]
DRIVERNAME=Car #7 Squad
TEAM=Team Enduro
MODEL=ks_ferrari_488_gt3
SKIN=00_red
GUID=76561197983AAAAAAA;76561197983BBBBBBB;76561197983CCCCCCC
SPECTATOR_MODE=0
BALLAST=0
RESTRICTOR=0
FIXED_SETUP=endurance_setup.ini
```

> **换人注意**：原版服务端中调校不会在换人间传递（用 `FIXED_SETUP` 解决），新车手会生成一辆新车，强制进站对换人的校验不完整。

---

## 配置文件编码

- 所有 INI 文件必须是 **UTF-8 编码**
- 建议使用 **UTF-8 without BOM**
- `;` 开头的行视为注释
- INI 段名大小写不敏感，但字段名建议**大写**以保持一致性
- 修改配置后需重启 `acServer.exe` 生效

---

## 配置文件路径

| 环境 | 路径 |
|------|------|
| Steam 默认安装 | `Steam\steamapps\common\assettocorsa\server\cfg\` |
| Docker 容器 | `/server/cfg/`（镜像内） |
| 挂载卷（推荐） | `<宿主机>/ac-configs/<server-name>/cfg/` |

修改 Docker 容器配置后执行：
```bash
docker restart ac-server1
```

---

## 与 ACC 服务器的关键差异

| 维度 | AC | ACC |
|------|----|----|
| 配置格式 | **INI** | JSON |
| 配置文件数 | 2 个主文件（`server_cfg.ini` + `entry_list.ini`） | 7 个 JSON 文件 |
| 车型 / 赛道 | 文件夹名（模组自由） | 预定义 ID |
| 公开服务车辆上限 | 取决于赛道维修区车位（无硬限制） | 30 |
| Booking 模式 | 存在但官方标注"未完全支持" | 不存在 |
| 管理员操作 | 聊天指令（`/admin`、`/ballast` 等） | HTTP API + 密码 |
| 性能平衡（BOP） | 通过 `BALLAST` / `RESTRICTOR` 手动调整 | 独立 `bop.json` |
| 车手分级（SA / RC） | 无 | 有 |
