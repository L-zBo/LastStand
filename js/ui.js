// ==================== UI相关函数 ====================

// 上次武器栏状态的缓存
let lastWeaponBarState = null;
let lastWeaponBar2State = null;

// 上次被动栏状态的缓存
let lastPassiveBarState = null;
let lastPassiveBar2State = null;

// 上次遗物栏状态的缓存
let lastRelicBarState = null;
let lastRelicBar2State = null;
let weaponDetailPreviousState = null;

// 更新UI
function updateUI() {
    // P1 UI
    document.getElementById('playerHealth').textContent = Math.max(0, Math.floor(game.player.health));
    document.getElementById('playerMaxHealth').textContent = game.player.maxHealth;
    document.getElementById('playerLevel').textContent = game.player.level;
    document.getElementById('playerExp').textContent = game.player.exp;
    document.getElementById('playerMaxExp').textContent = game.player.maxExp;
    document.getElementById('playerAttack').textContent = game.player.attack;
    document.getElementById('waveCount').textContent = game.wave.current;
    // 本波剩余敌人（含未刷出的），让玩家知道还要打多久
    const waveRemainingEl = document.getElementById('waveRemaining');
    if (waveRemainingEl) {
        const left = Math.max(0, game.wave.enemiesRemaining);
        waveRemainingEl.textContent = game.wave.inBreak ? '' : ` (剩${left})`;
    }
    document.getElementById('killCount').textContent = game.killCount;
    document.getElementById('gameTime').textContent = Math.floor(game.gameTime);
    document.getElementById('goldCount').textContent = game.player.gold;

    // 顶部UI新增属性
    document.getElementById('playerSpeed').textContent = game.player.speed.toFixed(1);
    document.getElementById('playerRegen').textContent = game.player.healthRegen || 0;
    document.getElementById('playerCrit').textContent = Math.floor((game.player.critChance || 0) * 100);

    // 右侧面板详细属性
    document.getElementById('playerVampire').textContent = game.player.vampireHeal || 0;
    document.getElementById('playerCritDmg').textContent = Math.floor((game.player.critDamage || 2) * 100) + '%';
    document.getElementById('playerRange').textContent = Math.floor(game.player.attackRange || 50);
    document.getElementById('playerAtkSpeed').textContent = game.player.attackCooldown + 'ms';
    document.getElementById('playerMultishot').textContent = game.player.multiShot || 1;
    document.getElementById('playerExpBonus').textContent = Math.floor((game.player.expMultiplier || 1) * 100) + '%';

    // P2 UI（双人模式）
    if (game.playerCount === 2 && game.player2) {
        document.getElementById('player2Health').textContent = Math.max(0, Math.floor(game.player2.health));
        document.getElementById('player2MaxHealth').textContent = game.player2.maxHealth;
        document.getElementById('player2Level').textContent = game.player2.level;
        document.getElementById('player2Exp').textContent = game.player2.exp;
        document.getElementById('player2MaxExp').textContent = game.player2.maxExp;
        document.getElementById('player2Attack').textContent = game.player2.attack;
        document.getElementById('player2Speed').textContent = game.player2.speed.toFixed(1);
        document.getElementById('player2Regen').textContent = game.player2.healthRegen || 0;
        document.getElementById('player2Crit').textContent = Math.floor((game.player2.critChance || 0) * 100);
        document.getElementById('player2Vampire').textContent = game.player2.vampireHeal || 0;
        document.getElementById('player2CritDmg').textContent = Math.floor((game.player2.critDamage || 2) * 100) + '%';
        document.getElementById('player2Range').textContent = Math.floor(game.player2.attackRange || 50);
        document.getElementById('player2AtkSpeed').textContent = game.player2.attackCooldown + 'ms';
        document.getElementById('player2Multishot').textContent = game.player2.multiShot || 1;
        document.getElementById('player2ExpBonus').textContent = Math.floor((game.player2.expMultiplier || 1) * 100) + '%';

        // 更新P2的武器栏和被动栏
        updateWeaponBar2IfNeeded();
        updatePassiveBar2IfNeeded();
        updateRelicBarIfNeeded('relicBar2', game.player2);
        updateSkillInfo('skillInfo2', game.player2);
    }

    // 只在数据变化时更新武器栏和被动栏
    updateWeaponBarIfNeeded();
    updatePassiveBarIfNeeded();
    updateRelicBarIfNeeded('relicBar', game.player);
    updateSkillInfo('skillInfo', game.player);
}

// 更新武器栏（仅在变化时）
function updateWeaponBarIfNeeded() {
    const currentState = game.player.weapons.map(w => `${w.id}:${w.level}`).join(',');

    if (currentState === lastWeaponBarState) {
        return;
    }

    lastWeaponBarState = currentState;
    updateWeaponBar();
}

// 更新武器栏
function updateWeaponBar() {
    const weaponBar = document.getElementById('weaponBar');
    weaponBar.innerHTML = '';

    for (let i = 0; i < game.player.maxWeapons; i++) {
        const weapon = game.player.weapons[i];
        const slot = document.createElement(weapon ? 'button' : 'div');
        slot.className = 'weapon-slot';

        if (weapon) {
            slot.type = 'button';
            slot.setAttribute('aria-label', `查看武器 ${weapon.name}，等级 ${weapon.level || 1}`);
            if (weapon.type === 'evolved') {
                slot.classList.add('evolved');
            }
            slot.innerHTML = `
                <span class="weapon-icon">${weapon.icon}</span>
                ${weapon.level ? `<span class="weapon-level">${weapon.level}</span>` : ''}
            `;
            slot.addEventListener('click', () => showWeaponDetail(weapon));
        } else {
            slot.setAttribute('aria-hidden', 'true');
            slot.innerHTML = '<span class="weapon-empty">+</span>';
        }

        weaponBar.appendChild(slot);
    }
}

// 更新被动栏（仅在变化时）
function updatePassiveBarIfNeeded() {
    const passives = game.player.passives || [];
    const currentState = passives.map(p => p.id).join(',');

    if (currentState === lastPassiveBarState) {
        return;
    }

    lastPassiveBarState = currentState;
    updatePassiveBar();
}

