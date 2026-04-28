/*
  ============================================================
  ヴァンサバ風 2Dアクションゲーム 試作品
  ============================================================
  ファイル構成：
  - index.html  : 画面の骨組み
  - style.css   : 見た目
  - game.js     : ゲーム処理

  後から改造しやすいように、敵・武器・強化の情報はなるべく
  配列やオブジェクトで管理しています。
*/

// ------------------------------
// Canvas 基本設定
// ------------------------------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// ------------------------------
// UI要素
// ------------------------------
const hpFill = document.getElementById("hpFill");
const expFill = document.getElementById("expFill");
const hpLabel = document.getElementById("hpLabel");
const expLabel = document.getElementById("expLabel");
const levelText = document.getElementById("levelText");
const timeText = document.getElementById("timeText");
const killText = document.getElementById("killText");

const titleOverlay = document.getElementById("titleOverlay");
const levelOverlay = document.getElementById("levelOverlay");
const pauseOverlay = document.getElementById("pauseOverlay");
const resultOverlay = document.getElementById("resultOverlay");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const upgradeList = document.getElementById("upgradeList");

const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");

// ------------------------------
// ゲーム調整値
// ------------------------------
const CLEAR_TIME = 60; // 10分 = 600秒。テスト時は 60 などに短くすると確認しやすいです。
const PLAYER_RADIUS = 13;
const GEM_RADIUS = 6;

// ------------------------------
// 敵タイプ定義
// 敵を追加したい場合はここに増やします。
// ------------------------------
const ENEMY_TYPES = {
  slime: {
    name: "スライム",
    color: "#22c55e",
    radius: 13,
    hp: 18,
    speed: 48,
    damage: 8,
    exp: 4,
    score: 1,
    appearTime: 0,
    weight: 70,
  },
  bat: {
    name: "コウモリ",
    color: "#a855f7",
    radius: 10,
    hp: 12,
    speed: 88,
    damage: 6,
    exp: 5,
    score: 1,
    appearTime: 25,
    weight: 40,
  },
  golem: {
    name: "ゴーレム",
    color: "#92400e",
    radius: 22,
    hp: 80,
    speed: 34,
    damage: 18,
    exp: 16,
    score: 3,
    appearTime: 120,
    weight: 18,
  },
  boss: {
    name: "ボス",
    color: "#dc2626",
    radius: 42,
    hp: 900,
    speed: 42,
    damage: 28,
    exp: 80,
    score: 30,
    appearTime: CLEAR_TIME,
    weight: 0,
  },
};

// ------------------------------
// 入力状態
// ------------------------------
const keys = new Set();

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    e.preventDefault();
  }

  if (key === " ") {
    togglePause();
    return;
  }

  keys.add(key);
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

// ------------------------------
// ゲーム状態
// ------------------------------
let game;
let lastTime = 0;

function createInitialGame() {
  return {
    state: "title", // title / playing / paused / levelup / gameover / clear
    elapsed: 0,
    spawnTimer: 0,
    bossSpawned: false,
    kills: 0,
    cameraShake: 0,
    player: {
      x: W / 2,
      y: H / 2,
      radius: PLAYER_RADIUS,
      hp: 100,
      maxHp: 100,
      speed: 190,
      level: 1,
      exp: 0,
      nextExp: 10,
      pickupRange: 42,
      invincibleTime: 0,
      knifeLevel: 1,
      fireLevel: 0,
      lightningLevel: 0,
      attackSpeedRate: 1,
    },
    enemies: [],
    projectiles: [],
    gems: [],
    effects: [],
    timers: {
      knife: 0,
      fire: 0,
      lightning: 0,
    },
  };
}

// ------------------------------
// 強化候補
// 強化を追加したい場合はここに増やします。
// ------------------------------
const UPGRADE_POOL = [
  {
    title: "ナイフ強化",
    desc: "ナイフの本数と威力を少し上げます。近くの敵を倒しやすくなります。",
    apply: () => {
      game.player.knifeLevel += 1;
    },
  },
  {
    title: "炎を習得 / 強化",
    desc: "周囲の敵に継続ダメージを与える炎を強化します。囲まれた時に便利です。",
    apply: () => {
      game.player.fireLevel += 1;
    },
  },
  {
    title: "雷を習得 / 強化",
    desc: "ランダムな敵に雷を落とします。画面内の遠い敵にも攻撃できます。",
    apply: () => {
      game.player.lightningLevel += 1;
    },
  },
  {
    title: "最大HPアップ",
    desc: "最大HPを20増やし、HPも20回復します。安定して生き残りやすくなります。",
    apply: () => {
      game.player.maxHp += 20;
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 20);
    },
  },
  {
    title: "移動速度アップ",
    desc: "プレイヤーの移動速度を10%上げます。敵から逃げやすくなります。",
    apply: () => {
      game.player.speed *= 1.1;
    },
  },
  {
    title: "経験値吸引アップ",
    desc: "経験値の回収範囲を広げます。危険な場所に近づかず育成できます。",
    apply: () => {
      game.player.pickupRange += 28;
    },
  },
  {
    title: "攻撃間隔短縮",
    desc: "すべての自動攻撃の間隔を少し短くします。火力が上がります。",
    apply: () => {
      game.player.attackSpeedRate *= 0.9;
    },
  },
];

