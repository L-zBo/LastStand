// ==================== 成就系统 ====================
// 参考 Vampire Survivors 成就设计

const ACHIEVEMENT_STORAGE_KEY = 'laststand_achievements';

// 成就配置
const ACHIEVEMENTS = {
    // ========== 基础成就 ==========
    firstKill: {
        id: 'firstKill',
        name: '初试锋芒',
        description: '击杀第一个敌人',
        icon: '🎯',
        category: 'basic',
        hidden: false,
        reward: { soulStones: 5 },
        check: (stats) => stats.totalKills >= 1
    },
    kill100: {
        id: 'kill100',
        name: '百人斩',
        description: '累计击杀100个敌人',
        icon: '⚔️',
        category: 'basic',
        hidden: false,
        reward: { soulStones: 10 },
        check: (stats) => stats.totalKills >= 100
    },
    kill1000: {
        id: 'kill1000',
        name: '千人斩',
        description: '累计击杀1000个敌人',
        icon: '💀',
        category: 'basic',
        hidden: false,
        reward: { soulStones: 25 },
        check: (stats) => stats.totalKills >= 1000
    },
    kill10000: {
        id: 'kill10000',
        name: '屠夫',
        description: '累计击杀10000个敌人',
        icon: '☠️',
        category: 'basic',
        hidden: false,
        reward: { soulStones: 100 },
        check: (stats) => stats.totalKills >= 10000
    },

    // ========== 生存成就 ==========
    survive5min: {
        id: 'survive5min',
        name: '坚持不懈',
        description: '单局存活5分钟',
        icon: '⏱️',
        category: 'survival',
        hidden: false,
        reward: { soulStones: 10 },
        check: (stats) => stats.longestSurvivalTime >= 300
    },
    survive10min: {
        id: 'survive10min',
        name: '铁血战士',
        description: '单局存活10分钟',
        icon: '🛡️',
        category: 'survival',
        hidden: false,
        reward: { soulStones: 20 },
        check: (stats) => stats.longestSurvivalTime >= 600
    },
    survive20min: {
        id: 'survive20min',
        name: '不朽传说',
        description: '单局存活20分钟',
        icon: '👑',
        category: 'survival',
        hidden: false,
        reward: { soulStones: 50 },
        check: (stats) => stats.longestSurvivalTime >= 1200
    },
    survive30min: {
        id: 'survive30min',
        name: '神之领域',
        description: '单局存活30分钟',
        icon: '✨',
        category: 'survival',
        hidden: false,
        reward: { soulStones: 100 },
        check: (stats) => stats.longestSurvivalTime >= 1800
    },

    // ========== 波次成就 ==========
    wave10: {
        id: 'wave10',
        name: '初见Boss',
        description: '到达第10波',
        icon: '🌊',
        category: 'wave',
        hidden: false,
        reward: { soulStones: 15 },
        check: (stats) => stats.highestWave >= 10
    },
    wave20: {
        id: 'wave20',
        name: '精英猎手',
        description: '到达第20波',
        icon: '🔥',
        category: 'wave',
        hidden: false,
        reward: { soulStones: 30 },
        check: (stats) => stats.highestWave >= 20
    },
    wave30: {
        id: 'wave30',
        name: '无尽征程',
        description: '到达第30波',
        icon: '💫',
        category: 'wave',
        hidden: false,
        reward: { soulStones: 60 },
        check: (stats) => stats.highestWave >= 30
    },
    wave50: {
        id: 'wave50',
        name: '超越极限',
        description: '到达第50波',
        icon: '🌟',
        category: 'wave',
        hidden: false,
        reward: { soulStones: 150 },
        check: (stats) => stats.highestWave >= 50
    },

    // ========== Boss成就 ==========
    firstBoss: {
        id: 'firstBoss',
        name: '屠龙勇士',
        description: '击杀第一个Boss',
        icon: '🐉',
        category: 'boss',
        hidden: false,
        reward: { soulStones: 20 },
        check: (stats) => stats.bossKills >= 1
    },
    boss10: {
        id: 'boss10',
        name: 'Boss猎手',
        description: '累计击杀10个Boss',
        icon: '🗡️',
        category: 'boss',
        hidden: false,
        reward: { soulStones: 40 },
        check: (stats) => stats.bossKills >= 10
    },
    boss50: {
        id: 'boss50',
        name: 'Boss克星',
        description: '累计击杀50个Boss',
        icon: '⚡',
        category: 'boss',
        hidden: false,
        reward: { soulStones: 100 },
        check: (stats) => stats.bossKills >= 50
    },
    killDragon: {
        id: 'killDragon',
        name: '龙之末裔',
        description: '击败最终Boss：巨龙',
        icon: '🐲',
        category: 'boss',
        hidden: false,
        reward: { soulStones: 50 },
        check: (stats) => stats.dragonKills >= 1
    },

    // ========== 职业成就 ==========
    unlockAllClasses: {
        id: 'unlockAllClasses',
        name: '全职精通',
        description: '用所有职业各通关一次',
        icon: '🎭',
        category: 'class',
        hidden: false,
        reward: { soulStones: 80 },
        check: (stats) => {
            const classes = ['warrior', 'mage', 'assassin', 'ranger', 'summoner', 'knight', 'paladin', 'necromancer'];
            return classes.every(c => stats.classVictories && stats.classVictories[c] >= 1);
        }
    },
    warriorMaster: {
        id: 'warriorMaster',
        name: '战士大师',
        description: '使用战士通关10次',
        icon: '🛡️',
        category: 'class',
        hidden: false,
        reward: { soulStones: 30 },
        check: (stats) => stats.classVictories?.warrior >= 10
    },
    mageMaster: {
        id: 'mageMaster',
        name: '法师大师',
        description: '使用法师通关10次',
        icon: '🧙',
        category: 'class',
        hidden: false,
        reward: { soulStones: 30 },
        check: (stats) => stats.classVictories?.mage >= 10
    },

    // ========== 难度成就 ==========
    beatNormal: {
        id: 'beatNormal',
        name: '普通难度征服者',
        description: '普通难度通关（到达30波）',
        icon: '🏆',
        category: 'difficulty',
        hidden: false,
        reward: { soulStones: 25 },
        check: (stats) => stats.difficultyVictories?.normal >= 1
    },
    beatHard: {
        id: 'beatHard',
        name: '困难难度征服者',
        description: '困难难度通关（到达30波）',
        icon: '🏅',
        category: 'difficulty',
        hidden: false,
        reward: { soulStones: 50 },
        check: (stats) => stats.difficultyVictories?.hard >= 1
    },
    beatNightmare: {
        id: 'beatNightmare',
        name: '噩梦难度征服者',
        description: '噩梦难度通关（到达30波）',
        icon: '💎',
        category: 'difficulty',
        hidden: false,
        reward: { soulStones: 100 },
        check: (stats) => stats.difficultyVictories?.nightmare >= 1
    },

    // ========== 特殊成就 ==========
    noDamage: {
        id: 'noDamage',
        name: '完美无瑕',
        description: '单局前10波不受伤',
        icon: '🌟',
        category: 'special',
        hidden: false,
        reward: { soulStones: 40 },
        check: (stats) => stats.perfectWaves >= 10
    },
    speedrun: {
        id: 'speedrun',
        name: '极速战士',
        description: '5分钟内到达第10波',
        icon: '⚡',
        category: 'special',
        hidden: false,
        reward: { soulStones: 35 },
        check: (stats) => stats.fastestWave10 > 0 && stats.fastestWave10 <= 300
    },
    richman: {
        id: 'richman',
        name: '富可敌国',
        description: '单局获得1000金币',
        icon: '💰',
        category: 'special',
        hidden: false,
        reward: { soulStones: 20 },
        check: (stats) => stats.mostGoldInRun >= 1000
    },
    levelMax: {
        id: 'levelMax',
        name: '登峰造极',
        description: '单局达到50级',
        icon: '⭐',
        category: 'special',
        hidden: false,
        reward: { soulStones: 60 },
        check: (stats) => stats.highestLevel >= 50
    },

    // ========== 隐藏成就 ==========
    secretPacifist: {
        id: 'secretPacifist',
        name: '和平主义者',
        description: '单局存活10分钟但击杀数少于50',
        icon: '☮️',
        category: 'secret',
        hidden: true,
        reward: { soulStones: 30 },
        check: (stats) => stats.pacifistRun === true
    },
    secretDeath1000: {
        id: 'secretDeath1000',
        name: '不屈之魂',
        description: '累计死亡1000次',
        icon: '💀',
        category: 'secret',
        hidden: true,
        reward: { soulStones: 50 },
        check: (stats) => stats.totalDeaths >= 1000
    },
    secretAllWeapons: {
        id: 'secretAllWeapons',
        name: '武器收藏家',
        description: '单局拥有所有6个武器槽满级武器',
        icon: '🗡️',
        category: 'secret',
        hidden: true,
        reward: { soulStones: 80 },
        check: (stats) => stats.maxWeaponsBuild === true
    }
};

