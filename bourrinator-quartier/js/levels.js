// Les quatre terrains de jeu, construits cube par cube (coordonnées en cubes, y au-dessus du sol).
import { M, GROUND, VS } from './voxel.js';
import { Builder, baseGround, winFacade, rng } from './build.js';
import { LEVELS2 } from './levels2.js';

const CARS = [M.carR, M.carB, M.carW, M.carK, M.carG, M.carW, M.carR];

// ======================================================================== QUARTIER D'AFFAIRES
function affaires(W) {
  const b = new Builder(W), R = rng(1789);
  const SX = [138, 162], SZ = [138, 162];
  baseGround(W, (x, z) => {
    const inX = x >= SX[0] && x < SX[1], inZ = z >= SZ[0] && z < SZ[1];
    const wX = x >= 130 && x < 170, wZ = z >= 130 && z < 170;
    if (inX || inZ) {
      // passages piétons autour du carrefour
      if (inX && !inZ && ((z >= 130 && z < 137) || (z >= 163 && z < 170))) return [9, (x - 138) % 4 < 2 ? M.lineW : M.asphalt];
      if (inZ && !inX && ((x >= 130 && x < 137) || (x >= 163 && x < 170))) return [9, (z - 138) % 4 < 2 ? M.lineW : M.asphalt];
      if (inX && !inZ && (x === 149 || x === 150) && z % 12 < 6) return [9, M.lineW];
      if (inZ && !inX && (z === 149 || z === 150) && x % 12 < 6) return [9, M.lineW];
      return [9, M.asphalt];
    }
    if ((wX && (x === 137 || x === 162)) || (wZ && (z === 137 || z === 162))) return [9, M.curb];
    return [9, M.sidewalk];
  });

  // ---------- îlot nord-ouest : les tours
  b.top(10, 64, 64, 126, M.grass);
  const towerA = { x0: 70, z0: 70, x1: 110, z1: 110, floors: 12, fh: 9, slab: M.concrete, roof: M.concreteD, parapet: 2, parapetMat: M.steelB,
    floor0: M.marble,
    facade: (u, yl, f, side, len) => (u === 0 || u === len - 1) ? M.steelB : yl === 1 && f > 0 ? M.concreteD : u % 4 === 0 ? M.steelB : M.glassB,
    stairs: { x: 85, z: 86 },
    doors: [{ side: 1, u: 17, w: 6, h: 6 }, { side: 3, u: 17, w: 6, h: 6 }, { side: 0, u: 17, w: 6, h: 6 }],
    interior: (f, y) => {
      b.walls(83, 84, 97, 92, y, y + 8, M.concrete);
      b.fill(89, y, 91, 92, y + 6, 92, 0);
      if (f === 0) {
        b.fill(76, y, 96, 90, y + 3, 99, M.marble); b.fill(76, y + 3, 96, 90, y + 4, 99, M.marbleK);
        b.set(80, y + 4, 97, M.screen); b.set(86, y + 4, 97, M.screen);
        b.planter(72, 102, 4, 4, M.hedge); b.planter(104, 102, 4, 4, M.hedge);
        b.fill(72, y, 72, 108, y + 1, 74, M.carpetR);
        return;
      }
      for (let x = 72; x < 106; x += 6) for (let z = 72; z < 106; z += 7) {
        if (x > 78 && x < 99 && z > 79 && z < 95) continue;
        b.desk(x, z, 0);
      }
      if (f === 11) { b.fill(92, y, 72, 106, y + 1, 80, M.carpetR); b.fill(96, y, 74, 104, y + 2, 77, M.woodD); b.fill(97, y + 2, 74, 103, y + 3, 75, M.gold); }
    },
  };
  const HA = b.building(towerA);
  b.fill(89, HA + 1, 89, 90, HA + 9, 90, M.steel); b.set(89, HA + 9, 89, M.neonP);
  b.text('POGNON', 90, 96, 110, 'S', M.neonB);

  b.building({ x0: 14, z0: 12, x1: 50, z1: 60, floors: 8, fh: 9, wall: M.concrete, parapet: 1,
    facade: (u, yl, f, side, len) => (u === 0 || u === len - 1 || yl === 1 || yl === 8 || u % 6 === 0) ? M.concrete : M.glassG,
    stairs: { x: 17, z: 15 },
    doors: [{ side: 1, u: 15, w: 5 }, { side: 3, u: 20, w: 5 }],
    interior: (f, y) => { for (let x = 30; x < 46; x += 6) for (let z = 16; z < 56; z += 7) b.desk(x, z, 1); },
  });
  b.text('DIVIDENDE', 32, 62, 60, 'S', M.neonG);

  // parvis : sculpture, arbres, bancs
  for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283; b.fill(Math.round(38 + Math.cos(t) * 8), Math.round(8 + Math.sin(t) * 8), 95, Math.round(38 + Math.cos(t) * 8) + 2, Math.round(8 + Math.sin(t) * 8) + 2, 97, M.plasticR); }
  b.fill(36, 0, 94, 41, 1, 98, M.stone);
  for (const [x, z] of [[18, 72], [18, 90], [18, 108], [58, 72], [58, 118], [30, 120], [46, 120]]) b.tree(x, z, 10, 3.5);
  for (const [x, z] of [[24, 80], [24, 100], [50, 80], [50, 100]]) b.bench(x, z, 1);
  for (let x = 16; x < 62; x += 3) b.set(x, 0, 66, M.hedge);

  // ---------- îlot nord-est : la banque
  const bank = { x0: 185, z0: 40, x1: 285, z1: 112, floors: 2, fh: 12, wall: M.stone, floor0: M.marble, slab: M.concrete, roof: M.stone, parapet: 2,
    facade: (u, yl, f, side, len) => {
      if (u === 0 || u === len - 1) return M.stone;
      if (yl === 1) return M.granite;
      return (u % 10 >= 4 && u % 10 < 7 && yl >= 3 && yl < 10 && u > 3 && u < len - 4) ? M.glass : M.stone;
    },
    stairs: { x: 190, z: 45 },
    doors: [{ side: 1, u: 44, w: 12, h: 9 }],
    interior: (f, y) => {
      if (f === 0) {
        // guichets
        b.fill(195, y, 72, 276, y + 3, 75, M.marble);
        b.fill(195, y + 3, 74, 276, y + 6, 75, (x) => x % 6 === 0 ? M.bronze : M.glass);
        for (let x = 198; x < 276; x += 9) { b.set(x, y + 3, 72, M.screen); b.set(x, y, 70, M.leather); b.set(x, y + 1, 69, M.leather); }
        b.fill(228, y - 1, 76, 242, y, 111, M.carpetR);
        for (const z of [84, 92, 100]) { b.bench(214, z, 0, M.woodD); b.bench(250, z, 0, M.woodD); }
        // lustre
        b.fill(234, y + 8, 92, 235, y + 11, 93, M.bronze);
        b.sphere(234.5, y + 7, 92.5, 2.4, (x, yy, z) => (x + z + yy) % 2 ? M.lamp : M.bronze);
        // la chambre forte
        b.walls(208, 44, 262, 66, y, y + 10, M.vault); b.walls(209, 45, 261, 65, y, y + 10, M.vault);
        b.fill(208, y + 10, 44, 262, y + 11, 66, M.vault);
        b.fill(232, y, 64, 238, y + 7, 66, 0);
        b.fill(238, y, 66, 240, y + 7, 72, M.vault);
        b.set(239, y + 3, 72, M.bronze); b.set(239, y + 4, 72, M.bronze);
        for (let x = 212; x < 258; x += 4) for (let z = 48; z < 62; z += 5) {
          if (x > 228 && x < 242 && z > 55) continue;
          const gold = (x + z) % 3 !== 0;
          b.fill(x, y, z, x + 3, y + (gold ? 2 : 3), z + 3, gold ? M.gold : M.bills);
        }
      } else {
        for (let x = 200; x < 280; x += 7) for (let z = 50; z < 106; z += 8) b.desk(x, z, 0);
      }
    },
  };
  b.building(bank);
  // portique à colonnes et fronton
  b.fill(186, 0, 112, 284, 1, 127, M.stone);
  for (let x = 192; x <= 278; x += 12) b.cyl(x + 0.5, 121.5, 1.8, 1, 24, M.stone);
  b.fill(186, 24, 112, 284, 31, 124, M.stone);
  for (let k = 0; k < 14; k++) b.fill(188 + k * 3, 31 + k, 112, 282 - k * 3, 32 + k, 124, M.stone);
  b.text('BANQUE DU POGNON', 235, 25, 124, 'S', M.gold);
  b.fill(186, -1, 127, 284, 0, 128, M.granite);
  // parking de la banque
  b.top(176, 4, 296, 34, M.asphalt);
  for (let x = 180; x < 292; x += 12) { b.fill(x, -1, 6, x + 1, 0, 18, M.lineW); if (R() < 0.75) b.car(x + 8, 6, 1, R.pick(CARS)); }
  for (let x = 180; x < 292; x += 14) b.tree(x, 28, 8, 3);

  // ---------- îlot sud-ouest : boutiques et bureaux
  const SHOPS = [
    { name: 'PAIN', awn: M.awnR, wall: M.plasterC, goods: [M.goodsY, M.fruitO, M.coco] },
    { name: 'BIJOU', awn: M.awnB, wall: M.plasterW, goods: [M.gold] },
    { name: 'HIFI', awn: M.awnG, wall: M.plasterB, goods: [M.screen, M.plasticK] },
    { name: 'MODE', awn: M.awnR, wall: M.plasterP, goods: [M.goodsR, M.goodsB, M.goodsG, M.goodsY] },
    { name: 'CAFE', awn: M.awnG, wall: M.plasterO, goods: [M.bottle] },
  ];
  SHOPS.forEach((S, i) => {
    const x0 = 8 + i * 23, x1 = x0 + 22, z0 = 172, z1 = 196;
    b.building({ x0, z0, x1, z1, floors: 3, fh: 10, wall: S.wall, roof: M.zinc, parapet: 1,
      facade: (u, yl, f, side, len) => {
        if (u === 0 || u === len - 1) return S.wall;
        if (f === 0 && side === 0) return yl >= 7 ? S.wall : (u >= 9 && u < 13 && yl < 6) ? 0 : M.glass;
        return (u % 5 >= 1 && u % 5 < 4 && yl >= 3 && yl < 7) ? M.glass : S.wall;
      },
      stairs: { x: x0 + 3, z: 190 },
      interior: (f, y) => {
        if (f !== 0) { b.fill(x0 + 3, y, z0 + 3, x0 + 8, y + 2, z0 + 5, M.seatO); b.set(x1 - 4, y + 1, z0 + 2, M.screen); b.fill(x1 - 5, y, z0 + 2, x1 - 3, y + 1, z0 + 3, M.woodD); return; }
        if (S.name === 'CAFE') {
          b.fill(x0 + 2, y, z0 + 11, x1 - 2, y + 3, z0 + 13, M.woodD);
          b.shelf(x0 + 2, z0 + 15, 18, 0, R, [M.bottle, M.bottle, M.goodsY]);
          for (const [tx, tz] of [[x0 + 3, z0 + 4], [x0 + 10, z0 + 4], [x0 + 16, z0 + 8]]) b.table(tx, tz);
        } else if (S.name === 'BIJOU') {
          for (const tx of [x0 + 3, x0 + 12]) { b.fill(tx, y, z0 + 6, tx + 6, y + 2, z0 + 9, M.woodD); b.fill(tx, y + 2, z0 + 6, tx + 6, y + 3, z0 + 9, M.glass); for (let k = 0; k < 4; k++) b.set(tx + 1 + k, y + 2, z0 + 7, k % 2 ? M.gold : M.marble); }
          b.fill(x1 - 6, y, z0 + 12, x1 - 2, y + 5, z0 + 16, M.vault); b.fill(x1 - 5, y + 1, z0 + 13, x1 - 3, y + 3, z0 + 15, M.gold);
        } else {
          b.shelf(x0 + 2, z0 + 14, 12, 0, R, S.goods);
          b.shelf(x0 + 2, z0 + 9, 12, 0, R, S.goods);
          b.fill(x1 - 6, y, z0 + 4, x1 - 2, y + 3, z0 + 7, M.woodD); b.set(x1 - 4, y + 3, z0 + 5, M.screen);
        }
      },
    });
    b.fill(x0, 5, 168, x1, 7, 172, (x) => (x - x0) % 4 < 2 ? S.awn : M.awnW);
    b.text(S.name, x0 + 11, 7, 171, 'N', i % 2 ? M.neonY : M.neonP);
  });
  b.top(8, 204, 124, 240, M.asphalt);
  for (let x = 10; x < 124; x += 12) { b.fill(x, -1, 206, x + 1, 0, 218, M.lineW); b.fill(x, -1, 226, x + 1, 0, 238, M.lineW); if (R() < 0.7) b.car(x + 8, 206, 1, R.pick(CARS)); if (R() < 0.6) b.car(x + 8, 227, 1, R.pick(CARS)); }
  b.building({ x0: 14, z0: 248, x1: 72, z1: 292, floors: 6, fh: 9, wall: M.brick, parapet: 1, stairs: { x: 18, z: 252 },
    win: { period: 6, ww: 3, sill: 2, wh: 4, off: 2 }, glass: M.glass, doors: [{ side: 0, u: 26, w: 5 }],
    interior: (f, y) => { for (let x = 30; x < 68; x += 7) for (let z = 256; z < 288; z += 8) b.desk(x, z, 1); } });
  b.text('ASSURANCES', 43, 48, 247, 'N', M.signB);
  for (const [x, z] of [[90, 260], [110, 260], [90, 285], [110, 285]]) b.tree(x, z, 9, 3.4);
  b.top(80, 250, 124, 296, M.grass);

  // ---------- îlot sud-est : place à fontaine et hôtel
  b.fill(172, -1, 172, 248, 0, 298, (x, y, z) => ((x + z) % 2 ? M.sidewalk : M.granite));
  b.cyl(210, 235, 12.5, 0, 2, M.stone, 1.6);
  b.cyl(210, 235, 11, 0, 1, M.water);
  b.cyl(210, 235, 2, 0, 7, M.stone);
  b.cyl(210, 235, 4.2, 7, 8, M.stone); b.cyl(210, 235, 3, 8, 9, M.water);
  for (let a = 0; a < 8; a++) { const t = a / 8 * 6.283; b.tree(Math.round(210 + Math.cos(t) * 24), Math.round(235 + Math.sin(t) * 24), 9, 3.2); }
  for (let a = 0; a < 8; a++) { const t = (a + 0.5) / 8 * 6.283; b.bench(Math.round(208 + Math.cos(t) * 18), Math.round(235 + Math.sin(t) * 18), a % 2 ? 0 : 1); }
  // kiosque à journaux
  b.fill(178, 0, 178, 188, 6, 186, (x, y, z) => (y === 5 ? M.carG : (x === 178 || x === 187 || z === 178 || z === 185) ? (y > 1 && y < 4 && z === 185 ? 0 : M.carG) : (y === 0 ? M.plank : 0)));
  b.fill(179, 1, 180, 187, 3, 182, (x) => R.pick([M.goodsR, M.goodsB, M.goodsY]));
  b.fill(177, 6, 177, 189, 7, 187, M.carG);
  // abribus
  b.fill(206, 0, 168, 220, 6, 169, (x, y) => (x === 206 || x === 219) ? M.steel : y > 0 ? M.glass : M.steel);
  b.fill(206, 6, 165, 220, 7, 169, M.steel); b.bench(210, 166, 0, M.plasticK);
  // hôtel
  b.building({ x0: 252, z0: 176, x1: 296, z1: 294, floors: 7, fh: 9, wall: M.plasterC, parapet: 1,
    win: { period: 6, ww: 3, sill: 2, wh: 5, off: 2 }, stairs: { x: 256, z: 180 },
    doors: [{ side: 2, u: 55, w: 6, h: 6 }],
    interior: (f, y) => {
      if (f === 0) { b.fill(254, y - 1, 200, 294, y, 270, M.carpetR); b.fill(270, y, 225, 282, y + 3, 229, M.woodD); b.sphere(276.5, y + 6, 240.5, 2, M.lamp); b.fill(276, y + 7, 240, 277, y + 8, 241, M.bronze); return; }
      for (let z = 190; z < 290; z += 12) { b.walls(254, z, 294, z + 1, y, y + 8, M.plasterW); b.fill(262, y, z + 3, 268, y + 1, z + 7, M.carpetB); b.fill(262, y + 1, z + 3, 268, y + 2, z + 7, M.plasticW); b.set(284, y + 1, z + 5, M.screen); }
    } });
  for (let f = 1; f < 7; f++) b.fill(251, f * 9, 180, 252, f * 9 + 3, 290, (x, y, z) => (y === f * 9 || y === f * 9 + 2 || z % 3 === 0) ? M.steel : -1);
  b.text('HOTEL', 251, 58, 235, 'W', M.neonP);
  b.fill(246, 6, 226, 252, 7, 238, M.carpetR);

  // ---------- la rue
  for (let k = 0; k < 300; k += 24) {
    for (const [x, z, rot] of [[133, k + 6, 1], [166, k + 18, 3]]) if (z < 128 || z > 172) b.lamp(x, z, 12, rot === 1 ? 0 : 2);
    for (const [x, z, rot] of [[k + 6, 133, 0], [k + 18, 166, 2]]) if (x < 128 || x > 172) b.lamp(x, z, 12, rot === 0 ? 1 : 3);
    if (k + 16 < 126 || k + 16 > 174) { b.tree(132, k + 16, 9, 2.8); b.tree(167, k + 4, 9, 2.8); b.tree(k + 16, 132, 9, 2.8); b.tree(k + 4, 167, 9, 2.8); }
  }
  for (let z = 4; z < 296; z += 15) if (z < 118 || z > 170) { if (R() < 0.7) b.car(143, z, 1, R.pick(CARS), R() < 0.2 ? 'taxi' : ''); if (R() < 0.6) b.car(156, z + 11, 3, R.pick(CARS), R() < 0.15 ? 'police' : ''); }
  for (let x = 4; x < 296; x += 15) if (x < 118 || x > 170) { if (R() < 0.7) b.car(x + 11, 143, 2, R.pick(CARS)); if (R() < 0.6) b.car(x, 156, 0, R.pick(CARS), R() < 0.2 ? 'taxi' : ''); }
  b.bus(60, 147, 0, M.carG);
  b.car(144, 145, 1, M.carY, 'taxi'); b.car(152, 168, 3, M.carW, 'police');
  for (const [x, z, r] of [[136, 136, 0], [163, 136, 1], [136, 163, 3], [163, 163, 2]]) b.trafficLight(x, z, r);
  for (const [x, z] of [[131, 60], [168, 220], [60, 131], [220, 168]]) b.hydrant(x, z);

  return {
    spawn: { x: 150, z: 184, yaw: 0.25 },
    cam: { x: 172, y: 28, z: 196, tx: 110, ty: 16, tz: 120 },
  };
}

