// Character-specific normal attack projectile patch.
// Rin's unique weapon is dual pistols, so her normal attack is drawn as a bullet.
(function () {
  const RIN_BULLET_SRC = 'assets/projectiles/rin_bullet.png?v=rin-bullet-1';
  const rinBulletImage = new Image();
  rinBulletImage.src = RIN_BULLET_SRC;

  function drawRotatedImage(img, x, y, w, h, angle) {
    if (typeof ctx === 'undefined') return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(angle);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
    } else {
      ctx.fillStyle = '#ffe45c';
      ctx.fillRect(Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(-w / 5), Math.round(-h / 4), Math.round(w / 3), Math.round(h / 2));
    }
    ctx.restore();
  }

  // Existing projectiles already move using vx/vy. This override only changes their visual.
  window.drawProjectiles = function () {
    if (typeof game === 'undefined' || !game || !game.projectiles) return;
    for (const b of game.projectiles) {
      const angle = Math.atan2(b.vy || 0, b.vx || 1);
      const speed = Math.hypot(b.vx || 0, b.vy || 0);
      const stretch = Math.min(1.25, Math.max(0.85, speed / 380));
      drawRotatedImage(rinBulletImage, b.x, b.y, 30 * stretch, 12, angle);
    }
  };

  // Keep the old upgrade labels internally, but present Rin's weapon as bullets/pistols in UI.
  function relabelRinWeapon() {
    const weaponSlot = document.querySelector('.skill-slot.active strong');
    if (weaponSlot) weaponSlot.textContent = 'Dual Pistols';
  }

  window.addEventListener('load', relabelRinWeapon);
  document.addEventListener('DOMContentLoaded', relabelRinWeapon);
})();
