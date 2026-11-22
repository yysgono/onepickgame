import { WIDTH, HEIGHT, CX, CY, RADIUS, FINISH, OPEN_AT, arenaObstacles } from './marbleArenaPhysics';
export const COLORS = ['#70e5cb', '#90bbff', '#ffd078', '#ffa1bf', '#c0a6ff', '#ffb384'];
function circle(ctx, x, y, r, fill) {
 ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
}
function label(ctx, value, x, y, size, color, max = 180) {
 ctx.font = `700 ${size}px system-ui`; ctx.fillStyle = color;
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 const raw = String(value || ''); let shown = raw;
 while (shown.length > 1 && ctx.measureText(shown).width > max) shown = shown.slice(0, -1);
 if (shown !== raw) shown = shown.slice(0, -1) + '…';
 ctx.fillText(shown, x, y);
}
function marble(ctx, ball, image, showName) {
 const { x, y, r, index } = ball, color = COLORS[index % COLORS.length];
 circle(ctx, x + 2, y + 5, r + 1, '#001c2944');
 const fill = ctx.createRadialGradient(x - r * .4, y - r * .5, 1, x, y, r);
 fill.addColorStop(0, '#fff'); fill.addColorStop(.25, color); fill.addColorStop(1, '#28566f');
 circle(ctx, x, y, r, fill);
 if (image?.complete && image.naturalWidth) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 2, 0, Math.PI * 2); ctx.clip();
  const scale = Math.max(r * 2 / image.naturalWidth, r * 2 / image.naturalHeight);
  ctx.drawImage(image, x - image.naturalWidth * scale / 2, y - image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale);
  ctx.restore();
 } else label(ctx, index + 1, x, y + .5, Math.max(9, r * .7), '#13394b', r * 1.5);
 ctx.beginPath(); ctx.arc(x, y, r - 1, Math.PI * 1.1, Math.PI * 1.7);
 ctx.strokeStyle = '#ffffffb0'; ctx.lineWidth = 2; ctx.stroke();
 if (showName) {
  ctx.font = '700 11px system-ui'; const w = Math.min(100, ctx.measureText(ball.row.name).width + 12);
  ctx.fillStyle = '#102d43e8'; ctx.fillRect(x - w / 2, y + r + 4, w, 19);
  label(ctx, ball.row.name, x, y + r + 14, 11, '#fff', w - 8);
 }
}
export function paintArena(ctx, race, width, height, images) {
 const scale = Math.min(width / WIDTH, height / HEIGHT);
 const ox = (width - WIDTH * scale) / 2, oy = (height - HEIGHT * scale) / 2;
 const background = ctx.createLinearGradient(0, 0, width, height);
 background.addColorStop(0, '#112d43'); background.addColorStop(1, '#203657');
 ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
 ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
 const time = race.time, open = time >= OPEN_AT;
 // Inset floor, raised circular rim and soft highlights give depth without WebGL.
 circle(ctx, CX, CY + 13, RADIUS + 22, '#061b2cb0');
 circle(ctx, CX, CY, RADIUS + 21, '#7691b2');
 circle(ctx, CX, CY - 3, RADIUS + 15, '#dce9ef');
 circle(ctx, CX, CY, RADIUS + 6, '#527788');
 const floor = ctx.createRadialGradient(CX - 80, CY - 100, 20, CX, CY, RADIUS);
 floor.addColorStop(0, '#2c707c'); floor.addColorStop(1, '#143e56');
 circle(ctx, CX, CY, RADIUS, floor);
 ctx.strokeStyle = '#b4f1d514'; ctx.lineWidth = 1;
 for (const r of [65, 125, 190]) { ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke(); }
 for (let i = 0; i < 16; i++) {
  const angle = i * Math.PI / 8;
  circle(ctx, CX + Math.cos(angle) * (RADIUS + 12), CY + Math.sin(angle) * (RADIUS + 12), 3, i % 2 ? '#fff5' : '#80ffd9');
 }
 label(ctx, 'ONE PICK GAME', CX, 29, 16, '#defbf2', 300);
 // A real gap opens at the bottom of the bowl into the finish chute.
 ctx.fillStyle = '#102b40'; ctx.fillRect(CX - 57, CY + RADIUS - 6, 114, FINISH - CY - RADIUS + 27);
 ctx.strokeStyle = '#6d9cb0'; ctx.lineWidth = 7; ctx.lineCap = 'round';
 ctx.beginPath(); ctx.moveTo(CX - 60, CY + RADIUS + 4); ctx.lineTo(CX - 60, FINISH + 6);
 ctx.moveTo(CX + 60, CY + RADIUS + 4); ctx.lineTo(CX + 60, FINISH + 6); ctx.stroke();
 for (let i = 0; i < 8; i++) {
  ctx.fillStyle = i % 2 ? '#c9f4e7' : '#16475a'; ctx.fillRect(CX - 56 + i * 14, FINISH, 14, 12);
 }
 if (!open) {
  ctx.strokeStyle = '#ffd281'; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(CX - 57, CY + RADIUS); ctx.lineTo(CX + 57, CY + RADIUS); ctx.stroke();
  circle(ctx, CX, CY + RADIUS, 23, '#ffd281');
  label(ctx, Math.max(1, Math.ceil(OPEN_AT - time)), CX, CY + RADIUS, 20, '#493c24');
 } else {
  const glow = ctx.createRadialGradient(CX, CY + RADIUS + 14, 2, CX, CY + RADIUS + 14, 65);
  glow.addColorStop(0, '#83ffe35c'); glow.addColorStop(1, '#83ffe300');
  ctx.fillStyle = glow; ctx.fillRect(CX - 70, CY + RADIUS - 55, 140, 140);
  label(ctx, '▼', CX, FINISH - 50, 25, '#8ff6d0');
 }
 const scene = arenaObstacles(time, race.phase);
 for (const o of scene.bumpers) {
  circle(ctx, o.x + 2, o.y + 5, o.r + 3, '#072c3d80');
  circle(ctx, o.x, o.y, o.r, '#ffc477'); circle(ctx, o.x - 3, o.y - 4, o.r * .52, '#ffe6b4');
 }
 for (const o of scene.segments) {
  ctx.lineCap = 'round'; ctx.lineWidth = o.r * 2 + 4; ctx.strokeStyle = '#0e283b80';
  ctx.beginPath(); ctx.moveTo(o.ax + 2, o.ay + 6); ctx.lineTo(o.bx + 2, o.by + 6); ctx.stroke();
  ctx.lineWidth = o.r * 2; ctx.strokeStyle = '#a7a2f5';
  ctx.beginPath(); ctx.moveTo(o.ax, o.ay); ctx.lineTo(o.bx, o.by); ctx.stroke();
  ctx.lineWidth = 3; ctx.strokeStyle = '#e5e4ff'; ctx.stroke();
 }
 if (scene.segments.length) { circle(ctx, CX + 2, CY + 5, 23, '#102a3b90'); circle(ctx, CX, CY, 21, '#ddedf3'); circle(ctx, CX, CY, 12, '#a6b8d0'); }
 const active = race.balls.filter(b => !b.finished);
 const nearExit = open ? [...active].sort((a, b) => b.y - a.y).slice(0, 5) : [];
 for (const b of active) {
  if (b.y > FINISH + 20) continue;
  marble(ctx, b, images.get(b.row.image), race.balls.length <= 16 || nearExit.includes(b));
 }
 label(ctx, race.order.length + ' / ' + race.balls.length, CX, HEIGHT - 23, 17, '#c8eee8');
 // Brief deterministic celebration, separate from the simulation and its result.
 if (race.winner && !race.complete) {
  const first = race.balls.find(b => b.row.id === race.winner.id);
  const age = time - (first?.finishedAt || time);
  if (age < 2.3) for (let i = 0; i < 36; i++) {
   const x = CX + Math.sin(i * 13.37) * (45 + age * 130), y = 95 + age * (65 + i % 8 * 17);
   ctx.save(); ctx.translate(x, y); ctx.rotate(i + age * 3); ctx.fillStyle = COLORS[i % 6]; ctx.fillRect(-3, -6, 6, 12); ctx.restore();
  }
 }
 ctx.restore();
}
