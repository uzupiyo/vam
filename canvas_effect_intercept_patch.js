// Canvas-level elemental VFX intercept patch.
// game.js keeps ctx/game/functions in script-local scope, so normal function overrides may not reach it.
// This patch intercepts the actual CanvasRenderingContext2D stroke calls used by the built-in fire/lightning effects
// and replaces those legacy vector drawings with the new sprite sheets.
(function () {
  const VERSION = 'canvas-vfx-1';
  const fireStrip = new Image();
  const lightningStrip = new Image();
  fireStrip.src = 'assets/effects/fire_skill_strip.png?v=' + VERSION;
  lightningStrip.src = 'assets/effects/lightning_skill_strip.png?v=' + VERSION;

  const FIRE_FW = 32;
  const FIRE_FH = 32;
  const FIRE_FRAMES = 4;
  const LIGHT_FW = 32;
  const LIGHT_FH = 64;
  const LIGHT_FRAMES = 4;

  const originalBeginPath = CanvasRenderingContext2D.prototype.beginPath;
  const originalArc = CanvasRenderingContext2D.prototype.arc;
  const originalMoveTo = CanvasRenderingContext2D.prototype.moveTo;
  const originalLineTo = CanvasRenderingContext2D.prototype.lineTo;
  const originalStroke = CanvasRenderingContext2D.prototype.stroke;
  const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;

  const pathState = new WeakMap();
  let internalDrawing = false;

  function stateFor(ctx) {
    let s = pathState.get(ctx);
    if (!s) {
      s = { ops: [], tick: 0 };
      pathState.set(ctx, s);
    }
    return s;
  }

  function normalizeStyle(style) {
    return String(style || '').replace(/\s+/g, '').toLowerCase();
  }

  function isFireStyle(style) {
    const s = normalizeStyle(style);
    return s === '#f97316' || s === 'rgb(249,115,22)' || s === 'rgba(249,115,22,1)';
  }

  function isLightningStyle(style) {
    const s = normalizeStyle(style);
    return s === '#facc15' || s === 'rgb(250,204,21)' || s === 'rgba(250,204,21,1)';
  }

  function drawFire(ctx, arcOp) {
    const frame = stateFor(ctx).tick++ % FIRE_FRAMES;
    const baseRadius = arcOp.r || 48;
    const size = Math.max(64, baseRadius * 1.55);

    ctx.save();
    internalDrawing = true;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.46;

    if (fireStrip.complete && fireStrip.naturalWidth > 0) {
      originalDrawImage.call(
        ctx,
        fireStrip,
        frame * FIRE_FW, 0, FIRE_FW, FIRE_FH,
        Math.round(arcOp.x - size / 2), Math.round(arcOp.y - size / 2),
        Math.round(size), Math.round(size)
      );
    } else {
      ctx.strokeStyle = '#fb923c';
      originalStroke.call(ctx);
    }

    internalDrawing = false;
    ctx.restore();
  }

  function drawLightning(ctx, ops) {
    const move = ops.find(op => op.type === 'moveTo');
    if (!move) return false;

    // Original legacy lightning starts at ef.x - 10, ef.y - 45.
    // Anchor the sprite bottom to that same strike position so the hit does not drift frame-to-frame.
    const x = move.x + 10;
    const y = move.y + 45;
    const frame = stateFor(ctx).tick++ % LIGHT_FRAMES;
    const w = 58;
    const h = 116;

    ctx.save();
    internalDrawing = true;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.95;

    if (lightningStrip.complete && lightningStrip.naturalWidth > 0) {
      originalDrawImage.call(
        ctx,
        lightningStrip,
        frame * LIGHT_FW, 0, LIGHT_FW, LIGHT_FH,
        Math.round(x - w / 2), Math.round(y - h + 8),
        Math.round(w), Math.round(h)
      );
    } else {
      originalStroke.call(ctx);
    }

    internalDrawing = false;
    ctx.restore();
    return true;
  }

  CanvasRenderingContext2D.prototype.beginPath = function () {
    if (!internalDrawing) stateFor(this).ops = [];
    return originalBeginPath.apply(this, arguments);
  };

  CanvasRenderingContext2D.prototype.arc = function (x, y, r, start, end, anticlockwise) {
    if (!internalDrawing) stateFor(this).ops.push({ type: 'arc', x, y, r, start, end });
    return originalArc.apply(this, arguments);
  };

  CanvasRenderingContext2D.prototype.moveTo = function (x, y) {
    if (!internalDrawing) stateFor(this).ops.push({ type: 'moveTo', x, y });
    return originalMoveTo.apply(this, arguments);
  };

  CanvasRenderingContext2D.prototype.lineTo = function (x, y) {
    if (!internalDrawing) stateFor(this).ops.push({ type: 'lineTo', x, y });
    return originalLineTo.apply(this, arguments);
  };

  CanvasRenderingContext2D.prototype.stroke = function () {
    if (!internalDrawing) {
      const s = stateFor(this);
      const ops = s.ops || [];
      const style = this.strokeStyle;

      if (ops.length && isFireStyle(style)) {
        const arc = ops.find(op => op.type === 'arc');
        if (arc) {
          drawFire(this, arc);
          s.ops = [];
          return;
        }
      }

      if (ops.length && isLightningStyle(style)) {
        if (drawLightning(this, ops)) {
          s.ops = [];
          return;
        }
      }
    }

    return originalStroke.apply(this, arguments);
  };
})();