// ======================================================================== AÉROPORT
function plane(b, cx, nz, o = {}) {
  const L = o.L ?? 92, Rr = o.R ?? 6, CY = o.cy ?? 9, span = o.span ?? 42;
  const main = o.main ?? M.planeW, stripe = o.stripe ?? M.planeB, tail = o.tail ?? M.planeR, belly = o.belly ?? M.planeG;
  const lo = b.local(cx, nz, 1);
  const tailLen = Math.round(L * 0.24), noseLen = Math.round(L * 0.15);
  const rad = (u) => u < noseLen ? 1.5 + (Rr - 1.5) * Math.sqrt(u / noseLen) : u > L - tailLen ? Rr * (1 - (u - (L - tailLen)) / tailLen) + 1.2 * ((u - (L - tailLen)) / tailLen) : Rr;
  const cyu = (u) => u > L - tailLen ? CY + (u - (L - tailLen)) / tailLen * (Rr * 0.6) : CY;
  for (let u = 0; u < L; u++) {
    const r = rad(u), c = cyu(u), ri = Math.max(0, r - 1.25);
    for (let v = -Rr - 1; v <= Rr + 1; v++) for (let y = Math.floor(c - r - 1); y <= Math.ceil(c + r + 1); y++) {
      const d = Math.hypot(v, y + 0.5 - c);
      if (d > r) continue;
      if (d >= ri) {
        let m = main;
        if (y + 0.5 < c - 2) m = belly; else if (y + 0.5 < c - 0.6) m = stripe;
        if (Math.abs(y + 0.5 - (c + 1.5)) < 0.6 && u > noseLen + 2 && u < L - tailLen - 2 && u % 2 === 0 && Math.abs(v) > r - 1.6) m = M.glass;
        if (u >= Math.round(noseLen * 0.35) && u < noseLen && y + 0.5 > c + 0.5 && y + 0.5 < c + 2.8 && Math.abs(v) < r - 0.3) m = M.glass;
        lo.set(u, y, v, m);
      } else if (Math.abs(y + 0.5 - (c - 2.5)) < 0.5 && u > noseLen && u < L - tailLen) lo.set(u, y, v, belly);
      else if (Math.abs(y + 0.5 - (c - 1.5)) < 0.5 && u > noseLen + 3 && u < L - tailLen - 2 && u % 3 === 0 && Math.abs(v) > 1 && Math.abs(v) < r - 1.5) lo.set(u, y, v, o.seat ?? M.seatB);
    }
  }
  // ailes (2 d'épaisseur pour rester soudées malgré le dièdre)
  const w0 = Math.round(L * 0.37), chord0 = Math.round(L * 0.24);
  const wingY = (av) => Math.round(CY - Rr * 0.5 + (av - Rr) * 0.08);
  for (let av = 2; av <= span; av++) {
    const us = w0 + Math.round(Math.max(0, av - Rr) * 0.55), ch = Math.max(5, chord0 - Math.round(Math.max(0, av - Rr) * 0.42));
    const y = wingY(av);
    for (const s of [-1, 1]) {
      lo.fill(us, y, s * av, us + ch, y + 2, s * av + 1, av > span - 2 ? tail : main);
      if (av === span) lo.fill(us + ch - 4, y + 2, s * av, us + ch, y + 6, s * av + 1, tail);
    }
  }
  // réacteurs
  if (!o.prop) for (const s of [-1, 1]) {
    const av = Math.round(span * 0.38), us = w0 + Math.round((av - Rr) * 0.55) - 6, ey = wingY(av) - 3;
    for (let u = us; u < us + 13; u++) for (let dv = -3; dv <= 3; dv++) for (let dy = -3; dy <= 3; dy++) {
      if (dv * dv + dy * dy > 7.5) continue;
      lo.set(u, ey + dy, s * av + dv, u === us ? M.plasticK : M.planeG);
    }
    lo.fill(us + 4, ey + 2, s * av, us + 11, wingY(av) + 1, s * av + 1, M.planeG);
  } else {
    lo.fill(-1, CY - 3, 0, 0, CY + 4, 1, M.plasticK); lo.fill(-1, CY, -3, 0, CY + 1, 4, M.plasticK);
  }
  // empennage
  const tu = L - tailLen, tc = cyu(L - 4);
  for (let av = 0; av <= Math.round(span * 0.36); av++) {
    const us = L - 14 + Math.round(av * 0.4);
    for (const s of [-1, 1]) lo.fill(us, Math.round(tc) - 1, s * av, Math.min(L, us + 9 - Math.round(av * 0.2)), Math.round(tc) + 1, s * av + 1, main);
  }
  for (let h = 0; h < Math.round(Rr * 3.2); h++) {
    const us = L - 18 + Math.round(h * 0.7), ue = Math.min(L, L - 3 + Math.round(h * 0.2));
    lo.fill(us, Math.round(tc) + h, 0, ue, Math.round(tc) + h + 1, 1, tail);
  }
  // trains d'atterrissage
  const belly0 = Math.floor(CY - Rr);
  lo.fill(Math.round(noseLen * 0.6), 0, -1, Math.round(noseLen * 0.6) + 2, 1, 2, M.tire);
  lo.fill(Math.round(noseLen * 0.6), 1, 0, Math.round(noseLen * 0.6) + 1, belly0 + 1, 1, M.steel);
  for (const s of [-1, 1]) {
    const u = w0 + Math.round(chord0 * 0.5);
    lo.fill(u, 0, s * 3 - 1, u + 3, 2, s * 3 + 1, M.tire);
    lo.fill(u + 1, 2, s * 3, u + 2, belly0 + 2, s * 3 + 1, M.steel);
  }
}