// 更新被动栏
function updatePassiveBar() {
    const passiveBar = document.getElementById('passiveBar');
    if (!passiveBar) return;
    passiveBar.innerHTML = '';

    const passives = game.player.passives || [];

    if (passives.length === 0) {
        passiveBar.innerHTML = '<span class="empty-state-text">暂无被动</span>';
        return;
    }

    passives.forEach(passive => {
        const slot = document.createElement('div');
        slot.className = 'passive-slot' + (passive.classOnly ? ' class-passive' : '');
        slot.tabIndex = 0;
        slot.setAttribute('aria-label', `${passive.name}：${passive.description}`);
        slot.innerHTML = `
            <span>${passive.icon}</span>
            <div class="passive-tooltip">
                <h4>${passive.name}</h4>
                <p>${passive.description}</p>
                <p class="passive-type">${passive.type || '通用强化'}</p>
            </div>
        `;
        passiveBar.appendChild(slot);
    });
}

// 重置UI缓存
function resetUICache() {
    lastWeaponBarState = null;
    lastPassiveBarState = null;
    lastWeaponBar2State = null;
    lastPassiveBar2State = null;
    lastRelicBarState = null;
    lastRelicBar2State = null;
}

// 遗物栏更新（仅在变化时）
function updateRelicBarIfNeeded(barId, player) {
    if (!player || !player.relics) return;
    const currentState = player.relics.map(r => r.id).join(',');
    const isP2 = barId === 'relicBar2';
    const lastState = isP2 ? lastRelicBar2State : lastRelicBarState;

    if (currentState === lastState) return;

    if (isP2) {
        lastRelicBar2State = currentState;
    } else {
        lastRelicBarState = currentState;
    }

    const bar = document.getElementById(barId);
    if (!bar) return;

    bar.innerHTML = '';
    player.relics.forEach(relic => {
        const rarityColor = RARITY_COLORS[relic.rarity] || '#8b8b8b';
        const slot = document.createElement('div');
        slot.className = 'relic-slot';
        slot.tabIndex = 0;
        slot.setAttribute('aria-label', `${relic.name}：${relic.desc}`);
        slot.style.borderColor = rarityColor;
        slot.innerHTML = `<span class="relic-slot-icon">${relic.icon}</span>`;
        slot.title = `${relic.name}: ${relic.desc}`;
        bar.appendChild(slot);
    });
}

// P2武器栏更新（仅在变化时）
function updateWeaponBar2IfNeeded() {
    if (!game.player2) return;
    const currentState = game.player2.weapons.map(w => `${w.id}:${w.level}`).join(',');

    if (currentState === lastWeaponBar2State) {
        return;
    }

    lastWeaponBar2State = currentState;
    updateWeaponBar2();
}

// 更新P2武器栏
function updateWeaponBar2() {
    const weaponBar = document.getElementById('weaponBar2');
    if (!weaponBar || !game.player2) return;
    weaponBar.innerHTML = '';

    for (let i = 0; i < game.player2.maxWeapons; i++) {
        const weapon = game.player2.weapons[i];
        const slot = document.createElement(weapon ? 'button' : 'div');
        slot.className = 'weapon-slot';

        if (weapon) {
            slot.type = 'button';
            slot.setAttribute('aria-label', `查看 P2 武器 ${weapon.name}，等级 ${weapon.level || 1}`);
            if (weapon.type === 'evolved') {
                slot.classList.add('evolved');
            }
            slot.innerHTML = `
                <span class="weapon-icon">${weapon.icon}</span>
                ${weapon.level ? `<span class="weapon-level">${weapon.level}</span>` : ''}
            `;
            slot.addEventListener('click', () => showWeaponDetail(weapon));
        } else {
            slot.setAttribute('aria-hidden', 'true');
            slot.innerHTML = '<span class="weapon-empty">+</span>';
        }

        weaponBar.appendChild(slot);
    }
}

// P2被动栏更新（仅在变化时）
function updatePassiveBar2IfNeeded() {
    if (!game.player2) return;
    const passives = game.player2.passives || [];
    const currentState = passives.map(p => p.id).join(',');

    if (currentState === lastPassiveBar2State) {
        return;
    }

    lastPassiveBar2State = currentState;
    updatePassiveBar2();
}

// 更新P2被动栏
function updatePassiveBar2() {
    const passiveBar = document.getElementById('passiveBar2');
    if (!passiveBar || !game.player2) return;
    passiveBar.innerHTML = '';

    const passives = game.player2.passives || [];

    if (passives.length === 0) {
        passiveBar.innerHTML = '<span class="empty-state-text">暂无被动</span>';
        return;
    }

    passives.forEach(passive => {
        const slot = document.createElement('div');
        slot.className = 'passive-slot' + (passive.classOnly ? ' class-passive' : '');
        slot.tabIndex = 0;
        slot.setAttribute('aria-label', `${passive.name}：${passive.description}`);
        slot.innerHTML = `
            <span>${passive.icon}</span>
            <div class="passive-tooltip">
                <h4>${passive.name}</h4>
                <p>${passive.description}</p>
                <p class="passive-type">${passive.type || '通用强化'}</p>
            </div>
        `;
        passiveBar.appendChild(slot);
    });
}

// 显示武器详情弹窗（暂停游戏）
function showWeaponDetail(weapon) {
    weaponDetailPreviousState = game.state;
    if (weaponDetailPreviousState === 'playing') {
        game.state = 'paused';
    }

    const modal = document.getElementById('weaponDetailModal');
    document.getElementById('weaponDetailIcon').textContent = weapon.icon;
    document.getElementById('weaponDetailName').textContent = weapon.name;
    document.getElementById('weaponDetailLevel').textContent = `Lv.${weapon.level || 1}/${weapon.maxLevel || 5}`;
    document.getElementById('weaponDetailDesc').textContent = weapon.description;

    const actualDamage = weapon.damage * (weapon.level || 1);
    document.getElementById('weaponDetailDamage').textContent = actualDamage;

    const typeNames = { melee: '近战', ranged: '远程', magic: '魔法', accessory: '配件', evolved: '进化' };
    document.getElementById('weaponDetailType').textContent = typeNames[weapon.type] || weapon.type;

    const evolveInfo = document.getElementById('weaponEvolveInfo');
    if (weapon.evolvesWith && weapon.evolvesTo) {
        const partner = WEAPONS[weapon.evolvesWith];
        const evolved = WEAPONS[weapon.evolvesTo];
        evolveInfo.innerHTML = `
            <h4>🔄 进化信息</h4>
            <p>满级后与 <span>${partner.icon} ${partner.name}</span> 合成进化为:</p>
            <p class="evolved-weapon"><span>${evolved.icon} ${evolved.name}</span></p>
        `;
        evolveInfo.style.display = 'block';
    } else if (weapon.type === 'evolved') {
        evolveInfo.innerHTML = `<h4>✨ 已进化武器</h4><p>这是一把进化后的强力武器！</p>`;
        evolveInfo.style.display = 'block';
    } else {
        evolveInfo.innerHTML = '';
        evolveInfo.style.display = 'none';
    }

    modal.classList.remove('hidden');
}

