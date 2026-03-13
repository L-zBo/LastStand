// ==================== 存档系统 ====================

// 检查是否有任何存档
function hasAnySaveData() {
    for (let i = 1; i <= 6; i++) {
        if (localStorage.getItem(`roguelikeSave_${i}`) !== null) {
            return true;
        }
    }
    return false;
}

// 检查存档
function checkSaveData() {
    const loadBtn = document.getElementById('loadGameBtn');
    if (hasAnySaveData()) {
        loadBtn.disabled = false;
    } else {
        loadBtn.disabled = true;
    }
}

// 获取存档数据
function getSaveData(slotIndex) {
    const data = localStorage.getItem(`roguelikeSave_${slotIndex}`);
    return data ? JSON.parse(data) : null;
}

// 获取职业中文名
function getClassName(classId) {
    const names = {
        warrior: '🛡️ 战士',
        mage: '🧙 法师',
        assassin: '🥷 刺客',
        ranger: '🏹 游侠',
        summoner: '🔮 召唤师',
        knight: '⚔️ 骑士',
        paladin: '✝️ 圣骑士',
        necromancer: '💀 死灵法师'
    };
    return names[classId] || classId;
}

// 格式化时间
function formatSaveTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 显示存档位选择界面
function showSaveSlotScreen(mode) {
    game.saveSlotMode = mode;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('saveSlotScreen').classList.remove('hidden');

    const title = document.getElementById('saveSlotTitle');
    if (mode === 'save') {
        title.textContent = '💾 选择存档位保存';
    } else if (mode === 'load') {
        title.textContent = '📂 选择存档读取';
    } else {
        title.textContent = '🎮 选择存档位';
    }

    renderSaveSlots();
}

// 渲染存档位
function renderSaveSlots() {
    const container = document.getElementById('saveSlots');
    container.innerHTML = '';

    for (let i = 1; i <= 6; i++) {
        const saveData = getSaveData(i);
        const slot = document.createElement('button');
        slot.className = 'save-slot' + (saveData ? '' : ' empty');
        slot.dataset.slot = i;

        if (saveData) {
            const diffNames = { easy: '简单', normal: '普通', hard: '困难', nightmare: '噩梦' };
            const mapNames = { forest: '森林', desert: '沙漠', dungeon: '地牢', snow: '雪地', lava: '熔岩', ocean: '海洋' };
            const diffText = diffNames[saveData.selectedDifficulty] || '普通';
            const mapText = mapNames[saveData.selectedMap] || '森林';
            const p2Text = saveData.playerCount === 2 ? ` | 👥 双人` : '';
            slot.innerHTML = `
                <span class="save-slot-delete" role="button" tabindex="0" data-slot="${i}" title="删除存档" aria-label="删除存档 ${i}">×</span>
                <div class="save-slot-header">
                    <span class="slot-icon">📁</span>
                    <span>存档 ${i}</span>
                </div>
                <div class="save-slot-info">
                    <p class="class-name">${getClassName(saveData.selectedClass)}</p>
                    <p>⭐ 等级 ${saveData.player.level} | 🌊 波次 ${saveData.wave}</p>
                    <p>💀 击杀 ${saveData.killCount} | 🪙 ${saveData.player.gold || 0}</p>
                    <p>🗺️ ${mapText} | ⚔️ ${diffText}${p2Text}</p>
                    <p class="save-time">保存于: ${formatSaveTime(saveData.saveTime)}</p>
                </div>
            `;
        } else {
            slot.innerHTML = `
                <div class="save-slot-header">
                    <span class="slot-icon">📄</span>
                    <span>存档 ${i}</span>
                </div>
                <p class="save-slot-empty-text">- 空存档位 -</p>
            `;
        }

        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-slot-delete')) return;
            handleSlotClick(i);
        });

        container.appendChild(slot);
    }

    // 绑定删除按钮事件
    document.querySelectorAll('.save-slot-delete').forEach(btn => {
        const handler = (e) => {
            e.stopPropagation();
            const slotIndex = parseInt(btn.dataset.slot);
            deleteSaveSlot(slotIndex);
        };
        btn.addEventListener('click', handler);
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler(e);
            }
        });
    });
}