function aeroport(W) {
  const b = new Builder(W), R = rng(1969);
  baseGround(W, (x, z) => {
    if (z < 36) return [9, z >= 20 && z < 34 ? ((z === 26 || z === 27) && x % 12 < 6 ? M.lineW : M.asphalt) : M.asphalt];
    if (z < 112) return [9, M.sidewalk];
    if (z >= 272 && z < 280) return [9, M.grass];
    if (z >= 280 && z < 316) {
      if ((z === 297 || z === 298) && x % 20 < 10) return [9, M.lineW];
      if (x > 6 && x < 30 && (z - 282) % 5 < 3 && z < 314) return [9, M.lineW];
      return [9, M.asphalt];
    }
    if (z >= 316) return [9, M.grass];
    if ((x === 200 || x === 201 || x === 290 || x === 291) && z < 260) return [9, M.lineY];
    if ((z === 258 || z === 259) && x > 20) return [9, M.lineY];
    return [9, M.tarmac];
  });

  // ---------- l'aérogare
  const T = { x0: 40, z0: 40, x1: 320, z1: 110, floors: 1, fh: 22, floor0: M.marble, roof: M.steelB, parapet: 1, parapetMat: M.steelB,
    facade: (u, yl, f, side, len) => {
      if (u === 0 || u === len - 1) return M.concrete;
      if (side === 1) return u % 5 === 0 || yl === 21 ? M.steel : M.glass;
      if (side === 0) { if (u % 30 >= 12 && u % 30 < 18 && yl < 7) return 0; return u % 6 === 0 || yl === 8 || yl === 21 ? M.steel : M.glass; }
      return yl % 7 === 0 ? M.concreteD : (u % 8 < 4 && yl > 2) ? M.glass : M.concrete;
    },
    interior: (f, y) => {
      // enregistrement
      b.fill(42, y, 58, 125, y + 14, 59, M.plasterW);
      b.text('ENREGISTREMENT', 84, y + 8, 59, 'S', M.signB);
      for (let i = 0; i < 8; i++) {
        const cx = 46 + i * 10;
        b.fill(cx, y, 64, cx + 6, y + 3, 67, M.plasticW); b.set(cx + 2, y + 3, 65, M.screen);
        b.fill(cx, y, 60, cx + 8, y + 1, 63, M.belt);
      }
      for (let x = 48; x < 120; x += 6) for (let z = 72; z <= 86; z += 7) { b.fill(x, y, z, x + 1, y + 3, z + 1, M.alu); if (x + 6 < 120) b.fill(x + 1, y + 2, z, x + 6, y + 3, z + 1, M.plasticR); }
      for (let k = 0; k < 26; k++) { const x = R.int(46, 120), z = R.int(88, 104), m = R.pick([M.bagR, M.bagB, M.bagK, M.bagY]); b.fill(x, y, z, x + 2, y + 2, z + 1, m); }
      b.fill(70, y + 11, 90, 100, y + 17, 91, (x, yy) => (x === 70 || x === 99 || yy === y + 11 || yy === y + 16) ? M.plasticK : M.board);
      b.fill(72, y + 17, 90, 73, y + 21, 91, M.steel); b.fill(97, y + 17, 90, 98, y + 21, 91, M.steel);
      // sûreté
      b.fill(150, y, 41, 151, y + 10, 109, (x, yy, z) => ([54, 55, 56, 69, 70, 71, 84, 85, 86, 99, 100, 101].includes(z) && yy < y + 7) ? 0 : M.glass);
      b.fill(150, y + 10, 41, 151, y + 12, 109, M.steel);
      for (const z0 of [54, 69, 84, 99]) {
        b.fill(150, y, z0 - 1, 151, y + 7, z0, M.plasticG); b.fill(150, y, z0 + 3, 151, y + 7, z0 + 4, M.plasticG); b.fill(150, y + 7, z0 - 1, 151, y + 8, z0 + 4, M.plasticG);
        b.fill(134, y, z0, 148, y + 2, z0 + 3, M.belt);
        b.fill(139, y + 2, z0 - 1, 144, y + 5, z0 + 4, M.plasticG); b.set(141, y + 5, z0 + 1, M.screen);
        for (let x = 134; x < 139; x += 2) b.set(x, y + 2, z0 + 1, R.pick([M.bagK, M.plasticG, M.bagR]));
      }
      b.fill(150, y + 12, 44, 151, y + 13, 76, M.steel);
      b.fill(150, y + 13, 44, 151, y + 20, 76, M.plasticW);
      b.fill(150, y + 20, 50, 151, y + 21, 51, M.steel); b.fill(150, y + 20, 70, 151, y + 21, 71, M.steel);
      b.text('SECURITE', 151, y + 14, 60, 'E', M.signR);
      // salle d'embarquement
      b.fill(172, y - 1, 58, 316, y, 100, M.carpetB);
      for (let z = 62; z < 98; z += 7) for (let x = 176; x < 312; x += 16) { b.seatRow(x, z, 12, 0, M.seatB); b.seatRow(x + 11, z + 3, 12, 2, M.seatB); }
      b.walls(180, 42, 216, 57, y, y + 8, M.glass); b.fill(195, y, 56, 200, y + 6, 57, 0);
      b.fill(181, y + 8, 43, 215, y + 9, 56, M.plasterW);
      b.shelf(182, 44, 32, 0, R, [M.bottle, M.goodsR, M.goodsY, M.gold]);
      b.shelf(182, 50, 12, 0, R, [M.bottle, M.goodsB]);
      b.fill(180, y + 8, 56, 216, y + 14, 57, M.plasterW);
      b.text('DUTY FREE', 198, y + 9, 57, 'S', M.neonP);
      b.fill(272, y, 44, 314, y + 3, 47, M.woodD); b.shelf(274, 42, 38, 0, R, [M.bottle, M.plasticW]);
      for (let x = 276; x < 312; x += 8) b.table(x, 50);
      b.text('CAFE', 293, y + 10, 41, 'S', M.neonY);
      for (const gx of [190, 270]) { b.fill(gx, y, 100, gx + 8, y + 3, 103, M.plasticW); b.set(gx + 3, y + 3, 101, M.screen); b.fill(gx, y + 12, 104, gx + 12, y + 16, 105, M.board); b.fill(gx + 5, y + 16, 104, gx + 6, y + 21, 105, M.steel); }
      // piliers
      for (let x = 60; x < 320; x += 40) for (const z of [60, 90]) b.fill(x, y, z, x + 2, y + 21, z + 2, M.concrete);
    },
  };
  b.building(T);
  for (let x = 50; x < 318; x += 20) b.fill(x, 22, 48, x + 8, 23, 104, M.glass);
  b.text('AEROPORT', 180, 14, 39, 'N', M.neonB);
  b.text('BOURRIN AIR', 180, 14, 110, 'S', M.neonP);
  b.fill(40, 23, 40, 320, 24, 41, M.steelB);

  // passerelles
  for (const [bx, cx] of [[190, 215], [270, 295]]) {
    b.fill(bx, 5, 110, bx + 7, 12, 150, (x, y, z) => (y === 5 || y === 11) ? M.alu : (x === bx || x === bx + 6) ? (y > 7 && y < 10 && z % 3 ? M.glass : M.alu) : 0);
    b.fill(bx, 5, 150, cx - 6, 12, 157, (x, y, z) => (y === 5 || y === 11) ? M.alu : (z === 150 || z === 156) ? (y > 7 && y < 10 && x % 3 ? M.glass : M.alu) : 0);
    b.fill(bx + 2, 0, 138, bx + 5, 5, 140, M.steel); b.fill(bx + 1, 0, 137, bx + 6, 1, 141, M.tire);
  }
  // avions
  plane(b, 215, 146, { stripe: M.planeB, tail: M.planeR });
  plane(b, 300, 146, { stripe: M.planeR, tail: M.planeB, seat: M.seatO });
  // hangar et petit avion
  b.fill(4, 0, 150, 66, 32, 232, (x, y, z) => {
    const d = Math.hypot((x + 0.5 - 35) / 31, (y + 0.5) / 30);
    if (d <= 1 && d > 0.95) return (z % 10 === 0 ? M.steelB : M.zinc);
    if (z === 231 && d <= 0.95) return M.zinc;
    return -1;
  });
  plane(b, 35, 168, { L: 30, R: 2, cy: 4, span: 18, main: M.planeW, stripe: M.planeR, tail: M.planeR, prop: true, seat: M.leather });
  b.text('HANGAR 1', 35, 10, 230, 'N', M.lineY);
  // tour de contrôle
  b.cyl(100, 160, 5, 0, 62, M.concrete, 1.4);
  b.fill(98, 0, 164, 102, 6, 166, 0);
  b.cyl(100, 160, 9, 62, 63, M.concrete);
  b.cyl(100, 160, 9, 63, 70, (x, y, z) => ((x + z) % 5 === 0 ? M.steel : M.glassB), 1.2);
  b.cyl(100, 160, 7, 63, 64, M.plasticK, 1.2); b.cyl(100, 160, 7, 64, 65, M.screen, 1.2);
  b.cyl(100, 160, 9.6, 70, 71, M.concreteD);
  b.fill(100, 71, 160, 101, 78, 161, M.steel); b.set(100, 78, 160, M.neonP);
  // véhicules de piste
  b.car(236, 168, 1, M.carY);
  for (let k = 0; k < 3; k++) {
    const z = 181 + k * 9;
    b.fill(237, 0, z, 241, 1, z + 7, M.tire); b.fill(236, 1, z, 242, 2, z + 7, M.alu); b.fill(238, 1, z - 2 , 239, 2, z, M.steel);
    for (let j = 0; j < 5; j++) b.fill(236 + (j % 3) * 2, 2, z + 1 + (j % 2) * 3, 238 + (j % 3) * 2, 4, z + 3 + (j % 2) * 3, R.pick([M.bagR, M.bagB, M.bagK, M.bagY]));
  }
  // camion-citerne
  b.car(258, 200, 1, M.carW);
  b.fill(259, 0, 212, 263, 1, 232, (x, y, z) => (z % 8 < 2 ? M.tire : -1));
  b.fill(258, 1, 212, 265, 2, 232, M.steel);
  b.fill(258, 2, 212, 265, 7, 232, (x, y, z) => Math.hypot(x + 0.5 - 261.5, y + 0.5 - 4.5) <= 3.4 ? M.alu : -1);
  // escalier roulant
  b.car(186, 170, 1, M.carW);
  b.fill(183, 5, 174, 186, 6, 178, M.steel);
  for (let s = 0; s < 8; s++) b.fill(183, 5 + s, 178 + s, 186, 6 + s, 179 + s, M.steel);
  // balisage de piste
  for (let x = 4; x < 360; x += 12) { b.set(x, 0, 281, M.lamp); b.set(x, 0, 314, M.lamp); }
  for (let x = 60; x < 360; x += 40) b.fill(x, 0, 276, x + 3, 3, 277, (xx, y) => y === 2 ? M.neonY : M.plasticK);
  // côté ville : parking, taxis, arrêt
  for (let x = 44; x < 316; x += 12) { b.fill(x, -1, 2, x + 1, 0, 16, M.lineW); if (R() < 0.75) b.car(x + 8, 3, 1, R.pick(CARS)); }
  for (let x = 60; x < 300; x += 14) b.car(x, 30, 0, M.carY, 'taxi');
  b.bus(310, 21, 0, M.carB);
  for (let x = 30; x < 350; x += 24) b.lamp(x, 18, 12, 1);

  return {
    spawn: { x: 60, z: 96, yaw: -Math.PI / 2 },
    cam: { x: 150, y: 30, z: 240, tx: 220, ty: 10, tz: 140 },
  };
}

