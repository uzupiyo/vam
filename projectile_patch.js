// Character-specific normal attack projectile patch.
// Rin's unique weapon is dual pistols, so her normal attack is drawn as a bullet.
(function () {
  const RIN_BULLET_SRC = 'assets/projectiles/rin_bullet.png?v=rin-bullet-2';
  const rinBulletImage = new Image();
  rinBulletImage.src = RIN_BULLET_SRC;

  function drawRotatedBullet(img, x, y, w, h, angle) {
    if (typeof ctx === 'undefined') return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(angle);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
    } else {
      // Fallback visible bullet while the PNG is loading or if it fails.
      ctx.fillStyle = '#ffdf3f';
      ctx.fillRect(Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(-w / 5), Math.round(-h / 4), Math.round(w / 3), Math.round(h / 2));
      ctx.fillStyle = '#ff4fa3';
      ctx.fillRect(Math.round(w / 2 - 3), Math.round(-h / 2), 3, Math.round(h));
    }
    ctx.restore();
  }

  function drawRinBulletProjectiles() {
    if (typeof game === 'undefined' || !game || !game.projectiles) return;
    for (const b of game.projectiles) {
      const angle = Math.atan2(b.vy || 0, b.vx || 1);
      const speed = Math.hypot(b.vx || 0, b.vy || 0);
      const stretch = Math.min(1.35, Math.max(0.9, speed / 380));
      drawRotatedBullet(rinBulletImage, b.x, b.y, 34 * stretch, 14, angle);
    }
  }

  // Important: game.js calls the global function name drawProjectiles(), not window.drawProjectiles.
  // Reassign the actual global binding so the main draw loop uses Rin's bullet sprite.
  try {
    if (typeof drawProjectiles === 'function') {
      drawProjectiles = drawRinBulletProjectiles;
    }
  } catch (e) {
    console.warn('Could not replace drawProjectiles directly:', e);
  }
  window.drawProjectiles = drawRinBulletProjectiles;

  // Re-apply once more after load in case any other script ran after this one.
  window.addEventListener('load', function () {
    try {
      drawProjectiles = drawRinBulletProjectiles;
    } catch (e) {}
  });

  function relabelRinWeapon() {
    const weaponSlot = document.querySelector('.skill-slot.active strong');
    if (weaponSlot) weaponSlot.textContent = 'Dual Pistols';
  }

  window.addEventListener('load', relabelRinWeapon);
  document.addEventListener('DOMContentLoaded', relabelRinWeapon);
})();
