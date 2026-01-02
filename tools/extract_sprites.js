/**
 * 精灵图自动裁剪脚本 - 扩充版
 * 运行方式: node tools/extract_sprites.js
 *
 * 素材统计:
 * - 玩家角色: 8种
 * - 敌人: 28种
 * - Boss: 10种
 * - 武器: 27种
 * - 道具: 40种
 * - 总计: 113种素材
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

    // ============ BOSS精灵图 ============
    console.log('📦 裁剪Boss (10种)...');
    ensureDir(path.join(assetsDir, 'bosses'));

    const BOSSES = {
        bear:        { x: 10,  y: 18,  w: 36, h: 44, name: '红熊怪' },
        frog:        { x: 58,  y: 26,  w: 36, h: 36, name: '青蛙王' },
        eyeball:     { x: 106, y: 32,  w: 28, h: 28, name: '眼球怪' },
        flame:       { x: 146, y: 18,  w: 36, h: 44, name: '火焰魔' },
        dragon:      { x: 196, y: 4,   w: 72, h: 64, name: '绿龙' },
        beetle:      { x: 10,  y: 82,  w: 36, h: 52, name: '蓝甲虫' },
        spider:      { x: 58,  y: 90,  w: 44, h: 44, name: '毒蜘蛛' },
        snakeBoss:   { x: 114, y: 82,  w: 44, h: 52, name: '蛇妖' },
        oneEyeDemon: { x: 170, y: 90,  w: 36, h: 44, name: '独眼魔' },
        dragonHead:  { x: 218, y: 74,  w: 68, h: 68, name: '龙首' }
    };

    let bossCount = 0;
    for (const [id, info] of Object.entries(BOSSES)) {
        const outPath = path.join(assetsDir, 'bosses', `${id}.png`);
        const ok = await extractSprite(bossSheet, info.x, info.y, info.w, info.h, outPath, 2);
        if (ok) bossCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    console.log(`  完成: ${bossCount}/${Object.keys(BOSSES).length}\n`);

    // ============ 武器道具精灵图 ============
    const WPN_COL_X = [15, 38, 65, 92, 119, 146, 173, 200, 226, 253];
    const WPN_ROW_Y = [12, 34, 56, 78, 98, 115];
    const WPN_SIZE = 18;

    // 武器 (27种)
    console.log('📦 裁剪武器 (27种)...');
    ensureDir(path.join(assetsDir, 'weapons'));

    const WEAPONS = {
        // 近战武器 (10种)
        dagger:         { row: 0, col: 0, name: '匕首' },
        sword:          { row: 0, col: 1, name: '长剑' },
        holyBlade:      { row: 0, col: 2, name: '圣剑' },
        axe:            { row: 0, col: 5, name: '战斧' },
        shadowBlade:    { row: 1, col: 1, name: '暗影刃' },
        bloodAxe:       { row: 1, col: 5, name: '嗜血斧' },
        hammer:         { row: 0, col: 6, name: '战锤' },
        spear:          { row: 0, col: 7, name: '长矛' },
        scythe:         { row: 1, col: 6, name: '死神镰刀' },
        katana:         { row: 1, col: 0, name: '武士刀' },

        // 法杖 (7种)
        staff:          { row: 0, col: 4, name: '法杖' },
        arcaneStaff:    { row: 1, col: 4, name: '奥术法杖' },
        fireball:       { row: 2, col: 3, name: '火球杖' },
        inferno:        { row: 2, col: 4, name: '炼狱杖' },
        iceStaff:       { row: 2, col: 5, name: '冰霜法杖' },
        lightningStaff: { row: 2, col: 6, name: '雷电法杖' },
        necroStaff:     { row: 1, col: 3, name: '死灵法杖' },

        // 远程武器 (4种)
        bow:            { row: 1, col: 8, name: '弓' },
        phoenixBow:     { row: 0, col: 8, name: '凤凰弓' },
        crossbow:       { row: 1, col: 9, name: '弩' },
        longbow:        { row: 0, col: 9, name: '长弓' },

        // 特殊武器 (6种)
        wand:           { row: 0, col: 3, name: '魔杖' },
        scepter:        { row: 1, col: 2, name: '权杖' },
        orb:            { row: 2, col: 0, name: '魔法球' },
        tome:           { row: 2, col: 1, name: '魔法书' },
        whip:           { row: 1, col: 7, name: '鞭子' }
    };

    let weaponCount = 0;
    for (const [id, info] of Object.entries(WEAPONS)) {
        const x = WPN_COL_X[info.col];
        const y = WPN_ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'weapons', `${id}.png`);
        const ok = await extractSprite(weaponSheet, x, y, WPN_SIZE, WPN_SIZE, outPath);
        if (ok) weaponCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    console.log(`  完成: ${weaponCount}/${Object.keys(WEAPONS).length}\n`);

    // 道具 (40种)
    console.log('📦 裁剪道具 (40种)...');
    ensureDir(path.join(assetsDir, 'items'));

    const ITEMS = {
        // 药水 (5种)
        healthPotion:   { row: 4, col: 0, name: '生命药水' },
        manaPotion:     { row: 4, col: 1, name: '魔法药水' },
        speedPotion:    { row: 4, col: 2, name: '速度药水' },
        strengthPotion: { row: 4, col: 3, name: '力量药水' },
        poisonPotion:   { row: 4, col: 4, name: '毒药' },

        // 宝石 (6种)
        ruby:           { row: 3, col: 6, name: '红宝石' },
        emerald:        { row: 3, col: 7, name: '绿宝石' },
        sapphire:       { row: 3, col: 8, name: '蓝宝石' },
        diamond:        { row: 3, col: 9, name: '钻石' },
        amethyst:       { row: 4, col: 5, name: '紫水晶' },
        topaz:          { row: 3, col: 5, name: '黄玉' },

        // 货币 (3种)
        coin:           { row: 5, col: 9, name: '金币' },
        coinBag:        { row: 4, col: 9, name: '钱袋' },
        goldBar:        { row: 5, col: 8, name: '金条' },

        // 钥匙和卷轴 (4种)
        key:            { row: 5, col: 0, name: '钥匙' },
        goldenKey:      { row: 5, col: 1, name: '金钥匙' },
        scroll:         { row: 2, col: 9, name: '卷轴' },
        magicScroll:    { row: 3, col: 0, name: '魔法卷轴' },

        // 装备 (9种)
        shield:         { row: 2, col: 7, name: '盾牌' },
        helmet:         { row: 2, col: 8, name: '头盔' },
        ring:           { row: 4, col: 6, name: '戒指' },
        necklace:       { row: 4, col: 7, name: '项链' },
        amulet:         { row: 4, col: 8, name: '护身符' },
        gloves:         { row: 3, col: 1, name: '手套' },
        boots:          { row: 3, col: 2, name: '靴子' },
        armor:          { row: 3, col: 3, name: '铠甲' },
        cape:           { row: 3, col: 4, name: '披风' },

        // 其他道具 (10种)
        bomb:           { row: 0, col: 6, name: '炸弹' },
        torch:          { row: 5, col: 2, name: '火把' },
        map:            { row: 5, col: 3, name: '地图' },
        compass:        { row: 5, col: 4, name: '指南针' },
        hourglass:      { row: 5, col: 5, name: '沙漏' },
        crystal:        { row: 5, col: 6, name: '水晶' },
        skull:          { row: 5, col: 7, name: '骷髅头' },
        heart:          { row: 0, col: 7, name: '心脏' },
        feather:        { row: 0, col: 8, name: '羽毛' },
        bone:           { row: 0, col: 9, name: '骨头' }
    };

    let itemCount = 0;
    for (const [id, info] of Object.entries(ITEMS)) {
        const x = WPN_COL_X[info.col];
        const y = WPN_ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'items', `${id}.png`);
        const ok = await extractSprite(weaponSheet, x, y, WPN_SIZE, WPN_SIZE, outPath);
        if (ok) itemCount++;
        console.log(ok ? `  ✓ ${id} (${info.name})` : `  ✗ ${id}`);
    }
    console.log(`  完成: ${itemCount}/${Object.keys(ITEMS).length}\n`);

    // 统计
    console.log('================================');
    console.log('📊 素材统计:');
    console.log(`  玩家角色: ${playerCount}/${Object.keys(PLAYERS).length}`);
    console.log(`  敌人:     ${enemyCount}/${Object.keys(ENEMIES).length}`);
    console.log(`  Boss:     ${bossCount}/${Object.keys(BOSSES).length}`);
    console.log(`  武器:     ${weaponCount}/${Object.keys(WEAPONS).length}`);
    console.log(`  道具:     ${itemCount}/${Object.keys(ITEMS).length}`);
    const total = playerCount + enemyCount + bossCount + weaponCount + itemCount;
    const expected = Object.keys(PLAYERS).length + Object.keys(ENEMIES).length +
                     Object.keys(BOSSES).length + Object.keys(WEAPONS).length +
                     Object.keys(ITEMS).length;
    console.log(`  总计:     ${total}/${expected}`);
    console.log('================================');
    console.log('🎉 全部完成！');
}

main().catch(console.error);
