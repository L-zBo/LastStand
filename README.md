# LastStand

一款网页端肉鸽（Roguelike）生存射击游戏。纯原生 JavaScript + Canvas 2D，无框架、无构建工具、无后端，支持单人与双人同屏。

> 本文档中的所有数量、数值均取自代码实测（`js/data.js`、`js/config.js`、`js/assets.js`），不是估算。

---

## 快速开始

**方式一：直接打开**

双击 `game.html` 即可。已实测 `file://` 协议下 167 个精灵素材全部正常加载、无 console 报错。

**方式二：本地 HTTP 服务器**（推荐用于开发调试）

```bash
python -m http.server 8123
# 浏览器打开 http://127.0.0.1:8123/game.html
```

`file://` 下浏览器会把画布标记为跨源污染，`getImageData` 不可用——只影响像素级调试手段，不影响游戏本身。

推荐 Chrome / Edge / Firefox 等现代浏览器。

---

## 操作

| 操作 | 单人 | 双人 P1 | 双人 P2 |
|------|------|---------|---------|
| 移动 | WASD 或 方向键 | WASD | 方向键 |
| 冲刺 | 空格 | 空格 | Enter |
| 主动技能 | Q | Q | 右 Shift |
| 暂停/继续 | ESC | ESC | ESC |

- **冲刺**：持续 150ms，冷却 3 秒，**期间无敌**，可用来穿过敌群或躲 Boss 技能。无方向输入时朝上一次移动方向冲。
- **主动技能**：每个职业一个，冷却 8~22 秒不等，见下方职业表。

---

## 游戏流程

```
主菜单 → 选存档位(6) → 选人数(1/2) → 选职业(8) → 选难度(4) → 选地图(6) → 开打
   ↑                                                                      ↓
   └──────────── 死亡结算，按战绩折算灵魂石 ←── 波次循环 ←────────────────┘
```

每波消灭全部敌人后进入商店；每 10 波是 Boss 波，Boss 波结束先选遗物再进商店。

---

## 职业（8 个）

| 职业 | 生命 | 攻击 | 速度 | 射程 | 攻击类型 | 初始武器 | 被动 | 主动技能（冷却） |
|------|-----:|-----:|-----:|-----:|------|------|------|------|
| 🛡️ 战士 | 150 | 15 | 3.0 | 50 | melee | 🗡️ 短剑 | 减伤 10%，攻击击退 | 📢 战吼：120 范围眩晕 1.5s，自身攻击 +50% 持续 4s（12s） |
| 🧙 法师 | 80 | 25 | 3.5 | 150 | magic | 🪄 法杖 | 魔法穿透，范围 +30% | ❄️ 暴风雪：150 范围每 0.3s 造成 60% 攻击力，持续 3s（15s） |
| 🥷 刺客 | 100 | 20 | 5.0 | 45 | melee | 🔪 匕首 | 25% 暴击，首击必暴 | 👤 影步：瞬移到最近敌人身后，300% 暴击伤害（8s） |
| 🏹 游侠 | 110 | 18 | 4.0 | 200 | ranged | 🏹 短弓 | 双箭齐发，攻速 +20% | 🌧️ 箭雨：目标区域 200 范围内造成 10 次伤害（14s） |
| 🔮 召唤师 | 90 | 12 | 3.2 | 180 | summon | 🪄 法杖 | 召唤 3 幽灵，击杀回血 | 💥 灵魂爆破：引爆全部召唤物，每个 150 范围 200% 攻击力（18s） |
| ⚔️ 骑士 | 180 | 18 | 2.8 | 55 | melee | 🪓 战斧 | 减伤 15%，反弹 20% 伤害 | 🏰 堡垒：3s 完全无敌并嘲讽周围敌人（20s） |
| ✝️ 圣骑士 | 140 | 16 | 3.0 | 80 | holy | 🗡️ 短剑 | 攻击回血，对亡灵 +50% | ✨ 圣光审判：180 范围 250% 伤害并回复 30% 最大生命（16s） |
| 💀 死灵法师 | 75 | 22 | 3.3 | 160 | dark | 🔥 火球术 | 召唤 5 骷髅，吸取 5% 生命 | ☠️ 亡灵大军：召唤 8 个临时骷髅，持续 8s（22s） |

