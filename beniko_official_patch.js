/* Beniko official patch - full-body display fix */
(function () {
  const VERSION = 'beniko-fullbody-fix-1';
  const BENIKO = {
    id: 'beniko',
    name: 'Beniko',
    version: 'Star Mage',
    desc: 'ゲームコントローラーを媒体に、青い星形エネルギー弾を撃つ狐娘。',
    weapon: 'Game Controller',
    dot: `assets/characters/beniko/dot.png?v=${VERSION}`,
    portrait: `assets/characters/beniko/portrait.jpg?v=${VERSION}`,
    idleFrames: [
      `assets/characters/beniko/idle.gif?v=${VERSION}`,
      `assets/characters/beniko/idle.gif?v=${VERSION}`,
      `assets/characters/beniko/idle.gif?v=${VERSION}`,
      `assets/characters/beniko/idle.gif?v=${VERSION}`,
    ],
    spriteW: 58,
    spriteH: 58,
  };

  const RIN = {
    id: 'rin',
    name: 'Rin',
    version: 'Normal',
    desc: 'Dual-pistol survivor with balanced speed and stable firepower.',
    weapon: 'Dual Pistols',
    dot: 'assets/player/rin/idle/frame_01.png',
    portrait: 'player/rin_portrait.png?v=vfx-tuned-2',
    spriteW: 44,
    spriteH: 58,
  };

  let rinIdleFrames = null;
  let benikoIdleFrames = null;

  function setImage(img, src, label) {
    if (!img) return;
    img.onerror = () => console.error(`[BenikoPatch] failed to load ${label}:`, src);
    img.removeAttribute('srcset');
    img.src = src;
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    img.style.objectFit = 'contain';
    img.style.objectPosition = 'center center';
  }

  function currentId() {
    try { return selectedCharacter || window.selectedCharacter || 'rin'; }
    catch (error) { return window.selectedCharacter || 'rin'; }
  }

  function getCurrentCharacter() {
    return currentId() === 'beniko' ? BENIKO : RIN;
  }

  function setSelectedCharacter(id) {
    try { selectedCharacter = id; } catch (error) {}
    window.selectedCharacter = id;
  }

  function ensureBenikoCell() {
    const grid = document.getElementById('characterGrid');
    if (!grid) return;
    let cell = grid.querySelector('[data-character="beniko"]');
    if (!cell) {
      cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'character-cell';
      cell.dataset.character = 'beniko';
      const firstLocked = grid.querySelector('.character-cell.locked');
      if (firstLocked) firstLocked.replaceWith(cell);
      else grid.appendChild(cell);
    }
    cell.classList.remove('locked');
    cell.dataset.character = 'beniko';
    cell.innerHTML = '<img alt="Beniko dot" /><span>Beniko</span>';
    const img = cell.querySelector('img');
    setImage(img, BENIKO.dot, 'Beniko dot');
    img.style.maxWidth = '86%';
    img.style.maxHeight = '86%';
    img.style.width = '86%';
    img.style.height = '86%';
    img.style.margin = 'auto';
  }

  function renderCharacterDetail(id) {
    const data = id === 'beniko' ? BENIKO : RIN;
    document.querySelectorAll('#characterGrid .character-cell').forEach((cell) => {
      if (cell.dataset.character) cell.classList.toggle('selected', cell.dataset.character === id);
    });
    const portrait = document.getElementById('characterPortrait');
    setImage(portrait, data.portrait, `${data.name} portrait`);
    if (id === 'beniko') {
      portrait.style.objectFit = 'contain';
      portrait.style.width = '100%';
      portrait.style.height = '100%';
    }
    const name = document.getElementById('characterName');
    const version = document.getElementById('characterVersion');
    const desc = document.getElementById('characterDesc');
    const stats = document.querySelectorAll('.character-stats > div b');
    if (name) name.textContent = data.name;
    if (version) version.textContent = data.version;
    if (desc) desc.textContent = data.desc;
    if (stats[0]) stats[0].textContent = '100';
    if (stats[1]) stats[1].textContent = 'Normal';
    if (stats[2]) stats[2].textContent = data.weapon;
  }

  function selectCharacterClean(id) {
    if (id !== 'beniko' && id !== 'rin') return;
    setSelectedCharacter(id);
    renderCharacterDetail(id);
  }

  function makeBenikoIdleFrames() {
    if (benikoIdleFrames) return benikoIdleFrames;
    benikoIdleFrames = BENIKO.idleFrames.map((src, idx) => {
      const img = new Image();
      img.onerror = () => console.error(`[BenikoPatch] failed to load Beniko idle frame ${idx + 1}:`, src);
      img.src = src;
      return img;
    });
    return benikoIdleFrames;
  }

  function applyRuntimeCharacter() {
    const data = getCurrentCharacter();
    if (!rinIdleFrames && Array.isArray(images?.playerIdle)) rinIdleFrames = [...images.playerIdle];
    try {
      if (data.id === 'beniko') {
        images.playerIdle = makeBenikoIdleFrames();
        SPRITE.player.w = BENIKO.spriteW;
        SPRITE.player.h = BENIKO.spriteH;
        if (UPGRADE_POOL?.[0]) {
          UPGRADE_POOL[0].title = '星魔法強化';
          UPGRADE_POOL[0].desc = '星形エネルギー弾の数と威力を上げます。';
        }
      } else {
        if (rinIdleFrames) images.playerIdle = rinIdleFrames;
        SPRITE.player.w = RIN.spriteW;
        SPRITE.player.h = RIN.spriteH;
        if (UPGRADE_POOL?.[0]) {
          UPGRADE_POOL[0].title = '二丁拳銃強化';
          UPGRADE_POOL[0].desc = '弾数と威力を上げます。';
        }
      }
    } catch (error) {
      console.error('[BenikoPatch] failed to apply runtime character', error);
    }
  }

  function drawStarProjectile(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle || 0);
    ctx.globalCompositeOperation = 'lighter';
    const trail = ctx.createLinearGradient(-34, 0, 8, 0);
    trail.addColorStop(0, 'rgba(73,230,255,0)');
    trail.addColorStop(0.4, 'rgba(64,207,255,.5)');
    trail.addColorStop(1, 'rgba(22,136,255,.95)');
    ctx.strokeStyle = trail;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.lineTo(-7, 0);
    ctx.stroke();
    ctx.rotate((b.spin || 0) + performance.now() / 180);
    ctx.shadowColor = '#45eaff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#0c65ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5 : 11;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function patchRuntimeFunctions() {
    const originalSelect = typeof selectCharacter === 'function' ? selectCharacter : null;
    selectCharacter = function patchedSelectCharacter(id) {
      if (id === 'beniko' || id === 'rin') return selectCharacterClean(id);
      return originalSelect?.(id);
    };

    const originalStart = typeof startGame === 'function' ? startGame : null;
    startGame = function patchedStartGame() {
      const chosen = currentId();
      setSelectedCharacter(chosen);
      originalStart?.();
      setSelectedCharacter(chosen);
      try { game.selectedCharacter = chosen; } catch (error) {}
      applyRuntimeCharacter();
      try { updateUI(); } catch (error) {}
    };

    const originalFireKnife = typeof fireKnife === 'function' ? fireKnife : null;
    fireKnife = function patchedFireKnife() {
      if (getCurrentCharacter().id !== 'beniko') return originalFireKnife?.();
      const p = game.player;
      const count = Math.min(1 + Math.floor(p.knifeLevel / 2), 5);
      const damage = 16 + p.knifeLevel * 6;
      for (let i = 0; i < count; i++) {
        const target = findNearestEnemy();
        let a = target ? Math.atan2(target.y - p.y, target.x - p.x) : -Math.PI / 2;
        a += (i - (count - 1) / 2) * 0.18;
        game.projectiles.push({ type: 'starMagic', x: p.x, y: p.y - 12, vx: Math.cos(a) * 390, vy: Math.sin(a) * 390, radius: 10, damage, life: 1.15, pierce: Math.floor(p.knifeLevel / 3), angle: a, spin: Math.random() * Math.PI * 2 });
      }
    };

    const originalDrawProjectiles = typeof drawProjectiles === 'function' ? drawProjectiles : null;
    drawProjectiles = function patchedDrawProjectiles() {
      const projectiles = game?.projectiles || [];
      const stars = projectiles.filter((b) => b.type === 'starMagic');
      if (!stars.length) return originalDrawProjectiles?.();
      const originalList = game.projectiles;
      game.projectiles = projectiles.filter((b) => b.type !== 'starMagic');
      originalDrawProjectiles?.();
      game.projectiles = originalList;
      for (const star of stars) drawStarProjectile(star);
    };

    const originalUpdateUI = typeof updateUI === 'function' ? updateUI : null;
    updateUI = function patchedUpdateUI() {
      originalUpdateUI?.();
      const data = getCurrentCharacter();
      const playerName = document.querySelector('.player-name');
      const hudPortrait = document.querySelector('.hud-rin-portrait');
      const weaponLabel = document.querySelector('.skill-slot.active strong');
      if (playerName) playerName.textContent = data.name;
      if (weaponLabel) weaponLabel.textContent = data.weapon;
      if (hudPortrait) setImage(hudPortrait, data.portrait, `${data.name} HUD portrait`);
    };
  }

  function bindEvents() {
    const grid = document.getElementById('characterGrid');
    grid?.addEventListener('click', (event) => {
      const cell = event.target.closest('.character-cell');
      if (cell?.dataset.character === 'beniko' || cell?.dataset.character === 'rin') {
        event.preventDefault();
        event.stopImmediatePropagation();
        selectCharacterClean(cell.dataset.character);
      }
    }, true);
    grid?.addEventListener('dblclick', (event) => {
      const cell = event.target.closest('.character-cell');
      if (cell?.dataset.character === 'beniko' || cell?.dataset.character === 'rin') {
        event.preventDefault();
        event.stopImmediatePropagation();
        selectCharacterClean(cell.dataset.character);
        startGame();
      }
    }, true);
    document.getElementById('confirmCharacterButton')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      startGame();
    }, true);
  }

  function init() {
    ensureBenikoCell();
    patchRuntimeFunctions();
    bindEvents();
    renderCharacterDetail(currentId());
    window.__benikoOfficialPatch = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