// 处理存档位点击
function handleSlotClick(slotIndex) {
    const saveData = getSaveData(slotIndex);
    const mode = game.saveSlotMode;

    if (mode === 'load') {
        if (saveData) {
            loadGameFromSlot(slotIndex);
        }
    } else if (mode === 'save') {
        if (saveData) {
            game.pendingSaveSlot = slotIndex;
            showOverwriteModal();
        } else {
            saveGameToSlot(slotIndex);
            showSaveNotification();
            hideSaveSlotScreen();
            document.getElementById('gameScreen').classList.remove('hidden');
            resumeGame();
        }
    } else if (mode === 'newgame') {
        if (saveData) {
            game.pendingSaveSlot = slotIndex;
            showOverwriteModal();
        } else {
            game.currentSaveSlot = slotIndex;
            hideSaveSlotScreen();
            showClassSelection();
        }
    }
}

// 删除存档
function deleteSaveSlot(slotIndex) {
    if (confirm(`确定要删除存档 ${slotIndex} 吗？`)) {
        localStorage.removeItem(`roguelikeSave_${slotIndex}`);
        renderSaveSlots();
        checkSaveData();
    }
}

// 隐藏存档位选择界面
function hideSaveSlotScreen() {
    document.getElementById('saveSlotScreen').classList.add('hidden');
}

// 返回开始界面
function backToStartScreen() {
    hideSaveSlotScreen();
    document.getElementById('startScreen').classList.remove('hidden');
}

function hasSaveData() {
    return hasAnySaveData();
}

function showOverwriteModal() {
    document.getElementById('overwriteModal').classList.remove('hidden');
}

function showClassSelection() {
    document.getElementById('startScreen').classList.remove('hidden');
    // 先显示人数选择
    document.getElementById('playerCountSelection').classList.remove('hidden');
    document.getElementById('classSelection').classList.add('hidden');
    // 重置选择状态
    game.selectedClass = null;
    game.selectedClass2 = null;
    game.playerCount = 1;
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
}

// 序列化单个玩家数据
function serializePlayer(player) {
    return {
        x: player.x,
        y: player.y,
        health: player.health,
        maxHealth: player.maxHealth,
        attack: player.attack,
        speed: player.speed,
        level: player.level,
        exp: player.exp,
        maxExp: player.maxExp,
        weapons: player.weapons.map(w => ({ id: w.id, level: w.level })),
        passives: player.passives,
        critChance: player.critChance,
        critDamage: player.critDamage,
        vampireHeal: player.vampireHeal,
        expMultiplier: player.expMultiplier,
        healthRegen: player.healthRegen,
        multiShot: player.multiShot,
        maxSummons: player.maxSummons,
        gold: player.gold,
        goldMultiplier: player.goldMultiplier,
        damageReduction: player.damageReduction || 0,
        armor: player.armor || 0,
        attackCooldown: player.attackCooldown,
        attackRange: player.attackRange,
        relics: (player.relics || []).map(r => r.id),
        // 职业特殊属性
        knockbackPower: player.knockbackPower || 0,
        arrowCount: player.arrowCount || 0,
        soulLink: player.soulLink || 0,
        counterAttack: player.counterAttack || 0,
        healPower: player.healPower || 0,
        smite: player.smite || false,
        lifeSteal: player.lifeSteal || 0,
        firstStrikeCrit: player.firstStrikeCrit || false,
        magicPenetration: player.magicPenetration || 0,
        // 升级获得的buff属性
        pickupRangeBonus: player.pickupRangeBonus || 1,
        magnetRangeBonus: player.magnetRangeBonus || 1,
        berserkerMode: player.berserkerMode || false,
        knockbackChance: player.knockbackChance || 0,
        magicDamageBonus: player.magicDamageBonus || 1,
        manaShield: player.manaShield || false,
        spellEcho: player.spellEcho || 0,
        backstab: player.backstab || false,
        poisonDamage: player.poisonDamage || 0,
        hunterMark: player.hunterMark || false,
        summonDamageBonus: player.summonDamageBonus || 1,
        summonDurationBonus: player.summonDurationBonus || 1,
        knockbackImmune: player.knockbackImmune || false,
        holyHeal: player.holyHeal || 0,
        divineShield: player.divineShield || false,
        corpseExplosion: player.corpseExplosion || false,
        deathCoil: player.deathCoil || false,
        dashMaxCooldown: player.dashMaxCooldown
    };
}