// ======================================================================== VILLAGE TROPICAL
const tropTop = (x, z) => {
  let h = z < 176 ? 9 : z < 212 ? 9 - Math.floor((z - 176) / 9) : Math.max(2, 5 - Math.floor((z - 212) / 28));
  return h;
};
function tropiques(W) {
  const b = new Builder(W), R = rng(1848);
  const hill = (x, z) => { const d = Math.hypot(x - 268, z - 214); return d < 44 ? Math.round(10 + 9 * Math.cos(d / 44 * Math.PI / 2) ** 0.8) - 1 : 0; };
  baseGround(W, (x, z) => {
    let h = tropTop(x, z), m = z < 170 ? M.grass : z < 190 ? M.sand : M.wetsand;
    const hh = hill(x, z);
    if (hh > h) { h = hh; m = hh > 14 ? M.grass : M.rock; }
    if (z < 170 && ((x >= 140 && x < 148) || (z >= 100 && z < 106))) m = M.path;
    if (x >= 100 && x < 190 && z >= 112 && z < 160) m = M.path;
    return [h, m];
  });

  // ---------- église
  b.building({ x0: 60, z0: 20, x1: 96, z1: 62, floors: 1, fh: 16, wall: M.plasterW, roof: M.plasterW, parapet: 0,
    facade: (u, yl, f, side, len) => (side > 1 && u % 7 === 3 && yl > 3 && yl < 13) ? (yl > 10 ? M.glassB : M.glassG) : M.plasterW,
    interior: (f, y) => {
      for (let z = 30; z < 56; z += 3) { b.fill(64, y, z, 76, y + 2, z + 1, M.wood); b.fill(80, y, z, 92, y + 2, z + 1, M.wood); }
      b.fill(72, y, 22, 84, y + 3, 25, M.marble); b.set(74, y + 3, 23, M.lamp); b.set(81, y + 3, 23, M.lamp);
      b.fill(77, y + 3, 22, 79, y + 11, 23, M.bronze); b.fill(75, y + 8, 22, 81, y + 9, 23, M.bronze);
    } });
  b.gable(60, 20, 96, 62, 17, M.tile, M.plasterW, 'z');
  b.building({ x0: 71, z0: 60, x1: 85, z1: 74, floors: 1, fh: 36, wall: M.plasterW, parapet: 0,
    facade: (u, yl, f, side, len) => (yl > 28 && yl < 34 && u > 3 && u < len - 4) ? 0 : (side === 1 && u >= 5 && u < 9 && yl < 8) ? 0 : (side === 1 && yl >= 14 && yl < 25 && u >= 2 && u < 12) ? M.plasterW : M.plasterW });
  b.fill(76, 1, 60, 80, 7, 62, 0);
  b.sphere(78, 32, 67, 2.6, M.bronze); b.fill(72, 34, 67, 84, 35, 68, M.woodD);
  b.hip(71, 60, 85, 74, 37, 7, M.slate);
  b.fill(78, 44, 67, 79, 51, 68, M.steel); b.fill(76, 48, 67, 81, 49, 68, M.steel);
  b.fill(74, 16, 74, 83, 25, 75, (x, y) => Math.hypot(x + 0.5 - 78.5, y + 0.5 - 20.5) <= 3.9 ? M.clock : -1);
  b.fill(78, 20, 75, 79, 24, 76, M.plasticK); b.fill(78, 20, 75, 81, 21, 76, M.plasticK);

  // ---------- maisons colorées
  const HOUSES = [
    [16, 84, 46, 116, M.plasterP, M.tile], [16, 124, 44, 158, M.plasterB, M.zinc], [104, 16, 134, 50, M.plasterR, M.tile],
    [158, 18, 190, 48, M.plasterY, M.zinc], [200, 18, 232, 48, M.plasterG, M.tile], [242, 24, 274, 56, M.plasterO, M.zinc],
    [198, 64, 228, 94, M.plasterW, M.tile], [240, 72, 276, 104, M.plasterB, M.tile], [200, 116, 230, 150, M.plasterP, M.zinc],
    [104, 60, 134, 90, M.plasterG, M.zinc], [158, 60, 188, 92, M.plasterO, M.tile], [242, 118, 272, 152, M.plasterY, M.tile],
  ];
  for (const [x0, z0, x1, z1, wall, roof] of HOUSES) {
    const door = (z1 - z0) >> 1;
    b.building({ x0, z0, x1, z1, floors: 2, fh: 8, wall, slab: M.plank, roof: M.plank, parapet: 0,
      facade: (u, yl, f, side, len) => (u % 6 >= 2 && u % 6 < 5 && yl >= 3 && yl < 6 && u > 1 && u < len - 2) ? M.glass : (u % 6 === 1 || u % 6 === 5) && yl >= 3 && yl < 6 && u > 1 && u < len - 2 ? M.woodD : wall,
      doors: [{ side: 2, u: door - 2, w: 4, h: 6 }, { side: 3, u: door - 2, w: 4, h: 6 }],
      interior: (f, y) => {
        if (f === 0) { b.table(x0 + 5, z0 + 5, M.wood, M.wood); b.fill(x1 - 5, y, z0 + 3, x1 - 3, y + 5, z0 + 5, M.plasticW); b.set(x0 + 3, y + 1, z1 - 3, M.screen); b.fill(x0 + 8, y, z1 - 5, x0 + 14, y + 2, z1 - 3, M.seatO); }
        else { b.fill(x0 + 3, y, z0 + 3, x0 + 9, y + 2, z0 + 11, M.plasticW); b.fill(x0 + 3, y + 2, z0 + 3, x0 + 9, y + 3, z0 + 5, M.fruitR); }
      } });
    b.gable(x0, z0, x1, z1, 17, roof, wall, 'x');
    b.fill(x0, 8, z1, x1, 9, z1 + 3, M.plank); b.fill(x0, 9, z1 + 2, x1, 11, z1 + 3, (x) => x % 2 ? M.woodD : -1);
  }

  // ---------- place du marché
  const STALLS = [[108, 118, M.awnR], [128, 118, M.awnG], [160, 118, M.awnB], [176, 118, M.awnR], [110, 146, M.awnB], [174, 146, M.awnG]];
  for (const [x, z, awn] of STALLS) {
    for (const [dx, dz] of [[0, 0], [9, 0], [0, 6], [9, 6]]) b.fill(x + dx, 0, z + dz, x + dx + 1, 6, z + dz + 1, M.bamboo);
    b.fill(x - 1, 6, z - 1, x + 11, 7, z + 8, (xx) => (xx - x) % 4 < 2 ? awn : M.awnW);
    b.fill(x + 1, 0, z + 2, x + 9, 2, z + 5, M.plank);
    b.fill(x + 1, 2, z + 2, x + 9, 3, z + 5, () => R.pick([M.fruitO, M.fruitY, M.fruitR, M.coco, M.goodsG]));
  }
  b.fill(142, 0, 136, 148, 1, 142, M.stone);
  b.fill(144, 1, 138, 146, 8, 140, M.trunk);
  b.sphere(145, 10, 139, 6, (x, y, z) => ((x * 7 + y * 3 + z) % 5 === 0 ? M.leaves : M.flowerR), true);

  // ---------- hôtel « Paradis » avec piscine sur le toit
  b.foundation(10, 166, 70, 199, M.concrete);
  b.building({ x0: 10, z0: 166, x1: 70, z1: 196, floors: 4, fh: 8, wall: M.plasterW, parapet: 2, parapetMat: M.plasterB,
    win: { period: 6, ww: 4, sill: 2, wh: 4, off: 1 }, stairs: { x: 14, z: 170 }, doors: [{ side: 0, u: 28, w: 5 }],
    interior: (f, y) => { for (let x = 26; x < 66; x += 10) { b.fill(x, y, 180, x + 5, y + 1, 186, M.plasticW); b.fill(x, y + 1, 180, x + 5, y + 2, 182, M.carpetB); } } });
  for (let f = 1; f < 4; f++) b.fill(10, f * 8, 196, 70, f * 8 + 2, 199, (x, y, z) => (y === f * 8 || z === 198) ? M.plasterB : -1);
  b.fill(26, 33, 172, 58, 35, 190, (x, y, z) => (x === 26 || x === 57 || z === 172 || z === 189) ? M.plasterB : (y === 33 ? M.plasterB : M.water));
  b.text('HOTEL PARADIS', 40, 26, 165, 'N', M.neonP);

  // ---------- bar de plage
  b.foundation(160, 178, 184, 194, M.bamboo);
  b.fill(160, 0, 178, 184, 1, 194, M.plank);
  for (const [x, z] of [[160, 178], [183, 178], [160, 193], [183, 193]]) b.fill(x, 1, z, x + 1, 9, z + 1, M.bamboo);
  b.gable(159, 177, 185, 195, 8, M.thatch, M.thatch, 'x');
  b.fill(164, 1, 184, 180, 4, 187, M.bamboo); b.fill(164, 4, 184, 180, 5, 187, M.plank);
  for (let x = 165; x < 180; x += 2) b.set(x, 5, 185, R.pick([M.bottle, M.bottle, M.fruitY]));
  for (let x = 165; x < 180; x += 4) b.fill(x, 1, 189, x + 1, 3, 190, M.bamboo);
  b.fill(163, 9, 176, 182, 16, 177, M.bamboo);
  b.text('RHUM', 172, 10, 175, 'N', M.neonG);

  // ---------- ponton et paillotes sur pilotis
  b.fill(198, 0, 178, 204, 1, 272, M.plank);
  for (let z = 180; z < 272; z += 6) { b.stilt(198, z, -1, M.woodD); b.stilt(203, z, -1, M.woodD); }
  for (const [hx, hz] of [[208, 212], [208, 240], [182, 256]]) {
    b.fill(hx, 0, hz, hx + 12, 1, hz + 12, M.plank);
    for (const [dx, dz] of [[0, 0], [11, 0], [0, 11], [11, 11]]) b.stilt(hx + dx, hz + dz, -1, M.woodD);
    b.walls(hx + 1, hz + 1, hx + 11, hz + 11, 1, 6, M.bamboo);
    b.fill(hx + 1, 1, hz + 5, hx + 2, 5, hz + 7, 0); b.fill(hx + 10, 1, hz + 5, hx + 11, 5, hz + 7, 0);
    b.fill(hx + 4, 3, hz + 1, hx + 8, 5, hz + 2, 0);
    b.hip(hx + 1, hz + 1, hx + 11, hz + 11, 6, 5, M.thatch);
    b.fill(hx + 3, 1, hz + 3, hx + 7, 2, hz + 8, M.plasticW);
  }
  b.fill(204, 0, 216, 208, 1, 219, M.plank); b.fill(204, 0, 244, 208, 1, 247, M.plank); b.fill(194, 0, 260, 198, 1, 263, M.plank);
  // bateaux
  const boat = (x, z, rot, c1, c2, yb) => {
    const o = b.local(x, z, rot);
    for (let u = 0; u < 16; u++) {
      const w = u < 3 ? u : u > 12 ? 15 - u : 3;
      o.fill(u, yb, 3 - Math.max(0, w - 2), u + 1, yb + 1, 4 + Math.max(0, w - 2), c2);
      o.fill(u, yb + 1, 3 - w, u + 1, yb + 3, 4 + w, (uu, y, v) => (Math.abs(v - 3) === w || u === 0 || u === 15) ? (y === yb + 2 ? M.boatW : c1) : (y === yb + 1 ? M.plank : -1));
    }
  };
  for (const [x, z, c1, c2] of [[40, 182, M.boatB, M.boatW], [70, 184, M.boatR, M.boatY], [110, 180, M.boatY, M.boatB], [130, 186, M.boatB, M.boatR]]) boat(x, z, 0, c1, c2, tropTop(x, z + 3) - 9);
  boat(212, 262, 1, M.boatB, M.boatR, -3);
  for (const [x, z] of [[209, 266], [209, 272]]) b.stilt(x, z, -4, M.woodD);

  // ---------- phare sur le promontoire
  const hy = hill(268, 214) - 9;
  b.cyl(268, 214, 5.5, hy, hy + 40, (x, y) => (Math.floor((y - hy) / 5) % 2 ? M.plasterW : M.plasterR), 1.5);
  b.fill(267, hy, 208, 270, hy + 6, 210, 0);
  b.cyl(268, 214, 7.5, hy + 40, hy + 41, M.steel);
  b.cyl(268, 214, 7.5, hy + 41, hy + 42, M.steel, 1);
  b.cyl(268, 214, 4.5, hy + 41, hy + 46, M.glass, 1.2);
  b.cyl(268, 214, 2.2, hy + 41, hy + 45, M.lamp);
  b.cyl(268, 214, 5, hy + 46, hy + 48, M.plasterR);
  b.fill(268, hy + 48, 214, 269, hy + 52, 215, M.steel);

  // ---------- palmiers, fleurs, véhicules
  for (let i = 0; i < 46; i++) {
    const x = R.int(6, 230), z = i < 26 ? R.int(168, 196) : R.int(6, 164);
    if (b.get(x, 0, z) || b.get(x, 1, z) || b.get(x, 3, z)) continue;
    let clear = true;
    for (let dx = -2; dx <= 2 && clear; dx++) for (let dz = -2; dz <= 2; dz++) if (b.get(x + dx, 2, z + dz) || b.get(x + dx, 0, z + dz)) { clear = false; break; }
    if (!clear) continue;
    const top = tropTop(x, z) - 9;
    const bb = { set: (xx, y, zz, m) => b.set(xx, y + top, zz, m) };
    b.palm.call({ set: bb.set, line: (...a) => b.line(a[0], a[1] + top, a[2], a[3], a[4] + top, a[5], a[6]) }, x, z, R.int(12, 20), R);
  }
  for (let z = 4; z < 168; z += 2) if (z < 98 || z > 108) { b.set(138, 0, z, R() < 0.5 ? M.flowerP : M.hedge); b.set(149, 0, z, R() < 0.5 ? M.flowerR : M.hedge); }
  b.car(150, 60, 1, M.carW); b.car(120, 102, 0, M.carY);
  for (const [x, z] of [[12, 60], [30, 40], [56, 76], [100, 70]]) b.tree(x, z, 8, 3.6, M.leaves);

  return {
    spawn: { x: 145, z: 150, yaw: Math.PI },
    cam: { x: 90, y: 22, z: 240, tx: 140, ty: 10, tz: 120 },
    sea: { y: 3.0, z0: 188 },
  };
}

