// ==================== 游戏实体类 ====================

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
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
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
            this.vx *= this.friction;
            this.vy += this.gravity;
            this.vy *= this.friction;

            this.x += this.vx;
            this.y += this.vy;

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
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
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

    // 调试日志
    console.log('[掉落系统] 生成掉落物 - 位置:', x, y, '敌人类型:', enemyType);

    // 计算掉落的金币数量（随机）
    const coinCount = Math.floor(Math.random() * (goldCountConfig.max - goldCountConfig.min + 1)) + goldCountConfig.min;
    console.log('[掉落系统] 金币掉落数量:', coinCount);

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

    console.log('[掉落系统] 生成完成 - 总掉落物数量:', drops.length);
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
                // 根据原始图片比例和缩放因子计算显示大小
                const imgWidth = rockImg.width * this.scale * 1.5;
                const imgHeight = rockImg.height * this.scale * 1.5;
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
        this.x += this.vx;
        this.y += this.vy;
        this.distance += this.speed;
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

        // 找最近的敌人
        let target = null;
        let minDist = Infinity;
        game.enemies.forEach(enemy => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                target = enemy;
            }
        });

        // 移动向敌人
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > this.attackRange) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
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
                        this.owner.gainExp(target.expValue);
                        game.killCount++;

                        // 生成掉落物
                        const drops = spawnDrops(target.x, target.y, target.type);
                        console.log('[召唤物] 击杀敌人 - 添加掉落物:', drops.length, '当前总数:', game.droppedItems.length);
                        game.droppedItems.push(...drops);

                        // 灵魂链接效果
                        if (this.owner.soulLink) {
                            this.owner.health = Math.min(this.owner.health + this.owner.soulLink, this.owner.maxHealth);
                        }
                    }
                }
            }
        } else {
            // 没有敌人时跟随玩家
            const dx = this.owner.x - this.x;
            const dy = this.owner.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 100) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
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
        switch(this.type) {
            case 'spin':
                this.rotation += 0.3;
                break;
            case 'arrow':
                if (this.tracking && game.enemies.length > 0) {
                    const nearest = game.enemies.reduce((closest, enemy) => {
                        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                        return dist < closest.dist ? { enemy, dist } : closest;
                    }, { enemy: null, dist: Infinity });
                    if (nearest.enemy && nearest.dist < 300) {
                        const targetAngle = Math.atan2(nearest.enemy.y - this.y, nearest.enemy.x - this.x);
                        const angleDiff = targetAngle - this.rotation;
                        this.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.1);
                        this.vx = Math.cos(this.rotation) * this.speed;
                        this.vy = Math.sin(this.rotation) * this.speed;
                    }
                }
                this.x += this.vx;
                this.y += this.vy;
                this.distance += this.speed;
                break;
            case 'magic':
            case 'fireball':
                this.x += this.vx;
                this.y += this.vy;
                this.distance += this.speed;
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
                        const nextTarget = game.enemies.find(e => !this.hitEnemies.includes(e));
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
                down: ['ArrowDown', 's', 'S']
            };
        } else {
            // 双人模式
            if (this.playerIndex === 1) {
                // P1: WASD
                this.controls = {
                    left: ['a', 'A'],
                    right: ['d', 'D'],
                    up: ['w', 'W'],
                    down: ['s', 'S']
                };
            } else {
                // P2: 方向键
                this.controls = {
                    left: ['ArrowLeft'],
                    right: ['ArrowRight'],
                    up: ['ArrowUp'],
                    down: ['ArrowDown']
                };
            }
        }
    }

    // 检查按键是否按下
    isKeyPressed(keys) {
        return keys.some(key => game.keys[key]);
    }

    update(deltaTime) {
        // 移动
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

        // 计算新位置
        const newX = this.x + dx * this.speed;
        const newY = this.y + dy * this.speed;

        // 只检查附近的障碍物（性能优化）
        const nearbyObstacles = game.obstacles.filter(obstacle => {
            const dist = Math.hypot(obstacle.x - this.x, obstacle.y - this.y);
            return dist < 200;
        });

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

        // 检查是否在草丛中（只检查附近的障碍物）
        this.inBush = false;
        for (const obstacle of nearbyObstacles) {
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
        const now = Date.now();
        if (this.healthRegen > 0 && now - this.lastRegenTime >= 1000) {
            this.health = Math.min(this.health + this.healthRegen, this.maxHealth);
            this.lastRegenTime = now;
        }

        // 更新摄像机位置（只有P1或单人模式才更新摄像机）
        if (this.playerIndex === 1) {
            updateCamera();
        }

        // 自动攻击最近的敌人
        this.autoAttack();
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

                // 计算武器加成伤害
                this.weapons.forEach(weapon => {
                    damage += weapon.damage * weapon.level;
                });

                // 暴击判定（使用critDamage属性）
                if (Math.random() < this.critChance) {
                    damage *= this.critDamage;
                    isCrit = true;
                }

                // 根据攻击类型处理
                if (this.attackType === 'melee') {
                    // 近战：直接造成伤害
                    // 应用诅咒加成
                    if (enemy.cursed && enemy.curseMultiplier) {
                        damage *= enemy.curseMultiplier;
                    }
                    enemy.health -= damage;

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
                        setTimeout(() => {
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
                    this.gainExp(enemy.expValue);
                    game.killCount++;

                    // 生成掉落物
                    const drops = spawnDrops(enemy.x, enemy.y, enemy.type);
                    console.log('[近战] 击杀敌人 - 添加掉落物:', drops.length, '当前总数:', game.droppedItems.length);
                    game.droppedItems.push(...drops);

                    for (let i = 0; i < 6; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, enemy.color));
                    }

                    // 吸血效果
                    if (this.vampireHeal > 0) {
                        this.health = Math.min(this.health + this.vampireHeal, this.maxHealth);
                    }
                }
            });

            this.lastAttackTime = now;
            this.justAttacked = true;
            setTimeout(() => this.justAttacked = false, 1000);
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
        }
    }

    update() {
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

        // 精英怪和Boss可以看到草丛中的玩家，普通怪看不到
        const canSeePlayer = this.isElite || this.isBoss || !targetPlayer.hidden;

        if (distance > 0 && canSeePlayer) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // 碰撞检测（检查P1）
        if (game.player.health > 0) {
            const distP1 = Math.hypot(this.x - game.player.x, this.y - game.player.y);
            if (distP1 < this.size + game.player.size) {
                // 计算实际伤害（应用减伤）
                let actualDamage = this.damage;
                if (game.player.damageReduction) {
                    actualDamage = Math.floor(this.damage * (1 - game.player.damageReduction));
                }
                game.player.health -= actualDamage;

                // 骑士反伤效果
                if (game.player.counterAttack) {
                    const reflectDamage = Math.floor(this.damage * game.player.counterAttack);
                    this.health -= reflectDamage;
                    // 反伤特效
                    for (let i = 0; i < 3; i++) {
                        game.particles.push(new Particle(this.x, this.y, '#c0c0c0'));
                    }
                }

                if (!this.isBoss) {
                    this.health = 0;
                }
            }
        }

        // 碰撞检测（检查P2）
        if (game.playerCount === 2 && game.player2 && game.player2.health > 0) {
            const distP2 = Math.hypot(this.x - game.player2.x, this.y - game.player2.y);
            if (distP2 < this.size + game.player2.size) {
                // 计算实际伤害（应用减伤）
                let actualDamage = this.damage;
                if (game.player2.damageReduction) {
                    actualDamage = Math.floor(this.damage * (1 - game.player2.damageReduction));
                }
                game.player2.health -= actualDamage;

                // 骑士反伤效果
                if (game.player2.counterAttack) {
                    const reflectDamage = Math.floor(this.damage * game.player2.counterAttack);
                    this.health -= reflectDamage;
                    // 反伤特效
                    for (let i = 0; i < 3; i++) {
                        game.particles.push(new Particle(this.x, this.y, '#c0c0c0'));
                    }
                }

                if (!this.isBoss) {
                    this.health = 0;
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
