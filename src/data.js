export const WORLD = { width: 2400, height: 1800, duration: 300 };
export const ENEMIES = {
  drifter: { name: 'Drifter', hp: 20, speed: 45, radius: 13, damage: 9, xp: 1, color: '#91c67b', unlock: 0 },
  skitter: { name: 'Skitter', hp: 12, speed: 96, radius: 9, damage: 7, xp: 1, color: '#edb87f', unlock: 22 },
  brute: { name: 'Bramble brute', hp: 100, speed: 31, radius: 23, damage: 19, xp: 4, color: '#ad94c7', unlock: 43 },
  spitter: { name: 'Spore caster', hp: 38, speed: 40, radius: 14, damage: 11, xp: 2, color: '#c6de79', unlock: 62 },
  charger: { name: 'Rift hound', hp: 46, speed: 59, radius: 15, damage: 16, xp: 2, color: '#fa9981', unlock: 91 },
  splitter: { name: 'Brood pod', hp: 57, speed: 43, radius: 18, damage: 13, xp: 3, color: '#88d8cf', unlock: 123 },
  wisp: { name: 'Phase wisp', hp: 27, speed: 76, radius: 12, damage: 10, xp: 2, color: '#9bc8ff', unlock: 151 },
  boss: { name: 'Hollow Keeper', hp: 3800, speed: 32, radius: 48, damage: 25, xp: 25, color: '#ffb479', unlock: 270 },
};
export const WEAPONS = {
  pulse: { name: 'Pulse repeater', icon: '⌁', color: '#91f7d1', description: 'Guided bolts seek the nearest threat.' },
  orbit: { name: 'Halo blades', icon: '✧', color: '#efd48c', description: 'Orbiting blades cut through nearby enemies.' },
  arc: { name: 'Arc conductor', icon: 'ϟ', color: '#a9bdff', description: 'Lightning jumps between clustered enemies.' },
  mortar: { name: 'Bloom mortar', icon: '✺', color: '#ffb88d', description: 'Lobs an explosive seed into the horde.' },
  frost: { name: 'Cryo field', icon: '❄', color: '#8bdcec', description: 'A periodic cold pulse damages and slows enemies.' },
};
export const PASSIVES = {
  power: { name: 'Overcharge', icon: '↗', description: 'All weapons deal 20% more base damage.', max: 5 },
  haste: { name: 'Rapid cycling', icon: '»', description: 'Weapons fire 12% faster.', max: 5 },
  speed: { name: 'Trail runner', icon: '➶', description: 'Move 10% faster. Dash recharges sooner.', max: 3 },
  magnet: { name: 'Signal magnet', icon: '◎', description: 'Collect experience from 45% farther away.', max: 3 },
  vitality: { name: 'Living armor', icon: '♡', description: 'Gain 25 maximum health and restore 40 health.', max: 4 },
};
export const WAVE_NAMES = ['First contact', 'Under the roots', 'Heavy footsteps', 'Spore season', 'Hunt begins', 'Something stirs', 'Beyond the veil', 'No quiet corners', 'Last light', 'The Hollow Keeper'];
export const clockText = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