「射程」列是职业**基础攻击**的射程；武器有各自独立的射程（见下方武器表）。侧边面板的 `📍` 一栏显示 `基础/最远武器` 两个值。

---

## 核心系统

### 波次

- 第 N 波敌人数 = `5 + (N-1) × 2`，Boss 波额外 +5
- 每波最后一只是**精英怪**；每 10 波刷 **Boss**
- 敌人生成间隔 800ms，波间休息 3 秒
- 顶栏实时显示 `🌊 波次 (剩N)`
- 敌人在玩家周围的**环形区域**生成（屏幕外、清理半径内）；跑得太远的敌人会被重新投放到玩家附近，**不会凭空消失**

### 敌人（84 种 + 12 Boss）

| 档位 | 数量 | 出现条件 |
|------|-----:|----------|
| normal 普通 | 24 | 全程 |
| fast 快速 | 19 | 随机 15% |
| tank 坦克 | 19 | 随机 15% |
| elite 精英 | 22 | 每波最后一只 |
| ranged 远程 | 复用 normal 素材 | 第 3 波起 |
| splitter 分裂 | 复用 tank 素材 | 第 5 波起，死亡分裂出子怪 |

**Boss 按固定顺序出场**：红熊怪 → 青蛙王 → 眼球怪 → 火焰魔 → 蓝甲虫 → 蛇妖 → 独眼魔 → 岩石巨人 → 九头蛇 → 犀牛魔 → 梦魇战马 → 巨龙

### 武器（18 把）

6 把基础武器（满级 5 级）+ 6 件配件 + 6 把进化武器。基础武器满级后与对应配件合成进化：

| 基础武器（伤害 / 射程 / 冷却） | + 配件 | → 进化武器（伤害 / 射程 / 冷却） |
|---|---|---|
| 🗡️ 短剑 (5 / 110 / 0.8s) | 盾牌 | 圣光之剑 (25 / 180 / 0.8s) |
| 🔪 匕首 (3 / 90 / 0.4s) | 斗篷 | 暗影之刃 (15 / 160 / 0.4s) |
| 🏹 短弓 (4 / 320 / 0.6s) | 箭袋 | 凤凰弓 (20 / 400 / 0.6s) |
| 🪄 法杖 (6 / 300 / 0.9s) | 魔法书 | 奥术法杖 (30 / 380 / 0.9s) |
| 🪓 战斧 (8 / 130 / 1.2s) | 拳套 | 嗜血战斧 (35 / 200 / 1.2s) |
| 🔥 火球术 (7 / 280 / 1.1s) | 余烬 | 炼狱之火 (40 / 360 / 1.1s) |

射程与冷却是每把武器自己的数据（`js/data.js` 的 `range` / `cooldown` 字段），不再按 melee/ranged/evolved 分档硬编码。射程还会乘玩家的 `rangeMultiplier`（法师被动、范围类强化都改这个值）。

配件（盾牌 / 斗篷 / 箭袋 / 魔法书 / 拳套 / 余烬）只提供被动属性，**不参与攻击循环**，也不会单独造成伤害。

每个职业开局自带一把初始武器（见职业表），不再是空手开局。

### 强化与掉落

- **通用 Buff**：15 种（攻击、生命、速度、暴击、吸血、多重攻击、经验加成……）
- **职业专属 Buff**：8 套，每个职业一套独有强化
- **遗物**：12 件，带稀有度权重，Boss 波结算时三选一
- **商店道具**：12 种，用金币在波次间购买
- **掉落**：金币 / Buff / 道具，带拾取范围与磁吸

### 地图（6 张）

