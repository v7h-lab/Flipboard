class SoundService {
    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private currentProfile: 'loud' | 'subtle' = 'subtle';

    // Sound throttling to prevent audio overload
    private lastClickTime: number = 0;
    private clicksThisFrame: number = 0;
    private readonly MAX_CLICKS_PER_FRAME = 8; // Limit concurrent clicks
    private readonly MIN_CLICK_INTERVAL = 15; // Min ms between any clicks
    private frameResetTimeout: ReturnType<typeof setTimeout> | null = null;

    public async init() {
        if (!this.audioCtx) {
            try {
                this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

                if (this.audioCtx.state === 'suspended') {
                    await this.audioCtx.resume();
                }

                this.masterGain = this.audioCtx.createGain();
                this.masterGain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
                this.masterGain.connect(this.audioCtx.destination);
                console.log("SoundService initialized. State:", this.audioCtx.state);
            } catch (e) {
                console.error("Failed to initialize audio context:", e);
            }
        } else if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    public setProfile(profile: 'loud' | 'subtle') {
        this.currentProfile = profile;
    }

    public getProfile() {
        return this.currentProfile;
    }

    public playClick(velocity: number = 1.0) {
        const now = performance.now();

        // Throttle: skip if too soon after last click
        if (now - this.lastClickTime < this.MIN_CLICK_INTERVAL) {
            return;
        }

        // Limit clicks per frame to prevent audio overload
        if (this.clicksThisFrame >= this.MAX_CLICKS_PER_FRAME) {
            return;
        }

        this.clicksThisFrame++;
        this.lastClickTime = now;

        // Reset frame counter after a short delay
        if (!this.frameResetTimeout) {
            this.frameResetTimeout = setTimeout(() => {
                this.clicksThisFrame = 0;
                this.frameResetTimeout = null;
            }, 50); // Reset every 50ms
        }

        if (this.currentProfile === 'subtle') {
            this.playMechanicalClick(velocity);
        } else {
            this.playDefaultClick(velocity);
        }
    }

    // Original "Default" Sound (Loud)
    private playDefaultClick(velocity: number) {
        if (!this.audioCtx || !this.masterGain) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const t = this.audioCtx.currentTime;

        // 1. Transient click
        const oscillator = this.audioCtx.createOscillator();
        const oscGain = this.audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1600 + (Math.random() * 400 - 200), t);
        oscGain.gain.setValueAtTime(0, t);
        oscGain.gain.linearRampToValueAtTime(0.3 * velocity, t + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
        oscillator.connect(oscGain);
        oscGain.connect(this.masterGain);
        oscillator.start(t);
        oscillator.stop(t + 0.05);

        // 2. Body thud
        const thudOsc = this.audioCtx.createOscillator();
        const thudGain = this.audioCtx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(300, t);
        thudOsc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        thudGain.gain.setValueAtTime(0.1 * velocity, t);
        thudGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        thudOsc.connect(thudGain);
        thudGain.connect(this.masterGain);
        thudOsc.start(t);
        thudOsc.stop(t + 0.06);
    }

    // "Mechanical" Sound (Subtle)
    private playMechanicalClick(velocity: number) {
        if (!this.audioCtx || !this.masterGain) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
            return;
        }

        const t = this.audioCtx.currentTime;

        // Main mechanical click
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        const frequency = 200 + Math.random() * 80;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, t);
        oscillator.frequency.exponentialRampToValueAtTime(20, t + 0.08);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(400, t);

        gainNode.gain.setValueAtTime(0.4 * velocity, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(t);
        oscillator.stop(t + 0.1);

        // Add a subtle low thump for body
        const thump = this.audioCtx.createOscillator();
        const thumpGain = this.audioCtx.createGain();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(120, t);
        thump.frequency.exponentialRampToValueAtTime(40, t + 0.05);
        thumpGain.gain.setValueAtTime(0.15 * velocity, t);
        thumpGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        thump.connect(thumpGain);
        thumpGain.connect(this.masterGain);
        thump.start(t);
        thump.stop(t + 0.06);
    }
}

export const soundService = new SoundService();
