/**
 * 生成像素风格背景图片
 * 运行方式: node tools/generate_pixel_backgrounds.js
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

// 生成像素风格的地图背景瓦片
async function createPixelTile(width, height, colors, pattern, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(width * height * channels);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            let color;

            switch (pattern) {
                case 'grass':
                    // 草地：深浅绿色交替，带随机草丛
                    const grassBase = (x + y) % 2 === 0 ? colors.light : colors.dark;
                    const hasGrass = Math.random() < 0.15;
                    color = hasGrass ? colors.accent : grassBase;
                    break;

                case 'sand':
                    // 沙地：沙色带随机深色点
                    const sandVariation = Math.random() < 0.1;
                    color = sandVariation ? colors.dark : colors.light;
                    break;

                case 'stone':
                    // 石地：砖块图案
                    const brickX = x % 16;
                    const brickY = y % 8;
                    const isEdge = brickX === 0 || brickY === 0;
                    color = isEdge ? colors.dark : colors.light;
                    break;

                case 'snow':
                    // 雪地：白色带蓝色阴影
                    const snowVariation = Math.random() < 0.08;
                    color = snowVariation ? colors.accent : colors.light;
                    break;

                case 'lava':
                    // 熔岩：红黑交替，带亮橙色
                    const lavaFlow = Math.sin(x * 0.3 + y * 0.2) > 0.3;
                    const isHot = Math.random() < 0.05;
                    color = isHot ? colors.accent : (lavaFlow ? colors.light : colors.dark);
                    break;

                case 'water':
                    // 水面：蓝色波纹
                    const wave = Math.sin(x * 0.2 + y * 0.1) > 0;
                    color = wave ? colors.light : colors.dark;
                    break;

                default:
                    color = colors.light;
            }

            // 添加一点随机噪点
            const noise = Math.floor(Math.random() * 8) - 4;
            data[idx] = Math.max(0, Math.min(255, color.r + noise));
            data[idx + 1] = Math.max(0, Math.min(255, color.g + noise));
            data[idx + 2] = Math.max(0, Math.min(255, color.b + noise));
            data[idx + 3] = 255;
        }
    }

    await sharp(data, { raw: { width, height, channels } })
        .png()
        .toFile(outputPath);
}

// 生成主菜单背景
async function createMenuBackground(width, height, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(width * height * channels);

    // 深紫色渐变背景，带星星效果
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;

            // 渐变背景
            const ratio = y / height;
            const r = Math.floor(15 + ratio * 10);
            const g = Math.floor(10 + ratio * 15);
            const b = Math.floor(30 + ratio * 20);

            // 添加星星
            const isStar = Math.random() < 0.003;
            if (isStar) {
                const brightness = 150 + Math.floor(Math.random() * 105);
                data[idx] = brightness;
                data[idx + 1] = brightness;
                data[idx + 2] = brightness;
            } else {
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
            }
            data[idx + 3] = 255;
        }
    }

    // 添加一些像素化的山脉轮廓在底部
    for (let x = 0; x < width; x++) {
        const mountainHeight = Math.floor(
            20 + Math.sin(x * 0.02) * 15 + Math.sin(x * 0.05) * 10 + Math.random() * 5
        );
        for (let y = height - mountainHeight; y < height; y++) {
            const idx = (y * width + x) * channels;
            const shade = Math.floor((height - y) / mountainHeight * 30);
            data[idx] = 20 + shade;
            data[idx + 1] = 15 + shade;
            data[idx + 2] = 35 + shade;
        }
    }

    await sharp(data, { raw: { width, height, channels } })
        .png()
        .toFile(outputPath);
}

// 生成地图预览图（更精细）
async function createMapPreviewImage(width, height, mapType, outputPath) {
    const channels = 4;
    const data = Buffer.alloc(width * height * channels);

    const mapStyles = {
        forest: {
            sky: { r: 135, g: 206, b: 235 },
            ground: { r: 34, g: 139, b: 34 },
            accent: { r: 0, g: 100, b: 0 },
            trees: true
        },
        desert: {
            sky: { r: 255, g: 200, b: 150 },
            ground: { r: 210, g: 180, b: 140 },
            accent: { r: 180, g: 140, b: 100 },
            dunes: true
        },
        dungeon: {
            sky: { r: 30, g: 30, b: 40 },
            ground: { r: 60, g: 60, b: 70 },
            accent: { r: 80, g: 80, b: 90 },
            bricks: true
        },
        snow: {
            sky: { r: 200, g: 220, b: 255 },
            ground: { r: 240, g: 248, b: 255 },
            accent: { r: 200, g: 220, b: 240 },
            snowflakes: true
        },
        lava: {
            sky: { r: 40, g: 20, b: 20 },
            ground: { r: 80, g: 30, b: 20 },
            accent: { r: 255, g: 100, b: 0 },
            flames: true
        },
        ocean: {
            sky: { r: 100, g: 150, b: 200 },
            ground: { r: 30, g: 100, b: 150 },
            accent: { r: 50, g: 150, b: 200 },
            waves: true
        }
    };

    const style = mapStyles[mapType] || mapStyles.forest;
    const groundLine = Math.floor(height * 0.6);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            let color;

            if (y < groundLine) {
                // 天空
                const skyRatio = y / groundLine;
                color = {
                    r: Math.floor(style.sky.r * (1 - skyRatio * 0.3)),
                    g: Math.floor(style.sky.g * (1 - skyRatio * 0.3)),
                    b: Math.floor(style.sky.b * (1 - skyRatio * 0.2))
                };
            } else {
                // 地面
                const groundRatio = (y - groundLine) / (height - groundLine);
                const variation = Math.random() < 0.1;
                color = variation ? style.accent : {
                    r: Math.floor(style.ground.r * (1 - groundRatio * 0.2)),
                    g: Math.floor(style.ground.g * (1 - groundRatio * 0.2)),
                    b: Math.floor(style.ground.b * (1 - groundRatio * 0.2))
                };
            }

            // 添加特效
            if (style.trees && y > groundLine - 30 && y < groundLine + 10) {
                if (Math.random() < 0.02) {
                    color = { r: 0, g: 80, b: 0 };
                }
            }

            if (style.snowflakes && y < groundLine && Math.random() < 0.01) {
                color = { r: 255, g: 255, b: 255 };
            }

            if (style.flames && y > groundLine && Math.random() < 0.03) {
                color = style.accent;
            }

            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
        }
    }

    await sharp(data, { raw: { width, height, channels } })
        .png()
        .toFile(outputPath);
}

async function main() {
    console.log('🎨 生成像素风格背景图片...');
    console.log('================================\n');

    const assetsDir = path.join(ROOT, 'assets');

    ensureDir(path.join(assetsDir, 'backgrounds'));
    ensureDir(path.join(assetsDir, 'tiles'));
    ensureDir(path.join(assetsDir, 'ui/maps'));

    // 生成主菜单背景 (较大尺寸，会被平铺)
    console.log('📦 生成主菜单背景...');
    await createMenuBackground(256, 256, path.join(assetsDir, 'backgrounds', 'menu_bg.png'));
    console.log('  ✓ menu_bg.png');

    // 生成地图瓦片 (64x64，会被平铺)
    console.log('\n📦 生成地图瓦片...');
    const tileConfigs = [
        {
            name: 'forest',
            colors: {
                light: { r: 34, g: 120, b: 34 },
                dark: { r: 25, g: 90, b: 25 },
                accent: { r: 20, g: 70, b: 20 }
            },
            pattern: 'grass'
        },
        {
            name: 'desert',
            colors: {
                light: { r: 210, g: 180, b: 140 },
                dark: { r: 180, g: 150, b: 110 },
                accent: { r: 160, g: 130, b: 90 }
            },
            pattern: 'sand'
        },
        {
            name: 'dungeon',
            colors: {
                light: { r: 60, g: 60, b: 70 },
                dark: { r: 40, g: 40, b: 50 },
                accent: { r: 30, g: 30, b: 40 }
            },
            pattern: 'stone'
        },
        {
            name: 'snow',
            colors: {
                light: { r: 240, g: 248, b: 255 },
                dark: { r: 220, g: 230, b: 245 },
                accent: { r: 180, g: 200, b: 220 }
            },
            pattern: 'snow'
        },
        {
            name: 'lava',
            colors: {
                light: { r: 80, g: 30, b: 20 },
                dark: { r: 40, g: 15, b: 10 },
                accent: { r: 255, g: 100, b: 0 }
            },
            pattern: 'lava'
        },
        {
            name: 'ocean',
            colors: {
                light: { r: 30, g: 100, b: 150 },
                dark: { r: 20, g: 70, b: 120 },
                accent: { r: 50, g: 130, b: 180 }
            },
            pattern: 'water'
        }
    ];

    for (const config of tileConfigs) {
        await createPixelTile(64, 64, config.colors, config.pattern,
            path.join(assetsDir, 'tiles', `${config.name}_tile.png`));
        console.log(`  ✓ ${config.name}_tile.png`);
    }

    // 生成地图预览图 (200x150)
    console.log('\n📦 生成地图预览图...');
    const maps = ['forest', 'desert', 'dungeon', 'snow', 'lava', 'ocean'];
    for (const map of maps) {
        await createMapPreviewImage(200, 150, map,
            path.join(assetsDir, 'ui/maps', `${map}_preview.png`));
        console.log(`  ✓ ${map}_preview.png`);
    }

    console.log('\n================================');
    console.log('🎉 像素风格背景生成完成！');
}

main().catch(console.error);