| 地图 | 特殊效果 | 草丛 | 石头 | 树 | 合计 |
|------|----------|-----:|-----:|---:|-----:|
| 🌲 幽暗森林 | — | 320 | 120 | 260 | 700 |
| 🏜️ 荒芜沙漠 | — | 80 | 300 | 40 | 420 |
| 🏰 黑暗地牢 | 黑暗（视野受限） | 50 | 460 | 10 | 520 |
| ❄️ 冰封雪原 | 移动减速 | 140 | 240 | 150 | 530 |
| 🌋 熔岩地狱 | 持续伤害 | 40 | 420 | 0 | 460 |
| 🌊 深海遗迹 | — | 200 | 260 | 80 | 540 |

世界尺寸 8000 × 6000。地图瓦片优先加载 PNG，缺失时由 `generateMapTile()` 程序化生成像素瓦片兜底。障碍物走静态空间网格，只建一次，绘制端按相机视野裁剪，密度提到 400~700 后帧率实测仍稳在 63 fps。

**草丛机制**：躲进草丛可对普通敌人隐身，精英怪和 Boss 照样能发现你。

### 难度（4 档）

| 难度 | 敌人生命 | 敌人伤害 | 经验 |
|------|---------|---------|------|
| 简单 | ×0.7 | ×0.7 | ×1.2 |
| 普通 | ×1.0 | ×1.0 | ×1.0 |
| 困难 | ×1.5 | ×1.5 | ×1.3 |
| 噩梦 | ×2.0 | ×2.0 | ×1.5 |

### 成就（29 个 / 8 类）

基础 4、生存 4、波次 4、Boss 4、职业 3、难度 3、特殊 4、隐藏若干。奖励 5~150 灵魂石。

成就在**局内实时结算**：击杀、波次、等级、金币、Boss、无伤波次等指标一旦达标立刻弹出解锁提示（多个同时解锁会错开 600ms 依次弹）。实时进度存在内存里，落盘发生在死亡结算与页面关闭（`beforeunload`）时。

### 伤害减免

`减伤% = damageReduction + armor × 0.5%`，**上限 90%**。所有玩家受伤点统一走 `applyDamageToPlayer()`，避免多个减伤来源叠加超过 100% 后「挨打回血」。侧边面板 `🛡️` 一栏显示的就是这个综合值。

### 永久强化（8 项）

死亡后按战绩折算灵魂石，在主菜单「💎 永久强化」里买跨局的永久属性：
最大生命、攻击、速度、经验加成、暴击率、生命回复、拾取范围、冲刺冷却。

### 存档

6 个存档槽，存 `localStorage`（键名 `roguelikeSave_1` ~ `roguelikeSave_6`，沿用改名前的旧前缀）。保存玩家属性、武器、被动、遗物、波次与击杀数，双人模式额外保存 P2 的职业与全部属性。存档带 `version` 字段与迁移入口（`migrateSaveData`），属性走 `PLAYER_SAVE_PROPS` 映射表驱动序列化，只存与默认值不同的字段。

---

## 项目结构