// ------------------------------
// 初期化・開始・リトライ
// ------------------------------
function init() {
  game = createInitialGame();
  updateUI();
  draw();
}

function startGame() {
  game = createInitialGame();
  game.state = "playing";
  titleOverlay.classList.remove("show");
  resultOverlay.classList.remove("show");
  levelOverlay.classList.remove("show");
  pauseOverlay.classList.remove("show");
  lastTime = performance.now();
}

startButton.addEventListener("click", startGame);
retryButton.addEventListener("click", startGame);

// ------------------------------
// 一時停止
// ------------------------------
function togglePause() {
  if (!game) return;

  if (game.state === "playing") {
    game.state = "paused";
    pauseOverlay.classList.add("show");
  } else if (game.state === "paused") {
    game.state = "playing";
    pauseOverlay.classList.remove("show");
    lastTime = performance.now();
  }
}

// ------------------------------
// メインループ
// ------------------------------
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  if (game && game.state === "playing") {
    update(dt);
  }

  draw();
  requestAnimationFrame(loop);
}

// ------------------------------
// 更新処理
// ------------------------------
function update(dt) {
  game.elapsed += dt;
  game.cameraShake = Math.max(0, game.cameraShake - dt * 18);

  updatePlayer(dt);
  spawnEnemies(dt);
  updateEnemies(dt);
  updateAttacks(dt);
  updateProjectiles(dt);
  updateGems(dt);
  updateEffects(dt);
  checkPlayerDamage();
  checkClearOrGameOver();
  updateUI();
}

// ------------------------------
// プレイヤー移動
// ------------------------------
function updatePlayer(dt) {
  const p = game.player;
  let dx = 0;
  let dy = 0;

  if (keys.has("w") || keys.has("arrowup")) dy -= 1;
  if (keys.has("s") || keys.has("arrowdown")) dy += 1;
  if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
  if (keys.has("d") || keys.has("arrowright")) dx += 1;

  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;

  p.x += dx * p.speed * dt;
  p.y += dy * p.speed * dt;

  p.x = clamp(p.x, p.radius, W - p.radius);
  p.y = clamp(p.y, p.radius, H - p.radius);

  p.invincibleTime = Math.max(0, p.invincibleTime - dt);
}

// ------------------------------
// 敵スポーン
// ------------------------------
function spawnEnemies(dt) {
  const difficulty = 1 + game.elapsed / 120;
  const interval = clamp(0.85 / difficulty, 0.15, 0.85);
  game.spawnTimer -= dt;

  if (game.spawnTimer <= 0) {
    game.spawnTimer = interval;
    const count = game.elapsed > 240 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      spawnEnemy(pickEnemyType());
    }
  }

  if (!game.bossSpawned && game.elapsed >= CLEAR_TIME) {
    game.bossSpawned = true;
    spawnEnemy("boss");
  }
}

function pickEnemyType() {
  const candidates = Object.entries(ENEMY_TYPES).filter(([key, type]) => {
    return key !== "boss" && game.elapsed >= type.appearTime;
  });

  const totalWeight = candidates.reduce((sum, [, type]) => sum + type.weight, 0);
  let r = Math.random() * totalWeight;

  for (const [key, type] of candidates) {
    r -= type.weight;
    if (r <= 0) return key;
  }

  return "slime";
}

function spawnEnemy(typeKey) {
  const type = ENEMY_TYPES[typeKey];
  const side = Math.floor(Math.random() * 4);
  let x;
  let y;

  if (side === 0) {
    x = Math.random() * W;
    y = -40;
  } else if (side === 1) {
    x = W + 40;
    y = Math.random() * H;
  } else if (side === 2) {
    x = Math.random() * W;
    y = H + 40;
  } else {
    x = -40;
    y = Math.random() * H;
  }

  const hpBonus = 1 + game.elapsed / 360;

  game.enemies.push({
    typeKey,
    name: type.name,
    x,
    y,
    radius: type.radius,
    hp: type.hp * hpBonus,
    maxHp: type.hp * hpBonus,
    speed: type.speed,
    damage: type.damage,
    exp: type.exp,
    score: type.score,
    color: type.color,
    hitFlash: 0,
  });
}