// 关闭武器详情弹窗（恢复游戏）
function closeWeaponDetail() {
    document.getElementById('weaponDetailModal').classList.add('hidden');
    if (weaponDetailPreviousState === 'playing') {
        game.state = 'playing';
        game.lastTime = 0;
    } else if (weaponDetailPreviousState) {
        game.state = weaponDetailPreviousState;
    }
    weaponDetailPreviousState = null;
}

// 显示武器进化提示
function showEvolutionNotification(weapon1Name, weapon2Name, evolvedName, evolvedIcon) {
    const notification = document.createElement('div');
    notification.className = 'evolution-notification';
    notification.innerHTML = `
        <div class="evolution-icon">${evolvedIcon}</div>
        <div class="evolution-text">
            <h3>武器进化!</h3>
            <p>${weapon1Name} + ${weapon2Name}</p>
            <p class="evolved-name">= ${evolvedName}</p>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2500);
}

// 双人模式升级选择状态
let dualLevelUpState = {
    p1Selected: false,
    p2Selected: false,
    p1Choice: null,
    p2Choice: null
};

// 重置双人升级状态
function resetDualLevelUpState() {
    dualLevelUpState = {
        p1Selected: false,
        p2Selected: false,
        p1Choice: null,
        p2Choice: null
    };
}

// 显示升级选择界面
function showLevelUpScreen() {
    const levelUpScreen = document.getElementById('levelUpScreen');
    const singleLayout = document.getElementById('singlePlayerLevelUp');
    const dualLayout = document.getElementById('dualPlayerLevelUp');

    if (game.playerCount === 2) {
        // 双人模式
        singleLayout.classList.add('hidden');
        dualLayout.classList.remove('hidden');
        resetDualLevelUpState();
        showDualPlayerLevelUp();
    } else {
        // 单人模式
        singleLayout.classList.remove('hidden');
        dualLayout.classList.add('hidden');
        const buffOptions = document.getElementById('buffOptions');
        buffOptions.innerHTML = '';
        document.querySelector('.single-levelup h2').textContent = '🎉 升级!';

        // 40%武器，30%通用Buff，30%职业专属
        const rand = Math.random();

        if (rand < 0.4) {
            showWeaponOptionsForPlayer(buffOptions, game.player, 1);
        } else if (rand < 0.7) {
            showBuffOptionsForPlayer(buffOptions, game.player, 1);
        } else {
            showClassBuffOptionsForPlayer(buffOptions, game.player, 1);
        }
    }

    levelUpScreen.classList.remove('hidden');
}

// 双人升级界面
function showDualPlayerLevelUp() {
    const p1Container = document.getElementById('p1BuffOptions');
    const p2Container = document.getElementById('p2BuffOptions');
    const p1Selected = document.getElementById('p1Selected');
    const p2Selected = document.getElementById('p2Selected');

    p1Container.innerHTML = '';
    p2Container.innerHTML = '';
    p1Selected.classList.add('hidden');
    p2Selected.classList.add('hidden');

    // 为P1生成选项
    const rand1 = Math.random();
    if (rand1 < 0.4) {
        showWeaponOptionsForPlayer(p1Container, game.player, 1);
    } else if (rand1 < 0.7) {
        showBuffOptionsForPlayer(p1Container, game.player, 1);
    } else {
        showClassBuffOptionsForPlayer(p1Container, game.player, 1);
    }

    // 为P2生成选项
    const rand2 = Math.random();
    if (rand2 < 0.4) {
        showWeaponOptionsForPlayer(p2Container, game.player2, 2);
    } else if (rand2 < 0.7) {
        showBuffOptionsForPlayer(p2Container, game.player2, 2);
    } else {
        showClassBuffOptionsForPlayer(p2Container, game.player2, 2);
    }
}

// 检查双人是否都选完了
function checkDualLevelUpComplete() {
    if (dualLevelUpState.p1Selected && dualLevelUpState.p2Selected) {
        // 应用选择
        applyPlayerChoice(game.player, dualLevelUpState.p1Choice);
        applyPlayerChoice(game.player2, dualLevelUpState.p2Choice);

        document.getElementById('levelUpScreen').classList.add('hidden');
        game.state = 'playing';
    }
}

// 应用玩家选择
function applyPlayerChoice(player, choice) {
    if (!choice) return;

    if (choice.type === 'weapon') {
        if (choice.isUpgrade) {
            choice.weapon.level++;
            player.checkWeaponEvolution(choice.weapon);
        } else {
            player.addWeapon(choice.weapon.id);
        }
    } else if (choice.type === 'buff') {
        choice.buff.apply(player);
        if (!player.passives.find(p => p.id === choice.buff.id)) {
            player.passives.push({
                id: choice.buff.id,
                name: choice.buff.name,
                icon: choice.buff.icon,
                description: choice.buff.description,
                type: choice.buff.type || '通用强化',
                classOnly: choice.buff.classOnly
            });
        }
    }
}

// 玩家选择处理
function handlePlayerSelection(playerNum, choice) {
    if (playerNum === 1) {
        dualLevelUpState.p1Selected = true;
        dualLevelUpState.p1Choice = choice;
        document.getElementById('p1Selected').classList.remove('hidden');
    } else {
        dualLevelUpState.p2Selected = true;
        dualLevelUpState.p2Choice = choice;
        document.getElementById('p2Selected').classList.remove('hidden');
    }
    checkDualLevelUpComplete();
}

// 显示武器选项（详细版）- 支持指定玩家
function showWeaponOptionsForPlayer(container, player, playerNum) {
    const availableWeapons = Object.values(WEAPONS).filter(w =>
        w.type !== 'evolved' && w.type !== 'accessory'
    );
    const playerWeaponIds = player.weapons.map(w => w.id);
    const upgradeableWeapons = player.weapons.filter(w => w.level < w.maxLevel);
    const accessories = Object.values(WEAPONS).filter(w => w.type === 'accessory');

    let allOptions = [];

    // 添加可升级的武器
    upgradeableWeapons.forEach(w => {
        allOptions.push({ type: 'upgrade', weapon: w });
    });

    // 添加新武器
    availableWeapons.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
        allOptions.push({ type: 'new', weapon: w });
    });

    // 添加配件
    accessories.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
        allOptions.push({ type: 'new', weapon: w, isAccessory: true });
    });

    // 随机选择5个不重复的选项（双人模式选3个）
    const maxOptions = game.playerCount === 2 ? 3 : 5;
    const selectedOptions = [];
    for (let i = 0; i < maxOptions && allOptions.length > 0; i++) {
        const index = Math.floor(Math.random() * allOptions.length);
        selectedOptions.push(allOptions[index]);
        allOptions.splice(index, 1);
    }

    if (selectedOptions.length === 0) {
        showBuffOptionsForPlayer(container, player, playerNum);
        return;
    }

    selectedOptions.forEach(option => {
        const w = option.weapon;
        const card = document.createElement('button');
        card.className = 'buff-card weapon-card';

        let evolveInfo = '';
        if (w.evolvesWith && w.evolvesTo) {
            const partner = WEAPONS[w.evolvesWith];
            const evolved = WEAPONS[w.evolvesTo];
            evolveInfo = `<div class="evolve-hint">🔄 满级 + ${partner.icon}${partner.name} → ${evolved.icon}${evolved.name}</div>`;
        }

        const typeNames = { melee: '近战', ranged: '远程', magic: '魔法', accessory: '配件' };
        const levelInfo = option.type === 'upgrade'
            ? `Lv.${w.level} → Lv.${w.level + 1}`
            : 'Lv.1';

        const tagClass = option.isAccessory ? 'tag-accessory' : 'tag-weapon';
        const tagText = option.isAccessory ? '配件装备' : '武器';

        let statsHtml = '<div class="weapon-stats-detail">';
        if (option.isAccessory) {
            if (w.effect) statsHtml += `<span class="stat-item">✨ ${w.effect}</span>`;
        } else {
            const currentDamage = w.damage * (option.type === 'upgrade' ? w.level : 1);
            const nextDamage = w.damage * (option.type === 'upgrade' ? w.level + 1 : 1);

            if (option.type === 'upgrade') {
                statsHtml += `<span class="stat-item">⚔️ 伤害: ${currentDamage} → <span class="stat-up">${nextDamage}</span></span>`;
            } else {
                statsHtml += `<span class="stat-item">⚔️ 伤害: ${w.damage}</span>`;
            }
            if (w.attackSpeed) statsHtml += `<span class="stat-item">⚡ 攻速: ${w.attackSpeed}s</span>`;
            if (w.range) statsHtml += `<span class="stat-item">📏 范围: ${w.range}</span>`;
            if (w.projectileCount) statsHtml += `<span class="stat-item">🎯 投射物: ${w.projectileCount}</span>`;
            if (w.piercing) statsHtml += `<span class="stat-item">💫 穿透</span>`;
        }
        statsHtml += `<span class="stat-item">📊 最高Lv: ${w.maxLevel || 5}</span>`;
        statsHtml += '</div>';

        card.innerHTML = `
            <span class="option-type-tag ${tagClass}">${tagText}</span>
            <div class="buff-card-header">
                <span class="buff-icon">${w.icon}</span>
                <div>
                    <h3>${w.name}${option.type === 'upgrade' ? ' 升级' : ''}</h3>
                    <span class="buff-type">${typeNames[w.type] || w.type} | ${levelInfo}</span>
                </div>
            </div>
            <p class="buff-desc">${w.description}</p>
            ${statsHtml}
            ${evolveInfo}
        `;

        if (game.playerCount === 2) {
            card.onclick = () => handlePlayerSelection(playerNum, {
                type: 'weapon',
                weapon: option.weapon,
                isUpgrade: option.type === 'upgrade'
            });
        } else {
            card.onclick = () => selectWeaponForPlayer(option, player);
        }
        container.appendChild(card);
    });
}

// 显示Buff选项（详细版）- 支持指定玩家
function showBuffOptionsForPlayer(container, player, playerNum) {
    const availableBuffs = [...BUFFS];
    const selectedBuffs = [];
    const maxOptions = game.playerCount === 2 ? 3 : 5;

    for (let i = 0; i < maxOptions && availableBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableBuffs.length);
        selectedBuffs.push(availableBuffs[index]);
        availableBuffs.splice(index, 1);
    }

    selectedBuffs.forEach(buff => {
        const card = document.createElement('button');
        card.className = 'buff-card';
        card.innerHTML = `
            <span class="option-type-tag tag-buff">属性强化</span>
            <div class="buff-card-header">
                <span class="buff-icon">${buff.icon}</span>
                <div>
                    <h3>${buff.name}</h3>
                    <span class="buff-type">${buff.type || '通用'}</span>
                </div>
            </div>
            <p class="buff-desc">${buff.description}</p>
            <div class="buff-effect">${buff.detail || buff.description}</div>
        `;

        if (game.playerCount === 2) {
            card.onclick = () => handlePlayerSelection(playerNum, {
                type: 'buff',
                buff: buff
            });
        } else {
            card.onclick = () => selectBuffForPlayer(buff, player);
        }
        container.appendChild(card);
    });
}

// 显示职业专属强化选项 - 支持指定玩家
function showClassBuffOptionsForPlayer(container, player, playerNum) {
    const playerClass = player.className || game.selectedClass;
    const classBuffs = CLASS_BUFFS[playerClass] || [];

    if (classBuffs.length === 0) {
        showBuffOptionsForPlayer(container, player, playerNum);
        return;
    }

    const availableClassBuffs = [...classBuffs];
    const availableGeneralBuffs = [...BUFFS];
    const selectedOptions = [];
    const maxClassBuffs = game.playerCount === 2 ? 2 : 3;
    const maxGeneralBuffs = game.playerCount === 2 ? 1 : 2;

    // 选择职业专属buff
    for (let i = 0; i < maxClassBuffs && availableClassBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableClassBuffs.length);
        selectedOptions.push(availableClassBuffs[index]);
        availableClassBuffs.splice(index, 1);
    }

    // 添加通用Buff
    for (let i = 0; i < maxGeneralBuffs && availableGeneralBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableGeneralBuffs.length);
        selectedOptions.push(availableGeneralBuffs[index]);
        availableGeneralBuffs.splice(index, 1);
    }

    selectedOptions.forEach(buff => {
        const card = document.createElement('button');
        const isClassBuff = buff.classOnly;
        card.className = 'buff-card' + (isClassBuff ? ' class-buff' : '');
        card.innerHTML = `
            <span class="option-type-tag ${isClassBuff ? 'tag-class' : 'tag-buff'}">${isClassBuff ? '职业专属' : '属性强化'}</span>
            <div class="buff-card-header">
                <span class="buff-icon">${buff.icon}</span>
                <div>
                    <h3>${buff.name}</h3>
                    <span class="buff-type">${buff.type || '通用'}</span>
                </div>
            </div>
            <p class="buff-desc">${buff.description}</p>
            <div class="buff-effect">${buff.detail || buff.description}</div>
            ${isClassBuff ? '<p class="class-exclusive">★ 职业专属</p>' : ''}
        `;

        if (game.playerCount === 2) {
            card.onclick = () => handlePlayerSelection(playerNum, {
                type: 'buff',
                buff: buff
            });
        } else {
            card.onclick = () => selectBuffForPlayer(buff, player);
        }
        container.appendChild(card);
    });
}

// 单人模式 - 选择武器
function selectWeaponForPlayer(option, player) {
    if (option.type === 'upgrade') {
        option.weapon.level++;
        player.checkWeaponEvolution(option.weapon);
    } else {
        player.addWeapon(option.weapon.id);
    }
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
}

// 单人模式 - 选择buff
function selectBuffForPlayer(buff, player) {
    buff.apply(player);
    if (!player.passives.find(p => p.id === buff.id)) {
        player.passives.push({
            id: buff.id,
            name: buff.name,
            icon: buff.icon,
            description: buff.description,
            type: buff.type || '通用强化',
            classOnly: buff.classOnly
        });
    }
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
}

// 显示武器选项（详细版）- 旧版兼容
function showWeaponOptions(container) {
    showWeaponOptionsForPlayer(container, game.player, 1);
}

// 显示Buff选项（详细版）- 旧版兼容
function showBuffOptionsDetailed(container) {
    showBuffOptionsForPlayer(container, game.player, 1);
}

// 显示职业专属强化选项 - 旧版兼容
function showClassBuffOptions(container) {
    showClassBuffOptionsForPlayer(container, game.player, 1);
}

// 显示Buff选项（旧版兼容）
function showBuffOptions(container) {
    showBuffOptionsDetailed(container);
}

// 选择武器 - 旧版兼容
function selectWeapon(option) {
    selectWeaponForPlayer(option, game.player);
}

// 选择buff - 旧版兼容
function selectBuff(buff) {
    selectBuffForPlayer(buff, game.player);
}

// 显示波次提示
function showWaveNotification(waveNum) {
    const isBossWave = waveNum % CONFIG.wave.bossWaveInterval === 0;
    const notification = document.createElement('div');
    notification.className = 'wave-notification' + (isBossWave ? ' boss-wave' : '');
    notification.innerHTML = `
        <h2>${isBossWave ? 'BOSS 波次!' : '第 ' + waveNum + ' 波'}</h2>
        <p>${isBossWave ? '击败Boss!' : '消灭所有敌人!'}</p>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// 双人波次选择状态
let dualWaveState = {
    p1Selected: false,
    p2Selected: false,
    p1Choice: null,
    p2Choice: null
};

// 重置双人波次选择状态
function resetDualWaveState() {
    dualWaveState = {
        p1Selected: false,
        p2Selected: false,
        p1Choice: null,
        p2Choice: null
    };
}

// 显示波次完成奖励界面
function showWaveCompleteScreen() {
    const levelUpScreen = document.getElementById('levelUpScreen');
    const singleLayout = document.getElementById('singlePlayerLevelUp');
    const dualLayout = document.getElementById('dualPlayerLevelUp');

    if (game.playerCount === 2) {
        // 双人模式
        singleLayout.classList.add('hidden');
        dualLayout.classList.remove('hidden');
        resetDualWaveState();
        showDualWaveComplete();
    } else {
        // 单人模式
        singleLayout.classList.remove('hidden');
        dualLayout.classList.add('hidden');
        showSingleWaveComplete();
    }

    levelUpScreen.classList.remove('hidden');
}

// 单人波次完成界面
function showSingleWaveComplete() {
    const title = document.querySelector('.single-levelup h2');
    title.textContent = `🏆 第 ${game.wave.current} 波完成!`;

    const buffOptions = document.getElementById('buffOptions');
    buffOptions.innerHTML = '';

    showWaveOptionsForPlayer(buffOptions, game.player, 1, true);
}

// 双人波次完成界面
function showDualWaveComplete() {
    const p1Container = document.getElementById('p1BuffOptions');
    const p2Container = document.getElementById('p2BuffOptions');
    const p1Selected = document.getElementById('p1Selected');
    const p2Selected = document.getElementById('p2Selected');

    // 更新标题
    const p1Header = document.querySelector('.dual-levelup .p1-panel .player-levelup-header h3');
    const p2Header = document.querySelector('.dual-levelup .p2-panel .player-levelup-header h3');
    if (p1Header) p1Header.textContent = `第 ${game.wave.current} 波完成!`;
    if (p2Header) p2Header.textContent = `第 ${game.wave.current} 波完成!`;

    p1Container.innerHTML = '';
    p2Container.innerHTML = '';
    p1Selected.classList.add('hidden');
    p2Selected.classList.add('hidden');

    // 为P1生成选项
    showWaveOptionsForPlayer(p1Container, game.player, 1, true);

    // 为P2生成选项
    showWaveOptionsForPlayer(p2Container, game.player2, 2, true);
}

// 为玩家生成波次奖励选项
function showWaveOptionsForPlayer(container, player, playerNum, isWaveReward = false) {
    const availableWeapons = Object.values(WEAPONS).filter(w =>
        w.type !== 'evolved' && w.type !== 'accessory'
    );
    const playerWeaponIds = player.weapons.map(w => w.id);
    const upgradeableWeapons = player.weapons.filter(w => w.level < w.maxLevel);
    const accessories = Object.values(WEAPONS).filter(w => w.type === 'accessory');

    let allOptions = [];

    // 添加可升级的武器
    upgradeableWeapons.forEach(w => {
        allOptions.push({ type: 'weaponUpgrade', weapon: w });
    });

    // 添加新武器
    availableWeapons.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
        allOptions.push({ type: 'weaponNew', weapon: w });
    });

    // 添加配件
    accessories.filter(w => !playerWeaponIds.includes(w.id)).forEach(w => {
        allOptions.push({ type: 'accessory', weapon: w });
    });

    // 添加Buff
    BUFFS.forEach(buff => {
        allOptions.push({ type: 'buff', buff: buff });
    });

    // 随机选择选项
    const maxOptions = game.playerCount === 2 ? 3 : 5;
    const selectedOptions = [];
    for (let i = 0; i < maxOptions && allOptions.length > 0; i++) {
        const index = Math.floor(Math.random() * allOptions.length);
        selectedOptions.push(allOptions[index]);
        allOptions.splice(index, 1);
    }

    selectedOptions.forEach(option => {
        const card = document.createElement('button');
        card.className = 'buff-card';

        if (option.type === 'weaponUpgrade' || option.type === 'weaponNew') {
            const w = option.weapon;
            card.classList.add('weapon-card');

            let evolveInfo = '';
            if (w.evolvesWith && w.evolvesTo) {
                const partner = WEAPONS[w.evolvesWith];
                const evolved = WEAPONS[w.evolvesTo];
                evolveInfo = `<div class="evolve-hint">🔄 满级 + ${partner.icon}${partner.name} → ${evolved.icon}${evolved.name}</div>`;
            }

            const typeNames = { melee: '近战', ranged: '远程', magic: '魔法', accessory: '配件' };
            const levelInfo = option.type === 'weaponUpgrade'
                ? `Lv.${w.level} → Lv.${w.level + 1}`
                : 'Lv.1';

            let statsHtml = '<div class="weapon-stats-detail">';
            const currentDamage = w.damage * (option.type === 'weaponUpgrade' ? w.level : 1);
            const nextDamage = w.damage * (option.type === 'weaponUpgrade' ? w.level + 1 : 1);

            if (option.type === 'weaponUpgrade') {
                statsHtml += `<span class="stat-item">⚔️ 伤害: ${currentDamage} → <span class="stat-up">${nextDamage}</span></span>`;
            } else {
                statsHtml += `<span class="stat-item">⚔️ 伤害: ${w.damage}</span>`;
            }
            if (w.attackSpeed) statsHtml += `<span class="stat-item">⚡ 攻速: ${w.attackSpeed}s</span>`;
            statsHtml += `<span class="stat-item">📊 最高Lv: ${w.maxLevel || 5}</span>`;
            statsHtml += '</div>';

            card.innerHTML = `
                <span class="option-type-tag tag-weapon">武器</span>
                <div class="buff-card-header">
                    <span class="buff-icon">${w.icon}</span>
                    <div>
                        <h3>${w.name}${option.type === 'weaponUpgrade' ? ' 升级' : ''}</h3>
                        <span class="buff-type">${typeNames[w.type] || w.type} | ${levelInfo}</span>
                    </div>
                </div>
                <p class="buff-desc">${w.description}</p>
                ${statsHtml}
                ${evolveInfo}
            `;

            if (game.playerCount === 2) {
                card.onclick = () => handleWaveSelection(playerNum, {
                    type: 'weapon',
                    weapon: option.weapon,
                    isUpgrade: option.type === 'weaponUpgrade'
                });
            } else {
                card.onclick = () => selectWaveRewardForPlayer(option, player);
            }

        } else if (option.type === 'accessory') {
            const w = option.weapon;
            card.classList.add('weapon-card');

            let statsHtml = '<div class="weapon-stats-detail">';
            if (w.effect) statsHtml += `<span class="stat-item">✨ ${w.effect}</span>`;
            statsHtml += `<span class="stat-item">📊 最高Lv: ${w.maxLevel || 5}</span>`;
            statsHtml += '</div>';

            card.innerHTML = `
                <span class="option-type-tag tag-accessory">配件装备</span>
                <div class="buff-card-header">
                    <span class="buff-icon">${w.icon}</span>
                    <div>
                        <h3>${w.name}</h3>
                        <span class="buff-type">配件 | Lv.1</span>
                    </div>
                </div>
                <p class="buff-desc">${w.description}</p>
                ${statsHtml}
            `;

            if (game.playerCount === 2) {
                card.onclick = () => handleWaveSelection(playerNum, {
                    type: 'weapon',
                    weapon: w,
                    isUpgrade: false
                });
            } else {
                card.onclick = () => selectWaveRewardForPlayer(option, player);
            }

        } else if (option.type === 'buff') {
            const buff = option.buff;
            card.innerHTML = `
                <span class="option-type-tag tag-buff">属性强化</span>
                <div class="buff-card-header">
                    <span class="buff-icon">${buff.icon}</span>
                    <div>
                        <h3>${buff.name}</h3>
                        <span class="buff-type">${buff.type || '通用'}</span>
                    </div>
                </div>
                <p class="buff-desc">${buff.description}</p>
                <div class="buff-effect">${buff.detail || buff.description}</div>
            `;

            if (game.playerCount === 2) {
                card.onclick = () => handleWaveSelection(playerNum, {
                    type: 'buff',
                    buff: buff
                });
            } else {
                card.onclick = () => selectWaveRewardBuffForPlayer(buff, player);
            }
        }

        container.appendChild(card);
    });
}

