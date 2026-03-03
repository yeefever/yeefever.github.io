'use client';

import { useEffect, useRef } from 'react';

const MAMBO_GRAY = [
  '/mambos/m0_gray.png',
  '/mambos/m1_gray.png',
  '/mambos/m2_gray.png',
  '/mambos/m3_gray.png',
  '/mambos/m4_gray.png',
  '/mambos/m5_gray.png',
  '/mambos/m6_gray.png',
];

const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
const RES_SCALE     = 16;
const brushRadiusPx = 40;
const brushStrength = 0.15;
const lossThreshold   = 0.01;
const minInk          = 0.01;   // fraction of field that must be inked before morph starts
const transportRate       = 0.8;  // fraction of excess pushed per iteration
const FRAMES_PER_STEP     = 4;   // ← tune: run 1 transport iteration every N rendered frames
const DEBUG_SOLVER_STEPS  = 16;   // iterations per Step button click
const MAX_SPAWNED         = 5;

const DEBUG = true; // set false to disable profiling overhead

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function MamboCanvas() {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const statusRef    = useRef(null);
  const stepBtnRef   = useRef(null);
  const solveBtnRef  = useRef(null);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    const statusEl  = statusRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Field buffers ──────────────────────────────────────────────────────
    let fieldWidth = 0, fieldHeight = 0, size = 0;
    let paintField = null, targetField = null;
    let desired = null, nextPaint = null;
    let inkMask = null, maskBuffer = null;
    let fieldOffscreen = null, fieldCtx = null, fieldImageData = null, fieldBuffer = null;
    let targetCanvas = null, targetCtx = null;

    // ── Image / cycle state ────────────────────────────────────────────────
    const mamboImages = [];
    let currentMamboIndex = 0;
    let hasStabilizedThisCycle = false;
    let cycleStartMs = performance.now();
    const spawned = [];

    // ── Transport state ────────────────────────────────────────────────────
    let fullMamboAmount   = 0;     // sum(targetField) — computed once per target load
    let autoPropagate     = true;  // set false to freeze solver; Step/Solve buttons still work
    let stepFrameClock    = 0;     // counts frames since last transport step
    let morphing          = false;
    let morphStartMs      = 0;
    let initialMaskedLoss = 1;     // loss captured at morph-start, used for progress %
    let lastInkAmount     = 0;
    let lastMaskedLoss    = 1;
    let lastTotalExcess   = 0;
    let lastStrokeAmount  = 0;
    let lastRatio         = 0;

    // ── Input state ────────────────────────────────────────────────────────
    let pointerDown = false, lastPointer = null;

    // ── Profiler state ─────────────────────────────────────────────────────
    let frameCounter = 0;
    let fpsTimer     = performance.now();
    let timeUpdate   = 0;
    let timeRender   = 0;
    let timeLoss     = 0;

    // Log lines are batched and flushed once per second to avoid fetch spam.
    const logBuffer = [];

    function flushLog() {
      if (!DEBUG || logBuffer.length === 0) return;
      const lines = logBuffer.splice(0);
      fetch('/api/mambo-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      }).catch(() => { /* silently ignore network failures */ });
    }

    function logLine(line) {
      if (!DEBUG) return;
      logBuffer.push(line);
    }

    function tickProfiler() {
      if (!DEBUG) return;
      frameCounter++;
      const now     = performance.now();
      const elapsed = now - fpsTimer;
      if (elapsed >= 1000) {
        const fps = (frameCounter * 1000) / elapsed;
        const ts  = new Date().toISOString();
        logLine(
          `${ts} | fps:${fps.toFixed(1)}` +
          ` | update:${timeUpdate.toFixed(2)}ms` +
          ` | render:${timeRender.toFixed(2)}ms` +
          ` | loss:${timeLoss.toFixed(2)}ms` +
          ` | stroke:${lastStrokeAmount.toFixed(1)}` +
          ` | ratio:${lastRatio.toFixed(3)}` +
          ` | ink:${lastInkAmount.toFixed(4)}` +
          ` | maskedLoss:${lastMaskedLoss.toFixed(4)}` +
          ` | excess:${lastTotalExcess.toFixed(3)}` +
          ` | morphing:${morphing}`
        );
        flushLog();
        frameCounter = 0;
        fpsTimer     = now;
        timeUpdate = timeRender = timeLoss = 0;
      }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    // ── Resize / allocation ────────────────────────────────────────────────
    function resize() {
      const displayWidth  = window.innerWidth  * DPR;
      const displayHeight = window.innerHeight * DPR;
      canvas.width  = displayWidth;
      canvas.height = displayHeight;

      const newW = Math.max(1, Math.floor(displayWidth  / RES_SCALE));
      const newH = Math.max(1, Math.floor(displayHeight / RES_SCALE));
      if (newW === fieldWidth && newH === fieldHeight) return;

      fieldWidth  = newW;
      fieldHeight = newH;
      size = fieldWidth * fieldHeight;

      paintField  = new Float32Array(size).fill(1);
      targetField = new Float32Array(size).fill(1);
      desired     = new Float32Array(size);
      nextPaint   = new Float32Array(size);
      inkMask     = new Float32Array(size);
      maskBuffer  = new Float32Array(size);

      fieldOffscreen        = document.createElement('canvas');
      fieldOffscreen.width  = fieldWidth;
      fieldOffscreen.height = fieldHeight;
      fieldCtx              = fieldOffscreen.getContext('2d');
      fieldImageData        = fieldCtx.createImageData(fieldWidth, fieldHeight);
      fieldBuffer           = fieldImageData.data;

      targetCanvas        = document.createElement('canvas');
      targetCanvas.width  = fieldWidth;
      targetCanvas.height = fieldHeight;
      targetCtx           = targetCanvas.getContext('2d');

      if (mamboImages.length > 0) {
        setTargetFromImage(mamboImages[currentMamboIndex]);
      }
    }

    // ── Target image ───────────────────────────────────────────────────────
    function setTargetFromImage(img) {
      if (!targetCtx) return;
      targetCtx.clearRect(0, 0, fieldWidth, fieldHeight);
      targetCtx.drawImage(img, 0, 0, fieldWidth, fieldHeight);
      const data = targetCtx.getImageData(0, 0, fieldWidth, fieldHeight).data;
      fullMamboAmount = 0;
      for (let i = 0; i < size; i++) {
        const o = i * 4;
        targetField[i] = (data[o] + data[o + 1] + data[o + 2]) / (3 * 255);
        fullMamboAmount += 1 - targetField[i];   // BLACK units: dark pixels = ink
      }
      logLine(`[target-loaded] mambo=${currentMamboIndex} fullMamboBlack=${fullMamboAmount.toFixed(1)}`);
    }

    // ── Physics: black-mass-conserving local transport ─────────────────────

    // Recomputes strokeAmount, ratio, and desired[] from current paintField.
    function prepareDesired() {
      let strokeAmount = 0;
      for (let i = 0; i < size; i++) strokeAmount += 1 - paintField[i];
      lastStrokeAmount = strokeAmount;

      const ratio = strokeAmount / (fullMamboAmount + 1e-8);
      lastRatio = ratio;

      for (let i = 0; i < size; i++) {
        desired[i] = Math.min(1, (1 - targetField[i]) * ratio);
      }
    }

    // Runs exactly `n` neighbour-redistribution iterations on paintField.
    // Reads desired[] as the capacity target; writes result back to paintField.
   function runTransportIters(n) {
  // Seed ping-pong buffers with current black field.
  for (let i = 0; i < size; i++) nextPaint[i] = 1 - paintField[i];

  let cur = nextPaint;
  let nxt = maskBuffer;

  let movedTotal = 0;

  for (let iter = 0; iter < n; iter++) {
    nxt.set(cur);

    // Skip borders for simplicity (same as you do)
    for (let y = 1; y < fieldHeight - 1; y++) {
      for (let x = 1; x < fieldWidth - 1; x++) {
        const i = y * fieldWidth + x;

        const ei = cur[i] - desired[i];
        if (ei <= 0) continue;

        const n0 = i - 1, n1 = i + 1, n2 = i - fieldWidth, n3 = i + fieldWidth;

        // Push along error gradient: only to neighbors with smaller error
        const e0 = cur[n0] - desired[n0];
        const e1 = cur[n1] - desired[n1];
        const e2 = cur[n2] - desired[n2];
        const e3 = cur[n3] - desired[n3];

        const w0 = Math.max(0, ei - e0);
        const w1 = Math.max(0, ei - e1);
        const w2 = Math.max(0, ei - e2);
        const w3 = Math.max(0, ei - e3);

        const sumW = w0 + w1 + w2 + w3;
        if (sumW < 1e-12) continue;

        // Amount to try to move this iter from this cell
        let give = ei * transportRate;

        // Distribute proportionally by weights
        const transfers = [
          [n0, w0],
          [n1, w1],
          [n2, w2],
          [n3, w3],
        ];

        for (let k = 0; k < 4; k++) {
          const [nj, w] = transfers[k];
          if (w <= 0) continue;

          const t = give * (w / sumW);

          // Prevent negative mass at i
          const tClamped = Math.min(t, nxt[i]);
          if (tClamped <= 0) continue;

          nxt[i]  -= tClamped;
          nxt[nj] += tClamped;
          movedTotal += tClamped;
        }
      }
    }

    const tmp = cur; cur = nxt; nxt = tmp;
  }

  for (let i = 0; i < size; i++) {
    paintField[i] = Math.max(0, Math.min(1, 1 - cur[i]));
  }

  return movedTotal;
}

    function update() {
      const t0 = performance.now();
      prepareDesired();
      runTransportIters(transportIters);
      if (DEBUG) timeUpdate += performance.now() - t0;
    }

    // ── Loss + ink coverage (single pass, black-space) ─────────────────────
    function computeLossAndInk() {
      const t0 = performance.now();
      let lossSum = 0, inkSum = 0, totalExcess = 0;
      for (let i = 0; i < size; i++) {
        const black = 1 - paintField[i];
        inkSum      += inkMask[i];
        lossSum     += Math.abs(black - desired[i]);
        const exc = black - desired[i];
        if (exc > 0) totalExcess += exc;
      }
      if (DEBUG) timeLoss += performance.now() - t0;
      return {
        maskedLoss:  lossSum / size,
        inkAmount:   inkSum / size,
        totalExcess,
      };
    }

    // ── Render ─────────────────────────────────────────────────────────────
    function render() {
      const t0   = performance.now();
      const data = fieldBuffer;
      for (let i = 0; i < size; i++) {
        const tone = Math.max(0, Math.min(1, paintField[i]));
        const v    = tone * 255;
        const j    = i * 4;
        data[j]     = v;
        data[j + 1] = v;
        data[j + 2] = v;
        data[j + 3] = 255;
      }
      fieldCtx.putImageData(fieldImageData, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fieldOffscreen, 0, 0, canvas.width, canvas.height);
      if (DEBUG) timeRender += performance.now() - t0;
    }

    // ── Spawn / drag ───────────────────────────────────────────────────────
    function spawnSnapshot() {
      hasStabilizedThisCycle = true;
      const url     = canvas.toDataURL('image/png');
      const wrapper = document.createElement('div');
      wrapper.className = 'mambo-snapshot';
      wrapper.style.cssText = `
        position: absolute;
        opacity: 0;
        transform: scale(1) translateY(0);
        transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1),
                    opacity 0.4s ease, box-shadow 0.5s ease;
        cursor: grab;
        pointer-events: none;
        user-select: none;
        will-change: transform;
        z-index: 10;
      `;
      const sizeFactor = 0.55;
      const w = (canvas.width  / DPR) * sizeFactor;
      const h = (canvas.height / DPR) * sizeFactor;
      wrapper.style.width  = `${w}px`;
      wrapper.style.height = `${h}px`;
      wrapper.style.left   = `${(window.innerWidth  - w) / 2}px`;
      wrapper.style.top    = `${(window.innerHeight - h) / 2}px`;

      const img     = document.createElement('img');
      img.src       = url;
      img.alt       = '';
      img.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none;';
      wrapper.appendChild(img);
      container.appendChild(wrapper);
      spawned.push(wrapper);

      requestAnimationFrame(() => {
        wrapper.style.opacity   = '1';
        wrapper.style.transform = 'scale(1.1) translateY(-20px)';
        wrapper.style.boxShadow = '0 18px 64px rgba(0,0,0,0.95)';
      });
      setTimeout(() => {
        wrapper.style.transition   = 'transform 0.35s ease, box-shadow 0.35s ease';
        wrapper.style.transform    = 'scale(1) translateY(0)';
        wrapper.style.boxShadow    = '0 6px 28px rgba(0,0,0,0.7)';
        wrapper.style.pointerEvents = 'auto';
        initDrag(wrapper);
        manageSpawnOverflow();
      }, 550);

      if (statusEl) {
        statusEl.textContent  = 'Stabilized.';
        statusEl.style.opacity = '1';
        setTimeout(() => { statusEl.style.opacity = '0'; }, 600);
      }

      logLine(`[stabilized] cycle=${Date.now()} mambo=${currentMamboIndex}`);
      flushLog();
    }

    function manageSpawnOverflow() {
      if (spawned.length <= MAX_SPAWNED) return;
      runOffRight(spawned.pop());
    }

    function runOffRight(el) {
      const rect = el.getBoundingClientRect();
      const dist = window.innerWidth - rect.left + rect.width;
      el.style.transition = 'transform 0.9s cubic-bezier(0.55,0,1,0.45), opacity 0.9s ease';
      el.style.transform  = `translateX(${dist}px) rotate(10deg)`;
      el.style.opacity    = '0';
      setTimeout(() => el.remove(), 1000);
    }

    function initDrag(el) {
      let dragging = false, originX = 0, originY = 0;
      let lastX = 0, lastY = 0, velX = 0, velY = 0, rot = 0;
      let rafId = 0;

      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dragging = true;
        el.setPointerCapture(e.pointerId);
        const rect = el.getBoundingClientRect();
        originX = e.clientX - rect.left;
        originY = e.clientY - rect.top;
        lastX = e.clientX; lastY = e.clientY;
        velX = velY = 0;
        el.style.cursor    = 'grabbing';
        el.style.zIndex    = '100';
        el.style.boxShadow = '0 20px 72px rgba(0,0,0,0.95)';
        cancelAnimationFrame(rafId);
      });

      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        velX = velX * 0.7 + dx * 0.3;
        velY = velY * 0.7 + dy * 0.3;
        lastX = e.clientX; lastY = e.clientY;
        rot = Math.max(-18, Math.min(18, velX * 0.4));
        el.style.left      = `${e.clientX - originX}px`;
        el.style.top       = `${e.clientY - originY}px`;
        el.style.transform = `scale(1.03) rotate(${rot}deg)`;
      });

      const onUp = (e) => {
        dragging = false;
        el.style.cursor = 'grab';
        el.style.zIndex = '10';
        if (e.pointerId) el.releasePointerCapture(e.pointerId);
        inertia();
      };
      el.addEventListener('pointerup',    onUp);
      el.addEventListener('pointercancel', onUp);

      function inertia() {
        velX *= 0.9; velY *= 0.9; rot *= 0.88;
        if (Math.sqrt(velX * velX + velY * velY) < 0.2) {
          el.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
          el.style.transform  = `rotate(${rot.toFixed(1)}deg)`;
          el.style.boxShadow  = '0 6px 28px rgba(0,0,0,0.7)';
          return;
        }
        el.style.left      = `${parseFloat(el.style.left  || 0) + velX}px`;
        el.style.top       = `${parseFloat(el.style.top   || 0) + velY}px`;
        el.style.transform = `scale(1) rotate(${rot.toFixed(1)}deg)`;
        rafId = requestAnimationFrame(inertia);
      }
    }

    // ── Input handlers ─────────────────────────────────────────────────────
    function applyBrush(x, y) {
      const radius = (brushRadiusPx * DPR) / RES_SCALE;
      const r2 = radius * radius;
      const minX = Math.max(0, Math.floor(x - radius));
      const maxX = Math.min(fieldWidth  - 1, Math.ceil(x + radius));
      const minY = Math.max(0, Math.floor(y - radius));
      const maxY = Math.min(fieldHeight - 1, Math.ceil(y + radius));
      for (let j = minY; j <= maxY; j++) {
        const dy = j - y, dy2 = dy * dy;
        for (let i = minX; i <= maxX; i++) {
          const dx = i - x, d2 = dx * dx + dy2;
          if (d2 > r2) continue;
          const falloff = 1 - Math.sqrt(d2) / radius;
          const idx = (j * fieldWidth) + i;
          paintField[idx] = Math.max(0, paintField[idx] - brushStrength * falloff);
          inkMask[idx]    = Math.min(1, inkMask[idx] + falloff * 0.35);
        }
      }
    }

    function pointerToField(e) {
      const rect   = canvas.getBoundingClientRect();
      const client = e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
      return {
        x: ((client.clientX - rect.left) * DPR) / RES_SCALE,
        y: ((client.clientY - rect.top)  * DPR) / RES_SCALE,
      };
    }

    function handlePointerDown(e) {
      pointerDown  = true;
      lastPointer  = pointerToField(e);
    }

    function handlePointerMove(e) {
      if (!pointerDown) return;
      const pos  = pointerToField(e);
      if (!lastPointer) { lastPointer = pos; applyBrush(pos.x, pos.y); return; }
      const dx   = pos.x - lastPointer.x, dy = pos.y - lastPointer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = (brushRadiusPx * DPR) / RES_SCALE / 3;
      if (dist === 0 || step <= 0) {
        applyBrush(pos.x, pos.y);
      } else {
        const steps = Math.ceil(dist / step);
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          applyBrush(lastPointer.x + dx * t, lastPointer.y + dy * t);
        }
      }
      lastPointer = pos;
    }

    function handlePointerUp() { pointerDown = false; lastPointer = null; }

    // ── Cycle reset ────────────────────────────────────────────────────────
    function resetFields() {
      paintField.fill(1);
      inkMask.fill(0);
      morphing               = false;
      stepFrameClock         = 0;
      hasStabilizedThisCycle = false;
      cycleStartMs           = performance.now();
      currentMamboIndex      = Math.floor(Math.random() * mamboImages.length);
      setTargetFromImage(mamboImages[currentMamboIndex]);
      if (statusEl) {
        statusEl.textContent   = 'Draw…';
        statusEl.style.opacity = '1';
      }
      logLine(`[reset] mambo=${currentMamboIndex}`);
    }

    // ── Main loop ──────────────────────────────────────────────────────────
    let lastTime = performance.now();
    let rafHandle;

    function loop(now) {
      rafHandle = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Always refresh desired[] + stroke/ratio so metrics are current.
      // Transport iterations are gated by autoPropagate; Step button bypasses this.
      if (morphing) {
        prepareDesired();
        if (autoPropagate) {
          stepFrameClock++;
          if (stepFrameClock >= FRAMES_PER_STEP) {
            stepFrameClock = 0;
            runTransportIters(1);
          }
        }
      }

      render();

      if (!hasStabilizedThisCycle) {
        const { maskedLoss, inkAmount, totalExcess } = computeLossAndInk();
        lastInkAmount   = inkAmount;
        lastMaskedLoss  = maskedLoss;
        lastTotalExcess = totalExcess;

        // Transition from drawing to morphing once minimum ink threshold is met
        if (!morphing && inkAmount >= minInk) {
          morphing          = true;
          morphStartMs      = performance.now();
          initialMaskedLoss = maskedLoss;
          logLine(`[morph-start] ink=${inkAmount.toFixed(4)} mambo=${currentMamboIndex} initLoss=${initialMaskedLoss.toFixed(4)}`);
        }

        // Stabilization: inked region has converged to target
        // if (morphing && maskedLoss < lossThreshold && inkAmount > minInk) {
        //   spawnSnapshot();
        //   resetFields();
        // }
      }

      tickProfiler();
    }

    // ── Init ───────────────────────────────────────────────────────────────
    async function loadMambos() {
      const images = await Promise.all(MAMBO_GRAY.map(loadImg));
      mamboImages.splice(0, mamboImages.length, ...images);
      currentMamboIndex = Math.floor(Math.random() * mamboImages.length);
      setTargetFromImage(mamboImages[currentMamboIndex]);
    }

    function init() {
      resize();
      canvas.style.width  = '100%';
      canvas.style.height = '100%';

      canvas.addEventListener('pointerdown',  handlePointerDown);
      canvas.addEventListener('pointermove',  handlePointerMove);
      canvas.addEventListener('pointerup',    handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerUp);
      canvas.addEventListener('pointerleave', handlePointerUp);

      const solveBtn = solveBtnRef.current;
      if (solveBtn) {
        solveBtn.addEventListener('click', () => {
          // Compute black mass and ratio from current paint.
          let strokeAmount = 0;
          for (let i = 0; i < size; i++) strokeAmount += 1 - paintField[i];
          const ratio = strokeAmount / (fullMamboAmount + 1e-8);
          lastStrokeAmount = strokeAmount;
          lastRatio        = ratio;

          // Directly assign exact equilibrium — no transport.
          for (let i = 0; i < size; i++) {
            const desiredBlack = (1 - targetField[i]) * ratio;
            paintField[i] = 1 - Math.max(0, Math.min(1, desiredBlack));
          }

          // Recompute desired[] so loss is meaningful.
          for (let i = 0; i < size; i++) {
            desired[i] = Math.min(1, (1 - targetField[i]) * ratio);
          }

          render();

          const { maskedLoss, totalExcess } = computeLossAndInk();
          lastMaskedLoss  = maskedLoss;
          lastTotalExcess = totalExcess;
          console.log('[solve] ratio:', ratio.toFixed(4), 'loss:', maskedLoss.toFixed(6), 'excess:', totalExcess.toFixed(3));
          logLine(`[solve] ratio:${ratio.toFixed(4)} loss:${maskedLoss.toFixed(6)} excess:${totalExcess.toFixed(3)}`);
          flushLog();
        });
      }

      const stepBtn = stepBtnRef.current;
      if (stepBtn) {
        stepBtn.addEventListener('click', () => {
  if (!morphing) return;

  prepareDesired();
  const moved = runTransportIters(DEBUG_SOLVER_STEPS);
  render();

  const { maskedLoss, totalExcess } = computeLossAndInk();
  lastMaskedLoss  = maskedLoss;
  lastTotalExcess = totalExcess;

  console.log(`[step] moved=${moved.toFixed(4)} loss=${maskedLoss.toFixed(4)} excess=${totalExcess.toFixed(3)}`);
  logLine(`[step] moved=${moved.toFixed(4)} loss=${maskedLoss.toFixed(4)} excess=${totalExcess.toFixed(3)}`);
  flushLog();
});
      }

      loadMambos().then(() => {
        lastTime  = performance.now();
        fpsTimer  = performance.now();
        logLine(`[init] field=${fieldWidth}x${fieldHeight}`);
        rafHandle = requestAnimationFrame(loop);
      });
    }

    window.addEventListener('resize', resize);
    init();

    return () => {
      cancelAnimationFrame(rafHandle);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown',  handlePointerDown);
      canvas.removeEventListener('pointermove',  handlePointerMove);
      canvas.removeEventListener('pointerup',    handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
      flushLog();
    };
  }, []);

  return (
    <>
      <style>{`
        html, body {
          background: #ffffff !important;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        .mambo-snapshot img {
          display: block;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ position: 'fixed', inset: 0, background: '#ffffff' }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            touchAction: 'none',
            display: 'block',
          }}
        />
        <div
          ref={statusRef}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 28,
            transform: 'translateX(-50%)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(60,60,70,0.55)',
            pointerEvents: 'none',
            transition: 'opacity 0.5s ease',
          }}
        >
          Draw…
        </div>
        <button
          ref={stepBtnRef}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '4px 12px',
            fontSize: 11,
            letterSpacing: '0.06em',
            fontFamily: 'inherit',
            background: 'rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.2)',
            color: 'rgba(0,0,0,0.55)',
            borderRadius: 4,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          Step ×4
        </button>
        <button
          ref={solveBtnRef}
          style={{
            position: 'absolute',
            top: 12,
            left: 88,
            padding: '4px 12px',
            fontSize: 11,
            letterSpacing: '0.06em',
            fontFamily: 'inherit',
            background: 'rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.2)',
            color: 'rgba(0,0,0,0.55)',
            borderRadius: 4,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          Solve
        </button>
      </div>
    </>
  );
}
