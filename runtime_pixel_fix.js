// Runtime pixel rendering and character select safety fixes.
(function () {
  function roundDraw(img, x, y, w, h) {
    var ctx = window.ctx;
    if (!ctx) return;
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
  }

  function applyPixelFixes() {
    var canvas = document.getElementById('game');
    if (canvas) {
      var c = canvas.getContext('2d');
      if (c) c.imageSmoothingEnabled = false;
    }

    if (typeof window.drawImageCentered === 'function') {
      window.drawImageCentered = roundDraw;
    }

    document.querySelectorAll('.character-cell img').forEach(function (img) {
      img.style.imageRendering = 'pixelated';
      img.style.width = '64px';
      img.style.height = '64px';
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.objectFit = 'contain';
    });
  }

  function fixCharacterSelectTop() {
    var overlay = document.getElementById('characterOverlay');
    var screen = document.querySelector('.character-select-screen');
    if (!overlay || !screen) return;
    overlay.style.overflow = 'auto';
    overlay.style.padding = '8px';
    if (window.innerHeight < 650) {
      overlay.style.alignItems = 'flex-start';
      screen.style.marginTop = '8px';
    }
  }

  window.addEventListener('load', applyPixelFixes);
  window.addEventListener('resize', fixCharacterSelectTop);
  document.addEventListener('DOMContentLoaded', function () {
    applyPixelFixes();
    fixCharacterSelectTop();
    setTimeout(applyPixelFixes, 300);
    setTimeout(fixCharacterSelectTop, 300);
  });
})();