// 双人波次选择处理
function handleWaveSelection(playerNum, choice) {
    if (playerNum === 1) {
        dualWaveState.p1Selected = true;
        dualWaveState.p1Choice = choice;
        document.getElementById('p1Selected').classList.remove('hidden');
    } else {
        dualWaveState.p2Selected = true;
        dualWaveState.p2Choice = choice;
        document.getElementById('p2Selected').classList.remove('hidden');
    }
    checkDualWaveComplete();
}

// 检查双人波次选择是否完成
function checkDualWaveComplete() {
    if (dualWaveState.p1Selected && dualWaveState.p2Selected) {
        // 应用选择
        applyPlayerChoice(game.player, dualWaveState.p1Choice);
        applyPlayerChoice(game.player2, dualWaveState.p2Choice);

        // 恢复标题
        const p1Header = document.querySelector('.dual-levelup .p1-panel .player-levelup-header h3');
        const p2Header = document.querySelector('.dual-levelup .p2-panel .player-levelup-header h3');
        if (p1Header) p1Header.textContent = '选择强化';
        if (p2Header) p2Header.textContent = '选择强化';

        document.getElementById('levelUpScreen').classList.add('hidden');
        game.state = 'playing';
        game.wave.current++;
        startNewWave();
    }
}

// 单人波次奖励选择
function selectWaveRewardForPlayer(option, player) {
    if (option.type === 'weaponUpgrade') {
        option.weapon.level++;
        player.checkWeaponEvolution(option.weapon);
    } else {
        player.addWeapon(option.weapon.id);
    }
    document.querySelector('.single-levelup h2').textContent = '🎉 升级!';
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
    game.wave.current++;
    startNewWave();
}

