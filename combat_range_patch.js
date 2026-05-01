// Combat targeting/collision patch.
// Normal attacks only target nearby on-screen enemies, and projectiles do not hit enemies far outside the screen.
(function () {
  const TARGET_RANGE = 360;
  const SCREEN_MARGIN = 36;

  function ready() {
    return (
      typeof game !== 'undefined' &&
      typeof W !== 'undefined' &&
      typeof H !== 'undefined' &&
      typeof distance === 'function' &&
      typeof damageEnemy === 'function' &&
      typeof removeDeadEnemies === 'function'
    );
  }

  function isNearScreen(entity, margin) {
    return (
      entity.x >= -margin &&
      entity.x <= W + margin &&
      entity.y >= -margin &&
      entity.y <= H + margin
    );
  }

  function installPatch() {
    if (!ready()) {
      setTimeout(installPatch, 100);
      return;
    }

    if (window.__combatRangePatchInstalled) return;
    window.__combatRangePatchInstalled = true;

    // Replace target selection used by fireKnife().
    // fireKnife() calls findNearestEnemy() without args, so this default range is applied automatically.
    findNearestEnemy = function (maxRange = TARGET_RANGE) {
      if (!game || !game.player || !game.enemies) return null;
      const p = game.player;
      let best = null;
      let bestD = maxRange;

      for (const e of game.enemies) {
        if (!isNearScreen(e, SCREEN_MARGIN)) continue;
        const d = distance(p.x, p.y, e.x, e.y);
        if (d < bestD) {
          best = e;
          bestD = d;
        }
      }

      return best;
    };

    // Replace projectile collision so bullets never damage enemies clearly outside the visible screen.
    updateProjectiles = function (dt) {
      if (!game || !game.projectiles || !game.enemies) return;

      for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const b = game.projectiles[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        for (const e of game.enemies) {
          // No collision while enemy is outside screen bounds.
          if (!isNearScreen(e, SCREEN_MARGIN)) continue;

          if (distance(b.x, b.y, e.x, e.y) <= b.radius + e.radius) {
            damageEnemy(e, b.damage);
            if (--b.pierce < 0) {
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
    };
  }

  installPatch();
  window.addEventListener('load', installPatch);
  document.addEventListener('DOMContentLoaded', installPatch);
  setTimeout(installPatch, 250);
  setTimeout(installPatch, 1000);
})();
