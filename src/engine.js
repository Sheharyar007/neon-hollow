import { WORLD, ENEMIES, WEAPONS, PASSIVES, clamp } from './data.js';
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// The simulation owns all combat state and has no browser dependencies.
export class Game {
  constructor({ random = Math.random, onEvent = () => {} } = {}) {
    this.random = random;
    this.onEvent = onEvent;
    this.reset();
  }
  reset() {
    this.state = 'ready'; this.time = 0; this.wave = 1; this.kills = 0; this.score = 0;
    this.player = { x: WORLD.width / 2, y: WORLD.height / 2, hp: 100, maxHp: 100, radius: 13, speed: 170, invincible: 0, dashTime: 0, dashCooldown: 0, dx: 0, dy: 1 };
    this.weapons = { pulse: 1, orbit: 0, arc: 0, mortar: 0, frost: 0 };
    this.passives = { power: 0, haste: 0, speed: 0, magnet: 0, vitality: 0 };
    this.cooldowns = { pulse: 0, arc: 0, mortar: 0, frost: 0 };
    this.enemies = []; this.projectiles = []; this.pickups = []; this.effects = []; this.texts = [];
    this.level = 1; this.xp = 0; this.nextXp = 8; this.choices = []; this.spawnClock = 0; this.supplyClock = 12;
    this.bossSpawned = false; this.bossDefeated = false; this.nextId = 1; this.orbitAngle = 0;
    this.viewport = { width: 1000, height: 650 }; this.shake = 0;
  }
  start() { this.reset(); this.state = 'playing'; this.onEvent('start'); }
  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; this.onEvent('pause'); }
    else if (this.state === 'paused') { this.state = 'playing'; this.onEvent('resume'); }
  }
  dash() {
    const p = this.player;
    if (this.state !== 'playing' || p.dashCooldown > 0) return false;
    p.dashTime = .2; p.invincible = .35; p.dashCooldown = 3 - this.passives.speed * .2;
    this.effect('ring', p.x, p.y, 45, '#8ef8c4', .3); this.onEvent('dash'); return true;
  }
  damageMultiplier() { return 1 + .2 * this.passives.power; }
  effect(type, x, y, radius, color, life = .4, extra = {}) {
    if (this.effects.length < 240) this.effects.push({ type, x, y, radius, color, life, maxLife: life, ...extra });
  }
  nearest(point, range = Infinity, exclude = new Set()) {
    let nearest = null; let best = range;
    for (const enemy of this.enemies) {
      if (enemy.dead || exclude.has(enemy.id)) continue;
      const d = distance(point, enemy);
      if (d < best) { best = d; nearest = enemy; }
    }
    return nearest;
  }
  spawn(type, position, elite = false) {
    if (this.enemies.length >= 240 && type !== 'boss') return;
    const base = ENEMIES[type];
    const tier = Math.min(3, Math.floor(this.time / 80));
    let x; let y;
    if (position) { ({ x, y } = position); }
    else {
      // Enter just beyond the camera edges, independent of screen aspect ratio.
      const a = this.random() * Math.PI * 2;
      const rx = this.viewport.width / 2 + 65; const ry = this.viewport.height / 2 + 65;
      x = clamp(this.player.x + Math.cos(a) * rx, 25, WORLD.width - 25);
      y = clamp(this.player.y + Math.sin(a) * ry, 25, WORLD.height - 25);
      if (distance({ x, y }, this.player) < 240) {
        x = clamp(this.player.x + (this.player.x < WORLD.width / 2 ? 1 : -1) * rx, 25, WORLD.width - 25);
        y = clamp(this.player.y + Math.sin(a) * ry, 25, WORLD.height - 25);
      }
    }
    const multiplier = type === 'boss' ? 1 : (1 + tier * .38) * (elite ? 4 : 1);
    const enemy = { ...base, type, id: this.nextId++, x, y, hp: base.hp * multiplier, maxHp: base.hp * multiplier, radius: base.radius * (elite ? 1.45 : 1), damage: base.damage * (1 + tier * .13), speed: base.speed * (1 + tier * .08), xp: base.xp * (elite ? 7 : 1), elite, tier, phase: this.random() * 6.28, cooldown: 1 + this.random() * 2, slow: 0, flash: 0, orbitHit: 0, charge: 0 };
    this.enemies.push(enemy); return enemy;
  }
  hurt(enemy, amount, x = this.player.x, y = this.player.y, knockback = 6) {
    if (enemy.dead) return;
    enemy.hp -= amount; enemy.flash = .1;
    const d = Math.max(1, Math.hypot(enemy.x - x, enemy.y - y));
    if (enemy.type !== 'boss') { enemy.x += (enemy.x - x) / d * knockback; enemy.y += (enemy.y - y) / d * knockback; }
    if (this.texts.length < 55 && (amount > 25 || this.random() < .16)) this.texts.push({ x: enemy.x, y: enemy.y - 15, text: Math.round(amount), life: .6, color: '#e6f2da' });
    if (enemy.hp > 0) return;
    enemy.dead = true; this.kills++; this.score += Math.round(enemy.maxHp * 2);
    this.effect('burst', enemy.x, enemy.y, enemy.radius * 1.4, enemy.color, .35);
    this.pickups.push({ x: enemy.x, y: enemy.y, type: 'xp', value: enemy.xp, radius: 5, phase: this.random() * 6 });
    if (enemy.type === 'splitter') {
      for (let i = 0; i < 3; i++) this.spawn('skitter', { x: enemy.x + (i - 1) * 18, y: enemy.y + 12 });
    }
    if (enemy.type === 'boss') { this.bossDefeated = true; this.onEvent('bossDefeated'); this.pickups.push({ x: enemy.x, y: enemy.y, type: 'heal', value: 45, radius: 10 }); }
    else if (enemy.elite || this.random() < .014) this.pickups.push({ x: enemy.x + 12, y: enemy.y, type: 'heal', value: 20, radius: 10 });
    this.onEvent('kill');
  }
  damagePlayer(amount) {
    const p = this.player;
    if (p.invincible > 0 || this.state !== 'playing') return;
    p.hp = Math.max(0, p.hp - amount); p.invincible = .7; this.shake = .18;
    this.effect('ring', p.x, p.y, 38, '#ff776c', .3); this.onEvent('hurt');
    if (p.hp <= 0) this.finish(false);
  }
  finish(won) {
    if (!['playing', 'upgrade'].includes(this.state)) return;
    this.state = won ? 'victory' : 'gameover'; this.score += Math.floor(this.time) * 10 + (won ? 5000 : 0); this.onEvent('finish');
  }
  gainXp(amount) {
    this.xp += amount;
    if (this.xp >= this.nextXp && this.state === 'playing') this.levelUp();
  }
  levelUp() {
    this.xp -= this.nextXp; this.level++; this.nextXp = Math.floor(8 + this.level * 4.2);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 5);
    this.state = 'upgrade'; this.choices = this.rollChoices(); this.onEvent('upgrade');
  }
  rollChoices() {
    const options = [];
    for (const [id, weapon] of Object.entries(WEAPONS)) {
      const level = this.weapons[id];
      if (level < 5) options.push({ id, kind: 'weapon', ...weapon, target: level + 1, detail: level === 0 ? weapon.description : this.upgradeDescription(id, level + 1) });
    }
    for (const [id, passive] of Object.entries(PASSIVES)) if (this.passives[id] < passive.max) options.push({ id, kind: 'passive', ...passive, target: this.passives[id] + 1, detail: passive.description });
    for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
    // Early choices always include a new weapon; later choices keep one weapon upgrade available.
    let weaponIndex = this.level <= 4 ? options.findIndex(x => x.kind === 'weapon' && this.weapons[x.id] === 0) : -1;
    if (weaponIndex < 0) weaponIndex = options.findIndex(x => x.kind === 'weapon');
    if (weaponIndex > 2) [options[0], options[weaponIndex]] = [options[weaponIndex], options[0]];
    return options.length ? options.slice(0, 3) : [{ id: 'restore', name: 'Second wind', icon: '♡', kind: 'supply', target: 1, detail: 'Restore 50 health and gain 500 score.' }];
  }
  upgradeDescription(id, level) {
    return { pulse: `${level >= 3 ? 'Extra bolts. ' : ''}Stronger, faster shots with ${level >= 4 ? 'armor-piercing energy.' : 'improved damage.'}`, orbit: `${level + 1} blades orbit farther out and deal more damage.`, arc: `Lightning chains through ${level + 2} targets with increased damage.`, mortar: `A larger blast and increased damage. ${level >= 4 ? 'Fires two seeds.' : 'Shorter firing delay.'}`, frost: `A wider freezing pulse deals more damage and slows for longer.` }[id];
  }
  choose(index) {
    if (this.state !== 'upgrade' || !Number.isInteger(index) || !this.choices[index]) return false;
    const choice = this.choices[index];
    if (choice.kind === 'weapon') this.weapons[choice.id] = choice.target;
    else if (choice.kind === 'passive') { this.passives[choice.id] = choice.target; if (choice.id === 'vitality') { this.player.maxHp += 25; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40); } }
    else { this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50); this.score += 500; }
    this.state = 'playing'; this.player.invincible = 1.3; this.choices = []; this.onEvent('chosen');
    if (this.xp >= this.nextXp) this.levelUp();
    return true;
  }
  update(dt, movement = { x: 0, y: 0 }) {
    if (this.state !== 'playing') return;
    dt = clamp(dt, 0, .05); this.time += dt;
    const p = this.player;
    p.invincible = Math.max(0, p.invincible - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt); p.dashTime = Math.max(0, p.dashTime - dt); this.shake = Math.max(0, this.shake - dt);
    const length = Math.hypot(movement.x, movement.y);
    if (length > .05) { p.dx = movement.x / length; p.dy = movement.y / length; }
    const speed = p.speed * (1 + this.passives.speed * .1);
    if (length > .05 || p.dashTime > 0) {
      const scale = p.dashTime > 0 ? 3.8 : Math.min(1, length);
      p.x = clamp(p.x + p.dx * speed * dt * scale, 25, WORLD.width - 25);
      p.y = clamp(p.y + p.dy * speed * dt * scale, 25, WORLD.height - 25);
      if (p.dashTime > 0) this.effect('trail', p.x, p.y, 12, '#8ef8c4', .22);
    }
    const wave = Math.min(10, Math.floor(this.time / 30) + 1);
    if (wave !== this.wave) { this.wave = wave; this.onEvent('wave'); if ([4, 7, 9].includes(wave)) this.spawn('brute', null, true); }
    if (this.time >= 270 && !this.bossSpawned) { this.bossSpawned = true; this.spawn('boss'); this.onEvent('boss'); }
    if (this.time >= WORLD.duration && this.bossDefeated) { this.finish(true); return; }
    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      const available = Object.entries(ENEMIES).filter(([type, data]) => type !== 'boss' && data.unlock <= this.time);
      const count = 1 + Math.floor(this.wave / 3);
      for (let i = 0; i < count; i++) {
        const type = this.random() < .36 ? 'drifter' : available[Math.floor(this.random() * available.length)][0]; this.spawn(type);
      }
      this.spawnClock += Math.max(.22, .65 - this.wave * .028);
    }
    this.supplyClock -= dt;
    if (this.supplyClock <= 0) {
      this.supplyClock = 20;
      const angle = this.random() * 6.28; const type = this.random() < .6 ? 'magnet' : 'nova';
      this.pickups.push({ x: clamp(p.x + Math.cos(angle) * 200, 40, WORLD.width - 40), y: clamp(p.y + Math.sin(angle) * 200, 40, WORLD.height - 40), type, radius: 11 });
    }
    this.updateWeapons(dt);
    this.updateEnemies(dt);
    if (this.state !== 'playing') return;
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.enemies = this.enemies.filter(e => !e.dead);
    this.effects = this.effects.filter(e => (e.life -= dt) > 0);
    this.texts = this.texts.filter(e => { e.y -= dt * 25; return (e.life -= dt) > 0; });
  }
  updateWeapons(dt) {
    const p = this.player; const mult = this.damageMultiplier(); const haste = 1 + this.passives.haste * .12;
    for (const id of Object.keys(this.cooldowns)) this.cooldowns[id] -= dt;
    const pulse = this.weapons.pulse;
    if (this.cooldowns.pulse <= 0) {
      const target = this.nearest(p, 340);
      if (target) {
        const angle = Math.atan2(target.y - p.y, target.x - p.x); const count = 1 + Math.floor(pulse / 3);
        for (let i = 0; i < count; i++) this.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(angle + (i - (count - 1) / 2) * .16) * 490, vy: Math.sin(angle + (i - (count - 1) / 2) * .16) * 490, radius: 4, damage: (19 + pulse * 8) * mult, life: 1.5, kind: 'bolt', hits: new Set(), pierce: pulse >= 4 ? 2 : 1 });
        this.cooldowns.pulse = Math.max(.15, .57 - pulse * .055) / haste; this.onEvent('shot');
      }
    }
    this.orbitAngle += dt * (1.8 + haste * .6);
    const orbit = this.weapons.orbit;
    if (orbit) {
      const count = orbit + 1; const radius = 54 + orbit * 9;
      for (const e of this.enemies) {
        e.orbitHit = Math.max(0, e.orbitHit - dt);
        if (e.dead || e.orbitHit > 0 || distance(e, p) > radius + e.radius + 13) continue;
        for (let i = 0; i < count; i++) { const a = this.orbitAngle + i * Math.PI * 2 / count; const blade = { x: p.x + Math.cos(a) * radius, y: p.y + Math.sin(a) * radius }; if (distance(e, blade) < e.radius + 12) { this.hurt(e, (16 + orbit * 8) * mult); e.orbitHit = .35; break; } }
      }
    }
    const arc = this.weapons.arc;
    if (arc && this.cooldowns.arc <= 0) {
      let current = this.nearest(p, 370); let from = p; const hit = new Set();
      if (current) {
        for (let i = 0; i < arc + 2 && current; i++) {
          hit.add(current.id); this.effect('arc', from.x, from.y, 0, '#b1c8ff', .22, { tx: current.x, ty: current.y }); this.hurt(current, (24 + arc * 13) * mult); from = current; current = this.nearest(from, 180, hit);
        }
        this.cooldowns.arc = (2.15 - arc * .16) / haste; this.onEvent('arc');
      }
    }
    const mortar = this.weapons.mortar;
    if (mortar && this.cooldowns.mortar <= 0) {
      const target = this.nearest(p, 630);
      if (target) {
        for (let i = 0; i < (mortar >= 4 ? 2 : 1); i++) { const tx = target.x + i * 65; const ty = target.y; this.projectiles.push({ kind: 'seed', x: p.x, y: p.y, sx: p.x, sy: p.y, tx, ty, life: .65, maxLife: .65, radius: 75 + mortar * 13, damage: (40 + mortar * 22) * mult }); }
        this.cooldowns.mortar = (3 - mortar * .22) / haste;
      }
    }
    const frost = this.weapons.frost;
    if (frost && this.cooldowns.frost <= 0) {
      const radius = 90 + frost * 22;
      this.effect('frost', p.x, p.y, radius, '#8bdcec', .6);
      for (const e of this.enemies) if (!e.dead && distance(e, p) < radius + e.radius) { e.slow = 2 + frost * .3; this.hurt(e, (14 + frost * 12) * mult, p.x, p.y, 14); }
      this.cooldowns.frost = (3.5 - frost * .2) / haste;
    }
  }
  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt); e.slow = Math.max(0, e.slow - dt); e.cooldown -= dt; e.phase += dt * 4;
      const d = Math.max(1, distance(e, p)); let dx = (p.x - e.x) / d; let dy = (p.y - e.y) / d;
      let speed = e.speed * (e.slow > 0 ? .42 : 1);
      if (e.type === 'spitter' && d < 280) {
        speed *= d < 180 ? -.6 : .08;
        if (e.cooldown <= 0) { this.enemyShot(e, dx, dy, 145); e.cooldown = 2.6; }
      }
      if (e.type === 'wisp') { const a = Math.atan2(dy, dx) + Math.sin(e.phase * .7) * .8; dx = Math.cos(a); dy = Math.sin(a); }
      if (e.type === 'charger') {
        if (e.charge > 0) { e.charge -= dt; dx = e.chargeX; dy = e.chargeY; speed *= 3.8; }
        else if (e.cooldown <= 0 && d < 450) { if (!e.windup) { e.windup = .7; e.chargeX = dx; e.chargeY = dy; } e.windup -= dt; speed = 0; if (e.windup <= 0) { e.charge = .55; e.windup = 0; e.cooldown = 3.2; } }
      }
      if (e.type === 'boss' && e.cooldown <= 0) {
        for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + e.phase * .1; this.enemyShot(e, Math.cos(a), Math.sin(a), 120); }
        for (let i = 0; i < 4; i++) this.spawn('skitter', { x: e.x + Math.cos(i * 1.57) * 65, y: e.y + Math.sin(i * 1.57) * 65 });
        this.effect('ring', e.x, e.y, 100, '#ffb479', .5); e.cooldown = 3;
      }
      e.x = clamp(e.x + dx * speed * dt, 10, WORLD.width - 10); e.y = clamp(e.y + dy * speed * dt, 10, WORLD.height - 10);
      if (distance(e, p) < e.radius + p.radius - 3) this.damagePlayer(e.damage);
      if (this.state !== 'playing') return;
    }
  }
  enemyShot(e, dx, dy, speed) {
    if (this.projectiles.length < 400) this.projectiles.push({ kind: 'hostile', x: e.x, y: e.y, vx: dx * speed, vy: dy * speed, radius: e.type === 'boss' ? 7 : 5, damage: e.damage, life: 5 });
  }
  updateProjectiles(dt) {
    for (const shot of this.projectiles) {
      shot.life -= dt;
      if (shot.kind === 'seed') {
        const t = 1 - shot.life / shot.maxLife; shot.x = shot.sx + (shot.tx - shot.sx) * t; shot.y = shot.sy + (shot.ty - shot.sy) * t;
        if (shot.life <= 0) { this.effect('explosion', shot.tx, shot.ty, shot.radius, '#ffb88d', .55); for (const e of this.enemies) if (!e.dead && distance(e, { x: shot.tx, y: shot.ty }) < shot.radius + e.radius) this.hurt(e, shot.damage, shot.tx, shot.ty, 20); this.onEvent('boom'); }
        continue;
      }
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      if (shot.kind === 'hostile') { if (distance(shot, this.player) < shot.radius + this.player.radius) { this.damagePlayer(shot.damage); shot.life = 0; } }
      else for (const e of this.enemies) {
        if (e.dead || shot.hits.has(e.id)) continue;
        if (distance(shot, e) < shot.radius + e.radius) { this.hurt(e, shot.damage, shot.x - shot.vx * dt, shot.y - shot.vy * dt); shot.hits.add(e.id); this.effect('spark', shot.x, shot.y, 10, '#b4ffd8', .2); if (shot.hits.size >= shot.pierce) { shot.life = 0; break; } }
      }
    }
    this.projectiles = this.projectiles.filter(s => s.life > 0);
  }
  updatePickups(dt) {
    const p = this.player; const range = 63 * (1 + this.passives.magnet * .45);
    for (const drop of this.pickups) {
      const d = Math.max(1, distance(drop, p));
      if (d < (drop.type === 'xp' ? range : 40) || drop.magnetized) { const speed = drop.magnetized ? 650 : 270; drop.x += (p.x - drop.x) / d * Math.min(d, dt * speed); drop.y += (p.y - drop.y) / d * Math.min(d, dt * speed); }
      if (distance(drop, p) < 20) {
        drop.collected = true;
        if (drop.type === 'xp') { this.gainXp(drop.value); this.onEvent('xp'); }
        else if (drop.type === 'heal') { p.hp = Math.min(p.maxHp, p.hp + drop.value); this.onEvent('heal'); }
        else if (drop.type === 'magnet') { for (const other of this.pickups) if (other.type === 'xp') other.magnetized = true; this.onEvent('magnet'); }
        else if (drop.type === 'nova') { for (const e of this.enemies) if (distance(e, p) < 800) this.hurt(e, 200 * this.damageMultiplier(), p.x, p.y, 30); this.effect('explosion', p.x, p.y, 650, '#efdda5', .8); this.onEvent('nova'); }
      }
    }
    this.pickups = this.pickups.filter(d => !d.collected);
    // Consolidate distant XP instead of dropping earned experience during long runs.
    if (this.pickups.length > 500) { const gems = this.pickups.filter(d => d.type === 'xp'); const merge = gems.slice(0, 100); const ids = new Set(merge); this.pickups = this.pickups.filter(d => !ids.has(d)); this.pickups.push({ ...merge[0], value: merge.reduce((sum, d) => sum + d.value, 0) }); }
  }
  snapshot() {
    return { state: this.state, time: this.time, wave: this.wave, health: this.player.hp, maxHealth: this.player.maxHp, level: this.level, xp: this.xp, nextXp: this.nextXp, kills: this.kills, score: this.score, enemies: this.enemies.filter(e => !e.dead).length, position: { x: this.player.x, y: this.player.y }, weapons: { ...this.weapons }, choices: this.choices.map((x, index) => ({ index, name: x.name, detail: x.detail })), bossDefeated: this.bossDefeated };
  }
}
