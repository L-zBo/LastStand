// ==================== Meta 永久进度系统 ====================
// 灵魂石（soulStones）是永久货币，通过游戏获取，用于购买永久升级

const META_STORAGE_KEY = 'laststand_meta';

// 永久升级配置
const META_UPGRADES = {
    maxHealth: {
        name: '生命强化',
        icon: '❤️',
        desc: '永久增加基础生命值',
        maxLevel: 10,
        costBase: 5,
        costGrowth: 3,
        effectPerLevel: 10, // +10 HP per level
        effectDesc: (lv) => `+${lv * 10} 生命值`
    },
    attack: {
        name: '力量强化',
        icon: '⚔️',
        desc: '永久增加基础攻击力',
        maxLevel: 10,
        costBase: 5,
        costGrowth: 3,
        effectPerLevel: 2, // +2 ATK per level
        effectDesc: (lv) => `+${lv * 2} 攻击力`
    },
    speed: {
        name: '敏捷强化',
        icon: '🏃',
        desc: '永久增加移动速度',
        maxLevel: 5,
        costBase: 8,
        costGrowth: 5,
        effectPerLevel: 0.2, // +0.2 speed per level
        effectDesc: (lv) => `+${(lv * 0.2).toFixed(1)} 移动速度`
    },
    expBonus: {
        name: '智慧强化',
        icon: '✨',
        desc: '永久增加经验获取',
        maxLevel: 10,
        costBase: 6,
        costGrowth: 4,
        effectPerLevel: 5, // +5% exp per level
        effectDesc: (lv) => `+${lv * 5}% 经验获取`
    },
    critChance: {
        name: '命运之刃',
        icon: '💥',
        desc: '永久增加暴击率',
        maxLevel: 5,
        costBase: 10,
        costGrowth: 8,
        effectPerLevel: 2, // +2% crit per level
        effectDesc: (lv) => `+${lv * 2}% 暴击率`
    },
    regen: {
        name: '再生强化',
        icon: '💖',
        desc: '永久增加生命恢复',
        maxLevel: 5,
        costBase: 8,
        costGrowth: 5,
        effectPerLevel: 0.5, // +0.5 hp/s per level
        effectDesc: (lv) => `+${(lv * 0.5).toFixed(1)} HP/秒`
    },
    pickupRange: {
        name: '磁力领域',
        icon: '🧲',
        desc: '永久增加拾取范围',
        maxLevel: 5,
        costBase: 4,
        costGrowth: 3,
        effectPerLevel: 0.1, // +10% pickup range per level
        effectDesc: (lv) => `+${lv * 10}% 拾取范围`
    },
    dashCooldown: {
        name: '迅捷冲刺',
        icon: '💨',
        desc: '减少冲刺冷却时间',
        maxLevel: 5,
        costBase: 6,
        costGrowth: 4,
        effectPerLevel: 200, // -200ms cooldown per level
        effectDesc: (lv) => `-${(lv * 0.2).toFixed(1)}秒 冲刺冷却`
    }
};

// 默认Meta数据
function getDefaultMetaData() {
    return {
        soulStones: 0,
        totalSoulStones: 0, // 历史总获取
        totalRuns: 0,
        bestWave: 0,
        bestKills: 0,
        bestTime: 0,
        upgrades: {}
    };
}

// 加载Meta数据
function loadMetaData() {
    try {
        const data = localStorage.getItem(META_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // 合并默认值（防止新字段缺失）
            return { ...getDefaultMetaData(), ...parsed };
        }
    } catch (e) {
        // ignore
    }
    return getDefaultMetaData();
}

// 保存Meta数据
function saveMetaData(metaData) {
    try {
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(metaData));
    } catch (e) {
        // ignore
    }
}

// 获取升级等级
function getUpgradeLevel(upgradeId) {
    const meta = loadMetaData();
    return meta.upgrades[upgradeId] || 0;
}

