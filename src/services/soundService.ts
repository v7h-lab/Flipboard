class SoundService {
    private audioCtx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private currentProfile: 'default' | 'mechanical' = 'default';

    public async init() {
        if (!this.audioCtx) {
            try {
                this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

                // Safety check for suspended state (browser autoplay policy)
                if (this.audioCtx.state === 'suspended') {
                    await this.audioCtx.resume();
                }

                this.masterGain = this.audioCtx.createGain();
                this.masterGain.gain.setValueAtTime(0.5, this.audioCtx.currentTime); // Master volume
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

    public setProfile(profile: 'default' | 'mechanical') {
        this.currentProfile = profile;
    }

    public getProfile() {
        return this.currentProfile;
    }

    public playClick(velocity: number = 1.0) {
        if (this.currentProfile === 'mechanical') {
            this.playMechanicalClick(velocity);
        } else {
            this.playDefaultClick(velocity);
        }
    }

    // Original "Default" Sound
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

    // New "Mechanical" Sound requested by user
    private playMechanicalClick(velocity: number) {
        if (!this.audioCtx || this.audioCtx.state === 'suspended') {
            if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
            return;
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        // Randomize pitch slightly for realism
        const frequency = 150 + Math.random() * 50;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.1);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.1 * velocity, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.1);
    }
}

export const soundService = new SoundService();