// 单人波次奖励Buff选择
function selectWaveRewardBuffForPlayer(buff, player) {
    buff.apply(player);
    if (!player.passives.find(p => p.id === buff.id)) {
        player.passives.push({
            id: buff.id,
            name: buff.name,
            icon: buff.icon,
            description: buff.description,
            type: buff.type || '通用强化',
            classOnly: buff.classOnly
        });
    }
    document.querySelector('.single-levelup h2').textContent = '🎉 升级!';
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
    game.wave.current++;
    startNewWave();
}

// 旧版兼容
function selectWaveRewardWeapon(option, screen) {
    selectWaveRewardForPlayer(option, game.player);
}

function selectWaveRewardBuff(buff, screen) {
    selectWaveRewardBuffForPlayer(buff, game.player);
}

// 显示倒计时
function showCountdown(callback) {
    const countdownScreen = document.getElementById('countdownScreen');
    const countdownNumber = document.getElementById('countdownNumber');
    countdownScreen.classList.remove('hidden');

    let count = 3;
    countdownNumber.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
            countdownNumber.style.animation = 'none';
            countdownNumber.offsetHeight;
            countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
        } else {
            clearInterval(countdownInterval);
            countdownScreen.classList.add('hidden');
            if (callback) callback();
        }
    }, 1000);
}

