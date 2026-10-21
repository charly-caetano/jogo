/**
 * CYBER STRIKE - 2D Space Shooter
 * Full Game Engine with Stages/Phases, Boss Battles, Henchmen (Capangas), Holographic Clones, Weapon Arsenal and Particle Systems.
 */

// --- SOUND ENGINE SAFE FALLBACK ---
if (!window.soundEngine) {
    const noop = () => {};
    window.soundEngine = {
        ensureContext: noop,
        playClick: noop,
        playShoot: noop,
        playExplosion: noop,
        playPowerUp: noop,
        playNovaBomb: noop,
        playCloneSound: noop,
        playWeaponSwitch: noop,
        playPlayerHit: noop,
        playGameOver: noop,
        playStageClear: noop,
        playBossAlarm: noop,
        playWarpSound: noop,
        startMusic: noop,
        stopMusic: noop,
        setBossMusic: noop,
        toggleMusic: () => false,
        toggleSFX: () => false,
        musicMuted: false,
        sfxMuted: false
    };
}

// --- CONFIGURATION & CONSTANTS ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 900;

const COLORS = {
    player: '#00f0ff',
    playerGlow: 'rgba(0, 240, 255, 0.8)',
    blaster: '#00f0ff',
    plasma: '#ff00aa',
    spread: '#ffe600',
    missile: '#ff5500',
    railgun: '#00ff88',
    enemyBullet: '#ff3366',
    drone: '#ff3366',
    interceptor: '#b026ff',
    cruiser: '#ffe600',
    asteroid: '#8a99b5',
    shield: '#00ffcc'
};

// --- STAGES CONFIGURATION ---
const STAGES = [
    {
        id: 1,
        name: "FASE 1: ÓRBITA TERRESTRE",
        subtitle: "SETOR ALFA LIBERADO",
        pointsToBoss: 2000,
        bossName: "DREADNOUGHT ALFA",
        bossType: "dreadnought",
        bossHp: 55,
        bonusPoints: 3000,
        bgTint: "#050711",
        nebulaColor: "rgba(0, 240, 255, 0.15)",
        starSpeedMult: 1.0
    },
    {
        id: 2,
        name: "FASE 2: CINTURÃO DE FÓBOS",
        subtitle: "CINTURÃO DE ASTEROIDES NEUTRALIZADO",
        pointsToBoss: 3200,
        bossName: "GOLIATH MECÂNICO",
        bossType: "goliath",
        bossHp: 95,
        bonusPoints: 5000,
        bgTint: "#0c0517",
        nebulaColor: "rgba(176, 38, 255, 0.2)",
        starSpeedMult: 1.3
    },
    {
        id: 3,
        name: "FASE 3: NÚCLEO CYBERNET",
        subtitle: "FORÇA INVASORA ANIQUILADA",
        pointsToBoss: 4500,
        bossName: "HYPERION OVERLORD",
        bossType: "hyperion",
        bossHp: 150,
        bonusPoints: 8000,
        bgTint: "#04140e",
        nebulaColor: "rgba(0, 255, 136, 0.2)",
        starSpeedMult: 1.6
    }
];

