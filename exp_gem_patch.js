// EXP gem render patch for RIN SURVIVORS.
// Draws dropped EXP as a pixel-art gem image and keeps the magnet trail behavior.
(function () {
  const GEM_SRC = 'assets/items/exp_gem.png?v=exp-gem-1';
  const gemImage = new Image();
  gemImage.src = GEM_SRC;

  function ready() {
    return typeof game !== 'undefined' && typeof ctx !== 'undefined';
  }

  function drawFallbackGem(x, y, bobY, magnetized) {
    ctx.fillStyle = magnetized ? '#38bdf8' : '#22d3ee';
    ctx.fillRect(Math.round(x - 5), Math.round(y - 5 + bobY), 10, 10);
    ctx.fillStyle = magnetized ? '#ffffff' : '#cffafe';
    ctx.fillRect(Math.round(x - 2), Math.round(y - 7 + bobY), 4, 4);
    if (magnetized) {
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(x - 6), Math.round(y - 6), 12, 12);
    }
  }

  function drawGemSprite(x, y, size, alpha) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;
    if (gemImage.complete && gemImage.naturalWidth > 0) {
      ctx.drawImage(gemImage, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    } else {
      drawFallbackGem(x, y, 0, false);
    }
    ctx.restore();
  }

  function installPatch() {
    if (!ready()) {
      setTimeout(installPatch, 100);
      return;
    }
    if (window.__expGemPatchInstalled) return;
    window.__expGemPatchInstalled = true;

    drawGems = function () {
      for (const g of game.gems) {
        const bobY = g.magnetized ? 0 : Math.sin(g.bob) * 2;

        if (g.magnetized && g.trail && g.trail.length > 0) {
          for (let i = 0; i < g.trail.length; i++) {
            const t = g.trail[i];
            const alpha = (i + 1) / (g.trail.length * 2.4);
            drawGemSprite(t.x, t.y, 10, alpha);
          }
        }

        drawGemSprite(g.x, g.y + bobY, g.magnetized ? 20 : 18, 1);
      }
    };
  }

  installPatch();
  window.addEventListener('load', installPatch);
  document.addEventListener('DOMContentLoaded', installPatch);
  setTimeout(installPatch, 250);
  setTimeout(installPatch, 1000);
})();