// 显示保存成功提示
function showSaveNotification() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = '💾 游戏已保存';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// 显示金币掉落通知
function showGoldNotification(worldX, worldY, amount) {
    // 将世界坐标转换为屏幕坐标
    const screenX = worldX - game.camera.x;
    const screenY = worldY - game.camera.y;

    // 获取画布位置
    const canvas = document.getElementById('gameCanvas');
    const canvasRect = canvas.getBoundingClientRect();

    const notification = document.createElement('div');
    notification.className = 'gold-notification';
    notification.textContent = `+${amount}`;
    notification.style.left = (canvasRect.left + screenX) + 'px';
    notification.style.top = (canvasRect.top + screenY - 20) + 'px';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 800);
}

// 显示掉落物拾取通知
function showDropPickupNotification(worldX, worldY, icon, name) {
    // 将世界坐标转换为屏幕坐标
    const screenX = worldX - game.camera.x;
    const screenY = worldY - game.camera.y;

    // 获取画布位置
    const canvas = document.getElementById('gameCanvas');
    const canvasRect = canvas.getBoundingClientRect();

    const notification = document.createElement('div');
    notification.className = 'drop-pickup-notification';
    notification.innerHTML = `<span class="drop-icon">${icon}</span><span class="drop-name">${name}</span>`;
    notification.style.left = (canvasRect.left + screenX) + 'px';
    notification.style.top = (canvasRect.top + screenY - 30) + 'px';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 1200);
}

