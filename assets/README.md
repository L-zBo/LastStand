# 游戏素材目录

## 文件夹结构

```
assets/
├── sprites/
│   ├── players/    # 玩家角色精灵图
│   ├── enemies/    # 敌人精灵图
│   ├── effects/    # 特效（攻击、爆炸等）
│   ├── weapons/    # 武器图标
│   └── items/      # 道具拾取物
├── tiles/          # 地图瓦片
├── ui/             # UI元素
└── README.md       # 本文件
```

---

## 推荐的免费素材网站

### 国内网站

#### 1. 像素实验室 (pixlab24.com)
- **网址**: https://pixlab24.com/
- **特点**: 每月更新200+免费像素游戏素材，中文界面
- **推荐素材**:
  - [像素英雄和敌人角色包](https://pixlab24.com/character/3863/) - 1个英雄+5个敌人，300+帧动画
  - [12个像素战斗怪物](https://pixlab24.com/character/49491/) - 每个怪物4种颜色，共48个
  - [迷你平台游戏角色](https://pixlab24.com/character/21023/) - 9个独特角色
  - [16x16像素素材集](https://pixlab24.com/tilesets/6575/) - 完整图块+角色+敌人

#### 2. 爱给网 (aigei.com)
- **网址**: https://www.aigei.com/game/
- **特点**: 大量游戏资源素材，包含怪物、角色、场景
- **分类**: 图标、UI、场景、角色、技能、RPG素材等

---

### 国际网站 (CC0/免费商用)

#### 1. itch.io - 最推荐！
- **免费像素素材**: https://itch.io/game-assets/free/tag-pixel-art
- **CC0素材专区**: https://itch.io/game-assets/assets-cc0/tag-sprites
- **特点**: 2385+免费CC0素材，质量高
- **热门素材包**:
  - Kenney Game Assets All-in-1 (超大合集)
  - Ninja Adventure Asset Pack
  - Free 16x16 Mini World Sprites
  - 72 Cute Pixel Character

#### 2. OpenGameArt.org
- **网址**: https://opengameart.org/
- **CC0专区**: https://opengameart.org/content/cc0-resources
- **特点**: 历史悠久的免费游戏素材社区
- **推荐搜索**:
  - "pixel enemies" - 像素敌人
  - "roguelike sprites" - 肉鸽精灵
  - "fantasy characters" - 奇幻角色

#### 3. Kenney.nl
- **网址**: https://kenney.nl/assets
- **特点**: 所有素材100% CC0，可商用
- **推荐**:
  - Tiny Dungeon 系列
  - Pixel Platformer 系列
  - RPG系列

#### 4. CraftPix.net
- **免费区**: https://craftpix.net/freebies/
- **怪物素材**: https://craftpix.net/freebies/free-monster-enemy-game-sprites/
- **特点**: 高质量2D素材，无商用限制

#### 5. CleanPNG
- **网址**: https://www.cleanpng.com/free/game-sprite.html
- **特点**: 171+透明PNG游戏精灵图

#### 6. The Spriters Resource
- **网址**: https://www.spriters-resource.com/
- **特点**: 大量经典游戏精灵图参考

#### 7. GitHub资源
- **[Game Assets And Resources](https://github.com/HotpotDesign/Game-Assets-And-Resources)** - 150+游戏资源汇总
- **[Free Pixel Assets](https://github.com/TheBiochemic/free_px_assets)** - 免费像素素材合集

---

## 素材命名规范

### 玩家角色
```
player_warrior_idle.png      # 战士待机
player_warrior_walk.png      # 战士行走
player_mage_idle.png         # 法师待机
player_assassin_attack.png   # 刺客攻击
player_ranger_idle.png       # 游侠待机
player_summoner_idle.png     # 召唤师待机
```

### 敌人
```
enemy_normal_idle.png        # 普通敌人
enemy_fast_walk.png          # 快速敌人
enemy_tank_idle.png          # 坦克敌人
enemy_elite_idle.png         # 精英敌人
enemy_boss_idle.png          # Boss
enemy_boss_attack.png        # Boss攻击
```

### 特效
```
effect_slash.png             # 斩击特效
effect_fire.png              # 火焰特效
effect_ice.png               # 冰冻特效
effect_lightning.png         # 闪电特效
effect_heal.png              # 治疗特效
effect_explosion.png         # 爆炸特效
effect_levelup.png           # 升级特效
```

### 武器图标
```
weapon_sword.png             # 剑
weapon_bow.png               # 弓
weapon_staff.png             # 法杖
weapon_dagger.png            # 匕首
weapon_axe.png               # 斧头
```

---

## 图片规格建议

| 类型 | 推荐尺寸 | 说明 |
|------|----------|------|
| 玩家角色 | 32x32 或 64x64 | PNG透明背景 |
| 普通敌人 | 32x32 或 48x48 | 较小便于区分 |
| 精英敌人 | 48x48 或 64x64 | 比普通敌人大 |
| Boss | 64x64 或 128x128 | 最大最显眼 |
| 特效动画 | 64x64 | 精灵图序列 |
| 武器图标 | 16x16 或 32x32 | UI显示用 |
| 地图瓦片 | 32x32 | 统一尺寸 |

---

## 快速获取素材步骤

### 方法1: itch.io (最快)
1. 访问 https://itch.io/game-assets/free/tag-pixel-art
2. 点击 "Top free" 或 "Most popular"
3. 筛选 "Characters" 或 "Enemies"
4. 找到喜欢的素材包，点击下载
5. 解压后放入对应 assets 子文件夹

### 方法2: 像素实验室 (中文)
1. 访问 https://pixlab24.com/
2. 点击 "角色" 或 "怪物" 分类
3. 选择免费素材下载
4. 整理到对应文件夹

### 方法3: Kenney (最省心)
1. 访问 https://kenney.nl/assets
2. 搜索 "pixel" 或 "dungeon"
3. 所有素材都是CC0，直接下载使用

---

## 代码中使用素材

下载素材后，游戏会通过 `js/assets.js` 自动加载：

```javascript
// 素材会自动尝试加载，如果文件不存在则使用默认渲染
// 只需将素材放入对应文件夹并按规范命名即可

// 示例：如果存在 assets/sprites/players/warrior.png
// 游戏会自动使用该图片渲染战士角色
```

---

## 版权说明

| 许可证 | 说明 | 是否可商用 |
|--------|------|-----------|
| CC0 | 公共领域，无任何限制 | ✅ 是 |
| CC-BY | 需注明作者 | ✅ 是 |
| CC-BY-SA | 需注明作者+相同许可 | ✅ 是 |
| CC-BY-NC | 需注明作者+非商业 | ❌ 否 |
| GPL | 开源许可 | ✅ 是 |

**建议**: 优先选择 CC0 素材，无需担心版权问题！

---

## 注意事项

1. **下载前确认许可证** - 确保素材允许你的使用场景
2. **保持文件格式** - 推荐PNG（支持透明）
3. **统一尺寸** - 同类素材保持相同大小
4. **备份原文件** - 修改前先备份
5. **记录来源** - 建议记录素材来源便于后续查询
