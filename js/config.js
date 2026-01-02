// ==================== 游戏配置 ====================
const CONFIG = {
    canvas: {
        width: 1200,  // 默认值，会在初始化时自适应
        height: 800   // 默认值，会在初始化时自适应
    },
    world: {
        width: 8000,  // 大地图宽度
        height: 6000  // 大地图高度
    },
    player: {
        size: 25
    },
    enemy: {
        size: 18
    },
    obstacles: {
        rockCount: 80,
        bushCount: 100
    },
    wave: {
        baseEnemyCount: 5,      // 每波基础敌人数
        enemyIncrement: 2,      // 每波增加的敌人
        timeBetweenSpawns: 800, // 每个敌人生成间隔（毫秒）
        timeBetweenWaves: 3000, // 波次间休息时间
        bossWaveInterval: 10    // 每10波出Boss
    },
    // 难度配置
    difficulty: {
        easy: {
            name: '简单',
            enemyHealthMod: 0.7,
            enemyDamageMod: 0.7,
            expMod: 1.2
        },
        normal: {
            name: '普通',
            enemyHealthMod: 1.0,
            enemyDamageMod: 1.0,
            expMod: 1.0
        },
        hard: {
            name: '困难',
            enemyHealthMod: 1.5,
            enemyDamageMod: 1.5,
            expMod: 1.3
        },
        nightmare: {
            name: '噩梦',
            enemyHealthMod: 2.0,
            enemyDamageMod: 2.0,
            expMod: 1.5
        }
    },
    // 地图配置
    maps: {
        forest: {
            name: '幽暗森林',
            backgroundColor: '#1a2e1a',
            groundColor: '#0d1f0d',
            borderColor: '#2d5a2d',
            bushCount: 120,
            rockCount: 60,
            specialEffect: null
        },
        desert: {
            name: '荒芜沙漠',
            backgroundColor: '#3d2e1a',
            groundColor: '#2a1f0d',
            borderColor: '#8b7355',
            bushCount: 30,
            rockCount: 100,
            specialEffect: null
        },
        dungeon: {
            name: '黑暗地牢',
            backgroundColor: '#14141e',
            groundColor: '#0a0a14',
            borderColor: '#4a4a6a',
            bushCount: 20,
            rockCount: 150,
            specialEffect: 'darkness'
        },
        snow: {
            name: '冰封雪原',
            backgroundColor: '#283238',
            groundColor: '#1e2832',
            borderColor: '#6a8a9a',
            bushCount: 50,
            rockCount: 80,
            specialEffect: 'slow'
        },
        lava: {
            name: '熔岩地狱',
            backgroundColor: '#2a0f0f',
            groundColor: '#1a0808',
            borderColor: '#8b2500',
            bushCount: 10,
            rockCount: 120,
            specialEffect: 'damage'
        },
        ocean: {
            name: '深海遗迹',
            backgroundColor: '#0a1e2d',
            groundColor: '#051428',
            borderColor: '#1e6496',
            bushCount: 60,
            rockCount: 90,
            specialEffect: null
        }
    }
};
