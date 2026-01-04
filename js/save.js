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
        const slot = document.createElement('div');
        slot.className = 'save-slot' + (saveData ? '' : ' empty');
        slot.dataset.slot = i;

        if (saveData) {
            slot.innerHTML = `
                <button class="save-slot-delete" data-slot="${i}" title="删除存档">×</button>
                <div class="save-slot-header">
                    <span class="slot-icon">📁</span>
                    <span>存档 ${i}</span>
                </div>
                <div class="save-slot-info">
                    <p class="class-name">${getClassName(saveData.selectedClass)}</p>
                    <p>⭐ 等级 ${saveData.player.level} | 🌊 波次 ${saveData.wave}</p>
                    <p>💀 击杀 ${saveData.killCount} | 🪙 ${saveData.player.gold || 0}</p>
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
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotIndex = parseInt(btn.dataset.slot);
            deleteSaveSlot(slotIndex);
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

// 保存游戏到指定存档位
function saveGameToSlot(slotIndex) {
    const saveData = {
        selectedClass: game.selectedClass,
        player: {
            x: game.player.x,
            y: game.player.y,
            health: game.player.health,
            maxHealth: game.player.maxHealth,
            attack: game.player.attack,
            speed: game.player.speed,
            level: game.player.level,
            exp: game.player.exp,
            maxExp: game.player.maxExp,
            weapons: game.player.weapons.map(w => ({ id: w.id, level: w.level })),
            passives: game.player.passives,
            critChance: game.player.critChance,
            critDamage: game.player.critDamage,
            vampireHeal: game.player.vampireHeal,
            expMultiplier: game.player.expMultiplier,
            healthRegen: game.player.healthRegen,
            multiShot: game.player.multiShot,
            maxSummons: game.player.maxSummons,
            gold: game.player.gold,
            goldMultiplier: game.player.goldMultiplier
        },
        wave: game.wave.current,
        killCount: game.killCount,
        gameTime: game.gameTime,
        saveTime: Date.now()
    };
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

// 应用读取的存档数据
function applyLoadedSaveData(saveData) {
    game.selectedClass = saveData.selectedClass;

    // 重置UI缓存
    resetUICache();

    generateObstacles();

    game.player = new Player(game.selectedClass);
    // 恢复玩家属性
    game.player.x = saveData.player.x;
    game.player.y = saveData.player.y;
    game.player.health = saveData.player.health;
    game.player.maxHealth = saveData.player.maxHealth;
    game.player.attack = saveData.player.attack;
    game.player.speed = saveData.player.speed;
    game.player.level = saveData.player.level;
    game.player.exp = saveData.player.exp;
    game.player.maxExp = saveData.player.maxExp;
    game.player.critChance = saveData.player.critChance || 0;
    game.player.critDamage = saveData.player.critDamage || 2;
    game.player.vampireHeal = saveData.player.vampireHeal || 0;
    game.player.expMultiplier = saveData.player.expMultiplier || 1;
    game.player.healthRegen = saveData.player.healthRegen || 0;
    game.player.multiShot = saveData.player.multiShot || 1;
    game.player.maxSummons = saveData.player.maxSummons || CLASSES[game.selectedClass].maxSummons || 0;
    game.player.gold = saveData.player.gold || 0;
    game.player.goldMultiplier = saveData.player.goldMultiplier || 1;

    // 恢复被动技能
    game.player.passives = saveData.player.passives || [];

    // 恢复武器
    game.player.weapons = [];
    saveData.player.weapons.forEach(w => {
        const weaponData = WEAPONS[w.id];
        if (weaponData) {
            game.player.weapons.push({ ...weaponData, level: w.level });
        }
    });

    game.enemies = [];
    game.particles = [];
    game.projectiles = [];
    game.weaponProjectiles = [];
    game.summons = [];
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
    requestAnimationFrame(gameLoop);
}

function clearSaveData(slotIndex) {
    if (slotIndex) {
        localStorage.removeItem(`roguelikeSave_${slotIndex}`);
    }
}
