# ACC Server 配置文件说明

Assetto Corsa Competizione Dedicated Server 配置文件完整字段说明

---

## 配置文件列表

| 文件名 | 用途 |
|--------|------|
| `configuration.json` | 网络端口配置 |
| `settings.json` | 服务器基本设置 |
| `event.json` | 赛道和赛程配置 |
| `eventRules.json` | 赛事规则 |
| `assistRules.json` | 驾驶辅助限制 |
| `bop.json` | 性能平衡配置 |
| `entrylist.json` | 车手名单 |

---

## 1. configuration.json - 网络配置

```json
{
  "udpPort": 9100,
  "tcpPort": 9101,
  "maxConnections": 70,
  "lanDiscovery": 1,
  "registerToLobby": 0,
  "configVersion": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `udpPort` | int | UDP端口，游戏数据传输端口 |
| `tcpPort` | int | TCP端口，HTTP API端口 |
| `maxConnections` | int | 最大连接数，公开服务器限制30，私密服务器可达70 |
| `lanDiscovery` | int | LAN发现：0=禁用，1=启用局域网发现 |
| `registerToLobby` | int | **重要**：0=私密服务器（仅直连），1=公开服务器（Steam大厅可见） |
| `configVersion` | int | 配置版本号，保持为1 |

**注意：**
- `registerToLobby=1` 时，服务器会显示在Steam公共大厅
- `registerToLobby=0` 时，玩家需要通过Steam连接或浏览器链接加入
- Steam查询端口 = UDP端口 - 1

---

## 2. settings.json - 服务器设置

```json
{
  "serverName": "MOZA RACING-TEST",
  "adminPassword": "2333",
  "password": "",
  "spectatorPassword": "0000",
  "centralEntryListPath": "",
  "carGroup": "GT3",
  "trackMedalsRequirement": 0,
  "safetyRatingRequirement": -1,
  "racecraftRatingRequirement": -1,
  "maxCarSlots": 60,
  "isRaceLocked": 1,
  "isLockedPrepPhase": 0,
  "shortFormationLap": 1,
  "dumpLeaderboards": 1,
  "dumpEntryList": 1,
  "randomizeTrackWhenEmpty": 0,
  "allowAutoDQ": 1,
  "ignorePrematureDisconnects": 1,
  "formationLapType": 3,
  "configVersion": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `serverName` | string | 服务器名称，显示在服务器列表中 |
| `adminPassword` | string | 管理员密码，用于管理员指令 |
| `password` | string | 服务器密码，空字符串=公开服务器 |
| `spectatorPassword` | string | 观察者密码 |
| `centralEntryListPath` | string | 中央车手名单路径，留空使用本地entrylist |
| `carGroup` | string | 车辆分组：`FreeForAll`/`GT3`/`GT4`/`GTC`/`TCX` |
| `trackMedalsRequirement` | int | 赛道勋章要求：-1=无要求，0-3=对应勋章等级 |
| `safetyRatingRequirement` | int | 安全评级(SA)要求：-1=无要求，0-99=最低SA值 |
| `racecraftRatingRequirement` | int | 赛车评级(RC)要求：-1=无要求 |
| `maxCarSlots` | int | 最大车位数，公开服务器最多30 |
| `isRaceLocked` | int | 锁定比赛：0=可自由加入，1=比赛开始后锁定 |
| `isLockedPrepPhase` | int | 锁定准备阶段：0=允许加入，1=禁止加入 |
| `shortFormationLap` | int | 短编队圈：0=完整编队圈，1=短编队圈 |
| `dumpLeaderboards` | int | 导出排行榜：0=禁用，1=启用 |
| `dumpEntryList` | int | 导出车手名单：0=禁用，1=启用 |
| `randomizeTrackWhenEmpty` | int | 空服时随机赛道：0=禁用，1=启用 |
| `allowAutoDQ` | int | 自动取消资格：0=禁用，1=启用 |
| `ignorePrematureDisconnects` | int | 忽略提前断开：0=计入，1=不计入 |
| `formationLapType` | int | 编队圈类型：0=老式，1=新式分离，2=新式分离自动，3=锦标赛风格 |
| `configVersion` | int | 配置版本号 |

**重要提示：**
- `password=""` 且 `registerToLobby=1` = 完全公开服务器
- `password="xxx"` 且 `registerToLobby=1` = 公开显示但需要密码
- 公开服务器最多30辆车（系统限制）
- 增加 `trackMedalsRequirement` 和 `safetyRatingRequirement` 可获得更多车位

---

## 3. event.json - 赛道和赛程

```json
{
  "track": "monza",
  "ambientTemp": 18,
  "trackTemp": 25,
  "cloudLevel": 0.0,
  "rain": 0.0,
  "weatherRandomness": 0,
  "simracerWeatherConditions": 0,
  "isFixedConditionQualification": 1,
  "preRaceWaitingTimeSeconds": 90,
  "sessionOverTimeSeconds": 150,
  "postQualySeconds": 30,
  "postRaceSeconds": 30,
  "sessions": [...],
  "configVersion": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `track` | string | 赛道名称（如 `monza`, `spa`, `nurburgring`） |
| `ambientTemp` | int | 环境温度（摄氏度） |
| `trackTemp` | int | 赛道温度（摄氏度） |
| `cloudLevel` | float | 云量：0.0=晴天，1.0=多云 |
| `rain` | float | 降雨量：0.0=无雨，1.0=大雨 |
| `weatherRandomness` | int | 天气随机性：0=固定，1-7=随机程度 |
| `simracerWeatherConditions` | int | 模拟赛车天气：0=动态，1=固定 |
| `isFixedConditionQualification` | int | 排位固定天气：0=动态，1=与正赛相同 |
| `preRaceWaitingTimeSeconds` | int | 赛前等待时间（秒） |
| `sessionOverTimeSeconds` | int | 超时时间（秒） |
| `postQualySeconds` | int | 排位后等待时间（秒） |
| `postRaceSeconds` | int | 正赛后等待时间（秒） |
| `sessions` | array | 赛程数组 |
| `configVersion` | int | 配置版本号 |

### sessions 数组元素

```json
{
  "sessionType": "P",
  "dayOfWeekend": 1,
  "hourOfDay": 14,
  "sessionDurationMinutes": 15,
  "timeMultiplier": 1
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `sessionType` | string | 赛程类型：`P`=练习，`Q`=排位，`R`=正赛 |
| `dayOfWeekend` | int | 周末天数：1/2/3（周五/周六/周日） |
| `hourOfDay` | int | 开始时间（小时） |
| `sessionDurationMinutes` | int | 赛程时长（分钟），正赛可用圈数替代 |
| `timeMultiplier` | int | 时间倍率：1=实时，2=2倍速度 |

**常用赛道名称：**
- `monza` - 蒙扎
- `spa` - 斯帕
- `nurburgring` - 纽博格林
- `barcelona` - 巴塞罗那
- `imola` - 伊莫拉
- `zolder` - 佐尔德
- `brands_hatch` - 布兰兹哈奇
- `kyalami` - 卡亚拉米
- `suzuka` - 铃鹿
- `laguna_seca` - 拉古纳塞卡
- `mount_panorama` - 澳大利亚
- `detroit` - 底特律
- `misano` - 米萨诺
- `valencia` - 瓦伦西亚
- `oulton_park` - 奥尔顿公园
- `donington` - 唐宁顿
- `hungaroring` - 匈牙利
- `zandvoort` - 赞德沃特
- `red_bull_ring` - 红牛环
- `watkins_glen` - 沃特金斯峡谷
- `sachsenring` - 萨克森灵
- `interlagos` - 英特拉格斯
- `bathurst` - 巴瑟斯特
- `kansai` - 关西
- `ricard` - 保罗·里卡尔

---

## 4. eventRules.json - 赛事规则

```json
{
  "qualifyStandingType": 1,
  "pitWindowLengthSec": -1,
  "driverStintTimeSec": -1,
  "mandatoryPitstopCount": 0,
  "maxTotalDrivingTime": -1,
  "maxDriversCount": 3,
  "tyreSetCount": 50,
  "isRefuellingAllowedInRace": true,
  "isRefuellingTimeFixed": false,
  "isMandatoryPitstopRefuellingRequired": false,
  "isMandatoryPitstopTyreChangeRequired": false,
  "isMandatoryPitstopSwapDriverRequired": false
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `qualifyStandingType` | int | 排位类型：0=自定义，1=标准排位 |
| `pitWindowLengthSec` | int | 进站窗口时长（秒），-1=无限制 |
| `driverStintTimeSec` | int | 车手驾驶时长限制（秒），-1=无限制 |
| `mandatoryPitstopCount` | int | 强制进站次数 |
| `maxTotalDrivingTime` | int | 最大总驾驶时长（秒），-1=无限制 |
| `maxDriversCount` | int | 每车最多车手数 |
| `tyreSetCount` | int | 可用轮胎套数 |
| `isRefuellingAllowedInRace` | bool | 正赛是否允许加油 |
| `isRefuellingTimeFixed` | bool | 加油时间是否固定 |
| `isMandatoryPitstopRefuellingRequired` | bool | 强制进站是否必须加油 |
| `isMandatoryPitstopTyreChangeRequired` | bool | 强制进站是否必须换胎 |
| `isMandatoryPitstopSwapDriverRequired` | bool | 强制进站是否必须换车手 |

---

## 5. assistRules.json - 驾驶辅助限制

```json
{
  "disableIdealLine": 0,
  "disableAutosteer": 1,
  "stabilityControlLevelMax": 0,
  "disableAutoPitLimiter": 0,
  "disableAutoGear": 1,
  "disableAutoClutch": 0,
  "disableAutoEngineStart": 0,
  "disableAutoWiper": 0,
  "disableAutoLights": 0
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `disableIdealLine` | int | 禁用理想路线：0=允许，1=禁用 |
| `disableAutosteer` | int | 禁用自动转向：0=允许，1=禁用 |
| `stabilityControlLevelMax` | int | 稳定控制最大等级：0-100，0=完全禁用 |
| `disableAutoPitLimiter` | int | 禁用自动进站限速：0=允许，1=禁用 |
| `disableAutoGear` | int | 禁用自动换挡：0=允许，1=禁用 |
| `disableAutoClutch` | int | 禁用自动离合：0=允许，1=禁用 |
| `disableAutoEngineStart` | int | 禁用自动启动引擎：0=允许，1=禁用 |
| `disableAutoWiper` | int | 禁用自动雨刮：0=允许，1=禁用 |
| `disableAutoLights` | int | 禁用自动灯光：0=允许，1=禁用 |

---

## 6. bop.json - 性能平衡

```json
{
  "entries": [
    {
      "track": "monza",
      "carModel": 20,
      "ballastKg": 3
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `entries` | array | BOP配置数组 |

### entries 元素字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `track` | string | 适用赛道 |
| `carModel` | int | 车型ID |
| `ballastKg` | int | 增加重量（kg），负值=减重 |

**常用车型ID：**
- 0: Ferrari 488 GT3
- 1: Ferrari 488 GT3 Evo
- 2: Lamborghini Huracan GT3
- 3: Lamborghini Huracan GT3 Evo
- 4: McLaren 650S GT3
- 5: McLaren 720S GT3
- 6: Mercedes-AMG GT3
- 7: Mercedes-AMG GT3 Evo
- 8: BMW M6 GT3
- 9: Porsche 991 GT3 R
- 10: Porsche 992 GT3 R
- 11: Audi R8 LMS GT3
- 12: Audi R8 LMS Evo
- 13: Audi R8 LMS Evo II
- 14: Bentley Continental GT3 2016
- 15: Bentley Continental GT3 2018
- 16: Nissan GT-R Nismo GT3
- 17: Jaguar G3
- 18: Honda NSX GT3
- 19: Honda NSX GT3 Evo
- 20: Lexus RC F GT3
- 21: Aston Martin V12 Vantage GT3
- 22: Aston Martin Vantage GT4
- 23: Lamborghini Huracan Super Trofeo
- 24: Porsche 911 GT3 Cup
- 25: BMW M2 CS
- 26: Porsche 991 GT3 Cup
- 27: Chevrolet Camaro GT4
- 28: Ginetta G55 GT4
- 29: KTM X-Bow GT4
- 30: Maserati MC GT4
- 31: Mercedes AMG GT4
- 32: Alpine A110 GT4
- 33: Aston Martin Vantage GT4
- 34: Audi R8 LMS GT4
- 35: BMW M4 GT4
- 36: Chevrolet Corvette C7.R

---

## 7. entrylist.json - 车手名单

```json
{
  "entries": [
    {
      "teamName": "Team Name",
      "raceNumber": 1,
      "defaultGridPosition": 0,
      "ballastKg": 0,
      "restrictor": 0,
      "isServerAdmin": 0,
      "forcedCarModel": -1,
      "overrideCarModelForCustomCar": 0,
      "overrideDriverInfo": 0,
      "customCar": "",
      "drivers": [
        {
          "driverCategory": 0,
          "firstName": "Driver",
          "lastName": "Name",
          "playerID": "S76561198...",
          "shortName": "",
          "nationality": 0
        }
      ]
    }
  ],
  "forceEntryList": 1
}
```

### entries 元素字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `teamName` | string | 车队名称 |
| `raceNumber` | int | 比赛号码 |
| `defaultGridPosition` | int | 默认发车位置，0=无固定位置 |
| `ballastKg` | int | 增加重量（kg） |
| `restrictor` | int | 进气限制百分比 |
| `isServerAdmin` | int | 是否管理员：0=否，1=是 |
| `forcedCarModel` | int | 强制车型ID，-1=由车手选择 |
| `overrideCarModelForCustomCar` | int | 覆盖自定义车型：0=否，1=是 |
| `overrideDriverInfo` | int | 覆盖车手信息：0=否，1=是 |
| `customCar` | string | 自定义车型路径 |
| `drivers` | array | 车手数组 |

### drivers 元素字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `driverCategory` | int | 车手等级：0=铜，1=银，2=金，3=职业 |
| `firstName` | string | 名 |
| `lastName` | string | 姓 |
| `playerID` | string | Steam ID（格式：`S76561198...`） |
| `shortName` | string | 简称（3个字符） |
| `nationality` | int | 国籍代码 |

### forceEntryList 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `forceEntryList` | int | 强制车手名单：0=自由选择，1=仅限名单内车手 |

**注意：**
- `forceEntryList=1` 仅对私密服务器有效
- 公开服务器会忽略此设置，允许任意车手加入
- Steam ID 格式：`S` + Steam64 ID

---

## 常见配置示例

### 公开练习服务器

```json
// configuration.json
{
  "registerToLobby": 1
}

// settings.json
{
  "serverName": "Public Practice Server",
  "password": "",
  "carGroup": "GT3"
}

// event.json
{
  "sessions": [
    {"sessionType": "P", "sessionDurationMinutes": 120}
  ]
}
```

### 私密耐力赛服务器

```json
// configuration.json
{
  "registerToLobby": 0
}

// settings.json
{
  "serverName": "Private Endurance",
  "password": "racepass",
  "maxCarSlots": 70
}

// event.json
{
  "sessions": [
    {"sessionType": "P", "sessionDurationMinutes": 30},
    {"sessionType": "Q", "sessionDurationMinutes": 20},
    {"sessionType": "R", "sessionDurationMinutes": 180}
  ]
}

// entrylist.json
{
  "forceEntryList": 1
}
```

---

## 配置文件编码

- 所有配置文件必须是 **UTF-8编码**
- 建议使用 **UTF-8 without BOM**
- 修改配置后需重启容器生效

---

## Docker环境配置路径

| 环境 | 配置路径 |
|------|----------|
| 本地测试 | `E:\AC\Assetto Corsa Competizione Dedicated Server\server\cfg\` |
| Docker容器 | `E:\acc-configs\{server-name}\cfg\` |
| 容器内部 | `C:\acc-server\cfg\` |

修改Docker容器配置后执行：
```powershell
docker restart acc-server1
```