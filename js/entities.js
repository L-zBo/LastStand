// ==================== 游戏实体类 ====================

// ==================== 统一击杀处理 ====================
// 所有击杀逻辑（近战、远程、武器投射物、召唤物）统一走这里
function handleEnemyKill(enemy, killer) {
    SFX.play('kill');
    // 给击杀者加经验
    killer.gainExp(enemy.expValue);
    game.killCount++;

    // 生成掉落物
    const drops = spawnDrops(enemy.x, enemy.y, enemy.type);
    game.droppedItems.push(...drops);

    // 击杀粒子特效
    for (let i = 0; i < 6; i++) {
        game.particles.push(new Particle(enemy.x, enemy.y, enemy.color));
    }

    // 吸血效果
    if (killer.vampireHeal > 0) {
        killer.health = Math.min(killer.health + killer.vampireHeal, killer.maxHealth);
    }

    // 灵魂链接效果（召唤师）
    if (killer.soulLink) {
        killer.health = Math.min(killer.health + killer.soulLink, killer.maxHealth);
    }

    // 死灵法师尸爆效果
    if (killer.corpseExplosion) {
        const explosionRadius = 80;
        const explosionDamage = killer.attack * 0.5;
        const nearbyEnemies = getNearbyEnemies(enemy.x, enemy.y);
        for (let i = 0; i < nearbyEnemies.length; i++) {
            const nearbyEnemy = nearbyEnemies[i];
            if (nearbyEnemy !== enemy && nearbyEnemy.health > 0) {
                const dist = Math.hypot(nearbyEnemy.x - enemy.x, nearbyEnemy.y - enemy.y);
                if (dist < explosionRadius) {
                    nearbyEnemy.health -= explosionDamage;
                    game.particles.push(new Particle(nearbyEnemy.x, nearbyEnemy.y, '#4a0080'));
                }
            }
        }
        for (let i = 0; i < 8; i++) {
            game.particles.push(new Particle(enemy.x, enemy.y, '#9b59b6'));
        }
    }

    // 伤害飘字 - 显示击杀
    if (typeof showDamageNumber === 'function') {
        showDamageNumber(enemy.x, enemy.y, 'KILL', '#ff4757', true);
    }

    // 遗物 onKill 钩子
    if (killer.relics && killer.relics.length > 0) {
        killer.relics.forEach(relic => {
            if (relic.onKill) relic.onKill(killer, enemy);
        });
    }
}