```
LastStand/
├── game.html                # 唯一入口，全部 UI 结构 + 模块引用
├── README.md
├── favicon.ico / favicon.png
│
├── js/                      # 11 个模块，按依赖顺序在 game.html 中引入
│   ├── config.js            # 画布/世界/波次/难度/地图配置，地图瓦片与环境素材预加载
│   ├── data.js              # CLASSES / WEAPONS / BUFFS / CLASS_BUFFS / RELICS / SHOP_ITEMS / DROP_CONFIG
│   ├── audio.js             # SFX 音效
│   ├── meta.js              # 灵魂石永久强化
│   ├── achievements.js      # 29 个成就与解锁面板
│   ├── assets.js            # 素材路径映射与精灵绘制（167 张图）
│   ├── entities.js          # Particle / DroppedItem / Obstacle / MapEvent / Projectile /
│   │                        #   EnemyProjectile / Summon / WeaponProjectile / Player / Enemy
│   ├── ui.js                # 面板刷新、升级选择、波次结算、商店、遗物、通知
│   ├── save.js              # 6 槽存档
│   ├── wave.js              # 刷怪位置、波次推进、完成判定
│   └── main.js              # 游戏循环、空间网格、摄像机、武器攻击、小地图、事件绑定
│
├── css/                     # 10 个样式模块
│   ├── base.css             # 重置与全局
│   ├── menu.css             # 开始菜单、职业/难度/地图选择
│   ├── game-layout.css      # 顶栏、双侧面板、画布布局
│   ├── equipment.css        # 武器栏、被动栏、遗物栏
│   ├── modals.css           # 弹窗、暂停、倒计时
│   ├── levelup.css          # 升级卡片、结算界面
│   ├── save-system.css      # 存档槽
│   ├── notifications.css    # 通知与动画
│   ├── achievements.css     # 成就面板
│   └── responsive.css       # 响应式
│
├── assets/                  # 387 张 PNG
│   ├── players/   (8)       # 8 个职业立绘
│   ├── enemies/   (84)      # 四档普通敌人
│   ├── bosses/    (12)      # Boss
│   ├── weapons/   (26)      # 武器图标
│   ├── items/     (37)      # 道具图标
│   ├── environment/         # trees(40) / bushes(4) / rock_0~2
│   ├── tiles/     (6)       # 六张地图的瓦片
│   ├── backgrounds/ ui/     # 菜单背景与 UI 元素
│   ├── monsters_library/    # 备用怪物素材池
│   └── backup/              # 历史素材备份
│
├── PNG/                     # 原始精灵图集（抠图脚本的输入，勿删）
├── scripts/                 # Playwright 验证脚本（_gamedriver.py 是公共驱动）+ 历史抠图脚本
├── tools/                   # JS/Python 素材提取工具（sharp / SAM2）
├── docs/                    # 测试报告与截图
└── _sync_conflicts/         # Syncthing 冲突副本隔离区（已 gitignore，可整目录删）
```

---

## 开发与验证

所有验证脚本依赖 `playwright`（chromium）。Windows 下**必须**带编码环境变量，否则中文输出会 `UnicodeEncodeError`：

```bash
# 单人完整流程：菜单 → 成就 → 永久强化 → 存档 → 战斗 → 暂停 → 保存 → 读档（55 项断言）
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/e2e_verify.py

# 双人模式：双职业、双面板、两套按键、升级同步等待、一方阵亡、存读档往返（31 项断言）
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/e2e_verify_dual.py

# Boss 全流程：Boss 生成 → 真实击杀 → 遗物选择 → 商店购买 → 推进下一波 → 第 120 波巨龙（19 项断言）
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/verify_boss_wave.py

# 长局压测：连打 4 分钟，监控帧率、数组增长、NaN 探针、敌人守恒、成就实时解锁（18 项断言）
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/stress_long_run.py

# 全职业冒烟：8 个职业 × 6 张地图轮转，含主动技能与初始武器，验证没有职业会卡死
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/smoke_all_classes.py

# 刷怪/清理逻辑回归：敌人守恒 + enemiesRemaining 递减
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/repro_enemy_cull.py

# 击杀结算防重入回归：killCount 必须等于实际死亡敌人数
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/repro_double_kill.py

# file:// 协议下素材加载核实
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/check_file_protocol.py

# 敌人追击行为诊断（非断言脚本，出问题时用来看敌人到底在干嘛）
PYTHONIOENCODING=utf-8 PYTHONUTF8=1 python scripts/diag_enemy_chase.py
```

脚本自带静态 HTTP 服务器（端口 8123 ~ 8131），无需手动起服务。公共部分收在 `scripts/_gamedriver.py`：起服务、走开局流程、自动点掉会阻塞主循环的弹窗（升级 / 商店 / 遗物）、推进指定秒数、状态快照。

**当前基线**（全部实测）：