// --- GAME STATE CLASS ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Logical canvas dimensions
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // UI Elements
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.highScoreDisplay = document.getElementById('highScoreDisplay');
        this.livesContainer = document.getElementById('livesContainer');
        this.startHighScore = document.getElementById('startHighScore');
        this.bombBtn = document.getElementById('bombBtn');
        this.bombCount = document.getElementById('bombCount');
        this.cloneBtn = document.getElementById('cloneBtn');
        this.cloneStatusText = document.getElementById('cloneStatusText');
        this.weaponDock = document.getElementById('weaponDock');
        
        // Stage & Boss UI Elements
        this.stageInfoBar = document.getElementById('stageInfoBar');
        this.stageName = document.getElementById('stageName');
        this.stageProgressText = document.getElementById('stageProgressText');
        this.stageProgressBar = document.getElementById('stageProgressBar');
        
        this.bossBarContainer = document.getElementById('bossBarContainer');
        this.bossName = document.getElementById('bossName');
        this.bossHpText = document.getElementById('bossHpText');
        this.bossHpFill = document.getElementById('bossHpFill');
        this.bossAlarmOverlay = document.getElementById('bossAlarmOverlay');
        this.alarmBossSubtitle = document.getElementById('alarmBossSubtitle');

        // Warp overlay (Direct stage transition)
        this.warpOverlay = document.getElementById('warpOverlay');
        this.warpSubtitle = document.getElementById('warpSubtitle');
        this.warpBonus = document.getElementById('warpBonus');

        // Overlays
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.victoryFinalScore = document.getElementById('victoryFinalScore');
        this.victoryKills = document.getElementById('victoryKills');
        this.victoryRestartBtn = document.getElementById('victoryRestartBtn');

        this.finalScore = document.getElementById('finalScore');
        this.finalHighScore = document.getElementById('finalHighScore');
        this.enemiesDestroyed = document.getElementById('enemiesDestroyed');
        this.finalWave = document.getElementById('finalWave');
        this.newRecordBadge = document.getElementById('newRecordBadge');

        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.quitBtn = document.getElementById('quitBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.toggleMusicBtn = document.getElementById('toggleMusicBtn');
        this.toggleSfxBtn = document.getElementById('toggleSfxBtn');

        // States: 'START', 'PLAYING', 'PAUSED', 'GAMEOVER', 'VICTORY'
        this.state = 'START';

        // Gameplay statistics
        this.score = 0;
        this.highScore = 0;
        this.lives = 3;
        this.totalKills = 0;
        this.isNewRecord = false;

        // Stage & Boss System
        this.currentStageIndex = 0;
        this.stageScore = 0;
        this.boss = null;
        this.bossSpawned = false;
        this.minionReinforceTimer = 0;

        // Warp speed animation
        this.isWarping = false;

        // Timers & Spawn mechanics
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 1.3;
        this.screenShake = 0;

        // Entities
        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.floatingTexts = [];
        this.powerUps = [];

        // Starfield background
        this.stars = [];
        this.initStarfield();

        // Inputs
        this.keys = {};
        this.touch = { up: false, down: false, left: false, right: false, fire: false };

        // Load High Score
        this.loadHighScore();

        // Attach listeners
        this.setupEventListeners();
        this.updateAudioButtonsUI();
        this.updateLivesUI();
        this.updateBombUI();
        this.updateCloneUI();
        this.updateStageUI();

        // Start render loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // --- INITIALIZATION & HIGH SCORE ---
    loadHighScore() {
        try {
            const saved = localStorage.getItem('retro_shooter_highscore');
            this.highScore = saved ? parseInt(saved, 10) : 0;
            if (isNaN(this.highScore)) this.highScore = 0;
        } catch (e) {
            this.highScore = 0;
        }
        this.highScoreDisplay.textContent = this.highScore.toLocaleString();
        this.startHighScore.textContent = this.highScore.toLocaleString();
    }

    saveHighScore() {
        try {
            localStorage.setItem('retro_shooter_highscore', this.highScore.toString());
        } catch (e) {
            console.warn('Could not save high score to localStorage:', e);
        }
    }

    initStarfield() {
        this.stars = [];
        const starCount = 140;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() < 0.6 ? 1 : (Math.random() < 0.9 ? 1.8 : 2.8),
                speed: 0.5 + Math.random() * 2.2,
                alpha: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 0.02 + Math.random() * 0.05
            });
        }
    }

    // --- CONTROLS & EVENT LISTENERS ---
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'Space') {
                e.preventDefault();
            }

            if (this.state === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
                window.soundEngine.playClick();
                this.startGame();
                return;
            }

            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === 'PLAYING') {
                    this.pauseGame();
                } else if (this.state === 'PAUSED') {
                    this.resumeGame();
                }
            }

            if (e.code === 'KeyM') {
                this.toggleMusic();
            }
            if (e.code === 'KeyS') {
                this.toggleSFX();
            }

            // Weapon switching with number keys 1 - 5
            if (e.code === 'Digit1' || e.code === 'Numpad1') {
                if (this.player) this.player.switchWeapon('blaster');
            } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
                if (this.player) this.player.switchWeapon('plasma');
            } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
                if (this.player) this.player.switchWeapon('spread');
            } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
                if (this.player) this.player.switchWeapon('missile');
            } else if (e.code === 'Digit5' || e.code === 'Numpad5') {
                if (this.player) this.player.switchWeapon('railgun');
            }

            // Cycle weapons with Q and E
            if (e.code === 'KeyQ') {
                if (this.player) this.player.cycleWeapon(-1);
            }
            if (e.code === 'KeyE') {
                if (this.player) this.player.cycleWeapon(1);
            }

            // Trigger Super Nova Bomb with B or Shift
            if (e.code === 'KeyB' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                if (this.player && this.state === 'PLAYING') {
                    this.player.useBomb(this);
                }
            }

            // Trigger Holographic Clone Skill with Key C
            if (e.code === 'KeyC') {
                if (this.player && this.state === 'PLAYING') {
                    this.player.triggerClones(this);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // UI Buttons
        this.startBtn.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.startGame();
        });

        this.restartBtn.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.startGame();
        });

        this.resumeBtn.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.resumeGame();
        });

        this.quitBtn.addEventListener('click', () => {
            window.soundEngine.playClick();
            this.resetToStartScreen();
        });

        this.pauseBtn.addEventListener('click', () => {
            window.soundEngine.playClick();
            if (this.state === 'PLAYING') this.pauseGame();
            else if (this.state === 'PAUSED') this.resumeGame();
        });

        this.toggleMusicBtn.addEventListener('click', () => {
            this.toggleMusic();
        });

        this.toggleSfxBtn.addEventListener('click', () => {
            this.toggleSFX();
        });

        // Bomb button in HUD
        if (this.bombBtn) {
            this.bombBtn.addEventListener('click', () => {
                if (this.player && this.state === 'PLAYING') {
                    this.player.useBomb(this);
                }
            });
        }

        // Clone button in HUD
        if (this.cloneBtn) {
            this.cloneBtn.addEventListener('click', () => {
                if (this.player && this.state === 'PLAYING') {
                    this.player.triggerClones(this);
                }
            });
        }

        // Weapon slots in dock click handler
        const slots = document.querySelectorAll('.weapon-slot');
        slots.forEach((slot) => {
            slot.addEventListener('click', () => {
                const weaponId = slot.dataset.weapon;
                if (this.player && this.state === 'PLAYING') {
                    this.player.switchWeapon(weaponId);
                }
            });
        });

        // Grand Victory - Restart Button
        if (this.victoryRestartBtn) {
            this.victoryRestartBtn.addEventListener('click', () => {
                window.soundEngine.playClick();
                this.victoryScreen.classList.add('hidden');
                this.currentStageIndex = 0;
                this.startGame();
            });
        }

        // Touch virtual controls
        const bindTouch = (id, direction) => {
            const el = document.getElementById(id);
            if (!el) return;
            const startHandler = (e) => {
                e.preventDefault();
                this.touch[direction] = true;
                window.soundEngine.ensureContext();
            };
            const endHandler = (e) => {
                e.preventDefault();
                this.touch[direction] = false;
            };

            el.addEventListener('touchstart', startHandler, { passive: false });
            el.addEventListener('touchend', endHandler, { passive: false });
            el.addEventListener('touchcancel', endHandler, { passive: false });
            el.addEventListener('mousedown', startHandler);
            el.addEventListener('mouseup', endHandler);
            el.addEventListener('mouseleave', endHandler);
        };

        bindTouch('btnTouchUp', 'up');
        bindTouch('btnTouchDown', 'down');
        bindTouch('btnTouchLeft', 'left');
        bindTouch('btnTouchRight', 'right');
        bindTouch('btnTouchFire', 'fire');

        // Mobile auxiliary buttons
        const btnTouchWeapon = document.getElementById('btnTouchWeapon');
        if (btnTouchWeapon) {
            btnTouchWeapon.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.player) this.player.cycleWeapon(1);
            });
        }

        const btnTouchClone = document.getElementById('btnTouchClone');
        if (btnTouchClone) {
            btnTouchClone.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.player && this.state === 'PLAYING') {
                    this.player.triggerClones(this);
                }
            });
        }

        const btnTouchBomb = document.getElementById('btnTouchBomb');
        if (btnTouchBomb) {
            btnTouchBomb.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.player && this.state === 'PLAYING') {
                    this.player.useBomb(this);
                }
            });
        }
    }

    toggleMusic() {
        const isMuted = window.soundEngine.toggleMusic();
        this.toggleMusicBtn.classList.toggle('muted', isMuted);
    }

    toggleSFX() {
        const isMuted = window.soundEngine.toggleSFX();
        this.toggleSfxBtn.classList.toggle('muted', isMuted);
    }

    updateAudioButtonsUI() {
        if (window.soundEngine.musicMuted) {
            this.toggleMusicBtn.classList.add('muted');
        }
        if (window.soundEngine.sfxMuted) {
            this.toggleSfxBtn.classList.add('muted');
        }
    }

    updateLivesUI() {
        this.livesContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < this.lives) {
                this.livesContainer.innerHTML += `
                    <svg class="life-icon" viewBox="0 0 24 24">
                        <polygon points="12,2 22,22 12,18 2,22" />
                    </svg>`;
            } else if (i < 3) {
                this.livesContainer.innerHTML += `
                    <svg class="life-icon lost" viewBox="0 0 24 24">
                        <polygon points="12,2 22,22 12,18 2,22" />
                    </svg>`;
            }
        }
    }

    updateBombUI() {
        if (!this.bombBtn || !this.bombCount) return;
        const count = this.player ? this.player.bombs : 2;
        this.bombCount.textContent = `x${count}`;
        if (count <= 0) {
            this.bombBtn.classList.add('empty');
        } else {
            this.bombBtn.classList.remove('empty');
        }
    }

    updateCloneUI() {
        if (!this.cloneBtn || !this.cloneStatusText) return;
        if (!this.player) return;

        if (this.player.cloneTimer > 0) {
            this.cloneStatusText.textContent = `CLONE: ${Math.ceil(this.player.cloneTimer)}s`;
            this.cloneBtn.className = 'clone-btn active';
        } else if (this.player.cloneCooldown > 0) {
            this.cloneStatusText.textContent = `CLONE (${Math.ceil(this.player.cloneCooldown)}s)`;
            this.cloneBtn.className = 'clone-btn cooldown';
        } else {
            this.cloneStatusText.textContent = `CLONE [C]`;
            this.cloneBtn.className = 'clone-btn ready';
        }
    }

    updateWeaponDockUI() {
        if (!this.player) return;
        const slots = document.querySelectorAll('.weapon-slot');
        slots.forEach((slot) => {
            const wId = slot.dataset.weapon;
            const w = this.player.weapons[wId];
            if (!w) return;

            const ammoSpan = slot.querySelector('.weapon-ammo');
            if (ammoSpan) {
                ammoSpan.textContent = w.ammo === Infinity ? '∞' : w.ammo;
            }

            if (this.player.currentWeapon === wId) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }

            if (w.unlocked || w.ammo > 0 || wId === 'blaster') {
                slot.classList.remove('locked');
            } else {
                slot.classList.add('locked');
            }
        });
    }

    updateStageUI() {
        const stage = STAGES[this.currentStageIndex] || STAGES[0];
        if (this.stageName) {
            this.stageName.textContent = stage.name;
        }

        if (this.bossSpawned) {
            if (this.stageProgressText) this.stageProgressText.textContent = "ALERTA: COMBATE CONTRA O CHEFÃO!";
            if (this.stageProgressBar) this.stageProgressBar.style.width = "100%";
        } else {
            const pct = Math.min(100, Math.floor((this.stageScore / stage.pointsToBoss) * 100));
            if (this.stageProgressText) this.stageProgressText.textContent = `PROGRESSO: ${pct}%`;
            if (this.stageProgressBar) this.stageProgressBar.style.width = `${pct}%`;
        }
    }

    updateBossHpUI(currentHp, maxHp) {
        if (!this.bossBarContainer) return;
        const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
        this.bossHpFill.style.width = `${pct}%`;
        this.bossHpText.textContent = `${Math.ceil(pct)}%`;
    }

    // --- GAME LIFECYCLE ---
    startGame() {
        window.soundEngine.ensureContext();
        window.soundEngine.setBossMusic(false);
        window.soundEngine.startMusic();

        this.score = 0;
        this.lives = 3;
        this.totalKills = 0;
        this.isNewRecord = false;
        this.spawnTimer = 0;
        this.spawnInterval = 1.3;
        this.screenShake = 0;
        this.isWarping = false;

        this.currentStageIndex = 0;
        this.stageScore = 0;
        this.boss = null;
        this.bossSpawned = false;
        this.minionReinforceTimer = 0;

        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.floatingTexts = [];
        this.powerUps = [];

        // Create player in bottom center
        this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 120);

        this.scoreDisplay.textContent = '0';
        this.updateLivesUI();
        this.updateBombUI();
        this.updateCloneUI();
        this.updateWeaponDockUI();
        this.updateStageUI();

        // UI transitions
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.victoryScreen.classList.add('hidden');
        this.bossBarContainer.classList.add('hidden');
        this.bossAlarmOverlay.classList.add('hidden');
        if (this.warpOverlay) this.warpOverlay.classList.add('hidden');

        this.state = 'PLAYING';
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.pauseScreen.classList.remove('hidden');
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.pauseScreen.classList.add('hidden');
        this.lastTime = performance.now();
    }

    resetToStartScreen() {
        this.state = 'START';
        window.soundEngine.setBossMusic(false);
        this.pauseScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.victoryScreen.classList.add('hidden');
        this.bossBarContainer.classList.add('hidden');
        this.bossAlarmOverlay.classList.add('hidden');
        if (this.warpOverlay) this.warpOverlay.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.loadHighScore();
    }

    triggerGameOver() {
        this.state = 'GAMEOVER';
        window.soundEngine.setBossMusic(false);
        window.soundEngine.playGameOver();

        this.screenShake = 22;

        if (this.player) {
            this.createExplosion(this.player.x, this.player.y, '#00f0ff', 60);
            this.createExplosion(this.player.x, this.player.y, '#ff007f', 40);
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.isNewRecord = true;
        }

        this.finalScore.textContent = this.score.toLocaleString();
        this.finalHighScore.textContent = this.highScore.toLocaleString();
        this.enemiesDestroyed.textContent = this.totalKills.toLocaleString();
        this.finalWave.textContent = `Fase ${this.currentStageIndex + 1}`;

        if (this.isNewRecord && this.score > 0) {
            this.newRecordBadge.style.display = 'inline-block';
        } else {
            this.newRecordBadge.style.display = 'none';
        }

        setTimeout(() => {
            if (this.state === 'GAMEOVER') {
                this.gameOverScreen.classList.remove('hidden');
            }
        }, 800);
    }

    // --- BOSS ENTRANCE & CAPANGAS (HENCHMEN) ---
    triggerBossEntrance() {
        const stage = STAGES[this.currentStageIndex];
        if (!stage) return;

        this.bossSpawned = true;
        this.updateStageUI();

        window.soundEngine.playBossAlert();
        this.alarmBossSubtitle.textContent = `ALERTA: ${stage.bossName} & CAPANGAS DETECTADOS!`;
        this.bossAlarmOverlay.classList.remove('hidden');

        this.screenShake = 18;

        setTimeout(() => {
            this.bossAlarmOverlay.classList.add('hidden');
            if (this.state === 'PLAYING') {
                this.bossName.textContent = `CHEFÃO: ${stage.bossName}`;
                this.bossBarContainer.classList.remove('hidden');
                this.updateBossHpUI(stage.bossHp, stage.bossHp);
                window.soundEngine.setBossMusic(true);

                // Spawn appropriate Boss
                if (stage.bossType === 'dreadnought') {
                    this.boss = new DreadnoughtBoss(CANVAS_WIDTH / 2, -100, stage.bossHp);
                    // 2 Capangas Escolta Blindada
                    this.enemies.push(new BossMinion(this.boss, -95, 20, "Escolta Alfa 1", '#ff007f'));
                    this.enemies.push(new BossMinion(this.boss, 95, 20, "Escolta Alfa 2", '#ff007f'));
                } else if (stage.bossType === 'goliath') {
                    this.boss = new GoliathBoss(CANVAS_WIDTH / 2, -100, stage.bossHp);
                    // 3 Capangas Sentinelas de Rocha
                    this.enemies.push(new BossMinion(this.boss, -90, -10, "Sentinela Mecânica 1", '#ffe600'));
                    this.enemies.push(new BossMinion(this.boss, 90, -10, "Sentinela Mecânica 2", '#ffe600'));
                    this.enemies.push(new BossMinion(this.boss, 0, 80, "Sentinela Mecânica 3", '#ffe600'));
                } else {
                    this.boss = new HyperionOverlord(CANVAS_WIDTH / 2, -120, stage.bossHp);
                    // 2 Capangas Guardiões Quânticos Apex
                    this.enemies.push(new BossMinion(this.boss, -115, 30, "Guardião Quântico 1", '#00ff88'));
                    this.enemies.push(new BossMinion(this.boss, 115, 30, "Guardião Quântico 2", '#00ff88'));
                }
                this.enemies.push(this.boss);
            }
        }, 2600);
    }

    onBossDefeated(boss) {
        const stage = STAGES[this.currentStageIndex];
        this.bossBarContainer.classList.add('hidden');
        window.soundEngine.setBossMusic(false);

        // Clear dangerous enemy projectiles immediately
        this.enemyBullets = [];

        // Eliminate any remaining escort minions with fireworks
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.isMinion) {
                this.createExplosion(e.x, e.y, e.color, 24);
                window.soundEngine.playExplosion(0.8);
                this.enemies.splice(i, 1);
            }
        }

        // Huge score & rewards fountain
        this.addScore(stage.bonusPoints, boss.x, boss.y);
        this.screenShake = 30;

        // Guaranteed power-ups drop fountain
        this.powerUps.push(new PowerUp(boss.x - 50, boss.y, 'bomb'));
        this.powerUps.push(new PowerUp(boss.x - 20, boss.y - 20, 'clone'));
        this.powerUps.push(new PowerUp(boss.x + 20, boss.y - 20, 'shield'));
        this.powerUps.push(new PowerUp(boss.x + 50, boss.y, 'life'));

        // Grant temporary invulnerability immediately so the player cannot die while celebrating
        if (this.player) {
            this.player.makeInvincible(4.5);
        }

        this.boss = null;

        // Check if all stages completed
        if (this.currentStageIndex >= STAGES.length - 1) {
            setTimeout(() => {
                if (this.state === 'PLAYING') {
                    this.triggerVictoryScreen();
                }
            }, 2000);
        } else {
            // PASSAR DE FASE DIRETO SEM PERGUNTAR!
            setTimeout(() => {
                if (this.state === 'PLAYING') {
                    this.triggerDirectStageWarp();
                }
            }, 1000);
        }
    }

    // --- PASSAR DE FASE DIRETO (AUTOMATIC HYPERSPACE WARP) ---
    triggerDirectStageWarp() {
        const stage = STAGES[this.currentStageIndex];
        const nextStage = STAGES[this.currentStageIndex + 1];
        if (!nextStage) return;

        window.soundEngine.playWarpSound();
        window.soundEngine.playStageClear();

        this.screenShake = 22;
        this.isWarping = true;
        this.enemyBullets = [];
        this.enemies = [];

        if (this.warpOverlay) {
            this.warpSubtitle.textContent = `AVANÇANDO DIRETAMENTE PARA ${nextStage.name}...`;
            this.warpBonus.textContent = `BÔNUS: +${stage.bonusPoints.toLocaleString()} PTS | ESCUDO RESTAURADO | RECARGA GERAL`;
            this.warpOverlay.classList.remove('hidden');
        }

        // Restock player & give temporary invincibility
        if (this.player) {
            this.player.hasShield = true;
            this.player.makeInvincible(4.0);
            if (this.lives < 5) {
                this.lives++;
                this.updateLivesUI();
            }
            this.player.weapons.plasma.ammo += 30;
            this.player.weapons.spread.ammo += 35;
            this.player.weapons.missile.ammo += 25;
            this.player.weapons.railgun.ammo += 15;
            this.updateWeaponDockUI();
        }

        // Seamless auto-advance into next stage
        setTimeout(() => {
            if (this.warpOverlay) this.warpOverlay.classList.add('hidden');
            this.isWarping = false;
            this.currentStageIndex++;
            this.stageScore = 0;
            this.boss = null;
            this.bossSpawned = false;
            this.enemies = [];
            this.enemyBullets = [];
            this.updateStageUI();
            this.floatingTexts.push(new FloatingText(nextStage.name, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40, '#00ff88', 32));
        }, 2400);
    }

    triggerVictoryScreen() {
        this.state = 'VICTORY';
        window.soundEngine.playStageClear();

        this.victoryFinalScore.textContent = this.score.toLocaleString();
        this.victoryKills.textContent = this.totalKills.toLocaleString();

        this.victoryScreen.classList.remove('hidden');
    }

    triggerNovaBomb() {
        this.screenShake = 26;
        window.soundEngine.playBomb();

        this.particles.push(new ScreenFlash());
        this.particles.push(new NovaShockwave(this.player ? this.player.x : CANVAS_WIDTH / 2, this.player ? this.player.y : CANVAS_HEIGHT / 2));

        for (let eb of this.enemyBullets) {
            this.particles.push(new Particle(eb.x, eb.y, '#ff007f'));
        }
        this.enemyBullets = [];

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.takeDamage(24);
            this.createExplosion(e.x, e.y, e.color, 16);
            if (e.hp <= 0) {
                this.destroyEnemy(e, i);
            }
        }

        this.floatingTexts.push(new FloatingText('SUPER NOVA!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80, '#ff007f', 40));
    }

    addScore(points, x, y) {
        this.score += points;
        this.scoreDisplay.textContent = this.score.toLocaleString();

        if (x !== undefined && y !== undefined) {
            this.floatingTexts.push(new FloatingText(`+${points}`, x, y, '#00f0ff'));
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreDisplay.textContent = this.highScore.toLocaleString();
            this.highScoreDisplay.style.color = '#ffe600';
            this.saveHighScore();
        }

        if (!this.bossSpawned) {
            this.stageScore += points;
            const stage = STAGES[this.currentStageIndex];
            if (stage && this.stageScore >= stage.pointsToBoss) {
                this.triggerBossEntrance();
            } else {
                this.updateStageUI();
            }
        }
    }

    createExplosion(x, y, color, count = 25) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
        this.particles.push(new Shockwave(x, y, color));
    }

    // --- GAME LOOP ---
    gameLoop(timestamp) {
        requestAnimationFrame((t) => this.gameLoop(t));

        if (!this.lastTime) this.lastTime = timestamp;
        let dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (dt > 0.1) dt = 0.1;

        try {
            if (this.state === 'PLAYING') {
                this.update(dt);
            } else {
                this.updateStars(dt * 0.4);
            }

            this.render();
        } catch (err) {
            console.error("Game loop error caught (freeze prevented):", err);
        }
    }

    // --- UPDATE LOGIC ---
    update(dt) {
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 35);
        }

        // Starfield speed accelerates during hyperspace warp
        const stage = STAGES[this.currentStageIndex] || STAGES[0];
        const warpSpeed = this.isWarping ? 8.0 : stage.starSpeedMult;
        this.updateStars(dt * warpSpeed);

        // Update player
        if (this.player) {
            this.player.update(dt, this.keys, this.touch, this);
            this.updateCloneUI();
        }

        // Spawn regular enemies only when boss is not present
        if (!this.boss) {
            this.spawnTimer += dt;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnEnemy();
            }
        } else {
            // Boss reinforcement check: summon capangas if none are left
            this.minionReinforceTimer += dt;
            const hasMinions = this.enemies.some(e => e.isMinion);
            if (!hasMinions && this.minionReinforceTimer >= 12.0 && this.boss.hp > 0) {
                this.minionReinforceTimer = 0;
                this.enemies.push(new BossMinion(this.boss, -90, 20, "Reforço 1", '#ff00aa'));
                this.enemies.push(new BossMinion(this.boss, 90, 20, "Reforço 2", '#ff00aa'));
                this.floatingTexts.push(new FloatingText("REFORÇOS DO CHEFÃO!", this.boss.x, this.boss.y - 30, '#ff00aa', 20));
            }
        }

        // Update Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt, this);
            if (b.y < -50 || b.y > CANVAS_HEIGHT + 50 || b.x < -50 || b.x > CANVAS_WIDTH + 50 || (b.life !== undefined && b.life <= 0)) {
                this.bullets.splice(i, 1);
            }
        }

        // Update Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.update(dt);
            if (eb.y > CANVAS_HEIGHT + 40 || eb.x < -40 || eb.x > CANVAS_WIDTH + 40) {
                this.enemyBullets.splice(i, 1);
            }
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(dt, this);
            if (!e.isBoss && e.y > CANVAS_HEIGHT + 60) {
                this.enemies.splice(i, 1);
            }
        }

        // Update Powerups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const p = this.powerUps[i];
            p.update(dt);
            if (p.y > CANVAS_HEIGHT + 40) {
                this.powerUps.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.update(dt);
            if (part.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.update(dt);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Check Collisions
        this.checkCollisions();
    }

    updateStars(dt) {
        for (let star of this.stars) {
            star.y += star.speed * (this.state === 'PLAYING' ? 1.4 : 0.6) * dt * 60;
            if (star.y > CANVAS_HEIGHT) {
                star.y = -5;
                star.x = Math.random() * CANVAS_WIDTH;
            }
            star.alpha += Math.sin(performance.now() * star.twinkleSpeed) * 0.01;
            star.alpha = Math.max(0.2, Math.min(1, star.alpha));
        }
    }

    spawnEnemy() {
        const rand = Math.random();
        const x = 50 + Math.random() * (CANVAS_WIDTH - 100);

        if (this.currentStageIndex === 0) {
            if (rand < 0.50) this.enemies.push(new DroneEnemy(x, -40));
            else if (rand < 0.78) this.enemies.push(new InterceptorEnemy(x, -40));
            else this.enemies.push(new Asteroid(x, -50));
        } else if (this.currentStageIndex === 1) {
            if (rand < 0.35) this.enemies.push(new Asteroid(x, -50, 32, true));
            else if (rand < 0.70) this.enemies.push(new InterceptorEnemy(x, -40));
            else this.enemies.push(new CruiserEnemy(x, -60));
        } else {
            if (rand < 0.40) this.enemies.push(new CruiserEnemy(x, -60));
            else if (rand < 0.75) this.enemies.push(new InterceptorEnemy(x, -40));
            else this.enemies.push(new DroneEnemy(x, -40));
        }
    }

    // --- COLLISION DETECTION ---
    checkCollisions() {
        if (!this.player) return;

        // 1. Player Bullets vs Enemies
        for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
            const b = this.bullets[bIdx];
            let bulletRemoved = false;

            for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
                const e = this.enemies[eIdx];
                if (this.isColliding(b, e)) {
                    if (b.isBeam) {
                        if (b.hitEnemies.has(e)) continue;
                        b.hitEnemies.add(e);
                    }

                    e.takeDamage(b.damage);
                    this.createExplosion(b.x, b.y, b.color, 8);

                    if (e.isBoss) {
                        this.updateBossHpUI(e.hp, e.maxHp);
                    }

                    if (e.hp <= 0) {
                        this.destroyEnemy(e, eIdx);
                    } else if (!e.isBoss) {
                        window.soundEngine.playExplosion(0.3);
                    }

                    if (b.pierce !== undefined) {
                        b.pierce--;
                        if (b.pierce <= 0) {
                            this.bullets.splice(bIdx, 1);
                            bulletRemoved = true;
                            break;
                        }
                    } else if (!b.isBeam) {
                        this.bullets.splice(bIdx, 1);
                        bulletRemoved = true;
                        break;
                    }
                }
            }
            if (bulletRemoved) continue;
        }

        // 2. Enemy Bullets vs Player
        for (let ebIdx = this.enemyBullets.length - 1; ebIdx >= 0; ebIdx--) {
            const eb = this.enemyBullets[ebIdx];
            if (this.isColliding(eb, this.player)) {
                this.enemyBullets.splice(ebIdx, 1);
                this.playerHit();
                break;
            }
        }

        // 3. Enemies vs Player (Crash collision)
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
            const e = this.enemies[eIdx];
            if (this.isColliding(e, this.player)) {
                if (e.isBoss) {
                    this.playerHit();
                } else {
                    this.destroyEnemy(e, eIdx);
                    this.playerHit();
                }
                break;
            }
        }

        // 4. Player vs Power-ups
        for (let pIdx = this.powerUps.length - 1; pIdx >= 0; pIdx--) {
            const p = this.powerUps[pIdx];
            if (this.isColliding(p, this.player)) {
                this.collectPowerUp(p);
                this.powerUps.splice(pIdx, 1);
            }
        }
    }

    isColliding(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        return dist < (a.radius + b.radius);
    }

    destroyEnemy(enemy, index) {
        this.enemies.splice(index, 1);
        this.totalKills++;

        if (enemy.isBoss) {
            window.soundEngine.playBossExplosion();
            this.createExplosion(enemy.x, enemy.y, enemy.color, 80);
            this.onBossDefeated(enemy);
            return;
        }

        this.addScore(enemy.scoreValue, enemy.x, enemy.y);
        window.soundEngine.playExplosion(enemy.explosionIntensity);
        this.createExplosion(enemy.x, enemy.y, enemy.color, enemy.particleCount);

        // Asteroid splitting
        if (enemy instanceof Asteroid && enemy.canSplit) {
            this.enemies.push(new Asteroid(enemy.x - 15, enemy.y, 18, false));
            this.enemies.push(new Asteroid(enemy.x + 15, enemy.y, 18, false));
        }

        // Power-up drops (including Clone capsules!)
        if (Math.random() < 0.25) {
            const types = ['plasma', 'spread', 'missile', 'railgun', 'bomb', 'clone', 'shield', 'life'];
            const chosen = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(enemy.x, enemy.y, chosen));
        }
    }

    playerHit() {
        if (this.player.isInvincible) return;

        if (this.player.hasShield) {
            this.player.hasShield = false;
            window.soundEngine.playExplosion(0.8);
            this.screenShake = 12;
            this.createExplosion(this.player.x, this.player.y, '#00ffcc', 25);
            this.floatingTexts.push(new FloatingText('ESCUDO QUEBRADO!', this.player.x, this.player.y - 30, '#00ffcc', 18));
            this.player.makeInvincible(1.2);
            return;
        }

        this.lives--;
        this.updateLivesUI();
        this.screenShake = 18;
        window.soundEngine.playDamage();
        this.createExplosion(this.player.x, this.player.y, '#ff007f', 30);

        if (this.lives <= 0) {
            this.triggerGameOver();
        } else {
            this.player.makeInvincible(2.5);
            this.floatingTexts.push(new FloatingText('-1 VIDA', this.player.x, this.player.y - 30, '#ff3366', 20));
        }
    }

    collectPowerUp(powerUp) {
        window.soundEngine.playPowerUp();

        if (powerUp.type === 'plasma') {
            this.player.weapons.plasma.unlocked = true;
            this.player.weapons.plasma.ammo += 35;
            this.player.switchWeapon('plasma');
            this.floatingTexts.push(new FloatingText('CANHÃO DE PLASMA! (+35)', this.player.x, this.player.y - 30, '#ff00aa', 18));
        } else if (powerUp.type === 'spread') {
            this.player.weapons.spread.unlocked = true;
            this.player.weapons.spread.ammo += 45;
            this.player.switchWeapon('spread');
            this.floatingTexts.push(new FloatingText('DISPARO ESPALHADO! (+45)', this.player.x, this.player.y - 30, '#ffe600', 18));
        } else if (powerUp.type === 'missile') {
            this.player.weapons.missile.unlocked = true;
            this.player.weapons.missile.ammo += 30;
            this.player.switchWeapon('missile');
            this.floatingTexts.push(new FloatingText('MÍSSEIS TELEGUIADOS! (+30)', this.player.x, this.player.y - 30, '#ff5500', 18));
        } else if (powerUp.type === 'railgun') {
            this.player.weapons.railgun.unlocked = true;
            this.player.weapons.railgun.ammo += 20;
            this.player.switchWeapon('railgun');
            this.floatingTexts.push(new FloatingText('RAIO RAILGUN! (+20)', this.player.x, this.player.y - 30, '#00ff88', 18));
        } else if (powerUp.type === 'bomb') {
            this.player.bombs = Math.min(5, this.player.bombs + 1);
            this.updateBombUI();
            this.floatingTexts.push(new FloatingText('+1 BOMBA NOVA!', this.player.x, this.player.y - 30, '#ff3366', 20));
        } else if (powerUp.type === 'clone') {
            // Instant Clone skill recharge & trigger
            this.player.cloneCooldown = 0;
            this.player.triggerClones(this);
            this.floatingTexts.push(new FloatingText('CLONES ATIVADOS! [C]', this.player.x, this.player.y - 30, '#00f0ff', 20));
        } else if (powerUp.type === 'shield') {
            this.player.hasShield = true;
            this.floatingTexts.push(new FloatingText('ESCUDO ATIVADO!', this.player.x, this.player.y - 30, '#00ffcc', 20));
        } else if (powerUp.type === 'life') {
            if (this.lives < 5) {
                this.lives++;
                this.updateLivesUI();
                this.floatingTexts.push(new FloatingText('+1 VIDA!', this.player.x, this.player.y - 30, '#00ff88', 20));
            } else {
                this.addScore(500, this.player.x, this.player.y);
            }
        }

        this.updateWeaponDockUI();
    }

    // --- RENDER LOGIC ---
    render() {
        this.ctx.save();

        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        const stage = STAGES[this.currentStageIndex] || STAGES[0];
        this.ctx.fillStyle = stage.bgTint;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Ambient Nebula Glow
        const gradient = this.ctx.createRadialGradient(CANVAS_WIDTH / 2, 250, 50, CANVAS_WIDTH / 2, 250, 450);
        gradient.addColorStop(0, stage.nebulaColor);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Hyperspace warp velocity streaks
        if (this.isWarping) {
            this.renderWarpStreaks();
        } else {
            this.renderStars();
        }

        // Render Entities
        for (let p of this.powerUps) p.draw(this.ctx);
        for (let b of this.bullets) b.draw(this.ctx);
        for (let eb of this.enemyBullets) eb.draw(this.ctx);
        for (let e of this.enemies) e.draw(this.ctx);

        if (this.player && this.state !== 'GAMEOVER') {
            this.player.draw(this.ctx);
        }

        for (let part of this.particles) part.draw(this.ctx);
        for (let ft of this.floatingTexts) ft.draw(this.ctx);

        this.ctx.restore();
    }

    renderStars() {
        for (let star of this.stars) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderWarpStreaks() {
        this.ctx.save();
        for (let star of this.stars) {
            this.ctx.strokeStyle = `rgba(0, 240, 255, ${star.alpha})`;
            this.ctx.lineWidth = star.size * 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(star.x, star.y + 40);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
}

// --- HOLOGRAPHIC PLAYER CLONE CLASS ---
class PlayerClone {
    constructor(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.x = 0;
        this.y = 0;
        this.radius = 18;
    }

    update(dt, player) {
        const targetX = player.x + this.offsetX;
        const targetY = player.y + this.offsetY;
        this.x += (targetX - this.x) * 14 * dt;
        this.y += (targetY - this.y) * 14 * dt;
    }

    shoot(game, weaponId) {
        switch (weaponId) {
            case 'plasma':
                game.bullets.push(new PlasmaBullet(this.x, this.y - 18, 0, -680));
                break;
            case 'spread':
                for (let deg of [-15, 0, 15]) {
                    const rad = (deg - 90) * (Math.PI / 180);
                    game.bullets.push(new SpreadBullet(this.x, this.y - 12, Math.cos(rad) * 760, Math.sin(rad) * 760));
                }
                break;
            case 'missile':
                game.bullets.push(new HomingMissile(this.x, this.y - 10, this.offsetX < 0 ? -60 : 60, -320));
                break;
            case 'railgun':
                game.bullets.push(new RailgunBeam(this.x, this.y - 20, 0, -1500));
                break;
            case 'blaster':
            default:
                game.bullets.push(new Bullet(this.x, this.y - 12, 0, -850, '#00f0ff', 0.85));
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = '#00f0ff';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(10, -4);
        ctx.lineTo(20, 10);
        ctx.lineTo(12, 18);
        ctx.lineTo(5, 14);
        ctx.lineTo(-5, 14);
        ctx.lineTo(-12, 18);
        ctx.lineTo(-20, 10);
        ctx.lineTo(-10, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();

        ctx.restore();
    }
}

// --- PLAYER CLASS ---
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 24;
        this.speed = 460;
        
        this.shootCooldown = 0;
        this.shootInterval = 0.15;
        
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.hasShield = false;

        // Clone / Duplication Skill
        this.cloneTimer = 0;
        this.cloneCooldown = 0;
        this.clones = [];

        // Weapons Arsenal System
        this.weapons = {
            blaster: { id: 'blaster', name: 'BLASTER', ammo: Infinity, unlocked: true, color: '#00f0ff', cooldown: 0.15 },
            plasma: { id: 'plasma', name: 'PLASMA', ammo: 0, unlocked: false, color: '#ff00aa', cooldown: 0.28 },
            spread: { id: 'spread', name: 'SPREAD', ammo: 0, unlocked: false, color: '#ffe600', cooldown: 0.20 },
            missile: { id: 'missile', name: 'MÍSSIL', ammo: 0, unlocked: false, color: '#ff5500', cooldown: 0.34 },
            railgun: { id: 'railgun', name: 'RAILGUN', ammo: 0, unlocked: false, color: '#00ff88', cooldown: 0.38 }
        };
        this.currentWeapon = 'blaster';
        this.bombs = 2;
        this.maxBombs = 5;

        this.thrusterParticles = [];
    }

    makeInvincible(seconds) {
        this.isInvincible = true;
        this.invincibleTimer = seconds;
    }

    switchWeapon(weaponId) {
        if (!this.weapons[weaponId]) return;
        const target = this.weapons[weaponId];
        if (!target.unlocked && target.ammo <= 0 && weaponId !== 'blaster') return;

        this.currentWeapon = weaponId;
        this.shootInterval = target.cooldown;
        window.soundEngine.playWeaponSwitch();
        if (window.gameInstance) window.gameInstance.updateWeaponDockUI();
    }

    cycleWeapon(direction = 1) {
        const order = ['blaster', 'plasma', 'spread', 'missile', 'railgun'];
        let idx = order.indexOf(this.currentWeapon);
        for (let step = 1; step <= order.length; step++) {
            const nextIdx = (idx + direction * step + order.length) % order.length;
            const candidate = this.weapons[order[nextIdx]];
            if (candidate.unlocked || candidate.ammo > 0 || candidate.id === 'blaster') {
                this.switchWeapon(candidate.id);
                break;
            }
        }
    }

    useBomb(game) {
        if (this.bombs > 0 && game.state === 'PLAYING') {
            this.bombs--;
            game.triggerNovaBomb();
            game.updateBombUI();
        }
    }

    triggerClones(game) {
        if (this.cloneCooldown <= 0 && this.cloneTimer <= 0) {
            window.soundEngine.playCloneSound();
            this.cloneTimer = 14.0; // 14 seconds of clone support
            this.cloneCooldown = 22.0; // 22s total cooldown
            this.clones = [
                new PlayerClone(-48, 8),
                new PlayerClone(48, 8)
            ];
            game.floatingTexts.push(new FloatingText("DUPLICATA HOLOGRÁFICA!", this.x, this.y - 35, '#00f0ff', 20));
            game.updateCloneUI();
        }
    }

    update(dt, keys, touch, game) {
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['KeyW'] || touch.up) dy -= 1;
        if (keys['ArrowDown'] || keys['KeyS'] || touch.down) dy += 1;
        if (keys['ArrowLeft'] || keys['KeyA'] || touch.left) dx -= 1;
        if (keys['ArrowRight'] || keys['KeyD'] || touch.right) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;

        this.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, this.x));
        this.y = Math.max(50, Math.min(CANVAS_HEIGHT - 45, this.y));

        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
        }

        // Clone timers
        if (this.cloneTimer > 0) {
            this.cloneTimer -= dt;
            for (let clone of this.clones) {
                clone.update(dt, this);
            }
            if (this.cloneTimer <= 0) {
                this.clones = [];
                game.floatingTexts.push(new FloatingText("CLONES DISSIPADOS", this.x, this.y - 25, '#8a99b5', 16));
            }
        }

        if (this.cloneCooldown > 0) {
            this.cloneCooldown -= dt;
        }

        const isShooting = keys['Space'] || touch.fire;
        if (isShooting && this.shootCooldown <= 0) {
            this.shoot(game);
            this.shootCooldown = this.shootInterval;
        }

        if (Math.random() < 0.8) {
            game.particles.push(new ThrusterParticle(this.x - 8, this.y + 22));
            game.particles.push(new ThrusterParticle(this.x + 8, this.y + 22));
        }
    }

    shoot(game) {
        const w = this.weapons[this.currentWeapon];

        if (this.currentWeapon !== 'blaster') {
            if (w.ammo <= 0) {
                this.currentWeapon = 'blaster';
                this.shootInterval = this.weapons.blaster.cooldown;
                game.updateWeaponDockUI();
                game.floatingTexts.push(new FloatingText('MUNIÇÃO ESGOTADA!', this.x, this.y - 35, '#ff3366', 16));
                return;
            }
            w.ammo--;
            game.updateWeaponDockUI();
        }

        switch (this.currentWeapon) {
            case 'plasma':
                game.bullets.push(new PlasmaBullet(this.x, this.y - 22, 0, -680));
                window.soundEngine.playShoot('plasma');
                break;

            case 'spread':
                const angles = [-20, -10, 0, 10, 20];
                const speed = 760;
                for (let deg of angles) {
                    const rad = (deg - 90) * (Math.PI / 180);
                    const vx = Math.cos(rad) * speed;
                    const vy = Math.sin(rad) * speed;
                    game.bullets.push(new SpreadBullet(this.x, this.y - 15, vx, vy));
                }
                window.soundEngine.playShoot('spread');
                break;

            case 'missile':
                game.bullets.push(new HomingMissile(this.x - 18, this.y - 5, -90, -320));
                game.bullets.push(new HomingMissile(this.x + 18, this.y - 5, 90, -320));
                window.soundEngine.playShoot('missile');
                break;

            case 'railgun':
                game.bullets.push(new RailgunBeam(this.x, this.y - 25, 0, -1500));
                window.soundEngine.playShoot('railgun');
                break;

            case 'blaster':
            default:
                game.bullets.push(new Bullet(this.x - 12, this.y - 15, 0, -850, '#00f0ff', 1.0));
                game.bullets.push(new Bullet(this.x + 12, this.y - 15, 0, -850, '#00f0ff', 1.0));
                window.soundEngine.playShoot('player');
                break;
        }

        // Clones duplicate firepower simultaneously!
        if (this.cloneTimer > 0) {
            for (let clone of this.clones) {
                clone.shoot(game, this.currentWeapon);
            }
        }

        if (this.currentWeapon !== 'blaster' && w.ammo <= 0) {
            this.currentWeapon = 'blaster';
            this.shootInterval = this.weapons.blaster.cooldown;
            game.updateWeaponDockUI();
        }
    }

    draw(ctx) {
        // Draw holographic clones first
        if (this.cloneTimer > 0) {
            for (let clone of this.clones) {
                clone.draw(ctx);
            }
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isInvincible && Math.floor(performance.now() / 80) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        }

        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-10, 20);
        ctx.lineTo(0, 32 + Math.random() * 8);
        ctx.lineTo(10, 20);
        ctx.closePath();
        ctx.fill();

        const activeColor = this.weapons[this.currentWeapon] ? this.weapons[this.currentWeapon].color : COLORS.player;
        ctx.shadowBlur = 15;
        ctx.shadowColor = activeColor;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(12, -4);
        ctx.lineTo(26, 12);
        ctx.lineTo(16, 22);
        ctx.lineTo(6, 16);
        ctx.lineTo(-6, 16);
        ctx.lineTo(-16, 22);
        ctx.lineTo(-26, 12);
        ctx.lineTo(-12, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(0, 10);
        ctx.stroke();

        ctx.fillStyle = activeColor;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(0, -2, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.hasShield) {
            ctx.strokeStyle = '#00ffcc';
            ctx.fillStyle = 'rgba(0, 255, 204, 0.12)';
            ctx.shadowColor = '#00ffcc';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}

// --- BULLET CLASSES ---
class Bullet {
    constructor(x, y, vx, vy, color = '#00f0ff', damage = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4.5;
        this.damage = damage;
        this.color = color;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
        ctx.stroke();

        ctx.restore();
    }
}

class PlasmaBullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 11;
        this.damage = 3.2;
        this.color = '#ff00aa';
        this.pierce = 3;
        this.pulse = 0;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.pulse += dt * 12;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        ctx.fillStyle = 'rgba(255, 0, 170, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 4 + Math.sin(this.pulse) * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff00aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

class SpreadBullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 4;
        this.damage = 1.15;
        this.color = '#ffe600';
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.02, this.y - this.vy * 0.02);
        ctx.stroke();
        ctx.restore();
    }
}