// ------------------------------
// 敵移動
// ------------------------------
function updateEnemies(dt) {
  const p = game.player;

  for (const e of game.enemies) {
    const angle = Math.atan2(p.y - e.y, p.x - e.x);
    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;
    e.hitFlash = Math.max(0, e.hitFlash - dt);
  }
}

// ------------------------------
// 自動攻撃
// ここに武器処理を追加できます。
// ------------------------------
function updateAttacks(dt) {
  const p = game.player;

  game.timers.knife -= dt;
  const knifeInterval = 0.75 * p.attackSpeedRate;
  if (game.timers.knife <= 0) {
    game.timers.knife = knifeInterval;
    fireKnife();
  }

  if (p.fireLevel > 0) {
    game.timers.fire -= dt;
    const fireInterval = 0.5 * p.attackSpeedRate;
    if (game.timers.fire <= 0) {
      game.timers.fire = fireInterval;
      useFireAura();
    }
  }

  if (p.lightningLevel > 0) {
    game.timers.lightning -= dt;
    const lightningInterval = 1.7 * p.attackSpeedRate;
    if (game.timers.lightning <= 0) {
      game.timers.lightning = lightningInterval;
      useLightning();
    }
  }
}

function fireKnife() {
  const p = game.player;
  const knifeCount = Math.min(1 + Math.floor(p.knifeLevel / 2), 5);
  const damage = 18 + p.knifeLevel * 5;

  for (let i = 0; i < knifeCount; i++) {
    const target = findNearestEnemy();
    let angle;

    if (target) {
      angle = Math.atan2(target.y - p.y, target.x - p.x);
      angle += (i - (knifeCount - 1) / 2) * 0.18;
    } else {
      angle = -Math.PI / 2 + i * 0.2;
    }

    game.projectiles.push({
      x: p.x,
      y: p.y,
      vx: Math.cos(angle) * 380,
      vy: Math.sin(angle) * 380,
      radius: 5,
      damage,
      life: 1.2,
      pierce: Math.floor(p.knifeLevel / 3),
      color: "#e5e7eb",
    });
  }
}

function useFireAura() {
  const p = game.player;
  const range = 58 + p.fireLevel * 12;
  const damage = 10 + p.fireLevel * 4;

  game.effects.push({
    type: "circle",
    x: p.x,
    y: p.y,
    radius: range,
    life: 0.18,
    maxLife: 0.18,
    color: "#f97316",
  });

  for (const e of game.enemies) {
    if (distance(p.x, p.y, e.x, e.y) <= range + e.radius) {
      damageEnemy(e, damage);
    }
  }
}

function useLightning() {
  const p = game.player;
  const hitCount = Math.min(1 + Math.floor(p.lightningLevel / 2), 5);
  const damage = 24 + p.lightningLevel * 8;

  for (let i = 0; i < hitCount; i++) {
    if (game.enemies.length === 0) return;
    const e = game.enemies[Math.floor(Math.random() * game.enemies.length)];
    damageEnemy(e, damage);
    game.effects.push({
      type: "lightning",
      x: e.x,
      y: e.y,
      radius: 28,
      life: 0.22,
      maxLife: 0.22,
      color: "#facc15",
    });
  }
}

function findNearestEnemy() {
  const p = game.player;
  let nearest = null;
  let nearestDist = Infinity;

  for (const e of game.enemies) {
    const d = distance(p.x, p.y, e.x, e.y);
    if (d < nearestDist) {
      nearest = e;
      nearestDist = d;
    }
  }

  return nearest;
}

// ------------------------------
// 弾処理
// ------------------------------
function updateProjectiles(dt) {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const b = game.projectiles[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    for (const e of game.enemies) {
      if (distance(b.x, b.y, e.x, e.y) <= b.radius + e.radius) {
        damageEnemy(e, b.damage);
        b.pierce -= 1;
        if (b.pierce < 0) {
          b.life = 0;
          break;
        }
      }
    }

    if (b.life <= 0 || b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80) {
      game.projectiles.splice(i, 1);
    }
  }

  removeDeadEnemies();
}