// 粒子类（用于视觉效果）
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 0.8;
        this.decay = 0.04;
        this.size = Math.random() * 3 + 2;
        this.color = color;
    }

    update() {
        const dt = game.dtFactor || 1;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

// 掉落物类（金币、Buff、道具）
class DroppedItem {
    constructor(x, y, type, data) {
        this.x = x;
        this.y = y;
        this.type = type; // 'gold', 'buff', 'item'
        this.data = data;
        this.size = 12;
        this.spawnTime = Date.now();
        this.bobOffset = Math.random() * Math.PI * 2; // 浮动动画偏移
        this.collected = false;

        // 初始弹跳动画 - 金币直接静止，其他物品轻微散开
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 1;
        this.gravity = 0.1;
        this.friction = 0.9;
        this.settleTime = 0;

        // 根据类型设置外观
        if (type === 'gold') {
            this.color = '#ffd700';
            this.icon = '🪙';
            this.sprite = data.amount > 10 ? 'coinBag' : 'coin';
            this.value = data.amount;
            // 金币随机大小 (10-16)
            this.size = 10 + Math.floor(Math.random() * 7);
            // 金币直接出现在原地，不弹跳
            this.vx = 0;
            this.vy = 0;
            this.settled = true;
        } else if (type === 'buff') {
            this.color = '#9b59b6';
            this.icon = data.icon;
            this.sprite = data.sprite;
            this.effect = data.effect;
            this.name = data.name;
            this.description = data.description;
            this.size = 14;
            // Buff有轻微散开效果
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.settled = false;
        } else if (type === 'item') {
            this.color = '#2ecc71';
            this.icon = data.icon;
            this.sprite = data.sprite;
            this.effect = data.effect;
            this.name = data.name;
            this.description = data.description;
            this.size = 14;
            // 道具有轻微散开效果
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.settled = false;
        }
    }

    update() {
        if (this.collected) return;

        // 弹跳物理
        if (!this.settled) {
            const dt = game.dtFactor || 1;
            this.vx *= Math.pow(this.friction, dt);
            this.vy += this.gravity * dt;
            this.vy *= Math.pow(this.friction, dt);

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // 检查是否落地（速度很小时）
            if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.3) {
                this.settled = true;
                this.settleTime = Date.now();
            }

            // 边界限制
            this.x = Math.max(10, Math.min(CONFIG.world.width - 10, this.x));
            this.y = Math.max(10, Math.min(CONFIG.world.height - 10, this.y));
        }

        // 磁铁吸引效果（检查所有玩家）
        const players = [game.player];
        if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
            players.push(game.player2);
        }

        for (const player of players) {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);

            // 计算玩家的实际磁铁范围和拾取范围
            const playerMagnetRange = DROP_CONFIG.magnetRange * (player.magnetRangeBonus || 1);
            const playerPickupRange = DROP_CONFIG.pickupRange * (player.pickupRangeBonus || 1);

            // 在磁铁范围内被吸引
            if (dist < playerMagnetRange && dist > 0) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const speed = DROP_CONFIG.magnetSpeed * (1 - dist / playerMagnetRange);
                const dt = game.dtFactor || 1;
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            }

            // 拾取检测
            if (dist < playerPickupRange) {
                this.pickup(player);
                break;
            }
        }
    }

    pickup(player) {
        if (this.collected) return;
        this.collected = true;
        SFX.play('pickup');

        if (this.type === 'gold') {
            const actualGold = player.gainGold(this.value);
            showGoldNotification(this.x, this.y, actualGold);
        } else if (this.type === 'buff' || this.type === 'item') {
            this.effect(player);
            showDropPickupNotification(this.x, this.y, this.icon, this.name);
        }

        // 拾取粒子效果
        for (let i = 0; i < 5; i++) {
            game.particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    draw(ctx) {
        if (this.collected) return;

        // 浮动动画
        const bobY = this.settled ? Math.sin((Date.now() / 200) + this.bobOffset) * 3 : 0;
        const drawY = this.y + bobY;

        // 光晕效果
        const glowSize = this.size + 5 + Math.sin(Date.now() / 150) * 2;
        ctx.fillStyle = this.color + '40';
        ctx.beginPath();
        ctx.arc(this.x, drawY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // 尝试使用精灵图
        const spriteSize = this.size * 2;
        const spriteDrawn = drawItemSprite(
            ctx,
            this.sprite,
            this.x - spriteSize / 2,
            drawY - spriteSize / 2,
            spriteSize,
            spriteSize
        );

        // 如果没有精灵图，使用emoji
        if (!spriteDrawn) {
            ctx.font = `${this.size * 1.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.icon, this.x, drawY);
        }

        // 金币数量显示
        if (this.type === 'gold' && this.value > 5) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.textAlign = 'center';
            ctx.strokeText(this.value, this.x, drawY + this.size + 8);
            ctx.fillText(this.value, this.x, drawY + this.size + 8);
        }
    }

    isDead() {
        // 已被拾取或超时消失
        if (this.collected) return true;
        if (Date.now() - this.spawnTime > DROP_CONFIG.despawnTime) return true;
        return false;
    }
}

// 生成掉落物
function spawnDrops(x, y, enemyType) {
    const drops = [];
    const goldCountConfig = GOLD_COUNT[enemyType] || GOLD_COUNT.normal;

    // 生成掉落物

    // 计算掉落的金币数量（随机）
    const coinCount = Math.floor(Math.random() * (goldCountConfig.max - goldCountConfig.min + 1)) + goldCountConfig.min;

    // 生成多个金币，每个金币=1金
    for (let i = 0; i < coinCount; i++) {
        // 随机散落偏移（让金币散开）
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        drops.push(new DroppedItem(x + offsetX, y + offsetY, 'gold', { amount: 1 }));
    }

    // Buff掉落（低概率）
    if (Math.random() < DROP_CONFIG.buffDropChance) {
        const buff = DROPPABLE_BUFFS[Math.floor(Math.random() * DROPPABLE_BUFFS.length)];
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        drops.push(new DroppedItem(x + offsetX, y + offsetY, 'buff', buff));
    }

    // 道具掉落（很低概率）
    if (Math.random() < DROP_CONFIG.itemDropChance) {
        const item = DROPPABLE_ITEMS[Math.floor(Math.random() * DROPPABLE_ITEMS.length)];
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        drops.push(new DroppedItem(x + offsetX, y + offsetY, 'item', item));
    }

    // Boss必定掉落一个Buff
    if (enemyType === 'boss') {
        const buff = DROPPABLE_BUFFS[Math.floor(Math.random() * DROPPABLE_BUFFS.length)];
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        drops.push(new DroppedItem(x + offsetX, y + offsetY, 'buff', buff));
    }

    return drops;
}

// 障碍物类 - 使用完整图片素材，支持比例缩放
class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;

        // 使用配置中的大小范围
        const obstacleConfig = CONFIG.obstacles[type];
        if (type === 'rock') {
            const minSize = obstacleConfig?.minSize || 15;
            const maxSize = obstacleConfig?.maxSize || 45;
            this.size = minSize + Math.random() * (maxSize - minSize);
            this.blocking = true;
            // 随机选择石头图片变体（0-2）
            this.variant = Math.floor(Math.random() * 3);
            // 随机缩放因子（0.6 - 1.4）
            this.scale = 0.6 + Math.random() * 0.8;
        } else if (type === 'bush') {
            const minSize = obstacleConfig?.minSize || 20;
            const maxSize = obstacleConfig?.maxSize || 50;
            this.size = minSize + Math.random() * (maxSize - minSize);
            this.blocking = false;
            // 随机选择草丛图片变体（0-4，共5种新提取的灌木）
            this.variant = Math.floor(Math.random() * 5);
            // 随机缩放因子（新素材较大）
            this.scale = 0.8 + Math.random() * 0.6;
        } else if (type === 'tree') {
            // 树木类型 - 更大，阻挡移动
            const treeConfig = CONFIG.obstacles.tree;
            const minSize = treeConfig?.minSize || 40;
            const maxSize = treeConfig?.maxSize || 80;
            this.size = minSize + Math.random() * (maxSize - minSize);
            this.blocking = true;
            // 随机选择树木图片变体（0-39，共40种新提取的树）
            this.variant = Math.floor(Math.random() * 40);
            // 随机缩放因子（0.3 - 0.6，新素材较大需要缩小）
            this.scale = 0.3 + Math.random() * 0.3;
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.type === 'rock') {
            const rockImg = environmentImages.rocks[this.variant % environmentImages.rocks.length];
            if (rockImg && rockImg.complete) {
                ctx.imageSmoothingEnabled = false;
                // 石头原始图片较小(~24px)，需要较大缩放因子
                const imgWidth = rockImg.width * this.scale * 3;
                const imgHeight = rockImg.height * this.scale * 3;
                ctx.drawImage(rockImg, this.x - imgWidth / 2, this.y - imgHeight / 2, imgWidth, imgHeight);
            } else {
                this.drawRockFallback(ctx);
            }
        } else if (this.type === 'bush') {
            const bushImg = environmentImages.bushes[this.variant % environmentImages.bushes.length];
            if (bushImg && bushImg.complete) {
                ctx.imageSmoothingEnabled = false;
                // 根据原始图片比例和缩放因子计算显示大小
                const imgWidth = bushImg.width * this.scale * 1.8;
                const imgHeight = bushImg.height * this.scale * 1.8;
                ctx.drawImage(bushImg, this.x - imgWidth / 2, this.y - imgHeight / 2, imgWidth, imgHeight);
            } else {
                this.drawBushFallback(ctx);
            }
        } else if (this.type === 'tree') {
            const treeImg = environmentImages.trees[this.variant % environmentImages.trees.length];
            if (treeImg && treeImg.complete) {
                ctx.imageSmoothingEnabled = false;
                // 根据原始图片比例和缩放因子计算显示大小
                const imgWidth = treeImg.width * this.scale;
                const imgHeight = treeImg.height * this.scale;
                // 树木从底部中心对齐（让树根在碰撞点）
                ctx.drawImage(treeImg, this.x - imgWidth / 2, this.y - imgHeight + this.size / 2, imgWidth, imgHeight);
            } else {
                this.drawTreeFallback(ctx);
            }
        }

        ctx.restore();
    }

    // 备用绘制方法 - 当图片未加载时使用
    drawRockFallback(ctx) {
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.ellipse(this.x - this.size * 0.1, this.y - this.size * 0.1, this.size * 0.4, this.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBushFallback(ctx) {
        ctx.fillStyle = '#2d5a2d';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3d7a3d';
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.1, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTreeFallback(ctx) {
        // 树干
        ctx.fillStyle = '#5a3d2b';
        ctx.fillRect(this.x - this.size * 0.1, this.y - this.size * 0.3, this.size * 0.2, this.size * 0.5);
        // 树冠
        ctx.fillStyle = '#2d6b2d';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.size * 0.5, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(x, y, size) {
        const dist = Math.hypot(this.x - x, this.y - y);
        return dist < this.size + size;
    }
}

// ==================== 地图事件类 ====================
class MapEvent {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.activated = false;
        this.activatedTime = 0;
        this.fadeTimer = 0;
        this.dead = false;

        switch (type) {
            case 'chest':
                this.sprite = '📦';
                this.size = 20;
                this.interactRange = 40;
                this.color = '#f39c12';
                break;
            case 'altar':
                this.sprite = '⛩️';
                this.size = 25;
                this.interactRange = 50;
                this.color = '#9b59b6';
                // 随机祭坛效果
                const altarEffects = [
                    { name: '力量祭坛', buff: 'attack', value: 0.3, duration: 15000, desc: '攻击+30%' },
                    { name: '迅捷祭坛', buff: 'speed', value: 0.5, duration: 10000, desc: '速度+50%' },
                    { name: '坚韧祭坛', buff: 'defense', value: 0.3, duration: 12000, desc: '减伤+30%' },
                    { name: '再生祭坛', buff: 'regen', value: 5, duration: 20000, desc: '每秒回复5HP' }
                ];
                this.altarEffect = altarEffects[Math.floor(Math.random() * altarEffects.length)];
                break;
            case 'trap':
                this.sprite = '⚠️';
                this.size = 15;
                this.interactRange = 25;
                this.color = '#e74c3c';
                this.damage = 15 + Math.floor(Math.random() * 10);
                this.hidden = true; // 陷阱初始隐藏
                break;
        }
    }

    update() {
        if (this.dead) return;

        // 消散动画
        if (this.activated && this.type !== 'trap') {
            this.fadeTimer += 16.67;
            if (this.fadeTimer > 500) {
                this.dead = true;
                return;
            }
        }

        // 检测玩家碰撞
        [game.player, game.player2].forEach(player => {
            if (!player || player.health <= 0 || this.activated) return;
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist > this.interactRange) return;

            this.activate(player);
        });
    }

    activate(player) {
        this.activated = true;
        this.activatedTime = Date.now();

        switch (this.type) {
            case 'chest': {
                // 掉落金币和经验
                const goldAmount = 10 + Math.floor(Math.random() * 20);
                const expAmount = 15 + Math.floor(Math.random() * 25);
                player.gold = (player.gold || 0) + goldAmount;
                player.exp += expAmount;
                // 掉落特效
                for (let i = 0; i < 10; i++) {
                    const p = new Particle(this.x, this.y, '#f1c40f');
                    p.vx = (Math.random() - 0.5) * 4;
                    p.vy = (Math.random() - 0.5) * 4;
                    game.particles.push(p);
                }
                showDamageNumber(this.x, this.y - 20, '+' + goldAmount + '💰', '#f1c40f');
                showDamageNumber(this.x, this.y - 35, '+' + expAmount + 'XP', '#3498db');
                break;
            }
            case 'altar': {
                const effect = this.altarEffect;
                // 应用临时增益
                switch (effect.buff) {
                    case 'attack':
                        player._altarAttackBoost = player.attack * effect.value;
                        player.attack += player._altarAttackBoost;
                        addGameTimer(() => {
                            if (player._altarAttackBoost) {
                                player.attack -= player._altarAttackBoost;
                                player._altarAttackBoost = 0;
                                showDamageNumber(player.x, player.y - 20, '力量消散', '#aaa');
                            }
                        }, effect.duration);
                        break;
                    case 'speed':
                        player._altarSpeedBoost = player.speed * effect.value;
                        player.speed += player._altarSpeedBoost;
                        addGameTimer(() => {
                            if (player._altarSpeedBoost) {
                                player.speed -= player._altarSpeedBoost;
                                player._altarSpeedBoost = 0;
                                showDamageNumber(player.x, player.y - 20, '迅捷消散', '#aaa');
                            }
                        }, effect.duration);
                        break;
                    case 'defense':
                        player._altarDefense = effect.value;
                        player.damageReduction = (player.damageReduction || 0) + effect.value;
                        addGameTimer(() => {
                            if (player._altarDefense) {
                                player.damageReduction -= player._altarDefense;
                                player._altarDefense = 0;
                                showDamageNumber(player.x, player.y - 20, '坚韧消散', '#aaa');
                            }
                        }, effect.duration);
                        break;
                    case 'regen':
                        player._altarRegen = effect.value;
                        player.healthRegen = (player.healthRegen || 0) + effect.value;
                        addGameTimer(() => {
                            if (player._altarRegen) {
                                player.healthRegen -= player._altarRegen;
                                player._altarRegen = 0;
                                showDamageNumber(player.x, player.y - 20, '再生消散', '#aaa');
                            }
                        }, effect.duration);
                        break;
                }
                // 祭坛激活特效
                for (let i = 0; i < 15; i++) {
                    const angle = (Math.PI * 2 / 15) * i;
                    const p = new Particle(this.x, this.y, '#9b59b6');
                    p.vx = Math.cos(angle) * 3;
                    p.vy = Math.sin(angle) * 3;
                    game.particles.push(p);
                }
                showDamageNumber(this.x, this.y - 20, effect.name, '#9b59b6');
                showDamageNumber(this.x, this.y - 35, effect.desc, '#e8daef');
                break;
            }
            case 'trap': {
                // 对玩家造成伤害
                const actualDamage = this.damage * (1 - (player.damageReduction || 0));
                player.health -= actualDamage;
                // 陷阱特效
                for (let i = 0; i < 8; i++) {
                    game.particles.push(new Particle(player.x, player.y, '#e74c3c'));
                }
                showDamageNumber(player.x, player.y - 20, Math.floor(actualDamage), '#e74c3c');
                showDamageNumber(this.x, this.y - 15, '陷阱!', '#e74c3c');
                this.dead = true; // 陷阱触发后直接消失
                break;
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;

        // 陷阱隐藏时不画（除非被激活）
        if (this.type === 'trap' && this.hidden && !this.activated) {
            // 当玩家非常近时显示微弱提示
            const nearPlayer = [game.player, game.player2].some(p => {
                if (!p || p.health <= 0) return false;
                return Math.hypot(p.x - this.x, p.y - this.y) < 60;
            });
            if (nearPlayer) {
                ctx.globalAlpha = 0.2;
                ctx.font = `${this.size * 1.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.sprite, this.x, this.y);
                ctx.globalAlpha = 1;
            }
            return;
        }

        // 消散渐隐
        if (this.activated && this.fadeTimer > 0) {
            ctx.globalAlpha = 1 - (this.fadeTimer / 500);
        }

        // 绘制事件图标
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sprite, this.x, this.y);

        // 绘制光芒效果（宝箱和祭坛）
        if (!this.activated && (this.type === 'chest' || this.type === 'altar')) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }
}

// 投射物类（箭、魔法弹）
class Projectile {
    constructor(x, y, targetX, targetY, damage, type, color) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.type = type;
        this.color = color;
        this.speed = 8;
        this.size = 5;

        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.rotation = angle;

