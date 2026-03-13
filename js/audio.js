// ==================== 音效系统（Web Audio API 合成） ====================

const SFX = {
    ctx: null,
    masterVolume: 0.3,
    enabled: true,

    // 初始化 AudioContext（需要用户交互后触发）
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    },

    // 确保 AudioContext 已解锁（浏览器安全策略要求用户交互）
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // 播放合成音效
    play(type) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        try {
            switch (type) {
                case 'hit': this._hit(); break;
                case 'kill': this._kill(); break;
                case 'playerHit': this._playerHit(); break;
                case 'dash': this._dash(); break;
                case 'levelUp': this._levelUp(); break;
                case 'pickup': this._pickup(); break;
                case 'shoot': this._shoot(); break;
                case 'explosion': this._explosion(); break;
                case 'skill': this._skill(); break;
                case 'waveStart': this._waveStart(); break;
                case 'bossSpawn': this._bossSpawn(); break;
                case 'evolve': this._evolve(); break;
                case 'menuClick': this._menuClick(); break;
            }
        } catch (e) {
            // 静默忽略音频播放错误
        }
    },

    // 创建增益节点
    _gain(volume, time) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * this.masterVolume, time);
        gain.connect(this.ctx.destination);
        return gain;
    },

    // 攻击命中
    _hit() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.15, t);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    // 敌人击杀
    _kill() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.12, t);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.15);
    },

    // 玩家受伤
    _playerHit() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.2, t);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.25);
    },

    // 冲刺
    _dash() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.1, t);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.12);
    },

    // 升级
    _levelUp() {
        const t = this.ctx.currentTime;
        [400, 500, 600, 800].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this._gain(0.12, t + i * 0.08);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
            osc.connect(gain);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.15);
        });
    },

    // 拾取
    _pickup() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.08, t);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.08);
    },

    // 射击
    _shoot() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.06, t);
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.06);
    },

    // 爆炸
    _explosion() {
        const t = this.ctx.currentTime;
        // 噪音模拟爆炸
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this._gain(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        noise.connect(gain);
        noise.start(t);
    },

    // 技能释放
    _skill() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.15, t);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.35);
    },

    // 新波次开始
    _waveStart() {
        const t = this.ctx.currentTime;
        [300, 400, 500].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this._gain(0.1, t + i * 0.12);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.2);
            osc.connect(gain);
            osc.start(t + i * 0.12);
            osc.stop(t + i * 0.12 + 0.2);
        });
    },

    // Boss出现
    _bossSpawn() {
        const t = this.ctx.currentTime;
        [200, 150, 100, 80].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this._gain(0.18, t + i * 0.15);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.2);
            osc.connect(gain);
            osc.start(t + i * 0.15);
            osc.stop(t + i * 0.15 + 0.2);
        });
    },

    // 武器进化
    _evolve() {
        const t = this.ctx.currentTime;
        [400, 500, 600, 700, 900, 1100].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this._gain(0.1, t + i * 0.06);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
            osc.connect(gain);
            osc.start(t + i * 0.06);
            osc.stop(t + i * 0.06 + 0.15);
        });
    },

    // 菜单点击
    _menuClick() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this._gain(0.08, t);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.05);
    },

    // 设置音量 (0-1)
    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    },

    // 开关音效
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};
