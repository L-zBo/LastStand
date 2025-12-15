// ==================== 素材管理器 ====================

// 素材配置
const ASSETS = {
    // 玩家精灵
    players: {
        warrior: 'assets/sprites/players/warrior.png',
        mage: 'assets/sprites/players/mage.png',
        assassin: 'assets/sprites/players/assassin.png',
        ranger: 'assets/sprites/players/ranger.png',
        summoner: 'assets/sprites/players/summoner.png'
    },
    // 敌人精灵
    enemies: {
        normal: 'assets/sprites/enemies/normal.png',
        fast: 'assets/sprites/enemies/fast.png',
        tank: 'assets/sprites/enemies/tank.png',
        elite: 'assets/sprites/enemies/elite.png',
        boss: 'assets/sprites/enemies/boss.png'
    },
    // 特效
    effects: {
        slash: 'assets/sprites/effects/slash.png',
        fire: 'assets/sprites/effects/fire.png',
        ice: 'assets/sprites/effects/ice.png',
        heal: 'assets/sprites/effects/heal.png',
        levelup: 'assets/sprites/effects/levelup.png',
        explosion: 'assets/sprites/effects/explosion.png'
    },
    // 武器图标
    weapons: {
        sword: 'assets/sprites/weapons/sword.png',
        bow: 'assets/sprites/weapons/bow.png',
        staff: 'assets/sprites/weapons/staff.png',
        dagger: 'assets/sprites/weapons/dagger.png'
    }
};

// 已加载的素材缓存
const loadedAssets = {
    players: {},
    enemies: {},
    effects: {},
    weapons: {}
};

// 素材是否可用的标志
let assetsEnabled = false;

// 预加载所有素材
function preloadAssets(callback) {
    const allAssets = [];

    // 收集所有素材路径
    for (const category in ASSETS) {
        for (const name in ASSETS[category]) {
            allAssets.push({
                category,
                name,
                path: ASSETS[category][name]
            });
        }
    }

    if (allAssets.length === 0) {
        if (callback) callback();
        return;
    }

    let loaded = 0;
    let failed = 0;

    allAssets.forEach(asset => {
        const img = new Image();

        img.onload = () => {
            loadedAssets[asset.category][asset.name] = img;
            loaded++;
            checkComplete();
        };

        img.onerror = () => {
            console.warn(`素材加载失败: ${asset.path}`);
            failed++;
            checkComplete();
        };

        img.src = asset.path;
    });

    function checkComplete() {
        if (loaded + failed >= allAssets.length) {
            assetsEnabled = loaded > 0;
            console.log(`素材加载完成: ${loaded}/${allAssets.length} 成功`);
            if (callback) callback();
        }
    }
}

// 获取素材
function getAsset(category, name) {
    if (loadedAssets[category] && loadedAssets[category][name]) {
        return loadedAssets[category][name];
    }
    return null;
}

// 绘制精灵（带回退到形状渲染）
function drawSprite(ctx, category, name, x, y, width, height, options = {}) {
    const sprite = getAsset(category, name);

    if (sprite && assetsEnabled) {
        // 使用图片素材
        ctx.save();

        if (options.rotation) {
            ctx.translate(x + width/2, y + height/2);
            ctx.rotate(options.rotation);
            ctx.drawImage(sprite, -width/2, -height/2, width, height);
        } else {
            ctx.drawImage(sprite, x, y, width, height);
        }

        ctx.restore();
        return true;
    }

    // 没有素材时返回false，让调用者使用默认渲染
    return false;
}

// 绘制动画精灵帧
function drawAnimatedSprite(ctx, category, name, x, y, width, height, frameIndex, totalFrames, frameWidth) {
    const sprite = getAsset(category, name);

    if (sprite && assetsEnabled) {
        const srcX = frameIndex * frameWidth;
        ctx.drawImage(
            sprite,
            srcX, 0, frameWidth, sprite.height,  // 源矩形
            x, y, width, height                   // 目标矩形
        );
        return true;
    }

    return false;
}

// 检查素材是否已加载
function isAssetLoaded(category, name) {
    return !!(loadedAssets[category] && loadedAssets[category][name]);
}
