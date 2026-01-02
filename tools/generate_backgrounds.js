/**
 * 背景和环境素材生成脚本
 * 运行方式: node tools/generate_backgrounds.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 生成纯色像素图
async function createSolidImage(width, height, color, outputPath) {
    const { r, g, b, a = 255 } = color;
    const channels = 4;
    const data = Buffer.alloc(width * height * channels);

    for (let i = 0; i < width * height; i++) {
        data[i * channels] = r;
        data[i * channels + 1] = g;
        data[i * channels + 2] = b;
        data[i * channels + 3] = a;
    }

    await sharp(data, { raw: { width, height, channels } })
        .png()
        .toFile(outputPath);
}

// 生成渐变背景
async function createGradientBackground(width, height, topColor, bottomColor, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(width * height * channels);

    for (let y = 0; y < height; y++) {
        const ratio = y / height;
        const r = Math.floor(topColor.r + (bottomColor.r - topColor.r) * ratio);
        const g = Math.floor(topColor.g + (bottomColor.g - topColor.g) * ratio);
        const b = Math.floor(topColor.b + (bottomColor.b - topColor.b) * ratio);

        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
        }
    }

    await sharp(data, { raw: { width, height, channels } })
        .png()
        .toFile(outputPath);
}

// 生成草地瓦片
async function createGrassTile(size, variant, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(size * size * channels);

    // 基础草地颜色
    const baseColors = [
        { r: 34, g: 139, b: 34 },   // 森林绿
        { r: 50, g: 150, b: 50 },   // 草绿
        { r: 60, g: 120, b: 40 },   // 深草绿
    ];

    const base = baseColors[variant % baseColors.length];

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * channels;
            // 添加随机变化
            const variation = Math.floor(Math.random() * 20) - 10;
            data[idx] = Math.max(0, Math.min(255, base.r + variation));
            data[idx + 1] = Math.max(0, Math.min(255, base.g + variation));
            data[idx + 2] = Math.max(0, Math.min(255, base.b + variation));
            data[idx + 3] = 255;
        }
    }

    // 添加一些深色点作为草的细节
    for (let i = 0; i < size * 2; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        const idx = (y * size + x) * channels;
        data[idx] = Math.max(0, data[idx] - 30);
        data[idx + 1] = Math.max(0, data[idx + 1] - 20);
        data[idx + 2] = Math.max(0, data[idx + 2] - 30);
    }

    await sharp(data, { raw: { width: size, height: size, channels } })
        .png()
        .toFile(outputPath);
}

// 生成地面瓦片（沙地、石地等）
async function createGroundTile(size, type, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(size * size * channels);

    const colors = {
        sand: { r: 194, g: 178, b: 128 },
        stone: { r: 128, g: 128, b: 128 },
        dirt: { r: 139, g: 90, b: 43 },
        snow: { r: 240, g: 248, b: 255 },
        lava: { r: 207, g: 16, b: 32 },
        water: { r: 30, g: 144, b: 255 }
    };

    const base = colors[type] || colors.dirt;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * channels;
            const variation = Math.floor(Math.random() * 15) - 7;
            data[idx] = Math.max(0, Math.min(255, base.r + variation));
            data[idx + 1] = Math.max(0, Math.min(255, base.g + variation));
            data[idx + 2] = Math.max(0, Math.min(255, base.b + variation));
            data[idx + 3] = 255;
        }
    }

    await sharp(data, { raw: { width: size, height: size, channels } })
        .png()
        .toFile(outputPath);
}

// 生成草丛精灵
async function createBushSprite(size, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(size * size * channels);

    // 透明背景
    data.fill(0);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 3;

    // 绘制草丛形状
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius + Math.random() * 5) {
                const idx = (y * size + x) * channels;
                const shade = Math.floor(Math.random() * 40);
                data[idx] = 34 + shade;      // R
                data[idx + 1] = 120 + shade; // G
                data[idx + 2] = 34;          // B
                data[idx + 3] = 255;         // A
            }
        }
    }

    await sharp(data, { raw: { width: size, height: size, channels } })
        .png()
        .toFile(outputPath);
}

// 生成地图预览图
async function createMapPreview(width, height, mapType, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(width * height * channels);

    const mapColors = {
        forest: { top: { r: 34, g: 85, b: 34 }, bottom: { r: 20, g: 50, b: 20 } },
        desert: { top: { r: 237, g: 201, b: 175 }, bottom: { r: 194, g: 154, b: 108 } },
        dungeon: { top: { r: 40, g: 40, b: 60 }, bottom: { r: 20, g: 20, b: 30 } },
        snow: { top: { r: 200, g: 220, b: 240 }, bottom: { r: 150, g: 180, b: 200 } },
        lava: { top: { r: 60, g: 20, b: 20 }, bottom: { r: 30, g: 10, b: 10 } },
        ocean: { top: { r: 30, g: 100, b: 150 }, bottom: { r: 10, g: 50, b: 100 } }
    };

    const colors = mapColors[mapType] || mapColors.forest;

    for (let y = 0; y < height; y++) {
        const ratio = y / height;
        const r = Math.floor(colors.top.r + (colors.bottom.r - colors.top.r) * ratio);
        const g = Math.floor(colors.top.g + (colors.bottom.g - colors.top.g) * ratio);
        const b = Math.floor(colors.top.b + (colors.bottom.b - colors.top.b) * ratio);

        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            // 添加一些噪点
            const noise = Math.floor(Math.random() * 10) - 5;
            data[idx] = Math.max(0, Math.min(255, r + noise));
            data[idx + 1] = Math.max(0, Math.min(255, g + noise));
            data[idx + 2] = Math.max(0, Math.min(255, b + noise));
            data[idx + 3] = 255;
        }
    }

    await sharp(data, { raw: { width, height, channels } })
        .png()
        .toFile(outputPath);
}

// 生成难度图标
async function createDifficultyIcon(size, difficulty, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(size * size * channels);

    const colors = {
        easy: { r: 76, g: 175, b: 80 },     // 绿色
        normal: { r: 255, g: 193, b: 7 },   // 黄色
        hard: { r: 244, g: 67, b: 54 },     // 红色
        nightmare: { r: 156, g: 39, b: 176 } // 紫色
    };

    const color = colors[difficulty] || colors.normal;

    // 绘制圆形图标
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const idx = (y * size + x) * channels;

            if (dist < radius) {
                // 内部渐变
                const shade = Math.floor((1 - dist / radius) * 50);
                data[idx] = Math.min(255, color.r + shade);
                data[idx + 1] = Math.min(255, color.g + shade);
                data[idx + 2] = Math.min(255, color.b + shade);
                data[idx + 3] = 255;
            } else if (dist < radius + 2) {
                // 边框
                data[idx] = Math.floor(color.r * 0.7);
                data[idx + 1] = Math.floor(color.g * 0.7);
                data[idx + 2] = Math.floor(color.b * 0.7);
                data[idx + 3] = 255;
            } else {
                // 透明
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
                data[idx + 3] = 0;
            }
        }
    }

    await sharp(data, { raw: { width: size, height: size, channels } })
        .png()
        .toFile(outputPath);
}

async function main() {
    console.log('🎨 生成背景和环境素材...');
    console.log('================================\n');

    const assetsDir = path.join(ROOT, 'assets');

    // 创建目录
    ensureDir(path.join(assetsDir, 'backgrounds'));
    ensureDir(path.join(assetsDir, 'environment'));
    ensureDir(path.join(assetsDir, 'tiles'));
    ensureDir(path.join(assetsDir, 'ui/maps'));
    ensureDir(path.join(assetsDir, 'ui/difficulty'));

    // 生成游戏背景
    console.log('📦 生成游戏背景...');
    const backgrounds = [
        { name: 'forest', top: { r: 26, g: 26, b: 46 }, bottom: { r: 15, g: 35, b: 25 } },
        { name: 'desert', top: { r: 46, g: 36, b: 26 }, bottom: { r: 60, g: 45, b: 30 } },
        { name: 'dungeon', top: { r: 20, g: 20, b: 30 }, bottom: { r: 10, g: 10, b: 20 } },
        { name: 'snow', top: { r: 40, g: 50, b: 60 }, bottom: { r: 30, g: 40, b: 50 } },
        { name: 'lava', top: { r: 40, g: 15, b: 15 }, bottom: { r: 25, g: 10, b: 10 } },
        { name: 'ocean', top: { r: 20, g: 40, b: 60 }, bottom: { r: 10, g: 25, b: 45 } }
    ];

    for (const bg of backgrounds) {
        await createGradientBackground(
            64, 64,
            bg.top, bg.bottom,
            path.join(assetsDir, 'backgrounds', `${bg.name}.png`)
        );
        console.log(`  ✓ ${bg.name}.png`);
    }

    // 生成地面瓦片
    console.log('\n📦 生成地面瓦片...');
    const tileTypes = ['grass', 'sand', 'stone', 'dirt', 'snow', 'lava', 'water'];

    for (let i = 0; i < 3; i++) {
        await createGrassTile(32, i, path.join(assetsDir, 'tiles', `grass_${i}.png`));
        console.log(`  ✓ grass_${i}.png`);
    }

    for (const type of ['sand', 'stone', 'dirt', 'snow']) {
        await createGroundTile(32, type, path.join(assetsDir, 'tiles', `${type}.png`));
        console.log(`  ✓ ${type}.png`);
    }

    // 生成环境元素
    console.log('\n📦 生成环境元素...');
    const bushSizes = [32, 48, 64];
    for (let i = 0; i < bushSizes.length; i++) {
        await createBushSprite(bushSizes[i], path.join(assetsDir, 'environment', `bush_${i}.png`));
        console.log(`  ✓ bush_${i}.png`);
    }

    // 生成地图预览
    console.log('\n📦 生成地图预览...');
    const maps = ['forest', 'desert', 'dungeon', 'snow', 'lava', 'ocean'];
    for (const map of maps) {
        await createMapPreview(200, 150, map, path.join(assetsDir, 'ui/maps', `${map}_preview.png`));
        console.log(`  ✓ ${map}_preview.png`);
    }

    // 生成难度图标
    console.log('\n📦 生成难度图标...');
    const difficulties = ['easy', 'normal', 'hard', 'nightmare'];
    for (const diff of difficulties) {
        await createDifficultyIcon(64, diff, path.join(assetsDir, 'ui/difficulty', `${diff}.png`));
        console.log(`  ✓ ${diff}.png`);
    }

    console.log('\n================================');
    console.log('🎉 背景和环境素材生成完成！');
}

main().catch(console.error);
