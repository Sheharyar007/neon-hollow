import { WORLD, clamp } from './data.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.arena = new Image(); this.arena.src = new URL('../public/assets/arena.png', import.meta.url).href;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
  }
  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = width; this.height = height; this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * this.dpr); this.canvas.height = Math.round(height * this.dpr);
    this.zoom = width < 700 ? .78 : 1;
  }
  draw(game, now) {
    const c = this.ctx; const p = game.player; const vw = this.width / this.zoom; const vh = this.height / this.zoom;
    game.viewport = { width: vw, height: vh };
    const camX = clamp(p.x - vw / 2, 0, WORLD.width - vw); const camY = clamp(p.y - vh / 2, 0, WORLD.height - vh);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.width, this.height);
    c.fillStyle = '#132b2b'; c.fillRect(0, 0, this.width, this.height);
    c.scale(this.zoom, this.zoom);
    if (game.shake > 0 && !this.reducedMotion) c.translate(Math.sin(now * 100) * 3, Math.cos(now * 90) * 3);
    c.translate(-camX, -camY);
    if (this.arena.complete && this.arena.naturalWidth) c.drawImage(this.arena, 0, 0, WORLD.width, WORLD.height);
    c.fillStyle = '#041b1c33'; c.fillRect(0, 0, WORLD.width, WORLD.height);
    // Traversable floor markings establish scale while the camera follows the runner.
    c.strokeStyle = '#8ad7b510'; c.lineWidth = 1;
    for (let x = Math.floor(camX / 120) * 120; x < camX + vw; x += 120) for (let y = Math.floor(camY / 120) * 120; y < camY + vh; y += 120) { c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.moveTo(x, y - 3); c.lineTo(x, y + 3); c.stroke(); }
    c.strokeStyle = '#9cf0c744'; c.lineWidth = 2; c.setLineDash([14, 12]); c.strokeRect(20, 20, WORLD.width - 40, WORLD.height - 40); c.setLineDash([]);
    c.strokeStyle = '#88dcc51a'; c.lineWidth = 1; c.beginPath(); c.arc(WORLD.width / 2, WORLD.height / 2, 155, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(WORLD.width / 2, WORLD.height / 2, 163, 0, Math.PI * 2); c.stroke();
    const visible = obj => obj.x > camX - 100 && obj.x < camX + vw + 100 && obj.y > camY - 100 && obj.y < camY + vh + 100;
    for (const drop of game.pickups) if (visible(drop)) this.pickup(drop, now);
    for (const fx of game.effects) if (fx.type === 'trail' || fx.type === 'frost' || fx.type === 'explosion') this.effect(fx);
    if (game.state === 'ready') {
      for (let i = 0; i < 15; i++) { const a = i * 2.4; const r = 220 + (i % 4) * 60; this.enemy({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, radius: i % 3 ? 13 : 20, type: i % 3 ? 'drifter' : 'brute', color: i % 3 ? '#91c67b' : '#ad94c7', phase: now + i, tier: 0, hp: 1, maxHp: 1 }); }
    }
    for (const e of game.enemies) if (!e.dead && visible(e)) this.enemy(e);
    this.player(p, now, game);
    for (const shot of game.projectiles) if (visible(shot)) this.projectile(shot);
    for (const fx of game.effects) if (!['trail', 'frost', 'explosion'].includes(fx.type)) this.effect(fx);
    for (const text of game.texts) { c.globalAlpha = Math.min(1, text.life * 3); c.fillStyle = text.color; c.font = 'bold 12px ui-monospace, monospace'; c.textAlign = 'center'; c.fillText(text.text, text.x, text.y); } c.globalAlpha = 1;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const shade = c.createRadialGradient(this.width / 2, this.height / 2, this.width * .1, this.width / 2, this.height / 2, Math.max(this.width, this.height) * .65); shade.addColorStop(0, 'transparent'); shade.addColorStop(1, '#020f1499'); c.fillStyle = shade; c.fillRect(0, 0, this.width, this.height);
    const topShade = c.createLinearGradient(0, 0, 0, 150); topShade.addColorStop(0, '#041216dc'); topShade.addColorStop(1, '#04121600'); c.fillStyle = topShade; c.fillRect(0, 0, this.width, 150);
    if (p.hp < p.maxHp * .3 && game.state === 'playing') { c.strokeStyle = '#ff776c66'; c.lineWidth = 8; c.strokeRect(0, 0, this.width, this.height); }
  }
  ellipse(x, y, rx, ry, color) { const c = this.ctx; c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  circle(x, y, radius, fill, stroke) { const c = this.ctx; c.beginPath(); c.arc(x, y, radius, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.stroke(); } }
  player(p, now, game) {
    const c = this.ctx; const bob = game.state === 'playing' && !this.reducedMotion ? Math.sin(now * 12) * 1.1 : 0;
    this.ellipse(p.x, p.y + 15, 18, 8, '#0007');
    if (p.invincible > 0) { c.globalAlpha = .5 + Math.sin(now * 32) * .2; this.circle(p.x, p.y, 25, '#8ef8c418', '#a9ffd09c'); c.globalAlpha = 1; }
    c.save(); c.translate(p.x, p.y + bob);
    c.lineWidth = 4; c.strokeStyle = '#172b32'; c.fillStyle = '#3a5c64'; c.beginPath(); c.roundRect(-11, 5, 8, 13, 3); c.roundRect(3, 5, 8, 13, 3); c.fill(); c.stroke();
    c.fillStyle = '#80b9ad'; c.beginPath(); c.roundRect(-14, -9, 28, 24, 8); c.fill(); c.stroke();
    this.ellipse(-14, 0, 5, 9, '#416b6c'); this.ellipse(14, 0, 5, 9, '#416b6c');
    c.fillStyle = '#d5e0cc'; c.beginPath(); c.roundRect(-11, -19, 22, 21, 8); c.fill(); c.stroke();
    c.fillStyle = '#10343e'; c.beginPath(); c.roundRect(-9, -13, 18, 8, 3); c.fill(); c.fillStyle = '#9bfff0'; c.fillRect(-6, -11, 12, 3);
    c.fillStyle = '#dbf7cf'; c.fillRect(-3, 4, 6, 4);
    c.rotate(Math.atan2(p.dy, p.dx)); c.fillStyle = '#193440'; c.beginPath(); c.roundRect(9, 3, 21, 8, 3); c.fill(); c.fillStyle = '#8ef8c4'; c.fillRect(26, 4, 5, 5); c.restore();
    const orbit = game.weapons.orbit;
    if (orbit) {
      const r = 54 + orbit * 9; c.strokeStyle = '#efd48c20'; c.lineWidth = 1; this.circle(p.x, p.y, r, null, '#efd48c20');
      for (let i = 0; i < orbit + 1; i++) { const a = game.orbitAngle + i * Math.PI * 2 / (orbit + 1); c.save(); c.translate(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); c.rotate(a + Math.PI / 4); c.shadowBlur = 12; c.shadowColor = '#efd48c'; c.fillStyle = '#fae7b2'; c.beginPath(); c.moveTo(0, -14); c.lineTo(6, 0); c.lineTo(0, 14); c.lineTo(-4, 0); c.closePath(); c.fill(); c.restore(); }
    }
    if (game.state === 'ready') { c.fillStyle = '#a4e5ca'; c.font = '9px ui-monospace, monospace'; c.textAlign = 'center'; c.fillText('RUNNER 07', p.x, p.y + 36); }
  }
  enemy(e) {
    const c = this.ctx; const r = e.radius; const bob = this.reducedMotion ? 0 : Math.sin(e.phase) * 1.5;
    this.ellipse(e.x, e.y + r * .7, r * .9, r * .4, '#0006');
    c.save(); c.translate(e.x, e.y + bob); c.lineWidth = 2;
    if (e.windup > 0) { c.strokeStyle = '#ff8c7488'; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(0, 0); c.lineTo(e.chargeX * 200, e.chargeY * 200); c.stroke(); c.setLineDash([]); this.circle(0, 0, r + 7, null, '#ffad8f'); }
    const color = e.flash > 0 ? '#ffffff' : e.slow > 0 ? '#8cdef3' : e.color;
    if (e.elite || e.type === 'boss') { c.lineWidth = 1.5; this.circle(0, 0, r + 9, null, '#efc58899'); }
    if (e.type === 'skitter' || e.type === 'charger') {
      c.strokeStyle = '#543e30'; c.lineWidth = 3;
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-r * .5, i * 6); c.lineTo(-r - 5, i * 8 + Math.sin(e.phase) * 3); c.moveTo(r * .5, i * 6); c.lineTo(r + 5, i * 8 - Math.sin(e.phase) * 3); c.stroke(); }
      c.fillStyle = color; c.beginPath(); c.moveTo(0, -r * 1.1); c.lineTo(r, r * .25); c.lineTo(r * .5, r); c.lineTo(-r * .5, r); c.lineTo(-r, r * .25); c.closePath(); c.fill(); c.stroke();
    } else if (e.type === 'wisp') {
      c.globalAlpha = .75; this.circle(0, 0, r + 5, '#97c5ff1a'); c.fillStyle = color; c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 1.7, 0, r * .5, r); c.lineTo(0, r * .5); c.lineTo(-r * .6, r * 1.25); c.quadraticCurveTo(-r * 1.5, 0, 0, -r); c.fill(); c.globalAlpha = 1;
    } else if (e.type === 'splitter' || e.type === 'spitter') {
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; this.circle(Math.cos(a) * r * .65, Math.sin(a) * r * .65, r * .48, color, '#214944'); }
      this.circle(0, 0, r * .6, '#375e50'); this.circle(0, -2, r * .3, color);
    } else {
      this.ellipse(-r * .9, r * .12, r * .34, r * .6, color); this.ellipse(r * .9, r * .12, r * .34, r * .6, color);
      c.fillStyle = color; c.strokeStyle = '#283930'; c.beginPath(); c.roundRect(-r * .78, -r * .75, r * 1.56, r * 1.7, r * .4); c.fill(); c.stroke();
      if (e.type === 'brute' || e.type === 'boss') { c.fillStyle = '#49374a'; c.beginPath(); c.moveTo(-r * .8, -r * .1); c.lineTo(-r * .4, -r * 1.3); c.lineTo(0, -r * .7); c.lineTo(r * .4, -r * 1.3); c.lineTo(r * .8, -r * .1); c.fill(); c.fillStyle = '#49374a88'; c.fillRect(-r * .6, r * .3, r * 1.2, r * .22); }
    }
    c.fillStyle = '#1a2826'; c.fillRect(-r * .47, -r * .2, r * .33, r * .24); c.fillRect(r * .15, -r * .2, r * .33, r * .24); c.fillStyle = e.type === 'boss' ? '#fff9d4' : '#fcf8b1'; c.fillRect(-r * .4, -r * .17, Math.max(2, r * .17), Math.max(2, r * .12)); c.fillRect(r * .2, -r * .17, Math.max(2, r * .17), Math.max(2, r * .12));
    if (e.tier > 0) { c.strokeStyle = ['#91c67b', '#e2ca89', '#eda28e', '#e7a0d5'][e.tier]; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r + 4, -.9, -.9 + e.tier * .7); c.stroke(); }
    if (e.hp < e.maxHp && e.type !== 'boss') { c.fillStyle = '#102423'; c.fillRect(-r, -r - 12, r * 2, 3); c.fillStyle = '#e2b895'; c.fillRect(-r, -r - 12, r * 2 * Math.max(0, e.hp / e.maxHp), 3); }
    c.restore();
  }
  pickup(drop, now) {
    const c = this.ctx; const y = drop.y + (this.reducedMotion ? 0 : Math.sin(now * 3 + (drop.phase || 0)) * 2);
    c.save(); c.translate(drop.x, y);
    if (drop.type === 'xp') { c.fillStyle = drop.value >= 4 ? '#d8a6ff' : '#77dcec'; c.strokeStyle = '#c0ffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -5); c.lineTo(4, 0); c.lineTo(0, 6); c.lineTo(-4, 0); c.closePath(); c.fill(); c.stroke(); }
    else { const colors = { heal: '#9df8ad', magnet: '#afbdff', nova: '#ffcf89' }; this.circle(0, 0, 15, '#092827b3', colors[drop.type]); c.fillStyle = colors[drop.type]; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText({ heal: '+', magnet: '◎', nova: '✷' }[drop.type], 0, 0); }
    c.restore();
  }
  projectile(shot) {
    const c = this.ctx;
    if (shot.kind === 'seed') { const h = Math.sin((1 - shot.life / shot.maxLife) * Math.PI) * 65; this.circle(shot.tx, shot.ty, shot.radius, '#ffb88d0a', '#ffb88d44'); this.circle(shot.x, shot.y - h, 6, '#ffe0a8'); return; }
    if (shot.kind === 'hostile') { this.circle(shot.x, shot.y, shot.radius + 3, '#ff7e7422'); this.circle(shot.x, shot.y, shot.radius, '#ff9e77', '#ffd6aa'); return; }
    c.strokeStyle = '#84f5c97c'; c.lineWidth = 4; c.beginPath(); c.moveTo(shot.x, shot.y); c.lineTo(shot.x - shot.vx * .032, shot.y - shot.vy * .032); c.stroke(); this.circle(shot.x, shot.y, 3, '#dcffdf');
  }
  effect(fx) {
    const c = this.ctx; const t = 1 - fx.life / fx.maxLife; c.save(); c.globalAlpha = (1 - t) * .8; c.lineWidth = 2;
    if (fx.type === 'arc') { c.strokeStyle = fx.color; c.shadowBlur = 12; c.shadowColor = fx.color; c.beginPath(); c.moveTo(fx.x, fx.y); const dx = fx.tx - fx.x; const dy = fx.ty - fx.y; for (let i = 1; i < 6; i++) { const offset = (i % 2 ? 1 : -1) * 9; c.lineTo(fx.x + dx * i / 6 + offset, fx.y + dy * i / 6 - offset); } c.lineTo(fx.tx, fx.ty); c.stroke(); }
    else if (fx.type === 'burst' || fx.type === 'spark') { c.fillStyle = fx.color; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const r = fx.radius * t; c.fillRect(fx.x + Math.cos(a) * r, fx.y + Math.sin(a) * r, 3 * (1 - t) + 1, 3 * (1 - t) + 1); } }
    else if (fx.type === 'trail') this.circle(fx.x, fx.y, fx.radius, '#8ef8c455');
    else { this.circle(fx.x, fx.y, fx.radius * Math.min(1, t * 2 + .1), fx.color + (fx.type === 'ring' ? '00' : '20'), fx.color); if (fx.type === 'explosion') this.circle(fx.x, fx.y, fx.radius * t * .7, null, fx.color); }
    c.restore();
  }
}