// 商店系统
let shopState = {
    isOpen: false,
    items: []
};

// 生成商店物品（随机选择）
function generateShopItems() {
    const availableItems = [...SHOP_ITEMS];
    const selectedItems = [];
    const itemCount = Math.min(6, availableItems.length);

    for (let i = 0; i < itemCount; i++) {
        const index = Math.floor(Math.random() * availableItems.length);
        selectedItems.push(availableItems[index]);
        availableItems.splice(index, 1);
    }

    shopState.items = selectedItems;
    return selectedItems;
}

// 显示商店界面
function showShopScreen() {
    shopState.isOpen = true;
    generateShopItems();

    const shopScreen = document.getElementById('shopScreen');
    if (!shopScreen) {
        createShopScreen();
    }

    updateShopUI();
    document.getElementById('shopScreen').classList.remove('hidden');
}

// 创建商店界面DOM
function createShopScreen() {
    const shopScreen = document.createElement('div');
    shopScreen.id = 'shopScreen';
    shopScreen.className = 'screen shop-screen';
    shopScreen.setAttribute('role', 'dialog');
    shopScreen.setAttribute('aria-modal', 'true');
    shopScreen.setAttribute('aria-labelledby', 'shopTitle');
    shopScreen.innerHTML = `
        <div class="shop-content">
            <div class="shop-header">
                <h2 id="shopTitle">🏪 商店</h2>
                <div class="shop-gold">
                    <span class="gold-icon">🪙</span>
                    <span id="shopGoldDisplay">0</span>
                </div>
            </div>
            <div class="shop-items" id="shopItems"></div>
            <div class="shop-buttons">
                <button type="button" id="shopContinueBtn" class="shop-btn">继续下一波</button>
            </div>
        </div>
    `;
    document.body.appendChild(shopScreen);

    document.getElementById('shopContinueBtn').addEventListener('click', closeShopAndContinue);
}