// ======================================================================== LA GARE
function train(b, x0, z0, kind, cars, R) {
  const liv = kind === 'tgv' ? { body: M.trainW, band: M.trainB, stripe: M.trainR, roof: M.trainG, seat: M.carpetB }
    : kind === 'ter' ? { body: M.trainW, band: M.trainB, stripe: M.trainY, roof: M.trainG, seat: M.seatB }
      : { body: M.trainB, band: M.trainW, stripe: M.trainR, roof: M.trainG, seat: M.seatO };
  let x = x0;
  const car = (len, noseL, noseR) => {
    const o = b.local(x, z0, 0);
    for (const u of [3, 5, len - 6, len - 4]) { o.fill(u, 1, 1, u + 1, 2, 2, M.steel); o.fill(u, 1, 6, u + 1, 2, 7, M.steel); }
    o.fill(2, 1, 1, len - 2, 2, 7, (u) => (u > 6 && u < len - 7) ? -1 : M.trainG);
    for (let u = 0; u < len; u++) {
      const dn = noseL ? u : noseR ? len - 1 - u : 99;
      const hmax = dn < 12 ? 3 + Math.floor(dn * 7 / 12) : 10;
      const nar = dn < 12 ? Math.max(0, Math.round((12 - dn) / 5)) : 0;
      for (let y = 2; y <= hmax; y++) for (let v = nar; v < 8 - nar; v++) {
        const edge = v === nar || v === 7 - nar || y === hmax || y === 2 || u === 0 || u === len - 1;
        if (!edge) { if (y === 3 && v !== 3 && v !== 4 && u % 3 === 0 && dn > 12) o.set(u, y, v, liv.seat); continue; }
        let m = liv.body;
        if (y === 2) m = M.trainG; else if (y <= 3) m = liv.band; else if (y === 4) m = liv.stripe;
        if (y === hmax && hmax === 10) m = (v === nar || v === 7 - nar) ? liv.body : liv.roof;
        if (y >= 6 && y <= 8 && (v === 0 || v === 7) && u % 7 !== 0 && dn > 13) m = M.glass;
        if (dn < 12 && dn > 4 && y >= hmax - 1 && y > 5) m = M.glassB;
        if ((u === 6 || u === len - 7) && (v === 0 || v === 7) && y > 2 && y < 9) m = liv.stripe;
        o.set(u, y, v, m);
      }
    }
    if (noseL || noseR) { const pu = noseL ? 20 : len - 22; o.fill(pu, 11, 3, pu + 6, 12, 4, M.steel); o.fill(pu + 2, 12, 3, pu + 3, 14, 4, M.steel); o.fill(pu, 14, 2, pu + 6, 15, 6, M.steel); o.set(noseL ? 0 : len - 1, 4, 2, M.lamp); o.set(noseL ? 0 : len - 1, 4, 5, M.lamp); }
    x += len;
    o.fill(len, 3, 2, len + 1, 7, 6, M.trainG);
    x += 1;
  };
  for (let c = 0; c < cars; c++) car(c === 0 || c === cars - 1 ? 44 : 40, c === 0, c === cars - 1);
}