// 保存游戏到指定存档位
function saveGameToSlot(slotIndex) {
    const saveData = {
        selectedClass: game.selectedClass,
        selectedDifficulty: game.selectedDifficulty,
        selectedMap: game.selectedMap,
        playerCount: game.playerCount,
        player: serializePlayer(game.player),
        wave: game.wave.current,
        killCount: game.killCount,
        gameTime: game.gameTime,
        saveTime: Date.now()
    };

    // 双人模式保存P2
    if (game.playerCount === 2 && game.player2) {
        saveData.selectedClass2 = game.selectedClass2;
        saveData.player2 = serializePlayer(game.player2);
    }

    localStorage.setItem(`roguelikeSave_${slotIndex}`, JSON.stringify(saveData));
    game.currentSaveSlot = slotIndex;
}

// 保存游戏（使用当前存档位）
function saveGame() {
    if (game.currentSaveSlot) {
        saveGameToSlot(game.currentSaveSlot);
    } else {
        showSaveSlotScreen('save');
    }
}

// 从指定存档位读取游戏
function loadGameFromSlot(slotIndex) {
    const saveData = getSaveData(slotIndex);
    if (!saveData) return;

    game.currentSaveSlot = slotIndex;
    game.pendingSaveData = saveData;

    hideSaveSlotScreen();
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    showCountdown(() => {
        applyLoadedSaveData(game.pendingSaveData);
    });
}

// 读取游戏（显示存档选择界面）
function loadGame() {
    showSaveSlotScreen('load');
}

// 恢复单个玩家的属性
function restorePlayer(player, data, classType) {
    player.x = data.x;
    player.y = data.y;
    player.health = data.health;
    player.maxHealth = data.maxHealth;
    player.attack = data.attack;
    player.speed = data.speed;
    player.level = data.level;
    player.exp = data.exp;
    player.maxExp = data.maxExp;
    player.critChance = data.critChance || 0;
    player.critDamage = data.critDamage || 2;
    player.vampireHeal = data.vampireHeal || 0;
    player.expMultiplier = data.expMultiplier || 1;
    player.healthRegen = data.healthRegen || 0;
    player.multiShot = data.multiShot || 1;
    player.maxSummons = data.maxSummons || CLASSES[classType].maxSummons || 0;
    player.gold = data.gold || 0;
    player.goldMultiplier = data.goldMultiplier || 1;
    player.damageReduction = data.damageReduction || 0;
    player.armor = data.armor || 0;
    if (data.attackCooldown) player.attackCooldown = data.attackCooldown;
    if (data.attackRange) player.attackRange = data.attackRange;

    // 职业特殊属性
    if (data.knockbackPower) player.knockbackPower = data.knockbackPower;
    if (data.arrowCount) player.arrowCount = data.arrowCount;
    if (data.soulLink) player.soulLink = data.soulLink;
    if (data.counterAttack) player.counterAttack = data.counterAttack;
    if (data.healPower) player.healPower = data.healPower;
    if (data.smite) player.smite = data.smite;
    if (data.lifeSteal) player.lifeSteal = data.lifeSteal;
    if (data.firstStrikeCrit) player.firstStrikeCrit = data.firstStrikeCrit;
    if (data.magicPenetration) player.magicPenetration = data.magicPenetration;

    // 升级获得的buff属性
    if (data.pickupRangeBonus && data.pickupRangeBonus !== 1) player.pickupRangeBonus = data.pickupRangeBonus;
    if (data.magnetRangeBonus && data.magnetRangeBonus !== 1) player.magnetRangeBonus = data.magnetRangeBonus;
    if (data.berserkerMode) player.berserkerMode = data.berserkerMode;
    if (data.knockbackChance) player.knockbackChance = data.knockbackChance;
    if (data.magicDamageBonus && data.magicDamageBonus !== 1) player.magicDamageBonus = data.magicDamageBonus;
    if (data.manaShield) player.manaShield = data.manaShield;
    if (data.spellEcho) player.spellEcho = data.spellEcho;
    if (data.backstab) player.backstab = data.backstab;
    if (data.poisonDamage) player.poisonDamage = data.poisonDamage;
    if (data.hunterMark) player.hunterMark = data.hunterMark;
    if (data.summonDamageBonus && data.summonDamageBonus !== 1) player.summonDamageBonus = data.summonDamageBonus;
    if (data.summonDurationBonus && data.summonDurationBonus !== 1) player.summonDurationBonus = data.summonDurationBonus;
    if (data.knockbackImmune) player.knockbackImmune = data.knockbackImmune;
    if (data.holyHeal) player.holyHeal = data.holyHeal;
    if (data.divineShield) player.divineShield = data.divineShield;
    if (data.corpseExplosion) player.corpseExplosion = data.corpseExplosion;
    if (data.deathCoil) player.deathCoil = data.deathCoil;
    if (data.dashMaxCooldown) player.dashMaxCooldown = data.dashMaxCooldown;

    // 恢复被动技能
    player.passives = data.passives || [];

    // 恢复武器
    player.weapons = [];
    (data.weapons || []).forEach(w => {
        const weaponData = WEAPONS[w.id];
        if (weaponData) {
            player.weapons.push({ ...weaponData, level: w.level });
        }
    });

    // 恢复遗物（不触发onEquip，因为保存的属性已包含加成）
    player.relics = [];
    (data.relics || []).forEach(relicId => {
        const relicDef = RELICS[relicId];
        if (relicDef && !player.relics.some(r => r.id === relicId)) {
            player.relics.push({ id: relicId, ...relicDef });
        }
    });
}

