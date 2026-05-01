/* RIN SURVIVORS - integrated effects build */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = canvas.width;
const H = canvas.height;
const CLEAR_TIME = 600;
const PLAYER_RADIUS = 13;
const GEM_RADIUS = 6;
const TARGET_RANGE = 360;
const VERSION = 'integrated-vfx-1';

const ASSET_PATHS = {
  background: 'assets/backgrounds/rin_city_plaza_field.png',
  playerIdle: [
    'assets/player/rin/idle/frame_01.png',
    'assets/player/rin/idle/frame_02.png',
    'assets/player/rin/idle/frame_03.png',
    'assets/player/rin/idle/frame_04.png'
  ],
  enemies: {
    slime: ['assets/enemies/slime/frame_01.png', 'assets/enemies/slime/frame_02.png'],
    bat: ['assets/enemies/bat/frame_01.png', 'assets/enemies/bat/frame_02.png'],
    golem: ['assets/enemies/golem/frame_01.png', 'assets/enemies/golem/frame_02.png'],
    boss: ['assets/enemies/boss/frame_01.png', 'assets/enemies/boss/frame_02.png']
  },
  items: {
    magnet: 'assets/items/magnet.png',
    heal: 'assets/items/heal_cross.png',
    barrier: 'assets/items/barrier_shield.png',
    weapon: 'assets/projectiles/rin_bullet.png',
    expGem: 'assets/items/exp_gem.png'
  },
  effects: {
    fire: 'assets/effects/fire_skill_strip.png',
    lightning: 'assets/effects/lightning_skill_strip.png'
  }
};

const SPRITE = {
  player: { w: 44, h: 58 },
  enemies: {
    slime: { w: 32, h: 26 },
    bat: { w: 40, h: 32 },
    golem: { w: 66, h: 66 },
    boss: { w: 104, h: 104 }
  },
  items: {
    magnet: { w: 48, h: 48 },
    heal: { w: 48, h: 48 },
    barrier: { w: 52, h: 52 },
    weapon: { w: 34, h: 14 },
    expGem: { w: 20, h: 20 }
  },
  effects: {
    fire: { frameW: 32, frameH: 32, frames: 4 },
    lightning: { frameW: 32, frameH: 64, frames: 4 }
  }
};

const ENEMY_TYPES = {
  slime: { name: 'スライム', radius: 13, hp: 18, speed: 48, damage: 8, exp: 4, score: 1, appear: 0, weight: 70, color: '#22c55e' },
  bat: { name: 'コウモリ', radius: 10, hp: 12, speed: 88, damage: 6, exp: 5, score: 1, appear: 25, weight: 40, color: '#a855f7' },
  golem: { name: 'ゴーレム', radius: 22, hp: 80, speed: 34, damage: 18, exp: 16, score: 3, appear: 120, weight: 18, color: '#92400e' },
  boss: { name: 'ボス', radius: 42, hp: 900, speed: 42, damage: 28, exp: 80, score: 30, appear: 600, weight: 0, color: '#dc2626' }
};

const ITEM_TYPES = {
  magnet: { name: '経験値吸収', radius: 12, dropRate: 0.035 },
  heal: { name: 'HP回復', radius: 12, dropRate: 0.06, healAmount: 30 },
  barrier: { name: 'バリア', radius: 12, dropRate: 0.04, duration: 8 }
};

const UPGRADE_POOL = [
  { title: '二丁拳銃強化', desc: '弾数と威力を上げます。', apply: () => game.player.knifeLevel++ },
  { title: '炎を習得 / 強化', desc: '周囲に薄い炎の範囲攻撃を発生させます。', apply: () => game.player.fireLevel++ },
  { title: '雷を習得 / 強化', desc: '画面内の敵へ落雷を発生させます。', apply: () => game.player.lightningLevel++ },
  { title: '最大HPアップ', desc: '最大HP+20、HPも20回復します。', apply: () => { game.player.maxHp += 20; game.player.hp = Math.min(game.player.maxHp, game.player.hp + 20); } },
  { title: '移動速度アップ', desc: '移動速度を10%上げます。', apply: () => game.player.speed *= 1.1 },
  { title: '経験値吸引アップ', desc: '経験値の回収範囲を広げます。', apply: () => game.player.pickupRange += 28 },
  { title: '攻撃間隔短縮', desc: '自動攻撃の間隔を短くします。', apply: () => game.player.attackSpeedRate *= 0.9 },
  { title: 'バリア時間アップ', desc: 'バリア時間を2秒伸ばします。', apply: () => game.player.barrierBonus += 2 }
];

