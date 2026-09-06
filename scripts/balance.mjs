import { Game } from '../src/engine.js';
for (let run = 1; run <= 3; run++) {
  let seed = run * 617; const game = new Game({ random: () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) }); game.start();
  let maxEnemies = 0;
  for (let frame = 0; frame < 60 * 360 && !['gameover','victory'].includes(game.state); frame++) {
    if (game.state === 'upgrade') { const order = ['orbit','arc','mortar','pulse','frost','power','haste','vitality','magnet','speed']; const choices = game.choices.map((x,i)=>({ i, rank: order.indexOf(x.id) + (x.id === 'vitality' && game.player.hp < 50 ? -10 : 0) })); choices.sort((a,b)=>a.rank-b.rank); game.choose(choices[0].i); }
    const p = game.player; let target = game.pickups.filter(x => x.type === 'xp' || x.type === 'heal').sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    if (!target) target = {x:1200+Math.cos(game.time*.08)*350,y:900+Math.sin(game.time*.08)*350};
    let dx = target.x-p.x, dy = target.y-p.y; const length = Math.max(1,Math.hypot(dx,dy)); dx/=length;dy/=length;
    for (const e of game.enemies) { const d = Math.max(1,Math.hypot(e.x-p.x,e.y-p.y)); if(d<95){dx+=(p.x-e.x)/d*(95-d)/30;dy+=(p.y-e.y)/d*(95-d)/30;} }
    if(p.x<120)dx+=2;if(p.x>2280)dx-=2;if(p.y<120)dy+=2;if(p.y>1680)dy-=2;
    if(game.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<45))game.dash();
    game.update(1/60,{x:dx,y:dy}); maxEnemies=Math.max(maxEnemies,game.enemies.length);
  }
  console.log(JSON.stringify({run,...game.snapshot(),maxEnemies}));
}
