import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine.js';
import { ENEMIES, WORLD } from '../src/data.js';
const makeGame = () => { let seed = 17; const game = new Game({ random: () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) }); game.start(); return game; };
const tick = (game, seconds, move = { x: 0, y: 0 }) => { for (let i = 0; i < seconds * 60; i++) game.update(1 / 60, move); };
test('movement is normalized and bounded; pause freezes the entire run', () => {
  const game = makeGame(); tick(game, 1, { x: 1, y: 1 }); assert.ok(Math.abs(Math.hypot(game.player.x - 1200, game.player.y - 900) - 170) < .01);
  game.togglePause(); const before = JSON.stringify(game.snapshot()); tick(game, 2, { x: 1, y: 0 }); assert.equal(JSON.stringify(game.snapshot()), before);
  game.togglePause(); game.player.x = WORLD.width - 26; tick(game, 1, { x: 1, y: 0 }); assert.equal(game.player.x, WORLD.width - 25);
});
test('dash accelerates, grants invulnerability, and has a recharge', () => {
  const game = makeGame(); assert.equal(game.dash(), true); game.damagePlayer(50); assert.equal(game.player.hp, 100); tick(game, .1, { x: 1, y: 0 }); assert.ok(game.player.x > 1250); assert.equal(game.dash(), false); tick(game, 3); assert.equal(game.dash(), true);
});
test('auto-fire kills enemies and drops experience', () => {
  const game = makeGame(); game.spawnClock = 100; const e = game.spawn('drifter', { x: 1300, y: 900 }); tick(game, .4); assert.ok(e.dead); assert.equal(game.kills, 1); assert.equal(game.pickups[0].type, 'xp');
});
test('collecting XP opens unique upgrade choices and selecting resumes the run', () => {
  const game = makeGame(); game.pickups.push({ x: 1200, y: 900, type: 'xp', value: 8 }); tick(game, .1); assert.equal(game.state, 'upgrade'); assert.equal(game.level, 2); assert.equal(game.choices.length, 3); assert.equal(new Set(game.choices.map(x => x.id)).size, 3); assert.ok(game.choices.some(x => x.kind === 'weapon'));
  assert.equal(game.choose(-1), false); const choice = game.choices[0]; assert.equal(game.choose(0), true); assert.equal(game.state, 'playing'); assert.ok(game.player.invincible > 0); assert.equal(choice.kind === 'weapon' ? game.weapons[choice.id] : game.passives[choice.id], choice.target);
});
test('stored XP produces sequential choices without losing overflow', () => {
  const game = makeGame(); game.gainXp(100); const before = game.xp; game.choose(0); assert.equal(game.state, 'upgrade'); assert.equal(game.level, 3); assert.ok(game.xp < before);
});
test('each additional weapon damages enemies through its distinct attack', () => {
  for (const id of ['orbit', 'arc', 'mortar', 'frost']) {
    const game = makeGame(); game.spawnClock = 100; game.cooldowns.pulse = 100; game.weapons[id] = 3;
    const e = game.spawn('brute', { x: 1270, y: 900 }); e.speed = 0; const hp = e.hp; tick(game, 2); assert.ok(e.hp < hp, id);
  }
});
test('health, magnet, and nova supplies apply their advertised effects', () => {
  const game = makeGame(); game.player.hp = 50; game.pickups.push({ type: 'heal', value: 20, x: 1200, y: 900 }); game.updatePickups(.016); assert.equal(game.player.hp, 70);
  game.pickups.push({ type: 'xp', value: 1, x: 1600, y: 900 }, { type: 'magnet', x: 1200, y: 900 }); game.updatePickups(.016); assert.ok(game.pickups.find(x => x.type === 'xp').magnetized);
  const e = game.spawn('brute', { x: 1450, y: 900 }); game.pickups.push({ type: 'nova', x: 1200, y: 900 }); game.updatePickups(.016); assert.ok(e.dead);
});
test('enemy behaviors include ranged fire, charge telegraph, splitting, and mutation tiers', () => {
  const game = makeGame(); game.spawnClock = 100; game.cooldowns.pulse = 100;
  const spitter = game.spawn('spitter', { x: 1410, y: 900 }); spitter.cooldown = 0; game.updateEnemies(.016); assert.ok(game.projectiles.some(p => p.kind === 'hostile'));
  const charger = game.spawn('charger', { x: 1500, y: 900 }); charger.cooldown = 0; game.updateEnemies(.016); assert.ok(charger.windup > 0); for (let i = 0; i < 50; i++) game.updateEnemies(.016); assert.ok(charger.charge > 0);
  const pod = game.spawn('splitter', { x: 1700, y: 900 }); game.hurt(pod, 999); assert.equal(game.enemies.filter(e => e.type === 'skitter').length, 3);
  game.time = 250; const mutated = game.spawn('drifter'); assert.equal(mutated.tier, 3); assert.ok(mutated.hp > ENEMIES.drifter.hp);
});
test('waves escalate, boss spawns once, and extraction requires the boss and timer', () => {
  const game = makeGame(); game.time = 269.99; tick(game, .05); assert.equal(game.wave, 10); assert.equal(game.enemies.filter(e => e.type === 'boss').length, 1);
  game.time = 300; tick(game, .05); assert.equal(game.state, 'playing'); const boss = game.enemies.find(e => e.type === 'boss'); game.hurt(boss, 99999); tick(game, .05); assert.equal(game.state, 'victory');
});
test('death ends the run; restart clears score, enemies, upgrades and clocks', () => {
  const game = makeGame(); game.damagePlayer(200); assert.equal(game.state, 'gameover'); game.start(); assert.equal(game.state, 'playing'); assert.equal(game.player.hp, 100); assert.equal(game.time, 0); assert.equal(game.level, 1); assert.deepEqual(game.enemies, []); assert.equal(game.kills, 0);
});
test('horde and effect limits remain bounded', () => {
  const game = makeGame(); for (let i = 0; i < 500; i++) game.spawn('drifter'); assert.equal(game.enemies.length, 240); game.spawn('boss'); assert.equal(game.enemies.length, 241);
  for (let i = 0; i < 500; i++) game.effect('burst', 1, 1, 4, '#ffffff'); assert.equal(game.effects.length, 240);
});

