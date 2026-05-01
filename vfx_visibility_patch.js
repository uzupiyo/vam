// VFX visibility tuning patch.
// Works at canvas draw level, so it still applies even when game.js keeps state/functions private.
// - Fire: smaller, softer, less obstructive.
// - Lightning: records the strike and redraws a short afterimage so the falling animation is visible.
(function () {
  const VERSION = 'vfx-tuned-2';
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
    const tunedSize = Math.max(44, Math.min(dw, dh) * 0.78);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = Math.min(ctx.globalAlpha, 0.30);
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

        // Small impact sparkle so the strike point is visually anchored.
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
    if (overlayLoopStarted) return;
    overlayLoopStarted = true;
    requestAnimationFrame(drawLightningAfterimages);
  }

  window.addEventListener('load', startOverlayLoop);
  document.addEventListener('DOMContentLoaded', startOverlayLoop);
  setTimeout(startOverlayLoop, 250);

  // Debug marker for cache confirmation.
  window.__rinVfxVisibilityPatch = VERSION;
})();
