/**
 * 精灵图自动裁剪脚本 - 修正版
 * 运行方式: node tools/extract_sprites.js
 *
 * 素材统计:
 * - 玩家角色: 8种
 * - 敌人: 28种
 * - Boss: 10种 (9个独立精灵 + spider复用snakeBoss)
 * - 武器: 26种
 * - 道具: 37种
 * - 总计: 109种素材
 *
 * 网格参数 (实际测量):
 * - 角色/怪物: 6行 x 10列, 每格约24x24px
 * - Boss: 不规则布局, 使用精确像素坐标
 * - 武器/道具: 4行 x 11列, 每格约28x28px (非Codex假设的6x10/18px)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

// 背景色 (实际测量: #686557, RGB: 104, 101, 87)
const BG_COLOR = { r: 104, g: 101, b: 87 };
const COLOR_TOLERANCE = 15;

// 确保目录存在
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 去除背景色，转为透明
async function removeBackground(inputBuffer) {
    const image = sharp(inputBuffer);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const newData = Buffer.alloc(info.width * info.height * 4);

    for (let i = 0; i < info.width * info.height; i++) {
        const srcIdx = i * info.channels;
        const dstIdx = i * 4;

        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];

        const isBg = Math.abs(r - BG_COLOR.r) < COLOR_TOLERANCE &&
                     Math.abs(g - BG_COLOR.g) < COLOR_TOLERANCE &&
                     Math.abs(b - BG_COLOR.b) < COLOR_TOLERANCE;

        if (isBg) {
            newData[dstIdx] = 0;
            newData[dstIdx + 1] = 0;
            newData[dstIdx + 2] = 0;
            newData[dstIdx + 3] = 0;
        } else {
            newData[dstIdx] = r;
            newData[dstIdx + 1] = g;
            newData[dstIdx + 2] = b;
            newData[dstIdx + 3] = 255;
        }
    }

    return sharp(newData, {
        raw: { width: info.width, height: info.height, channels: 4 }
    }).png().toBuffer();
}

// 裁剪并去背景
async function extractSprite(sheetPath, x, y, w, h, outputPath, scale = 4) {
    try {
        const cropped = await sharp(sheetPath)
            .extract({ left: x, top: y, width: w, height: h })
            .toBuffer();

        const transparent = await removeBackground(cropped);

        await sharp(transparent)
            .resize(w * scale, h * scale, { kernel: sharp.kernel.nearest })
            .png()
            .toFile(outputPath);

        return true;
    } catch (err) {
        console.error(`  ✗ ${outputPath}: ${err.message}`);
        return false;
    }
}

async function main() {
    console.log('🎮 精灵图裁剪工具 (扩充版)');
    console.log('================================\n');

    const assetsDir = path.join(ROOT, 'assets');
    const charSheet = path.join(ROOT, 'PNG/角色，怪物.png');
    const bossSheet = path.join(ROOT, 'PNG/BOSS.png');
    const weaponSheet = path.join(ROOT, 'PNG/工具武器.png');

    // ============ 角色怪物精灵图 - 精确坐标 ============
    const COL_X = [16, 43, 70, 97, 123, 149, 176, 204, 231, 257];
    const ROW_Y = [16, 43, 70, 95, 122, 149];  // 添加第6行
    const SPRITE_SIZE = 24;

    // 玩家角色 (8种)
    const PLAYERS = {
        warrior:     { row: 0, col: 5, name: '战士' },
        mage:        { row: 2, col: 5, name: '法师' },
        assassin:    { row: 3, col: 3, name: '刺客' },
        ranger:      { row: 1, col: 7, name: '游侠' },
        summoner:    { row: 4, col: 2, name: '召唤师' },
        knight:      { row: 0, col: 6, name: '骑士' },
        paladin:     { row: 1, col: 5, name: '圣骑士' },
        necromancer: { row: 2, col: 3, name: '死灵法师' }
    };

    // 敌人 (28种)
    const ENEMIES = {
        // 普通敌人 (normal) - 8种
        skeleton:    { row: 0, col: 0, name: '骷髅' },
        greenBlob:   { row: 0, col: 2, name: '绿色史莱姆' },
        blueSlime:   { row: 4, col: 0, name: '蓝色史莱姆' },
        rat:         { row: 4, col: 4, name: '老鼠' },
        snake:       { row: 4, col: 5, name: '毒蛇' },
        bat:         { row: 0, col: 1, name: '蝙蝠' },
        spider:      { row: 4, col: 6, name: '蜘蛛' },
        zombie:      { row: 1, col: 0, name: '僵尸' },

        // 快速敌人 (fast) - 6种
        redImp:      { row: 2, col: 0, name: '红色小鬼' },
        redDevil:    { row: 3, col: 1, name: '红色恶魔' },
        blackCat:    { row: 4, col: 7, name: '黑猫' },
        wolf:        { row: 4, col: 1, name: '灰狼' },
        ghost:       { row: 1, col: 1, name: '幽灵' },
        shadowFiend: { row: 3, col: 0, name: '暗影魔' },

        // 坦克敌人 (tank) - 6种
        stoneGolem:  { row: 2, col: 7, name: '石头傀儡' },
        orc:         { row: 1, col: 3, name: '兽人战士' },
        greenOrc:    { row: 0, col: 4, name: '绿皮兽人' },
        troll:       { row: 1, col: 2, name: '巨魔' },
        ogre:        { row: 2, col: 2, name: '食人魔' },
        ironGolem:   { row: 3, col: 2, name: '铁傀儡' },

        // 精英敌人 (elite) - 8种
        demon:       { row: 0, col: 3, name: '恶魔' },
        hornedDemon: { row: 2, col: 4, name: '角魔' },
        fireMan:     { row: 1, col: 4, name: '火焰元素' },
        smallDragon: { row: 3, col: 7, name: '幼龙' },
        darkKnight:  { row: 0, col: 7, name: '黑暗骑士' },
        lich:        { row: 2, col: 1, name: '巫妖' },
        vampire:     { row: 4, col: 3, name: '吸血鬼' },
        warlock:     { row: 3, col: 4, name: '术士' }
    };

    // 裁剪玩家
    console.log('📦 裁剪玩家角色 (8种)...');
    ensureDir(path.join(assetsDir, 'players'));
    let playerCount = 0;
    for (const [id, info] of Object.entries(PLAYERS)) {
        const x = COL_X[info.col];
        const y = ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'players', `${id}.png`);
        const ok = await extractSprite(charSheet, x, y, SPRITE_SIZE, SPRITE_SIZE, outPath);
        if (ok) playerCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    console.log(`  完成: ${playerCount}/${Object.keys(PLAYERS).length}\n`);

    // 裁剪敌人
    console.log('📦 裁剪敌人 (28种)...');
    ensureDir(path.join(assetsDir, 'enemies'));
    let enemyCount = 0;
    for (const [id, info] of Object.entries(ENEMIES)) {
        const x = COL_X[info.col];
        const y = ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'enemies', `${id}.png`);
        const ok = await extractSprite(charSheet, x, y, SPRITE_SIZE, SPRITE_SIZE, outPath);
        if (ok) enemyCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    console.log(`  完成: ${enemyCount}/${Object.keys(ENEMIES).length}\n`);

    // ============ BOSS精灵图 - 修正坐标 (精确像素测量) ============
    console.log('📦 裁剪Boss (10种)...');
    ensureDir(path.join(assetsDir, 'bosses'));

    // 坐标来自实际像素分析, 每个Boss使用精确边界框
    const BOSSES = {
        bear:        { x: 15,  y: 12,  w: 69,  h: 63,  name: '红熊怪' },
        frog:        { x: 89,  y: 10,  w: 42,  h: 40,  name: '青蛙王' },
        eyeball:     { x: 85,  y: 38,  w: 52,  h: 36,  name: '眼球怪' },
        flame:       { x: 141, y: 15,  w: 50,  h: 55,  name: '火焰魔' },
        dragon:      { x: 197, y: 3,   w: 140, h: 79,  name: '绿龙' },
        beetle:      { x: 15,  y: 90,  w: 87,  h: 50,  name: '蓝甲虫' },
        snakeBoss:   { x: 109, y: 82,  w: 60,  h: 65,  name: '蛇妖' },
        oneEyeDemon: { x: 174, y: 111, w: 38,  h: 38,  name: '独眼魔' },
        dragonHead:  { x: 208, y: 70,  w: 127, h: 79,  name: '龙首' }
        // spider: 精灵图上无独立蜘蛛Boss, 复用snakeBoss (在后面单独处理)
    };

    let bossCount = 0;
    for (const [id, info] of Object.entries(BOSSES)) {
        const outPath = path.join(assetsDir, 'bosses', `${id}.png`);
        const ok = await extractSprite(bossSheet, info.x, info.y, info.w, info.h, outPath, 2);
        if (ok) bossCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    // spider Boss复用snakeBoss精灵 (精灵图上无独立蜘蛛Boss)
    const spiderSrc = path.join(assetsDir, 'bosses', 'snakeBoss.png');
    const spiderDst = path.join(assetsDir, 'bosses', 'spider.png');
    if (fs.existsSync(spiderSrc)) {
        fs.copyFileSync(spiderSrc, spiderDst);
        bossCount++;
        console.log('  ✓ spider (毒蜘蛛) <- 复用snakeBoss');
    }
    console.log(`  完成: ${bossCount}/10\n`);

    // ============ 武器道具精灵图 - 修正网格 (实际: 4行x11列, 约28px/格) ============
    // 行像素范围: [(9,37), (39,67), (69,97), (99,126)]
    // 列像素范围: [(8,36), (38,66), (68,95), (98,126), (128,156), (158,186), (188,216), (218,246), (248,276), (278,306), (308,336)]
    const WPN_ROW_TOPS = [9, 39, 69, 99];
    const WPN_ROW_BOTS = [37, 67, 97, 126];
    const WPN_COL_LEFTS = [8, 38, 68, 98, 128, 158, 188, 218, 248, 278, 308];
    const WPN_COL_RIGHTS = [36, 66, 95, 126, 156, 186, 216, 246, 276, 306, 336];

    // 按实际网格坐标提取
    async function extractWeaponItemSprite(col, row, outputPath) {
        const x = WPN_COL_LEFTS[col];
        const y = WPN_ROW_TOPS[row];
        const w = WPN_COL_RIGHTS[col] - x + 1;
        const h = WPN_ROW_BOTS[row] - y + 1;
        return extractSprite(weaponSheet, x, y, w, h, outputPath, 4);
    }

    // 武器 (26种) - row/col 对应实际4x11网格
    console.log('📦 裁剪武器 (26种)...');
    ensureDir(path.join(assetsDir, 'weapons'));

    const WEAPONS = {
        // 近战武器 (10种)
        dagger:         { row: 1, col: 1, name: '匕首' },
        sword:          { row: 1, col: 1, name: '长剑' },
        holyBlade:      { row: 1, col: 1, name: '圣剑' },
        axe:            { row: 2, col: 1, name: '战斧' },
        shadowBlade:    { row: 3, col: 3, name: '暗影刃' },
        bloodAxe:       { row: 3, col: 4, name: '嗜血斧' },
        hammer:         { row: 3, col: 0, name: '战锤' },
        spear:          { row: 3, col: 1, name: '长矛' },
        scythe:         { row: 2, col: 6, name: '死神镰刀' },
        katana:         { row: 1, col: 1, name: '武士刀' },

        // 法杖 (7种)
        staff:          { row: 3, col: 2, name: '法杖' },
        arcaneStaff:    { row: 3, col: 2, name: '奥术法杖' },
        fireball:       { row: 2, col: 5, name: '火球杖' },
        inferno:        { row: 2, col: 5, name: '炼狱杖' },
        iceStaff:       { row: 2, col: 4, name: '冰霜法杖' },
        lightningStaff: { row: 1, col: 3, name: '雷电法杖' },
        necroStaff:     { row: 3, col: 2, name: '死灵法杖' },

        // 远程武器 (4种)
        bow:            { row: 2, col: 10, name: '弓' },
        phoenixBow:     { row: 2, col: 10, name: '凤凰弓' },
        crossbow:       { row: 2, col: 10, name: '弩' },
        longbow:        { row: 2, col: 10, name: '长弓' },

        // 特殊武器 (5种)
        wand:           { row: 2, col: 3, name: '魔杖' },
        scepter:        { row: 1, col: 3, name: '权杖' },
        orb:            { row: 2, col: 0, name: '魔法球' },
        tome:           { row: 1, col: 7, name: '魔法书' },
        whip:           { row: 2, col: 2, name: '鞭子' }
    };

    let weaponCount = 0;
    for (const [id, info] of Object.entries(WEAPONS)) {
        const outPath = path.join(assetsDir, 'weapons', `${id}.png`);
        const ok = await extractWeaponItemSprite(info.col, info.row, outPath);
        if (ok) weaponCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    console.log(`  完成: ${weaponCount}/${Object.keys(WEAPONS).length}\n`);

    // 道具 (37种)
    console.log('📦 裁剪道具 (37种)...');
    ensureDir(path.join(assetsDir, 'items'));

    const ITEMS = {
        // 药水 (5种)
        healthPotion:   { row: 1, col: 6,  name: '生命药水' },
        manaPotion:     { row: 1, col: 6,  name: '魔法药水' },
        speedPotion:    { row: 1, col: 6,  name: '速度药水' },
        strengthPotion: { row: 3, col: 5,  name: '力量药水' },
        poisonPotion:   { row: 1, col: 6,  name: '毒药' },

        // 宝石 (6种)
        ruby:           { row: 0, col: 8,  name: '红宝石' },
        emerald:        { row: 0, col: 7,  name: '绿宝石' },
        sapphire:       { row: 2, col: 9,  name: '蓝宝石' },
        diamond:        { row: 2, col: 9,  name: '钻石' },
        amethyst:       { row: 2, col: 7,  name: '紫水晶' },
        topaz:          { row: 2, col: 5,  name: '黄玉' },

        // 货币 (3种)
        coin:           { row: 1, col: 9,  name: '金币' },
        coinBag:        { row: 1, col: 10, name: '钱袋' },
        goldBar:        { row: 0, col: 4,  name: '金条' },

        // 钥匙和卷轴 (4种)
        key:            { row: 0, col: 2,  name: '钥匙' },
        goldenKey:      { row: 0, col: 2,  name: '金钥匙' },
        scroll:         { row: 0, col: 1,  name: '卷轴' },
        magicScroll:    { row: 3, col: 7,  name: '魔法卷轴' },

        // 装备 (9种)
        shield:         { row: 1, col: 4,  name: '盾牌' },
        helmet:         { row: 3, col: 6,  name: '头盔' },
        ring:           { row: 1, col: 3,  name: '戒指' },
        necklace:       { row: 3, col: 9,  name: '项链' },
        amulet:         { row: 1, col: 3,  name: '护身符' },
        gloves:         { row: 3, col: 8,  name: '手套' },
        boots:          { row: 0, col: 5,  name: '靴子' },
        armor:          { row: 0, col: 5,  name: '铠甲' },
        cape:           { row: 0, col: 6,  name: '披风' },

        // 其他道具 (10种)
        bomb:           { row: 1, col: 2,  name: '炸弹' },
        torch:          { row: 0, col: 3,  name: '火把' },
        map:            { row: 1, col: 5,  name: '地图' },
        compass:        { row: 0, col: 2,  name: '指南针' },
        hourglass:      { row: 1, col: 8,  name: '沙漏' },
        crystal:        { row: 0, col: 9,  name: '水晶' },
        skull:          { row: 1, col: 0,  name: '骷髅头' },
        heart:          { row: 0, col: 10, name: '心脏' },
        feather:        { row: 2, col: 8,  name: '羽毛' },
        bone:           { row: 0, col: 0,  name: '骨头' }
    };

    let itemCount = 0;
    for (const [id, info] of Object.entries(ITEMS)) {
        const outPath = path.join(assetsDir, 'items', `${id}.png`);
        const ok = await extractWeaponItemSprite(info.col, info.row, outPath);
        if (ok) itemCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    console.log(`  完成: ${itemCount}/${Object.keys(ITEMS).length}\n`);

    // 统计
    console.log('================================');
    console.log('📊 素材统计:');
    console.log(`  玩家角色: ${playerCount}/${Object.keys(PLAYERS).length}`);
    console.log(`  敌人:     ${enemyCount}/${Object.keys(ENEMIES).length}`);
    console.log(`  Boss:     ${bossCount}/10`);
    console.log(`  武器:     ${weaponCount}/${Object.keys(WEAPONS).length}`);
    console.log(`  道具:     ${itemCount}/${Object.keys(ITEMS).length}`);
    const total = playerCount + enemyCount + bossCount + weaponCount + itemCount;
    const expected = Object.keys(PLAYERS).length + Object.keys(ENEMIES).length +
                     10 + Object.keys(WEAPONS).length + Object.keys(ITEMS).length;
    console.log(`  总计:     ${total}/${expected}`);
    console.log('================================');
    console.log('🎉 全部完成！');
}

main().catch(console.error);
