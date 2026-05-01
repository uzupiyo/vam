// Sprite size and pixel clarity tuning for RIN SURVIVORS.
// Loaded after game.js. It only changes rendering values and does not touch start/menu flow.
(function () {
  function tuneSprites() {
    try {
      if (typeof SPRITE !== 'undefined') {
        if (SPRITE.player) {
          SPRITE.player.w = 64;
          SPRITE.player.h = 84;
        }
        if (SPRITE.enemies) {
          if (SPRITE.enemies.slime) { SPRITE.enemies.slime.w = 48; SPRITE.enemies.slime.h = 38; }
          if (SPRITE.enemies.bat) { SPRITE.enemies.bat.w = 58; SPRITE.enemies.bat.h = 46; }
          if (SPRITE.enemies.golem) { SPRITE.enemies.golem.w = 96; SPRITE.enemies.golem.h = 96; }
          if (SPRITE.enemies.boss) { SPRITE.enemies.boss.w = 150; SPRITE.enemies.boss.h = 150; }
        }
      }
    } catch (e) {
      console.warn('sprite tuning skipped', e);
    }
  }

  function tuneCanvas() {
    var canvas = document.getElementById('game');
    if (!canvas) return;
    var context = canvas.getContext('2d');
    if (context) context.imageSmoothingEnabled = false;
  }

  function tuneCharacterSelectDot() {
    document.querySelectorAll('.character-cell img').forEach(function (img) {
      img.style.width = '60px';
      img.style.height = '60px';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.objectFit = 'contain';
      img.style.imageRendering = 'pixelated';
    });
  }

  // Replace the shared centered image helper with rounded coordinates.
  // This prevents half-pixel canvas sampling and makes pixel art sharper.
  function tuneDrawHelper() {
    try {
      if (typeof drawImageCentered === 'function') {
        drawImageCentered = function (img, x, y, w, h) {
          if (typeof ctx === 'undefined') return;
          if (ctx) ctx.imageSmoothingEnabled = false;
          var rx = Math.round(x - w / 2);
          var ry = Math.round(y - h / 2);
          var rw = Math.round(w);
          var rh = Math.round(h);
          if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, rx, ry, rw, rh);
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(Math.round(x - w / 4), Math.round(y - h / 4), Math.round(w / 2), Math.round(h / 2));
          }
        };
      }
    } catch (e) {
      console.warn('draw helper tuning skipped', e);
    }
  }

  function applyTuning() {
    tuneSprites();
    tuneCanvas();
    tuneDrawHelper();
    tuneCharacterSelectDot();
  }

  applyTuning();
  window.addEventListener('load', applyTuning);
  document.addEventListener('DOMContentLoaded', applyTuning);
  setTimeout(applyTuning, 250);
})();