        this.distance = 0;
        this.maxDistance = 400;
    }

    update() {
        const dt = game.dtFactor || 1;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.distance += this.speed * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'arrow') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-8, -2, 16, 4);
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(4, -4);
            ctx.lineTo(4, 4);
            ctx.fill();
        } else if (this.type === 'magic') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'holy') {
            // 圣光投射物 - 金色光球带光芒
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            // 外圈光晕
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 3, 0, Math.PI * 2);
            ctx.stroke();
            // 十字光芒
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-this.size - 5, 0);
            ctx.lineTo(this.size + 5, 0);
            ctx.moveTo(0, -this.size - 5);
            ctx.lineTo(0, this.size + 5);
            ctx.stroke();
        } else if (this.type === 'dark') {
            // 暗影投射物 - 紫色暗影球
            ctx.fillStyle = '#4a0080';
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            // 内核
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // 暗影拖尾效果
            ctx.fillStyle = 'rgba(74, 0, 128, 0.3)';
            ctx.beginPath();
            ctx.arc(-4, 0, this.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    isDead() {
        return this.distance >= this.maxDistance;
    }
}

// 敌人投射物类（远程敌人发射的弹幕）
class EnemyProjectile {
    constructor(x, y, targetX, targetY, damage, color) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.color = color || '#e056fd';
        this.size = 5;
        this.speed = 4;
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.distance = 0;
        this.maxDistance = 300;
        this.hit = false;
    }

    update() {
        const dt = game.dtFactor || 1;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.distance += this.speed * dt;

        // 检测是否击中玩家
        [game.player, game.player2].forEach(p => {
            if (!p || p.health <= 0 || this.hit) return;
            const dist = Math.hypot(this.x - p.x, this.y - p.y);
            if (dist < p.size + this.size) {
                if (p.invincible) {
                    game.particles.push(new Particle(p.x, p.y, '#ffd700'));
                    this.hit = true;
                    return;
                }
                if (p.shieldActive) {
                    p.shieldActive = false;
                    this.hit = true;
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(p.x, p.y - 20, '护盾抵挡', '#3498db', true);
                    }
                    return;
                }
                let actualDamage = this.damage;
                if (p.damageReduction) {
                    actualDamage = Math.floor(this.damage * (1 - p.damageReduction));
                }
                p.health -= actualDamage;
                this.hit = true;
                if (typeof showDamageNumber === 'function') {
                    showDamageNumber(p.x, p.y - 20, actualDamage, '#e74c3c', false);
                }
                game.particles.push(new Particle(p.x, p.y, this.color));
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.distance >= this.maxDistance || this.hit;
    }
}

// 召唤物类
class Summon {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.size = 15;
        this.health = 50 + owner.level * 10;
        this.maxHealth = this.health;
        this.attack = owner.attack * 0.5;
        this.speed = 3;
        this.attackRange = 60;
        this.attackCooldown = 800;
        this.lastAttackTime = 0;
        this.color = '#9b59b6';
        this.sprite = '👻';
        this.lifeTime = 30000;
        this.spawnTime = Date.now();
    }

    update() {
        // 检查存活时间
        const durationBonus = this.owner.summonDurationBonus || 1;
        if (Date.now() - this.spawnTime > this.lifeTime * durationBonus) {
            this.health = 0;
            return;
        }

        // 找最近的敌人（使用空间网格加速）
        let target = null;
        let minDist = Infinity;
        const nearbyEnemies = getNearbyEnemies(this.x, this.y);
        for (let i = 0; i < nearbyEnemies.length; i++) {
            const enemy = nearbyEnemies[i];
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        }

        // 移动向敌人
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);
            const dt = game.dtFactor || 1;

            if (dist > this.attackRange) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            } else {
                // 攻击
                const now = Date.now();
                if (now - this.lastAttackTime >= this.attackCooldown) {
                    // 应用召唤物伤害加成
                    const damageBonus = this.owner.summonDamageBonus || 1;
                    target.health -= this.attack * damageBonus;
                    this.lastAttackTime = now;

                    // 粒子效果
                    for (let i = 0; i < 2; i++) {
                        game.particles.push(new Particle(target.x, target.y, this.color));
                    }

                    // 检查击杀
                    if (target.health <= 0) {
                        handleEnemyKill(target, this.owner);
                    }
                }
            }
        } else {
            // 没有敌人时跟随玩家
            const dx = this.owner.x - this.x;
            const dy = this.owner.y - this.y;
            const dist = Math.hypot(dx, dy);
            const dt = game.dtFactor || 1;

            if (dist > 100) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        }

        // 边界限制
        this.x = Math.max(this.size, Math.min(CONFIG.world.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.world.height - this.size, this.y));
    }

    draw(ctx) {
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sprite, this.x, this.y);

        // 绘制生命条
        const barWidth = 25;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth, barHeight);

        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth * healthPercent, barHeight);
    }

    isDead() {
        return this.health <= 0;
    }
}

// 武器投射物类
class WeaponProjectile {
    constructor(x, y, targetX, targetY, weapon, player) {
        this.x = x;
        this.y = y;
        this.weapon = weapon;
        this.player = player;
        this.damage = weapon.damage * (weapon.level || 1) + player.attack * 0.2;
        this.hit = false;
        this.hitEnemies = [];

        switch(weapon.id) {
            case 'sword':
            case 'holyBlade':
                this.type = 'slash';
                this.size = 60;
                this.duration = 200;
                this.startTime = Date.now();
                this.angle = Math.atan2(targetY - y, targetX - x);
                break;
            case 'dagger':
            case 'shadowBlade':
                this.type = 'stab';
                this.size = 40;
                this.duration = 150;
                this.startTime = Date.now();
                this.angle = Math.atan2(targetY - y, targetX - x);
                break;
            case 'axe':
            case 'bloodAxe':
                this.type = 'spin';
                this.size = 80;
                this.duration = 300;
                this.startTime = Date.now();
                this.rotation = 0;
                break;
            case 'bow':
            case 'phoenixBow':
                this.type = 'arrow';
                this.speed = 10;
                this.size = 8;
                const angle1 = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle1) * this.speed;
                this.vy = Math.sin(angle1) * this.speed;
                this.rotation = angle1;
                this.distance = 0;
                this.maxDistance = 500;
                this.tracking = weapon.id === 'phoenixBow';
                break;
            case 'staff':
            case 'arcaneStaff':
                this.type = 'magic';
                this.speed = 7;
                this.size = 12;
                const angle2 = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle2) * this.speed;
                this.vy = Math.sin(angle2) * this.speed;
                this.distance = 0;
                this.maxDistance = 400;
                this.bounce = weapon.id === 'arcaneStaff' ? 3 : 0;
                break;
            case 'fireball':
            case 'inferno':
                this.type = 'fireball';
                this.speed = 6;
                this.size = weapon.id === 'inferno' ? 25 : 15;
                const angle3 = Math.atan2(targetY - y, targetX - x);
                this.vx = Math.cos(angle3) * this.speed;
                this.vy = Math.sin(angle3) * this.speed;
                this.distance = 0;
                this.maxDistance = 350;
                this.aoe = weapon.id === 'inferno';
                break;
            default:
                this.type = 'slash';
                this.size = 50;
                this.duration = 200;
                this.startTime = Date.now();
                this.angle = Math.atan2(targetY - y, targetX - x);
        }
    }

    update() {
        const dt = game.dtFactor || 1;
        switch(this.type) {
            case 'spin':
                this.rotation += 0.3 * dt;
                break;
            case 'arrow':
                if (this.tracking && game.enemies.length > 0) {
                    const nearbyEnemies = getNearbyEnemies(this.x, this.y);
                    const nearest = nearbyEnemies.reduce((closest, enemy) => {
                        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                        return dist < closest.dist ? { enemy, dist } : closest;
                    }, { enemy: null, dist: Infinity });
                    if (nearest.enemy && nearest.dist < 300) {
                        const targetAngle = Math.atan2(nearest.enemy.y - this.y, nearest.enemy.x - this.x);
                        const angleDiff = targetAngle - this.rotation;
                        this.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.1 * dt);
                        this.vx = Math.cos(this.rotation) * this.speed;
                        this.vy = Math.sin(this.rotation) * this.speed;
                    }
                }
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.distance += this.speed * dt;
                break;
            case 'magic':
            case 'fireball':
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.distance += this.speed * dt;
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        const weaponId = this.weapon.id;

        switch(this.type) {
            case 'slash':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.angle);
                // 尝试绘制武器精灵
                const slashDrawn = drawWeaponSprite(ctx, weaponId, 20, -16, 32, 32);
                if (!slashDrawn) {
                    ctx.strokeStyle = weaponId === 'holyBlade' ? '#ffd700' : '#fff';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, -0.8, 0.8);
                    ctx.stroke();
                }
                break;
            case 'stab':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.angle);
                // 尝试绘制武器精灵
                const stabDrawn = drawWeaponSprite(ctx, weaponId, 15, -12, 24, 24);
                if (!stabDrawn) {
                    ctx.fillStyle = weaponId === 'shadowBlade' ? '#9b59b6' : '#c0c0c0';
                    ctx.fillRect(10, -3, this.size, 6);
                }
                break;
            case 'spin':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.rotation);
                // 尝试绘制武器精灵
                const spinDrawn = drawWeaponSprite(ctx, weaponId, -20, -20, 40, 40);
                if (!spinDrawn) {
                    ctx.strokeStyle = weaponId === 'bloodAxe' ? '#e74c3c' : '#c0c0c0';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(-this.size/2, 0);
                    ctx.lineTo(this.size/2, 0);
                    ctx.stroke();
                }
                break;
            case 'arrow':
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                // 尝试绘制武器精灵（弓箭）
                const arrowDrawn = drawWeaponSprite(ctx, weaponId, -12, -12, 24, 24);
                if (!arrowDrawn) {
                    ctx.fillStyle = weaponId === 'phoenixBow' ? '#ff6b35' : '#8B4513';
                    ctx.beginPath();
                    ctx.moveTo(12, 0);
                    ctx.lineTo(-8, -5);
                    ctx.lineTo(-8, 5);
                    ctx.fill();
                }
                break;
            case 'magic':
                // 尝试绘制法杖精灵
                const magicDrawn = drawWeaponSprite(ctx, weaponId, this.x - 16, this.y - 16, 32, 32);
                if (!magicDrawn) {
                    ctx.fillStyle = weaponId === 'arcaneStaff' ? '#9b59b6' : '#4ecdc4';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'fireball':
                // 火球使用特效而非武器精灵
                ctx.fillStyle = weaponId === 'inferno' ? '#ff4500' : '#ff6b35';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    isDead() {
        const now = Date.now();
        switch(this.type) {
            case 'slash':
            case 'stab':
            case 'spin':
                return now - this.startTime >= this.duration;
            case 'arrow':
            case 'magic':
            case 'fireball':
                return this.distance >= this.maxDistance || this.hit;
            default:
                return true;
        }
    }

    checkHit(enemy) {
        if (this.hitEnemies.includes(enemy)) return false;
        switch(this.type) {
            case 'slash':
            case 'spin':
                const distToPlayer = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
                if (distToPlayer < this.size + enemy.size) {
                    this.hitEnemies.push(enemy);
                    return true;
                }
                break;
            case 'stab':
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const dist = Math.hypot(dx, dy);
                const enemyAngle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(enemyAngle - this.angle);
                if (dist < this.size + 20 && angleDiff < 0.5) {
                    this.hitEnemies.push(enemy);
                    return true;
                }
                break;
            case 'arrow':
            case 'magic':
            case 'fireball':
                const projDist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (projDist < this.size + enemy.size) {
                    if (this.aoe) {
                        this.hitEnemies.push(enemy);
                        return true;
                    }
                    if (this.bounce > 0) {
                        this.bounce--;
                        this.hitEnemies.push(enemy);
                        const nextTarget = getNearbyEnemies(this.x, this.y).find(e => !this.hitEnemies.includes(e));
                        if (nextTarget) {
                            const newAngle = Math.atan2(nextTarget.y - this.y, nextTarget.x - this.x);
                            this.vx = Math.cos(newAngle) * this.speed;
                            this.vy = Math.sin(newAngle) * this.speed;
                            this.distance = 0;
                        }
                        return true;
                    }
                    this.hit = true;
                    return true;
                }
                break;
        }
        return false;
    }
}

