import { Game } from './engine.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { WEAPONS, WAVE_NAMES, clockText } from './data.js';

const $ = id => document.getElementById(id);
const canvas = $('game'); const overlay = $('overlay'); const audio = new Audio();
let highScore = 0;
try { highScore = Number(localStorage.getItem('neon-hollow-best')) || 0; } catch { /* Local scores are optional when storage is disabled. */ }
let renderedState = ''; let lastHud = 0; let bannerUntil = 0; let newRecord = false;
const game = new Game({ onEvent(event) {
  audio.play(event);
  if (['wave', 'boss', 'bossDefeated', 'magnet', 'nova', 'heal'].includes(event)) showBanner(event);
  if (event === 'finish') {
    newRecord = game.score > highScore;
    highScore = Math.max(highScore, game.score);
    try { localStorage.setItem('neon-hollow-best', String(highScore)); } catch { /* A blocked storage write must not interrupt the run. */ }
  }
} });
const renderer = new Renderer(canvas);
const input = new Input({ canvas, joystick: $('joystick'), stick: $('stick'), onDash: () => game.dash(), onPause: () => game.togglePause(), onChoice: index => choose(index) });
new ResizeObserver(() => renderer.resize()).observe(canvas);
function start() { input.clear(); game.start(); renderer.draw(game, 0); showBanner('wave'); renderState(); canvas.focus({ preventScroll: true }); }
function choose(index) { if (game.choose(index)) { input.clear(); renderedState = ''; renderState(); if (game.state === 'playing') canvas.focus({ preventScroll: true }); } }
function resume() { game.togglePause(); renderState(); canvas.focus({ preventScroll: true }); }
$('sound').addEventListener('click', () => { const enabled = audio.toggle(); $('sound').innerHTML = `♪ <span>Sound ${enabled ? 'on' : 'off'}</span>`; $('sound').setAttribute('aria-pressed', String(enabled)); $('sound').setAttribute('aria-label', `${enabled ? 'Disable' : 'Enable'} sound`); if (game.state === 'playing') canvas.focus({ preventScroll: true }); });
$('pause').addEventListener('click', () => { game.togglePause(); renderState(); });
$('dash').addEventListener('pointerdown', e => { e.preventDefault(); game.dash(); });
$('dash').addEventListener('click', () => game.dash());
window.addEventListener('blur', () => { if (game.state === 'playing') game.togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'playing') game.togglePause(); });
function showBanner(event) {
  const copy = { wave: [`WAVE ${String(game.wave).padStart(2, '0')}`, WAVE_NAMES[game.wave - 1]], boss: ['KEEPER APPROACHING', 'Defeat the Keeper. Reach 05:00 to extract.'], bossDefeated: ['KEEPER DOWN', 'Stay alive until extraction at 05:00'], magnet: ['SIGNAL MAGNET', 'All experience drawn to you'], nova: ['SOLAR NOVA', 'The horde breaks'], heal: ['INTEGRITY RESTORED', 'Keep moving'] }[event];
  if (!copy) return;
  $('wave-banner').innerHTML = `${copy[0]}<small>${copy[1]}</small>`; bannerUntil = performance.now() + 2600; $('announcer').textContent = copy.join('. ');
}
function renderState() {
  if (renderedState === game.state) return;
  renderedState = game.state;
  const modal = ['paused', 'upgrade', 'gameover', 'victory', 'ready'].includes(game.state);
  overlay.hidden = !modal; $('pause').disabled = !['playing', 'paused'].includes(game.state);
  $('pause').innerHTML = game.state === 'paused' ? '▷ <span>Resume</span>' : 'Ⅱ <span>Pause</span>';
  $('pause').setAttribute('aria-label', game.state === 'paused' ? 'Resume game' : 'Pause game');
  $('touch-controls').hidden = game.state !== 'playing';
  $('mission-status').textContent = { ready: 'Awaiting deployment', playing: 'Extraction at 05:00 · Defeat the Keeper', paused: 'Run paused', upgrade: 'Signal found · Choose an upgrade', gameover: 'Signal lost', victory: 'Extraction complete' }[game.state];
  canvas.setAttribute('aria-hidden', String(modal)); canvas.tabIndex = modal ? -1 : 0;
  if (!modal) { overlay.innerHTML = ''; return; }
  input.clear();
  if (game.state === 'ready') overlay.innerHTML = `<div class="start-layout" role="dialog" aria-modal="true" aria-labelledby="start-title"><div><div class="eyebrow">A FIVE-MINUTE FIGHT FOR DAYLIGHT</div><h1 id="start-title">NEON<br><em>HOLLOW.</em></h1><p class="intro">The signal is fading. The roots are waking.<br>Build your arsenal. Survive the swarm.<br>Make it to extraction.</p><button id="start" class="primary">Enter the Hollow <span>↗</span></button><p class="under-button">5 MINUTES · 10 WAVES · ONE WAY OUT</p></div><aside class="briefing"><div class="briefing-head"><span>MISSION BRIEF</span><span>07 / LIVE</span></div><h2>Stay in motion.</h2><p>Your weapons fire automatically.<br>You decide where the fight goes.</p><div class="briefing-row"><span class="num">01</span><div><strong>Move & evade</strong><small>WASD / arrows or the touch stick. Space to dash.</small></div></div><div class="briefing-row"><span class="num">02</span><div><strong>Collect & evolve</strong><small>Gather blue shards. Choose your upgrades.</small></div></div><div class="briefing-row"><span class="num">03</span><div><strong>Break the cycle</strong><small>Defeat the Keeper and survive five minutes.</small></div></div><div class="best"><span>PERSONAL BEST</span><strong>${highScore.toLocaleString()} PTS</strong></div></aside></div>`;
  if (game.state === 'paused') overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pause-title"><div class="eyebrow">SIGNAL ON STANDBY</div><h2 id="pause-title">Take a breath.</h2><p>The Hollow can wait. Your run is paused.<br>WASD / arrows to move · Space to dash · Weapons fire automatically.</p><button id="resume" class="primary">Resume run <span>↗</span></button><button id="restart-confirm" class="secondary">Restart run</button></div>`;
  if (game.state === 'upgrade') overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title"><div class="eyebrow">LEVEL ${String(game.level).padStart(2, '0')} · SIGNAL AMPLIFIED</div><h2 id="upgrade-title">Adapt. Then advance.</h2><p>Choose one upgrade. The horde is on hold.</p><div class="choices">${game.choices.map((choice, i) => `<button class="choice" data-choice="${i}"><span class="choice-icon" aria-hidden="true">${choice.icon}</span><span class="choice-type">${choice.kind === 'weapon' ? game.weapons[choice.id] ? `WEAPON UPGRADE · LV ${choice.target}` : 'NEW WEAPON' : 'SURVIVAL UPGRADE'}</span><strong>${choice.name}</strong><p>${choice.detail}</p><span class="choice-hint">SELECT UPGRADE <span aria-hidden="true">↗</span> <kbd>${i + 1}</kbd></span></button>`).join('')}</div></div>`;
  if (['gameover', 'victory'].includes(game.state)) overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="result-title"><div class="eyebrow">${game.state === 'victory' ? 'MISSION COMPLETE' : 'CONNECTION LOST'}</div><h2 id="result-title">${game.state === 'victory' ? 'You found the daylight.' : 'The Hollow remembers.'}</h2><p>${game.state === 'victory' ? 'The Keeper has fallen. Your signal made it home.' : 'A different route. A stronger build. One more run.'}${newRecord ? '<br><strong style="color:var(--gold)">New personal best</strong>' : ''}</p><div class="result-stats"><div><strong>${clockText(game.time)}</strong><span>SURVIVED</span></div><div><strong>${game.kills}</strong><span>ELIMINATED</span></div><div><strong>${game.score.toLocaleString()}</strong><span>SCORE</span></div></div><button id="restart" class="primary">${game.state === 'victory' ? 'Return to the Hollow' : 'Try another run'} <span>↻</span></button></div>`;
  $('start')?.addEventListener('click', start); $('resume')?.addEventListener('click', resume); $('restart')?.addEventListener('click', start);
  $('restart-confirm')?.addEventListener('click', () => { overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="eyebrow">RESET THIS RUN?</div><h2 id="confirm-title">Start fresh?</h2><p>Your current run will end. Your personal best stays saved.</p><button id="confirm-restart" class="primary">Restart run <span>↻</span></button><button id="keep-playing" class="secondary">Keep this run</button></div>`; $('confirm-restart').addEventListener('click', start); $('keep-playing').addEventListener('click', () => { renderedState = ''; renderState(); }); $('keep-playing').focus(); });
  overlay.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => choose(Number(button.dataset.choice))));
  overlay.querySelector('button')?.focus({ preventScroll: true });
  $('announcer').textContent = { ready: 'Ready to enter the Hollow.', paused: 'Game paused.', upgrade: `Level ${game.level}. Choose an upgrade.`, gameover: `Run ended. Score ${game.score}.`, victory: `Extraction complete. Score ${game.score}.` }[game.state];
}
// Keep keyboard focus within active dialogs, including sound and pause controls being outside them.
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab' || overlay.hidden) return;
  const buttons = [...overlay.querySelectorAll('button:not(:disabled)')]; const first = buttons[0]; const last = buttons.at(-1);
  if (!overlay.contains(document.activeElement)) { e.preventDefault(); first?.focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
});
function updateHud() {
  const p = game.player;
  $('health-label').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`; $('health-bar').style.width = `${p.hp / p.maxHp * 100}%`;
  $('timer').textContent = clockText(game.time); $('wave').textContent = `WAVE ${String(game.wave).padStart(2, '0')} / 10`;
  $('kills').textContent = game.kills; $('score').textContent = String(game.score).padStart(5, '0');
  $('level').textContent = `LV ${String(game.level).padStart(2, '0')}`; $('xp-label').textContent = `${Math.floor(game.xp)} / ${game.nextXp} XP`; $('xp-bar').style.width = `${Math.min(100, game.xp / game.nextXp * 100)}%`;
  $('dash-status').innerHTML = `SPACE <span>${p.dashCooldown > 0 ? `${p.dashCooldown.toFixed(1)}s RECHARGE` : 'DASH READY'}</span>`;
  $('dash').style.opacity = p.dashCooldown > 0 ? '.45' : '1'; $('dash').setAttribute('aria-label', p.dashCooldown > 0 ? `Dash recharging, ${Math.ceil(p.dashCooldown)} seconds` : 'Dash ready');
  const boss = game.enemies.find(e => e.type === 'boss' && !e.dead); $('boss-hud').hidden = !boss;
  if (boss) $('boss-bar').style.width = `${boss.hp / boss.maxHp * 100}%`;
  const slots = Object.entries(game.weapons).filter(([, level]) => level > 0).map(([id, level]) => `<div class="weapon-slot" title="${WEAPONS[id].name}, level ${level}" aria-label="${WEAPONS[id].name}, level ${level}"><span aria-hidden="true">${WEAPONS[id].icon}</span><small>${WEAPONS[id].name}<span>LEVEL ${level} / 5</span></small></div>`);
  while (slots.length < 5) slots.push('<div class="weapon-slot empty" aria-label="Locked weapon slot">+</div>');
  const markup = slots.join(''); if ($('weapon-slots').innerHTML !== markup) $('weapon-slots').innerHTML = markup;
}
let last = performance.now(); let accumulator = 0;
function frame(now) {
  const elapsed = Math.min((now - last) / 1000, .1); last = now;
  if (game.state === 'playing') { accumulator += elapsed; while (accumulator >= 1 / 60) { game.update(1 / 60, input.movement()); accumulator -= 1 / 60; if (game.state !== 'playing') { accumulator = 0; break; } } } else accumulator = 0;
  renderState(); renderer.draw(game, now / 1000);
  $('wave-banner').classList.toggle('visible', now < bannerUntil && game.state === 'playing');
  if (now - lastHud > 80) { updateHud(); lastHud = now; }
  requestAnimationFrame(frame);
}
renderState(); updateHud(); requestAnimationFrame(frame);

// Read-only state makes local QA observable without giving normal play cheat controls.
window.neonHollow = Object.freeze({ snapshot: () => game.snapshot() });
// Optional WebMCP surface shares the same pause and upgrade actions as the interface.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const register = tool => { try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser capability. */ } };
  register({ name: 'read_neon_hollow_run', description: 'Read the current survival run and offered upgrades.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => game.snapshot() });
  register({ name: 'choose_neon_hollow_upgrade', description: 'Select an offered upgrade by zero-based index and resume the current run.', inputSchema: { type: 'object', properties: { index: { type: 'integer', minimum: 0, maximum: 2 } }, required: ['index'], additionalProperties: false }, execute: input => { if (!input || Object.keys(input).some(k => k !== 'index') || !Number.isInteger(input.index) || game.state !== 'upgrade' || !game.choices[input.index]) throw new Error('Choose an available upgrade index while the upgrade menu is open.'); choose(input.index); updateHud(); return game.snapshot(); } });
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
