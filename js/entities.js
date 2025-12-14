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

// 障碍物类
class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;

        if (type === 'rock') {
            this.size = 20 + Math.random() * 20;
            this.sprite = '🪨';
            this.blocking = true;
        } else if (type === 'bush') {
            this.size = 30 + Math.random() * 20;
            this.sprite = '🌿';
            this.blocking = false;
        }
    }

    draw(ctx) {
        ctx.font = `${this.size * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sprite, this.x, this.y);
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
                        game.player.gainExp(target.expValue);
                        game.killCount++;
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
        switch(this.type) {
            case 'slash':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.angle);
                ctx.strokeStyle = this.weapon.id === 'holyBlade' ? '#ffd700' : '#fff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, -0.8, 0.8);
                ctx.stroke();
                break;
            case 'stab':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = this.weapon.id === 'shadowBlade' ? '#9b59b6' : '#c0c0c0';
                ctx.fillRect(10, -3, this.size, 6);
                break;
            case 'spin':
                ctx.translate(this.player.x, this.player.y);
                ctx.rotate(this.rotation);
                ctx.strokeStyle = this.weapon.id === 'bloodAxe' ? '#e74c3c' : '#c0c0c0';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(-this.size/2, 0);
                ctx.lineTo(this.size/2, 0);
                ctx.stroke();
                break;
            case 'arrow':
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.weapon.id === 'phoenixBow' ? '#ff6b35' : '#8B4513';
                ctx.beginPath();
                ctx.moveTo(12, 0);
                ctx.lineTo(-8, -5);
                ctx.lineTo(-8, 5);
                ctx.fill();
                break;
            case 'magic':
                ctx.fillStyle = this.weapon.id === 'arcaneStaff' ? '#9b59b6' : '#4ecdc4';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'fireball':
                ctx.fillStyle = this.weapon.id === 'inferno' ? '#ff4500' : '#ff6b35';
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

        // 召唤师系统
        this.maxSummons = classConfig.maxSummons || 0;
        this.lastSummonTime = 0;
        this.summonCooldown = 5000;

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

        // 召唤师召唤逻辑
        if (this.attackType === 'summon') {
            // 自动召唤
            if (game.summons.length < this.maxSummons && now - this.lastSummonTime >= this.summonCooldown) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 30;
                const summonX = this.x + Math.cos(angle) * dist;
                const summonY = this.y + Math.sin(angle) * dist;
                game.summons.push(new Summon(summonX, summonY, this));
                this.lastSummonTime = now;

                // 召唤特效
                for (let i = 0; i < 5; i++) {
                    game.particles.push(new Particle(summonX, summonY, this.color));
                }
            }

            // 召唤师也可以发射魔法弹攻击
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
                    enemy.health -= damage;

                    for (let i = 0; i < 3; i++) {
                        game.particles.push(new Particle(enemy.x, enemy.y, isCrit ? '#ffff00' : this.color));
                    }
                } else if (this.attackType === 'ranged') {
                    // 远程：发射箭
                    game.projectiles.push(new Projectile(
                        this.x, this.y,
                        enemy.x, enemy.y,
                        damage,
                        'arrow',
                        this.color
                    ));
                } else if (this.attackType === 'magic') {
                    // 魔法：发射魔法弹
                    game.projectiles.push(new Projectile(
                        this.x, this.y,
                        enemy.x, enemy.y,
                        damage,
                        'magic',
                        this.color
                    ));
                }

                // 近战直接检查击杀
                if (this.attackType === 'melee' && enemy.health <= 0) {
                    this.gainExp(enemy.expValue);
                    game.killCount++;

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
        this.exp += Math.floor(amount * this.expMultiplier);

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

        // 绘制玩家精灵
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.sprite, this.x, this.y);

        // 绘制攻击范围（半透明）
        ctx.strokeStyle = this.color + '30';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
        ctx.stroke();

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
    constructor(x, y, type = 'normal') {
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
        }
    }

    update() {
        // 追踪玩家
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.hypot(dx, dy);

        // 精英怪和Boss可以看到草丛中的玩家，普通怪看不到
        const canSeePlayer = this.isElite || this.isBoss || !game.player.hidden;

        if (distance > 0 && canSeePlayer) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // 碰撞检测（Boss不会碰撞消失）
        if (distance < this.size + game.player.size) {
            game.player.health -= this.damage;
            if (!this.isBoss) {
                this.health = 0;
            }

            if (game.player.health <= 0) {
                gameOver();
            }
        }
    }

    draw(ctx) {
        ctx.font = `${this.size * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

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

        ctx.fillText(this.sprite, this.x, this.y);

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
