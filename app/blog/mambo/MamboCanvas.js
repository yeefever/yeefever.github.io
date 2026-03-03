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
const FRAMES_PER_STEP     = 4;    // ← tune: run 1 transport iteration every N rendered frames
const PYRAMID_LEVELS      = 4;    // coarse-to-fine levels (0 = coarsest, 3 = finest)
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
  const timerRef     = useRef(null);

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

    // ── Countdown timer state ──────────────────────────────────────────────
    // Random 30–60 s drawing window before mamboification begins.
    const TIMER_MIN_MS = 45_000;
    const TIMER_MAX_MS = 60_000;
    let timerEndMs    = 0;   // absolute timestamp when the timer fires
    let timerFired    = false;

    // ── Transport state ────────────────────────────────────────────────────
    let fullMamboAmount   = 0;     // sum(1-targetField) for finest level — black mass
    let targetPyramid     = [];    // [coarsest … finest] full-res Float32Arrays
    let currentLevel      = 0;     // which pyramid level is currently driving transport
    let levelStartLoss    = 1;     // maskedLoss when we entered the current level
    let levelFrameCount   = 0;     // frames spent at the current level
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

    // Returns aggressiveness of mass transfer; high at coarse levels, tapers to fine.
    // Rate: 2.0 → 0.7 → 0.245 → 0.086  (steep exponential falloff)
    function getTransportRate() {
      return 2.0 * Math.pow(0.35, currentLevel);
    }

    // Iters per trigger: 64 → 16 → 8 → 4
    function getTransportIters() {
      return [28, 26, 20, 16][Math.min(currentLevel, 3)];
    }

    // Coarse levels trigger transport every rendered frame; fine levels respect FRAMES_PER_STEP.
    function getFramesPerStep() {
      return Math.max(1, FRAMES_PER_STEP - (PYRAMID_LEVELS - 1 - currentLevel));
      // level 0 → 1 (every frame), 1 → 2, 2 → 3, 3 → FRAMES_PER_STEP
    }

    // ── Input state ────────────────────────────────────────────────────────
    let pointerDown = false, lastPointer = null;
    let brushRadius = brushRadiusPx;  // mutable; adjusted by scroll/pinch

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
        //flushLog();
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

    // ── Target image + coarse-to-fine pyramid ─────────────────────────────
    function setTargetFromImage(img) {
      targetPyramid = [];
      currentLevel  = 0;

      for (let level = 0; level < PYRAMID_LEVELS; level++) {
        // Level 0 = coarsest (2^(L-1) downscale), level L-1 = full resolution.
        const ls = 1 / Math.pow(2, PYRAMID_LEVELS - 1 - level);
        const pw = Math.max(1, Math.round(fieldWidth  * ls));
        const ph = Math.max(1, Math.round(fieldHeight * ls));

        const sc   = document.createElement('canvas');
        sc.width   = pw;
        sc.height  = ph;
        const sctx = sc.getContext('2d');
        sctx.drawImage(img, 0, 0, pw, ph);
        const sdata = sctx.getImageData(0, 0, pw, ph).data;

        // Read grayscale at small resolution.
        const small = new Float32Array(pw * ph);
        for (let i = 0; i < pw * ph; i++) {
          const o = i * 4;
          small[i] = (sdata[o] + sdata[o + 1] + sdata[o + 2]) / (3 * 255);
        }

        // Upsample back to full field resolution (nearest-neighbour).
        const full = new Float32Array(size);
        for (let y = 0; y < fieldHeight; y++) {
          for (let x = 0; x < fieldWidth; x++) {
            const sx = Math.min(pw - 1, Math.floor(x * pw / fieldWidth));
            const sy = Math.min(ph - 1, Math.floor(y * ph / fieldHeight));
            full[y * fieldWidth + x] = small[sy * pw + sx];
          }
        }

        targetPyramid.push(full);
      }

      // Keep targetField as the finest level for backward-compat.
      targetField.set(targetPyramid[PYRAMID_LEVELS - 1]);

      // fullMamboAmount always uses finest-level black mass.
      fullMamboAmount = 0;
      for (let i = 0; i < size; i++) fullMamboAmount += 1 - targetField[i];

      logLine(`[target-loaded] mambo=${currentMamboIndex} fullMamboBlack=${fullMamboAmount.toFixed(1)} levels=${PYRAMID_LEVELS}`);
    }

    // ── Physics: black-mass-conserving local transport ─────────────────────

    // Recomputes strokeAmount, ratio, and desired[] from current paintField.
    // Uses the current pyramid level as the transport target.
    function prepareDesired() {
      let strokeAmount = 0;
      for (let i = 0; i < size; i++) strokeAmount += 1 - paintField[i];
      lastStrokeAmount = strokeAmount;

      const ratio = strokeAmount / (fullMamboAmount + 1e-8);
      lastRatio = ratio;

      const target = targetPyramid[currentLevel] ?? targetField;
      for (let i = 0; i < size; i++) {
        desired[i] = Math.min(1, (1 - target[i]) * ratio);
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
        let give = ei * getTransportRate();

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
      const radius = (brushRadius * DPR) / RES_SCALE;
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
      const step = (brushRadius * DPR) / RES_SCALE / 3;
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

    function startTimer() {
      const duration = TIMER_MIN_MS + Math.random() * (TIMER_MAX_MS - TIMER_MIN_MS);
      timerEndMs  = performance.now() + duration;
      timerFired  = false;
      const timerEl = timerRef.current;
      if (timerEl) timerEl.style.opacity = '1';
      logLine(`[timer-start] duration=${(duration / 1000).toFixed(1)}s`);
    }

    // ── Cycle reset ────────────────────────────────────────────────────────
    function resetFields() {
      paintField.fill(1);
      inkMask.fill(0);
      morphing               = false;
      stepFrameClock         = 0;
      currentLevel           = 0;
      levelStartLoss         = 1;
      levelFrameCount        = 0;
      hasStabilizedThisCycle = false;
      cycleStartMs           = performance.now();
      currentMamboIndex      = Math.floor(Math.random() * mamboImages.length);
      setTargetFromImage(mamboImages[currentMamboIndex]);
      startTimer();
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
          if (stepFrameClock >= getFramesPerStep()) {
            stepFrameClock = 0;
            runTransportIters(getTransportIters());
          }
        }
      }

      render();

      // ── Countdown display ────────────────────────────────────────────────
      const timerEl = timerRef.current;
      if (timerEl && !timerFired) {
        const remaining = Math.max(0, timerEndMs - now);
        const secs = Math.ceil(remaining / 1000);
        timerEl.textContent = secs > 0 ? secs : '';

        // Sample paintField under the timer element; switch to white when ≥50% is black.
        const canvasRect = canvas.getBoundingClientRect();
        const timerRect  = timerEl.getBoundingClientRect();
        const x1 = Math.max(0, Math.floor((timerRect.left   - canvasRect.left) / canvasRect.width  * fieldWidth));
        const x2 = Math.min(fieldWidth,  Math.ceil((timerRect.right  - canvasRect.left) / canvasRect.width  * fieldWidth));
        const y1 = Math.max(0, Math.floor((timerRect.top    - canvasRect.top)  / canvasRect.height * fieldHeight));
        const y2 = Math.min(fieldHeight, Math.ceil((timerRect.bottom - canvasRect.top)  / canvasRect.height * fieldHeight));
        let blackPixels = 0, total = 0;
        for (let fy = y1; fy < y2; fy++) {
          for (let fx = x1; fx < x2; fx++) {
            if (1 - paintField[fy * fieldWidth + fx] > 0.5) blackPixels++;
            total++;
          }
        }
        const darkFrac = total > 0 ? blackPixels / total : 0;
        timerEl.style.color = darkFrac >= 0.5
          ? 'rgba(255,255,255,0.6)'
          : 'rgba(40,40,50,0.18)';
      }

      if (!hasStabilizedThisCycle) {
        const { maskedLoss, inkAmount, totalExcess } = computeLossAndInk();
        lastInkAmount   = inkAmount;
        lastMaskedLoss  = maskedLoss;
        lastTotalExcess = totalExcess;

        // Fire morphing when countdown reaches zero (needs at least some ink).
        if (!morphing && !timerFired && now >= timerEndMs && inkAmount >= minInk) {
          timerFired        = true;
          morphing          = true;
          morphStartMs      = performance.now();
          initialMaskedLoss = maskedLoss;
          levelStartLoss    = maskedLoss;
          levelFrameCount   = 0;
          if (timerEl) timerEl.textContent = '';
          logLine(`[morph-start] ink=${inkAmount.toFixed(4)} mambo=${currentMamboIndex} initLoss=${initialMaskedLoss.toFixed(4)} level=${currentLevel}`);
        }

        // Advance to a finer pyramid level when:
        //   (a) loss has dropped to 15% of what it was when we entered this level, OR
        //   (b) we've spent too long at this level (budget exceeded).
        if (morphing && currentLevel < PYRAMID_LEVELS - 1) {
          levelFrameCount++;
          const relConverged    = maskedLoss < levelStartLoss * 0.15;
          const budgetExceeded  = levelFrameCount > 90;   // ~1.5 s at 60 fps
          if (relConverged || budgetExceeded) {
            currentLevel++;
            levelStartLoss  = maskedLoss;
            levelFrameCount = 0;
            stepFrameClock  = 0;
            console.log(`[pyramid] → level ${currentLevel} loss=${maskedLoss.toFixed(4)}`);
            logLine(`[pyramid-advance] level=${currentLevel} loss=${maskedLoss.toFixed(4)}`);
          }
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

      function handleWheel(e) {
        e.preventDefault();
        // Pinch-to-zoom on trackpad sends ctrlKey=true with large deltaY values;
        // regular scroll sends small deltaY. Both feel natural with the same factor.
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        brushRadius = Math.max(8, Math.min(200, brushRadius * factor));
      }
      canvas.addEventListener('wheel', handleWheel, { passive: false });

      loadMambos().then(() => {
        lastTime  = performance.now();
        fpsTimer  = performance.now();
        startTimer();
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
      canvas.removeEventListener('wheel', handleWheel);
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
        <div
          ref={timerRef}
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 48,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            color: 'rgba(40,40,50,0.18)',
            pointerEvents: 'none',
            transition: 'opacity 0.6s ease',
            userSelect: 'none',
          }}
        />
      </div>
    </>
  );
}