// 成就类别名称
const ACHIEVEMENT_CATEGORIES = {
    basic: '基础成就',
    survival: '生存成就',
    wave: '波次成就',
    boss: 'Boss成就',
    class: '职业成就',
    difficulty: '难度成就',
    special: '特殊成就',
    secret: '隐藏成就'
};

// 获取成就进度
function getAchievementProgress() {
    const saved = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return {
        unlocked: {}, // { achievementId: timestamp }
        stats: initAchievementStats()
    };
}

// 初始化成就统计
function initAchievementStats() {
    return {
        totalKills: 0,
        bossKills: 0,
        dragonKills: 0,
        totalDeaths: 0,
        longestSurvivalTime: 0,
        highestWave: 0,
        highestLevel: 0,
        mostGoldInRun: 0,
        classVictories: {},
        difficultyVictories: {},
        perfectWaves: 0,
        fastestWave10: 0,
        pacifistRun: false,
        maxWeaponsBuild: false
    };
}

// 保存成就进度
function saveAchievementProgress(progress) {
    localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(progress));
}

// 更新统计数据（游戏结束时调用）
// 注意：totalKills / bossKills / dragonKills 以及各项最高记录已经由
// trackAchievement 在局内实时累加过了，这里**不能再加一遍**，否则每局结束
// 击杀数都会翻倍。本函数只负责结算类统计（死亡数、通关记录、单局特殊条件）。
function updateAchievementStats(gameData) {
    const progress = getActiveAchievementProgress();
    if (!progress.stats) progress.stats = initAchievementStats();
    const stats = progress.stats;

    stats.totalDeaths = (stats.totalDeaths || 0) + 1;

    // 兜底：万一实时通道没跑起来（例如读档路径没开会话），这里用 max 补齐，
    // max 是幂等的，重复执行不会翻倍
    if (gameData.survivalTime > (stats.longestSurvivalTime || 0)) {
        stats.longestSurvivalTime = gameData.survivalTime;
    }
    if (gameData.wave > (stats.highestWave || 0)) {
        stats.highestWave = gameData.wave;
    }
    if (gameData.level > (stats.highestLevel || 0)) {
        stats.highestLevel = gameData.level;
    }
    if (gameData.gold > (stats.mostGoldInRun || 0)) {
        stats.mostGoldInRun = gameData.gold;
    }

    // 更新职业胜利次数
    if (gameData.victory && gameData.className) {
        if (!stats.classVictories) stats.classVictories = {};
        stats.classVictories[gameData.className] = (stats.classVictories[gameData.className] || 0) + 1;
    }

    // 更新难度胜利次数
    if (gameData.victory && gameData.difficulty) {
        if (!stats.difficultyVictories) stats.difficultyVictories = {};
        stats.difficultyVictories[gameData.difficulty] = (stats.difficultyVictories[gameData.difficulty] || 0) + 1;
    }

    // 特殊成就标记
    if (gameData.perfectWaves) {
        stats.perfectWaves = Math.max(stats.perfectWaves || 0, gameData.perfectWaves);
    }
    if (gameData.wave >= 10 && gameData.survivalTime <= 300) {
        if (!stats.fastestWave10 || gameData.survivalTime < stats.fastestWave10) {
            stats.fastestWave10 = gameData.survivalTime;
        }
    }
    if (gameData.survivalTime >= 600 && gameData.killCount < 50) {
        stats.pacifistRun = true;
    }
    if (gameData.maxWeaponsBuild) {
        stats.maxWeaponsBuild = true;
    }

    saveAchievementProgress(progress);

    // 检查并解锁成就
    const newUnlocks = checkAchievements(progress);
    return newUnlocks;
}