function gare(W) {
  const b = new Builder(W), R = rng(1837);
  const TRACKS = [6, 34, 64, 76, 106];
  baseGround(W, (x, z) => {
    for (const t of TRACKS) if (z >= t && z < t + 12) {
      if (z > t && z < t + 11 && x % 3 === 0) return [9, M.sleeper];
      return [9, M.ballast];
    }
    if (z < 6) return [9, M.ballast];
    if (z < 34) return [9, M.ballast];
    if (z < 150) return [9, M.concrete];
    if (z < 214 || z >= 240) return [9, M.sidewalk];
    return [9, (z === 226 || z === 227) && x % 12 < 6 ? M.lineW : M.asphalt];
  });
  b.fill(0, 0, 0, 320, 7, 2, (x, y) => (y === 6 ? M.stone : M.brick));
  for (const t of TRACKS) { b.fill(0, 0, t + 3, 320, 1, t + 4, M.rail); b.fill(0, 0, t + 8, 320, 1, t + 9, M.rail); }
  // quais
  for (const [z0, z1] of [[46, 64], [88, 106], [118, 150]]) {
    b.fill(0, 0, z0, 320, 1, z1, M.concrete);
    b.fill(0, 0, z0, 320, 1, z0 + 1, M.lineW); b.fill(0, 0, z1 - 1, 320, 1, z1, M.lineW);
    b.fill(0, 0, z0 + 2, 320, 1, z0 + 3, (x) => x % 2 ? M.lineY : M.concrete); b.fill(0, 0, z1 - 3, 320, 1, z1 - 2, (x) => x % 2 ? M.lineY : M.concrete);
    const zc = (z0 + z1) >> 1;
    for (let x = 12; x < 320; x += 30) { b.lamp(x, zc, 11, 1); b.bench(x + 8, zc - 1, 0, M.plasticR); b.bench(x + 18, zc, 2, M.plasticR); }
    for (let x = 40; x < 300; x += 90) { b.fill(x, 1, zc - 5, x + 1, 8, zc - 4, M.steel); b.fill(x + 24, 1, zc - 5, x + 25, 8, zc - 4, M.steel); b.fill(x, 8, zc - 5, x + 25, 14, zc - 4, M.signB); b.text(z0 === 46 ? 'QUAI A' : z0 === 88 ? 'QUAI B' : 'QUAI C', x + 12, 8, zc - 4, 'S', M.lineW); }
  }
  // trains
  train(b, 20, 66, 'tgv', 5, R);
  train(b, 60, 36, 'ter', 3, R);
  train(b, 120, 108, 'ouigo', 4, R);
  // wagons de fret
  for (let k = 0; k < 7; k++) {
    const x = 10 + k * 36;
    for (const u of [4, 6, 26, 28]) { b.set(x + u, 1, 9, M.steel); b.set(x + u, 1, 14, M.steel); }
    b.fill(x + 2, 2, 8, x + 32, 3, 16, M.trainG); b.fill(x + 32, 2, 11, x + 36, 3, 13, M.trainG);
    const c = R.pick([M.carR, M.carB, M.carG, M.carY, M.trainG]);
    b.fill(x + 3, 3, 8, x + 31, 10, 16, (xx, y) => (xx % 3 === 0 ? c : c));
    b.fill(x + 3, 3, 8, x + 31, 10, 16, (xx, y, z) => (xx - x) % 4 === 0 && (z === 8 || z === 15) ? M.steel : -1);
  }
  // poste d'aiguillage
  b.building({ x0: 40, z0: 18, x1: 62, z1: 32, floors: 2, fh: 8, wall: M.brick, parapet: 0, win: { period: 4, ww: 2, sill: 2, wh: 4 } });
  b.gable(40, 18, 62, 32, 17, M.slate, M.brick, 'x');
  b.fill(44, 9, 21, 58, 10, 23, M.screen);
  b.text('POSTE', 51, 10, 32, 'S', M.lineW);
  // château d'eau
  b.cyl(280, 26, 2, 0, 22, M.steel, 1); b.cyl(280, 26, 6, 22, 23, M.brick); b.cyl(280, 26, 6, 23, 32, M.brick, 1.2); b.cyl(280, 26, 6.4, 32, 33, M.slate);

  // ---------- la grande halle
  const zc = 92, half = 58;
  const archY = (z) => 9 + Math.floor(40 * Math.sqrt(Math.max(0, 1 - ((z + 0.5 - zc) / half) ** 2)));
  for (let x = 20; x < 300; x++) {
    const rib = (x - 20) % 20 < 2;
    for (let z = zc - half; z < zc + half; z++) {
      const y0 = archY(z), y1 = Math.max(y0, archY(z + (z < zc ? 1 : -1)));
      const purlin = z % 12 === 0;
      for (let y = y0; y <= y1; y++) b.set(x, y, z, rib || purlin ? M.steelB : M.glass);
      if (rib) b.set(x, y0 - 1, z, M.steelB);
    }
    if (rib) for (const z of [zc - half, zc + half - 1]) b.fill(x, 0, z, x + 1, archY(z), z + 1, M.steelB);
  }
  b.fill(20, archY(zc - half) - 1, zc - half, 300, archY(zc - half), zc - half + 1, M.steelB);
  b.fill(20, archY(zc + half - 1) - 1, zc + half - 1, 300, archY(zc + half - 1), zc + half, M.steelB);

  // ---------- le bâtiment voyageurs
  const BV = { x0: 30, z0: 150, x1: 290, z1: 200, floors: 2, fh: 13, wall: M.stone, floor0: M.marble, roof: M.concrete, parapet: 1,
    facade: (u, yl, f, side, len) => {
      if (u === 0 || u === len - 1) return M.stone;
      if (side === 1) {
        const k = u % 14;
        if (f === 0) {
          if (u >= 119 && u < 141 && yl < 12) return 0;
          if (k >= 4 && k < 10 && yl >= 2 && yl < 12 && !(yl === 11 && (k === 4 || k === 9))) return M.glass;
          return yl === 12 ? M.granite : M.stone;
        }
        return k >= 5 && k < 9 && yl >= 3 && yl < 9 ? M.glass : M.stone;
      }
      if (side === 0 && f === 0) return (u % 20 >= 5 && u % 20 < 13 && yl < 9) ? 0 : M.stone;
      return (u % 10 >= 4 && u % 10 < 7 && yl >= 3 && yl < 9) ? M.glass : M.stone;
    },
    stairs: { x: 34, z: 154 },
    interior: (f, y) => {
      if (f === 1) { for (let x = 50; x < 280; x += 8) for (let z = 156; z < 196; z += 9) if (!(x > 140 && x < 180)) b.desk(x, z, 0); return; }
      for (let x = 52; x < 110; x += 8) { b.fill(x, y, 190, x + 6, y + 3, 193, M.woodD); b.fill(x, y + 3, 192, x + 6, y + 6, 193, M.glass); b.set(x + 3, y + 3, 190, M.screen); }
      b.fill(52, y + 6, 192, 110, y + 12, 193, M.stone);
      b.text('GUICHETS', 80, y + 7, 191, 'N', M.signB);
      for (let x = 116; x < 140; x += 4) { b.fill(x, y, 158, x + 2, y + 4, 159, M.signB); b.set(x, y + 3, 159, M.screen); }
      b.fill(180, y + 6, 151, 244, y + 11, 152, M.board); b.fill(179, y + 5, 151, 245, y + 6, 152, M.plasticK); b.fill(179, y + 11, 151, 245, y + 12, 152, M.plasticK);
      for (let x = 150; x < 250; x += 14) for (const z of [170, 178]) b.bench(x, z, 0, M.woodD);
      b.fill(200, y, 184, 226, y + 6, 196, (x, yy, z) => (yy === y + 5) ? M.signR : (x === 200 || x === 225 || z === 195) ? M.plank : (z === 184 && yy < y + 2) ? M.plank : -1);
      b.shelf(202, 194, 22, 0, R, [M.goodsR, M.goodsB, M.goodsY, M.bottle]);
      b.text('RELAIS', 213, y + 5, 183, 'N', M.neonY);
      b.fill(250, y, 188, 286, y + 3, 191, M.woodD); b.shelf(252, 196, 32, 0, R, [M.bottle, M.plasticW]);
      b.fill(252, y + 6, 197, 284, y + 12, 198, M.stone);
      for (let x = 254; x < 284; x += 8) b.table(x, 170);
      b.text('BAR', 268, y + 7, 196, 'N', M.neonP);
      for (let z = 156; z < 168; z += 1) b.fill(268, y, z, 286, y + 7, z + 1, (x, yy) => (yy % 3 === 0 || x % 3 === 0) ? M.steel : M.alu);
      for (let x = 50; x < 290; x += 40) b.fill(x, y, 173, x + 2, y + 12, 175, M.stone);
    },
  };
  b.building(BV);
  b.hip(30, 150, 290, 200, 27, 9, M.slate);
  // tour de l'horloge
  b.building({ x0: 148, z0: 176, x1: 172, z1: 204, floors: 1, fh: 56, wall: M.stone, parapet: 0,
    facade: (u, yl, f, side, len) => (side <= 1 && u >= 8 && u < 16 && yl < 12) ? 0 : (yl > 20 && yl < 50 && u % 6 === 3 && side > 1) ? M.glass : M.stone });
  for (const [z, face] of [[204, 'S'], [175, 'N']]) {
    b.fill(154, 38, z, 166, 50, z + 1, (x, y) => {
      const d = Math.hypot(x + 0.5 - 160, y + 0.5 - 44);
      return d <= 5.6 ? (d > 4.8 ? M.bronze : M.clock) : -1;
    });
    const zz = face === 'S' ? z + 1 : z - 1;
    b.fill(160, 44, zz, 161, 49, zz + 1, M.plasticK); b.fill(160, 44, zz, 164, 45, zz + 1, M.plasticK);
  }
  b.text('GARE', 160, 28, 204, 'S', M.gold);
  b.hip(148, 176, 172, 204, 57, 11, M.slate);
  b.fill(160, 68, 190, 161, 76, 191, M.steel); b.fill(161, 73, 190, 166, 76, 191, M.signB);

  // ---------- parvis
  for (let x = 20; x < 300; x += 22) { b.lamp(x, 212, 12, 1); b.lamp(x + 11, 242, 12, 3); }
  for (let x = 34; x < 300; x += 44) b.tree(x, 206, 9, 3.2);
  for (let x = 176; x < 300; x += 13) b.car(x, 203, 0, M.carY, 'taxi');
  b.bus(40, 216, 0, M.carR);
  b.car(110, 229, 2, M.carB); b.car(240, 216, 0, M.carW);
  for (let x = 10; x < 312; x += 12) { b.fill(x, -1, 244, x + 1, 0, 258, M.lineW); b.fill(x, -1, 262, x + 1, 0, 276, M.lineW); if (R() < 0.7) b.car(x + 8, 245, 1, R.pick(CARS)); if (R() < 0.6) b.car(x + 8, 263, 1, R.pick(CARS)); }
  // statue
  b.fill(86, 0, 204, 114, 6, 212, M.granite);
  b.fill(99, 6, 207, 101, 10, 209, M.bronze); b.fill(98, 10, 207, 102, 15, 209, M.bronze); b.fill(99, 15, 207, 101, 17, 209, M.bronze); b.fill(102, 13, 208, 105, 14, 209, M.bronze); b.fill(104, 14, 208, 105, 18, 209, M.bronze);
  b.text('BOURRIN', 100, 1, 212, 'S', M.gold);

  return {
    spawn: { x: 112, z: 136, yaw: -0.35 },
    cam: { x: 70, y: 30, z: 262, tx: 160, ty: 16, tz: 150 },
  };
}

