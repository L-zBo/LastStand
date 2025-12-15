# 游戏素材目录

## 文件夹结构

```
assets/
├── sprites/
│   ├── players/    # 玩家角色精灵图
│   ├── enemies/    # 敌人精灵图
│   ├── effects/    # 特效（攻击、爆炸、治疗等）
│   ├── weapons/    # 武器图标和动画
│   └── items/      # 道具、拾取物
├── tiles/          # 地图瓦片
├── ui/             # UI元素（按钮、图标、边框）
└── README.md       # 本文件
```

## 推荐的免费素材网站 (CC0 / 免费商用)

### 1. itch.io (推荐)
- **网址**: https://itch.io/game-assets/free/tag-pixel-art
- **CC0素材**: https://itch.io/game-assets/free/tag-cc0/tag-pixel-art
- **特点**: 大量高质量像素风格素材，许多是CC0协议

推荐素材包:
- "Pirate Bomb" - 1个角色 + 5种敌人
- "Simple Platformer Paper Pixels" - 角色和敌人动画
- "Sprite Pack 7" - 3个免费角色

### 2. OpenGameArt.org
- **网址**: https://opengameart.org/
- **CC0专区**: https://opengameart.org/taxonomy/term/4
- **搜索**: https://opengameart.org/art-search?keys=pixel+enemies

推荐搜索关键词:
- "pixel enemies" - 像素敌人
- "roguelike sprites" - 肉鸽游戏精灵
- "fantasy characters pixel" - 奇幻角色
- "effects pixel art" - 特效

### 3. CraftPix.net
- **免费素材**: https://craftpix.net/freebies/
- **特点**: 高质量2D游戏素材，有完整的角色包

### 4. Kenney.nl
- **网址**: https://kenney.nl/assets
- **特点**: 所有素材都是CC0，可商用
- **推荐**: "Tiny Dungeon" 系列

## 素材命名规范

### 玩家角色
```
player_warrior_idle.png      # 战士待机
player_warrior_walk.png      # 战士行走
player_mage_idle.png         # 法师待机
player_assassin_attack.png   # 刺客攻击
```

### 敌人
```
enemy_normal_idle.png        # 普通敌人待机
enemy_fast_walk.png          # 快速敌人行走
enemy_tank_idle.png          # 坦克敌人
enemy_boss_attack.png        # Boss攻击
```

### 特效
```
effect_slash.png             # 斩击特效
effect_fire.png              # 火焰特效
effect_heal.png              # 治疗特效
effect_explosion.png         # 爆炸特效
effect_levelup.png           # 升级特效
```

### 武器
```
weapon_sword.png             # 剑
weapon_bow.png               # 弓
weapon_staff.png             # 法杖
weapon_dagger.png            # 匕首
```

## 图片规格建议

| 类型 | 尺寸 | 说明 |
|------|------|------|
| 玩家角色 | 32x32 或 64x64 | 带透明背景的PNG |
| 敌人 | 32x32 或 48x48 | 普通敌人较小 |
| Boss | 64x64 或 128x128 | Boss更大更显眼 |
| 特效 | 64x64 | 精灵图序列 |
| 武器图标 | 16x16 或 32x32 | UI显示用 |
| 地图瓦片 | 32x32 | 统一尺寸便于拼接 |

## 使用方法

下载素材后，将文件放入对应文件夹，然后在代码中加载:

```javascript
// 示例：加载玩家精灵图
const playerSprite = new Image();
playerSprite.src = 'assets/sprites/players/player_warrior_idle.png';

// 示例：加载敌人精灵图
const enemySprite = new Image();
enemySprite.src = 'assets/sprites/enemies/enemy_normal_idle.png';
```

## 注意事项

1. **版权**: 请确保下载的素材是CC0或允许免费商用的
2. **格式**: 推荐使用PNG格式（支持透明背景）
3. **尺寸**: 保持同类素材尺寸一致
4. **命名**: 使用英文小写+下划线命名

## 快速获取素材步骤

1. 访问 https://itch.io/game-assets/free/tag-cc0/tag-pixel-art
2. 筛选 "Characters" 或 "Enemies" 类别
3. 下载喜欢的素材包
4. 解压后将文件放入对应的 assets 子文件夹
5. 在代码中引用使用