// 玩家类
class Player {
    constructor(classType, playerIndex = 1) {
        const classConfig = CLASSES[classType];
        this.playerIndex = playerIndex; // 1 = P1, 2 = P2

        // 根据玩家编号设置初始位置
        if (playerIndex === 1) {
            this.x = CONFIG.world.width / 2 - 50;
            this.y = CONFIG.world.height / 2;
        } else {
            this.x = CONFIG.world.width / 2 + 50;
            this.y = CONFIG.world.height / 2;
        }

        this.size = CONFIG.player.size;
        this.health = classConfig.health;
        this.maxHealth = classConfig.health;
        this.attack = classConfig.attack;
        this.speed = classConfig.speed;
        this.color = classConfig.color;
        this.sprite = classConfig.sprite;
        this.classType = classType;
        this.attackType = classConfig.attackType;
        this.attackRange = classConfig.attackRange;
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;
        this.expMultiplier = 1;
        this.critChance = 0;
        this.critDamage = 2;
        this.vampireHeal = 0;
        this.multiShot = 1;
        this.lastAttackTime = 0;
        this.attackCooldown = 500;
        this.inBush = false;
        this.hidden = false;
        this.healthRegen = 0;
        this.lastRegenTime = Date.now();

        // 武器系统
        this.weapons = [];
        this.maxWeapons = 6;

        // 被动技能系统
        this.passives = [];

        // 金币系统
        this.gold = 0;
        this.goldMultiplier = 1;

        // 召唤系统（召唤师和死灵法师都可以召唤）
        this.maxSummons = classConfig.maxSummons || 0;
        this.lastSummonTime = 0;
        this.summonCooldown = 5000;

        // 从职业配置中加载被动效果
        if (classConfig.damageReduction) {
            this.damageReduction = classConfig.damageReduction;
        }
        if (classConfig.knockbackPower) {
            this.knockbackPower = classConfig.knockbackPower;
        }
        if (classConfig.critChance) {
            this.critChance = classConfig.critChance;
        }
        if (classConfig.arrowCount) {
            this.arrowCount = classConfig.arrowCount;
        }
        if (classConfig.attackSpeedBonus) {
            this.attackCooldown = this.attackCooldown * (1 - classConfig.attackSpeedBonus);
        }
        if (classConfig.soulLink) {
            this.soulLink = classConfig.soulLink;
        }
        if (classConfig.counterAttack) {
            this.counterAttack = classConfig.counterAttack;
        }
        if (classConfig.healPower) {
            this.healPower = classConfig.healPower;
        }
        if (classConfig.smite) {
            this.smite = classConfig.smite;
        }
        if (classConfig.lifeSteal) {
            this.lifeSteal = classConfig.lifeSteal;
        }
        if (classConfig.firstStrikeCrit) {
            this.firstStrikeCrit = classConfig.firstStrikeCrit;
        }
        if (classConfig.rangeBonus) {
            this.attackRange = this.attackRange * (1 + classConfig.rangeBonus);
        }
        if (classConfig.magicPenetration) {
            this.magicPenetration = classConfig.magicPenetration;
        }

        // 遗物系统
        this.relics = [];

        // 主动技能系统
        this.activeSkill = classConfig.activeSkill || null;
        this.skillCooldown = 0;
        this.skillActive = false;
        this.skillTimer = 0;
        this.skillData = {}; // 技能运行时数据（暴风雪tick、箭雨命中次数等）

        // 职业特殊属性初始化
        if (classType === 'knight') {
            // 骑士：护甲减伤
            this.armor = classConfig.armor || 15;
        } else if (classType === 'necromancer') {
            // 死灵法师：更短的召唤冷却
            this.summonCooldown = 4000;
        }

        // 设置控制键
        this.setupControls();
    }

    // 设置控制键
    setupControls() {
        if (game.playerCount === 1) {
            // 单人模式：两种控制方式都可用
            this.controls = {
                left: ['ArrowLeft', 'a', 'A'],
                right: ['ArrowRight', 'd', 'D'],
                up: ['ArrowUp', 'w', 'W'],
                down: ['ArrowDown', 's', 'S'],
                dash: [' '],
                skill: ['q', 'Q']
            };
        } else {
            // 双人模式
            if (this.playerIndex === 1) {
                // P1: WASD + 空格冲刺 + Q技能
                this.controls = {
                    left: ['a', 'A'],
                    right: ['d', 'D'],
                    up: ['w', 'W'],
                    down: ['s', 'S'],
                    dash: [' '],
                    skill: ['q', 'Q']
                };
            } else {
                // P2: 方向键 + Enter冲刺 + 右Shift技能
                this.controls = {
                    left: ['ArrowLeft'],
                    right: ['ArrowRight'],
                    up: ['ArrowUp'],
                    down: ['ArrowDown'],
                    dash: ['Enter'],
                    skill: ['Shift']
                };
            }
        }

        // 冲刺状态
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;
        this.dashSpeed = 12; // 冲刺速度
        this.dashMaxDuration = 150; // 冲刺持续150ms
        this.dashMaxCooldown = 3000; // 3秒冷却
    }

    // 检查按键是否按下
    isKeyPressed(keys) {
        return keys.some(key => game.keys[key]);
    }

    update(deltaTime) {
        const now = Date.now();
        const dt = game.dtFactor || 1;

        // ---- 冲刺冷却更新 ----
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }

