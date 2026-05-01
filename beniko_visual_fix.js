/* Beniko visual/runtime hard fix */
(function () {
  const VERSION = 'beniko-visual-fix-1';
  const DOT_FALLBACK = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" shape-rendering="crispEdges"><rect width="96" height="96" fill="transparent"/><rect x="24" y="22" width="48" height="48" rx="8" fill="#ff6aa8"/><path d="M24 22 L15 8 L35 20 Z M72 22 L81 8 L61 20 Z" fill="#d63b55"/><path d="M31 38h10v10H31zM55 38h10v10H55z" fill="#59dfff"/><path d="M35 42h5v5h-5zM59 42h5v5h-5z" fill="#fff"/><rect x="36" y="54" width="24" height="6" fill="#7a1d42"/><rect x="30" y="68" width="36" height="18" fill="#ff9bcc"/><rect x="36" y="74" width="24" height="8" fill="#111827"/><path d="M66 48 C88 44 91 68 69 72 C82 62 80 53 66 56 Z" fill="#d63b55"/><rect x="18" y="72" width="12" height="10" fill="#111827"/><rect x="66" y="72" width="12" height="10" fill="#111827"/><rect x="38" y="63" width="20" height="7" rx="2" fill="#111827"/><circle cx="43" cy="66" r="1.8" fill="#59dfff"/><circle cx="52" cy="66" r="1.8" fill="#ff6aa8"/></svg>`);
  const PORTRAIT_FALLBACK = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 420"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b1540"/><stop offset=".45" stop-color="#ff6aa8"/><stop offset="1" stop-color="#35d9ff"/></linearGradient><filter id="g"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="320" height="420" fill="url(#bg)"/><g opacity=".55" filter="url(#g)"><path d="M31 314 C112 209 183 374 287 173" fill="none" stroke="#7df7ff" stroke-width="12"/><path d="M32 144 C132 37 224 61 288 122" fill="none" stroke="#fff" stroke-width="7"/></g><g transform="translate(160 214)"><path d="M52 21 C126 23 142 117 64 145 C111 90 86 51 40 61 Z" fill="#b42346"/><path d="M-62 -96 L-102 -166 L-35 -116 Z M62 -96 L102 -166 L35 -116 Z" fill="#d63b55" stroke="#2b0f28" stroke-width="5"/><ellipse cx="0" cy="-54" rx="78" ry="87" fill="#ff6aa8"/><path d="M-76 -60 C-85 25 -45 75 0 75 C45 75 85 25 76 -60 C50 -22 -52 -22 -76 -60Z" fill="#ffe0ec"/><ellipse cx="-29" cy="-48" rx="12" ry="17" fill="#59dfff"/><ellipse cx="29" cy="-48" rx="12" ry="17" fill="#59dfff"/><path d="M-29 -59 l3 7 8 0 -6 5 2 8 -7 -5 -7 5 2 -8 -6 -5 8 0zM29 -59 l3 7 8 0 -6 5 2 8 -7 -5 -7 5 2 -8 -6 -5 8 0z" fill="#fff"/><path d="M-18 -18 Q0 -6 18 -18" fill="none" stroke="#6b1232" stroke-width="5" stroke-linecap="round"/><path d="M-58 38 h116 v116 h-116z" fill="#ff9bcc"/><path d="M-38 70 h76 v56 h-76z" fill="#101827"/><rect x="-44" y="116" width="88" height="28" rx="10" fill="#111827"/><circle cx="-17" cy="130" r="5" fill="#7df7ff"/><circle cx="18" cy="130" r="5" fill="#ff6aa8"/></g><text x="160" y="394" text-anchor="middle" font-family="monospace" font-size="30" font-weight="900" fill="#fff" stroke="#0b1024" stroke-width="4">Beniko</text></svg>`);

  const beniko = {
    name: 'Beniko',
    version: 'Star Mage',
    desc: 'ゲームコントローラーを媒体に、青い星形エネルギー弾を撃つ狐娘。',
    weapon: 'Game Controller',
    dot: `assets/characters/beniko/dot.png?v=${VERSION}`,
    portrait: `assets/characters/beniko/portrait.png?v=${VERSION}`
  };
  const rin = {
    name: 'Rin',
    version: 'Normal',
    desc: 'Dual-pistol survivor with balanced speed and stable firepower.',
    weapon: 'Dual Pistols',
    dot: 'assets/player/rin/idle/frame_01.png',
    portrait: 'player/rin_portrait.png'
  };

  function forceImg(img, src, fallback) {
    if (!img) return;
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    img.onerror = () => { img.onerror = null; img.src = fallback; };
    img.src = src;
  }

  function ensureCell() {
    const grid = document.getElementById('characterGrid');
    if (!grid) return;
    let cell = grid.querySelector('[data-character="beniko"]');
    if (!cell) {
      const locked = grid.querySelector('.character-cell.locked');
      cell = document.createElement('button');
      cell.className = 'character-cell';
      cell.type = 'button';
      cell.dataset.character = 'beniko';
      if (locked) locked.replaceWith(cell); else grid.appendChild(cell);
    }
    cell.classList.remove('locked');
    cell.dataset.character = 'beniko';
    cell.innerHTML = '<img alt="Beniko dot"/><span>Beniko</span>';
    forceImg(cell.querySelector('img'), beniko.dot, DOT_FALLBACK);
  }

  function showDetail(key) {
    const data = key === 'beniko' ? beniko : rin;
    document.querySelectorAll('#characterGrid .character-cell').forEach(c => {
      if (c.dataset.character) c.classList.toggle('selected', c.dataset.character === key);
    });
    const portrait = document.getElementById('characterPortrait');
    forceImg(portrait, data.portrait + (data.portrait.includes('?') ? '' : `?v=${VERSION}`), key === 'beniko' ? PORTRAIT_FALLBACK : data.portrait);
    const name = document.getElementById('characterName');
    const version = document.getElementById('characterVersion');
    const desc = document.getElementById('characterDesc');
    const stats = document.querySelectorAll('.character-stats > div b');
    if (name) name.textContent = data.name;
    if (version) version.textContent = data.version;
    if (desc) desc.textContent = data.desc;
    if (stats[2]) stats[2].textContent = data.weapon;
  }

  function choose(key) {
    window.selectedCharacter = key;
    try { selectedCharacter = key; } catch (e) {}
    showDetail(key);
  }

  function patchStart() {
    const oldStart = window.startGame || (typeof startGame === 'function' ? startGame : null);
    const patched = function () {
      const chosen = (typeof selectedCharacter !== 'undefined' && selectedCharacter) || window.selectedCharacter || 'rin';
      try { selectedCharacter = chosen; } catch (e) {}
      oldStart?.();
      try { selectedCharacter = chosen; game.selectedCharacter = chosen; } catch (e) {}
      if (chosen === 'beniko') {
        const imgs = [0, 1, 2, 3].map(() => { const im = new Image(); im.onerror = () => { im.src = DOT_FALLBACK; }; im.src = beniko.dot; return im; });
        try { images.playerIdle = imgs; SPRITE.player.w = 58; SPRITE.player.h = 58; } catch (e) {}
      }
      showDetail(chosen);
    };
    try { startGame = patched; } catch (e) {}
    window.startGame = patched;
  }

  function patchAttack() {
    const oldFire = window.fireKnife || (typeof fireKnife === 'function' ? fireKnife : null);
    const patchedFire = function () {
      const chosen = (typeof selectedCharacter !== 'undefined' && selectedCharacter) || window.selectedCharacter || 'rin';
      if (chosen !== 'beniko') return oldFire?.();
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
    try { fireKnife = patchedFire; } catch (e) {}
    window.fireKnife = patchedFire;

    const oldDraw = window.drawProjectiles || (typeof drawProjectiles === 'function' ? drawProjectiles : null);
    const patchedDraw = function () {
      const list = game?.projectiles || [];
      let hasStar = false;
      for (const b of list) if (b.type === 'starMagic') hasStar = true;
      if (!hasStar) return oldDraw?.();
      for (const b of list) {
        if (b.type !== 'starMagic') continue;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle || 0); ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createLinearGradient(-34, 0, 8, 0); grad.addColorStop(0, 'rgba(73,230,255,0)'); grad.addColorStop(.4, 'rgba(64,207,255,.5)'); grad.addColorStop(1, 'rgba(22,136,255,.95)');
        ctx.strokeStyle = grad; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(-7, 0); ctx.stroke();
        ctx.rotate((b.spin || 0) + performance.now() / 180); ctx.shadowColor = '#45eaff'; ctx.shadowBlur = 12; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0c65ff'; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 5 : 11; const a = -Math.PI / 2 + i * Math.PI / 5; const x = Math.cos(a) * r; const y = Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    };
    try { drawProjectiles = patchedDraw; } catch (e) {}
    window.drawProjectiles = patchedDraw;
  }

  function init() {
    ensureCell();
    patchStart();
    patchAttack();
    const grid = document.getElementById('characterGrid');
    grid?.addEventListener('click', (ev) => { const c = ev.target.closest('.character-cell'); if (c?.dataset.character === 'beniko') { ev.preventDefault(); ev.stopImmediatePropagation(); choose('beniko'); } }, true);
    grid?.addEventListener('dblclick', (ev) => { const c = ev.target.closest('.character-cell'); if (c?.dataset.character === 'beniko') { ev.preventDefault(); ev.stopImmediatePropagation(); choose('beniko'); window.startGame?.(); } }, true);
    const confirm = document.getElementById('confirmCharacterButton');
    confirm?.addEventListener('click', () => { if ((window.selectedCharacter || selectedCharacter) === 'beniko') choose('beniko'); }, true);
    showDetail((window.selectedCharacter || (typeof selectedCharacter !== 'undefined' ? selectedCharacter : 'rin')) || 'rin');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
