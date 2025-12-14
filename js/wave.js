// ==================== 波次系统 ====================

// 获取敌人生成位置
function getSpawnPosition() {
    const minDistFromPlayer = 400;
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
        const x = 100 + Math.random() * (CONFIG.world.width - 200);
        const y = 100 + Math.random() * (CONFIG.world.height - 200);

        const distToPlayer = Math.hypot(x - game.player.x, y - game.player.y);
        if (distToPlayer >= minDistFromPlayer) {
            return { x, y };
        }
    }

    // 如果多次尝试都失败，在地图边缘随机生成
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch(side) {
        case 0:
            x = 100 + Math.random() * (CONFIG.world.width - 200);
            y = 100;
            break;
        case 1:
            x = CONFIG.world.width - 100;
            y = 100 + Math.random() * (CONFIG.world.height - 200);
            break;
        case 2:
            x = 100 + Math.random() * (CONFIG.world.width - 200);
            y = CONFIG.world.height - 100;
            break;
        case 3:
            x = 100;
            y = 100 + Math.random() * (CONFIG.world.height - 200);
            break;
    }
    return { x, y };
}

// 开始新波次
function startNewWave() {
    const wave = game.wave;
    wave.isSpawning = true;
    wave.inBreak = false;
    wave.eliteSpawned = false;
    wave.bossSpawned = false;
    wave.enemiesSpawned = 0;
    wave.waveStartTime = Date.now();

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
    }
    // 普通敌人随机类型
    else {
        const rand = Math.random();
        if (rand > 0.85) type = 'tank';
        else if (rand > 0.7) type = 'fast';
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

        // 显示波次完成奖励选择
        game.state = 'waveComplete';
        showWaveCompleteScreen();
    }
}
