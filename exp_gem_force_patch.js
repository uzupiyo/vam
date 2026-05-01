// Force EXP gem rendering patch.
// This intentionally re-applies drawGems so the visual change wins over earlier patches.
(function () {
  const GEM_SRC = 'assets/items/exp_gem.png?v=exp-gem-force-1';
  const gemImage = new Image();
  gemImage.src = GEM_SRC;

  function canPatch() {
    return typeof ctx !== 'undefined' && typeof game !== 'undefined';
  }

  function drawPixelGemFallback(x, y, size, alpha, magnetized) {
    const s = Math.max(10, Math.round(size));
    const cx = Math.round(x);
    const cy = Math.round(y);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;

    // dark outline diamond
    ctx.fillStyle = '#16213b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s / 2);
    ctx.lineTo(cx + s / 2, cy);
    ctx.lineTo(cx, cy + s / 2);
    ctx.lineTo(cx - s / 2, cy);
    ctx.closePath();
    ctx.fill();

    // cyan body
    ctx.fillStyle = magnetized ? '#67e8f9' : '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(cx, cy - s / 2 + 3);
    ctx.lineTo(cx + s / 2 - 3, cy);
    ctx.lineTo(cx, cy + s / 2 - 3);
    ctx.lineTo(cx - s / 2 + 3, cy);
    ctx.closePath();
    ctx.fill();

    // facets
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + s / 2 - 3, cy);
    ctx.lineTo(cx, cy + s / 2 - 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff82c4';
    ctx.fillRect(Math.round(cx + s * 0.10), Math.round(cy - s * 0.25), Math.max(2, Math.round(s * 0.18)), Math.max(2, Math.round(s * 0.18)));

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(cx - s * 0.22), Math.round(cy - s * 0.22), Math.max(2, Math.round(s * 0.16)), 2);
    ctx.fillRect(Math.round(cx - s * 0.17), Math.round(cy - s * 0.28), 2, Math.max(2, Math.round(s * 0.16)));

    ctx.restore();
  }

  function drawGemImageOrFallback(x, y, size, alpha, magnetized) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    if (gemImage.complete && gemImage.naturalWidth > 0) {
      ctx.drawImage(gemImage, Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size));
      ctx.restore();
      return;
    }
    ctx.restore();
    drawPixelGemFallback(x, y, size, alpha, magnetized);
  }

  function patchedDrawGems() {
    if (!canPatch() || !game.gems) return;

    for (const g of game.gems) {
      const bobY = g.magnetized ? 0 : Math.sin(g.bob || 0) * 2;

      if (g.magnetized && g.trail && g.trail.length > 0) {
        for (let i = 0; i < g.trail.length; i++) {
          const t = g.trail[i];
          const alpha = (i + 1) / (g.trail.length * 2.4);
          drawGemImageOrFallback(t.x, t.y, 11, alpha, true);
        }
      }

      drawGemImageOrFallback(g.x, g.y + bobY, g.magnetized ? 22 : 20, 1, !!g.magnetized);
    }

    ctx.globalAlpha = 1;
  }

  function apply() {
    if (!canPatch()) return false;
    try {
      drawGems = patchedDrawGems;
      window.drawGems = patchedDrawGems;
      return true;
    } catch (e) {
      console.warn('EXP gem force patch failed:', e);
      return false;
    }
  }

  // Apply repeatedly for a few seconds, because other patches may install after us.
  function startApplying() {
    apply();
    let count = 0;
    const id = setInterval(function () {
      apply();
      count++;
      if (count > 40) clearInterval(id);
    }, 100);
  }

  window.addEventListener('load', startApplying);
  document.addEventListener('DOMContentLoaded', startApplying);
  setTimeout(startApplying, 250);
})();
