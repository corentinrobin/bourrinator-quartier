// Outils de construction en cubes : boîtes, murs, façades, escaliers, lettres, et le petit mobilier urbain.
import { M, GROUND, N } from './voxel.js';

export function rng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.int = (a0, b0) => a0 + Math.floor(r() * (b0 - a0 + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.range = (a0, b0) => a0 + r() * (b0 - a0);
  return r;
}

// police 3 × 5
const FONT = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'], K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'], N: ['110', '101', '101', '101', '101'], O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'], Q: ['010', '101', '101', '110', '011'], R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'], W: ['101', '101', '111', '111', '101'], X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'],
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['110', '001', '010', '100', '111'],
  3: ['110', '001', '010', '001', '110'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '110', '001', '110'],
  6: ['011', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '110'], '-': ['000', '000', '111', '000', '000'], "'": ['010', '010', '000', '000', '000'],
  '!': ['010', '010', '010', '000', '010'], '.': ['000', '000', '000', '000', '010'], ' ': ['000', '000', '000', '000', '000'],
  '€': ['011', '100', '111', '100', '011'],
};

export class Builder {
  constructor(world) { this.w = world; this.sx = world.sx; this.sz = world.sz; }
  set(x, y, z, m) {
    const W = this.w;
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (x < 0 || z < 0 || x >= W.sx || z >= W.sz) return;
    const Y = y + GROUND;
    if (Y < 1 || Y >= W.sy) return;
    if (!(m >= 0 && m < N)) return;   // matière inconnue : on ne pose rien
    W.data[x + z * W.sx + Y * W.sxz] = m;
  }
  get(x, y, z) { return this.w.get(x, y + GROUND, z); }
  // [x0,x1) × [y0,y1) × [z0,z1) ; m peut être une fonction (x,y,z) → matière (-1 = on ne touche pas)
  fill(x0, y0, z0, x1, y1, z1, m) {
    const f = typeof m === 'function';
    for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
      const v = f ? m(x, y, z) : m;
      if (v >= 0) this.set(x, y, z, v);
    }
  }
  walls(x0, z0, x1, z1, y0, y1, m) {
    this.fill(x0, y0, z0, x1, y1, z0 + 1, m); this.fill(x0, y0, z1 - 1, x1, y1, z1, m);
    this.fill(x0, y0, z0, x0 + 1, y1, z1, m); this.fill(x1 - 1, y0, z0, x1, y1, z1, m);
  }
  top(x0, z0, x1, z1, m) { this.fill(x0, -1, z0, x1, 0, z1, m); }
  cyl(cx, cz, r, y0, y1, m, shell = 0) {
    const r2 = r * r, ri2 = shell && r > shell ? (r - shell) * (r - shell) : -1;
    for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = (x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2;
      if (d > r2 || d < ri2) continue;
      for (let y = y0; y < y1; y++) { const v = typeof m === 'function' ? m(x, y, z) : m; if (v >= 0) this.set(x, y, z, v); }
    }
  }
  sphere(cx, cy, cz, r, m, keep = false) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 + (z + 0.5 - cz) ** 2 > r * r) continue;
      if (keep && this.get(x, y, z)) continue;
      const v = typeof m === 'function' ? m(x, y, z) : m;
      if (v >= 0) this.set(x, y, z, v);
    }
  }
  // ligne 6-connexe (un axe à la fois) : tout reste attaché
  line(x0, y0, z0, x1, y1, z1, m) {
    let x = Math.round(x0), y = Math.round(y0), z = Math.round(z0);
    const X = Math.round(x1), Y = Math.round(y1), Z = Math.round(z1);
    this.set(x, y, z, m);
    let guard = 0;
    while ((x !== X || y !== Y || z !== Z) && guard++ < 2000) {
      const dx = X - x, dy = Y - y, dz = Z - z;
      const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
      if (ax >= ay && ax >= az) x += Math.sign(dx); else if (ay >= az) y += Math.sign(dy); else z += Math.sign(dz);
      this.set(x, y, z, m);
    }
  }
  // texte plaqué sur une façade ; face = direction vers laquelle il regarde : 'S' (+z), 'N' (-z), 'E' (+x), 'W' (-x)
  text(str, x, y, z, face, m, center = true) {
    const s = String(str).toUpperCase();
    const w = s.length * 4 - 1;
    const ux = face === 'S' ? 1 : face === 'N' ? -1 : 0, uz = face === 'E' ? -1 : face === 'W' ? 1 : 0;
    let px = x - (center ? ux * Math.floor(w / 2) : 0), pz = z - (center ? uz * Math.floor(w / 2) : 0);
    for (const ch of s) {
      const g = FONT[ch] || FONT[' '];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r][c] === '1') this.set(px + ux * c, y + 4 - r, pz + uz * c, m);
      px += ux * 4; pz += uz * 4;
    }
    return w;
  }
  // repère local : u le long de l'objet, v en travers ; rot 0 : u = +x, 1 : u = +z, 2 : u = -x, 3 : u = -z
  local(ox, oz, rot) {
    const b = this;
    const T = (u, v) => rot === 0 ? [ox + u, oz + v] : rot === 1 ? [ox - v, oz + u] : rot === 2 ? [ox - u, oz - v] : [ox + v, oz - u];
    return {
      set(u, y, v, m) { const [x, z] = T(u, v); b.set(x, y, z, m); },
      get(u, y, v) { const [x, z] = T(u, v); return b.get(x, y, z); },
      fill(u0, y0, v0, u1, y1, v1, m) {
        const f = typeof m === 'function';
        for (let y = y0; y < y1; y++) for (let v = v0; v < v1; v++) for (let u = u0; u < u1; u++) {
          const mm = f ? m(u, y, v) : m;
          if (mm >= 0) { const [x, z] = T(u, v); b.set(x, y, z, mm); }
        }
      },
      T,
    };
  }

  // ---------------------------------------------------------------- bâtiments
  // facade(u, yl, f, side, len) → matière (0 = ouverture) ; sides : 0 nord (z0), 1 sud (z1-1), 2 ouest (x0), 3 est (x1-1)
  building(o) {
    const { x0, z0, x1, z1, floors, fh = 9 } = o;
    const H = floors * fh;
    const slab = o.slab ?? M.concrete, wall = o.wall ?? M.concrete;
    const fac = o.facade || winFacade(wall, o.glass ?? M.glass, o.win || {});
    for (let f = 0; f < floors; f++) {
      const yb = f * fh;
      this.fill(x0, yb, z0, x1, yb + 1, z1, f === 0 && o.floor0 ? o.floor0 : (o.floorMat ?? slab));
      if (o.edge) { this.walls(x0, z0, x1, z1, yb, yb + 1, o.edge); }
      for (let yl = 1; yl < fh; yl++) {
        const y = yb + yl;
        const lx = x1 - x0, lz = z1 - z0;
        for (let u = 0; u < lx; u++) { this.set(x0 + u, y, z0, fac(u, yl, f, 0, lx)); this.set(x0 + u, y, z1 - 1, fac(u, yl, f, 1, lx)); }
        for (let u = 1; u < lz - 1; u++) { this.set(x0, y, z0 + u, fac(u, yl, f, 2, lz)); this.set(x1 - 1, y, z0 + u, fac(u, yl, f, 3, lz)); }
      }
    }
    this.fill(x0, H, z0, x1, H + 1, z1, o.roof ?? slab);
    if (o.parapet !== 0) this.walls(x0, z0, x1, z1, H + 1, H + 1 + (o.parapet || 1), o.parapetMat ?? wall);
    if (o.interior) for (let f = 0; f < floors; f++) o.interior(f, f * fh + 1);
    if (o.stairs) this.stairs(o.stairs.x, o.stairs.z, floors, fh, o.stairs.mat ?? slab);
    for (const d of o.doors || []) this.door(o, d);
    return H;
  }
  door(o, d) {
    const { x0, z0, x1, z1 } = o;
    const h = d.h ?? 6, w = d.w ?? 4;
    if (d.side === 0 || d.side === 1) { const z = d.side === 0 ? z0 : z1 - 1; this.fill(x0 + d.u, 1, z, x0 + d.u + w, 1 + h, z + 1, d.m ?? 0); }
    else { const x = d.side === 2 ? x0 : x1 - 1; this.fill(x, 1, z0 + d.u, x + 1, 1 + h, z0 + d.u + w, d.m ?? 0); }
  }
  // escalier en va-et-vient sur deux couloirs de 2 cubes (emprise : x0-1 … x0+fh, z0 … z0+3)
  stairs(x0, z0, floors, fh, m) {
    for (let f = 0; f < floors - 1; f++) {
      const base = f * fh + 1, laneA = f % 2 === 0, zl = laneA ? z0 : z0 + 2;
      this.fill(x0 - 1, base, z0, x0 + fh + 1, base + fh - 1, z0 + 4, 0);
      for (let s = 0; s < fh; s++) {
        const x = laneA ? x0 + s : x0 + fh - 1 - s;
        this.fill(x, base, zl, x + 1, base + s + 1, zl + 2, m);
      }
      this.fill(x0, base + fh - 1, zl, x0 + fh, base + fh, zl + 2, (x, y, z) => (laneA ? x === x0 + fh - 1 : x === x0) ? m : 0);
    }
  }

  // ---------------------------------------------------------------- mobilier
  car(x, z, rot, paint, kind = '') {
    const o = this.local(x, z, rot);
    for (const [u, v] of [[1, 0], [2, 0], [8, 0], [9, 0], [1, 4], [2, 4], [8, 4], [9, 4]]) o.set(u, 0, v, M.tire);
    o.fill(0, 1, 0, 11, 3, 5, paint);
    o.set(10, 2, 0, M.lamp); o.set(10, 2, 4, M.lamp); o.set(0, 2, 0, M.plasticR); o.set(0, 2, 4, M.plasticR);
    o.fill(2, 3, 0, 9, 4, 5, M.glass); o.fill(3, 3, 1, 8, 4, 4, M.leather);
    o.fill(3, 4, 0, 8, 5, 5, paint);
    if (kind === 'taxi') o.set(5, 5, 2, M.neonY);
    if (kind === 'police') { o.set(5, 5, 1, M.neonB); o.set(5, 5, 3, M.plasticR); }
  }
  bus(x, z, rot, paint) {
    const o = this.local(x, z, rot);
    for (const u of [3, 4, 22, 23]) { o.set(u, 0, 0, M.tire); o.set(u, 0, 5, M.tire); }
    o.fill(0, 1, 0, 28, 3, 6, paint);
    o.fill(0, 3, 0, 28, 6, 6, (u, y, v) => (v === 0 || v === 5 || u === 0 || u === 27) ? (u % 4 === 0 ? paint : M.glass) : (y === 3 && u % 3 === 0 && v !== 2 && v !== 3 ? M.seatB : 0));
    o.fill(0, 6, 0, 28, 7, 6, M.carW);
    o.fill(27, 5, 1, 28, 6, 5, M.board);
  }
  tree(x, z, h = 9, r = 3.2, leaf = M.leaves) {
    this.fill(x, 0, z, x + 1, h, z + 1, M.trunk);
    this.sphere(x + 0.5, h + 0.5, z + 0.5, r, leaf, true);
    this.set(x, -1, z, M.dirt);
  }
  palm(x, z, h, R) {
    const lx = R.range(-1, 1), lz = R.range(-1, 1);
    let px = x, pz = z, py = 0;
    this.set(x, -1, z, M.sand);
    for (let y = 0; y < h; y++) {
      const k = (y / h) ** 2 * 4;
      const nx = Math.round(x + lx * k), nz = Math.round(z + lz * k);
      this.line(px, py, pz, nx, y, nz, M.palmTrunk);
      px = nx; pz = nz; py = y;
    }
    const ty = h;
    this.set(px, ty, pz, M.palm);
    this.set(px + 1, ty - 1, pz, M.coco); this.set(px - 1, ty - 1, pz, M.coco); this.set(px, ty - 1, pz + 1, M.coco);
    const n = 7, a0 = R() * 6.28;
    for (let i = 0; i < n; i++) {
      const a = a0 + i / n * 6.28, L = R.int(5, 8);
      let qx = px, qy = ty, qz = pz;
      for (let s = 1; s <= L; s++) {
        const X = px + Math.cos(a) * s, Z = pz + Math.sin(a) * s, Y = ty + 1 - (s * s) / 10;
        this.line(qx, qy, qz, X, Y, Z, M.palm);
        qx = Math.round(X); qy = Math.round(Y); qz = Math.round(Z);
      }
    }
  }
  lamp(x, z, h = 12, rot = 0) {
    this.fill(x, 0, z, x + 1, h, z + 1, M.steel);
    const o = this.local(x, z, rot);
    o.fill(1, h - 1, 0, 4, h, 1, M.steel);
    o.set(3, h - 2, 0, M.lamp);
  }
  bench(x, z, rot, m = M.wood) {
    const o = this.local(x, z, rot);
    o.set(0, 0, 0, M.steel); o.set(4, 0, 0, M.steel);
    o.fill(0, 1, 0, 5, 2, 1, m); o.fill(0, 2, 1, 5, 3, 2, m); o.set(0, 1, 1, m); o.set(4, 1, 1, m);
  }
  planter(x, z, w, d, leaf = M.hedge) {
    this.walls(x, z, x + w, z + d, 0, 2, M.concrete);
    this.fill(x + 1, 0, z + 1, x + w - 1, 2, z + d - 1, M.dirt);
    this.fill(x + 1, 2, z + 1, x + w - 1, 3, z + d - 1, leaf);
  }
  // bureau : table, écran, siège
  desk(x, z, rot) {
    const o = this.local(x, z, rot);
    o.fill(0, 0, 0, 3, 2, 2, M.woodD); o.set(1, 2, 0, M.screen); o.set(1, 0, 3, M.leather); o.set(1, 1, 3, M.leather);
  }
  shelf(x, z, len, rot, R, goods) {
    const o = this.local(x, z, rot);
    o.fill(0, 0, 0, len, 6, 1, M.plank);
    for (let y = 1; y < 6; y += 2) for (let u = 0; u < len; u++) if (R() < 0.8) o.set(u, y, 1, R.pick(goods));
    o.fill(0, 0, 1, len, 1, 2, M.plank);
  }
  seatRow(x, z, len, rot, m = M.seatB) {
    const o = this.local(x, z, rot);
    for (let u = 0; u < len; u++) { o.set(u, 0, 0, u % 4 === 3 ? M.alu : m); o.set(u, 1, 1, u % 4 === 3 ? M.alu : m); o.set(u, 0, 1, M.alu); }
  }
  table(x, z, m = M.plank, chair = M.plasticW) {
    this.set(x + 1, 0, z + 1, M.steel); this.fill(x, 1, z, x + 3, 2, z + 3, m);
    this.set(x - 1, 0, z + 1, chair); this.set(x + 3, 0, z + 1, chair);
  }
  // toit à deux pans ; faîtage le long de z (axis 'z') ou de x
  gable(x0, z0, x1, z1, y, mat, wallMat, axis = 'z') {
    const alongZ = axis === 'z';
    const a0 = alongZ ? x0 : z0, a1 = alongZ ? x1 : z1, b0 = alongZ ? z0 : x0, b1 = alongZ ? z1 : x1;
    const put = (a, yy, bb, m) => alongZ ? this.set(a, yy, bb, m) : this.set(bb, yy, a, m);
    for (let k = 0; ; k++) {
      const l = a0 - 1 + k, r = a1 - k;
      if (l > r) break;
      for (let bb = b0 - 1; bb <= b1; bb++) { put(l, y + k, bb, mat); put(l + 1, y + k, bb, mat); put(r, y + k, bb, mat); put(r - 1, y + k, bb, mat); }
      for (let a = l + 2; a < r - 1; a++) { put(a, y + k, b0, wallMat); put(a, y + k, b1 - 1, wallMat); }
      if (r - l <= 3) break;
    }
  }
  // toit en croupe creux (anneaux de 2, qui se chevauchent)
  hip(x0, z0, x1, z1, y, layers, mat) {
    for (let k = 0; k < layers; k++) {
      const a = x0 - 1 + k, b = x1 + 1 - k, c = z0 - 1 + k, d = z1 + 1 - k;
      if (b - a < 3 || d - c < 3) { this.fill(a, y + k, c, b, y + k + 1, d, mat); return; }
      this.walls(a, c, b, d, y + k, y + k + 1, mat); this.walls(a + 1, c + 1, b - 1, d - 1, y + k, y + k + 1, mat);
    }
    this.fill(x0 - 1 + layers, y + layers, z0 - 1 + layers, x1 + 1 - layers, y + layers + 1, z1 + 1 - layers, mat);
  }
  // remblai sous une emprise : on comble jusqu'au terrain
  foundation(x0, z0, x1, z1, m) {
    for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) for (let y = -1; y > -GROUND; y--) { if (this.get(x, y, z)) break; this.set(x, y, z, m); }
  }
  // pieux jusqu'au fond (sol ou fond marin)
  stilt(x, z, yTop, m) {
    for (let y = yTop; y > -GROUND; y--) { if (this.get(x, y, z) && y < yTop) break; this.set(x, y, z, m); }
  }
  // escalier droit (plein dessous) qui monte de h marches le long de +x (rot du repère local)
  flight(x, z, rot, h, w, m, y0 = 0) {
    const o = this.local(x, z, rot);
    for (let s = 0; s < h; s++) o.fill(s, y0, 0, s + 1, y0 + s + 1, w, m);
  }
  // conteneur de 6 m (15 cubes) couché le long de u
  container(x, z, y, rot, m, len = 15) {
    const o = this.local(x, z, rot);
    // coque creuse : parois nervurées, plancher, toit
    o.fill(0, y, 0, len, y + 6, 6, (u, yy, v) => {
      const edge = u === 0 || u === len - 1 || v === 0 || v === 5 || yy === y || yy === y + 5;
      if (!edge) return 0;
      return (u === 0 || u === len - 1) ? (v === 2 || v === 3 ? M.steel : m) : (u % 2 === 0 && (v === 0 || v === 5)) ? M.steel : m;
    });
  }
  hydrant(x, z) { this.set(x, 0, z, M.plasticR); this.set(x, 1, z, M.plasticR); }
  trafficLight(x, z, rot) {
    this.fill(x, 0, z, x + 1, 9, z + 1, M.steel);
    const o = this.local(x, z, rot);
    o.fill(1, 6, 0, 2, 9, 1, M.plasticK); o.set(1, 8, -1, M.neonP); o.set(1, 7, -1, M.neonY); o.set(1, 6, -1, M.neonG);
  }
}

// façade à fenêtres régulières
export function winFacade(wall, glass, { period = 5, ww = 3, sill = 2, wh = 4, off = 1, band = null } = {}) {
  return (u, yl, f, side, len) => {
    if (u === 0 || u === len - 1) return wall;
    if (band && yl === 1) return band;
    const k = (u - off) % period;
    return k >= 0 && k < ww && yl >= sill && yl < sill + wh && u > 1 && u < len - 2 ? glass : wall;
  };
}

// sol : roche-mère, roche, argile, terre, puis le revêtement
export function baseGround(W, topFn, sub = null) {
  const { sx, sz, sxz, data } = W;
  for (let z = 0; z < sz; z++) for (let x = 0; x < sx; x++) {
    const [h, m] = topFn(x, z);
    const c = x + z * sx;
    data[c] = M.bedrock;
    for (let y = 1; y <= h; y++) {
      const d = h - y;
      data[c + y * sxz] = d === 0 ? m : sub ? sub(d, y, m) : y <= 3 ? M.rock : d <= 2 ? (m === M.sand || m === M.wetsand ? M.sand : M.dirt) : M.clay;
    }
  }
}
