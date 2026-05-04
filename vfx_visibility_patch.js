// VFX visibility tuning patch.
// - Fire: larger initial visual and hitbox aligned with rendered image.
// - Lightning: records the strike and redraws a short afterimage so the falling animation is visible.
(function () {
  const VERSION = 'fire-size-1';
  const fireSrcNeedle = '/assets/effects/fire_skill_strip.png';
  const lightningSrcNeedle = '/assets/effects/lightning_skill_strip.png';

  const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
  const activeLightning = [];
  let overlayLoopStarted = false;

  function isImageLike(source) {
    return source && typeof source.src === 'string';
  }

  function isFireSheet(source) {
    return isImageLike(source) && source.src.includes(fireSrcNeedle);
  }

  function isLightningSheet(source) {
    return isImageLike(source) && source.src.includes(lightningSrcNeedle);
  }

  function getCanvasContext() {
    const canvas = document.getElementById('game');
    return canvas ? canvas.getContext('2d') : null;
  }

  function drawSoftFire(ctx, args) {
    // Expected drawImage signature used by game.js:
    // image, sx, sy, sw, sh, dx, dy, dw, dh
    const [img, sx, sy, sw, sh, dx, dy, dw, dh] = args;
    const cx = dx + dw / 2;
    const cy = dy + dh / 2;

    // Previous tuning shrank this to 78%. The requested change makes the
    // initial flame visibly larger while keeping it soft enough not to hide enemies.
    const tunedSize = Math.max(72, Math.min(dw, dh) * 1.05);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.36);
    originalDrawImage.call(
      ctx,
      img,
      sx,
      sy,
      sw,
      sh,
      Math.round(cx - tunedSize / 2),
      Math.round(cy - tunedSize / 2),
      Math.round(tunedSize),
      Math.round(tunedSize)
    );
    ctx.restore();
  }

  function drawVisibleLightning(ctx, args, alphaScale, scaleBoost) {
    const [img, sx, sy, sw, sh, dx, dy, dw, dh] = args;
    const cx = dx + dw / 2;
    const impactY = dy + dh - 8;
    const w = dw * scaleBoost;
    const h = dh * scaleBoost;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = Math.min(1, ctx.globalAlpha * alphaScale);
    originalDrawImage.call(
      ctx,
      img,
      sx,
      sy,
      sw,
      sh,
      Math.round(cx - w / 2),
      Math.round(impactY - h + 8),
      Math.round(w),
      Math.round(h)
    );
    ctx.restore();
  }

  CanvasRenderingContext2D.prototype.drawImage = function () {
    const args = Array.from(arguments);
    const source = args[0];

    if (args.length === 9 && isFireSheet(source)) {
      drawSoftFire(this, args);
      return;
    }

    if (args.length === 9 && isLightningSheet(source)) {
      drawVisibleLightning(this, args, 1.08, 1.12);

      const [, sx, sy, sw, sh, dx, dy, dw, dh] = args;
      activeLightning.push({
        img: source,
        sx,
        sy,
        sw,
        sh,
        dx,
        dy,
        dw,
        dh,
        born: performance.now(),
        ttl: 380,
      });
      return;
    }

    return originalDrawImage.apply(this, arguments);
  };

  function patchFireAuraHitbox() {
    try {
      if (typeof game === 'undefined' || typeof useFireAura === 'undefined') return false;
      if (typeof distance !== 'function' || typeof damageEnemy !== 'function' || typeof removeDeadEnemies !== 'function') return false;

      useFireAura = function () {
        const p = game.player;
        const level = Math.max(1, p.fireLevel || 1);

        // Visual draw size in game.js, then drawSoftFire renders it at 105%.
        // Hitbox is matched to the visible sprite, slightly inside the edge.
        const drawSize = 92 + level * 12;
        const visibleRadius = drawSize * 1.05 * 0.5;
        const hitRadius = Math.round(visibleRadius * 0.9);
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

      return true;
    } catch (e) {
      return false;
    }
  }

  function drawLightningAfterimages() {
    const ctx = getCanvasContext();
    const now = performance.now();
    if (ctx) {
      for (let i = activeLightning.length - 1; i >= 0; i--) {
        const ef = activeLightning[i];
        const age = now - ef.born;
        if (age > ef.ttl) {
          activeLightning.splice(i, 1);
          continue;
        }

        const rate = 1 - age / ef.ttl;
        const cx = ef.dx + ef.dw / 2;
        const impactY = ef.dy + ef.dh - 8;
        const w = ef.dw * (1.05 + (1 - rate) * 0.08);
        const h = ef.dh * (1.05 + (1 - rate) * 0.08);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 0.42 * rate;
        originalDrawImage.call(
          ctx,
          ef.img,
          ef.sx,
          ef.sy,
          ef.sw,
          ef.sh,
          Math.round(cx - w / 2),
          Math.round(impactY - h + 8),
          Math.round(w),
          Math.round(h)
        );
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.55 * rate;
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(Math.round(cx - 2), Math.round(impactY - 12), 4, 24);
        ctx.fillRect(Math.round(cx - 12), Math.round(impactY - 2), 24, 4);
        ctx.restore();
      }
    }

    requestAnimationFrame(drawLightningAfterimages);
  }

  function startOverlayLoop() {
    if (!overlayLoopStarted) {
      overlayLoopStarted = true;
      requestAnimationFrame(drawLightningAfterimages);
    }

    patchFireAuraHitbox();
    let count = 0;
    const id = setInterval(function () {
      patchFireAuraHitbox();
      count += 1;
      if (count > 40) clearInterval(id);
    }, 100);
  }

  window.addEventListener('load', startOverlayLoop);
  document.addEventListener('DOMContentLoaded', startOverlayLoop);
  setTimeout(startOverlayLoop, 250);

  window.__rinVfxVisibilityPatch = VERSION;
})();
