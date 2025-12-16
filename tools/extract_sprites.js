/**
 * 精灵图自动裁剪脚本 - 精确定位版
 * 运行方式: node tools/extract_sprites.js
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
    console.log('🎮 精灵图裁剪工具 (精确定位版)');
    console.log('================================\n');

    const assetsDir = path.join(ROOT, 'assets');
    const charSheet = path.join(ROOT, 'PNG/角色，怪物.png');
    const bossSheet = path.join(ROOT, 'PNG/BOSS.png');
    const weaponSheet = path.join(ROOT, 'PNG/工具武器.png');

    // ============ 角色怪物精灵图 - 精确坐标 ============
    // 实际测量的精灵起始位置
    const COL_X = [16, 43, 70, 97, 123, 149, 176, 204, 231, 257];
    const ROW_Y = [16, 43, 70, 95, 122];
    const SPRITE_SIZE = 24;  // 精灵大小

    // 玩家角色 (行, 列) - 根据实际查看的精灵重新选择
    // r1c2:蓝骷髅骑士 r1c6:灰骑士 r4c2:灰骑士 r0c7:红忍者 r4c1:红忍者
    // r2c5:蓝机器人 r0c6:蓝机器人 r3c7:戴帽人
    const PLAYERS = {
        warrior:   { row: 1, col: 2, name: '战士' },      // 蓝色骷髅骑士
        mage:      { row: 2, col: 5, name: '法师' },      // 蓝色机器人
        assassin:  { row: 0, col: 7, name: '刺客' },      // 红色忍者
        ranger:    { row: 3, col: 7, name: '游侠' },      // 戴帽子的人
        summoner:  { row: 0, col: 6, name: '召唤师' }     // 蓝色机器人
    };

    // 敌人 - 选择怪物形象
    const ENEMIES = {
        skeleton:     { row: 0, col: 3, name: '骷髅' },      // 黑色死神
        greenBlob:    { row: 2, col: 6, name: '绿怪' },      // 绿色史莱姆
        blueSlime:    { row: 2, col: 9, name: '史莱姆' },    // 粉色史莱姆
        rat:          { row: 1, col: 0, name: '乌龟' },      // 绿色乌龟
        snake:        { row: 4, col: 3, name: '蝙蝠' },      // 黑色蝙蝠
        redImp:       { row: 0, col: 2, name: '火焰怪' },    // 红色火焰
        redDevil:     { row: 1, col: 5, name: '红怪' },      // 红色怪物
        blackCat:     { row: 3, col: 6, name: '幽灵' },      // 黑色幽灵
        stoneGolem:   { row: 3, col: 4, name: '蘑菇' },      // 棕色蘑菇
        orc:          { row: 0, col: 4, name: '兽人' },      // 绿色兽人
        greenOrc:     { row: 1, col: 4, name: '青蛙王' },    // 绿色青蛙
        demon:        { row: 4, col: 8, name: '章鱼' },      // 红色章鱼
        hornedDemon:  { row: 0, col: 8, name: '章鱼怪' },    // 红章鱼
        fireMan:      { row: 3, col: 0, name: '植物怪' },    // 绿色怪物
        smallDragon:  { row: 4, col: 5, name: '幽灵' }       // 白色幽灵
    };

    // 裁剪玩家
    console.log('📦 裁剪玩家角色...');
    ensureDir(path.join(assetsDir, 'players'));
    for (const [id, info] of Object.entries(PLAYERS)) {
        const x = COL_X[info.col];
        const y = ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'players', `${id}.png`);
        const ok = await extractSprite(charSheet, x, y, SPRITE_SIZE, SPRITE_SIZE, outPath);
        console.log(ok ? `  ✓ ${id}` : `  ✗ ${id}`);
    }

    // 裁剪敌人
    console.log('\n📦 裁剪敌人...');
    ensureDir(path.join(assetsDir, 'enemies'));
    for (const [id, info] of Object.entries(ENEMIES)) {
        const x = COL_X[info.col];
        const y = ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'enemies', `${id}.png`);
        const ok = await extractSprite(charSheet, x, y, SPRITE_SIZE, SPRITE_SIZE, outPath);
        console.log(ok ? `  ✓ ${id}` : `  ✗ ${id}`);
    }

    // ============ BOSS精灵图 - 手动指定位置 ============
    console.log('\n📦 裁剪Boss...');
    ensureDir(path.join(assetsDir, 'bosses'));

    // 先分析BOSS图的背景色并裁剪
    const BOSSES = {
        bear:       { x: 10,  y: 18,  w: 36, h: 44, name: '红熊' },
        frog:       { x: 58,  y: 26,  w: 36, h: 36, name: '青蛙' },
        eyeball:    { x: 106, y: 32,  w: 28, h: 28, name: '眼球' },
        flame:      { x: 146, y: 18,  w: 36, h: 44, name: '火焰' },
        dragon:     { x: 196, y: 4,   w: 72, h: 64, name: '绿龙' },
        beetle:     { x: 10,  y: 82,  w: 36, h: 52, name: '甲虫' },
        spider:     { x: 58,  y: 90,  w: 44, h: 44, name: '蜘蛛' },
        snakeBoss:  { x: 114, y: 82,  w: 44, h: 52, name: '蛇妖' },
        oneEyeDemon:{ x: 170, y: 90,  w: 36, h: 44, name: '独眼' },
        dragonHead: { x: 218, y: 74,  w: 68, h: 68, name: '龙首' }
    };

    for (const [id, info] of Object.entries(BOSSES)) {
        const outPath = path.join(assetsDir, 'bosses', `${id}.png`);
        const ok = await extractSprite(bossSheet, info.x, info.y, info.w, info.h, outPath, 2);
        console.log(ok ? `  ✓ ${id}` : `  ✗ ${id}`);
    }

    // ============ 武器道具精灵图 ============
    console.log('\n📦 裁剪武器...');
    ensureDir(path.join(assetsDir, 'weapons'));

    // 武器图分析 - 347x135
    const WPN_COL_X = [15, 38, 65, 92, 119, 146, 173, 200, 226, 253];
    const WPN_ROW_Y = [12, 34, 56, 78, 98, 115];
    const WPN_SIZE = 18;

    const WEAPONS = {
        dagger:      { row: 0, col: 0, name: '匕首' },
        sword:       { row: 0, col: 1, name: '长剑' },
        holyBlade:   { row: 0, col: 2, name: '圣剑' },
        staff:       { row: 0, col: 4, name: '法杖' },
        axe:         { row: 0, col: 5, name: '战斧' },
        bow:         { row: 1, col: 8, name: '弓' },
        phoenixBow:  { row: 0, col: 8, name: '凤凰弓' },
        shadowBlade: { row: 1, col: 1, name: '暗影刃' },
        arcaneStaff: { row: 1, col: 4, name: '奥术杖' },
        bloodAxe:    { row: 1, col: 5, name: '血斧' },
        fireball:    { row: 2, col: 3, name: '火球杖' },
        inferno:     { row: 2, col: 4, name: '炼狱杖' }
    };

    for (const [id, info] of Object.entries(WEAPONS)) {
        const x = WPN_COL_X[info.col];
        const y = WPN_ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'weapons', `${id}.png`);
        const ok = await extractSprite(weaponSheet, x, y, WPN_SIZE, WPN_SIZE, outPath);
        console.log(ok ? `  ✓ ${id}` : `  ✗ ${id}`);
    }

    console.log('\n📦 裁剪道具...');
    ensureDir(path.join(assetsDir, 'items'));

    const ITEMS = {
        healthPotion: { row: 4, col: 0, name: '生命药水' },
        manaPotion:   { row: 4, col: 1, name: '魔法药水' },
        ruby:         { row: 3, col: 6, name: '红宝石' },
        emerald:      { row: 3, col: 7, name: '绿宝石' },
        sapphire:     { row: 3, col: 8, name: '蓝宝石' },
        diamond:      { row: 3, col: 9, name: '钻石' },
        key:          { row: 4, col: 2, name: '钥匙' },
        coin:         { row: 4, col: 8, name: '金币' },
        coinBag:      { row: 4, col: 9, name: '钱袋' },
        scroll:       { row: 2, col: 9, name: '卷轴' },
        bomb:         { row: 0, col: 6, name: '炸弹' },
        shield:       { row: 2, col: 7, name: '盾牌' },
        helmet:       { row: 2, col: 8, name: '头盔' },
        ring:         { row: 4, col: 6, name: '戒指' },
        necklace:     { row: 4, col: 7, name: '项链' }
    };

    for (const [id, info] of Object.entries(ITEMS)) {
        const x = WPN_COL_X[info.col];
        const y = WPN_ROW_Y[info.row];
        const outPath = path.join(assetsDir, 'items', `${id}.png`);
        const ok = await extractSprite(weaponSheet, x, y, WPN_SIZE, WPN_SIZE, outPath);
        console.log(ok ? `  ✓ ${id}` : `  ✗ ${id}`);
    }

    console.log('\n================================');
    console.log('🎉 全部完成！');
}

main().catch(console.error);