// ------------------------------
// 敵へのダメージ・撃破処理
// ------------------------------
function damageEnemy(enemy, amount) {
  enemy.hp -= amount;
  enemy.hitFlash = 0.08;
  game.cameraShake = Math.min(4, game.cameraShake + 0.6);
}

function removeDeadEnemies() {
  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const e = game.enemies[i];
    if (e.hp <= 0) {
      game.kills += e.score;
      dropGem(e.x, e.y, e.exp);
      game.effects.push({
        type: "pop",
        x: e.x,
        y: e.y,
        radius: e.radius + 10,
        life: 0.25,
        maxLife: 0.25,
        color: "#ffffff",
      });
      game.enemies.splice(i, 1);
    }
  }
}

function dropGem(x, y, value) {
  game.gems.push({
    x,
    y,
    radius: GEM_RADIUS,
    value,
    bob: Math.random() * Math.PI * 2,
  });
}

// ------------------------------
// 経験値ジェム処理
// ------------------------------
function updateGems(dt) {
  const p = game.player;

  for (let i = game.gems.length - 1; i >= 0; i--) {
    const g = game.gems[i];
    g.bob += dt * 8;

    const d = distance(p.x, p.y, g.x, g.y);

    if (d <= p.pickupRange) {
      const angle = Math.atan2(p.y - g.y, p.x - g.x);
      const pullSpeed = 250 + (p.pickupRange - d) * 6;
      g.x += Math.cos(angle) * pullSpeed * dt;
      g.y += Math.sin(angle) * pullSpeed * dt;
    }

    if (d <= p.radius + g.radius) {
      gainExp(g.value);
      game.gems.splice(i, 1);
    }
  }
}

function gainExp(value) {
  const p = game.player;
  p.exp += value;

  while (p.exp >= p.nextExp) {
    p.exp -= p.nextExp;
    p.level += 1;
    p.nextExp = Math.floor(p.nextExp * 1.25 + 6);
    openLevelUp();
    break;
  }
}

// ------------------------------
// レベルアップ画面
// ------------------------------
function openLevelUp() {
  game.state = "levelup";
  levelOverlay.classList.add("show");
  upgradeList.innerHTML = "";

  const choices = pickRandomUpgrades(3);

  for (const upgrade of choices) {
    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.innerHTML = `<strong>${upgrade.title}</strong><span>${upgrade.desc}</span>`;
    card.addEventListener("click", () => {
      upgrade.apply();
      levelOverlay.classList.remove("show");
      game.state = "playing";
      lastTime = performance.now();
      updateUI();
    });
    upgradeList.appendChild(card);
  }
}

function pickRandomUpgrades(count) {
  const pool = [...UPGRADE_POOL];
  const result = [];

  while (result.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }

  return result;
}

// ------------------------------
// エフェクト処理
// ------------------------------
function updateEffects(dt) {
  for (let i = game.effects.length - 1; i >= 0; i--) {
    const ef = game.effects[i];
    ef.life -= dt;
    if (ef.life <= 0) {
      game.effects.splice(i, 1);
    }
  }
}

// ------------------------------
// プレイヤー被ダメージ判定
// ------------------------------
function checkPlayerDamage() {
  const p = game.player;
  if (p.invincibleTime > 0) return;

  for (const e of game.enemies) {
    if (distance(p.x, p.y, e.x, e.y) <= p.radius + e.radius) {
      p.hp -= e.damage;
      p.invincibleTime = 0.65;
      game.cameraShake = 8;
      break;
    }
  }
}

// ------------------------------
// ゲーム終了判定
// ------------------------------
function checkClearOrGameOver() {
  const p = game.player;

  if (p.hp <= 0) {
    p.hp = 0;
    finishGame(false);
    return;
  }

  if (game.elapsed >= CLEAR_TIME) {
    finishGame(true);
  }
}

function finishGame(isClear) {
  game.state = isClear ? "clear" : "gameover";
  resultTitle.textContent = isClear ? "CLEAR!" : "GAME OVER";
  resultText.innerHTML = `経過時間：${formatTime(game.elapsed)}<br>レベル：${game.player.level}<br>倒した敵：${game.kills}`;
  resultOverlay.classList.add("show");
  updateUI();
}

// ------------------------------
// UI更新
// ------------------------------
function updateUI() {
  if (!game) return;
  const p = game.player;

  const hpRate = clamp(p.hp / p.maxHp, 0, 1) * 100;
  const expRate = clamp(p.exp / p.nextExp, 0, 1) * 100;

  hpFill.style.width = `${hpRate}%`;
  expFill.style.width = `${expRate}%`;
  hpLabel.textContent = `HP ${Math.ceil(p.hp)} / ${p.maxHp}`;
  expLabel.textContent = `EXP ${Math.floor(p.exp)} / ${p.nextExp}`;
  levelText.textContent = `Lv.${p.level}`;
  timeText.textContent = formatTime(game.elapsed);
  killText.textContent = `KILL ${game.kills}`;
}

