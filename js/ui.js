// ==================== UI相关函数 ====================

// 上次武器栏状态的缓存
let lastWeaponBarState = '';

// 上次被动栏状态的缓存
let lastPassiveBarState = '';

// 更新UI
function updateUI() {
    document.getElementById('playerHealth').textContent = Math.max(0, Math.floor(game.player.health));
    document.getElementById('playerMaxHealth').textContent = game.player.maxHealth;
    document.getElementById('playerLevel').textContent = game.player.level;
    document.getElementById('playerExp').textContent = game.player.exp;
    document.getElementById('playerMaxExp').textContent = game.player.maxExp;
    document.getElementById('playerAttack').textContent = game.player.attack;
    document.getElementById('waveCount').textContent = game.wave.current;
    document.getElementById('killCount').textContent = game.killCount;
    document.getElementById('gameTime').textContent = Math.floor(game.gameTime);

    // 只在数据变化时更新武器栏和被动栏
    updateWeaponBarIfNeeded();
    updatePassiveBarIfNeeded();
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
        const slot = document.createElement('div');
        slot.className = 'weapon-slot';

        if (game.player.weapons[i]) {
            const weapon = game.player.weapons[i];
            if (weapon.type === 'evolved') {
                slot.classList.add('evolved');
            }
            slot.innerHTML = `
                <span class="weapon-icon">${weapon.icon}</span>
                ${weapon.level ? `<span class="weapon-level">${weapon.level}</span>` : ''}
            `;
            slot.addEventListener('click', () => showWeaponDetail(weapon));
        } else {
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
        passiveBar.innerHTML = '<span style="color: #666; font-size: 0.8em;">暂无被动</span>';
        return;
    }

    passives.forEach(passive => {
        const slot = document.createElement('div');
        slot.className = 'passive-slot' + (passive.classOnly ? ' class-passive' : '');
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
    lastWeaponBarState = '';
    lastPassiveBarState = '';
}

// 显示武器详情弹窗
function showWeaponDetail(weapon) {
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
        document.getElementById('evolvePartner').textContent = `${partner.icon} ${partner.name}`;
        document.getElementById('evolveResult').textContent = `${evolved.icon} ${evolved.name}`;
        evolveInfo.style.display = 'block';
    } else if (weapon.type === 'evolved') {
        evolveInfo.innerHTML = `<h4>✨ 已进化武器</h4><p>这是一把进化后的强力武器！</p>`;
        evolveInfo.style.display = 'block';
    } else {
        evolveInfo.style.display = 'none';
    }

    modal.classList.remove('hidden');
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

// 显示升级选择界面
function showLevelUpScreen() {
    const buffOptions = document.getElementById('buffOptions');
    buffOptions.innerHTML = '';
    document.querySelector('#levelUpScreen h2').textContent = '🎉 升级!';

    // 40%武器，30%通用Buff，30%职业专属
    const rand = Math.random();

    if (rand < 0.4) {
        showWeaponOptions(buffOptions);
    } else if (rand < 0.7) {
        showBuffOptionsDetailed(buffOptions);
    } else {
        showClassBuffOptions(buffOptions);
    }

    document.getElementById('levelUpScreen').classList.remove('hidden');
}

// 显示武器选项（详细版）
function showWeaponOptions(container) {
    const availableWeapons = Object.values(WEAPONS).filter(w =>
        w.type !== 'evolved' && w.type !== 'accessory'
    );
    const playerWeaponIds = game.player.weapons.map(w => w.id);
    const upgradeableWeapons = game.player.weapons.filter(w => w.level < w.maxLevel);
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

    // 随机选择5个不重复的选项
    const selectedOptions = [];
    for (let i = 0; i < 5 && allOptions.length > 0; i++) {
        const index = Math.floor(Math.random() * allOptions.length);
        selectedOptions.push(allOptions[index]);
        allOptions.splice(index, 1);
    }

    if (selectedOptions.length === 0) {
        showBuffOptionsDetailed(container);
        return;
    }

    selectedOptions.forEach(option => {
        const w = option.weapon;
        const card = document.createElement('div');
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
        card.onclick = () => selectWeapon(option);
        container.appendChild(card);
    });
}

// 显示Buff选项（详细版）
function showBuffOptionsDetailed(container) {
    const availableBuffs = [...BUFFS];
    const selectedBuffs = [];

    for (let i = 0; i < 5 && availableBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableBuffs.length);
        selectedBuffs.push(availableBuffs[index]);
        availableBuffs.splice(index, 1);
    }

    selectedBuffs.forEach(buff => {
        const card = document.createElement('div');
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
        card.onclick = () => selectBuff(buff);
        container.appendChild(card);
    });
}

// 显示职业专属强化选项
function showClassBuffOptions(container) {
    const playerClass = game.selectedClass;
    const classBuffs = CLASS_BUFFS[playerClass] || [];

    if (classBuffs.length === 0) {
        showBuffOptionsDetailed(container);
        return;
    }

    const availableClassBuffs = [...classBuffs];
    const availableGeneralBuffs = [...BUFFS];
    const selectedOptions = [];

    // 选择职业专属buff（最多3个）
    for (let i = 0; i < 3 && availableClassBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableClassBuffs.length);
        selectedOptions.push(availableClassBuffs[index]);
        availableClassBuffs.splice(index, 1);
    }

    // 添加2个通用Buff
    for (let i = 0; i < 2 && availableGeneralBuffs.length > 0; i++) {
        const index = Math.floor(Math.random() * availableGeneralBuffs.length);
        selectedOptions.push(availableGeneralBuffs[index]);
        availableGeneralBuffs.splice(index, 1);
    }

    selectedOptions.forEach(buff => {
        const card = document.createElement('div');
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
        card.onclick = () => selectBuff(buff);
        container.appendChild(card);
    });
}