const images = { playerIdle: [], enemies: {}, items: {}, effects: {} };
let assetsExpected = 0;
let assetsCompleted = 0;
let assetsLoaded = false;
let selectedCharacter = 'rin';
let game;
let lastTime = 0;
const keys = new Set();

const $ = (id) => document.getElementById(id);
const ui = {
  hpFill: $('hpFill'), expFill: $('expFill'), hpLabel: $('hpLabel'), expLabel: $('expLabel'),
  levelText: $('levelText'), timeText: $('timeText'), killText: $('killText'), barrierText: $('barrierText'),
  expFillMini: $('expFillMini'), goldText: $('goldText'), pauseButton: $('pauseButton'), assetStatus: $('assetStatus'),
  titleOverlay: $('titleOverlay'), characterOverlay: $('characterOverlay'), backToTitleButton: $('backToTitleButton'),
  confirmCharacterButton: $('confirmCharacterButton'), characterGrid: $('characterGrid'), levelOverlay: $('levelOverlay'),
  pauseOverlay: $('pauseOverlay'), resultOverlay: $('resultOverlay'), resultTitle: $('resultTitle'), resultText: $('resultText'),
  upgradeList: $('upgradeList'), startButton: $('startButton'), retryButton: $('retryButton'), missionTime: $('missionTime'),
  missionTimeFill: $('missionTimeFill'), missionExp: $('missionExp'), missionExpFill: $('missionExpFill'),
  missionBoss: $('missionBoss'), missionBossFill: $('missionBossFill'), statAttack: $('statAttack'), statBarrier: $('statBarrier'),
  statSpeed: $('statSpeed'), statLuck: $('statLuck'), slotKnife: $('slotKnife'), slotFire: $('slotFire'), slotLightning: $('slotLightning')
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
function formatTime(t) { const m = Math.floor(t / 60).toString().padStart(2, '0'); const s = Math.floor(t % 60).toString().padStart(2, '0'); return `${m}:${s}`; }
function isNearScreen(e, margin = 36) { return e.x >= -margin && e.x <= W + margin && e.y >= -margin && e.y <= H + margin; }

function updateAssetStatus() {
  if (!ui.assetStatus) return;
  ui.assetStatus.textContent = assetsLoaded ? `ASSETS OK ${assetsCompleted}/${assetsExpected}` : `ASSETS LOADING ${assetsCompleted}/${assetsExpected}`;
}
function loadImage(src) {
  assetsExpected++;
  const img = new Image();
  img.onload = img.onerror = () => { assetsCompleted++; assetsLoaded = assetsCompleted >= assetsExpected; updateAssetStatus(); };
  img.src = `${src}?v=${VERSION}`;
  return img;
}
function preloadAssets() {
  images.background = loadImage(ASSET_PATHS.background);
  images.playerIdle = ASSET_PATHS.playerIdle.map(loadImage);
  for (const [key, paths] of Object.entries(ASSET_PATHS.enemies)) images.enemies[key] = paths.map(loadImage);
  for (const [key, path] of Object.entries(ASSET_PATHS.items)) images.items[key] = loadImage(path);
  for (const [key, path] of Object.entries(ASSET_PATHS.effects)) images.effects[key] = loadImage(path);
  updateAssetStatus();
}

function createInitialGame() {
  return {
    state: 'title', elapsed: 0, spawnTimer: 0, bossSpawned: false, kills: 0, gold: 0, cameraShake: 0,
    message: '', messageTimer: 0, selectedCharacter,
    player: { x: W / 2, y: H / 2, radius: PLAYER_RADIUS, hp: 100, maxHp: 100, speed: 190, level: 1, exp: 0, nextExp: 10, pickupRange: 42, invincibleTime: 0, barrierTime: 0, barrierBonus: 0, knifeLevel: 1, fireLevel: 0, lightningLevel: 0, attackSpeedRate: 1 },
    enemies: [], projectiles: [], gems: [], items: [], effects: [], timers: { knife: 0, fire: 0, lightning: 0 }
  };
}

function init() {
  preloadAssets();
  game = createInitialGame();
  hideAllOverlays();
  ui.titleOverlay?.classList.add('show');
  updateUI();
  draw();
  requestAnimationFrame(loop);
}
function hideAllOverlays() { [ui.titleOverlay, ui.characterOverlay, ui.levelOverlay, ui.pauseOverlay, ui.resultOverlay].forEach((el) => el?.classList.remove('show')); }
function openCharacterSelect() { game.state = 'title'; hideAllOverlays(); ui.characterOverlay?.classList.add('show'); }
function backToTitle() { hideAllOverlays(); ui.titleOverlay?.classList.add('show'); }
function selectCharacter(key) { if (key !== 'rin') return; selectedCharacter = 'rin'; ui.characterGrid?.querySelectorAll('.character-cell').forEach((cell) => cell.classList.toggle('selected', cell.dataset.character === 'rin')); }
function startGame() { selectedCharacter = 'rin'; game = createInitialGame(); game.state = 'playing'; keys.clear(); hideAllOverlays(); lastTime = performance.now(); updateUI(); }
function togglePause() { if (!game) return; if (game.state === 'playing') { game.state = 'paused'; ui.pauseOverlay?.classList.add('show'); } else if (game.state === 'paused') { game.state = 'playing'; ui.pauseOverlay?.classList.remove('show'); lastTime = performance.now(); } }

ui.startButton?.addEventListener('click', openCharacterSelect);
ui.retryButton?.addEventListener('click', openCharacterSelect);
ui.confirmCharacterButton?.addEventListener('click', startGame);
ui.backToTitleButton?.addEventListener('click', backToTitle);
ui.pauseButton?.addEventListener('click', togglePause);
ui.characterGrid?.addEventListener('click', (ev) => { const cell = ev.target.closest('.character-cell'); if (cell?.dataset.character === 'rin') selectCharacter('rin'); });
ui.characterGrid?.addEventListener('dblclick', (ev) => { const cell = ev.target.closest('.character-cell'); if (cell?.dataset.character === 'rin') { selectCharacter('rin'); startGame(); } });
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter'].includes(key)) e.preventDefault();
  if (key === 'enter' && ui.characterOverlay?.classList.contains('show')) return startGame();
  if (key === ' ') return togglePause();
  if (key === 't' && game?.state === 'playing') { dropItem('magnet', game.player.x + 60, game.player.y); dropItem('heal', game.player.x - 60, game.player.y); dropItem('barrier', game.player.x, game.player.y + 60); }
  if (key === 'y' && game?.state === 'playing') { game.player.fireLevel = Math.max(game.player.fireLevel, 1); game.player.lightningLevel = Math.max(game.player.lightningLevel, 1); useFireAura(); useLightning(); }
  keys.add(key);
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

function loop(now) { const dt = Math.min((now - lastTime) / 1000 || 0, 0.033); lastTime = now; if (game?.state === 'playing') update(dt); draw(); requestAnimationFrame(loop); }
function update(dt) { game.elapsed += dt; game.cameraShake = Math.max(0, game.cameraShake - dt * 18); game.messageTimer = Math.max(0, game.messageTimer - dt); if (game.messageTimer <= 0) game.message = ''; updatePlayer(dt); spawnEnemies(dt); updateEnemies(dt); updateAttacks(dt); updateProjectiles(dt); updateGems(dt); updateItems(dt); updateEffects(dt); checkPlayerDamage(); checkClearOrGameOver(); updateUI(); }
function updatePlayer(dt) { const p = game.player; let dx = 0, dy = 0; if (keys.has('w') || keys.has('arrowup')) dy--; if (keys.has('s') || keys.has('arrowdown')) dy++; if (keys.has('a') || keys.has('arrowleft')) dx--; if (keys.has('d') || keys.has('arrowright')) dx++; const len = Math.hypot(dx, dy) || 1; p.x = clamp(p.x + dx / len * p.speed * dt, p.radius, W - p.radius); p.y = clamp(p.y + dy / len * p.speed * dt, p.radius, H - p.radius); p.invincibleTime = Math.max(0, p.invincibleTime - dt); p.barrierTime = Math.max(0, p.barrierTime - dt); }
function spawnEnemies(dt) { const interval = clamp(0.85 / (1 + game.elapsed / 120), 0.15, 0.85); game.spawnTimer -= dt; if (game.spawnTimer <= 0) { game.spawnTimer = interval; for (let i = 0; i < (game.elapsed > 240 ? 2 : 1); i++) spawnEnemy(pickEnemyType()); } if (!game.bossSpawned && game.elapsed >= CLEAR_TIME) { game.bossSpawned = true; spawnEnemy('boss'); } }
function pickEnemyType() { const list = Object.entries(ENEMY_TYPES).filter(([k, t]) => k !== 'boss' && game.elapsed >= t.appear); let r = Math.random() * list.reduce((s, [, t]) => s + t.weight, 0); for (const [k, t] of list) { r -= t.weight; if (r <= 0) return k; } return 'slime'; }
function spawnEnemy(typeKey) { const t = ENEMY_TYPES[typeKey], side = Math.floor(Math.random() * 4); const x = side === 1 ? W + 40 : side === 3 ? -40 : Math.random() * W; const y = side === 0 ? -40 : side === 2 ? H + 40 : Math.random() * H; const hpBonus = 1 + game.elapsed / 360; game.enemies.push({ typeKey, x, y, radius: t.radius, hp: t.hp * hpBonus, maxHp: t.hp * hpBonus, speed: t.speed, damage: t.damage, exp: t.exp, score: t.score, color: t.color, hitFlash: 0 }); }
function updateEnemies(dt) { const p = game.player; for (const e of game.enemies) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.x += Math.cos(a) * e.speed * dt; e.y += Math.sin(a) * e.speed * dt; e.hitFlash = Math.max(0, e.hitFlash - dt); } }
function updateAttacks(dt) { const p = game.player; game.timers.knife -= dt; if (game.timers.knife <= 0) { game.timers.knife = 0.75 * p.attackSpeedRate; fireKnife(); } if (p.fireLevel > 0) { game.timers.fire -= dt; if (game.timers.fire <= 0) { game.timers.fire = 0.5 * p.attackSpeedRate; useFireAura(); } } if (p.lightningLevel > 0) { game.timers.lightning -= dt; if (game.timers.lightning <= 0) { game.timers.lightning = 1.7 * p.attackSpeedRate; useLightning(); } } }
function findNearestEnemy(maxRange = TARGET_RANGE) { const p = game.player; let best = null, bestD = maxRange; for (const e of game.enemies) { if (!isNearScreen(e, 36)) continue; const d = distance(p.x, p.y, e.x, e.y); if (d < bestD) { best = e; bestD = d; } } return best; }
function fireKnife() { const p = game.player, count = Math.min(1 + Math.floor(p.knifeLevel / 2), 5), damage = 18 + p.knifeLevel * 5; for (let i = 0; i < count; i++) { const target = findNearestEnemy(); let a = target ? Math.atan2(target.y - p.y, target.x - p.x) : -Math.PI / 2; a += (i - (count - 1) / 2) * 0.18; game.projectiles.push({ x: p.x, y: p.y - 10, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, radius: 5, damage, life: 1.2, pierce: Math.floor(p.knifeLevel / 3), angle: a }); } }
function useFireAura() { const p = game.player, level = Math.max(1, p.fireLevel); const hitRadius = 24 + level * 9, drawSize = 72 + level * 8, damage = 10 + level * 4; game.effects.push({ type: 'fireSkill', x: p.x, y: p.y, hitRadius, drawSize, life: 0.78, maxLife: 0.78, opacity: 0.48 }); for (const e of game.enemies) if (distance(p.x, p.y, e.x, e.y) <= hitRadius + e.radius) damageEnemy(e, damage); removeDeadEnemies(); }
function useLightning() { const p = game.player, level = Math.max(1, p.lightningLevel), hitCount = Math.min(1 + Math.floor(level / 2), 5), damage = 24 + level * 8; const pool = game.enemies.filter(e => isNearScreen(e, 40)); if (!pool.length) return; for (let i = 0; i < hitCount && pool.length; i++) { const idx = Math.floor(Math.random() * pool.length); const e = pool.splice(idx, 1)[0]; const strikeX = e.x, strikeY = e.y; damageEnemy(e, damage); game.effects.push({ type: 'lightningSkill', x: strikeX, y: strikeY, drawW: 58, drawH: 116, life: 0.18, maxLife: 0.18, opacity: 0.95 }); } removeDeadEnemies(); }
function updateProjectiles(dt) { for (let i = game.projectiles.length - 1; i >= 0; i--) { const b = game.projectiles[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; for (const e of game.enemies) { if (!isNearScreen(e, 36)) continue; if (distance(b.x, b.y, e.x, e.y) <= b.radius + e.radius) { damageEnemy(e, b.damage); if (--b.pierce < 0) { b.life = 0; break; } } } if (b.life <= 0 || b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80) game.projectiles.splice(i, 1); } removeDeadEnemies(); }
function damageEnemy(e, amount) { e.hp -= amount; e.hitFlash = 0.08; game.cameraShake = Math.min(4, game.cameraShake + 0.6); }
function removeDeadEnemies() { for (let i = game.enemies.length - 1; i >= 0; i--) { const e = game.enemies[i]; if (e.hp <= 0) { game.kills += e.score; game.gold += e.score * 3; dropGem(e.x, e.y, e.exp); tryDropItem(e.x, e.y, e.typeKey); game.effects.push({ type: 'pop', x: e.x, y: e.y, radius: e.radius + 10, life: 0.25, maxLife: 0.25, color: '#fff' }); game.enemies.splice(i, 1); } } }
function dropGem(x, y, value) { game.gems.push({ x, y, radius: GEM_RADIUS, value, bob: Math.random() * 7, magnetized: false, trail: [] }); }
function tryDropItem(x, y, enemyTypeKey) { const bonus = enemyTypeKey === 'boss' ? 3 : 1, r = Math.random(), h = ITEM_TYPES.heal.dropRate * bonus, b = ITEM_TYPES.barrier.dropRate * bonus, m = ITEM_TYPES.magnet.dropRate * bonus; if (r < h) dropItem('heal', x, y); else if (r < h + b) dropItem('barrier', x, y); else if (r < h + b + m) dropItem('magnet', x, y); }
function dropItem(typeKey, x, y) { game.items.push({ typeKey, x, y, radius: ITEM_TYPES[typeKey].radius, bob: Math.random() * 7, life: 60 }); }
function magnetizeAllGems() { for (const g of game.gems) { g.magnetized = true; g.magnetTime = 0; g.trail = []; } }
function updateGems(dt) { const p = game.player; for (let i = game.gems.length - 1; i >= 0; i--) { const g = game.gems[i]; g.bob += dt * (g.magnetized ? 14 : 8); if (g.magnetized) { g.magnetTime = (g.magnetTime || 0) + dt; g.trail.push({ x: g.x, y: g.y }); if (g.trail.length > 7) g.trail.shift(); const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1; const speed = 420 + Math.min(1300, d * 2.2) + Math.min(1200, g.magnetTime * 2400); g.x += dx / d * speed * dt; g.y += dy / d * speed * dt; } else { const d = distance(p.x, p.y, g.x, g.y); if (d <= p.pickupRange) { const a = Math.atan2(p.y - g.y, p.x - g.x); const pull = 250 + (p.pickupRange - d) * 6; g.x += Math.cos(a) * pull * dt; g.y += Math.sin(a) * pull * dt; } } if (distance(p.x, p.y, g.x, g.y) <= p.radius + g.radius + 3) { gainExp(g.value); game.effects.push({ type: 'spark', x: p.x, y: p.y, radius: 8, life: 0.18, maxLife: 0.18, color: '#67e8f9' }); game.gems.splice(i, 1); } } }
function updateItems(dt) { const p = game.player; for (let i = game.items.length - 1; i >= 0; i--) { const item = game.items[i]; item.bob += dt * 6; item.life -= dt; if (item.life <= 0) { game.items.splice(i, 1); continue; } const d = distance(p.x, p.y, item.x, item.y), range = p.pickupRange + 18; if (d <= range) { const a = Math.atan2(p.y - item.y, p.x - item.x); item.x += Math.cos(a) * (180 + (range - d) * 5) * dt; item.y += Math.sin(a) * (180 + (range - d) * 5) * dt; } if (d <= p.radius + item.radius) { applyItem(item.typeKey); game.items.splice(i, 1); } } }
function applyItem(typeKey) { const p = game.player; if (typeKey === 'magnet') { magnetizeAllGems(); showMessage('EXP吸引！'); game.effects.push({ type: 'circle', x: p.x, y: p.y, radius: 150, life: 0.45, maxLife: 0.45, color: '#38bdf8' }); } if (typeKey === 'heal') { const amount = ITEM_TYPES.heal.healAmount; p.hp = Math.min(p.maxHp, p.hp + amount); showMessage(`HP +${amount}`); } if (typeKey === 'barrier') { const d = ITEM_TYPES.barrier.duration + p.barrierBonus; p.barrierTime = Math.max(p.barrierTime, d); showMessage(`BARRIER ${d}s`); } }
function gainExp(v) { const p = game.player; p.exp += v; while (p.exp >= p.nextExp) { p.exp -= p.nextExp; p.level++; p.nextExp = Math.floor(p.nextExp * 1.25 + 6); openLevelUp(); break; } }
function openLevelUp() { game.state = 'levelup'; ui.levelOverlay?.classList.add('show'); if (!ui.upgradeList) return; ui.upgradeList.innerHTML = ''; pickRandom(UPGRADE_POOL, 3).forEach(up => { const card = document.createElement('div'); card.className = 'upgrade-card'; card.innerHTML = `<strong>${up.title}</strong><span>${up.desc}</span>`; card.onclick = () => { up.apply(); ui.levelOverlay.classList.remove('show'); game.state = 'playing'; lastTime = performance.now(); updateUI(); }; ui.upgradeList.appendChild(card); }); }
function pickRandom(arr, count) { const pool = [...arr], out = []; while (out.length < count && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; }
function updateEffects(dt) { for (let i = game.effects.length - 1; i >= 0; i--) if ((game.effects[i].life -= dt) <= 0) game.effects.splice(i, 1); }
function checkPlayerDamage() { const p = game.player; if (p.invincibleTime > 0) return; for (const e of game.enemies) if (distance(p.x, p.y, e.x, e.y) <= p.radius + e.radius) { if (p.barrierTime > 0) { p.invincibleTime = 0.25; game.effects.push({ type: 'circle', x: p.x, y: p.y, radius: 42, life: 0.18, maxLife: 0.18, color: '#a855f7' }); return; } p.hp -= e.damage; p.invincibleTime = 0.65; game.cameraShake = 8; break; } }
function checkClearOrGameOver() { if (game.player.hp <= 0) finishGame(false); else if (game.elapsed >= CLEAR_TIME) finishGame(true); }
function finishGame(clear) { game.state = clear ? 'clear' : 'gameover'; if (ui.resultTitle) ui.resultTitle.textContent = clear ? 'CLEAR!' : 'GAME OVER'; if (ui.resultText) ui.resultText.innerHTML = `経過時間：${formatTime(game.elapsed)}<br>レベル：${game.player.level}<br>倒した敵：${game.kills}`; ui.resultOverlay?.classList.add('show'); updateUI(); }
function showMessage(text) { game.message = text; game.messageTimer = 1.5; }

function updateUI() { if (!game) return; const p = game.player; const hpRate = clamp(p.hp / p.maxHp, 0, 1) * 100, expRate = clamp(p.exp / p.nextExp, 0, 1) * 100; if (ui.hpFill) ui.hpFill.style.width = `${hpRate}%`; if (ui.expFill) ui.expFill.style.width = `${expRate}%`; if (ui.expFillMini) ui.expFillMini.style.width = `${expRate}%`; if (ui.hpLabel) ui.hpLabel.textContent = `HP ${Math.ceil(p.hp)} / ${p.maxHp}`; if (ui.expLabel) ui.expLabel.textContent = `EXP ${Math.floor(p.exp)} / ${p.nextExp}`; if (ui.levelText) ui.levelText.textContent = `Lv.${p.level}`; if (ui.timeText) ui.timeText.textContent = formatTime(game.elapsed); if (ui.killText) ui.killText.textContent = `KILL ${game.kills}`; if (ui.goldText) ui.goldText.textContent = `GOLD ${game.gold}`; if (ui.barrierText) ui.barrierText.textContent = p.barrierTime > 0 ? `BARRIER ${p.barrierTime.toFixed(1)}` : 'BARRIER -'; if (ui.missionTime) ui.missionTime.textContent = `${formatTime(game.elapsed)} / 10:00`; if (ui.missionTimeFill) ui.missionTimeFill.style.width = `${clamp(game.elapsed / CLEAR_TIME, 0, 1) * 100}%`; if (ui.missionExp) ui.missionExp.textContent = `${Math.floor(p.exp)} / ${p.nextExp}`; if (ui.missionExpFill) ui.missionExpFill.style.width = `${expRate}%`; if (ui.missionBoss) ui.missionBoss.textContent = game.bossSpawned ? '1 / 1' : '0 / 1'; if (ui.missionBossFill) ui.missionBossFill.style.width = game.bossSpawned ? '100%' : '0%'; if (ui.statAttack) ui.statAttack.textContent = p.knifeLevel; if (ui.statBarrier) ui.statBarrier.textContent = p.barrierBonus; if (ui.statSpeed) ui.statSpeed.textContent = (p.speed / 190).toFixed(2); if (ui.statLuck) ui.statLuck.textContent = '0%'; if (ui.slotKnife) ui.slotKnife.textContent = `Lv.${p.knifeLevel} ★`; if (ui.slotFire) ui.slotFire.textContent = `Lv.${p.fireLevel} ${p.fireLevel ? '★' : '☆'}`; if (ui.slotLightning) ui.slotLightning.textContent = `Lv.${p.lightningLevel} ${p.lightningLevel ? '★' : '☆'}`; }

function draw() { if (!game) return; ctx.save(); ctx.imageSmoothingEnabled = false; if (game.cameraShake > 0) ctx.translate((Math.random() - 0.5) * game.cameraShake, (Math.random() - 0.5) * game.cameraShake); drawBackground(); drawGems(); drawItems(); drawEnemies(); drawProjectiles(); drawPlayer(); drawEffects(); drawMessage(); ctx.restore(); }
function drawImageCentered(img, x, y, w, h) { if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h)); else { ctx.fillStyle = '#38bdf8'; ctx.fillRect(Math.round(x - w / 4), Math.round(y - h / 4), Math.round(w / 2), Math.round(h / 2)); } }
function drawBackground() { if (images.background?.complete && images.background.naturalWidth) ctx.drawImage(images.background, 0, 0, W, H); else { ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H); } }
function drawPlayer() { const p = game.player; if (p.invincibleTime > 0 && Math.floor(performance.now() / 80) % 2 === 0) return; ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(Math.round(p.x), Math.round(p.y + 10), 14, 5, 0, 0, Math.PI * 2); ctx.fill(); if (p.barrierTime > 0) { ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y - 2, 28, 0, Math.PI * 2); ctx.stroke(); } const frame = Math.floor(performance.now() / 160) % Math.max(images.playerIdle.length, 1); drawImageCentered(images.playerIdle[frame], p.x, p.y - 16, SPRITE.player.w, SPRITE.player.h); }
function drawEnemies() { for (const e of game.enemies) { const s = SPRITE.enemies[e.typeKey], frames = images.enemies[e.typeKey] || [], img = frames[Math.floor(performance.now() / 260) % Math.max(frames.length, 1)]; ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.radius, e.radius * 1.05, 6, 0, 0, Math.PI * 2); ctx.fill(); drawImageCentered(img, e.x, e.y, s.w, s.h); if (e.hitFlash > 0) { ctx.globalAlpha = .55; ctx.fillStyle = '#fff'; ctx.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2); ctx.globalAlpha = 1; } const r = clamp(e.hp / e.maxHp, 0, 1); ctx.fillStyle = '#111827'; ctx.fillRect(e.x - e.radius, e.y - e.radius - 12, e.radius * 2, 4); ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - e.radius, e.y - e.radius - 12, e.radius * 2 * r, 4); } }
function drawProjectiles() { const img = images.items.weapon; for (const b of game.projectiles) { const angle = Math.atan2(b.vy || 0, b.vx || 1); ctx.save(); ctx.translate(Math.round(b.x), Math.round(b.y)); ctx.rotate(angle); ctx.imageSmoothingEnabled = false; if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, -17, -7, 34, 14); else { ctx.fillStyle = '#ffdf3f'; ctx.fillRect(-17, -6, 34, 12); ctx.fillStyle = '#fff'; ctx.fillRect(-8, -3, 14, 6); } ctx.restore(); } }
function drawGems() { const img = images.items.expGem; for (const g of game.gems) { const bobY = g.magnetized ? 0 : Math.sin(g.bob) * 2; if (g.magnetized && g.trail) { for (let i = 0; i < g.trail.length; i++) { const t = g.trail[i]; ctx.globalAlpha = (i + 1) / (g.trail.length * 2.4); drawImageCentered(img, t.x, t.y, 11, 11); } ctx.globalAlpha = 1; } drawImageCentered(img, g.x, g.y + bobY, g.magnetized ? 22 : 20, g.magnetized ? 22 : 20); } ctx.globalAlpha = 1; }
function drawItems() { for (const it of game.items) { const y = it.y + Math.sin(it.bob) * 3, s = SPRITE.items[it.typeKey]; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(it.x, y + 19, 14, 5, 0, 0, Math.PI * 2); ctx.fill(); drawImageCentered(images.items[it.typeKey], it.x, y, s.w, s.h); } }
function effectFrame(ef, frames) { const p = 1 - ef.life / ef.maxLife; return clamp(Math.floor(p * frames), 0, frames - 1); }
function drawEffects() { for (const ef of game.effects) { const rate = clamp(ef.life / ef.maxLife, 0, 1); if (ef.type === 'fireSkill') { const sp = SPRITE.effects.fire, img = images.effects.fire, frame = effectFrame(ef, sp.frames), size = ef.drawSize; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = ef.opacity * (0.65 + rate * 0.25); if (img?.complete && img.naturalWidth) ctx.drawImage(img, frame * sp.frameW, 0, sp.frameW, sp.frameH, Math.round(ef.x - size / 2), Math.round(ef.y - size / 2), Math.round(size), Math.round(size)); else { ctx.strokeStyle = '#fb923c'; ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.hitRadius, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); continue; } if (ef.type === 'lightningSkill') { const sp = SPRITE.effects.lightning, img = images.effects.lightning, frame = effectFrame(ef, sp.frames), w = ef.drawW, h = ef.drawH; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = ef.opacity * clamp(0.5 + rate * 0.55, 0, 1); if (img?.complete && img.naturalWidth) ctx.drawImage(img, frame * sp.frameW, 0, sp.frameW, sp.frameH, Math.round(ef.x - w / 2), Math.round(ef.y - h + 8), Math.round(w), Math.round(h)); else { ctx.strokeStyle = '#67e8f9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ef.x - 4, ef.y - h + 16); ctx.lineTo(ef.x + 8, ef.y - h * .58); ctx.lineTo(ef.x - 3, ef.y - h * .58); ctx.lineTo(ef.x + 6, ef.y - 6); ctx.stroke(); } ctx.restore(); continue; } ctx.globalAlpha = rate; if (ef.type === 'circle') { ctx.strokeStyle = ef.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ef.x, ef.y, ef.radius, 0, Math.PI * 2); ctx.stroke(); } if (ef.type === 'pop') { ctx.strokeStyle = ef.color; ctx.lineWidth = 3; ctx.strokeRect(ef.x - ef.radius * (1 - rate), ef.y - ef.radius * (1 - rate), ef.radius * 2 * (1 - rate), ef.radius * 2 * (1 - rate)); } if (ef.type === 'spark') { ctx.fillStyle = ef.color; ctx.fillRect(ef.x - 2, ef.y - 8, 4, 16); ctx.fillRect(ef.x - 8, ef.y - 2, 16, 4); } ctx.globalAlpha = 1; } ctx.globalAlpha = 1; }
function drawMessage() { if (game.message && game.messageTimer > 0) { ctx.save(); ctx.globalAlpha = clamp(game.messageTimer, 0, 1); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(game.message, W / 2, 92); ctx.restore(); } }

init();