// ------------------------------
// 描画処理
// ------------------------------
function draw() {
  if (!game) return;

  ctx.save();

  if (game.cameraShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * game.cameraShake,
      (Math.random() - 0.5) * game.cameraShake
    );
  }

  drawBackground();
  drawGems();
  drawEnemies();
  drawProjectiles();
  drawPlayer();
  drawEffects();
  drawWeaponInfo();

  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;
  const grid = 32;

  for (let x = 0; x <= W; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y <= H; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  const p = game.player;
  const blink = p.invincibleTime > 0 && Math.floor(performance.now() / 80) % 2 === 0;
  if (blink) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(p.x - 13, p.y + 12, 26, 8);

  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(p.x - 10, p.y - 12, 20, 24);

  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(p.x - 5, p.y - 18, 10, 8);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(p.x - 5, p.y - 5, 4, 4);
  ctx.fillRect(p.x + 2, p.y - 5, 4, 4);
}

function drawEnemies() {
  for (const e of game.enemies) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(e.x - e.radius, e.y + e.radius - 4, e.radius * 2, 8);

    ctx.fillStyle = e.hitFlash > 0 ? "#ffffff" : e.color;
    ctx.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);

    ctx.fillStyle = "#020617";
    ctx.fillRect(e.x - e.radius * 0.45, e.y - e.radius * 0.2, 4, 4);
    ctx.fillRect(e.x + e.radius * 0.2, e.y - e.radius * 0.2, 4, 4);

    const hpRate = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = "#111827";
    ctx.fillRect(e.x - e.radius, e.y - e.radius - 8, e.radius * 2, 4);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(e.x - e.radius, e.y - e.radius - 8, e.radius * 2 * hpRate, 4);
  }
}

function drawProjectiles() {
  for (const b of game.projectiles) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 8, b.y - 3, 16, 6);

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(b.x - 2, b.y - 2, 10, 4);
  }
}

function drawGems() {
  for (const g of game.gems) {
    const bobY = Math.sin(g.bob) * 2;

    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(g.x - 5, g.y - 5 + bobY, 10, 10);

    ctx.fillStyle = "#cffafe";
    ctx.fillRect(g.x - 2, g.y - 7 + bobY, 4, 4);
  }
}

function drawEffects() {
  for (const ef of game.effects) {
    const rate = ef.life / ef.maxLife;
    ctx.globalAlpha = clamp(rate, 0, 1);

    if (ef.type === "circle") {
      ctx.strokeStyle = ef.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.radius * (1.05 - rate * 0.1), 0, Math.PI * 2);
      ctx.stroke();
    }

    if (ef.type === "lightning") {
      ctx.strokeStyle = ef.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ef.x - 10, ef.y - 45);
      ctx.lineTo(ef.x + 4, ef.y - 18);
      ctx.lineTo(ef.x - 5, ef.y - 18);
      ctx.lineTo(ef.x + 10, ef.y + 26);
      ctx.stroke();
    }

    if (ef.type === "pop") {
      ctx.strokeStyle = ef.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(
        ef.x - ef.radius * (1 - rate),
        ef.y - ef.radius * (1 - rate),
        ef.radius * 2 * (1 - rate),
        ef.radius * 2 * (1 - rate)
      );
    }

    ctx.globalAlpha = 1;
  }
}

function drawWeaponInfo() {
  const p = game.player;

  ctx.fillStyle = "rgba(2, 6, 23, 0.72)";
  ctx.fillRect(12, H - 78, 260, 58);

  ctx.strokeStyle = "#334155";
  ctx.strokeRect(12, H - 78, 260, 58);

  ctx.fillStyle = "#e5e7eb";
  ctx.font = "14px Courier New";
  ctx.fillText(`Knife Lv.${p.knifeLevel}`, 24, H - 52);
  ctx.fillText(`Fire Lv.${p.fireLevel}`, 124, H - 52);
  ctx.fillText(`Lightning Lv.${p.lightningLevel}`, 24, H - 30);
}

// ------------------------------
// 汎用関数
// ------------------------------
function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(sec) {
  const total = Math.floor(sec);
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// 起動
init();
requestAnimationFrame((now) => {
  lastTime = now;
  requestAnimationFrame(loop);
});
