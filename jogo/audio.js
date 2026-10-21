/**
 * Audio Engine using pure Web Audio API
 * No external audio files needed - everything is procedurally synthesized!
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.masterGain = null;
        
        this.musicMuted = false;
        this.sfxMuted = false;
        
        this.isPlayingMusic = false;
        this.musicInterval = null;
        this.currentStep = 0;
        this.tempo = 126; // BPM
        this.noiseBuffer = null;

        // Load mute preferences
        try {
            this.musicMuted = localStorage.getItem('retro_shooter_music_muted') === 'true';
            this.sfxMuted = localStorage.getItem('retro_shooter_sfx_muted') === 'true';
        } catch (e) {
            console.warn('LocalStorage not available for audio settings:', e);
        }
    }

    init() {
        if (this.ctx) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            console.warn('Web Audio API not supported in this browser.');
            return;
        }

        this.ctx = new AudioContextClass();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Music Gain
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicMuted ? 0 : 0.22, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        // SFX Gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxMuted ? 0 : 0.45, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.generateNoiseBuffer();
    }

    ensureContext() {
        try {
            if (!this.ctx) {
                this.init();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        } catch (e) {}
    }

    generateNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        try {
            localStorage.setItem('retro_shooter_music_muted', this.musicMuted);
        } catch (e) {}

        if (this.musicGain && this.ctx) {
            const target = this.musicMuted ? 0.0001 : 0.22;
            this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
        }
        return this.musicMuted;
    }

    toggleSFX() {
        this.sfxMuted = !this.sfxMuted;
        try {
            localStorage.setItem('retro_shooter_sfx_muted', this.sfxMuted);
        } catch (e) {}

        if (this.sfxGain && this.ctx) {
            const target = this.sfxMuted ? 0.0001 : 0.45;
            this.sfxGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
        }
        return this.sfxMuted;
    }

    // --- SFX SYNTHESIS ---

    // Player laser shot: crisp high-to-low fast frequency sweep
    playShoot(type = 'player') {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        if (type === 'player') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.start(now);
            osc.stop(now + 0.13);
        } else if (type === 'double') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1100, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.16);
        } else if (type === 'plasma') {
            // Heavy resonant sci-fi plasma cannon
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);

            osc.disconnect();
            osc.connect(filter);
            filter.connect(gain);

            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.start(now);
            osc.stop(now + 0.23);
        } else if (type === 'spread') {
            // Punchy multi-barrel burst
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.start(now);
            osc.stop(now + 0.11);
        } else if (type === 'missile') {
            // Rocket thruster launch hiss + tone
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.18);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.start(now);
            osc.stop(now + 0.19);

            // Add small ignition noise burst
            if (this.noiseBuffer) {
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;
                const nFilter = this.ctx.createBiquadFilter();
                nFilter.type = 'bandpass';
                nFilter.frequency.setValueAtTime(1800, now);
                const nGain = this.ctx.createGain();
                nGain.gain.setValueAtTime(0.2, now);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                noise.connect(nFilter);
                nFilter.connect(nGain);
                nGain.connect(this.sfxGain);
                noise.start(now);
                noise.stop(now + 0.16);
            }
        } else if (type === 'railgun') {
            // Electric high-voltage piercing zap
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1600, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.28);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(400, now);

            osc.disconnect();
            osc.connect(filter);
            filter.connect(gain);

            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            osc.start(now);
            osc.stop(now + 0.29);
        } else {
            // Enemy laser: lower pitch
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc.start(now);
            osc.stop(now + 0.17);
        }
    }

    // Super Nova Bomb Screen Wipe Explosion
    playBomb() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 1.6;

        // Sub-bass detonation
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(95, now);
        sub.frequency.exponentialRampToValueAtTime(18, now + duration);

        subGain.gain.setValueAtTime(0.7, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + duration);

        // Thunderous filtered white noise surge
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2500, now);
            filter.frequency.exponentialRampToValueAtTime(40, now + duration);

            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.65, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.sfxGain);
            noise.start(now);
            noise.stop(now + duration);
        }
    }

    // Weapon Switch sound
    playWeaponSwitch() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.07);
    }

    // Explosions: White noise with low-pass filter decay and rumble osc
    playExplosion(intensity = 1.0) {
        try {
            if (this.sfxMuted) return;
            this.ensureContext();
            if (!this.ctx || !this.noiseBuffer) return;

            const safeIntensity = Math.max(0.1, intensity || 1.0);
            const now = this.ctx.currentTime;
            const duration = Math.max(0.08, 0.3 * safeIntensity);

            // Noise element
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(900 * safeIntensity, now);
            filter.frequency.exponentialRampToValueAtTime(40, now + duration);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.4 * Math.min(1.5, safeIntensity), now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.sfxGain);

            noise.start(now);
            noise.stop(now + duration);

            // Sub rumble element for punch
            const sub = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            sub.type = 'triangle';
            sub.frequency.setValueAtTime(120 * safeIntensity, now);
            sub.frequency.exponentialRampToValueAtTime(25, now + duration);

            subGain.gain.setValueAtTime(0.35 * Math.min(1.5, safeIntensity), now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            sub.connect(subGain);
            subGain.connect(this.sfxGain);

            sub.start(now);
            sub.stop(now + duration);
        } catch (e) {}
    }

    // Player takes damage: harsh buzz crunch
    playDamage() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(90, now + 0.05);
        osc.frequency.setValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.26);

        // Add small rumble
        this.playExplosion(0.7);
    }

    // Power-up collect: bright harmonic ascending chime
    playPowerUp() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [330, 440, 554, 659, 880]; // E, A, C#, E, A
        
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + idx * 0.04;
            const noteDuration = 0.15;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + noteDuration);
        });
    }

    // Game Over: dramatic descending minor chords
    playGameOver() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chords = [
            [330, 392, 494], // Em
            [293, 349, 440], // Dm
            [246, 311, 370], // B
            [220, 261, 330]  // Am
        ];

        chords.forEach((chord, chordIdx) => {
            const chordTime = now + chordIdx * 0.35;
            chord.forEach((freq) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq / 2, chordTime);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, chordTime);

                gain.gain.setValueAtTime(0.18, chordTime);
                gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.38);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(chordTime);
                osc.stop(chordTime + 0.4);
            });
        });
    }

    // Boss Warning Siren / Klaxon
    playBossAlert() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const time = now + i * 0.45;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(450, time);
            osc.frequency.exponentialRampToValueAtTime(880, time + 0.22);
            osc.frequency.exponentialRampToValueAtTime(450, time + 0.4);

            gain.gain.setValueAtTime(0.35, time);
            gain.gain.setValueAtTime(0.35, time + 0.35);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(time);
            osc.stop(time + 0.44);
        }
    }

    // Heavy Boss Armor Hit
    playBossHit() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    // Boss Defeat Cascading Mega-Explosion
    playBossExplosion() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playExplosion(1.5 + i * 0.3);
            }, i * 220);
        }
    }

    // Stage Clear Triumphant Fanfare
    playStageClear() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // C4, E4, G4, C5, D5, E5, G5
        const melody = [
            { f: 261.63, d: 0.16 },
            { f: 329.63, d: 0.16 },
            { f: 392.00, d: 0.16 },
            { f: 523.25, d: 0.28 },
            { f: 587.33, d: 0.18 },
            { f: 659.25, d: 0.22 },
            { f: 783.99, d: 0.60 }
        ];

        let cursor = now;
        melody.forEach((note) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, cursor);

            gain.gain.setValueAtTime(0.3, cursor);
            gain.gain.exponentialRampToValueAtTime(0.001, cursor + note.d);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(cursor);
            osc.stop(cursor + note.d + 0.05);

            cursor += note.d * 0.9;
        });
    }

    // Clone / Holographic Duplicate Phase Shift Sound
    playCloneSound() {
        try {
            if (this.sfxMuted) return;
            this.ensureContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            [440, 554, 659, 880, 1108].forEach((f, i) => {
                const time = now + i * 0.05;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, time);
                osc.frequency.exponentialRampToValueAtTime(f * 1.5, time + 0.14);

                gain.gain.setValueAtTime(0.25, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(time);
                osc.stop(time + 0.15);
            });
        } catch (e) {}
    }

    // Hyperspace Warp / Direct Stage Transition Sound
    playWarpSound() {
        try {
            if (this.sfxMuted) return;
            this.ensureContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const dur = 1.2;

            // Rising sub tone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + dur);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.exponentialRampToValueAtTime(2500, now + dur);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + dur + 0.05);

            // Whoosh noise
            if (this.noiseBuffer) {
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;
                const nFilter = this.ctx.createBiquadFilter();
                nFilter.type = 'bandpass';
                nFilter.frequency.setValueAtTime(600, now);
                nFilter.frequency.exponentialRampToValueAtTime(3000, now + dur);

                const nGain = this.ctx.createGain();
                nGain.gain.setValueAtTime(0.4, now);
                nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

                noise.connect(nFilter);
                nFilter.connect(nGain);
                nGain.connect(this.sfxGain);
                noise.start(now);
                noise.stop(now + dur + 0.05);
            }
        } catch (e) {}
    }

    // UI Click sound
    playClick() {
        if (this.sfxMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // --- PROCEDURAL SYNTHWAVE BACKGROUND MUSIC ---

    setBossMusic(isBoss) {
        if (this.isBossMusic === isBoss) return;
        this.isBossMusic = isBoss;
        this.tempo = isBoss ? 144 : 126;
        if (this.isPlayingMusic) {
            this.stopMusic();
            this.startMusic();
        }
    }

    startMusic() {
        this.ensureContext();
        if (this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        this.currentStep = 0;

        // Schedule step every 16th note at tempo
        const stepTimeMs = (60000 / this.tempo) / 4;

        this.musicInterval = setInterval(() => {
            if (!this.isPlayingMusic || !this.ctx) return;
            this.playMusicStep(this.currentStep);
            this.currentStep = (this.currentStep + 1) % 32;
        }, stepTimeMs);
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    playMusicStep(step) {
        if (!this.ctx || this.ctx.state !== 'running') return;
        const time = this.ctx.currentTime + 0.05; // slight lookahead buffer

        // 1. Kick Drum (Normal: steps 0, 4, 8, 12... / Boss: double pulse 0, 2, 4, 6, 8...)
        const isKick = this.isBossMusic ? (step % 2 === 0) : (step % 4 === 0);
        if (isKick) {
            const kickOsc = this.ctx.createOscillator();
            const kickGain = this.ctx.createGain();

            kickOsc.type = 'sine';
            kickOsc.frequency.setValueAtTime(140, time);
            kickOsc.frequency.exponentialRampToValueAtTime(32, time + 0.09);

            kickGain.gain.setValueAtTime(0.4, time);
            kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

            kickOsc.connect(kickGain);
            kickGain.connect(this.musicGain);

            kickOsc.start(time);
            kickOsc.stop(time + 0.11);
        }

        // 2. Hi-Hat (Offbeats: 2, 6, 10, 14, etc.)
        if (step % 2 === 1 && this.noiseBuffer) {
            const hh = this.ctx.createBufferSource();
            hh.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7500, time);

            const hhGain = this.ctx.createGain();
            const isAccent = (step % 4 === 2);
            hhGain.gain.setValueAtTime(isAccent ? 0.09 : 0.04, time);
            hhGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

            hh.connect(filter);
            filter.connect(hhGain);
            hhGain.connect(this.musicGain);

            hh.start(time);
            hh.stop(time + 0.05);
        }

        // 3. Bassline pattern (A minor / F / G / E progression across 32 steps)
        // 0-7: A1 (55Hz), 8-15: F1 (43.65Hz), 16-23: G1 (49Hz), 24-31: E1 (41.2Hz)
        let bassFreq = 55;
        if (step >= 8 && step < 16) bassFreq = 43.65;
        else if (step >= 16 && step < 24) bassFreq = 49.0;
        else if (step >= 24) bassFreq = 41.2;

        // Syncopated 16th bass pulse
        if (step % 2 === 0 || step % 4 === 3) {
            const bassOsc = this.ctx.createOscillator();
            const bassFilter = this.ctx.createBiquadFilter();
            const bassGain = this.ctx.createGain();

            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(bassFreq, time);

            bassFilter.type = 'lowpass';
            bassFilter.frequency.setValueAtTime(320, time);
            bassFilter.frequency.exponentialRampToValueAtTime(100, time + 0.09);

            bassGain.gain.setValueAtTime(0.28, time);
            bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

            bassOsc.connect(bassFilter);
            bassFilter.connect(bassGain);
            bassGain.connect(this.musicGain);

            bassOsc.start(time);
            bassOsc.stop(time + 0.11);
        }

        // 4. Arpeggiator Lead Synth (Catchy retro neon melody)
        // D minor / A minor futuristic notes
        const arpMelody = [
            220, 261.63, 329.63, 440,  // A3, C4, E4, A4
            392, 329.63, 261.63, 293.66, // G4, E4, C4, D4
            220, 261.63, 349.23, 440,  // A3, C4, F4, A4
            392, 349.23, 329.63, 293.66, // G4, F4, E4, D4
            196, 246.94, 293.66, 392,  // G3, B3, D4, G4
            349.23, 293.66, 246.94, 261.63, // F4, D4, B3, C4
            164.81, 220, 261.63, 329.63, // E3, A3, C4, E4
            293.66, 261.63, 246.94, 220  // D4, C4, B3, A3
        ];

        const note = arpMelody[step % arpMelody.length];
        if (note && step % 2 === 0) {
            const leadOsc = this.ctx.createOscillator();
            const leadGain = this.ctx.createGain();
            const leadFilter = this.ctx.createBiquadFilter();

            leadOsc.type = 'square';
            leadOsc.frequency.setValueAtTime(note, time);

            leadFilter.type = 'lowpass';
            leadFilter.frequency.setValueAtTime(1600, time);
            leadFilter.frequency.exponentialRampToValueAtTime(500, time + 0.12);

            leadGain.gain.setValueAtTime(0.08, time);
            leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

            leadOsc.connect(leadFilter);
            leadFilter.connect(leadGain);
            leadGain.connect(this.musicGain);

            leadOsc.start(time);
            leadOsc.stop(time + 0.14);
        }
    }
}

// Global instance
window.soundEngine = new SoundEngine();
