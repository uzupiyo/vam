// Character-specific render patch.
// Rin's unique weapon is dual pistols, so her normal attack is drawn as visible bullets.
// Also adjusts Rin's ground shadow so she does not look like she is floating.
(function () {
  const RIN_BULLET_SRC = 'assets/projectiles/rin_bullet.png?v=rin-bullet-shadow-1';
  const rinBulletImage = new Image();
  rinBulletImage.src = RIN_BULLET_SRC;

  function canUseGameScope() {
    return (
      typeof ctx !== 'undefined' &&
      typeof game !== 'undefined' &&
      typeof drawImageCentered === 'function'
    );
  }

  function drawFallbackBullet(w, h) {
    // High-visibility pixel bullet fallback. This shows even if the PNG asset fails.
    ctx.fillStyle = '#ffdf3f';
    ctx.fillRect(Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(-w / 4), Math.round(-h / 4), Math.round(w / 2), Math.round(h / 2));
    ctx.fillStyle = '#38d9ff';
    ctx.fillRect(Math.round(-w / 2), Math.round(-h / 2 - 2), Math.round(w * 0.55), 2);
    ctx.fillStyle = '#ff4fa3';
    ctx.fillRect(Math.round(w / 2 - 4), Math.round(-h / 2), 4, Math.round(h));
  }

  function drawRotatedBullet(img, x, y, w, h, angle) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(angle);

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
    } else {
      drawFallbackBullet(w, h);
    }

    ctx.restore();
  }

  function drawRinBulletProjectiles() {
    if (!canUseGameScope() || !game || !game.projectiles) return;

    for (const b of game.projectiles) {
      const angle = Math.atan2(b.vy || 0, b.vx || 1);
      const speed = Math.hypot(b.vx || 0, b.vy || 0);
      const stretch = Math.min(1.35, Math.max(0.95, speed / 380));
      drawRotatedBullet(rinBulletImage, b.x, b.y, 34 * stretch, 14, angle);
    }
  }

  function drawPatchedPlayer() {
    if (!canUseGameScope() || !game || !game.player) return;
    const p = game.player;

    if (p.invincibleTime > 0 && Math.floor(performance.now() / 80) % 2 === 0) return;

    const playerW = SPRITE && SPRITE.player ? SPRITE.player.w : 44;
    const playerH = SPRITE && SPRITE.player ? SPRITE.player.h : 58;

    // The original shadow was too low after the sprite was scaled down.
    // Place it just under the shoes / feet.
    const footY = p.y + 10;
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath();
    ctx.ellipse(Math.round(p.x), Math.round(footY), Math.max(12, playerW * 0.32), 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (p.barrierTime > 0) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 2, 28, 0, Math.PI * 2);
      ctx.stroke();
    }

    const frames = images.playerIdle || [];
    const frame = frames.length ? Math.floor(performance.now() / 160) % frames.length : 0;
    drawImageCentered(frames[frame], p.x, p.y - 16, playerW, playerH);
  }

  function installPatch() {
    if (!canUseGameScope()) {
      setTimeout(installPatch, 100);
      return;
    }

    try {
      drawProjectiles = drawRinBulletProjectiles;
      drawPlayer = drawPatchedPlayer;
    } catch (e) {
      console.warn('Rin render patch install failed:', e);
    }
  }

  installPatch();
  window.addEventListener('load', installPatch);
  document.addEventListener('DOMContentLoaded', installPatch);
  setTimeout(installPatch, 250);
  setTimeout(installPatch, 1000);

  function relabelRinWeapon() {
    const weaponSlot = document.querySelector('.skill-slot.active strong');
    if (weaponSlot) weaponSlot.textContent = 'Dual Pistols';
  }

  window.addEventListener('load', relabelRinWeapon);
  document.addEventListener('DOMContentLoaded', relabelRinWeapon);
})();
