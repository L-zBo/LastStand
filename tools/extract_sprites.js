/**
 * 精灵图自动裁剪脚本
 * 运行方式: node tools/extract_sprites.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 项目根目录
const ROOT = path.join(__dirname, '..');

// 精灵图配置
const SPRITESHEETS = {
    characters: {
        path: path.join(ROOT, 'PNG/角色，怪物.png'),
        spriteWidth: 16,
        spriteHeight: 16,
        cols: 10,
        rows: 6,
        scale: 4  // 放大倍数
    },
    bosses: {
        path: path.join(ROOT, 'PNG/BOSS.png'),
        spriteWidth: 32,
        spriteHeight: 32,
        cols: 5,
        rows: 2,
        scale: 2
    },
    weapons: {
        path: path.join(ROOT, 'PNG/工具武器.png'),
        spriteWidth: 16,
        spriteHeight: 16,
        cols: 10,
        rows: 6,
        scale: 4
    }
};

// 玩家角色 (从 characters 精灵图) - 根据新图片重新映射
const PLAYERS = {
    warrior: { row: 0, col: 5 },    // 蓝色骑士
    mage: { row: 2, col: 5 },       // 紫色法师
    assassin: { row: 3, col: 3 },   // 黑色忍者
    ranger: { row: 1, col: 7 },     // 绿色弓手
    summoner: { row: 4, col: 2 }    // 蓝紫召唤师
};

// 敌人 (从 characters 精灵图) - 根据新图片重新映射
const ENEMIES = {
    skeleton: { row: 0, col: 0 },      // 骷髅
    greenBlob: { row: 0, col: 2 },     // 绿色怪物
    blueSlime: { row: 4, col: 0 },     // 蓝色史莱姆
    rat: { row: 5, col: 0 },           // 老鼠
    snake: { row: 5, col: 1 },         // 蛇
    redImp: { row: 2, col: 0 },        // 红色小怪
    redDevil: { row: 3, col: 1 },      // 红色小鬼
    blackCat: { row: 1, col: 2 },      // 黑猫
    stoneGolem: { row: 2, col: 7 },    // 石头怪
    orc: { row: 1, col: 3 },           // 绿皮兽人
    greenOrc: { row: 0, col: 4 },      // 绿色兽人
    demon: { row: 0, col: 3 },         // 红色恶魔
    hornedDemon: { row: 2, col: 4 },   // 红角恶魔
    fireMan: { row: 1, col: 4 },       // 橙色火人
    smallDragon: { row: 3, col: 7 }    // 小龙
};

// Boss (从 bosses 精灵图)
const BOSSES = {
    bear: { row: 0, col: 0 },
    frog: { row: 0, col: 1 },
    eyeball: { row: 0, col: 2 },
    flame: { row: 0, col: 3 },
    dragon: { row: 0, col: 4 },
    beetle: { row: 1, col: 0 },
    spider: { row: 1, col: 1 },
    snakeBoss: { row: 1, col: 2 },
    oneEyeDemon: { row: 1, col: 3 },
    dragonHead: { row: 1, col: 4 }
};

// 武器 (从 weapons 精灵图)
const WEAPONS = {
    dagger: { row: 0, col: 0 },
    sword: { row: 0, col: 1 },
    holyBlade: { row: 0, col: 2 },
    staff: { row: 0, col: 4 },
    axe: { row: 0, col: 5 },
    bow: { row: 1, col: 8 },
    phoenixBow: { row: 0, col: 8 },
    shadowBlade: { row: 1, col: 1 },
    arcaneStaff: { row: 1, col: 4 },
    bloodAxe: { row: 1, col: 5 },
    fireball: { row: 2, col: 3 },
    inferno: { row: 2, col: 4 }
};

// 道具 (从 weapons 精灵图)
const ITEMS = {
    healthPotion: { row: 4, col: 0 },
    manaPotion: { row: 4, col: 1 },
    ruby: { row: 3, col: 6 },
    emerald: { row: 3, col: 7 },
    sapphire: { row: 3, col: 8 },
    diamond: { row: 3, col: 9 },
    key: { row: 5, col: 0 },
    coin: { row: 5, col: 9 },
    coinBag: { row: 4, col: 9 },
    scroll: { row: 2, col: 9 },
    bomb: { row: 0, col: 6 },
    shield: { row: 2, col: 7 },
    helmet: { row: 2, col: 8 },
    ring: { row: 4, col: 6 },
    necklace: { row: 4, col: 7 }
};

// 确保目录存在
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`创建目录: ${dirPath}`);
    }
}

// 裁剪单个精灵
async function extractSprite(sheetConfig, row, col, outputPath) {
    const { path: sheetPath, spriteWidth, spriteHeight, scale } = sheetConfig;

    const left = col * spriteWidth;
    const top = row * spriteHeight;

    try {
        await sharp(sheetPath)
            .extract({
                left: left,
                top: top,
                width: spriteWidth,
                height: spriteHeight
            })
            .resize(spriteWidth * scale, spriteHeight * scale, {
                kernel: sharp.kernel.nearest  // 保持像素风格
            })
            .png()
            .toFile(outputPath);

        return true;
    } catch (err) {
        console.error(`裁剪失败: ${outputPath}`, err.message);
        return false;
    }
}

// 批量裁剪
async function extractCategory(name, sprites, sheetConfig, outputDir) {
    console.log(`\n📦 正在裁剪 ${name}...`);
    ensureDir(outputDir);

    let success = 0;
    let failed = 0;

    for (const [id, pos] of Object.entries(sprites)) {
        const outputPath = path.join(outputDir, `${id}.png`);
        const result = await extractSprite(sheetConfig, pos.row, pos.col, outputPath);

        if (result) {
            console.log(`  ✓ ${id}.png`);
            success++;
        } else {
            failed++;
        }
    }

    console.log(`  完成: ${success} 成功, ${failed} 失败`);
}

// 主函数
async function main() {
    console.log('🎮 精灵图自动裁剪工具');
    console.log('========================\n');

    // 检查源文件是否存在
    for (const [name, config] of Object.entries(SPRITESHEETS)) {
        if (!fs.existsSync(config.path)) {
            console.error(`❌ 找不到精灵图: ${config.path}`);
            return;
        }
        console.log(`✓ 找到精灵图: ${name}`);
    }

    const assetsDir = path.join(ROOT, 'assets');

    // 裁剪玩家角色
    await extractCategory(
        '玩家角色',
        PLAYERS,
        SPRITESHEETS.characters,
        path.join(assetsDir, 'players')
    );

    // 裁剪敌人
    await extractCategory(
        '敌人',
        ENEMIES,
        SPRITESHEETS.characters,
        path.join(assetsDir, 'enemies')
    );

    // 裁剪Boss
    await extractCategory(
        'Boss',
        BOSSES,
        SPRITESHEETS.bosses,
        path.join(assetsDir, 'bosses')
    );

    // 裁剪武器
    await extractCategory(
        '武器',
        WEAPONS,
        SPRITESHEETS.weapons,
        path.join(assetsDir, 'weapons')
    );

    // 裁剪道具
    await extractCategory(
        '道具',
        ITEMS,
        SPRITESHEETS.weapons,
        path.join(assetsDir, 'items')
    );

    console.log('\n========================');
    console.log('🎉 全部裁剪完成！');
    console.log(`素材已保存到: ${assetsDir}`);
}

main().catch(console.error);
