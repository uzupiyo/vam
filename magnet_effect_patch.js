// Magnet pickup effect patch.
// When Rin picks up a magnet, all dropped EXP gems fly toward the player instead of being collected instantly.
(function () {
  function ready() {
    return typeof game !== 'undefined' && typeof distance === 'function' && typeof gainExp === 'function';
  }

  function magnetizeAllGems() {
    if (!ready() || !game.gems || game.gems.length === 0) return;

    for (const g of game.gems) {
      g.magnetized = true;
      g.magnetTime = 0;
      g.trail = [];
    }
  }

  function installPatch() {
    if (!ready()) {
      setTimeout(installPatch, 100);
      return;
    }

    if (window.__magnetEffectPatchInstalled) return;
    window.__magnetEffectPatchInstalled = true;

    if (typeof collectAllGems === 'function') {
      collectAllGems = magnetizeAllGems;
    }

    if (typeof applyItem === 'function') {
      const originalApplyItem = applyItem;
      applyItem = function (typeKey) {
        const p = game.player;

        if (typeKey === 'magnet') {
          magnetizeAllGems();
          if (typeof showMessage === 'function') showMessage('EXP吸引！');
          if (game.effects) {
            game.effects.push({
              type: 'circle',
              x: p.x,
              y: p.y,
              radius: 150,
              life: 0.45,
              maxLife: 0.45,
              color: '#38bdf8',
            });
          }
          return;
        }

        return originalApplyItem(typeKey);
      };
    }

    updateGems = function (dt) {
      const p = game.player;

      for (let i = game.gems.length - 1; i >= 0; i--) {
        const g = game.gems[i];
        g.bob += dt * (g.magnetized ? 14 : 8);

        if (g.magnetized) {
          g.magnetTime = (g.magnetTime || 0) + dt;
          if (!g.trail) g.trail = [];
          g.trail.push({ x: g.x, y: g.y });
          if (g.trail.length > 7) g.trail.shift();

          const dx = p.x - g.x;
          const dy = p.y - g.y;
          const d = Math.hypot(dx, dy) || 1;

          // Accelerate toward the player so far gems visibly converge, but do not take too long.
          const speed = 420 + Math.min(1300, d * 2.2) + Math.min(1200, g.magnetTime * 2400);
          g.x += (dx / d) * speed * dt;
          g.y += (dy / d) * speed * dt;
        } else {
          const d = distance(p.x, p.y, g.x, g.y);
          if (d <= p.pickupRange) {
            const angle = Math.atan2(p.y - g.y, p.x - g.x);
            const pullSpeed = 250 + (p.pickupRange - d) * 6;
            g.x += Math.cos(angle) * pullSpeed * dt;
            g.y += Math.sin(angle) * pullSpeed * dt;
          }
        }

        const hitDistance = distance(p.x, p.y, g.x, g.y);
        if (hitDistance <= p.radius + g.radius + 3) {
          gainExp(g.value);
          if (game.effects) {
            game.effects.push({
              type: 'spark',
              x: p.x,
              y: p.y,
              radius: 8,
              life: 0.18,
              maxLife: 0.18,
              color: '#67e8f9',
            });
          }
          game.gems.splice(i, 1);
        }
      }
    };

    drawGems = function () {
      for (const g of game.gems) {
        const bobY = g.magnetized ? 0 : Math.sin(g.bob) * 2;

        if (g.magnetized && g.trail && g.trail.length > 0) {
          for (let i = 0; i < g.trail.length; i++) {
            const t = g.trail[i];
            const alpha = (i + 1) / (g.trail.length * 2.2);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#67e8f9';
            ctx.fillRect(Math.round(t.x - 3), Math.round(t.y - 3), 6, 6);
          }
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = g.magnetized ? '#38bdf8' : '#22d3ee';
        ctx.fillRect(Math.round(g.x - 5), Math.round(g.y - 5 + bobY), 10, 10);

        ctx.fillStyle = g.magnetized ? '#ffffff' : '#cffafe';
        ctx.fillRect(Math.round(g.x - 2), Math.round(g.y - 7 + bobY), 4, 4);

        if (g.magnetized) {
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(g.x - 6), Math.round(g.y - 6), 12, 12);
        }

        ctx.globalAlpha = 1;
      }
    };
  }

  window.addEventListener('load', installPatch);
  document.addEventListener('DOMContentLoaded', installPatch);
  setTimeout(installPatch, 250);
})();