// 获取升级花费
function getUpgradeCost(upgradeId, level) {
    const config = META_UPGRADES[upgradeId];
    if (!config) return Infinity;
    return config.costBase + config.costGrowth * level;
}

// 购买升级
function purchaseUpgrade(upgradeId) {
    const meta = loadMetaData();
    const config = META_UPGRADES[upgradeId];
    if (!config) return false;

    const currentLevel = meta.upgrades[upgradeId] || 0;
    if (currentLevel >= config.maxLevel) return false;

    const cost = getUpgradeCost(upgradeId, currentLevel);
    if (meta.soulStones < cost) return false;

    meta.soulStones -= cost;
    meta.upgrades[upgradeId] = currentLevel + 1;
    saveMetaData(meta);
    return true;
}

// 计算每局结束获得的灵魂石
function calculateSoulStoneReward(wave, kills, timeAlive, difficulty) {
    let stones = 0;
    stones += Math.floor(wave * 1.5); // 每波1.5石
    stones += Math.floor(kills / 10); // 每10击杀1石
    stones += Math.floor(timeAlive / 60); // 每分钟1石

    // 难度加成
    const diffMod = { easy: 0.8, normal: 1.0, hard: 1.5, nightmare: 2.0 };
    stones = Math.floor(stones * (diffMod[difficulty] || 1));

    return Math.max(1, stones); // 至少1个
}

// 应用Meta加成到玩家
function applyMetaBonuses(player) {
    const meta = loadMetaData();
    const upgrades = meta.upgrades;

    if (upgrades.maxHealth) {
        const bonus = upgrades.maxHealth * META_UPGRADES.maxHealth.effectPerLevel;
        player.maxHealth += bonus;
        player.health += bonus;
    }
    if (upgrades.attack) {
        player.attack += upgrades.attack * META_UPGRADES.attack.effectPerLevel;
    }
    if (upgrades.speed) {
        player.speed += upgrades.speed * META_UPGRADES.speed.effectPerLevel;
    }
    if (upgrades.expBonus) {
        // 经验结算只看 expMultiplier（entities.js gainExp）。这里原本写的是
        // expBonus——一个没有任何读取方的死字段，等于玩家花灵魂石买了个空强化。
        player.expMultiplier = (player.expMultiplier || 1) +
            (upgrades.expBonus * META_UPGRADES.expBonus.effectPerLevel / 100);
    }
    if (upgrades.critChance) {
        player.critChance = (player.critChance || 0) + (upgrades.critChance * META_UPGRADES.critChance.effectPerLevel / 100);
    }
    if (upgrades.regen) {
        player.healthRegen = (player.healthRegen || 0) + (upgrades.regen * META_UPGRADES.regen.effectPerLevel);
    }
    if (upgrades.pickupRange) {
        player.pickupRangeBonus = (player.pickupRangeBonus || 1) + (upgrades.pickupRange * META_UPGRADES.pickupRange.effectPerLevel);
    }
    if (upgrades.dashCooldown) {
        player.dashMaxCooldown = Math.max(500, player.dashMaxCooldown - upgrades.dashCooldown * META_UPGRADES.dashCooldown.effectPerLevel);
    }
}

// ==================== UI 相关 ====================

