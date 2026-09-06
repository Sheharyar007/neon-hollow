// Small synthesized cues; no downloads, autoplay, or audio assets.
export class Audio {
  constructor() { this.enabled = false; this.ctx = null; this.last = {}; }
  toggle() {
    if (!this.ctx) { const Context = window.AudioContext || window.webkitAudioContext; if (!Context) return false; this.ctx = new Context(); }
    this.enabled = !this.enabled;
    if (this.enabled) { this.ctx.resume().catch(() => {}); this.play('chosen'); }
    return this.enabled;
  }
  play(event) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const settings = { shot: [420, .025, .015, 'triangle'], xp: [1100, .04, .018, 'sine'], hurt: [100, .12, .05, 'sawtooth'], dash: [250, .09, .04, 'triangle'], upgrade: [780, .3, .055, 'sine'], chosen: [990, .16, .04, 'sine'], boom: [70, .2, .06, 'triangle'], arc: [610, .07, .025, 'sawtooth'], heal: [650, .2, .035, 'sine'], nova: [100, .4, .06, 'triangle'], finish: [220, .5, .05, 'sine'] }[event];
    if (!settings) return;
    const now = this.ctx.currentTime;
    if (now - (this.last[event] ?? -1) < .08) return;
    this.last[event] = now;
    const [frequency, duration, volume, type] = settings; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(event === 'upgrade' ? frequency * 1.7 : frequency * .55, now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now + duration);
  }
}