// 检查成就是否解锁
function checkAchievements(progress) {
    const newUnlocks = [];
    const stats = progress.stats;

    for (const key in ACHIEVEMENTS) {
        const achievement = ACHIEVEMENTS[key];

        // 如果已解锁，跳过
        if (progress.unlocked[achievement.id]) continue;

        // 检查条件
        if (achievement.check(stats)) {
            // 解锁成就
            progress.unlocked[achievement.id] = Date.now();
            newUnlocks.push(achievement);

            // 发放奖励
            if (achievement.reward && achievement.reward.soulStones) {
                grantSoulStones(achievement.reward.soulStones, `成就：${achievement.name}`);
            }
        }
    }

    if (newUnlocks.length > 0) {
        saveAchievementProgress(progress);
    }

    return newUnlocks;
}

// ==================== 局内实时结算 ====================
// 旧实现只在 gameOver 调一次 updateAchievementStats，玩家打一整局
// 29 个成就一个都不会弹。这里加一条实时通道：关键事件即时累加到内存态进度，
// 立刻判定并弹提示，只有真解锁了才落 localStorage（避免每次击杀都序列化）。

let liveAchievementProgress = null;

// 开局调用：把持久化进度读进内存，作为本局的实时累加基底
function beginAchievementSession() {
    liveAchievementProgress = getAchievementProgress();
    if (!liveAchievementProgress.stats) {
        liveAchievementProgress.stats = initAchievementStats();
    }
    return liveAchievementProgress;
}

