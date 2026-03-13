// ==================== 游戏配置 ====================
const CONFIG = {
    canvas: {
        width: 1200,  // 默认值，会在初始化时自适应
        height: 800   // 默认值，会在初始化时自适应
    },
    world: {
        width: 8000,  // 大地图宽度
        height: 6000  // 大地图高度
    },
    player: {
        size: 18  // 缩小角色大小
    },
    enemy: {
        size: 14  // 缩小敌人大小
    },
    obstacles: {
        rockCount: 80,
        bushCount: 100,
        treeCount: 40,
        // 障碍物大小范围（随机生成）
        rock: {
            minSize: 15,
            maxSize: 45
        },
        bush: {
            minSize: 20,
            maxSize: 50
        },
        tree: {
            minSize: 40,
            maxSize: 80
        }
    },
    wave: {
        baseEnemyCount: 5,      // 每波基础敌人数
        enemyIncrement: 2,      // 每波增加的敌人
        timeBetweenSpawns: 800, // 每个敌人生成间隔（毫秒）
        timeBetweenWaves: 3000, // 波次间休息时间
        bossWaveInterval: 10    // 每10波出Boss
    },
    // 难度配置
    difficulty: {
        easy: {
            name: '简单',
            enemyHealthMod: 0.7,
            enemyDamageMod: 0.7,
            expMod: 1.2
        },
        normal: {
            name: '普通',
            enemyHealthMod: 1.0,
            enemyDamageMod: 1.0,
            expMod: 1.0
        },
        hard: {
            name: '困难',
            enemyHealthMod: 1.5,
            enemyDamageMod: 1.5,
            expMod: 1.3
        },
        nightmare: {
            name: '噩梦',
            enemyHealthMod: 2.0,
            enemyDamageMod: 2.0,
            expMod: 1.5
        }
    },
    // 地图配置
    maps: {
        forest: {
            name: '幽暗森林',
            backgroundColor: '#1a2e1a',
            groundColor: '#0d1f0d',
            borderColor: '#2d5a2d',
            tileImage: 'assets/tiles/forest_tile.png',
            bushCount: 120,
            rockCount: 60,
            treeCount: 60,
            specialEffect: null
        },
        desert: {
            name: '荒芜沙漠',
            backgroundColor: '#3d2e1a',
            groundColor: '#2a1f0d',
            borderColor: '#8b7355',
            tileImage: 'assets/tiles/desert_tile.png',
            bushCount: 30,
            rockCount: 100,
            treeCount: 10,
            specialEffect: null
        },
        dungeon: {
            name: '黑暗地牢',
            backgroundColor: '#14141e',
            groundColor: '#0a0a14',
            borderColor: '#4a4a6a',
            tileImage: 'assets/tiles/dungeon_tile.png',
            bushCount: 20,
            rockCount: 150,
            treeCount: 5,
            specialEffect: 'darkness'
        },
        snow: {
            name: '冰封雪原',
            backgroundColor: '#283238',
            groundColor: '#1e2832',
            borderColor: '#6a8a9a',
            tileImage: 'assets/tiles/snow_tile.png',
            bushCount: 50,
            rockCount: 80,
            treeCount: 35,
            specialEffect: 'slow'
        },
        lava: {
            name: '熔岩地狱',
            backgroundColor: '#2a0f0f',
            groundColor: '#1a0808',
            borderColor: '#8b2500',
            tileImage: 'assets/tiles/lava_tile.png',
            bushCount: 10,
            rockCount: 120,
            treeCount: 0,
            specialEffect: 'damage'
        },
        ocean: {
            name: '深海遗迹',
            backgroundColor: '#0a1e2d',
            groundColor: '#051428',
            borderColor: '#1e6496',
            tileImage: 'assets/tiles/ocean_tile.png',
            bushCount: 60,
            rockCount: 90,
            treeCount: 20,
            specialEffect: null
        }
    }
};

// 预加载地图瓦片图片
const mapTileImages = {};

// 环境素材图片
const environmentImages = {
    trees: [],
    bushes: [],
    rocks: []
};