// 更新商店UI
function updateShopUI() {
    const goldDisplay = document.getElementById('shopGoldDisplay');
    if (goldDisplay) {
        goldDisplay.textContent = game.player.gold;
    }

    const itemsContainer = document.getElementById('shopItems');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';

    shopState.items.forEach((item, index) => {
        const canAfford = game.player.gold >= item.price;
        const itemCard = document.createElement('button');
        itemCard.type = 'button';
        itemCard.disabled = !canAfford;
        itemCard.setAttribute('aria-label', `${item.name}，价格 ${item.price} 金币`);
        itemCard.className = 'shop-item' + (canAfford ? '' : ' disabled');
        itemCard.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
            </div>
            <div class="shop-item-price ${canAfford ? '' : 'unaffordable'}">
                <span class="price-icon">🪙</span>
                <span>${item.price}</span>
            </div>
        `;

        if (canAfford) {
            itemCard.addEventListener('click', () => purchaseItem(index));
        }

        itemsContainer.appendChild(itemCard);
    });
}

// 购买物品
function purchaseItem(index) {
    const item = shopState.items[index];
    if (!item || game.player.gold < item.price) return;

    // 扣除金币
    game.player.gold -= item.price;

    // 应用效果
    item.effect(game.player);

    // 双人模式下也给P2扣钱
    if (game.playerCount === 2 && game.player2) {
        game.player2.gold = game.player.gold;
    }

    // 显示购买成功提示
    showPurchaseNotification(item);

    // 从商店移除该物品
    shopState.items.splice(index, 1);

    // 更新商店UI
    updateShopUI();
}

// 显示购买成功提示
function showPurchaseNotification(item) {
    const notification = document.createElement('div');
    notification.className = 'purchase-notification';
    notification.innerHTML = `
        <span class="purchase-icon">${item.icon}</span>
        <span>购买成功!</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 1500);
}

// 关闭商店并继续游戏
function closeShopAndContinue() {
    shopState.isOpen = false;
    document.getElementById('shopScreen').classList.add('hidden');
    game.state = 'playing';
    game.wave.current++;
    startNewWave();
}

// ==================== 遗物选择系统 ====================

const RARITY_COLORS = {
    common: '#8b8b8b',
    rare: '#4a9eff',
    legendary: '#ffd700'
};

const RARITY_NAMES = {
    common: '普通',
    rare: '稀有',
    legendary: '传说'
};

// 显示遗物选择面板
function showRelicSelection(player, callback) {
    const options = getRandomRelicOptions(player, 3);
    if (options.length === 0) {
        // 没有可选遗物了，直接跳过
        if (callback) callback();
        return;
    }

    game.state = 'relicSelection';

    let relicScreen = document.getElementById('relicSelectionScreen');
    if (!relicScreen) {
        relicScreen = document.createElement('div');
        relicScreen.id = 'relicSelectionScreen';
        relicScreen.className = 'screen';
        relicScreen.setAttribute('role', 'dialog');
        relicScreen.setAttribute('aria-modal', 'true');
        relicScreen.setAttribute('aria-labelledby', 'relicSelectionTitle');
        document.body.appendChild(relicScreen);
    }

    const playerTag = player === game.player ? 'P1' : 'P2';

    let html = `
        <div class="relic-selection-content">
            <h2 id="relicSelectionTitle">🏆 Boss 掉落遗物！</h2>
            <p class="relic-subtitle">${playerTag} 选择一个遗物</p>
            <div class="relic-options">
    `;

    options.forEach(relic => {
        const rarityColor = RARITY_COLORS[relic.rarity] || '#8b8b8b';
        const rarityName = RARITY_NAMES[relic.rarity] || '普通';
        html += `
            <button type="button" class="relic-option" data-relic-id="${relic.id}" style="border-color: ${rarityColor}">
                <div class="relic-option-icon">${relic.icon}</div>
                <div class="relic-option-rarity" style="color: ${rarityColor}">${rarityName}</div>
                <div class="relic-option-name">${relic.name}</div>
                <div class="relic-option-desc">${relic.desc}</div>
            </button>
        `;
    });

    html += `
            </div>
            <button type="button" class="relic-skip-btn">跳过</button>
        </div>
    `;

    relicScreen.innerHTML = html;
    relicScreen.classList.remove('hidden');

    // 绑定点击事件
    relicScreen.querySelectorAll('.relic-option').forEach(el => {
        el.addEventListener('click', () => {
            const relicId = el.dataset.relicId;
            equipRelic(player, relicId);
            const relicDef = RELICS[relicId];
            showDamageNumber(player.x, player.y - 30, `${relicDef.icon} ${relicDef.name}`, RARITY_COLORS[relicDef.rarity] || '#fff', true);
            closeRelicSelection(callback);
        });
    });

    // 跳过按钮
    relicScreen.querySelector('.relic-skip-btn').addEventListener('click', () => {
        closeRelicSelection(callback);
    });
}

function closeRelicSelection(callback) {
    const relicScreen = document.getElementById('relicSelectionScreen');
    if (relicScreen) {
        relicScreen.classList.add('hidden');
    }
    if (callback) callback();
}

// Boss 波通关后的遗物选择流程（支持双人模式）
function startRelicSelectionFlow(callback) {
    if (game.playerCount === 1) {
        showRelicSelection(game.player, callback);
    } else {
        // 双人模式：P1先选，再P2选
        showRelicSelection(game.player, () => {
            if (game.player2 && game.player2.health > 0) {
                showRelicSelection(game.player2, callback);
            } else {
                if (callback) callback();
            }
        });
    }
}

// 更新侧面板技能信息
function updateSkillInfo(elementId, player) {
    const el = document.getElementById(elementId);
    if (!el || !player || !player.activeSkill) return;

    const skill = player.activeSkill;
    const cdRemaining = Math.max(0, player.skillCooldown);
    const isReady = cdRemaining <= 0;
    const isActive = player.skillActive;
    const keyLabel = player.controls.skill ? player.controls.skill[0].toUpperCase() : '?';

    let statusText = '';
    let statusClass = '';
    if (isActive) {
        statusText = '释放中';
        statusClass = 'skill-active';
    } else if (isReady) {
        statusText = '就绪';
        statusClass = 'skill-ready';
    } else {
        statusText = (cdRemaining / 1000).toFixed(1) + 's';
        statusClass = 'skill-cooldown';
    }

    el.innerHTML = `
        <div class="skill-slot ${statusClass}">
            <span class="skill-icon">${skill.icon}</span>
            <div class="skill-details">
                <div class="skill-name">${skill.name} <span class="skill-key">[${keyLabel}]</span></div>
                <div class="skill-status">${statusText}</div>
            </div>
        </div>
    `;
}
