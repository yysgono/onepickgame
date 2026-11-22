// Fixed-step, seeded 2D physics. Arrival order, rather than a preselected winner,
// determines the result. All selected candidates remain in the simulation.
export const WIDTH = 600, HEIGHT = 750, CX = 300, CY = 300, RADIUS = 232;
export const DT = 1 / 120, OPEN_AT = 5, FINISH = 684;
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export function makeArena(pool, seed = 1) {
 let state = seed >>> 0;
 const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
 const slots = pool.map((_, i) => i);
 for (let i = slots.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [slots[i], slots[j]] = [slots[j], slots[i]];
 }
 const r = pool.length <= 20 ? 18 : pool.length <= 60 ? 13 : 9;
 const balls = pool.map((row, index) => {
  const a = slots[index] * 2.399963229728653 + random() * .05;
  const distance = Math.sqrt((slots[index] + .5) / pool.length) * 190;
  return { row, index, r, x: CX + Math.cos(a) * distance, y: CY + Math.sin(a) * distance,
   vx: (random() - .5) * 160, vy: (random() - .5) * 160, finished: false, escaped: false };
 });
 return { balls, time: 0, phase: random() * TAU, order: [], winner: null, complete: !pool.length, failed: false, collisions: 0 };
}
export function arenaObstacles(time, phase) {
 // Withdraw the mixing arms after the gate opens so no candidate gets trapped.
 const length = 136 * clamp(1 - Math.max(0, time - OPEN_AT) / 5, 0, 1);
 const angle = phase + time * 1.15;
 const segments = [];
 if (length > 1) for (let i = 0; i < 3; i++) {
  const a = angle + i * TAU / 3;
  segments.push({ ax: CX, ay: CY, bx: CX + Math.cos(a) * length, by: CY + Math.sin(a) * length, r: 7, omega: 1.15 });
 }
 const bumpers = time < OPEN_AT + 7 ? Array.from({ length: 4 }, (_, i) => {
  const a = i * TAU / 4 + .3;
  return { x: CX + Math.cos(a) * 164, y: CY + Math.sin(a) * 164, r: 15 };
 }) : [];
 return { segments, bumpers };
}
function hit(ball, x, y, radius, vx = 0, vy = 0) {
 let dx = ball.x - x, dy = ball.y - y, d = Math.hypot(dx, dy);
 const min = ball.r + radius;
 if (d >= min) return false;
 if (d < .00001) { dx = 1; dy = 0; d = 1; }
 const nx = dx / d, ny = dy / d;
 ball.x = x + nx * (min + .02); ball.y = y + ny * (min + .02);
 const speed = (ball.vx - vx) * nx + (ball.vy - vy) * ny;
 if (speed < 0) { ball.vx -= 1.75 * speed * nx; ball.vy -= 1.75 * speed * ny; }
 return true;
}
export function stepArena(race) {
 if (race.complete || race.failed) return;
 race.time += DT;
 const open = race.time >= OPEN_AT;
 const scene = arenaObstacles(race.time, race.phase), crossings = [];
 for (const b of race.balls) {
  if (b.finished) continue;
  const before = b.y, dx = b.x - CX, dy = b.y - CY;
  if (!b.escaped) {
   // Air jets keep the closed bowl lively; after opening, a central current
   // clears the outlet without moving or selecting a particular candidate.
   if (!open) {
    b.vx += (-dy * .65 + Math.sin(race.time * 3 + b.index) * 90) * DT;
    b.vy += (dx * .65 - 100) * DT;
   } else {
    b.vx += (-dx * (race.time > 16 ? 3.5 : 1.6)) * DT;
   }
  }
  b.vx = clamp(b.vx * .9985, -340, 340);
  b.vy = clamp((b.vy + (open ? 300 : 120) * DT) * .999, -340, 400);
  b.x += b.vx * DT; b.y += b.vy * DT;
  if (!b.escaped) {
   for (const o of scene.bumpers) if (hit(b, o.x, o.y, o.r)) race.collisions++;
   for (const o of scene.segments) {
    const sx = o.bx - o.ax, sy = o.by - o.ay;
    const t = clamp(((b.x - o.ax) * sx + (b.y - o.ay) * sy) / (sx * sx + sy * sy), 0, 1);
    const x = o.ax + t * sx, y = o.ay + t * sy;
    if (hit(b, x, y, o.r, -(y - CY) * o.omega, (x - CX) * o.omega)) race.collisions++;
   }
   const x = b.x - CX, y = b.y - CY, d = Math.hypot(x, y), limit = RADIUS - b.r;
   const atExit = open && y > 0 && Math.abs(x) < 57 - b.r;
   if (d > limit && !atExit) {
    const nx = x / d, ny = y / d;
    b.x = CX + nx * limit; b.y = CY + ny * limit;
    const v = b.vx * nx + b.vy * ny;
    if (v > 0) { b.vx -= 1.75 * v * nx; b.vy -= 1.75 * v * ny; race.collisions++; }
   }
   if (atExit && b.y > CY + RADIUS - 16) b.escaped = true;
  } else {
   if (b.x < CX - 57 + b.r) { b.x = CX - 57 + b.r; b.vx = Math.abs(b.vx) * .5; }
   if (b.x > CX + 57 - b.r) { b.x = CX + 57 - b.r; b.vx = -Math.abs(b.vx) * .5; }
   if (b.y >= FINISH) crossings.push({ ball: b, fraction: clamp((FINISH - before) / Math.max(.001, b.y - before), 0, 1) });
  }
 }
 // Only inspect neighboring cells, including for 200 participants.
 const cells = new Map(), size = 38;
 for (const b of race.balls) {
  if (b.finished) continue;
  const gx = Math.floor(b.x / size), gy = Math.floor(b.y / size);
  for (let x = gx - 1; x <= gx + 1; x++) for (let y = gy - 1; y <= gy + 1; y++) {
   for (const a of cells.get(x + ':' + y) || []) {
    if (a.escaped !== b.escaped) continue;
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
    if (d >= min) continue;
    if (d < .00001) { dx = 1; dy = 0; d = 1; }
    const nx = dx / d, ny = dy / d, push = (min - d) / 2;
    a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    const v = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (v < 0) { const j = -.87 * v; a.vx -= j * nx; a.vy -= j * ny; b.vx += j * nx; b.vy += j * ny; }
    race.collisions++;
   }
  }
  const key = gx + ':' + gy;
  if (!cells.has(key)) cells.set(key, []);
  cells.get(key).push(b);
 }
 crossings.sort((a, b) => a.fraction - b.fraction || a.ball.index - b.ball.index);
 for (const { ball, fraction } of crossings) {
  ball.finished = true; ball.finishedAt = race.time - DT + DT * fraction;
  race.order.push(ball.row);
 }
 race.winner = race.order[0] || null;
 race.complete = race.order.length === race.balls.length;
 if (!race.complete && race.time > 90) race.failed = true;
}