// 显示Buff选项（旧版兼容）
function showBuffOptions(container) {
    showBuffOptionsDetailed(container);
}

// 选择武器
function selectWeapon(option) {
    if (option.type === 'upgrade') {
        option.weapon.level++;
        game.player.checkWeaponEvolution(option.weapon);
    } else {
        game.player.addWeapon(option.weapon.id);
    }
    document.getElementById('levelUpScreen').classList.add('hidden');
    game.state = 'playing';
}

// 选择buff
function selectBuff(buff) {
    buff.apply(game.player);
    // 添加到被动栏显示
    if (!game.player.passives.find(p => p.id === buff.id)) {
        game.player.passives.push({
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

// 显示波次完成奖励界面
function showWaveCompleteScreen() {
    const screen = document.getElementById('levelUpScreen');
    const title = document.querySelector('#levelUpScreen h2');
    title.textContent = `第 ${game.wave.current} 波完成!`;

    const buffOptions = document.getElementById('buffOptions');
    buffOptions.innerHTML = '';

    const options = [];
    const usedWeaponIds = new Set();
    const usedBuffIds = new Set();

    for (let i = 0; i < 5; i++) {
        if (Math.random() > 0.5) {
            const weapons = Object.values(WEAPONS).filter(w =>
                w.type !== 'evolved' && w.type !== 'accessory' && !usedWeaponIds.has(w.id)
            );
            if (weapons.length > 0) {
                const weapon = weapons[Math.floor(Math.random() * weapons.length)];
                usedWeaponIds.add(weapon.id);
                options.push({ type: 'weapon', data: weapon });
            } else {
                const availableBuffs = BUFFS.filter(b => !usedBuffIds.has(b.id));
                if (availableBuffs.length > 0) {
                    const buff = availableBuffs[Math.floor(Math.random() * availableBuffs.length)];
                    usedBuffIds.add(buff.id);
                    options.push({ type: 'buff', data: buff });
                }
            }
        } else {
            const availableBuffs = BUFFS.filter(b => !usedBuffIds.has(b.id));
            if (availableBuffs.length > 0) {
                const buff = availableBuffs[Math.floor(Math.random() * availableBuffs.length)];
                usedBuffIds.add(buff.id);
                options.push({ type: 'buff', data: buff });
            } else {
                const weapons = Object.values(WEAPONS).filter(w =>
                    w.type !== 'evolved' && w.type !== 'accessory' && !usedWeaponIds.has(w.id)
                );
                if (weapons.length > 0) {
                    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
                    usedWeaponIds.add(weapon.id);
                    options.push({ type: 'weapon', data: weapon });
                }
            }
        }
    }

    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'buff-card';

        if (option.type === 'weapon') {
            const weapon = option.data;
            const existingWeapon = game.player.weapons.find(w => w.id === weapon.id);
            const level = existingWeapon ? existingWeapon.level : 0;

            card.innerHTML = `
                <span class="option-type-tag tag-weapon">武器</span>
                <span class="buff-icon">${weapon.icon}</span>
                <h3>${weapon.name} ${level > 0 ? 'Lv.' + (level + 1) : ''}</h3>
                <p>${weapon.description}</p>
            `;
            card.onclick = () => {
                game.player.addWeapon(weapon.id);
                document.querySelector('#levelUpScreen h2').textContent = '🎉 升级!';
                screen.classList.add('hidden');
                game.state = 'playing';
                game.wave.current++;
                startNewWave();
            };
        } else {
            const buff = option.data;
            card.innerHTML = `
                <span class="option-type-tag tag-buff">属性强化</span>
                <span class="buff-icon">${buff.icon}</span>
                <h3>${buff.name}</h3>
                <p>${buff.description}</p>
            `;
            card.onclick = () => {
                buff.apply(game.player);
                document.querySelector('#levelUpScreen h2').textContent = '🎉 升级!';
                screen.classList.add('hidden');
                game.state = 'playing';
                game.wave.current++;
                startNewWave();
            };
        }

        buffOptions.appendChild(card);
    });

    screen.classList.remove('hidden');
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