// 应用读取的存档数据
function applyLoadedSaveData(saveData) {
    game.selectedClass = saveData.selectedClass;
    game.selectedDifficulty = saveData.selectedDifficulty || 'normal';
    game.selectedMap = saveData.selectedMap || 'forest';
    game.difficultyMod = CONFIG.difficulty[game.selectedDifficulty];
    game.mapConfig = CONFIG.maps[game.selectedMap];
    game.playerCount = saveData.playerCount || 1;

    // 重置UI缓存
    resetUICache();

    generateObstacles();
    generateMapEvents();

    // 创建并恢复P1
    game.player = new Player(game.selectedClass, 1);
    restorePlayer(game.player, saveData.player, game.selectedClass);

    // 设置P1职业名称
    const classNames = {
        warrior: '战士', mage: '法师', assassin: '刺客',
        ranger: '游侠', summoner: '召唤师',
        knight: '骑士', paladin: '圣骑士', necromancer: '死灵法师'
    };
    document.getElementById('p1ClassName').textContent = classNames[game.selectedClass] || game.selectedClass;

    // 双人模式恢复P2
    if (game.playerCount === 2 && saveData.player2 && saveData.selectedClass2) {
        game.selectedClass2 = saveData.selectedClass2;
        game.player2 = new Player(game.selectedClass2, 2);
        restorePlayer(game.player2, saveData.player2, game.selectedClass2);
        document.getElementById('p2Panel').classList.remove('hidden');
        document.getElementById('p2ClassName').textContent = classNames[game.selectedClass2] || game.selectedClass2;
    } else {
        game.player2 = null;
        document.getElementById('p2Panel').classList.add('hidden');
    }

    resizeCanvas();

    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];
    game.droppedItems = [];
    game.enemyProjectiles = [];
    game.timers = [];
    game.damageNumbers = [];
    game.killCount = saveData.killCount;
    game.gameTime = saveData.gameTime;
    game.lastTime = 0;
    game.state = 'playing';

    game.wave = {
        current: saveData.wave,
        enemiesRemaining: 0,
        enemiesSpawned: 0,
        totalEnemies: 0,
        lastSpawnTime: 0,
        isSpawning: false,
        eliteSpawned: false,
        bossSpawned: false,
        waveStartTime: 0,
        inBreak: false
    };

    startNewWave();
    // 防止重复启动游戏循环
    if (!game.loopRunning) {
        game.loopRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

function clearSaveData(slotIndex) {
    if (slotIndex) {
        localStorage.removeItem(`roguelikeSave_${slotIndex}`);
    }
}