        // ---- 冲刺触发 ----
        if (this.isKeyPressed(this.controls.dash) && !this.isDashing && this.dashCooldown <= 0) {
            let dx = 0, dy = 0;
            if (this.isKeyPressed(this.controls.left)) dx -= 1;
            if (this.isKeyPressed(this.controls.right)) dx += 1;
            if (this.isKeyPressed(this.controls.up)) dy -= 1;
            if (this.isKeyPressed(this.controls.down)) dy += 1;
            // 没有方向输入时向前方（朝上一次移动方向）冲刺
            if (dx === 0 && dy === 0) {
                dx = this.lastDirX || 0;
                dy = this.lastDirY || -1;
            }
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                this.dashDirX = dx / len;
                this.dashDirY = dy / len;
                this.isDashing = true;
                SFX.play('dash');
                this.dashDuration = this.dashMaxDuration;
                this.dashCooldown = this.dashMaxCooldown;
                this.invincible = true; // 冲刺期间无敌
                // 冲刺粒子
                for (let i = 0; i < 5; i++) {
                    game.particles.push(new Particle(this.x, this.y, '#7bed9f'));
                }
            }
        }

        // ---- 冲刺中的移动 ----
        if (this.isDashing) {
            this.dashDuration -= deltaTime;
            const dashX = this.x + this.dashDirX * this.dashSpeed * dt;
            const dashY = this.y + this.dashDirY * this.dashSpeed * dt;
            // 边界限制
            this.x = Math.max(this.size, Math.min(CONFIG.world.width - this.size, dashX));
            this.y = Math.max(this.size, Math.min(CONFIG.world.height - this.size, dashY));
            // 冲刺拖影
            if (Math.random() < 0.5) {
                game.particles.push(new Particle(this.x, this.y, '#70a1ff'));
            }
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                // 如果不是因为 divineShield 触发的无敌，解除无敌
                if (!this.divineShield || this.health > this.maxHealth * 0.3) {
                    this.invincible = false;
                }
            }
            // 冲刺期间跳过普通移动
        } else {
            // ---- 普通移动 ----
            let dx = 0, dy = 0;
            if (this.isKeyPressed(this.controls.left)) dx -= 1;
            if (this.isKeyPressed(this.controls.right)) dx += 1;
            if (this.isKeyPressed(this.controls.up)) dy -= 1;
            if (this.isKeyPressed(this.controls.down)) dy += 1;

            // 归一化对角线移动
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            // 记录移动方向（供冲刺使用）
            if (dx !== 0 || dy !== 0) {
                this.lastDirX = dx;
                this.lastDirY = dy;
            }

            // 计算新位置
            const newX = this.x + dx * this.speed * dt;
            const newY = this.y + dy * this.speed * dt;

            // 使用空间网格查询附近障碍物
            const nearbyObstacles = getNearbyObstacles(this.x, this.y);

            // 检查与石头的碰撞
            let canMove = true;
            for (const obstacle of nearbyObstacles) {
                if (obstacle.blocking && obstacle.collidesWith(newX, newY, this.size)) {
                    canMove = false;
                    break;
                }
            }

            if (canMove) {
                this.x = newX;
                this.y = newY;
            }

            // 边界限制（世界边界）
            this.x = Math.max(this.size, Math.min(CONFIG.world.width - this.size, this.x));
            this.y = Math.max(this.size, Math.min(CONFIG.world.height - this.size, this.y));
        }

        // 检查是否在草丛中（使用空间网格）
        this.inBush = false;
        const nearBushes = getNearbyObstacles(this.x, this.y);
        for (const obstacle of nearBushes) {
            if (obstacle.type === 'bush' && obstacle.collidesWith(this.x, this.y, this.size)) {
                this.inBush = true;
                break;
            }
        }

        // 更新隐身状态（在草丛中且没有攻击）
        if (this.inBush && !this.justAttacked) {
            this.hidden = true;
        } else {
            this.hidden = false;
        }

        // 生命恢复
        if (this.healthRegen > 0 && now - this.lastRegenTime >= 1000) {
            this.health = Math.min(this.health + this.healthRegen, this.maxHealth);
            this.lastRegenTime = now;
        }

        // 圣骑士圣光治愈 - 每5秒恢复百分比生命
        if (this.holyHeal && now - (this.lastHolyHealTime || 0) >= 5000) {
            const healAmount = Math.floor(this.maxHealth * this.holyHeal);
            this.health = Math.min(this.health + healAmount, this.maxHealth);
            this.lastHolyHealTime = now;
            // 治愈特效
            for (let i = 0; i < 3; i++) {
                game.particles.push(new Particle(this.x, this.y - 10, '#ffd700'));
            }
        }

        // 法师法力护盾 - 每10秒获得护盾
        if (this.manaShield && now - (this.lastShieldTime || 0) >= 10000) {
            this.shieldActive = true;
            this.lastShieldTime = now;
        }

        // 圣骑士神圣护盾 - 低血触发无敌
        if (this.divineShield && !this.divineShieldCooldown) {
            if (this.health > 0 && this.health <= this.maxHealth * 0.3) {
                this.invincible = true;
                this.divineShieldCooldown = true;
                // 3秒后解除无敌
                addGameTimer(() => {
                    this.invincible = false;
                }, 3000);
                // 60秒冷却
                addGameTimer(() => {
                    this.divineShieldCooldown = false;
                }, 60000);
                // 无敌特效
                for (let i = 0; i < 8; i++) {
                    game.particles.push(new Particle(this.x, this.y, '#ffd700'));
                }
            }
        }

        // 狂战士模式 - 低血增攻（动态计算，不永久修改基础值）
        if (this.berserkerMode) {
            const healthPercent = this.health / this.maxHealth;
            // 血量越低攻击越高，最低血时+50%
            this.berserkerBonus = (1 - healthPercent) * 0.5;
        }

        // 更新摄像机位置（只有P1或单人模式才更新摄像机）
        if (this.playerIndex === 1) {
            updateCamera();
        }

        // ---- 主动技能系统 ----
        // 技能冷却更新
        if (this.skillCooldown > 0) {
            this.skillCooldown -= deltaTime;
        }

        // 技能按键触发
        if (this.activeSkill && this.isKeyPressed(this.controls.skill) && this.skillCooldown <= 0 && !this.skillActive) {
            this.useActiveSkill();
        }

        // 持续技能效果更新
        if (this.skillActive) {
            this.updateActiveSkill(deltaTime);
        }

        // 自动攻击最近的敌人
        this.autoAttack();
    }

    // 使用主动技能
    useActiveSkill() {
        const skill = this.activeSkill;
        if (!skill) return;

        this.skillCooldown = skill.cooldown;
        SFX.play('skill');
        const now = Date.now();

        switch (skill.type) {
            case 'warcry': {
                // 战士：战吼 - 范围眩晕 + 自身攻击Buff
                this.skillActive = true;
                this.skillTimer = skill.buffDuration;
                this.skillData = { attackBoost: skill.attackBoost, originalAttack: this.attack };
                this.attack *= (1 + skill.attackBoost);
                // 范围内敌人眩晕
                getNearbyEnemies(this.x, this.y).forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist <= skill.radius) {
                        enemy.stunned = true;
                        enemy.stunEndTime = now + skill.stunDuration;
                    }
                });
                // 战吼特效：冲击波
                for (let i = 0; i < 20; i++) {
                    const angle = (Math.PI * 2 / 20) * i;
                    const p = new Particle(this.x, this.y, '#ff6b6b');
                    p.vx = Math.cos(angle) * 3;
                    p.vy = Math.sin(angle) * 3;
                    game.particles.push(p);
                }
                showDamageNumber(this.x, this.y - 30, '战吼!', '#ff6b6b');
                break;
            }
            case 'blizzard': {
                // 法师：暴风雪 - 持续范围伤害
                this.skillActive = true;
                this.skillTimer = skill.duration;
                this.skillData = { lastTick: now, tickInterval: skill.tickInterval, radius: skill.radius, damagePercent: skill.damagePercent };
                showDamageNumber(this.x, this.y - 30, '暴风雪!', '#4ecdc4');
                break;
            }
            case 'shadowstep': {
                // 刺客：影步 - 瞬移到最近敌人并暴击
                let closestEnemy = null;
                let closestDist = skill.blinkRange;
                getNearbyEnemies(this.x, this.y).forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = enemy;
                    }
                });
                if (closestEnemy) {
                    // 瞬移到敌人背后
                    const angle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
                    this.x = closestEnemy.x + Math.cos(angle) * 30;
                    this.y = closestEnemy.y + Math.sin(angle) * 30;
                    // 暴击伤害
                    const damage = Math.floor(this.attack * skill.damageMultiplier);
                    closestEnemy.health -= damage;
                    showDamageNumber(closestEnemy.x, closestEnemy.y - 20, damage, '#ff0', true);
                    // 遗物 onHit 钩子
                    if (this.relics && this.relics.length > 0) {
                        this.relics.forEach(relic => {
                            if (relic.onHit) relic.onHit(this, closestEnemy);
                        });
                    }
                    // 瞬移特效
                    for (let i = 0; i < 15; i++) {
                        game.particles.push(new Particle(closestEnemy.x, closestEnemy.y, '#95e1d3'));
                    }
                    showDamageNumber(this.x, this.y - 30, '影步!', '#95e1d3');
                } else {
                    // 没有敌人在范围内，退还一半冷却
                    this.skillCooldown = skill.cooldown * 0.5;
                    showDamageNumber(this.x, this.y - 30, '无目标', '#aaa');
                }
                break;
            }
            case 'arrowrain': {
                // 游侠：箭雨 - 在最近敌人位置降下箭雨
                let target = null;
                let minDist = skill.range;
                getNearbyEnemies(this.x, this.y).forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist < minDist) {
                        minDist = dist;
                        target = enemy;
                    }
                });
                if (target) {
                    this.skillActive = true;
                    this.skillTimer = skill.duration;
                    this.skillData = {
                        targetX: target.x, targetY: target.y,
                        hitCount: 0, maxHits: skill.hitCount,
                        hitInterval: skill.duration / skill.hitCount,
                        lastHit: now, radius: skill.radius,
                        damagePercent: skill.damagePercent
                    };
                    showDamageNumber(target.x, target.y - 30, '箭雨!', '#f38181');
                } else {
                    this.skillCooldown = skill.cooldown * 0.5;
                    showDamageNumber(this.x, this.y - 30, '无目标', '#aaa');
                }
                break;
            }
            case 'soulburst': {
                // 召唤师：灵魂爆破 - 引爆所有召唤物
                const mySummons = game.summons.filter(s => s.owner === this);
                if (mySummons.length > 0) {
                    mySummons.forEach(summon => {
                        // 范围伤害
                        getNearbyEnemies(summon.x, summon.y).forEach(enemy => {
                            const dist = Math.hypot(enemy.x - summon.x, enemy.y - summon.y);
                            if (dist <= skill.radius) {
                                const damage = Math.floor(this.attack * skill.damageMultiplier);
                                enemy.health -= damage;
                                showDamageNumber(enemy.x, enemy.y - 20, damage, '#9b59b6');
                            }
                        });
                        // 爆炸特效
                        for (let i = 0; i < 12; i++) {
                            const angle = (Math.PI * 2 / 12) * i;
                            const p = new Particle(summon.x, summon.y, '#9b59b6');
                            p.vx = Math.cos(angle) * 4;
                            p.vy = Math.sin(angle) * 4;
                            game.particles.push(p);
                        }
                        summon.health = 0; // 引爆
                    });
                    showDamageNumber(this.x, this.y - 30, '灵魂爆破!', '#9b59b6');
                } else {
                    this.skillCooldown = skill.cooldown * 0.5;
                    showDamageNumber(this.x, this.y - 30, '无召唤物', '#aaa');
                }
                break;
            }
            case 'fortress': {
                // 骑士：堡垒 - 无敌+嘲讽
                this.skillActive = true;
                this.skillTimer = skill.duration;
                this.invincible = true;
                this.skillData = { tauntRadius: skill.tauntRadius };
                showDamageNumber(this.x, this.y - 30, '堡垒!', '#c0c0c0');
                // 护盾特效
                for (let i = 0; i < 16; i++) {
                    const angle = (Math.PI * 2 / 16) * i;
                    const p = new Particle(
                        this.x + Math.cos(angle) * 40,
                        this.y + Math.sin(angle) * 40,
                        '#c0c0c0'
                    );
                    game.particles.push(p);
                }
                break;
            }
            case 'holywave': {
                // 圣骑士：圣光审判 - 范围伤害+回复
                getNearbyEnemies(this.x, this.y).forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist <= skill.radius) {
                        const damage = Math.floor(this.attack * skill.damageMultiplier);
                        enemy.health -= damage;
                        showDamageNumber(enemy.x, enemy.y - 20, damage, '#ffd700');
                        // 遗物 onHit
                        if (this.relics && this.relics.length > 0) {
                            this.relics.forEach(relic => {
                                if (relic.onHit) relic.onHit(this, enemy);
                            });
                        }
                    }
                });
                // 回复生命
                const healAmount = Math.floor(this.maxHealth * skill.healPercent);
                this.health = Math.min(this.health + healAmount, this.maxHealth);
                showDamageNumber(this.x, this.y - 20, '+' + healAmount, '#2ecc71');
                // 圣光波特效
                for (let i = 0; i < 24; i++) {
                    const angle = (Math.PI * 2 / 24) * i;
                    const p = new Particle(
                        this.x + Math.cos(angle) * skill.radius * 0.7,
                        this.y + Math.sin(angle) * skill.radius * 0.7,
                        '#ffd700'
                    );
                    p.vx = Math.cos(angle) * 2;
                    p.vy = Math.sin(angle) * 2;
                    game.particles.push(p);
                }
                showDamageNumber(this.x, this.y - 40, '圣光审判!', '#ffd700');
                break;
            }
            case 'undeadarmy': {
                // 死灵法师：亡灵大军 - 大量临时召唤
                this.skillActive = true;
                this.skillTimer = skill.duration;
                this.skillData = { tempSummons: [] };
                for (let i = 0; i < skill.summonCount; i++) {
                    const angle = (Math.PI * 2 / skill.summonCount) * i;
                    const dist = 60 + Math.random() * 40;
                    const sx = this.x + Math.cos(angle) * dist;
                    const sy = this.y + Math.sin(angle) * dist;
                    const summon = new Summon(sx, sy, this);
                    summon.sprite = '💀';
                    summon.color = '#6a0dad';
                    summon.attack = this.attack * 0.5;
                    summon.isTemp = true; // 标记为临时召唤物
                    game.summons.push(summon);
                    this.skillData.tempSummons.push(summon);
                    // 召唤特效
                    for (let j = 0; j < 3; j++) {
                        game.particles.push(new Particle(sx, sy, '#4a0080'));
                    }
                }
                showDamageNumber(this.x, this.y - 30, '亡灵大军!', '#4a0080');
                break;
            }
        }
    }

    // 更新持续技能效果
    updateActiveSkill(deltaTime) {
        const now = Date.now();
        this.skillTimer -= deltaTime;

        if (this.skillTimer <= 0) {
            // 技能结束
            this.endActiveSkill();
            return;
        }

        const skill = this.activeSkill;
        switch (skill.type) {
            case 'warcry': {
                // 战吼Buff期间特效
                if (Math.random() < 0.1) {
                    game.particles.push(new Particle(
                        this.x + (Math.random() - 0.5) * 30,
                        this.y + (Math.random() - 0.5) * 30,
                        '#ff6b6b'
                    ));
                }
                break;
            }
            case 'blizzard': {
                const data = this.skillData;
                // 每tick对范围内敌人造成伤害
                if (now - data.lastTick >= data.tickInterval) {
                    data.lastTick = now;
                    getNearbyEnemies(this.x, this.y).forEach(enemy => {
                        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                        if (dist <= data.radius) {
                            const damage = Math.floor(this.attack * data.damagePercent);
                            enemy.health -= damage;
                            showDamageNumber(enemy.x, enemy.y - 10, damage, '#87ceeb');
                            // 减速效果
                            enemy.slowed = true;
                            enemy.slowEndTime = now + 500;
                        }
                    });
                }
                // 暴风雪粒子
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * data.radius;
                    const p = new Particle(
                        this.x + Math.cos(angle) * dist,
                        this.y + Math.sin(angle) * dist,
                        '#87ceeb'
                    );
                    p.vy = 2;
                    game.particles.push(p);
                }
                break;
            }
            case 'arrowrain': {
                const data = this.skillData;
                if (data.hitCount < data.maxHits && now - data.lastHit >= data.hitInterval) {
                    data.hitCount++;
                    data.lastHit = now;
                    // 对目标区域内敌人造成伤害
                    getNearbyEnemies(data.targetX, data.targetY).forEach(enemy => {
                        const dist = Math.hypot(enemy.x - data.targetX, enemy.y - data.targetY);
                        if (dist <= data.radius) {
                            const damage = Math.floor(this.attack * data.damagePercent);
                            enemy.health -= damage;
                            showDamageNumber(enemy.x, enemy.y - 10, damage, '#f38181');
                        }
                    });
                    // 箭矢落地特效
                    for (let i = 0; i < 5; i++) {
                        const ox = data.targetX + (Math.random() - 0.5) * data.radius * 2;
                        const oy = data.targetY + (Math.random() - 0.5) * data.radius * 2;
                        game.particles.push(new Particle(ox, oy, '#f38181'));
                    }
                }
                break;
            }
            case 'fortress': {
                // 骑士堡垒：持续嘲讽附近敌人
                const data = this.skillData;
                getNearbyEnemies(this.x, this.y).forEach(enemy => {
                    const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (dist <= data.tauntRadius) {
                        enemy.tauntTarget = this;
                        enemy.tauntEndTime = now + 500;
                    }
                });
                // 护盾光环特效
                if (Math.random() < 0.2) {
                    const angle = Math.random() * Math.PI * 2;
                    game.particles.push(new Particle(
                        this.x + Math.cos(angle) * 35,
                        this.y + Math.sin(angle) * 35,
                        '#c0c0c0'
                    ));
                }
                break;
            }
            case 'undeadarmy': {
                // 亡灵大军：持续期间啥也不用做，到期清理
                break;
            }
        }
    }

    // 结束主动技能
    endActiveSkill() {
        const skill = this.activeSkill;
        this.skillActive = false;
        this.skillTimer = 0;

        switch (skill.type) {
            case 'warcry': {
                // 恢复原始攻击力
                this.attack = this.skillData.originalAttack;
                break;
            }
            case 'fortress': {
                // 解除无敌（如果不是被其他效果触发的无敌）
                if (!this.divineShield || this.health > this.maxHealth * 0.3) {
                    this.invincible = false;
                }
                break;
            }
            case 'undeadarmy': {
                // 清理临时召唤物
                if (this.skillData.tempSummons) {
                    this.skillData.tempSummons.forEach(s => {
                        s.health = 0;
                        // 消散特效
                        for (let i = 0; i < 5; i++) {
                            game.particles.push(new Particle(s.x, s.y, '#4a0080'));
                        }
                    });
                }
                break;
            }
        }

        this.skillData = {};
    }

    autoAttack() {
        const now = Date.now();

        // 召唤师和死灵法师的召唤逻辑
        if (this.attackType === 'summon' || this.attackType === 'dark') {
            // 自动召唤
            const currentSummons = game.summons.filter(s => s.owner === this).length;
            if (currentSummons < this.maxSummons && now - this.lastSummonTime >= this.summonCooldown) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 30;
                const summonX = this.x + Math.cos(angle) * dist;
                const summonY = this.y + Math.sin(angle) * dist;

                // 死灵法师召唤亡灵骷髅，召唤师召唤幽灵
                const summon = new Summon(summonX, summonY, this);
                if (this.attackType === 'dark') {
                    summon.sprite = '💀';
                    summon.color = '#4a0080';
                    summon.attack = this.attack * 0.7; // 死灵法师召唤物更强
                }
                game.summons.push(summon);
                this.lastSummonTime = now;

                // 召唤特效
                for (let i = 0; i < 5; i++) {
                    game.particles.push(new Particle(summonX, summonY, this.color));
                }
            }
        }

        // 召唤师直接攻击（发射魔法弹）
        if (this.attackType === 'summon') {
            if (now - this.lastAttackTime < this.attackCooldown) return;

            const enemiesInRange = game.enemies
                .map(enemy => ({
                    enemy,
                    distance: Math.hypot(enemy.x - this.x, enemy.y - this.y)
                }))
                .filter(e => e.distance <= this.attackRange)
                .sort((a, b) => a.distance - b.distance);

            if (enemiesInRange.length > 0) {
                const { enemy } = enemiesInRange[0];
                const damage = this.attack;

                game.projectiles.push(new Projectile(
                    this.x, this.y,
                    enemy.x, enemy.y,
                    damage,
                    'magic',
                    this.color
                ));

                this.lastAttackTime = now;
            }
            return;
        }

        if (now - this.lastAttackTime < this.attackCooldown) return;

        // 找到范围内最近的敌人
        const enemiesInRange = game.enemies
            .map(enemy => ({
                enemy,
                distance: Math.hypot(enemy.x - this.x, enemy.y - this.y)
            }))
            .filter(e => e.distance <= this.attackRange)
            .sort((a, b) => a.distance - b.distance);

        if (enemiesInRange.length > 0) {
            // 攻击多个敌人（如果有多重射击）
            const targetsToAttack = enemiesInRange.slice(0, this.multiShot);

            targetsToAttack.forEach(({enemy}) => {
                let damage = this.attack;
                let isCrit = false;

                // 狂战士模式加成
                if (this.berserkerBonus) {
                    damage *= (1 + this.berserkerBonus);
                }

                // 计算武器加成伤害
                this.weapons.forEach(weapon => {
                    damage += weapon.damage * weapon.level;
                });

                // 魔法伤害加成（法师专属）
                if (this.magicDamageBonus && (this.attackType === 'magic' || this.attackType === 'summon')) {
                    damage *= this.magicDamageBonus;
                }

                // 背刺效果（满血敌人双倍伤害）
                if (this.backstab && enemy.health >= enemy.maxHealth) {
                    damage *= 2;
                    isCrit = true; // 视为暴击显示
                }

                // 暴击判定（使用critDamage属性）
                if (!isCrit && Math.random() < this.critChance) {
                    damage *= this.critDamage;
                    isCrit = true;
                }

                // 猎人印记效果（被标记的敌人受到额外伤害）
                if (enemy.hunterMarked) {
                    damage *= 1.2;
                }

                // 应用猎人印记到敌人
                if (this.hunterMark && !enemy.hunterMarked) {
                    enemy.hunterMarked = true;
                }

                // 根据攻击类型处理
                if (this.attackType === 'melee') {
                    // 近战：直接造成伤害
                    // 应用诅咒加成
                    if (enemy.cursed && enemy.curseMultiplier) {
                        damage *= enemy.curseMultiplier;
                    }
                    enemy.health -= damage;

                    // 遗物 onHit 钩子
                    if (this.relics && this.relics.length > 0) {
                        this.relics.forEach(relic => {
                            if (relic.onHit) relic.onHit(this, enemy);
                        });
                    }

                    for (let i = 0; i < 3; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, isCrit ? '#ffff00' : this.color));
                    }

                    // 战士/骑士 击退效果
                    if (this.knockbackPower && !enemy.isBoss) {
                        const dx = enemy.x - this.x;
                        const dy = enemy.y - this.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 0) {
                            enemy.x += (dx / dist) * 30 * this.knockbackPower;
                            enemy.y += (dy / dist) * 30 * this.knockbackPower;
                        }
                    }

                    // 盾击概率击退（通用击退概率）
                    if (this.knockbackChance && !this.knockbackPower && Math.random() < this.knockbackChance && !enemy.isBoss) {
                        const dx = enemy.x - this.x;
                        const dy = enemy.y - this.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 0) {
                            enemy.x += (dx / dist) * 40;
                            enemy.y += (dy / dist) * 40;
                        }
                    }

                    // 毒素效果（刺客专属）
                    if (this.poisonDamage && !enemy.poisoned) {
                        enemy.poisoned = true;
                        enemy.poisonDamagePerTick = this.poisonDamage;
                        enemy.poisonEndTime = Date.now() + 3000;
                    }

                    // 伤害飘字
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(enemy.x, enemy.y, Math.floor(damage), isCrit ? '#ffff00' : '#ffffff', isCrit);
                    }
                } else if (this.attackType === 'ranged') {
                    // 远程：发射箭
                    const arrowCount = this.arrowCount || 1;
                    const spreadAngle = 0.15; // 箭矢扩散角度

                    for (let i = 0; i < arrowCount; i++) {
                        const baseAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                        const offset = (i - (arrowCount - 1) / 2) * spreadAngle;
                        const angle = baseAngle + offset;
                        const targetX = this.x + Math.cos(angle) * 300;
                        const targetY = this.y + Math.sin(angle) * 300;

                        game.projectiles.push(new Projectile(
                            this.x, this.y,
                            targetX, targetY,
                            damage / arrowCount * 1.2, // 多箭时单箭伤害略低但总伤害更高
                            'arrow',
                            this.color
                        ));
                    }
                } else if (this.attackType === 'magic') {
                    // 魔法：发射魔法弹
                    game.projectiles.push(new Projectile(
                        this.x, this.y,
                        enemy.x, enemy.y,
                        damage,
                        'magic',
                        this.color
                    ));

                    // 法术回响
                    if (this.spellEcho && Math.random() < this.spellEcho) {
                        addGameTimer(() => {
                            if (enemy.health > 0) {
                                game.projectiles.push(new Projectile(
                                    this.x, this.y,
                                    enemy.x, enemy.y,
                                    damage * 0.7,
                                    'magic',
                                    '#9b59b6'
                                ));
                            }
                        }, 200);
                    }
                } else if (this.attackType === 'holy') {
                    // 圣骑士：圣光攻击，治愈自己并伤害敌人
                    game.projectiles.push(new Projectile(
                        this.x, this.y,
                        enemy.x, enemy.y,
                        damage,
                        'holy',
                        '#ffd700'
                    ));

                    // 圣光治愈：攻击时恢复少量生命
                    if (this.healPower) {
                        this.health = Math.min(this.health + this.healPower, this.maxHealth);
                    }

                    // 对亡灵敌人额外伤害
                    if (this.smite && (enemy.type === 'elite' || enemy.sprite === '💀')) {
                        enemy.health -= damage * 0.5; // 额外50%伤害
                        for (let i = 0; i < 5; i++) {
                            game.particles.push(new Particle(enemy.x, enemy.y, '#ffffff'));
                        }
                    }
                } else if (this.attackType === 'dark') {
                    // 死灵法师：暗影攻击，吸取生命
                    game.projectiles.push(new Projectile(
                        this.x, this.y,
                        enemy.x, enemy.y,
                        damage,
                        'dark',
                        '#4a0080'
                    ));

                    // 生命汲取
                    if (this.lifeSteal) {
                        const healAmount = damage * this.lifeSteal;
                        this.health = Math.min(this.health + healAmount, this.maxHealth);
                    }

                    // 死亡诅咒效果（标记敌人受到更多伤害）
                    if (this.deathCoil && !enemy.cursed) {
                        enemy.cursed = true;
                        enemy.curseMultiplier = 1.25;
                    }
                }

                // 近战直接检查击杀
                if (this.attackType === 'melee' && enemy.health <= 0) {
                    handleEnemyKill(enemy, this);
                }
            });

            this.lastAttackTime = now;
            this.justAttacked = true;
            addGameTimer(() => this.justAttacked = false, 1000);
        }
    }

    gainExp(amount) {
        // 双人模式下经验共享：给自己加经验，同时也给队友加
        const expGained = Math.floor(amount * this.expMultiplier);
        this.exp += expGained;

        // 如果是双人模式，给另一个玩家也加经验
        if (game.playerCount === 2) {
            const otherPlayer = (this === game.player) ? game.player2 : game.player;
            if (otherPlayer && otherPlayer.health > 0 && otherPlayer !== this) {
                // 队友获得相同的基础经验（使用队友自己的经验倍率）
                otherPlayer.exp += Math.floor(amount * otherPlayer.expMultiplier);
                // 检查队友是否升级
                if (otherPlayer.exp >= otherPlayer.maxExp) {
                    otherPlayer.levelUp();
                }
            }
        }

        if (this.exp >= this.maxExp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        SFX.play('levelUp');
        this.exp -= this.maxExp;
        this.maxExp = Math.floor(this.maxExp * 1.2);

        // 显示升级选择界面
        game.state = 'levelup';
        showLevelUpScreen();
    }

    // 获得金币
    gainGold(amount) {
        const goldGained = Math.floor(amount * this.goldMultiplier);
        this.gold += goldGained;

        // 双人模式下金币共享
        if (game.playerCount === 2) {
            const otherPlayer = (this === game.player) ? game.player2 : game.player;
            if (otherPlayer && otherPlayer.health > 0 && otherPlayer !== this) {
                otherPlayer.gold += goldGained;
            }
        }

        return goldGained;
    }

    // 添加武器
    addWeapon(weaponId) {
        const existingWeapon = this.weapons.find(w => w.id === weaponId);
        if (existingWeapon) {
            if (existingWeapon.level < existingWeapon.maxLevel) {
                existingWeapon.level++;
                this.checkWeaponEvolution(existingWeapon);
            }
        } else if (this.weapons.length < this.maxWeapons) {
            const weaponData = WEAPONS[weaponId];
            this.weapons.push({
                ...weaponData,
                level: 1
            });
        }
    }

    // 检查武器进化
    checkWeaponEvolution(weapon) {
        if (weapon.level >= weapon.maxLevel && weapon.evolvesWith) {
            const partnerWeapon = this.weapons.find(w => w.id === weapon.evolvesWith && w.level >= w.maxLevel);
            if (partnerWeapon) {
                this.evolveWeapon(weapon, partnerWeapon);
            }
        }
    }

    // 武器进化
    evolveWeapon(weapon1, weapon2) {
        const evolvedWeaponId = weapon1.evolvesTo;
        const evolvedWeaponData = WEAPONS[evolvedWeaponId];

        // 移除原来的两个武器
        this.weapons = this.weapons.filter(w => w.id !== weapon1.id && w.id !== weapon2.id);

        // 添加进化后的武器
        this.weapons.push({
            ...evolvedWeaponData,
            level: 1
        });

        // 显示进化提示
        showEvolutionNotification(weapon1.name, weapon2.name, evolvedWeaponData.name, evolvedWeaponData.icon);
    }

    draw(ctx) {
        // 如果隐身，设置半透明
        if (this.hidden) {
            ctx.globalAlpha = 0.3;
        }

        // 尝试使用精灵图绘制
        const spriteSize = this.size * 2.5;
        const spriteDrawn = drawPlayerSprite(
            ctx,
            this.classType,
            this.x - spriteSize / 2,
            this.y - spriteSize / 2,
            spriteSize,
            spriteSize
        );

        // 如果精灵图不可用，使用默认emoji渲染
        if (!spriteDrawn) {
            ctx.font = `${this.size * 2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.sprite, this.x, this.y);
        }

        // 绘制生命条
        const barWidth = 50;
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 15, barWidth, barHeight);

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, this.y - this.size - 15, barWidth * healthPercent, barHeight);

        // 护盾指示器（法师魔法护盾）
        if (this.shieldActive) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // 无敌指示器（圣骑士神圣护盾）
        if (this.invincible) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 150) * 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 12, 0, Math.PI * 2);
            ctx.stroke();
            // 十字光芒
            const sz = this.size + 16;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - sz);
            ctx.lineTo(this.x, this.y + sz);
            ctx.moveTo(this.x - sz, this.y);
            ctx.lineTo(this.x + sz, this.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // 冲刺冷却指示器
        if (this.dashCooldown > 0) {
            const cdPercent = this.dashCooldown / this.dashMaxCooldown;
            ctx.fillStyle = 'rgba(100,100,100,0.5)';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 22, barWidth, 3);
            ctx.fillStyle = '#70a1ff';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 22, barWidth * (1 - cdPercent), 3);
        } else {
            // 冲刺就绪 - 小蓝点
            ctx.fillStyle = '#70a1ff';
            ctx.beginPath();
            ctx.arc(this.x + barWidth/2 + 5, this.y - this.size - 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 主动技能冷却指示器
        if (this.activeSkill) {
            const skillY = this.y - this.size - 28;
            if (this.skillCooldown > 0) {
                const cdPercent = this.skillCooldown / this.activeSkill.cooldown;
                ctx.fillStyle = 'rgba(100,100,100,0.5)';
                ctx.fillRect(this.x - barWidth/2, skillY, barWidth, 3);
                ctx.fillStyle = '#ff6348';
                ctx.fillRect(this.x - barWidth/2, skillY, barWidth * (1 - cdPercent), 3);
            } else {
                // 技能就绪 - 小红点+图标
                ctx.fillStyle = '#ff6348';
                ctx.beginPath();
                ctx.arc(this.x - barWidth/2 - 5, this.y - this.size - 18, 3, 0, Math.PI * 2);
                ctx.fill();
                // 绘制技能图标提示
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.activeSkill.icon, this.x - barWidth/2 - 5, this.y - this.size - 30);
            }
            // 技能激活中光环
            if (this.skillActive) {
                ctx.strokeStyle = this.color || '#ff6348';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size + 20, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }

        // 恢复透明度
        ctx.globalAlpha = 1;
    }
}

// 敌人类
class Enemy {
    static nextId = 0;  // 用于生成唯一ID

    constructor(x, y, type = 'normal') {
        this.id = Enemy.nextId++;  // 分配唯一ID，用于选择精灵
        this.x = x;
        this.y = y;
        this.size = CONFIG.enemy.size;
        this.type = type;
        this.isElite = false;
        this.isBoss = false;

        // 波数增强系数（每波增加5%属性）
        const waveMultiplier = 1 + (game.wave.current - 1) * 0.05;

        // 根据类型设置属性
        if (type === 'normal') {
            this.health = Math.floor(30 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(1.5 + (game.wave.current - 1) * 0.02, 3);
            this.damage = Math.floor(10 * waveMultiplier);
            this.expValue = Math.floor(20 * waveMultiplier);
            this.color = '#ff4757';
            this.sprite = '👾';
        } else if (type === 'fast') {
            this.health = Math.floor(20 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(3 + (game.wave.current - 1) * 0.03, 5);
            this.damage = Math.floor(8 * waveMultiplier);
            this.expValue = Math.floor(15 * waveMultiplier);
            this.color = '#ffa502';
            this.sprite = '⚡';
        } else if (type === 'tank') {
            this.health = Math.floor(60 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(1 + (game.wave.current - 1) * 0.01, 2);
            this.damage = Math.floor(15 * waveMultiplier);
            this.expValue = Math.floor(30 * waveMultiplier);
            this.color = '#2ed573';
            this.sprite = '💀';
        } else if (type === 'elite') {
            this.health = Math.floor(100 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(2 + (game.wave.current - 1) * 0.02, 3.5);
            this.damage = Math.floor(20 * waveMultiplier);
            this.expValue = Math.floor(50 * waveMultiplier);
            this.color = '#ff6348';
            this.sprite = '👹';
            this.isElite = true;
            this.size = CONFIG.enemy.size * 1.5;
        } else if (type === 'boss') {
            const bossLevel = Math.floor(game.wave.current / 10);
            this.health = Math.floor((500 + bossLevel * 200) * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = 1.2;
            this.damage = 30 + bossLevel * 10;
            this.expValue = 200 + bossLevel * 50;
            this.color = '#9b59b6';
            this.sprite = '👿';
            this.isBoss = true;
            this.isElite = true;
            this.size = CONFIG.enemy.size * 2.5;
            // 根据波数获取Boss类型
            this.bossType = getBossTypeByWave(game.wave.current);
            // Boss技能系统
            this.lastSkillTime = Date.now();
            this.skillCooldown = 5000; // 5秒技能冷却
            this.isCharging = false;
            this.chargeTarget = null;
        } else if (type === 'ranged') {
            // 远程射手敌人
            this.health = Math.floor(25 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(1.2 + (game.wave.current - 1) * 0.015, 2.5);
            this.damage = Math.floor(12 * waveMultiplier);
            this.expValue = Math.floor(25 * waveMultiplier);
            this.color = '#e056fd';
            this.sprite = '🏹';
            this.shootRange = 200; // 射击范围
            this.lastShootTime = 0;
            this.shootCooldown = 2000; // 2秒射击间隔
        } else if (type === 'splitter') {
            // 分裂怪
            this.health = Math.floor(40 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(1.3 + (game.wave.current - 1) * 0.015, 2.5);
            this.damage = Math.floor(8 * waveMultiplier);
            this.expValue = Math.floor(20 * waveMultiplier);
            this.color = '#7bed9f';
            this.sprite = '🫧';
            this.splitCount = 2; // 分裂成2个小怪
        } else if (type === 'splitter_child') {
            // 分裂子体（不再分裂）
            this.health = Math.floor(15 * waveMultiplier);
            this.maxHealth = this.health;
            this.speed = Math.min(2 + (game.wave.current - 1) * 0.02, 3.5);
            this.damage = Math.floor(5 * waveMultiplier);
            this.expValue = Math.floor(10 * waveMultiplier);
            this.color = '#7bed9f';
            this.sprite = '🫧';
            this.size = CONFIG.enemy.size * 0.7;
        }
    }

    update() {
        // 毒素伤害tick
        if (this.poisoned && this.poisonEndTime) {
            const now = Date.now();
            if (now < this.poisonEndTime) {
                // 每500ms一次毒伤
                if (!this.lastPoisonTick || now - this.lastPoisonTick >= 500) {
                    this.health -= this.poisonDamagePerTick || 0;
                    this.lastPoisonTick = now;
                    // 毒伤粒子（绿色）
                    game.particles.push(new Particle(this.x, this.y - 5, '#2ecc71'));
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(this.x, this.y - 15, Math.floor(this.poisonDamagePerTick || 0), '#2ecc71', false);
                    }
                }
            } else {
                // 毒素过期
                this.poisoned = false;
                this.poisonDamagePerTick = 0;
                this.poisonEndTime = 0;
                this.lastPoisonTick = 0;
            }
            // 毒伤致死
            if (this.health <= 0 && !this._poisonKilled) {
                this._poisonKilled = true;
                // 找到最近的玩家作为击杀者
                let killer = game.player;
                if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
                    const d1 = Math.hypot(this.x - game.player.x, this.y - game.player.y);
                    const d2 = Math.hypot(this.x - game.player2.x, this.y - game.player2.y);
                    if (game.player.health <= 0 || d2 < d1) killer = game.player2;
                }
                handleEnemyKill(this, killer);
                return;
            }
        }

        // 找到最近的存活玩家追踪
        let targetPlayer = game.player;
        let minDist = Math.hypot(game.player.x - this.x, game.player.y - this.y);

        if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
            const distToP2 = Math.hypot(game.player2.x - this.x, game.player2.y - this.y);
            // 如果P1已死亡或P2更近，追踪P2
            if (game.player.health <= 0 || distToP2 < minDist) {
                targetPlayer = game.player2;
                minDist = distToP2;
            }
        }

        // 如果目标玩家已死亡，尝试找另一个
        if (targetPlayer.health <= 0) {
            if (targetPlayer === game.player && game.player2 && game.player2.health > 0) {
                targetPlayer = game.player2;
            } else if (targetPlayer === game.player2 && game.player.health > 0) {
                targetPlayer = game.player;
            }
        }

        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const distance = Math.hypot(dx, dy);

        // ---- 眩晕状态检查 ----
        const now_cc = Date.now();
        if (this.stunned) {
            if (now_cc >= this.stunEndTime) {
                this.stunned = false;
            } else {
                // 被眩晕，跳过移动和攻击
                // 眩晕特效
                if (Math.random() < 0.05) {
                    game.particles.push(new Particle(this.x, this.y - this.size - 5, '#ffff00'));
                }
                return;
            }
        }

        // ---- 嘲讽目标覆盖 ----
        if (this.tauntTarget && now_cc < this.tauntEndTime) {
            const tauntDx = this.tauntTarget.x - this.x;
            const tauntDy = this.tauntTarget.y - this.y;
            const tauntDist = Math.hypot(tauntDx, tauntDy);
            if (tauntDist > 0) {
                const dt = game.dtFactor || 1;
                const spd = this.slowed && now_cc < this.slowEndTime ? this.speed * 0.5 : this.speed;
                this.x += (tauntDx / tauntDist) * spd * dt;
                this.y += (tauntDy / tauntDist) * spd * dt;
            }
            return; // 被嘲讽时只朝嘲讽目标移动
        }

        // ---- 减速状态 ----
        let effectiveSpeed = this.speed;
        if (this.slowed && now_cc < this.slowEndTime) {
            effectiveSpeed = this.speed * 0.5;
        } else {
            this.slowed = false;
        }

        // 精英怪和Boss可以看到草丛中的玩家，普通怪看不到
        const canSeePlayer = this.isElite || this.isBoss || !targetPlayer.hidden;

        if (distance > 0 && canSeePlayer) {
            const dt = game.dtFactor || 1;

            // 远程敌人：保持距离
            if (this.type === 'ranged' && distance < this.shootRange * 0.7) {
                // 离得太近了，往后退
                this.x -= (dx / distance) * effectiveSpeed * dt * 0.5;
                this.y -= (dy / distance) * effectiveSpeed * dt * 0.5;
            } else if (this.type === 'ranged' && distance <= this.shootRange) {
                // 在射程内，横向移动躲避
                const perpX = -dy / distance;
                const perpY = dx / distance;
                const sideDir = Math.sin(Date.now() * 0.003 + this.id) > 0 ? 1 : -1;
                this.x += perpX * effectiveSpeed * dt * 0.5 * sideDir;
                this.y += perpY * effectiveSpeed * dt * 0.5 * sideDir;
            } else if (this.isCharging) {
                // Boss冲锋：高速直线冲向目标
                this.x += (this.chargeTarget.dx) * this.speed * 3 * dt;
                this.y += (this.chargeTarget.dy) * this.speed * 3 * dt;
                this.chargeTarget.duration -= 16.67 * dt;
                if (this.chargeTarget.duration <= 0) {
                    this.isCharging = false;
                    this.speed = this.chargeTarget.originalSpeed;
                }
            } else {
                // 正常追踪
                this.x += (dx / distance) * effectiveSpeed * dt;
                this.y += (dy / distance) * effectiveSpeed * dt;
            }
        }

        // === 远程敌人射击 ===
        if (this.type === 'ranged' && distance <= this.shootRange && canSeePlayer) {
            const now = Date.now();
            if (now - this.lastShootTime >= this.shootCooldown) {
                this.lastShootTime = now;
                // 发射敌人投射物
                game.projectiles.push(new EnemyProjectile(
                    this.x, this.y,
                    targetPlayer.x, targetPlayer.y,
                    this.damage,
                    this.color
                ));
                // 射击特效
                game.particles.push(new Particle(this.x, this.y, this.color));
            }
        }

        // === Boss技能系统 ===
        if (this.isBoss && !this.isCharging) {
            const now = Date.now();
            if (now - this.lastSkillTime >= this.skillCooldown) {
                this.lastSkillTime = now;
                const skill = Math.random();

                if (skill < 0.35) {
                    // 技能1：冲锋 - 高速冲向玩家
                    this.isCharging = true;
                    this.chargeTarget = {
                        dx: dx / distance,
                        dy: dy / distance,
                        duration: 500, // 冲锋0.5秒
                        originalSpeed: this.speed
                    };
                    // 冲锋预警特效
                    for (let i = 0; i < 5; i++) {
                        game.particles.push(new Particle(this.x, this.y, '#ff0000'));
                    }
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(this.x, this.y - 30, '冲锋!', '#ff4500', true);
                    }
                } else if (skill < 0.65) {
                    // 技能2：召唤小怪 - 在周围召唤2-3个小兵
                    const summonCount = 2 + Math.floor(Math.random() * 2);
                    for (let i = 0; i < summonCount; i++) {
                        const angle = (Math.PI * 2 / summonCount) * i;
                        const spawnX = this.x + Math.cos(angle) * 60;
                        const spawnY = this.y + Math.sin(angle) * 60;
                        game.enemies.push(new Enemy(spawnX, spawnY, 'fast'));
                        game.wave.totalEnemies++;
                        game.wave.enemiesSpawned++;
                        for (let j = 0; j < 3; j++) {
                            game.particles.push(new Particle(spawnX, spawnY, '#9b59b6'));
                        }
                    }
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(this.x, this.y - 30, '召唤!', '#9b59b6', true);
                    }
                } else {
                    // 技能3：范围冲击波 - 对周围所有玩家造成伤害
                    const shockwaveRadius = 120;
                    [game.player, game.player2].forEach(p => {
                        if (p && p.health > 0 && !p.invincible) {
                            const dist = Math.hypot(p.x - this.x, p.y - this.y);
                            if (dist < shockwaveRadius) {
                                let shockDmg = Math.floor(this.damage * 0.6);
                                if (p.damageReduction) shockDmg = Math.floor(shockDmg * (1 - p.damageReduction));
                                p.health -= shockDmg;
                                if (typeof showDamageNumber === 'function') {
                                    showDamageNumber(p.x, p.y - 20, shockDmg, '#9b59b6', false);
                                }
                            }
                        }
                    });
                    // 冲击波特效（放射状粒子）
                    for (let i = 0; i < 12; i++) {
                        const angle = (Math.PI * 2 / 12) * i;
                        const p = new Particle(this.x, this.y, '#9b59b6');
                        p.vx = Math.cos(angle) * 4;
                        p.vy = Math.sin(angle) * 4;
                        game.particles.push(p);
                    }
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(this.x, this.y - 30, '冲击波!', '#e056fd', true);
                    }
                }
            }
        }

        // 碰撞检测（检查P1）
        if (game.player.health > 0) {
            const distP1 = Math.hypot(this.x - game.player.x, this.y - game.player.y);
            if (distP1 < this.size + game.player.size) {
                // 无敌状态跳过伤害
                if (game.player.invincible) {
                    // 无敌特效
                    game.particles.push(new Particle(game.player.x, game.player.y, '#ffd700'));
                } else if (game.player.shieldActive) {
                    // 法师护盾吸收一次伤害
                    game.player.shieldActive = false;
                    game.particles.push(new Particle(game.player.x, game.player.y, '#3498db'));
                    game.particles.push(new Particle(game.player.x, game.player.y, '#2980b9'));
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(game.player.x, game.player.y - 20, '护盾抵挡', '#3498db', true);
                    }
                } else {
                    // 计算实际伤害（应用减伤）
                    let actualDamage = this.damage;
                    if (game.player.damageReduction) {
                        actualDamage = Math.floor(this.damage * (1 - game.player.damageReduction));
                    }
                    game.player.health -= actualDamage;
                    SFX.play('playerHit');
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(game.player.x, game.player.y - 20, actualDamage, '#e74c3c', false);
                    }
                }

                // 骑士反伤效果
                if (game.player.counterAttack) {
                    const reflectDamage = Math.floor(this.damage * game.player.counterAttack);
                    this.health -= reflectDamage;
                    for (let i = 0; i < 3; i++) {
                        game.particles.push(new Particle(this.x, this.y, '#c0c0c0'));
                    }
                }

                if (!this.isBoss) {
                    this.health = 0;
                    handleEnemyKill(this, game.player);
                }
            }
        }

        // 碰撞检测（检查P2）
        if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
            const distP2 = Math.hypot(this.x - game.player2.x, this.y - game.player2.y);
            if (distP2 < this.size + game.player2.size) {
                // 无敌状态跳过伤害
                if (game.player2.invincible) {
                    game.particles.push(new Particle(game.player2.x, game.player2.y, '#ffd700'));
                } else if (game.player2.shieldActive) {
                    game.player2.shieldActive = false;
                    game.particles.push(new Particle(game.player2.x, game.player2.y, '#3498db'));
                    game.particles.push(new Particle(game.player2.x, game.player2.y, '#2980b9'));
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(game.player2.x, game.player2.y - 20, '护盾抵挡', '#3498db', true);
                    }
                } else {
                    let actualDamage = this.damage;
                    if (game.player2.damageReduction) {
                        actualDamage = Math.floor(this.damage * (1 - game.player2.damageReduction));
                    }
                    game.player2.health -= actualDamage;
                    if (typeof showDamageNumber === 'function') {
                        showDamageNumber(game.player2.x, game.player2.y - 20, actualDamage, '#e74c3c', false);
                    }
                }

                // 骑士反伤效果
                if (game.player2.counterAttack) {
                    const reflectDamage = Math.floor(this.damage * game.player2.counterAttack);
                    this.health -= reflectDamage;
                    for (let i = 0; i < 3; i++) {
                        game.particles.push(new Particle(this.x, this.y, '#c0c0c0'));
                    }
                }

                if (!this.isBoss) {
                    this.health = 0;
                    handleEnemyKill(this, game.player2);
                }
            }
        }
    }

    draw(ctx) {
        // Boss特殊光环
        if (this.isBoss) {
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.isElite) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 尝试使用精灵图绘制
        const spriteSize = this.size * 2.2;
        let spriteDrawn = false;

        // Boss使用专门的Boss精灵图
        if (this.isBoss && this.bossType) {
            spriteDrawn = drawBossSprite(
                ctx,
                this.bossType,
                this.x - spriteSize / 2,
                this.y - spriteSize / 2,
                spriteSize,
                spriteSize
            );
        }

        // 非Boss或Boss精灵图不可用时，使用普通敌人精灵图
        if (!spriteDrawn) {
            spriteDrawn = drawEnemySprite(
                ctx,
                this.type,
                this.id,
                this.x - spriteSize / 2,
                this.y - spriteSize / 2,
                spriteSize,
                spriteSize
            );
        }

        // 如果精灵图不可用，使用默认emoji渲染
        if (!spriteDrawn) {
            ctx.font = `${this.size * 2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.sprite, this.x, this.y);
        }

        // 绘制生命条
        if (this.health < this.maxHealth) {
            const barWidth = this.isBoss ? 80 : (this.isElite ? 45 : 35);
            const barHeight = this.isBoss ? 8 : 5;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 12, barWidth, barHeight);

            ctx.fillStyle = this.isElite ? '#ff6348' : '#ff4757';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 12, barWidth * healthPercent, barHeight);
        }
    }
}