// 实时上报。patch 的 key 有两种写法：
//   'totalKills': 3        累加 3
//   'max:highestWave': 7   取更大值
// 返回本次新解锁的成就数组。
function trackAchievement(patch) {
    if (!liveAchievementProgress) return [];
    try {
        return trackAchievementInner(patch);
    } catch (err) {
        // 成就是附加系统，它出问题不该影响击杀结算、掉落、经验这些主流程
        console.error('[成就] 实时结算异常，已跳过：', err);
        return [];
    }
}

function trackAchievementInner(patch) {
    const stats = liveAchievementProgress.stats;
    let changed = false;

    for (const key in patch) {
        const val = patch[key];
        if (key.indexOf('max:') === 0) {
            const realKey = key.slice(4);
            if (val > (stats[realKey] || 0)) {
                stats[realKey] = val;
                changed = true;
            }
        } else if (typeof val === 'boolean') {
            if (val && !stats[key]) {
                stats[key] = true;
                changed = true;
            }
        } else {
            stats[key] = (stats[key] || 0) + val;
            changed = true;
        }
    }
    if (!changed) return [];

    const unlocks = checkAchievements(liveAchievementProgress);
    unlocks.forEach((a, i) => {
        // 多个成就同时解锁时错开显示，避免通知叠在一起。
        // 局内用游戏计时器（跟着暂停一起冻结），结算画面等非 playing 状态
        // updateGameTimers 不会推进，回落到 setTimeout。
        const delay = i * 600;
        if (game && game.state === 'playing' && typeof addGameTimer === 'function') {
            addGameTimer(() => showAchievementUnlocked(a), delay);
        } else {
            registerUiTimeout(() => showAchievementUnlocked(a), delay);
        }
    });
    return unlocks;
}