test('keyboard controls move the simulation, key release stops, and blur clears held input', async () => {
  const { Input } = await import('../src/input.js');
  const documentEvents = new Map(); const windowEvents = new Map();
  const previous = Object.fromEntries(['document','window','HTMLInputElement','HTMLTextAreaElement','HTMLButtonElement'].map(k => [k, globalThis[k]]));
  globalThis.document = { addEventListener: (name, fn) => documentEvents.set(name, fn) };
  globalThis.window = { addEventListener: (name, fn) => windowEvents.set(name, fn) };
  globalThis.HTMLInputElement = class {}; globalThis.HTMLTextAreaElement = class {}; globalThis.HTMLButtonElement = class {};
  try {
    const surface = { addEventListener() {}, focus() {} };
    const input = new Input({ canvas: surface, joystick: surface, stick: { style: {} }, onDash() {}, onPause() {}, onChoice() {} });
    const game = makeGame(); const event = key => ({ key, target: {}, preventDefault() {}, repeat: false });
    documentEvents.get('keydown')(event('d')); tick(game, .5, input.movement()); assert.ok(game.player.x > 1280);
    documentEvents.get('keyup')(event('d')); const x = game.player.x; tick(game, .5, input.movement()); assert.equal(game.player.x, x);
    documentEvents.get('keydown')(event('ArrowUp')); tick(game, .5, input.movement()); assert.ok(game.player.y < 820);
    windowEvents.get('blur')(); assert.deepEqual(input.movement(), { x: 0, y: 0 });
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});