class HomingMissile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.speed = 680;
        this.angle = Math.atan2(vy, vx);
        this.radius = 6;
        this.damage = 3.6;
        this.color = '#ff5500';
        this.turnRate = 7.5;
        this.life = 3.2;
    }

    update(dt, game) {
        this.life -= dt;

        let closest = null;
        let minDist = 550;
        for (let e of game.enemies) {
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist) {
                minDist = d;
                closest = e;
            }
        }

        if (closest) {
            const desired = Math.atan2(closest.y - this.y, closest.x - this.x);
            const diff = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
            this.angle += Math.sign(diff) * Math.min(Math.abs(diff), this.turnRate * dt);
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (Math.random() < 0.6) {
            game.particles.push(new ThrusterParticle(this.x, this.y));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        ctx.fillStyle = this.color;
        ctx.shadowColor = '#ff2200';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -3, 4, 6);

        ctx.restore();
    }
}

class RailgunBeam {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 8;
        this.damage = 5.0;
        this.color = '#00ff88';
        this.isBeam = true;
        this.hitEnemies = new Set();
        this.length = 160;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.lineWidth = 6;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();

        ctx.restore();
    }
}

class EnemyBullet {
    constructor(x, y, vx, vy, color = '#ff3366') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 5.5;
        this.color = color;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// --- BASE ENEMY CLASS ---
class Enemy {
    constructor(x, y, radius, hp, scoreValue, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxHp = hp;
        this.hp = hp;
        this.scoreValue = scoreValue;
        this.color = color;
        this.explosionIntensity = 1.0;
        this.particleCount = 20;
        this.isBoss = false;
        this.isMinion = false;
    }