// 本局结束/退出时把内存态落盘（checkAchievements 只在有解锁时写盘，
// 没解锁的纯统计增量要靠这里保住）
function flushAchievementSession() {
    if (liveAchievementProgress) {
        saveAchievementProgress(liveAchievementProgress);
    }
}

// 读取当前生效的进度：局内优先用内存态，否则回落到 localStorage
function getActiveAchievementProgress() {
    return liveAchievementProgress || getAchievementProgress();
}

// 显示成就解锁通知
function showAchievementUnlocked(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
            <div class="achievement-title">🏆 成就解锁</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-reward">+${achievement.reward.soulStones} 💎</div>
        </div>
    `;
    document.body.appendChild(notification);

    // 3秒后移除
    registerUiTimeout(() => {
        notification.style.opacity = '0';
        registerUiTimeout(() => notification.remove(), 500);
    }, 3000);
}

// 获取成就完成度
function getAchievementCompletion() {
    // 局内要用内存态，否则暂停时打开面板看到的还是开局前的旧数据
    const progress = getActiveAchievementProgress();
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = Object.keys(progress.unlocked).length;
    return {
        unlocked,
        total,
        percentage: Math.floor((unlocked / total) * 100)
    };
}

// 渲染成就面板
function renderAchievementPanel() {
    const progress = getActiveAchievementProgress();
    const completion = getAchievementCompletion();

    let html = `
        <div class="achievement-panel">
            <div class="panel-header">
                <h2>🏆 成就系统</h2>
                <button class="close-btn" onclick="closeAchievementPanel()">×</button>
            </div>
            <div class="achievement-stats">
                <div class="stat-item">
                    <span class="stat-label">完成度</span>
                    <span class="stat-value">${completion.unlocked}/${completion.total} (${completion.percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${completion.percentage}%"></div>
                </div>
            </div>
            <div class="achievement-categories">
    `;

    // 按类别分组
    const categorized = {};
    for (const key in ACHIEVEMENTS) {
        const achievement = ACHIEVEMENTS[key];
        if (!categorized[achievement.category]) {
            categorized[achievement.category] = [];
        }
        categorized[achievement.category].push(achievement);
    }

    // 渲染每个类别
    for (const category in categorized) {
        const achievements = categorized[category];
        const categoryName = ACHIEVEMENT_CATEGORIES[category];

        html += `
            <div class="achievement-category">
                <h3>${categoryName}</h3>
                <div class="achievement-list">
        `;

        achievements.forEach(achievement => {
            const unlocked = progress.unlocked[achievement.id];
            const isUnlocked = !!unlocked;
            const isHidden = achievement.hidden && !isUnlocked;

            html += `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : ''} ${isHidden ? 'hidden' : ''}">
                    <div class="achievement-icon-box">${isHidden ? '❓' : achievement.icon}</div>
                    <div class="achievement-details">
                        <div class="achievement-name">${isHidden ? '???' : achievement.name}</div>
                        <div class="achievement-description">${isHidden ? '隐藏成就' : achievement.description}</div>
                        ${isUnlocked ? `<div class="achievement-unlocked-date">解锁时间: ${new Date(unlocked).toLocaleDateString()}</div>` : ''}
                        <div class="achievement-reward">奖励: ${achievement.reward.soulStones} 💎</div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// 打开成就面板
function openAchievementPanel() {
    const existingPanel = document.getElementById('achievementPanel');
    if (existingPanel) existingPanel.remove();

    const panel = document.createElement('div');
    panel.id = 'achievementPanel';
    panel.className = 'screen';
    panel.innerHTML = renderAchievementPanel();
    document.body.appendChild(panel);
}

// 关闭成就面板
function closeAchievementPanel() {
    const panel = document.getElementById('achievementPanel');
    if (panel) panel.remove();
}
