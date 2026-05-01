/* Force Beniko visual + selection patch v2 */
(function () {
  const V = 'beniko-force-v2';
  const dotSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" shape-rendering="crispEdges"><rect width="96" height="96" fill="transparent"/><path d="M24 22 15 8 35 20ZM72 22 81 8 61 20Z" fill="#d63b55"/><rect x="24" y="22" width="48" height="48" rx="8" fill="#ff6aa8"/><path d="M31 38h10v10H31zM55 38h10v10H55z" fill="#59dfff"/><path d="M35 42h5v5h-5zM59 42h5v5h-5z" fill="#fff"/><rect x="36" y="54" width="24" height="6" fill="#7a1d42"/><path d="M66 48C88 44 91 68 69 72C82 62 80 53 66 56Z" fill="#d63b55"/><rect x="30" y="68" width="36" height="18" fill="#ff9bcc"/><rect x="36" y="74" width="24" height="8" fill="#111827"/><rect x="38" y="63" width="20" height="7" rx="2" fill="#111827"/><circle cx="43" cy="66" r="2" fill="#59dfff"/><circle cx="52" cy="66" r="2" fill="#ff6aa8"/></svg>';
  const portraitSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 420"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b1540"/><stop offset=".45" stop-color="#ff6aa8"/><stop offset="1" stop-color="#35d9ff"/></linearGradient></defs><rect width="320" height="420" fill="url(#b)"/><path d="M32 145C132 37 224 61 288 122M31 314C112 209 183 374 287 173" fill="none" stroke="#7df7ff" stroke-width="10" opacity=".65"/><g transform="translate(160 214)"><path d="M52 21C126 23 142 117 64 145C111 90 86 51 40 61Z" fill="#b42346"/><path d="M-62-96-102-166-35-116ZM62-96 102-166 35-116Z" fill="#d63b55" stroke="#2b0f28" stroke-width="5"/><ellipse cx="0" cy="-54" rx="78" ry="87" fill="#ff6aa8"/><path d="M-76-60C-85 25-45 75 0 75C45 75 85 25 76-60C50-22-52-22-76-60Z" fill="#ffe0ec"/><ellipse cx="-29" cy="-48" rx="12" ry="17" fill="#59dfff"/><ellipse cx="29" cy="-48" rx="12" ry="17" fill="#59dfff"/><path d="M-29-59l3 7h8l-6 5 2 8-7-5-7 5 2-8-6-5h8zM29-59l3 7h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z" fill="#fff"/><path d="M-18-18Q0-6 18-18" fill="none" stroke="#6b1232" stroke-width="5" stroke-linecap="round"/><path d="M-58 38h116v116H-58z" fill="#ff9bcc"/><path d="M-38 70h76v56h-76z" fill="#101827"/><rect x="-44" y="116" width="88" height="28" rx="10" fill="#111827"/><circle cx="-17" cy="130" r="5" fill="#7df7ff"/><circle cx="18" cy="130" r="5" fill="#ff6aa8"/></g><text x="160" y="394" text-anchor="middle" font-family="monospace" font-size="30" font-weight="900" fill="#fff" stroke="#0b1024" stroke-width="4">Beniko</text></svg>';
  const DOT = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(dotSvg);
  const PORTRAIT = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(portraitSvg);

  function setImg(img, src) {
    if (!img) return;
    img.src = src;
    img.removeAttribute('srcset');
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
      if (locked) locked.replaceWith(cell); else grid.appendChild(cell);
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
    try { selectedCharacter = 'beniko'; } catch(e) {}
    window.selectedCharacter = 'beniko';
    document.querySelectorAll('#characterGrid .character-cell').forEach(c => c.classList.toggle('selected', c.dataset.character === 'beniko'));
    setImg(document.getElementById('characterPortrait'), PORTRAIT);
    const n = document.getElementById('characterName'); if (n) n.textContent = 'Beniko';
    const v = document.getElementById('characterVersion'); if (v) v.textContent = 'Star Mage';
    const d = document.getElementById('characterDesc'); if (d) d.textContent = 'ゲームコントローラーを媒体に、青い星形エネルギー弾を撃つ狐娘。';
    const stats = document.querySelectorAll('.character-stats b'); if (stats[2]) stats[2].textContent = 'Game Controller';
  }

  function patchRuntime() {
    if (window.__benikoForcePatched) return;
    window.__benikoForcePatched = true;
    const oldStart = typeof startGame === 'function' ? startGame : null;
    if (oldStart) {
      startGame = function () {
        const chosen = (window.selectedCharacter || (typeof selectedCharacter !== 'undefined' ? selectedCharacter : 'rin'));
        oldStart();
        if (chosen === 'beniko') {
          try { selectedCharacter = 'beniko'; game.selectedCharacter = 'beniko'; images.playerIdle = [DOT, DOT, DOT, DOT].map(src => { const im = new Image(); im.src = src; return im; }); SPRITE.player.w = 58; SPRITE.player.h = 58; } catch(e) {}
        }
      };
    }
    const oldFire = typeof fireKnife === 'function' ? fireKnife : null;
    if (oldFire) {
      fireKnife = function () {
        const chosen = window.selectedCharacter || (typeof selectedCharacter !== 'undefined' ? selectedCharacter : 'rin');
        if (chosen !== 'beniko') return oldFire();
        const p = game.player, count = Math.min(1 + Math.floor(p.knifeLevel / 2), 5), damage = 16 + p.knifeLevel * 6;
        for (let i = 0; i < count; i++) {
          const target = findNearestEnemy();
          let a = target ? Math.atan2(target.y - p.y, target.x - p.x) : -Math.PI / 2;
          a += (i - (count - 1) / 2) * 0.18;
          game.projectiles.push({ type:'starMagic', x:p.x, y:p.y-12, vx:Math.cos(a)*390, vy:Math.sin(a)*390, radius:10, damage, life:1.15, pierce:Math.floor(p.knifeLevel/3), angle:a, spin:Math.random()*Math.PI*2 });
        }
      };
    }
    const oldDraw = typeof drawProjectiles === 'function' ? drawProjectiles : null;
    if (oldDraw) {
      drawProjectiles = function () {
        const stars = (game?.projectiles || []).filter(b => b.type === 'starMagic');
        if (!stars.length) return oldDraw();
        for (const b of stars) {
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle || 0); ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createLinearGradient(-34,0,8,0); g.addColorStop(0,'rgba(73,230,255,0)'); g.addColorStop(.4,'rgba(64,207,255,.5)'); g.addColorStop(1,'rgba(22,136,255,.95)');
          ctx.strokeStyle = g; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-34,0); ctx.lineTo(-7,0); ctx.stroke();
          ctx.rotate((b.spin || 0) + performance.now()/180); ctx.shadowColor = '#45eaff'; ctx.shadowBlur = 12; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0c65ff'; ctx.lineWidth = 3; ctx.beginPath();
          for (let i=0;i<10;i++){ const r=i%2?5:11, a=-Math.PI/2+i*Math.PI/5, x=Math.cos(a)*r, y=Math.sin(a)*r; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }
          ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        }
      };
    }
  }

  function init() {
    ensureBenikoCell();
    patchRuntime();
    const grid = document.getElementById('characterGrid');
    grid?.addEventListener('click', e => { const c = e.target.closest('.character-cell'); if (c?.dataset.character === 'beniko') { e.preventDefault(); e.stopImmediatePropagation(); chooseBeniko(); } }, true);
    grid?.addEventListener('dblclick', e => { const c = e.target.closest('.character-cell'); if (c?.dataset.character === 'beniko') { e.preventDefault(); e.stopImmediatePropagation(); chooseBeniko(); startGame(); } }, true);
    document.getElementById('confirmCharacterButton')?.addEventListener('click', e => { if ((window.selectedCharacter || selectedCharacter) === 'beniko') { e.preventDefault(); e.stopImmediatePropagation(); startGame(); } }, true);
    setInterval(ensureBenikoCell, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