function preloadMapTiles(callback) {
    const maps = Object.keys(CONFIG.maps);
    let loaded = 0;
    const total = maps.length;

    // 尝试加载实际PNG瓦片图片，失败则回退到程序化生成
    maps.forEach(mapKey => {
        const tilePath = CONFIG.maps[mapKey].tileImage;
        const img = new Image();
        img.onload = () => {
            mapTileImages[mapKey] = img;
            loaded++;
            if (loaded === total && callback) callback();
        };
        img.onerror = () => {
            console.warn(`Tile image not found: ${tilePath}, using generated tile`);
            mapTileImages[mapKey] = generateMapTile(mapKey);
            loaded++;
            if (loaded === total && callback) callback();
        };
        img.src = tilePath;
    });
}

// 程序化生成像素风格地图瓦片（64x64）
function generateMapTile(mapKey) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 简单的伪随机 — 用 mapKey 做种子让同一地图的瓦片一致
    let seed = 0;
    for (let i = 0; i < mapKey.length; i++) seed += mapKey.charCodeAt(i) * (i + 1);
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff; };

    const tileConfigs = {
        forest: {
            base: '#2d5a1e',
            colors: ['#245018', '#2d5a1e', '#367a25', '#1e4414', '#3a6a28'],
            detail: ['#4a8a35', '#1a3a10'],
            pixelSize: 4,
        },
        desert: {
            base: '#c2a55a',
            colors: ['#b89a50', '#c2a55a', '#d4b868', '#a88e45', '#cbb062'],
            detail: ['#d8c478', '#9a8040'],
            pixelSize: 4,
        },
        dungeon: {
            base: '#3a3a4a',
            colors: ['#2a2a3a', '#3a3a4a', '#33334a', '#282838', '#404055'],
            detail: ['#4a4a5a', '#1a1a2a'],
            pixelSize: 8,   // 地牢用更大的像素块模拟砖块
        },
        snow: {
            base: '#c8d8e0',
            colors: ['#b8c8d4', '#c8d8e0', '#d4e4ec', '#a8b8c8', '#dce8f0'],
            detail: ['#e8f0f4', '#98a8b8'],
            pixelSize: 4,
        },
        lava: {
            base: '#4a1a0a',
            colors: ['#3a1008', '#4a1a0a', '#5a2010', '#301005', '#6a2a15'],
            detail: ['#8a3015', '#ff6a20'],
            pixelSize: 4,
        },
        ocean: {
            base: '#1a3a5a',
            colors: ['#143050', '#1a3a5a', '#204a6a', '#102a48', '#1e4060'],
            detail: ['#2a5a7a', '#0a2038'],
            pixelSize: 4,
        }
    };

    const config = tileConfigs[mapKey] || tileConfigs.forest;
    const ps = config.pixelSize;

    // 填充基础颜色像素块
    for (let y = 0; y < size; y += ps) {
        for (let x = 0; x < size; x += ps) {
            const colorIdx = Math.floor(rand() * config.colors.length);
            ctx.fillStyle = config.colors[colorIdx];
            ctx.fillRect(x, y, ps, ps);
        }
    }

    // 地牢特殊处理：画砖缝
    if (mapKey === 'dungeon') {
        ctx.fillStyle = '#1a1a2a';
        // 水平砖缝
        for (let y = 0; y < size; y += 16) {
            ctx.fillRect(0, y, size, 1);
        }
        // 垂直砖缝（交错排列）
        for (let y = 0; y < size; y += 16) {
            const offset = (Math.floor(y / 16) % 2) * 16;
            for (let x = offset; x < size; x += 32) {
                ctx.fillRect(x, y, 1, 16);
            }
        }
    }

    // 熔岩特殊处理：偶尔添加发光岩浆裂缝
    if (mapKey === 'lava') {
        for (let i = 0; i < 3; i++) {
            const x = Math.floor(rand() * (size - ps));
            const y = Math.floor(rand() * (size - ps));
            ctx.fillStyle = rand() > 0.5 ? '#ff6a20' : '#ff4500';
            ctx.fillRect(x, y, ps, ps);
        }
    }

    // 雪地特殊处理：添加亮点模拟雪花反光
    if (mapKey === 'snow') {
        for (let i = 0; i < 4; i++) {
            const x = Math.floor(rand() * (size - 2));
            const y = Math.floor(rand() * (size - 2));
            ctx.fillStyle = '#f0f8ff';
            ctx.fillRect(x, y, 2, 2);
        }
    }

    // 森林特殊处理：添加小草点
    if (mapKey === 'forest') {
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(rand() * (size - 2));
            const y = Math.floor(rand() * (size - 2));
            ctx.fillStyle = rand() > 0.5 ? '#4a8a35' : '#5a9a40';
            ctx.fillRect(x, y, 2, 3);
        }
    }

    // 沙漠特殊处理：添加沙粒纹理
    if (mapKey === 'desert') {
        for (let i = 0; i < 6; i++) {
            const x = Math.floor(rand() * (size - 1));
            const y = Math.floor(rand() * (size - 1));
            ctx.fillStyle = rand() > 0.5 ? '#d8c478' : '#9a8040';
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // 海洋特殊处理：添加水纹
    if (mapKey === 'ocean') {
        ctx.fillStyle = 'rgba(40, 90, 130, 0.3)';
        for (let y = 8; y < size; y += 16) {
            const waveOffset = Math.floor(rand() * 8);
            ctx.fillRect(waveOffset, y, size - waveOffset * 2, 2);
        }
    }

    // 添加细微的噪点纹理
    for (let i = 0; i < 8; i++) {
        const x = Math.floor(rand() * size);
        const y = Math.floor(rand() * size);
        const detailIdx = Math.floor(rand() * config.detail.length);
        ctx.fillStyle = config.detail[detailIdx];
        ctx.fillRect(x, y, 1, 1);
    }

    // 将 canvas 转为 Image
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
}

// 预加载环境素材（树木、草丛和石头）
// 使用从extracted文件夹提取的新素材
function preloadEnvironmentAssets(callback) {
    // 新提取的40种树木素材
    const treeFiles = [];
    for (let i = 0; i < 40; i++) {
        treeFiles.push(`assets/environment/trees/green_tree_${i.toString().padStart(2, '0')}.png`);
    }

    // 4种灌木素材
    const bushFiles = [];
    for (let i = 0; i < 4; i++) {
        bushFiles.push(`assets/environment/bushes/green_bushe_${i.toString().padStart(2, '0')}.png`);
    }

    // 保留原有石头素材
    const rockFiles = [
        'assets/environment/rock_0.png',
        'assets/environment/rock_1.png',
        'assets/environment/rock_2.png'
    ];

    let loaded = 0;
    const total = treeFiles.length + bushFiles.length + rockFiles.length;

    // 初始化数组
    environmentImages.trees = [];
    environmentImages.bushes = [];
    environmentImages.rocks = [];

    // 加载树木图片
    treeFiles.forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
            environmentImages.trees[index] = img;
            loaded++;
            // 树木加载完成
            if (loaded === total && callback) callback();
        };
        img.onerror = () => {
            console.warn(`Failed to load tree asset: ${file}`);
            loaded++;
            if (loaded === total && callback) callback();
        };
        img.src = file;
    });

    // 加载草丛图片
    bushFiles.forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
            environmentImages.bushes[index] = img;
            loaded++;
            // 草丛加载完成
            if (loaded === total && callback) callback();
        };
        img.onerror = () => {
            console.warn(`Failed to load bush asset: ${file}`);
            loaded++;
            if (loaded === total && callback) callback();
        };
        img.src = file;
    });

    // 加载石头图片
    rockFiles.forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
            environmentImages.rocks[index] = img;
            loaded++;
            // 石头加载完成
            if (loaded === total && callback) callback();
        };
        img.onerror = () => {
            console.warn(`Failed to load rock asset: ${file}`);
            loaded++;
            if (loaded === total && callback) callback();
        };
        img.src = file;
    });
}
