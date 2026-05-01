/* Force Beniko visual + selection patch v3 - official assets only */
(function () {
  const V = 'beniko-official-assets-1';
  const DOT = `assets/characters/beniko/dot.png?v=${V}`;
  const PORTRAIT = `assets/characters/beniko/portrait.png?v=${V}`;

  function setImg(img, src) {
    if (!img) return;
    img.onerror = null;
    img.removeAttribute('srcset');
    img.src = src;
    img.style.display = 'block';
    img.style.visibility = 'visible';
    img.style.opacity = '1';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
  }

  function ensureBenikoCell() {
    const grid = document.getElementById('characterGrid');
    if (!grid) return;
    let cell = grid.querySelector('[data-character="beniko"]');
    if (!cell) {
      cell = document.createElement('button');
      cell.className = 'character-cell';
      cell.dataset.character = 'beniko';
      cell.type = 'button';
      const locked = grid.querySelector('.character-cell.locked');
      if (locked) locked.replaceWith(cell);
      else grid.appendChild(cell);
    }
    cell.classList.remove('locked');
    cell.dataset.character = 'beniko';
    if (!cell.querySelector('img')) cell.innerHTML = '<img alt="Beniko dot"><span>Beniko</span>';
    setImg(cell.querySelector('img'), DOT);
    const label = cell.querySelector('span:not(.question)') || document.createElement('span');
    label.textContent = 'Beniko';
    if (!label.parentNode) cell.appendChild(label);
  }

  function chooseBeniko() {
    try { selectedCharacter = 'beniko'; } catch (e) {}
    window.selectedCharacter = 'beniko';
    document.querySelectorAll('#characterGrid .character-cell').forEach((cell) => {
      cell.classList.toggle('selected', cell.dataset.character === 'beniko');
    });
    setImg(document.getElementById('characterPortrait'), PORTRAIT);
    const name = document.getElementById('characterName');
    const version = document.getElementById('characterVersion');
    const desc = document.getElementById('characterDesc');
    const stats = document.querySelectorAll('.character-stats b');
    if (name) name.textContent = 'Beniko';
    if (version) version.textContent = 'Star Mage';
    if (desc) desc.textContent = 'ゲームコントローラーを媒体に、青い星形エネルギー弾を撃つ狐娘。';
    if (stats[2]) stats[2].textContent = 'Game Controller';
  }

  function patchRuntime() {
    if (window.__benikoOfficialAssetPatch) return;
    window.__benikoOfficialAssetPatch = true;

    const oldStart = typeof startGame === 'function' ? startGame : null;
    if (oldStart) {
      startGame = function () {
        const chosen = window.selectedCharacter || (typeof selectedCharacter !== 'undefined' ? selectedCharacter : 'rin');
        oldStart();
        if (chosen === 'beniko') {
          try {
            selectedCharacter = 'beniko';
            game.selectedCharacter = 'beniko';
            images.playerIdle = [DOT, DOT, DOT, DOT].map((src) => {
              const img = new Image();
              img.src = src;
              return img;
            });
            SPRITE.player.w = 58;
            SPRITE.player.h = 58;
          } catch (e) {}
        }
      };
    }

    const oldFire = typeof fireKnife === 'function' ? fireKnife : null;
    if (oldFire) {
      fireKnife = function () {
        const chosen = window.selectedCharacter || (typeof selectedCharacter !== 'undefined' ? selectedCharacter : 'rin');
        if (chosen !== 'beniko') return oldFire();
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
    }

    const oldDraw = typeof drawProjectiles === 'function' ? drawProjectiles : null;
    if (oldDraw) {
      drawProjectiles = function () {
        const projectiles = game?.projectiles || [];
        const nonStars = projectiles.filter((b) => b.type !== 'starMagic');
        const stars = projectiles.filter((b) => b.type === 'starMagic');
        if (!stars.length) return oldDraw();

        const originalProjectiles = game.projectiles;
        game.projectiles = nonStars;
        oldDraw();
        game.projectiles = originalProjectiles;

        for (const b of stars) {
          ctx.save();
          ctx.translate(b.x, b.y);
          ctx.rotate(b.angle || 0);
          ctx.globalCompositeOperation = 'lighter';
          const grad = ctx.createLinearGradient(-34, 0, 8, 0);
          grad.addColorStop(0, 'rgba(73,230,255,0)');
          grad.addColorStop(0.4, 'rgba(64,207,255,.5)');
          grad.addColorStop(1, 'rgba(22,136,255,.95)');
          ctx.strokeStyle = grad;
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
      };
    }
  }

  function init() {
    ensureBenikoCell();
    patchRuntime();
    const grid = document.getElementById('characterGrid');
    grid?.addEventListener('click', (event) => {
      const cell = event.target.closest('.character-cell');
      if (cell?.dataset.character === 'beniko') {
        event.preventDefault();
        event.stopImmediatePropagation();
        chooseBeniko();
      }
    }, true);
    grid?.addEventListener('dblclick', (event) => {
      const cell = event.target.closest('.character-cell');
      if (cell?.dataset.character === 'beniko') {
        event.preventDefault();
        event.stopImmediatePropagation();
        chooseBeniko();
        startGame();
      }
    }, true);
    document.getElementById('confirmCharacterButton')?.addEventListener('click', (event) => {
      if ((window.selectedCharacter || selectedCharacter) === 'beniko') {
        event.preventDefault();
        event.stopImmediatePropagation();
        startGame();
      }
    }, true);
    setInterval(ensureBenikoCell, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
