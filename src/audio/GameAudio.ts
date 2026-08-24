import type * as Phaser from 'phaser';

type Cue = 'button' | 'merge' | 'shot' | 'hit' | 'enemy-defeat' | 'boss-telegraph' | 'boss-defeat' | 'reward';

type WebkitAudioWindow = Window & {
  readonly webkitAudioContext?: typeof AudioContext;
};

interface ToneOptions {
  readonly frequency: number;
  readonly endFrequency?: number;
  readonly duration: number;
  readonly volume: number;
  readonly type?: OscillatorType;
  readonly offset?: number;
}

interface NoiseOptions {
  readonly duration: number;
  readonly volume: number;
  readonly offset?: number;
  readonly highpass?: number;
}

/**
 * Small authored procedural SFX palette. It deliberately avoids external audio
 * dependencies so the first-play payload stays tiny and every shipped cue is
 * project-owned. All cues are synthesized through Web Audio after user unlock.
 */
export class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private readonly lastPlayed = new Map<Cue, number>();
  private enabled = true;

  public constructor(private readonly scene: Phaser.Scene) {
    this.scene.input.once('pointerdown', () => this.unlock());
    this.scene.input.keyboard?.once('keydown', () => this.unlock());
  }

  public unlock(): void {
    const context = this.ensureContext();
    if (context?.state === 'suspended') void context.resume().catch(() => undefined);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.master) this.master.gain.value = enabled ? 0.72 : 0;
  }

  public button(): void {
    if (!this.beginCue('button', 45)) return;
    const now = this.startTime();
    this.tone(now, { frequency: 430, endFrequency: 535, duration: 0.065, volume: 0.15, type: 'triangle' });
    this.noise(now, { duration: 0.032, volume: 0.035, highpass: 1500 });
  }

  public merge(level = 1): void {
    if (!this.beginCue('merge', 120)) return;
    const now = this.startTime();
    const lift = Math.max(0, level - 1) * 80;
    this.tone(now, { frequency: 300 + lift, endFrequency: 700 + lift, duration: 0.22, volume: 0.18, type: 'sine' });
    this.tone(now, { frequency: 590 + lift, endFrequency: 1120 + lift, duration: 0.28, volume: 0.09, type: 'triangle', offset: 0.02 });
    this.noise(now, { duration: 0.055, volume: 0.055, offset: 0.14, highpass: 2200 });
    this.tone(now, { frequency: 1250 + lift, endFrequency: 1900 + lift, duration: 0.16, volume: 0.06, offset: 0.15 });
  }

  public shot(): void {
    if (!this.beginCue('shot', 72)) return;
    const now = this.startTime();
    const jitter = (Math.random() - 0.5) * 80;
    this.tone(now, { frequency: 760 + jitter, endFrequency: 470 + jitter, duration: 0.095, volume: 0.055, type: 'sine' });
    this.noise(now, { duration: 0.038, volume: 0.018, highpass: 2400 });
  }

  public hit(): void {
    if (!this.beginCue('hit', 58)) return;
    const now = this.startTime();
    const jitter = (Math.random() - 0.5) * 35;
    this.tone(now, { frequency: 155 + jitter, endFrequency: 92 + jitter, duration: 0.11, volume: 0.075, type: 'sine' });
    this.noise(now, { duration: 0.055, volume: 0.04, highpass: 700 });
  }

  public enemyDefeat(): void {
    if (!this.beginCue('enemy-defeat', 180)) return;
    const now = this.startTime();
    this.tone(now, { frequency: 540, endFrequency: 135, duration: 0.34, volume: 0.15, type: 'triangle' });
    this.noise(now, { duration: 0.17, volume: 0.065, offset: 0.07, highpass: 500 });
  }

  public bossTelegraph(): void {
    if (!this.beginCue('boss-telegraph', 420)) return;
    const now = this.startTime();
    this.tone(now, { frequency: 88, endFrequency: 142, duration: 0.56, volume: 0.17, type: 'sine' });
    this.tone(now, { frequency: 176, endFrequency: 285, duration: 0.56, volume: 0.065, type: 'triangle' });
    this.tone(now, { frequency: 720, endFrequency: 980, duration: 0.24, volume: 0.035, offset: 0.28 });
  }

  public bossDefeat(): void {
    if (!this.beginCue('boss-defeat', 600)) return;
    const now = this.startTime();
    this.tone(now, { frequency: 82, endFrequency: 42, duration: 0.38, volume: 0.24, type: 'sine' });
    this.noise(now, { duration: 0.18, volume: 0.12, highpass: 80 });
    this.tone(now, { frequency: 440, endFrequency: 118, duration: 0.55, volume: 0.11, type: 'triangle', offset: 0.055 });
    this.tone(now, { frequency: 1050, endFrequency: 1720, duration: 0.48, volume: 0.045, offset: 0.18 });
  }

  public reward(): void {
    if (!this.beginCue('reward', 260)) return;
    const now = this.startTime();
    [660, 880, 1100].forEach((frequency, index) => {
      this.tone(now, {
        frequency,
        endFrequency: frequency * 1.035,
        duration: 0.22,
        volume: 0.07,
        offset: index * 0.085
      });
      this.tone(now, {
        frequency: frequency * 2,
        duration: 0.16,
        volume: 0.02,
        offset: index * 0.085
      });
    });
  }

  private beginCue(cue: Cue, cooldownMs: number): boolean {
    if (!this.enabled) return false;
    const context = this.ensureContext();
    if (!context || context.state !== 'running') return false;
    const now = performance.now();
    const last = this.lastPlayed.get(cue) ?? -Infinity;
    if (now - last < cooldownMs) return false;
    this.lastPlayed.set(cue, now);
    return true;
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    const AudioContextCtor = window.AudioContext ?? (window as WebkitAudioWindow).webkitAudioContext;
    if (!AudioContextCtor) return null;
    const context = new AudioContextCtor();
    const master = context.createGain();
    master.gain.value = this.enabled ? 0.72 : 0;
    master.connect(context.destination);
    this.context = context;
    this.master = master;
    this.noiseBuffer = this.createNoiseBuffer(context);
    return context;
  }

  private createNoiseBuffer(context: AudioContext): AudioBuffer {
    const frames = Math.ceil(context.sampleRate);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    return buffer;
  }

  private startTime(): number {
    return (this.context?.currentTime ?? 0) + 0.006;
  }

  private tone(start: number, options: ToneOptions): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;
    const offset = options.offset ?? 0;
    const startsAt = start + offset;
    const endsAt = startsAt + options.duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(Math.max(25, options.frequency), startsAt);
    if (options.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, options.endFrequency), endsAt);
    }
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.volume), startsAt + Math.min(0.008, options.duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(startsAt);
    oscillator.stop(endsAt + 0.01);
  }

  private noise(start: number, options: NoiseOptions): void {
    const context = this.context;
    const master = this.master;
    const noiseBuffer = this.noiseBuffer;
    if (!context || !master || !noiseBuffer) return;
    const offset = options.offset ?? 0;
    const startsAt = start + offset;
    const endsAt = startsAt + options.duration;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = options.highpass ?? 120;
    gain.gain.setValueAtTime(Math.max(0.0002, options.volume), startsAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    const maxOffset = Math.max(0, noiseBuffer.duration - options.duration - 0.01);
    source.start(startsAt, Math.random() * maxOffset, options.duration);
    source.stop(endsAt + 0.01);
  }
}
