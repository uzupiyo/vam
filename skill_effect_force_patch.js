// Force elemental skill visual patch for RIN SURVIVORS.
// This handles both the new skill effect types and the old built-in effect types,
// so fire/lightning visuals are applied even if another patch or the base game creates legacy effects.
(function () {
  const VERSION = 'skill-fx-force-1';
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

  function getCtx() {
    try {
      if (typeof ctx !== 'undefined') return ctx;
    } catch (e) {}
    const canvas = document.getElementById('game');
    return canvas ? canvas.getContext('2d') : null;
  }

  function getGame() {
    try {
      if (typeof game !== 'undefined') return game;
    } catch (e) {}
    return null;
  }

  function safeClamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function dist(ax, ay, bx, by) {
    try {
      if (typeof distance === 'function') return distance(ax, ay, bx, by);
    } catch (e) {}
    return Math.hypot(ax - bx, ay - by);
  }

  function frameFromLife(ef, count) {
    const maxLife = ef.maxLife || 1;
    const progress = 1 - (ef.life || 0) / maxLife;
    return Math.max(0, Math.min(count - 1, Math.floor(progress * count)));
  }

  function drawFireSprite(localCtx, ef) {
    const rate = (ef.life || 0) / (ef.maxLife || 1);
    const frame = frameFromLife(ef, FIRE_FRAMES);
    const size = ef.drawSize || Math.max(64, (ef.radius || 48) * 1.55);
    localCtx.save();
    localCtx.imageSmoothingEnabled = false;
    localCtx.globalAlpha = (ef.opacity || 0.48) * (0.65 + safeClamp(rate, 0, 1) * 0.25);

    if (fireStrip.complete && fireStrip.naturalWidth > 0) {
      localCtx.drawImage(
        fireStrip,
        frame * FIRE_FRAME_W, 0, FIRE_FRAME_W, FIRE_FRAME_H,
        Math.round(ef.x - size / 2), Math.round(ef.y - size / 2),
        Math.round(size), Math.round(size)
      );
    } else {
      localCtx.strokeStyle = '#fb923c';
      localCtx.lineWidth = 3;
      localCtx.beginPath();
      localCtx.arc(ef.x, ef.y, ef.hitRadius || ef.radius || 42, 0, Math.PI * 2);
      localCtx.stroke();
    }
    localCtx.restore();
  }

  function drawLightningSprite(localCtx, ef) {
    const rate = (ef.life || 0) / (ef.maxLife || 1);
    const frame = frameFromLife(ef, LIGHT_FRAMES);
    const w = ef.drawW || 56;
    const h = ef.drawH || 112;
    localCtx.save();
    localCtx.imageSmoothingEnabled = false;
    localCtx.globalAlpha = (ef.opacity || 0.95) * safeClamp(0.50 + rate * 0.55, 0, 1);

    if (lightningStrip.complete && lightningStrip.naturalWidth > 0) {
      // Fixed anchor: bottom impact point stays at ef.x / ef.y for the whole animation.
      localCtx.drawImage(
        lightningStrip,
        frame * LIGHT_FRAME_W, 0, LIGHT_FRAME_W, LIGHT_FRAME_H,
        Math.round(ef.x - w / 2), Math.round(ef.y - h + 8),
        Math.round(w), Math.round(h)
      );
    } else {
      localCtx.strokeStyle = '#67e8f9';
      localCtx.lineWidth = 4;
      localCtx.beginPath();
      localCtx.moveTo(ef.x - 4, ef.y - h + 16);
      localCtx.lineTo(ef.x + 8, ef.y - h * 0.58);
      localCtx.lineTo(ef.x - 3, ef.y - h * 0.58);
      localCtx.lineTo(ef.x + 6, ef.y - 6);
      localCtx.stroke();
    }
    localCtx.restore();
  }

  function drawLegacyEffect(localCtx, ef) {
    const rate = (ef.life || 0) / (ef.maxLife || 1);
    localCtx.save();
    localCtx.globalAlpha = safeClamp(rate, 0, 1);

    if (ef.type === 'circle') {
      localCtx.strokeStyle = ef.color || '#ffffff';
      localCtx.lineWidth = 4;
      localCtx.beginPath();
      localCtx.arc(ef.x, ef.y, ef.radius || 20, 0, Math.PI * 2);
      localCtx.stroke();
    } else if (ef.type === 'lightning') {
      localCtx.strokeStyle = ef.color || '#facc15';
      localCtx.lineWidth = 4;
      localCtx.beginPath();
      localCtx.moveTo(ef.x - 10, ef.y - 45);
      localCtx.lineTo(ef.x + 4, ef.y - 18);
      localCtx.lineTo(ef.x - 5, ef.y - 18);
      localCtx.lineTo(ef.x + 10, ef.y + 26);
      localCtx.stroke();
    } else if (ef.type === 'pop') {
      localCtx.strokeStyle = ef.color || '#ffffff';
      localCtx.lineWidth = 3;
      localCtx.strokeRect(ef.x - ef.radius * (1 - rate), ef.y - ef.radius * (1 - rate), ef.radius * 2 * (1 - rate), ef.radius * 2 * (1 - rate));
    } else if (ef.type === 'spark') {
      localCtx.fillStyle = ef.color || '#ffffff';
      localCtx.fillRect(ef.x - 2, ef.y - 8, 4, 16);
      localCtx.fillRect(ef.x - 8, ef.y - 2, 16, 4);
    }

    localCtx.restore();
  }

  function forcedDrawEffects() {
    const localCtx = getCtx();
    const g = getGame();
    if (!localCtx || !g || !g.effects) return;

    for (const ef of g.effects) {
      // New types from skill_effect_patch.js.
      if (ef.type === 'fireSkill') {
        drawFireSprite(localCtx, ef);
        continue;
      }
      if (ef.type === 'lightningSkill') {
        drawLightningSprite(localCtx, ef);
        continue;
      }

      // Legacy fire aura is a large orange circle. Render it with the fire sprite instead.
      if (ef.type === 'circle' && (ef.color === '#f97316' || ef.color === '#ef4444')) {
        drawFireSprite(localCtx, {
          type: 'fireSkill',
          x: ef.x,
          y: ef.y,
          radius: ef.radius,
          drawSize: Math.max(64, (ef.radius || 48) * 1.55),
          life: ef.life,
          maxLife: Math.max(0.55, ef.maxLife || 0.18),
          opacity: 0.48
        });
        continue;
      }

      // Legacy lightning line. Render it with the falling lightning sprite instead.
      if (ef.type === 'lightning') {
        drawLightningSprite(localCtx, {
          type: 'lightningSkill',
          x: ef.x,
          y: ef.y,
          drawW: 56,
          drawH: 112,
          life: ef.life,
          maxLife: Math.max(0.18, ef.maxLife || 0.22),
          opacity: 0.95
        });
        continue;
      }

      drawLegacyEffect(localCtx, ef);
    }
    localCtx.globalAlpha = 1;
  }

  function patchFireHitbox() {
    const g = getGame();
    if (!g || !g.player) return;
    try {
      useFireAura = function () {
        const p = g.player;
        const level = Math.max(1, p.fireLevel || 1);
        const damage = 10 + level * 4;
        const hitRadius = 24 + level * 9;
        const drawSize = 72 + level * 8;

        g.effects.push({
          type: 'fireSkill',
          x: p.x,
          y: p.y,
          hitRadius,
          radius: hitRadius,
          drawSize,
          life: 0.78,
          maxLife: 0.78,
          opacity: 0.48
        });

        for (const e of g.enemies) {
          if (dist(p.x, p.y, e.x, e.y) <= hitRadius + e.radius) {
            try { damageEnemy(e, damage); } catch (err) { e.hp -= damage; }
          }
        }
        try { removeDeadEnemies(); } catch (err) {}
      };
    } catch (e) {}
  }

  function patchLightningAnchor() {
    const g = getGame();
    if (!g || !g.player) return;
    try {
      useLightning = function () {
        const p = g.player;
        const level = Math.max(1, p.lightningLevel || 1);
        const hitCount = Math.min(1 + Math.floor(level / 2), 5);
        const damage = 24 + level * 8;
        const candidates = (g.enemies || []).filter(function (e) {
          return e.x >= -40 && e.x <= 1000 && e.y >= -80 && e.y <= 620;
        });
        if (!candidates.length) return;

        const pool = candidates.slice();
        for (let i = 0; i < hitCount; i++) {
          if (!pool.length) break;
          const idx = Math.floor(Math.random() * pool.length);
          const e = pool.splice(idx, 1)[0];
          const strikeX = e.x;
          const strikeY = e.y;
          try { damageEnemy(e, damage); } catch (err) { e.hp -= damage; }
          g.effects.push({
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
        try { removeDeadEnemies(); } catch (err) {}
      };
    } catch (e) {}
  }

  function apply() {
    try { drawEffects = forcedDrawEffects; } catch (e) {}
    window.drawEffects = forcedDrawEffects;
    patchFireHitbox();
    patchLightningAnchor();
  }

  function start() {
    apply();
    let n = 0;
    const id = setInterval(function () {
      apply();
      n++;
      if (n > 80) clearInterval(id);
    }, 100);
  }

  window.addEventListener('load', start);
  document.addEventListener('DOMContentLoaded', start);
  setTimeout(start, 250);
})();