    takeDamage(amount) {
        this.hp -= amount;
    }

    update(dt, game) {}
    draw(ctx) {}
}

// --- REGULAR ENEMIES ---
class DroneEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 18, 1, 100, '#ff3366');
        this.speedY = 220 + Math.random() * 70;
        this.freq = 2.5;
        this.amplitude = 40 + Math.random() * 30;
        this.initialX = x;
        this.time = Math.random() * 10;
        this.explosionIntensity = 0.8;
        this.particleCount = 18;
    }

    update(dt) {
        this.time += dt;
        this.y += this.speedY * dt;
        this.x = this.initialX + Math.sin(this.time * this.freq) * this.amplitude;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#1e0510';
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(16, -14);
        ctx.lineTo(0, -6);
        ctx.lineTo(-16, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class InterceptorEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 22, 2, 250, '#b026ff');
        this.speedY = 170 + Math.random() * 40;
        this.shootTimer = 0.6 + Math.random() * 0.8;
        this.explosionIntensity = 1.2;
        this.particleCount = 24;
    }

    update(dt, game) {
        this.y += this.speedY * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.y > 40 && this.y < CANVAS_HEIGHT - 150) {
            this.shootTimer = 1.8 + Math.random() * 0.6;
            game.enemyBullets.push(new EnemyBullet(this.x, this.y + 15, 0, 360));
            window.soundEngine.playShoot('enemy');
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#140522';
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, 22);
        ctx.lineTo(20, -10);
        ctx.lineTo(12, -20);
        ctx.lineTo(-12, -20);
        ctx.lineTo(-20, -10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-16, -5, 3, 8);
        ctx.fillRect(13, -5, 3, 8);

        ctx.restore();
    }
}

class CruiserEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 32, 6, 600, '#ffe600');
        this.speedY = 95;
        this.shootTimer = 1.0;
        this.explosionIntensity = 1.8;
        this.particleCount = 38;
    }

    update(dt, game) {
        this.y += this.speedY * dt;

        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && this.y > 60 && this.y < CANVAS_HEIGHT - 200) {
            this.shootTimer = 2.0;
            game.enemyBullets.push(new EnemyBullet(this.x - 18, this.y + 20, -60, 320));
            game.enemyBullets.push(new EnemyBullet(this.x + 18, this.y + 20, 60, 320));
            window.soundEngine.playShoot('enemy');
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#1f1a04';
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.lineTo(26, 10);
        ctx.lineTo(34, -18);
        ctx.lineTo(14, -30);
        ctx.lineTo(-14, -30);
        ctx.lineTo(-34, -18);
        ctx.lineTo(-26, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (this.hp < this.maxHp) {
            const barW = 40;
            const hpRatio = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.fillRect(-barW / 2, -40, barW, 4);
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(-barW / 2, -40, barW * hpRatio, 4);
        }

        ctx.restore();
    }
}

class Asteroid extends Enemy {
    constructor(x, y, radius = 28, canSplit = true) {
        super(x, y, radius, radius > 20 ? 2 : 1, radius > 20 ? 150 : 80, '#8a99b5');
        this.speedY = 140 + Math.random() * 80;
        this.speedX = (Math.random() - 0.5) * 60;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 2;
        this.canSplit = canSplit;
        this.vertices = [];

        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const r = this.radius * (0.8 + Math.random() * 0.4);
            this.vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
        this.explosionIntensity = 1.0;
        this.particleCount = radius > 20 ? 24 : 14;
    }