| 脚本 | 结果 |
|---|---|
| `e2e_verify.py` | 55/55 |
| `e2e_verify_dual.py` | 31/31 |
| `verify_boss_wave.py` | 19/19 |
| `stress_long_run.py` | 18/18，240 秒 63.7 fps，打到第 10 波 170 杀 |
| `smoke_all_classes.py` | 8/8 |
| `repro_enemy_cull.py` | 敌人零静默丢失 |
| `repro_double_kill.py` | 重复结算全部拦下，击杀数与实际死亡数一致 |
| `check_file_protocol.py` | `file://` 下 167/167 素材加载 |

零未捕获 JS 异常，主循环零异常帧。

> ⚠️ 写断言前先确认数据结构和刷新时机。踩过的坑：`ACHIEVEMENTS` 是对象不是数组（`.length` 得到 `undefined`）；UI 每 200ms 批量刷新，刚发生的击杀要等一个周期才上屏；关闭升级面板会立刻恢复战斗，几百毫秒内很可能再次升级或清完本波翻进商店，把状态断言写死成 `playing` 必然误报。

### 只做静态审查抓不到的那一类 bug

游戏主循环挂在 `requestAnimationFrame` 上，回调里抛异常会**静默中断整条链**——画面还在，但不刷怪、不计时、没有任何红字提示。所以验证脚本必须真正进入战斗、监听 `pageerror`，并且**遍历所有职业**跑一遍：本项目最严重的两个 bug（召唤师/死灵法师开局崩、`grantSoulStones` 未定义）都只在特定职业或特定时点触发，只测一两个职业根本发现不了。

现在 `gameLoop` 外层包了异常护栏（`try/catch` + 幂等排帧），单帧抛异常不会再让整局游戏静默死掉，但会在 console 打印计数——**看到 `[gameLoop] 第 N 次异常` 就是有真问题，不要忽略**。