// ======================================================================== catalogue
export const LEVELS = [
  {
    id: 'affaires', name: 'Le Quartier d\'Affaires', sub: 'Centre-ville · Place de la Bourse', build: affaires, sx: 300, sy: 128, sz: 300,
    desc: 'Deux tours de verre, une banque au coffre bien garni, des boutiques, un hôtel et une fontaine. Tout est assuré, sauf contre vous.',
    tags: ['Gratte-ciel', 'Banque', 'Boutiques'], fragile: 4,
    sky: 0x9cc4e4, fogNear: 90, fogFar: 330, sun: 0xfff1d8, sunI: 2.4, hemi: [0xcfe4ff, 0x6b6456, 1.3], sunPos: [60, 110, 40],
    outer: 'city', groundColor: 0x8f8d86,
  },
  {
    id: 'aeroport', name: 'L\'Aéroport', sub: 'Terminal 2 · Porte 1 et 2', build: aeroport, sx: 360, sy: 90, sz: 320,
    desc: 'Salle d\'attente, portiques de sécurité, deux long-courriers sur le tarmac et une tour de contrôle. Tous les vols sont annulés.',
    tags: ['Avions', 'Sécurité', 'Tarmac'], fragile: 3,
    sky: 0xf2c79a, fogNear: 100, fogFar: 360, sun: 0xffc98a, sunI: 2.3, hemi: [0xffe0c0, 0x5a5048, 1.15], sunPos: [-90, 60, 70],
    outer: 'field', groundColor: 0x6f8a4a,
  },
  {
    id: 'tropiques', name: 'Le Village des Tropiques', sub: 'Anse aux Cocos · Bord de mer', build: tropiques, sx: 300, sy: 72, sz: 300,
    desc: 'Cases colorées, église, marché, paillotes sur pilotis, bar à rhum et phare. Le paradis, mais plus pour longtemps.',
    tags: ['Plage', 'Pilotis', 'Phare'], fragile: 5,
    sky: 0x7fd0f0, fogNear: 110, fogFar: 380, sun: 0xfffbe8, sunI: 2.7, hemi: [0xd8f4ff, 0x6a7a4a, 1.3], sunPos: [30, 120, -20],
    outer: 'sea', groundColor: 0x5c8f37,
  },
  {
    id: 'gare', name: 'La Gare', sub: 'Gare de Bourrinville · Quais A à C', build: gare, sx: 320, sy: 90, sz: 280,
    desc: 'La grande halle de verre, trois quais, des TGV, un TER, du fret, et l\'horloge qui vous regarde. Le prochain train ne partira pas.',
    tags: ['Trains', 'Verrière', 'Horloge'], fragile: 4,
    sky: 0xe9a07a, fogNear: 90, fogFar: 320, sun: 0xffb070, sunI: 2.1, hemi: [0xffd0b0, 0x4a4050, 1.1], sunPos: [100, 45, 60],
    outer: 'city', groundColor: 0x7d7a74,
  },
];
LEVELS.push(...LEVELS2);
export const tropOuter = (x, z) => (z < 0 ? 9 : z >= 300 ? 2 : tropTop(Math.max(0, Math.min(299, x)), z));