    update(dt) {
        this.y += this.speedY * dt;
        this.x += this.speedX * dt;
        this.rotation += this.rotSpeed * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#10141f';
        ctx.strokeStyle = '#5a6885';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < this.vertices.length; i++) {
            const pt = this.vertices[i];
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

// --- BOSS HENCHMAN / CAPANGA CLASS ---
class BossMinion extends Enemy {
    constructor(boss, offsetX, offsetY, name = "Capanga", color = '#ff00aa') {
        super(boss.x + offsetX, boss.y + offsetY, 20, 14, 400, color);
        this.boss = boss;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.name = name;
        this.shootTimer = 0.8 + Math.random() * 1.2;
        this.orbitAngle = Math.atan2(offsetY, offsetX);
        this.isMinion = true;
        this.explosionIntensity = 1.1;
        this.particleCount = 22;
    }

    update(dt, game) {
        if (!this.boss || this.boss.hp <= 0) {
            this.y += 180 * dt;
            return;
        }

        // Circular formation escorting the boss
        this.orbitAngle += dt * 1.6;
        const currentDist = Math.hypot(this.offsetX, this.offsetY);
        this.x = this.boss.x + Math.cos(this.orbitAngle) * currentDist;
        this.y = this.boss.y + Math.sin(this.orbitAngle) * (currentDist * 0.4) + 10;

        // Firing pattern
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shootTimer = 1.4 + Math.random() * 0.8;
            game.enemyBullets.push(new EnemyBullet(this.x, this.y + 15, (Math.random() - 0.5) * 60, 330, this.color));
            window.soundEngine.playShoot('enemy');
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#1e0516';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2.5;

        // Escort hex fighter
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(16, 4);
        ctx.lineTo(14, -14);
        ctx.lineTo(-14, -14);
        ctx.lineTo(-16, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// --- BASE BOSS CLASS ---
class BaseBoss extends Enemy {
    constructor(x, y, radius, hp, name, color) {
        super(x, y, radius, hp, 5000, color);
        this.isBoss = true;
        this.name = name;
        this.targetY = 170;
        this.vx = 140;
        this.attackTimer = 0;
        this.phase2 = false;
    }

    takeDamage(amount) {
        this.hp -= amount;
        window.soundEngine.playBossHit();

        if (this.hp <= this.maxHp * 0.5 && !this.phase2) {
            this.phase2 = true;
            this.vx *= 1.35;
            window.soundEngine.playBossAlert();
            if (window.gameInstance) {
                window.gameInstance.screenShake = 16;
                window.gameInstance.floatingTexts.push(new FloatingText("MODO ENFURECIDO!", this.x, this.y - 45, '#ff007f', 24));
            }
        }
    }
}

// 1. BOSS FASE 1: DREADNOUGHT ALFA
class DreadnoughtBoss extends BaseBoss {
    constructor(x, y, hp = 55) {
        super(x, y, 68, hp, "Dreadnought Alfa", '#ff007f');
        this.width = 170;
        this.height = 80;
        this.attackPatternTimer = 0;
    }

    update(dt, game) {
        if (this.y < this.targetY) {
            this.y += 110 * dt;
            return;
        }

        this.x += this.vx * dt;
        if (this.x > CANVAS_WIDTH - 120) {
            this.x = CANVAS_WIDTH - 120;
            this.vx *= -1;
        } else if (this.x < 120) {
            this.x = 120;
            this.vx *= -1;
        }

        this.attackTimer += dt;
        const cooldown = this.phase2 ? 1.0 : 1.6;

        if (this.attackTimer >= cooldown) {
            this.attackTimer = 0;
            this.attackPatternTimer++;

            if (this.attackPatternTimer % 2 === 0) {
                game.enemyBullets.push(new EnemyBullet(this.x - 45, this.y + 35, 0, 360, '#ff007f'));
                game.enemyBullets.push(new EnemyBullet(this.x + 45, this.y + 35, 0, 360, '#ff007f'));
                window.soundEngine.playShoot('enemy');
            } else {
                for (let deg of [-24, -12, 0, 12, 24]) {
                    const rad = (deg + 90) * (Math.PI / 180);
                    const vx = Math.cos(rad) * 320;
                    const vy = Math.sin(rad) * 320;
                    game.enemyBullets.push(new EnemyBullet(this.x, this.y + 30, vx, vy, '#ffe600'));
                }
                window.soundEngine.playShoot('spread');
            }

            if (this.phase2 && Math.random() < 0.4) {
                game.enemies.push(new DroneEnemy(this.x + (Math.random() - 0.5) * 80, this.y + 20));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.shadowColor = this.phase2 ? '#ff0055' : '#ff007f';
        ctx.shadowBlur = this.phase2 ? 25 : 16;
        ctx.fillStyle = '#16041c';
        ctx.strokeStyle = this.phase2 ? '#ff0055' : '#ff007f';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(0, 45);
        ctx.lineTo(40, 25);
        ctx.lineTo(85, -15);
        ctx.lineTo(70, -35);
        ctx.lineTo(25, -25);
        ctx.lineTo(0, -40);
        ctx.lineTo(-25, -25);
        ctx.lineTo(-70, -35);
        ctx.lineTo(-85, -15);
        ctx.lineTo(-40, 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff007f';
        ctx.fillRect(-50, 15, 10, 25);
        ctx.fillRect(40, 15, 10, 25);

        ctx.fillStyle = this.phase2 ? '#ffe600' : '#00f0ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 2. BOSS FASE 2: GOLIATH MECÂNICO
class GoliathBoss extends BaseBoss {
    constructor(x, y, hp = 95) {
        super(x, y, 78, hp, "Goliath Mecânico", '#ffe600');
        this.angle = 0;
        this.spiralStep = 0;
    }

    update(dt, game) {
        if (this.y < this.targetY) {
            this.y += 100 * dt;
            return;
        }

        this.angle += dt * 1.5;
        this.x = CANVAS_WIDTH / 2 + Math.sin(this.angle) * (CANVAS_WIDTH * 0.35);

        this.attackTimer += dt;
        const interval = this.phase2 ? 0.35 : 0.6;

        if (this.attackTimer >= interval) {
            this.attackTimer = 0;
            this.spiralStep++;

            const count = this.phase2 ? 6 : 4;
            const baseAngle = this.spiralStep * 0.45;
            for (let i = 0; i < count; i++) {
                const a = baseAngle + (i / count) * Math.PI * 2;
                const vx = Math.cos(a) * 310;
                const vy = Math.sin(a) * 310;
                game.enemyBullets.push(new EnemyBullet(this.x, this.y, vx, vy, '#ffe600'));
            }
            window.soundEngine.playShoot('enemy');

            if (this.phase2 && this.spiralStep % 8 === 0) {
                game.enemies.push(new Asteroid(this.x, this.y + 40, 20, false));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.shadowColor = this.phase2 ? '#ff5500' : '#ffe600';
        ctx.shadowBlur = 20;

        ctx.rotate(this.angle * 0.8);
        ctx.fillStyle = '#221905';
        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = 3;

        ctx.beginPath();
        const pts = 10;
        for (let i = 0; i < pts; i++) {
            const a = (i / pts) * Math.PI * 2;
            const r = this.radius * (i % 2 === 0 ? 1.0 : 0.75);
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 3. BOSS FASE 3: HYPERION OVERLORD (CHEFE FINAL)
class HyperionOverlord extends BaseBoss {
    constructor(x, y, hp = 150) {
        super(x, y, 92, hp, "Hyperion Overlord", '#00ff88');
    }

    update(dt, game) {
        if (this.y < this.targetY) {
            this.y += 90 * dt;
            return;
        }

        this.x += this.vx * dt;
        if (this.x > CANVAS_WIDTH - 140) {
            this.x = CANVAS_WIDTH - 140;
            this.vx *= -1;
        } else if (this.x < 140) {
            this.x = 140;
            this.vx *= -1;
        }

        this.attackTimer += dt;
        const cooldown = this.phase2 ? 0.7 : 1.1;

        if (this.attackTimer >= cooldown) {
            this.attackTimer = 0;

            game.enemyBullets.push(new EnemyBullet(this.x - 60, this.y + 40, -40, 360, '#00ff88'));
            game.enemyBullets.push(new EnemyBullet(this.x + 60, this.y + 40, 40, 360, '#00ff88'));
            game.enemyBullets.push(new EnemyBullet(this.x, this.y + 50, 0, 420, '#ff00aa'));
            window.soundEngine.playShoot('spread');

            if (this.phase2) {
                for (let deg of [-35, -18, 0, 18, 35]) {
                    const rad = (deg + 90) * (Math.PI / 180);
                    game.enemyBullets.push(new EnemyBullet(this.x, this.y + 40, Math.cos(rad) * 350, Math.sin(rad) * 350, '#ff007f'));
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.shadowColor = this.phase2 ? '#00ffff' : '#00ff88';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#051810';
        ctx.strokeStyle = this.phase2 ? '#00ffff' : '#00ff88';
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.moveTo(0, 75);
        ctx.lineTo(80, -20);
        ctx.lineTo(105, -55);
        ctx.lineTo(0, -70);
        ctx.lineTo(-105, -55);
        ctx.lineTo(-80, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00ff88';
        ctx.fillRect(-70, -10, 8, 30);
        ctx.fillRect(62, -10, 8, 30);

        ctx.fillStyle = this.phase2 ? '#ffffff' : '#00ffcc';
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// --- POWER-UP CLASS ---
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 16;
        this.speedY = 120;
        this.pulse = 0;
    }

    update(dt) {
        this.y += this.speedY * dt;
        this.pulse += dt * 4;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 1 + Math.sin(this.pulse) * 0.12;
        ctx.scale(scale, scale);

        let color = '#ffe600';
        let label = 'S';
        if (this.type === 'plasma') {
            color = '#ff00aa';
            label = 'P';
        } else if (this.type === 'spread') {
            color = '#ffe600';
            label = 'S';
        } else if (this.type === 'missile') {
            color = '#ff5500';
            label = 'M';
        } else if (this.type === 'railgun') {
            color = '#00ff88';
            label = 'R';
        } else if (this.type === 'bomb') {
            color = '#ff3366';
            label = 'B';
        } else if (this.type === 'clone') {
            color = '#00f0ff';
            label = 'C';
        } else if (this.type === 'shield') {
            color = '#00ffcc';
            label = '🛡';
        } else if (this.type === 'life') {
            color = '#00ff88';
            label = '+';
        }

        ctx.fillStyle = 'rgba(10, 16, 32, 0.9)';
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = 'bold 12px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 1);

        ctx.restore();
    }
}

// --- PARTICLE SYSTEMS ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 260;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 0.4 + Math.random() * 0.5;
        this.maxLife = this.life;
        this.size = 2 + Math.random() * 3.5;
        this.color = color;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.94;
        this.vy *= 0.94;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.size * alpha), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ThrusterParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 20;
        this.vy = 80 + Math.random() * 120;
        this.life = 0.2 + Math.random() * 0.15;
        this.maxLife = this.life;
        this.size = 2.5;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = Math.random() < 0.5 ? '#ff8800' : '#00f0ff';
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.size * alpha), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Shockwave {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 6;
        this.maxRadius = 45;
        this.life = 0.35;
        this.maxLife = this.life;
    }

    update(dt) {
        this.life -= dt;
        const progress = Math.max(0, 1 - (this.life / this.maxLife));
        this.radius = 6 + progress * (this.maxRadius - 6);
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 2.5 * alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class ScreenFlash {
    constructor() {
        this.life = 0.35;
        this.maxLife = this.life;
    }

    update(dt) {
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife) * 0.75;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }
}

class NovaShockwave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.maxRadius = CANVAS_HEIGHT * 0.9;
        this.life = 0.85;
        this.maxLife = this.life;
    }

    update(dt) {
        this.life -= dt;
        const p = Math.max(0, 1 - (this.life / this.maxLife));
        this.radius = 12 + p * (this.maxRadius - 12);
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.strokeStyle = '#ff00aa';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 25;
        ctx.lineWidth = 14 * alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// --- FLOATING TEXT ---
class FloatingText {
    constructor(text, x, y, color = '#00f0ff', size = 18) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.life = 0.85;
        this.maxLife = this.life;
        this.vy = -55;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = `900 ${this.size}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// --- BOOTSTRAP GAME ---
window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new Game();
});
