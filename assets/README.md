# 游戏素材目录

## 🚀 快速开始 - 使用裁剪工具生成素材

1. 在浏览器中打开 `tools/sprite_extractor.html`
2. 点击各分类的"裁剪"按钮预览精灵图
3. 点击每个精灵下方的"下载"按钮保存PNG文件
4. 将下载的文件放入对应目录

## 📁 目录结构

```
assets/
├── players/          # 玩家角色
│   ├── warrior.png   # 战士
│   ├── mage.png      # 法师
│   ├── assassin.png  # 刺客
│   ├── ranger.png    # 游侠
│   └── summoner.png  # 召唤师
│
├── enemies/          # 敌人
│   ├── skeleton.png  # 骷髅 (normal)
│   ├── greenBlob.png # 绿色生物 (normal)
│   ├── blueSlime.png # 蓝史莱姆 (normal)
│   ├── rat.png       # 老鼠 (normal)
│   ├── snake.png     # 蛇 (normal)
│   ├── redImp.png    # 红色小怪 (fast)
│   ├── redDevil.png  # 红色小鬼 (fast)
│   ├── blackCat.png  # 黑猫 (fast)
│   ├── stoneGolem.png # 石头怪 (tank)
│   ├── orc.png       # 绿皮兽人 (tank)
│   ├── greenOrc.png  # 绿色兽人 (tank)
│   ├── demon.png     # 红色恶魔 (elite)
│   ├── hornedDemon.png # 红角恶魔 (elite)
│   ├── fireMan.png   # 橙色火人 (elite)
│   └── smallDragon.png # 小龙 (elite)
│
├── bosses/           # Boss
│   ├── bear.png      # 红熊怪
│   ├── frog.png      # 青蛙王
│   ├── eyeball.png   # 眼球怪
│   ├── flame.png     # 火焰魔
│   ├── dragon.png    # 绿龙
│   ├── beetle.png    # 蓝甲虫
│   ├── spider.png    # 毒蜘蛛
│   ├── snakeBoss.png # 蛇妖
│   ├── oneEyeDemon.png # 独眼魔
│   └── dragonHead.png # 龙首
│
├── weapons/          # 武器
│   ├── dagger.png    # 匕首
│   ├── sword.png     # 长剑
│   ├── holyBlade.png # 圣剑
│   ├── staff.png     # 法杖
│   ├── axe.png       # 战斧
│   ├── bow.png       # 弓
│   ├── phoenixBow.png # 凤凰弓
│   ├── shadowBlade.png # 暗影刃
│   ├── arcaneStaff.png # 奥术法杖
│   ├── bloodAxe.png  # 嗜血斧
│   ├── fireball.png  # 火球杖
│   └── inferno.png   # 炼狱杖
│
└── items/            # 道具
    ├── healthPotion.png # 生命药水
    ├── manaPotion.png   # 魔法药水
    ├── ruby.png         # 红宝石
    ├── emerald.png      # 绿宝石
    ├── sapphire.png     # 蓝宝石
    ├── diamond.png      # 钻石
    ├── key.png          # 钥匙
    ├── coin.png         # 金币
    ├── coinBag.png      # 钱袋
    ├── scroll.png       # 卷轴
    ├── bomb.png         # 炸弹
    ├── shield.png       # 盾牌
    ├── helmet.png       # 头盔
    ├── ring.png         # 戒指
    └── necklace.png     # 项链
```

## 🎨 素材来源

精灵图从以下PNG文件裁剪：
- `PNG/yDDd9O.png` - 角色和敌人精灵图 (16x16像素，10列6行)
- `PNG/BOSS.png` - Boss精灵图 (32x32像素，5列2行)
- `PNG/工具武器.png` - 武器和道具精灵图 (16x16像素，10列6行)

## 📝 素材规格

| 类型 | 原始尺寸 | 导出尺寸 | 说明 |
|------|----------|----------|------|
| 玩家角色 | 16x16 | 64x64 | 4倍放大，像素风格 |
| 敌人 | 16x16 | 64x64 | 4倍放大 |
| Boss | 32x32 | 64x64 | 2倍放大 |
| 武器 | 16x16 | 64x64 | 4倍放大 |
| 道具 | 16x16 | 64x64 | 4倍放大 |

## ⚙️ 代码使用

素材通过 `js/assets.js` 自动加载：

```javascript
// 游戏启动时自动加载所有素材
preloadAssets(() => {
    initGame();
});

// 绘制函数
drawPlayerSprite(ctx, 'warrior', x, y, width, height);
drawEnemySprite(ctx, 'normal', enemyId, x, y, width, height);
drawBossSprite(ctx, 'dragon', x, y, width, height);
drawWeaponSprite(ctx, 'sword', x, y, width, height);
```

如果素材文件不存在，游戏会回退到默认的emoji渲染。

---

## 🔗 更多免费素材

### 推荐网站
- **itch.io**: https://itch.io/game-assets/free/tag-pixel-art
- **OpenGameArt**: https://opengameart.org/
- **Kenney.nl**: https://kenney.nl/assets (100% CC0)
- **像素实验室**: https://pixlab24.com/

### 许可证说明
| 许可证 | 说明 | 可商用 |
|--------|------|--------|
| CC0 | 公共领域 | ✅ |
| CC-BY | 需注明作者 | ✅ |
| CC-BY-NC | 非商业 | ❌ |