// 渲染Meta面板
function renderMetaPanel() {
    const meta = loadMetaData();
    const panel = document.getElementById('metaPanel');
    if (!panel) return;

    let html = `
        <div class="meta-header">
            <h2>永久强化</h2>
            <div class="meta-currency">💎 灵魂石: <span id="soulStoneCount">${meta.soulStones}</span></div>
            <div class="meta-stats-row">
                <span>总局数: ${meta.totalRuns}</span>
                <span>最高波次: ${meta.bestWave}</span>
                <span>最多击杀: ${meta.bestKills}</span>
            </div>
        </div>
        <div class="meta-upgrades">
    `;

    for (const [id, config] of Object.entries(META_UPGRADES)) {
        const level = meta.upgrades[id] || 0;
        const maxed = level >= config.maxLevel;
        const cost = maxed ? '-' : getUpgradeCost(id, level);
        const canAfford = !maxed && meta.soulStones >= cost;

        html += `
            <div class="meta-upgrade-card ${maxed ? 'maxed' : ''} ${canAfford ? 'affordable' : ''}">
                <div class="meta-upgrade-icon">${config.icon}</div>
                <div class="meta-upgrade-info">
                    <div class="meta-upgrade-name">${config.name}</div>
                    <div class="meta-upgrade-desc">${config.desc}</div>
                    <div class="meta-upgrade-effect">${config.effectDesc(level)}</div>
                    <div class="meta-upgrade-level">
                        ${'■'.repeat(level)}${'□'.repeat(config.maxLevel - level)}
                        <span>${level}/${config.maxLevel}</span>
                    </div>
                </div>
                <button class="meta-buy-btn ${maxed ? 'disabled' : ''} ${!canAfford && !maxed ? 'too-expensive' : ''}"
                    ${maxed || !canAfford ? 'disabled' : ''}
                    data-upgrade-id="${id}">
                    ${maxed ? '已满级' : `💎 ${cost}`}
                </button>
            </div>
        `;
    }

    html += '</div><button class="meta-close-btn" data-action="close-meta">返回</button>';
    panel.innerHTML = html;

    // 绑定事件（替代内联 onclick）
    panel.querySelectorAll('.meta-buy-btn[data-upgrade-id]').forEach(btn => {
        btn.addEventListener('click', () => onMetaUpgrade(btn.dataset.upgradeId));
    });
    const closeBtn = panel.querySelector('.meta-close-btn[data-action="close-meta"]');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMetaPanel);
    }
}

// 购买升级回调
function onMetaUpgrade(upgradeId) {
    if (purchaseUpgrade(upgradeId)) {
        renderMetaPanel();
    }
}

// 打开/关闭Meta面板
function openMetaPanel() {
    const panel = document.getElementById('metaPanel');
    if (panel) {
        panel.classList.remove('hidden');
        renderMetaPanel();
    }
}

function closeMetaPanel() {
    const panel = document.getElementById('metaPanel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

// 游戏结束时的灵魂石奖励
// 直接发放指定数量的灵魂石（成就奖励用）
// achievements.js 的 checkAchievements 一直在调 grantSoulStones(数量, 来源)，
// 但 meta.js 里从来只有按局结算的 grantSoulStoneReward(wave,kills,time,difficulty)，
// 名字和签名都对不上——只要有成就解锁就抛 ReferenceError。
// 过去它只在 gameOver 里触发，异常被结算流程盖住没人发现；一旦成就改成局内实时判定，
// 这个异常会当场打断 requestAnimationFrame 链，表现为「画面还在但一切都不动」。
function grantSoulStones(amount, reason) {
    const gain = Math.max(0, Math.floor(amount || 0));
    if (gain === 0) return 0;
    const meta = loadMetaData();
    meta.soulStones += gain;
    meta.totalSoulStones += gain;
    saveMetaData(meta);
    if (reason) {
        console.log(`[灵魂石] +${gain}（${reason}）`);
    }
    return gain;
}

function grantSoulStoneReward(wave, kills, timeAlive, difficulty) {
    const reward = calculateSoulStoneReward(wave, kills, timeAlive, difficulty);
    const meta = loadMetaData();
    meta.soulStones += reward;
    meta.totalSoulStones += reward;
    meta.totalRuns++;
    if (wave > meta.bestWave) meta.bestWave = wave;
    if (kills > meta.bestKills) meta.bestKills = kills;
    if (timeAlive > meta.bestTime) meta.bestTime = timeAlive;
    saveMetaData(meta);
    return reward;
}