`scripts/` 下另有 13 个 `.py` 是历史抠图脚本（从 `PNG/` 提取精灵到 `assets/`），路径已改为基于 `PROJECT_ROOT` 的相对路径（原本硬编码了早已不存在的 `F:\VsCodeproject\roge game\`）。注意它们会覆盖输出目录，而成品素材经过人工修图，**跑之前先想清楚**。

`tools/` 下是素材提取工具链：`extract_sprites.js`（sharp）、`sam2_auto_extract.py` / `extract_objects_sam2.py`（SAM2 分割）、`sprite_extractor.html`（浏览器里手动切图）。

---

## 已知问题与待办

### 第一轮修复（2026-08-11）

| 严重度 | 问题 | 修法 |
|--------|------|------|
| 🔴 致命 | **召唤师 / 死灵法师一进游戏就静默卡死**。`gameLoop` 里 `buildEnemyGrid()` 排在所有实体 `update()` 之后，进入战斗第一帧 `game.enemyGrid` 还是 `undefined`，而这两个职业开局就有召唤物（3 幽灵 / 5 骷髅），`Summon.update()` 调 `getNearbyEnemies()` 直接抛异常、当帧中断整个循环。画面还在，但不刷怪、不计时 —— 8 个职业里有 2 个完全不能玩 | 网格构建提到所有 `update()` 之前；`getNearbyEnemies` / `getNearbyObstacles` 补空网格兜底 |
| 🔴 严重 | **敌人凭空消失、波次白送**。刷怪点在整个 8000×6000 世界随机取（只要求离玩家 ≥400），而超距清理半径只有 `max(画布宽,高)×2 ≈ 2480`。实测生成距离中位数 2054，**28% 的敌人一生成就在半径外，下一帧被 `filter` 删掉** —— 不计击杀、不补生成，而 `enemiesSpawned` 已经加过，于是「场上敌人为 0」提前成立，玩家没打几只怪波次就结束 | 刷怪改为玩家周围环形（屏幕外 ~ 清理半径 70%）；超距敌人改为**重新投放**而非删除，敌人总数守恒 |
| 🟠 | **击杀重复结算**。同一帧内玩家攻击、武器投射物、召唤物、溅射、毒伤可能同时把一只敌人打到 0 血以下，各自都调一次 `handleEnemyKill`，导致击杀数、经验、掉落、吸血全部多算（实测 16 次调用里 4 次是重复） | `handleEnemyKill` 加 `_killHandled` 防重入闸 |
| 🟠 | **远程武器打不到射程内的敌人**。空间网格固定查 3×3 格，保证覆盖半径只有 `GRID_CELL_SIZE = 200`，而远程武器射程 300、进化武器 350、召唤物索敌、追踪箭、弹射、影步(300)、箭雨(350) 都超过 200，落在 200~350 的敌人会被漏检 | `getNearbyEnemies(x, y, radius)` 增加半径参数，按 `ceil(radius / 200)` 动态扩展扫描格数；12 处调用点逐个补上真实半径 |
| 🟠 | `game.wave.enemiesRemaining` 是死字段：只在 `startNewWave` 赋值，全项目从不递减 | 击杀时递减、分裂时递增，并显示到顶栏 `🌊 波次 (剩N)` |
| 🟠 | `css/base.css` 用 `@import` 拉 Google Fonts。CSS 的 `@import` 阻塞样式表解析，国内访问 `fonts.googleapis.com` 不通时整页白屏等到超时 | 改为 `game.html` 里的非阻塞 `<link media="print" onload>`，拉不到就回落系统字体 |
| 🟡 | `scripts/` 下 13 个 Python 抠图脚本硬编码了 `F:\VsCodeproject\roge game\`（早已不存在的路径），全部跑不了 | 统一改为基于 `PROJECT_ROOT` 的相对路径 |

### 第二轮修复（2026-08-12）

这一轮的主线是「把只写不读、只读不写的死字段挖出来」——它们不会报错，只是让一整套设计好的机制静静地什么也不做。

| 严重度 | 问题 | 修法 |
|--------|------|------|
| 🔴 致命 | **`grantSoulStones` 根本不存在**。`checkAchievements` 解锁成就时调它发灵魂石，而 `meta.js` 里只有签名完全不同的 `grantSoulStoneReward(wave, kills, time, difficulty)`。原先成就只在 `gameOver` 结算，异常被结算流程盖住了；改成实时结算后，局内第一次解锁成就就会抛 `ReferenceError`，**直接打断 `requestAnimationFrame` 链**——画面停住、时间不走、敌人定格，没有任何提示 | 补上 `grantSoulStones(amount, reason)`；`gameLoop` 外层加异常护栏（`try/catch` + 幂等排帧），单帧异常不再让整局静默死掉 |
| 🔴 | **配件混进武器攻击循环造成 NaN 伤害**。配件（盾牌/斗篷/箭袋…）没有 `damage` 字段，被当成武器发射后伤害算出 `NaN`，敌人血量变 `NaN` 后既不大于 0 也不小于 0，判定全线失效，敌人静默消失 | 攻击循环跳过 `type === 'accessory'`；伤害公式全部套 `|| 0` 兜底；压测加 NaN 血量/坐标探针常驻监控 |
| 🔴 | **读档后可以无限复活**。凤凰之羽的 `phoenixUsed` 标记没进存档字段表，读档后恢复成 `undefined`，等于每次读档白送一次复活 | 补进 `PLAYER_SAVE_PROPS` |
| 🟠 | **减伤能叠到 100% 以上，挨打反而回血**。多个减伤来源直接相加，没有上限，`damage * (1 - 1.2)` 得到负数 | 统一走 `applyDamageToPlayer()`，减伤上限 90%，5 处受伤点全部改走它 |
| 🟠 | **5 个成就永远解锁不了**。`bossKills` / `dragonKills` / `perfectWaves` 三个字段全项目只读不写 | 击杀 Boss/巨龙时累加，波次完成时统计无伤波数；实时上报到成就系统 |
| 🟠 | **`expBonus` 是死字段**，永久强化「智慧强化」和遗物「灵魂捕手」买了完全没效果——玩家属性上叫 `expMultiplier` | 统一改写 `expMultiplier` |
| 🟠 | **`armor` 是死字段**，骑士的护甲属性从来没参与过伤害计算 | 并入 `getDamageReduction()`，1 点护甲 = 0.5% 减伤 |
| 🟠 | **`knockbackImmune` 是死字段**，骑士的「坚定不移」是个空强化（游戏里压根没有敌人击退玩家的机制） | 改成 `armor +20 / healthRegen +2` |
| 🟠 | **双人升级/商店面板要求阵亡的一方也点一下才能继续**。两个面板都是「两侧都选完才恢复」，队友躺了之后活着的那位得替尸体再点一次 | 阵亡一方不再生成选项，直接标记为已选并显示 💀「已阵亡，无法选择」；复活后文案会复原 |
| 🟠 | **双人模式下 P2 拿到的是 P1 职业的专属强化**。`showClassBuffOptionsForPlayer` 读 `player.className`，而 `Player` 上存的字段叫 `classType`，永远读到 `undefined` 后回落 `game.selectedClass`（P1 的职业） | 改读 `player.classType` |
| 🟠 | **`ui.js` 的定时器不受管**：13 处 `setTimeout` + 1 处 `setInterval` 只有 1 处做了清理，通知/倒计时进行中退回主菜单，回调照样触发 | 统一走 `registerUiTimeout` / `registerUiInterval`，开局、读档、重开、结算四处调 `clearAllUiTimers()` |
| 🟡 | 玩家没有初始武器，开局纯靠职业基础攻击 | 8 个职业各配一把 `startingWeapon`（见职业表） |
| 🟡 | 两套射程并行：职业 `attackRange` 与武器硬编码的 100/300/350，面板只显示前者 | 武器射程改数据驱动（`weapon.range`/`cooldown`），统一乘 `rangeMultiplier`；面板显示 `基础/最远武器` |
| 🟡 | 8000×6000 的世界只放 60 树 / 60 石，「幽暗森林」观感是空旷草原 | 六张地图密度提到 420~700，实测帧率不受影响（63.7 fps） |

### 待办

| 优先级 | 问题 |
|--------|------|
| 🟡 | 存档键名仍是改名前的 `roguelikeSave_`，要改得考虑老存档迁移 |
| 🟢 | 从暂停恢复时没有倒计时，点「继续」敌人立刻扑上来（`showCountdown()` 只在开局用） |
| 🟢 | 像素字体 Press Start 2P 走 Google Fonts CDN，国内拉不到时回落系统字体（已不阻塞渲染） |

### 环境提醒

项目位于 Syncthing 同步目录下，`.git/` 内部出现过 52 个 `*.sync-conflict-*` 副本（含 `config`、`HEAD`、`packed-refs`、31 个 object）。`git fsck` 目前未报损坏，但**建议在 Syncthing 里把 `.git/` 加入忽略**，否则两端同时提交迟早把仓库同步坏。工作区的冲突副本已统一隔离到 `_sync_conflicts/`（已 gitignore），确认无用后可整目录删除。

---

## 技术特点

- 纯原生 JavaScript，零依赖、零构建，改完刷新即生效
- Canvas 2D 渲染，`imageSmoothingEnabled = false` 保持像素风
- 空间网格（`GRID_CELL_SIZE = 200`）加速障碍物与敌人的邻近查询，查询半径按调用方实际需求动态扩展；障碍物网格只建一次，敌人网格每帧重建且排在所有 `update()` 之前
- 主循环包异常护栏 + 幂等排帧，单帧抛异常不会中断 `requestAnimationFrame` 链
- 摄像机跟随（双人模式取两人中点）+ 小地图，绘制端按视野裁剪
- UI 每 200ms 批量刷新，避免逐帧 DOM 操作；UI 定时器统一纳管，切场景时一次清空
- `localStorage` 存档，带版本号与迁移入口，无后端
