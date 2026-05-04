// Fire skill size / hitbox tuning patch.
// Enlarges the initial Fire Aura visual and aligns its hit radius with the rendered image size.
(function () {
  const VERSION = 'fire-size-1';

  function ready() {
    try {
      return (
        typeof game !== 'undefined' &&
        typeof distance === 'function' &&
        typeof damageEnemy === 'function' &&
        typeof removeDeadEnemies === 'function'
      );
    } catch (e) {
      return false;
    }
  }

  function patchFireAura() {
    if (!ready()) return false;

    useFireAura = function () {
      const p = game.player;
      const level = Math.max(1, p.fireLevel || 1);

      // The visibility patch draws the fire sprite at about 78% of drawSize.
      // So we enlarge drawSize and base hitRadius on the final visible sprite radius.
      const drawSize = 104 + level * 12;
      const visibleRadius = drawSize * 0.78 * 0.5;
      const hitRadius = Math.round(visibleRadius * 0.92);
      const damage = 10 + level * 4;

      game.effects.push({
        type: 'fireSkill',
        x: p.x,
        y: p.y,
        hitRadius,
        radius: hitRadius,
        drawSize,
        life: 0.82,
        maxLife: 0.82,
        opacity: 0.48,
        color: '#f97316'
      });

      for (const e of game.enemies) {
        if (distance(p.x, p.y, e.x, e.y) <= hitRadius + e.radius) {
          damageEnemy(e, damage);
        }
      }
      removeDeadEnemies();
    };

    window.__rinFireSizePatch = VERSION;
    return true;
  }

  function install() {
    patchFireAura();
    let count = 0;
    const id = setInterval(function () {
      patchFireAura();
      count += 1;
      if (count > 40) clearInterval(id);
    }, 100);
  }

  window.addEventListener('load', install);
  document.addEventListener('DOMContentLoaded', install);
  setTimeout(install, 250);
})();
