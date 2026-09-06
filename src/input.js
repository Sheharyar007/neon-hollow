export class Input {
  constructor({ canvas, joystick, stick, onDash, onPause, onChoice }) {
    this.keys = new Set(); this.touch = { x: 0, y: 0 }; this.pointer = null;
    this.clear = () => { this.keys.clear(); this.touch = { x: 0, y: 0 }; this.pointer = null; stick.style.transform = ''; };
    document.addEventListener('keydown', e => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key) && !(e.target instanceof HTMLButtonElement)) e.preventDefault();
      this.keys.add(key);
      if (e.repeat) return;
      if (key === 'p' || key === 'escape') onPause();
      if (key === ' ' && !(e.target instanceof HTMLButtonElement)) onDash();
      if (['1', '2', '3'].includes(key)) onChoice(Number(key) - 1);
    });
    document.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', this.clear);
    const move = e => {
      const r = joystick.getBoundingClientRect(); const dx = e.clientX - r.left - r.width / 2; const dy = e.clientY - r.top - r.height / 2;
      const d = Math.hypot(dx, dy); const max = r.width * .32; const ratio = Math.min(d, max) / Math.max(d, 1);
      this.touch = { x: dx * ratio / max, y: dy * ratio / max }; stick.style.transform = `translate(${dx * ratio}px, ${dy * ratio}px)`;
    };
    joystick.addEventListener('pointerdown', e => { e.preventDefault(); this.pointer = e.pointerId; joystick.setPointerCapture(e.pointerId); move(e); });
    joystick.addEventListener('pointermove', e => { if (e.pointerId === this.pointer) { e.preventDefault(); move(e); } });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) joystick.addEventListener(event, e => { if (e.pointerId === this.pointer) this.clear(); });
    canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));
  }
  movement() {
    const keys = this.keys;
    return { x: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')) + this.touch.x, y: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')) + this.touch.y };
  }
}
