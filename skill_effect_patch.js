// Elemental skill effect patch for RIN SURVIVORS
// - Fire: softer semi-transparent burst, hit radius matches the visible art more closely.
// - Lightning: falling strike animation, each strike locks to a fixed point with no per-frame drift.
(function () {
  const VERSION = 'skill-fx-1';
  const fireStrip = new Image();
  const lightningStrip = new Image();
  fireStrip.src = 'assets/effects/fire_skill_strip.png?v=' + VERSION;
  lightningStrip.src = 'assets/effects/lightning_skill_strip.png?v=' + VERSION;

  const FIRE_FRAME_W = 32;
  const FIRE_FRAME_H = 32;
  const FIRE_FRAMES = 4;
  const LIGHT_FRAME_W = 32;
  const LIGHT_FRAME_H = 64;
  const LIGHT_FRAMES = 4;

  function ready() {
    return (
      typeof game !== 'undefined' &&
      typeof ctx !== 'undefined' &&
      typeof damageEnemy === 'function' &&
      typeof removeDeadEnemies === 'function' &&
      typeof distance === 'function' &&
      typeof clamp === 'function'
    );
  }

  function frameFromLife(ef, count) {
    const progress = 1 - ef.life / ef.maxLife;
    return Math.max(0, Math.min(count - 1, Math.floor(progress * count)));
  }

  function drawLegacyEffect(ef, rate) {
    if (ef.type === 'circle') {
      ctx.globalAlpha = clamp(rate, 0, 1);
      ctx.strokeStyle = ef.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(ef.x, ef.y, ef.radius * (1.05 - rate * 0.1), 0, Math.PI * 2);
      ctx.stroke();
    }

    if (ef.type === 'lightning') {
      ctx.globalAlpha = clamp(rate, 0, 1);
      ctx.strokeStyle = ef.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(ef.x - 10, ef.y - 45);
      ctx.lineTo(ef.x + 4, ef.y - 18);
      ctx.lineTo(ef.x - 5, ef.y - 18);
      ctx.lineTo(ef.x + 10, ef.y + 26);
      ctx.stroke();
    }

    if (ef.type === 'pop') {
      ctx.globalAlpha = clamp(rate, 0, 1);
      ctx.strokeStyle = ef.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(
        ef.x - ef.radius * (1 - rate),
        ef.y - ef.radius * (1 - rate),
        ef.radius * 2 * (1 - rate),
        ef.radius * 2 * (1 - rate)
      );
    }

    if (ef.type === 'spark') {
      ctx.globalAlpha = clamp(rate, 0, 1);
      ctx.fillStyle = ef.color;
      ctx.fillRect(ef.x - 2, ef.y - 8, 4, 16);
      ctx.fillRect(ef.x - 8, ef.y - 2, 16, 4);
    }
  }

  function installPatch() {
    if (!ready()) {
      setTimeout(installPatch, 100);
      return;
    }

    const apply = function () {
      useFireAura = function () {
        const level = Math.max(1, game.player.fireLevel || 1);
        const damage = 10 + level * 4;
        const hitRadius = 24 + level * 9;      // actual hitbox, tightened to match the art
        const drawSize = 72 + level * 8;       // visual size of the flame burst

        game.effects.push({
          type: 'fireSkill',
          x: game.player.x,
          y: game.player.y,
          drawSize,
          hitRadius,
          life: 0.78,
          maxLife: 0.78,
          opacity: 0.56
        });

        for (const e of game.enemies) {
          if (distance(game.player.x, game.player.y, e.x, e.y) <= hitRadius + e.radius) {
            damageEnemy(e, damage);
          }
        }
        removeDeadEnemies();
      };

      useLightning = function () {
        const level = Math.max(1, game.player.lightningLevel || 1);
        const hitCount = Math.min(1 + Math.floor(level / 2), 5);
        const damage = 24 + level * 8;
        const candidates = (game.enemies || []).filter(e => e.x >= -40 && e.x <= W + 40 && e.y >= -60 && e.y <= H + 40);
        if (!candidates.length) return;

        const pool = candidates.slice();
        for (let i = 0; i < hitCount; i++) {
          if (!pool.length) break;
          const idx = Math.floor(Math.random() * pool.length);
          const e = pool.splice(idx, 1)[0];
          const strikeX = e.x;
          const strikeY = e.y;
          damageEnemy(e, damage);
          game.effects.push({
            type: 'lightningSkill',
            x: strikeX,
            y: strikeY,
            drawW: 56,
            drawH: 112,
            life: 0.18,
            maxLife: 0.18,
            opacity: 0.95
          });
        }
        removeDeadEnemies();
      };

      drawEffects = function () {
        for (const ef of game.effects) {
          const rate = ef.life / ef.maxLife;

          if (ef.type === 'fireSkill') {
            const frame = frameFromLife(ef, FIRE_FRAMES);
            const size = ef.drawSize;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = ef.opacity * (0.72 + rate * 0.20);
            if (fireStrip.complete && fireStrip.naturalWidth > 0) {
              ctx.drawImage(
                fireStrip,
                frame * FIRE_FRAME_W, 0, FIRE_FRAME_W, FIRE_FRAME_H,
                Math.round(ef.x - size / 2), Math.round(ef.y - size / 2),
                Math.round(size), Math.round(size)
              );
            } else {
              ctx.strokeStyle = '#fb923c';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(ef.x, ef.y, ef.hitRadius, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
            continue;
          }

          if (ef.type === 'lightningSkill') {
            const frame = frameFromLife(ef, LIGHT_FRAMES);
            const w = ef.drawW;
            const h = ef.drawH;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = ef.opacity * clamp(0.55 + rate * 0.55, 0, 1);
            if (lightningStrip.complete && lightningStrip.naturalWidth > 0) {
              ctx.drawImage(
                lightningStrip,
                frame * LIGHT_FRAME_W, 0, LIGHT_FRAME_W, LIGHT_FRAME_H,
                Math.round(ef.x - w / 2), Math.round(ef.y - h + 8),
                Math.round(w), Math.round(h)
              );
            } else {
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(ef.x - 10, ef.y - 45);
              ctx.lineTo(ef.x + 4, ef.y - 18);
              ctx.lineTo(ef.x - 5, ef.y - 18);
              ctx.lineTo(ef.x + 10, ef.y + 26);
              ctx.stroke();
            }
            ctx.restore();
            continue;
          }

          drawLegacyEffect(ef, rate);
        }
        ctx.globalAlpha = 1;
      };
    };

    apply();
    let n = 0;
    const id = setInterval(function () {
      apply();
      n += 1;
      if (n > 30) clearInterval(id);
    }, 150);
  }

  window.addEventListener('load', installPatch);
  document.addEventListener('DOMContentLoaded', installPatch);
  setTimeout(installPatch, 250);
})();
