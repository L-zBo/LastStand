// ==================== 波次系统 ====================

// 获取敌人生成位置
// 敌人在玩家周围的环形区域内生成：内圈保证在屏幕外（不会凭空出现在脸上），
// 外圈必须小于 getEnemyCullRadius()，否则敌人一生成就被判超距、当帧就被重投，
// 造成「生成计数已加、玩家却没见到怪」的白嫖波次。
function getSpawnPosition() {
    // 双人模式以两名玩家的中点为基准，避免只围着 P1 刷怪
    let cx = game.player.x;
    let cy = game.player.y;
    if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
        cx = (game.player.x + game.player2.x) / 2;
        cy = (game.player.y + game.player2.y) / 2;
    }

    const screenDiag = Math.hypot(CONFIG.canvas.width, CONFIG.canvas.height);
    const minDist = Math.max(400, screenDiag / 2 + 80);       // 刚好在可视范围外
    const maxDist = Math.max(minDist + 200, getEnemyCullRadius() * 0.7);

    const margin = 100;
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * (maxDist - minDist);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;

        if (x >= margin && x <= CONFIG.world.width - margin &&
            y >= margin && y <= CONFIG.world.height - margin) {
            return { x, y };
        }
    }

    // 兜底：玩家贴着世界边角时，环形采样可能一直落在界外，
    // 此时取一个方向后把坐标钳制回世界范围，至少保证距离下限
    const angle = Math.random() * Math.PI * 2;
    const x = Math.min(Math.max(cx + Math.cos(angle) * minDist, margin), CONFIG.world.width - margin);
    const y = Math.min(Math.max(cy + Math.sin(angle) * minDist, margin), CONFIG.world.height - margin);
    return { x, y };
}

// 开始新波次
function startNewWave() {
    SFX.play('waveStart');
    const wave = game.wave;
    wave.isSpawning = true;
    wave.inBreak = false;
    wave.eliteSpawned = false;
    wave.bossSpawned = false;
    wave.enemiesSpawned = 0;
    wave.waveStartTime = Date.now();

    // 保险：清理所有玩家残留技能状态和冷却
    [game.player, game.player2].forEach(p => {
        if (p) {
            if (p.skillActive && p.endActiveSkill) {
                p.endActiveSkill();
            }
            p.skillCooldown = 0;
        }
    });

    // 计算本波敌人数量
    wave.totalEnemies = CONFIG.wave.baseEnemyCount + (wave.current - 1) * CONFIG.wave.enemyIncrement;
    wave.enemiesRemaining = wave.totalEnemies;

    // Boss波次额外加敌人
    if (wave.current % CONFIG.wave.bossWaveInterval === 0) {
        wave.totalEnemies += 5;
        wave.enemiesRemaining = wave.totalEnemies;
    }

    // 显示波次提示
    showWaveNotification(wave.current);

    // 遗物 onWaveStart 钩子
    [game.player, game.player2].forEach(p => {
        if (p && p.health > 0 && p.relics && p.relics.length > 0) {
            p.relics.forEach(relic => {
                if (relic.onWaveStart) relic.onWaveStart(p);
            });
        }
    });

    // 每波开始补充地图事件
    if (game.mapEvents && wave.current > 1) {
        const centerX = CONFIG.world.width / 2;
        const centerY = CONFIG.world.height / 2;
        const border = 200;
        // 补充1-2个宝箱
        const extraChests = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < extraChests; i++) {
            const x = border + Math.random() * (CONFIG.world.width - border * 2);
            const y = border + Math.random() * (CONFIG.world.height - border * 2);
            if (Math.hypot(x - centerX, y - centerY) > 250) {
                game.mapEvents.push(new MapEvent(x, y, 'chest'));
            }
        }
        // 每3波补充一个祭坛
        if (wave.current % 3 === 0) {
            const x = border + Math.random() * (CONFIG.world.width - border * 2);
            const y = border + Math.random() * (CONFIG.world.height - border * 2);
            game.mapEvents.push(new MapEvent(x, y, 'altar'));
        }
        // 补充2个陷阱
        for (let i = 0; i < 2; i++) {
            const x = border + Math.random() * (CONFIG.world.width - border * 2);
            const y = border + Math.random() * (CONFIG.world.height - border * 2);
            game.mapEvents.push(new MapEvent(x, y, 'trap'));
        }
    }
}

// 波次敌人生成逻辑
function updateWaveSpawning() {
    const now = Date.now();
    const wave = game.wave;

    // 如果在休息时间
    if (wave.inBreak) {
        if (now - wave.waveStartTime >= CONFIG.wave.timeBetweenWaves) {
            wave.current++;
            startNewWave();
        }
        return;
    }

    // 如果不在生成状态，跳过
    if (!wave.isSpawning) return;

    // 检查是否本波已生成完毕
    if (wave.enemiesSpawned >= wave.totalEnemies) {
        wave.isSpawning = false;
        return;
    }

    // 检查生成间隔
    if (now - wave.lastSpawnTime < CONFIG.wave.timeBetweenSpawns) return;

    // 计算还需要生成多少普通敌人
    const normalEnemiesNeeded = wave.totalEnemies - (wave.current % CONFIG.wave.bossWaveInterval === 0 ? 1 : 0) - 1;

    // 生成敌人
    const pos = getSpawnPosition();
    let type = 'normal';

    // 最后生成精英怪
    if (wave.enemiesSpawned >= normalEnemiesNeeded && !wave.eliteSpawned) {
        type = 'elite';
        wave.eliteSpawned = true;
    }
    // Boss波次最后生成Boss
    else if (wave.current % CONFIG.wave.bossWaveInterval === 0 &&
             wave.enemiesSpawned >= wave.totalEnemies - 1 && !wave.bossSpawned) {
        type = 'boss';
        wave.bossSpawned = true;
        SFX.play('bossSpawn');
        ScreenFX.shake(8, 400);
    }
    // 普通敌人随机类型
    else {
        const rand = Math.random();
        if (rand > 0.85) type = 'tank';
        else if (rand > 0.7) type = 'fast';
        else if (rand > 0.6 && wave.current >= 3) type = 'ranged';
        else if (rand > 0.52 && wave.current >= 5) type = 'splitter';
    }

    game.enemies.push(new Enemy(pos.x, pos.y, type));
    wave.enemiesSpawned++;
    wave.lastSpawnTime = now;
}

// 检查波次完成
function checkWaveComplete() {
    const wave = game.wave;

    // 如果还在生成或休息中，不检查
    if (wave.isSpawning || wave.inBreak) return;

    // 检查是否所有敌人都被消灭
    if (game.enemies.length === 0 && wave.enemiesSpawned >= wave.totalEnemies) {
        // 波次完成！
        wave.inBreak = true;
        wave.waveStartTime = Date.now();

        // 强制结束所有玩家的活跃技能，防止buff在商店期间永久保留，并重置冷却
        [game.player, game.player2].forEach(p => {
            if (p) {
                if (p.skillActive && p.endActiveSkill) {
                    p.endActiveSkill();
                }
                p.skillCooldown = 0;
            }
        });

        // Boss波：先选遗物再进商店
        if (wave.current % CONFIG.wave.bossWaveInterval === 0) {
            game.state = 'relicSelection';
            startRelicSelectionFlow(() => {
                game.state = 'waveComplete';
                showShopScreen();
            });
        } else {
            // 普通波：直接进商店
            game.state = 'waveComplete';
            showShopScreen();
        }
    }
}
