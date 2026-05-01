/* Beniko character select / runtime patch */
(function () {
  const BENIKO_PATCH_VERSION = 'beniko-select-1';

  const CHARACTER_DATA = {
    rin: {
      id: 'rin',
      name: 'Rin',
      version: 'Normal',
      desc: 'Dual-pistol survivor with balanced speed and stable firepower.',
      weapon: 'Dual Pistols',
      dot: 'assets/player/rin/idle/frame_01.png',
      portrait: 'player/rin_portrait.png',
      hudPortrait: 'player/rin_portrait.png',
      sprite: { w: 44, h: 58 }
    },
    beniko: {
      id: 'beniko',
      name: 'Beniko',
      version: 'Star Mage',
      desc: 'Controller mage who fires blue star-shaped energy bullets.',
      weapon: 'Game Controller',
      dot: 'assets/characters/beniko/dot.png',
      portrait: 'assets/characters/beniko/portrait.png',
      hudPortrait: 'assets/characters/beniko/portrait.png',
      sprite: { w: 54, h: 54 }
    }
  };

  const rinIdleFrames = Array.isArray(images?.playerIdle) ? [...images.playerIdle] : [];
  const benikoIdleSources = [
    'assets/characters/beniko/dot.png',
    'assets/characters/beniko/dot.png',
    'assets/characters/beniko/dot.png',
    'assets/characters/beniko/dot.png'
  ];
  const benikoIdleFrames = benikoIdleSources.map((src) => {
    const img = new Image();
    img.src = `${src}?v=${BENIKO_PATCH_VERSION}`;
    return img;
  });

  function cacheBust(path) {
    return `${path}?v=${BENIKO_PATCH_VERSION}`;
  }

  function ensureBenikoCell() {
    const grid = document.getElementById('characterGrid');
    if (!grid || grid.querySelector('[data-character="beniko"]')) return;
    const firstLocked = grid.querySelector('.character-cell.locked');
    const cell = document.createElement('button');
    cell.className = 'character-cell';
    cell.dataset.character = 'beniko';
    cell.type = 'button';
    cell.innerHTML = `<img src="${cacheBust(CHARACTER_DATA.beniko.dot)}" alt="Beniko dot" /><span>Beniko</span>`;
    if (firstLocked) firstLocked.replaceWith(cell);
    else grid.appendChild(cell);
  }

  function setCharacterDetail(key) {
    const data = CHARACTER_DATA[key] || CHARACTER_DATA.rin;
    const portrait = document.getElementById('characterPortrait');
    const name = document.getElementById('characterName');
    const version = document.getElementById('characterVersion');
    const desc = document.getElementById('characterDesc');
    const statBlocks = document.querySelectorAll('.character-stats > div b');

    if (portrait) {
      portrait.src = cacheBust(data.portrait);
      portrait.alt = `${data.name} portrait`;
      portrait.classList.toggle('official-rin-portrait', key === 'rin');
      portrait.classList.toggle('official-beniko-portrait', key === 'beniko');
      portrait.parentElement?.classList.toggle('official-rin-portrait-wrap', key === 'rin');
      portrait.parentElement?.classList.toggle('official-beniko-portrait-wrap', key === 'beniko');
    }
    if (name) name.textContent = data.name;
    if (version) version.textContent = data.version;
    if (desc) desc.textContent = data.desc;
    if (statBlocks[0]) statBlocks[0].textContent = '100';
    if (statBlocks[1]) statBlocks[1].textContent = 'Normal';
    if (statBlocks[2]) statBlocks[2].textContent = data.weapon;
  }

  function applyRuntimeCharacter() {
    const data = CHARACTER_DATA[selectedCharacter] || CHARACTER_DATA.rin;
    if (selectedCharacter === 'beniko') {
      images.playerIdle = benikoIdleFrames;
      SPRITE.player.w = data.sprite.w;
      SPRITE.player.h = data.sprite.h;
      if (UPGRADE_POOL[0]) {
        UPGRADE_POOL[0].title = '星魔法強化';
        UPGRADE_POOL[0].desc = '星形エネルギー弾の数と威力を上げます。';
      }
    } else {
      images.playerIdle = rinIdleFrames;
      SPRITE.player.w = data.sprite.w;
      SPRITE.player.h = data.sprite.h;
      if (UPGRADE_POOL[0]) {
        UPGRADE_POOL[0].title = '二丁拳銃強化';
        UPGRADE_POOL[0].desc = '弾数と威力を上げます。';
      }
    }
  }

  const originalSelectCharacter = typeof selectCharacter === 'function' ? selectCharacter : null;
  selectCharacter = function patchedSelectCharacter(key) {
    if (!CHARACTER_DATA[key]) return;
    selectedCharacter = key;
    document.querySelectorAll('#characterGrid .character-cell').forEach((cell) => {
      cell.classList.toggle('selected', cell.dataset.character === key);
    });
    setCharacterDetail(key);
  };

  const originalStartGame = typeof startGame === 'function' ? startGame : null;
  startGame = function patchedStartGame() {
    game = createInitialGame();
    game.selectedCharacter = selectedCharacter;
    game.state = 'playing';
    keys.clear();
    hideAllOverlays();
    applyRuntimeCharacter();
    lastTime = performance.now();
    updateUI();
  };

  const originalFireKnife = typeof fireKnife === 'function' ? fireKnife : null;
  fireKnife = function patchedFireKnife() {
    if (selectedCharacter !== 'beniko') return originalFireKnife?.();
    const p = game.player;
    const count = Math.min(1 + Math.floor(p.knifeLevel / 2), 5);
    const damage = 16 + p.knifeLevel * 6;
    for (let i = 0; i < count; i++) {
      const target = findNearestEnemy();
      let a = target ? Math.atan2(target.y - p.y, target.x - p.x) : -Math.PI / 2;
      a += (i - (count - 1) / 2) * 0.18;
      game.projectiles.push({
        type: 'starMagic',
        x: p.x,
        y: p.y - 12,
        vx: Math.cos(a) * 390,
        vy: Math.sin(a) * 390,
        radius: 10,
        damage,
        life: 1.15,
        pierce: Math.floor(p.knifeLevel / 3),
        angle: a,
        spin: Math.random() * Math.PI * 2
      });
    }
  };

  function drawStarMagicProjectile(b) {
    const t = performance.now() / 100;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle || 0);
    ctx.globalCompositeOperation = 'lighter';

    const trail = ctx.createLinearGradient(-34, 0, 8, 0);
    trail.addColorStop(0, 'rgba(73,230,255,0)');
    trail.addColorStop(0.35, 'rgba(64,207,255,0.45)');
    trail.addColorStop(1, 'rgba(22,136,255,0.9)');
    ctx.strokeStyle = trail;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.lineTo(-8, 0);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(142,252,255,0.85)' : 'rgba(10,123,255,0.85)';
      ctx.fillRect(-28 - i * 6, -8 + ((i * 5 + Math.floor(t)) % 15), 3, 3);
    }

    ctx.rotate((b.spin || 0) + performance.now() / 180);
    ctx.shadowColor = '#45eaff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0c65ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const outer = 11;
    const inner = 5;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const x = Math.cos(ang) * r;
      const y = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(125,250,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const originalDrawProjectiles = typeof drawProjectiles === 'function' ? drawProjectiles : null;
  drawProjectiles = function patchedDrawProjectiles() {
    for (const b of game.projectiles) {
      if (b.type === 'starMagic') {
        drawStarMagicProjectile(b);
        continue;
      }
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle || 0);
      const weapon = images.items?.weapon;
      if (weapon && weapon.complete && weapon.naturalWidth > 0) {
        ctx.drawImage(weapon, -SPRITE.items.weapon.w / 2, -SPRITE.items.weapon.h / 2, SPRITE.items.weapon.w, SPRITE.items.weapon.h);
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-10, -2, 20, 4);
      }
      ctx.restore();
    }
  };

  const originalUpdateUI = typeof updateUI === 'function' ? updateUI : null;
  updateUI = function patchedUpdateUI() {
    originalUpdateUI?.();
    const data = CHARACTER_DATA[selectedCharacter] || CHARACTER_DATA.rin;
    const playerName = document.querySelector('.player-name');
    const hudPortrait = document.querySelector('.hud-rin-portrait');
    const activeWeapon = document.querySelector('.skill-slot.active strong');
    if (playerName) playerName.textContent = data.name;
    if (hudPortrait) {
      hudPortrait.src = cacheBust(data.hudPortrait);
      hudPortrait.alt = `${data.name} portrait`;
    }
    if (activeWeapon) activeWeapon.textContent = data.weapon;
  };

  function bindBenikoCharacterSelect() {
    ensureBenikoCell();
    const grid = document.getElementById('characterGrid');
    if (!grid) return;
    grid.addEventListener('click', (ev) => {
      const cell = ev.target.closest('.character-cell');
      if (cell?.dataset.character && CHARACTER_DATA[cell.dataset.character]) selectCharacter(cell.dataset.character);
    }, true);
    grid.addEventListener('dblclick', (ev) => {
      const cell = ev.target.closest('.character-cell');
      if (cell?.dataset.character && CHARACTER_DATA[cell.dataset.character]) {
        selectCharacter(cell.dataset.character);
        startGame();
      }
    }, true);
  }

  bindBenikoCharacterSelect();
  setCharacterDetail(selectedCharacter);
})();
