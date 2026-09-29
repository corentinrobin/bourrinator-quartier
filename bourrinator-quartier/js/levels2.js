// Trois quartiers de plus : le port, le centre commercial et la base lunaire.
import { M } from './voxel.js';
import { Builder, baseGround, rng } from './build.js';

const CARS = [M.carR, M.carB, M.carW, M.carK, M.carG, M.carW, M.carR];
const CONT = [M.contR, M.contB, M.contG, M.contO, M.contW, M.contB];

// ======================================================================== LA ZONE PORTUAIRE
const QUAY = 210;
function port(W) {
  const b = new Builder(W), R = rng(1664);
  baseGround(W, (x, z) => {
    if (z >= QUAY) return [2, M.wetsand];
    if (z < 16) return [9, (z === 7 || z === 8) && x % 12 < 6 ? M.lineW : M.asphalt];
    if (z === 190 || z === 206) return [9, M.rail];
    if (z === 203 || z === 204) return [9, M.lineY];
    return [9, M.tarmac];
  });
  // mur de quai, bittes d'amarrage
  b.fill(0, -8, QUAY - 1, 360, 0, QUAY, M.concreteD);
  for (let x = 10; x < 360; x += 20) { b.fill(x, 0, 207, x + 2, 2, 209, M.bollard); b.fill(x - 1, 2, 206, x + 3, 3, 209, M.bollard); }
  for (let x = 6; x < 360; x += 40) { b.fill(x, 0, 199, x + 1, 20, 200, M.steel); b.fill(x - 2, 20, 198, x + 3, 21, 201, M.steel); b.fill(x - 1, 19, 198, x + 2, 20, 199, M.lamp); b.fill(x - 1, 19, 200, x + 2, 20, 201, M.lamp); }

  // ---------- portiques à conteneurs
  for (const x0 of [70, 170, 270]) {
    for (const [lx, lz] of [[x0, 188], [x0 + 22, 188], [x0, 204], [x0 + 22, 204]]) b.fill(lx, 0, lz, lx + 3, 64, lz + 3, (x, y, z) => (y % 12 === 11 ? M.steel : M.craneY));
    b.fill(x0, 30, 188, x0 + 25, 32, 191, M.craneY); b.fill(x0, 30, 204, x0 + 25, 32, 207, M.craneY);
    b.fill(x0, 64, 150, x0 + 3, 68, 290, M.craneY); b.fill(x0 + 22, 64, 150, x0 + 25, 68, 290, M.craneY);
    for (let z = 150; z < 290; z += 10) b.fill(x0 + 3, 67, z, x0 + 22, 68, z + 2, M.craneY);
    b.fill(x0 + 3, 68, 186, x0 + 22, 76, 210, (x, y, z) => (y === 68 || y === 75 || x === x0 + 3 || x === x0 + 21 || z === 186 || z === 209) ? M.craneY : 0);
    // cabine et chariot, suspendus sous la poutre
    b.fill(x0 + 3, 64, 236, x0 + 22, 65, 243, M.craneY);
    b.fill(x0 + 9, 58, 236, x0 + 16, 64, 243, (x, y) => (y === 58 ? M.craneY : M.glassB));
    b.fill(x0 + 3, 64, 250, x0 + 22, 65, 256, M.steelB);
    for (const cx of [x0 + 10, x0 + 15]) b.fill(cx, 44, 252, cx + 1, 64, 253, M.steel);
    b.fill(x0 + 7, 43, 248, x0 + 18, 44, 257, M.craneY);
    b.text('PORT', x0 + 12, 69, 185, 'N', M.hullK);
  }

  // ---------- le porte-conteneurs, amarré
  const sx0 = 50, sx1 = 314, sz0 = 216, sz1 = 254, zc = (sz0 + sz1) / 2, yb = -7, yd = 3;
  for (let x = sx0; x < sx1; x++) {
    const tb = x < sx0 + 18 ? (x - sx0) / 18 : x > sx1 - 40 ? (sx1 - x) / 40 : 1;
    const half = (sz1 - sz0) / 2 * Math.pow(Math.max(0.08, tb), 0.55);
    for (let y = yb; y <= yd; y++) {
      const shrink = y < yb + 3 ? (yb + 3 - y) * 1.5 : 0;
      const h = Math.max(1, half - shrink);
      for (let z = Math.floor(zc - h); z < Math.ceil(zc + h); z++) {
        const edge = z <= Math.floor(zc - h) || z >= Math.ceil(zc + h) - 1 || y === yb || y === yd || x === sx0 || x === sx1 - 1;
        const wall = Math.abs(z + 0.5 - zc) > h - 1.2;
        if (!(edge || wall)) { if (y === yb + 1) b.set(x, y, z, M.steel); continue; }
        b.set(x, y, z, y === yd ? M.steel : y < -3 ? M.hullR : y === -3 ? M.hullW : M.hullK);
      }
    }
  }
  b.fill(sx1 - 30, yd + 1, sz0 + 6, sx1 - 2, yd + 3, sz1 - 6, (x, y, z) => (x - (sx1 - 30)) > (Math.abs(z - zc) * 1.2) ? -1 : M.hullK);
  // château arrière
  const bx0 = sx0 + 4, bx1 = sx0 + 28, bz0 = sz0 + 5, bz1 = sz1 - 5, by0 = yd + 1, by1 = yd + 21;
  b.fill(bx0, by0, bz0, bx1, by1, bz1, (x, y, z) => {
    const lvl = (y - by0) % 5, edge = x === bx0 || x === bx1 - 1 || z === bz0 || z === bz1 - 1;
    if (lvl === 0) return M.hullW;
    if (!edge) return 0;
    return lvl >= 2 && lvl <= 3 && (x + z) % 3 !== 0 ? M.glassB : M.hullW;
  });
  b.fill(bx0 - 1, by1, bz0 - 1, bx1 + 1, by1 + 1, bz1 + 1, M.hullW);
  b.fill(bx1 - 6, by1 - 5, sz0 + 1, bx1, by1 - 4, sz1 - 1, M.hullW);
  b.fill(bx0 + 4, by1 + 1, zc - 4, bx0 + 12, by1 + 11, zc + 4, (x, y) => (y > by1 + 6 && y < by1 + 9 ? M.hullR : y >= by1 + 9 ? M.hullK : M.hullW));
  // cales de conteneurs
  for (let bay = 0; bay < 12; bay++) {
    const x = sx0 + 34 + bay * 17;
    if (x > sx1 - 36) break;
    for (let v = 0; v < 4; v++) {
      const h = R.int(1, 4);
      for (let k = 0; k < h; k++) b.container(x, sz0 + 5 + v * 7, yd + 1 + k * 6, 0, R.pick(CONT));
    }
  }
  b.text('BOURRIN EXPRESS', 200, -2, sz0 - 1, 'N', M.hullW);

  // ---------- parc à conteneurs
  for (const bx of [16, 96, 176]) for (let i = 0; i < 4; i++) for (let j = 0; j < 11; j++) {
    const h = R.int(0, 4);
    for (let k = 0; k < h; k++) b.container(bx + i * 17, 100 + j * 7, k * 6, 0, R.pick(CONT));
  }
  // cavalier gerbeur
  for (const [x, z] of [[160, 120], [240, 150]]) {
    for (const [dx, dz] of [[0, 0], [0, 9], [18, 0], [18, 9]]) { b.fill(x + dx, 0, z + dz, x + dx + 2, 1, z + dz + 2, M.tire); b.fill(x + dx, 1, z + dz, x + dx + 2, 28, z + dz + 1, M.craneY); }
    b.fill(x, 28, z, x + 20, 30, z + 11, M.craneY); b.fill(x + 2, 26, z + 3, x + 8, 28, z + 8, M.glassB);
  }
  // camions porte-conteneurs
  for (const [x, z] of [[40, 180], [120, 184], [300, 182]]) {
    b.car(x + 16, z, 0, M.carR);
    b.fill(x, 0, z, x + 16, 1, z + 5, (xx) => (xx % 5 === 1 ? M.tire : -1));
    b.fill(x, 1, z, x + 16, 2, z + 5, M.steel);
    b.container(x, z - 1 + 0, 2, 0, R.pick(CONT));
  }
  // cuves de carburant
  for (const [cx, cz] of [[292, 118], [322, 118], [292, 150], [322, 150]]) {
    b.cyl(cx, cz, 12, 0, 1, M.concrete);
    b.cyl(cx, cz, 11, 1, 26, (x, y) => (y % 8 === 0 ? M.steel : M.hullW), 1.3);
    b.cyl(cx, cz, 11, 26, 27, M.hullW);
    b.fill(cx - 11, 1, cz, cx - 10, 27, cz + 1, M.steel);
  }
  // entrepôts
  for (const [x0, x1] of [[16, 140], [200, 330]]) {
    b.building({ x0, z0: 24, x1, z1: 84, floors: 1, fh: 22, wall: M.zinc, roof: M.zinc, parapet: 0,
      facade: (u, yl, f, side) => (side === 1 && u % 30 > 8 && u % 30 < 22 && yl < 16) ? 0 : (u % 4 === 0 ? M.steel : M.zinc),
      interior: (f, y) => {
        for (let x = x0 + 6; x < x1 - 8; x += 7) for (let z = 30; z < 76; z += 9) {
          b.fill(x, y, z, x + 5, y + 1, z + 5, M.plank);
          const hh = R.int(1, 4);
          b.fill(x, y + 1, z, x + 5, y + 1 + hh, z + 5, R.pick([M.goodsR, M.goodsB, M.goodsY, M.plank, M.goodsG]));
        }
      } });
    b.gable(x0, 24, x1, 84, 23, M.zinc, M.zinc, 'x');
    b.text('ENTREPOT ' + (x0 < 100 ? 'A' : 'B'), (x0 + x1) >> 1, 17, 84, 'S', M.lineW);
  }
  b.car(60, 96, 0, M.carY); b.car(250, 96, 2, M.carY);
  // capitainerie
  b.building({ x0: 150, z0: 20, x1: 186, z1: 44, floors: 3, fh: 8, wall: M.brick, parapet: 1, win: { period: 5, ww: 3, sill: 2, wh: 4 }, stairs: { x: 154, z: 24 }, doors: [{ side: 1, u: 16, w: 4 }] });
  b.cyl(168, 32, 5, 25, 34, (x, y) => (y > 27 && y < 32 ? M.glassB : M.brick), 1);
  b.cyl(168, 32, 6, 34, 35, M.slate);
  b.text('PORT', 168, 17, 44, 'S', M.lineW);
  for (let x = 20; x < 350; x += 30) b.lamp(x, 18, 12, 1);
  for (let x = 30; x < 340; x += 16) if (R() < 0.6) b.car(x, 2, 0, R.pick(CARS));

  return {
    spawn: { x: 150, z: 196, yaw: Math.PI },
    cam: { x: 20, y: 40, z: 150, tx: 180, ty: 10, tz: 230 },
    sea: { y: 3.0, z0: QUAY, shore: QUAY },
  };
}
export const portOuter = (x, z) => (z >= QUAY ? 2 : 9);

// ======================================================================== LE CENTRE COMMERCIAL
function mall(W) {
  const b = new Builder(W), R = rng(2001);
  const X0 = 40, X1 = 280, Z0 = 80, Z1 = 220, FH = 13, AZ0 = 138, AZ1 = 162;
  baseGround(W, (x, z) => {
    if (x >= X0 - 4 && x < X1 + 4 && z >= Z0 - 4 && z < Z1 + 4) return [9, M.sidewalk];
    if ((z > 36 && z < 42) || (z > 256 && z < 262) || (x > 12 && x < 18) || (x > 302 && x < 308)) return [9, M.asphalt];
    if ((x % 14 === 0 && ((z > 10 && z < 34) || (z > 44 && z < 74) || (z > 226 && z < 254) || (z > 264 && z < 292))) || (z % 16 === 0 && (x < 12 || x > 308))) return [9, M.lineW];
    return [9, M.asphalt];
  });
  const SHOPS = [
    { n: 'MODE', w: M.plasterP, g: [M.goodsR, M.goodsB, M.goodsG, M.goodsY] },
    { n: 'HIFI', w: M.plasterB, g: [M.screen, M.plasticK] },
    { n: 'BIJOUX', w: M.marbleK, g: [M.gold, M.marble] },
    { n: 'JEUX', w: M.plasterY, g: [M.toy, M.goodsB, M.goodsY, M.plasticR] },
    { n: 'LUXE', w: M.marble, g: [M.perfume, M.bottle] },
    { n: 'SPORT', w: M.plasterG, g: [M.goodsB, M.goodsR, M.plasticW] },
    { n: 'LIVRE', w: M.plasterO, g: [M.goodsR, M.goodsB, M.goodsG, M.goodsY] },
    { n: 'CUIR', w: M.plasterC, g: [M.leather, M.goodsR, M.plasticW] },
  ];
  b.building({ x0: X0, z0: Z0, x1: X1, z1: Z1, floors: 2, fh: FH, wall: M.plasterW, floor0: M.floorTile, floorMat: M.floorTile, roof: M.concrete, parapet: 2, parapetMat: M.plasterW,
    facade: (u, yl, f, side, len) => {
      if (u === 0 || u === len - 1) return M.plasterW;
      if (side <= 1 && f === 0 && u >= 100 && u < 140) return yl < 9 ? ((u - 100) % 10 < 6 && yl < 7 ? 0 : M.glass) : M.plasterW;
      if (side >= 2 && f === 0 && (u - 1) >= (AZ0 - Z0) && (u - 1) < (AZ1 - Z0)) return yl < 8 ? 0 : M.glass;
      return (yl >= 3 && yl < 10 && u % 12 >= 2 && u % 12 < 10) ? M.glassB : M.plasterW;
    },
    stairs: { x: X0 + 104, z: Z0 + 2 },
    interior: (f, y) => {
      // galerie centrale, vitrines des deux côtés
      for (let u = 0; u < 10; u++) {
        const sx = X0 + 2 + u * 24, S = SHOPS[(u + f * 3) % SHOPS.length];
        if (u === 4) continue;
        for (const [zf, zb, face, sgn] of [[AZ0 - 1, Z0 + 1, 'S', 1], [AZ1, Z1 - 2, 'N', -1]]) {
          b.fill(sx, y, zf, sx + 22, y + 9, zf + 1, (x, yy) => (x === sx || x === sx + 21) ? S.w : (x >= sx + 9 && x < sx + 13 && yy < y + 6) ? 0 : M.glass);
          b.fill(sx, y + 9, zf, sx + 22, y + FH - 1, zf + 1, S.w);
          b.text(S.n, sx + 11, y + 9, zf + sgn, face, f ? M.neonB : M.neonP);
          b.fill(sx + 21, y, Math.min(zf, zb), sx + 22, y + FH - 1, Math.max(zf, zb) + 1, S.w);
          for (let k = 0; k < 3; k++) b.shelf(sx + 2, (sgn > 0 ? zf - 6 : zf + 4) - sgn * k * 12, 17, 0, R, S.g);
          b.fill(sx + 14, y, zf - sgn * 3, sx + 19, y + 3, zf - sgn * 3 + 1, M.woodD); b.set(sx + 16, y + 3, zf - sgn * 3, M.screen);
        }
      }
      if (f === 1) {
        // vide sur la galerie, coursives de 4 cubes de chaque côté
        b.fill(X0 + 1, y - 1, AZ0 + 4, X1 - 1, y, AZ1 - 4, (x) => (x >= X0 + 96 && x < X0 + 124 ? M.floorTile : 0));
        b.fill(X0 + 1, y, AZ0 + 3, X1 - 1, y + 2, AZ0 + 4, (x) => (x >= X0 + 96 && x < X0 + 124 ? -1 : M.glass));
        b.fill(X0 + 1, y, AZ1 - 4, X1 - 1, y + 2, AZ1 - 3, (x) => (x >= X0 + 96 && x < X0 + 124 ? -1 : M.glass));
        // restauration à l'étage
        for (let x = X0 + 100; x < X0 + 122; x += 6) for (let z = AZ0 + 3; z < AZ1 - 3; z += 6) b.table(x, z, M.plasticW, M.plasticR);
        b.text('RESTAURATION', X0 + 110, y + 9, AZ0 - 1, 'N', M.neonY);
      } else {
        // fontaine et palmiers
        b.cyl(X0 + 60, 150, 7, y, y + 2, M.marble, 1.3); b.cyl(X0 + 60, 150, 6, y, y + 1, M.water);
        b.cyl(X0 + 60, 150, 1.5, y, y + 5, M.marble);
        for (const x of [X0 + 30, X0 + 150, X0 + 190]) { b.planter(x, 146, 6, 6, M.hedge); b.tree(x + 3, 149, 8, 3, M.palm); }
        // caisses du supermarché
        for (let x = X0 + 100; x < X0 + 122; x += 5) { b.fill(x, y, AZ0 + 2, x + 3, y + 2, AZ0 + 4, M.plasticG); b.set(x + 1, y + 2, AZ0 + 2, M.screen); }
      }
    } });
  // escalators vers l'étage
  b.flight(X0 + 70, AZ0 + 8, 0, FH, 3, M.alu, 1);
  b.fill(X0 + 70, 1, AZ0 + 7, X0 + 70 + FH, 3, AZ0 + 8, M.plasticK); b.fill(X0 + 70, 1, AZ0 + 11, X0 + 70 + FH, 3, AZ0 + 12, M.plasticK);
  b.fill(X0 + 70 + FH, FH, AZ0 + 4, X0 + 70 + FH + 4, FH + 1, AZ1 - 4, M.floorTile);
  // verrière sur la galerie
  b.fill(X0 + 1, 2 * FH, AZ0, X1 - 1, 2 * FH + 1, AZ1, (x) => (x % 10 === 0 ? M.steelB : M.glass));
  b.text('CENTRE COMMERCIAL', 160, 20, Z1, 'S', M.neonP);
  b.text('BOURRIN SHOPPING', 160, 20, Z0 - 1, 'N', M.neonB);
  // parkings : voitures, chariots, lampadaires
  for (const [z0, z1] of [[10, 34], [44, 74], [226, 254], [264, 292]]) for (let x = 2; x < 316; x += 14) {
    if (R() < 0.72) b.car(x + 10, z0 + 2, 1, R.pick(CARS));
    if (z1 - z0 > 26 && R() < 0.5) b.car(x + 10, z1 - 12, 1, R.pick(CARS));
  }
  for (let x = 20; x < 310; x += 42) { b.lamp(x, 39, 12, 1); b.lamp(x, 259, 12, 3); }
  for (let k = 0; k < 18; k++) { const x = R.int(20, 300), z = R.pick([76, 78, 224]); b.fill(x, 1, z, x + 2, 2, z + 2, M.alu); b.fill(x, 0, z, x + 1, 1, z + 1, M.plasticK); b.fill(x + 1, 0, z + 1, x + 2, 1, z + 2, M.plasticK); }
  b.bus(20, 38, 0, M.carB);
  return {
    spawn: { x: 160, z: 234, yaw: 0 },
    cam: { x: 330, y: 50, z: 300, tx: 160, ty: 8, tz: 150 },
  };
}

// ======================================================================== LA BASE LUNAIRE
function moonH(x, z) {
  let h = 9 + Math.round(2.2 * Math.sin(x * 0.045) * Math.cos(z * 0.038) + 1.5 * Math.sin((x + z) * 0.09));
  const flat = Math.max(Math.abs(x - 150) - 95, Math.abs(z - 150) - 95);
  if (flat < 0) h = 9; else if (flat < 12) h = Math.round(9 + (h - 9) * flat / 12);
  for (const [cx, cz, r] of [[26, 30, 18], [270, 40, 22], [30, 270, 14], [282, 280, 20], [150, 22, 10], [290, 160, 12]]) {
    const d = Math.hypot(x - cx, z - cz) / r;
    if (d < 1) h = Math.min(h, Math.round(9 - 4 * (1 - d * d)));
    else if (d < 1.35) h = Math.max(h, Math.round(9 + 2 * (1 - (d - 1) / 0.35)));
  }
  return Math.max(3, h);
}
function moon(W) {
  const b = new Builder(W), R = rng(1969);
  baseGround(W, (x, z) => [moonH(x, z), moonH(x, z) < 9 ? M.regolithD : M.regolith],
    (d, y) => (y <= 3 ? M.moonrock : d <= 3 ? M.regolith : R() < 0.15 ? M.moonrock : M.regolithD));
  for (let i = 0; i < 70; i++) { const x = R.int(4, 296), z = R.int(4, 296); if (Math.abs(x - 150) < 100 && Math.abs(z - 150) < 100) continue; b.sphere(x, moonH(x, z) - 10 + 0.5, z, R.range(1.2, 3.2), M.moonrock); }
  // ---------- dôme central
  const DX = 150, DZ = 150, DR = 26;
  b.cyl(DX, DZ, DR + 1, 0, 1, M.concrete);
  b.sphere(DX, 1, DZ, DR, (x, y, z) => {
    const dx = x + 0.5 - DX, dy = y + 0.5 - 1, dz = z + 0.5 - DZ, d = Math.hypot(dx, dy, dz);
    if (y < 1 || d < DR - 1.2) return -1;
    const lon = Math.atan2(dz, dx), lat = Math.asin(Math.min(1, dy / d));
    return (Math.abs(((lon + 7) % (Math.PI / 6)) - Math.PI / 12) > Math.PI / 12 - 0.06 || Math.abs((lat % 0.3) - 0.15) > 0.13) ? M.steel : M.moonGlass;
  });
  // serre sous le dôme
  for (let k = 0; k < 6; k++) {
    const z = DZ - 15 + k * 6;
    b.fill(DX - 16, 1, z, DX + 16, 2, z + 3, M.plank); b.fill(DX - 15, 2, z + 1, DX + 15, 3, z + 2, M.dirt);
    for (let x = DX - 14; x < DX + 14; x += 2) b.fill(x, 3, z + 1, x + 1, 3 + R.int(1, 3), z + 2, R() < 0.2 ? M.fruitR : R() < 0.3 ? M.flowerY : M.leaves);
  }
  b.fill(DX - 3, 1, DZ - 22, DX + 4, 3, DZ - 19, M.plasticW); b.set(DX, 3, DZ - 21, M.screen);
  // ---------- modules d'habitation reliés au dôme
  const modX = (x0, x1, zc, label) => {
    for (let x = x0; x < x1; x++) for (let y = 1; y < 16; y++) for (let z = zc - 8; z <= zc + 8; z++) {
      const d = Math.hypot(y + 0.5 - 8.5, z + 0.5 - zc);
      if (d > 7.2) continue;
      const end = x === x0 || x === x1 - 1;
      if (d < 6 && !end) { b.set(x, y, z, y === 3 ? M.carpetG : 0); continue; }
      let m = (x - x0) % 12 < 2 ? M.hullStripe : M.hull;
      if (Math.abs(y + 0.5 - 10) < 1 && (x - x0) % 4 < 2 && !end) m = M.moonGlass;
      b.set(x, y, z, m);
    }
    for (let x = x0 + 3; x < x1 - 3; x += 10) { b.fill(x, 0, zc - 5, x + 1, 2, zc - 4, M.steel); b.fill(x, 0, zc + 4, x + 1, 2, zc + 5, M.steel); }
    for (let x = x0 + 4; x < x1 - 4; x += 8) { b.fill(x, 4, zc - 3, x + 3, 5, zc + 3, M.plasticW); b.set(x + 1, 5, zc - 3, M.screen); }
    if (label) b.text(label, (x0 + x1) >> 1, 10, zc - 8, 'N', M.hullStripe);
  };
  modX(DX + DR - 2, DX + DR + 46, DZ, 'LABO');
  modX(DX - DR - 46, DX - DR + 2, DZ, 'DORTOIR');
  // module nord (axe z)
  for (let z = DZ - DR - 40; z < DZ - DR + 2; z++) for (let y = 1; y < 14; y++) for (let x = DX - 7; x <= DX + 7; x++) {
    const d = Math.hypot(y + 0.5 - 7.5, x + 0.5 - DX);
    if (d > 6.2) continue;
    const end = z === DZ - DR - 40;
    if (d < 5 && !end) { b.set(x, y, z, y === 3 ? M.carpetG : 0); continue; }
    b.set(x, y, z, (z % 12 < 2) ? M.hullStripe : Math.abs(y + 0.5 - 9) < 1 && z % 4 < 2 && !end ? M.moonGlass : M.hull);
  }
  // ---------- panneaux solaires
  for (let row = 0; row < 7; row++) for (let seg = 0; seg < 4; seg++) {
    const x = 196 + seg * 22, z = 60 + row * 9;
    b.fill(x + 9, 0, z + 2, x + 10, 4, z + 3, M.steel);
    for (let k = 0; k < 5; k++) b.fill(x, 4, z + k, x + 20, 5 + (k >> 1), z + k + 1, (xx, y) => (y === 4 + (k >> 1) ? M.solar : M.steel));
  }
  // ---------- aire d'alunissage et module lunaire
  const LX = 70, LZ = 230;
  b.cyl(LX, LZ, 20, -1, 0, M.concrete); b.cyl(LX, LZ, 18.5, -1, 0, M.concreteD, 1);
  b.text('H', LX + 2, -1, LZ + 1, 'S', M.lineY);
  for (const [dx, dz] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { b.line(LX + dx, 0, LZ + dz, LX + dx * 0.5, 5, LZ + dz * 0.5, M.steel); b.fill(LX + dx - 1, 0, LZ + dz - 1, LX + dx + 2, 1, LZ + dz + 2, M.foil); }
  b.fill(LX - 5, 5, LZ - 5, LX + 6, 10, LZ + 6, (x, y, z) => ((x + y + z) % 3 === 0 ? M.hullK : M.foil));
  b.fill(LX - 4, 10, LZ - 4, LX + 5, 16, LZ + 4, (x, y, z) => (y === 13 && z === LZ - 4 && Math.abs(x - LX) < 2 ? M.moonGlass : M.hull));
  b.fill(LX, 16, LZ, LX + 1, 21, LZ + 1, M.steel); b.fill(LX - 2, 20, LZ, LX + 3, 21, LZ + 1, M.foil);
  // ---------- la fusée sur son pas de tir
  const FX0 = 236, FZ0 = 228;
  b.cyl(FX0, FZ0, 14, 0, 2, M.concreteD);
  b.cyl(FX0, FZ0, 5.5, 2, 60, (x, y) => (y % 14 < 2 ? M.hullK : y > 48 && y < 52 ? M.hullStripe : M.hull));
  for (let y = 60; y < 70; y++) b.cyl(FX0, FZ0, 5.5 * (1 - (y - 60) / 10) + 0.3, y, y + 1, M.hull);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 0; k < 10; k++) b.fill(FX0 + dx * (5 + k * 0.5), 2 + k, FZ0 + dz * (5 + k * 0.5), FX0 + dx * (5 + k * 0.5) + 1, 12, FZ0 + dz * (5 + k * 0.5) + 1, M.hullStripe);
  b.fill(FX0 + 10, 2, FZ0 - 2, FX0 + 13, 64, FZ0 + 1, (x, y, z) => ((x + y + z) % 2 === 0 ? M.steel : M.craneY));
  b.fill(FX0 + 5, 50, FZ0 - 1, FX0 + 11, 51, FZ0, M.steel);
  // ---------- antenne parabolique
  b.fill(60, 0, 70, 62, 14, 72, M.steel);
  b.sphere(61, 26, 71, 10, (x, y, z) => (Math.hypot(x + 0.5 - 61, y + 0.5 - 26, z + 0.5 - 71) > 8.8 && y < 20 ? M.hull : -1));
  b.fill(61, 14, 71, 62, 22, 72, M.steel);
  // ---------- rovers
  const rover = (x, z, rot) => {
    const o = b.local(x, z, rot);
    for (const u of [0, 5, 10]) { o.set(u, 0, 0, M.tire); o.set(u, 0, 5, M.tire); }
    o.fill(0, 1, 0, 11, 2, 6, M.foil); o.fill(2, 2, 1, 9, 3, 5, M.hull); o.fill(3, 3, 1, 4, 5, 2, M.steel); o.fill(8, 2, 2, 9, 6, 3, M.steel); o.set(8, 6, 2, M.solar);
  };
  rover(100, 120, 0); rover(196, 196, 1); rover(120, 206, 2);
  // radiateurs et panneau d'accueil
  for (let k = 0; k < 4; k++) b.fill(96 + k * 4, 0, 196, 97 + k * 4, 10, 204, M.hullW);
  b.fill(124, 0, 196, 125, 9, 197, M.steel); b.fill(176, 0, 196, 177, 9, 197, M.steel);
  b.fill(124, 9, 196, 177, 16, 197, M.hull);
  b.text('BASE LUNAIRE', 150, 10, 197, 'S', M.hullStripe);
  return {
    spawn: { x: 150, z: 212, yaw: 0 },
    cam: { x: 250, y: 40, z: 290, tx: 150, ty: 8, tz: 150 },
  };
}


// ======================================================================== LE CHÂTEAU
function chateau(W) {
  const b = new Builder(W), R = rng(1214);
  const C0 = 70, C1 = 230, T = 5, H = 30;                 // enceinte : carré [C0, C1), murs de 5 d'épaisseur, 12 m
  const inMoat = (x, z) => { const o = x >= 52 && x < 248 && z >= 52 && z < 248, i = x >= 66 && x < 234 && z >= 66 && z < 234; return o && !i; };
  baseGround(W, (x, z) => {
    if (inMoat(x, z)) return [3, M.dirt];
    if (x >= 146 && x < 154 && z >= 248) return [9, M.path];
    if (z < 50 && (x < 60 || x > 240) && Math.floor(x / 6) % 2 === 0) return [9, M.dirt];
    if (z > 250 && (x < 120 || x > 180) && Math.floor(z / 5) % 3 === 0) return [9, M.hay];
    return [9, M.grass];
  });
  // ---------- l'enceinte
  const merlon = (x, z) => ((x + z) >> 1) % 2 === 0;
  b.fill(C0, 0, C0, C1, H + 2, C1, (x, y, z) => {
    const d = Math.min(x - C0, C1 - 1 - x, z - C0, C1 - 1 - z);
    if (d >= T) return -1;
    if (y >= H) return d === 0 && y === H && merlon(x, z) ? M.stoneG : d === T - 1 && y === H ? M.stoneG : 0;
    if (d <= 1 && y >= 10 && y <= 14 && (x + z) % 14 === 0 && d === 0) return 0;
    return y < 4 ? M.stoneD : M.stoneG;
  });
  // tours d'angle, rondes, toits coniques et bannières
  const tower = (cx, cz, r, h, roof = M.slate) => {
    b.cyl(cx, cz, r, -7, 0, M.stoneD);
    b.cyl(cx, cz, r, 0, h, (x, y) => (y < 4 ? M.stoneD : M.stoneG), 2);
    for (let f = 11; f < h; f += 11) b.cyl(cx, cz, r - 1.5, f, f + 1, M.plank);
    b.cyl(cx, cz, r + 0.8, h, h + 1, M.stoneG);
    b.cyl(cx, cz, r + 0.8, h + 1, h + 2, (x, y, z) => (merlon(x, z) ? M.stoneG : -1), 1.2);
    const L = Math.round(r * 1.6);
    for (let k = 0; k < L; k++) b.cyl(cx, cz, Math.max(0.8, (r + 1) * (1 - k / L)), h + 1 + k, h + 2 + k, roof, 2);
    b.fill(cx, h + 1 + L, cz, cx + 1, h + 7 + L, cz + 1, M.steel);
    b.fill(cx + 1, h + 3 + L, cz, cx + 6, h + 6 + L, cz + 1, M.banner);
    // meurtrières
    for (let y = 8; y < h - 4; y += 10) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.fill(cx + dx * r - (dx > 0 ? 1 : 0), y, cz + dz * r - (dz > 0 ? 1 : 0), cx + dx * r + (dx < 0 ? 1 : 0) + (dx ? 0 : 1), y + 4, cz + dz * r + (dz < 0 ? 1 : 0) + (dz ? 0 : 1), 0);
  };
  for (const [x, z] of [[C0 + 2, C0 + 2], [C1 - 2, C0 + 2], [C0 + 2, C1 - 2], [C1 - 2, C1 - 2]]) {
    tower(x, z, 11, 44);
    const inx = x < 150 ? 1 : -1, inz = z < 150 ? 1 : -1;
    b.fill(x + inx * 8 - 2, 0, z + inz * 8 - 2, x + inx * 8 + 2, 7, z + inz * 8 + 2, 0);
  }
  // châtelet : deux tours, passage voûté, herse relevée
  tower(136, C1 - 1, 8, 38); tower(164, C1 - 1, 8, 38);
  b.fill(142, 0, C1 - 8, 158, 11, C1 + 4, (x, y) => (y >= 9 && (x - 142 < y - 8 || 157 - x < y - 8) ? -1 : 0));
  b.fill(141, 11, C1 - 7, 159, H, C1 + 4, M.stoneG);
  b.fill(142, 7, C1 + 1, 158, 11, C1 + 2, (x, y) => (x % 2 === 0 || y % 2 === 0 ? M.steel : 0));
  b.fill(142, 11, C1 + 1, 158, 12, C1 + 2, M.steel);
  // pont-levis abaissé et ses chaînes
  b.fill(144, -1, C1 + 4, 156, 0, 249, (x) => (x % 3 === 0 ? M.woodD : M.plank));
  for (let k = 0; k < 7; k++) { b.set(144, k + 1, 248 - k * 2, M.steel); b.set(144, k + 1, 247 - k * 2, M.steel); b.set(155, k + 1, 248 - k * 2, M.steel); b.set(155, k + 1, 247 - k * 2, M.steel); }
  b.fill(144, 8, C1 + 4, 145, 9, 236, M.steel); b.fill(155, 8, C1 + 4, 156, 9, 236, M.steel);

  // ---------- le donjon
  const K0 = 122, K1 = 178, KZ0 = 88, KZ1 = 144, KF = 4, KH = 12;
  b.building({ x0: K0, z0: KZ0, x1: K1, z1: KZ1, floors: KF, fh: KH, wall: M.stoneG, slab: M.plank, floor0: M.stone, roof: M.stoneG, parapet: 0,
    facade: (u, yl, f, side, len) => {
      if (u < 2 || u > len - 3) return M.stoneD;
      if (f === 0 && side === 1 && u >= 24 && u < 32 && yl < 9) return 0;
      return (u % 9 === 4 && yl >= 4 && yl < 10 && f > 0) ? M.glassG : f === 0 && yl < 3 ? M.stoneD : M.stoneG;
    },
    stairs: { x: K0 + 3, z: KZ0 + 3 },
    interior: (f, y) => {
      if (f === 0) {
        // grande salle : tables, bancs, trône, cheminée, bannières
        b.fill(K0 + 22, y - 1, KZ0 + 6, K0 + 34, y, KZ1 - 2, M.carpetR);
        for (const tx of [K0 + 10, K0 + 40]) { b.fill(tx, y, KZ0 + 12, tx + 4, y + 2, KZ1 - 10, M.woodD); b.fill(tx - 2, y, KZ0 + 12, tx - 1, y + 1, KZ1 - 10, M.wood); b.fill(tx + 5, y, KZ0 + 12, tx + 6, y + 1, KZ1 - 10, M.wood); for (let z = KZ0 + 13; z < KZ1 - 10; z += 4) b.set(tx + 2, y + 2, z, R.pick([M.bottle, M.fruitR, M.bronze, M.gold])); }
        b.fill(K0 + 24, y, KZ0 + 1, K0 + 32, y + 1, KZ0 + 6, M.stone);
        b.fill(K0 + 26, y + 1, KZ0 + 2, K0 + 30, y + 3, KZ0 + 4, M.gold); b.fill(K0 + 26, y + 3, KZ0 + 1, K0 + 30, y + 7, KZ0 + 2, M.gold); b.fill(K0 + 27, y + 3, KZ0 + 2, K0 + 29, y + 4, KZ0 + 4, M.carpetR);
        b.fill(K0 + 42, y, KZ0 + 1, K0 + 52, y + 8, KZ0 + 4, (x, yy) => (x > K0 + 44 && x < K0 + 50 && yy < y + 4 ? (yy === y ? M.lamp : 0) : M.stoneD));
        for (let x = K0 + 6; x < K1 - 6; x += 10) { b.fill(x, y + 3, KZ0 + 1, x + 3, y + 10, KZ0 + 2, M.banner); b.fill(x, y + 3, KZ1 - 2, x + 3, y + 10, KZ1 - 1, M.awnB); }
        b.sphere(K0 + 28, y + 8, KZ0 + 28, 1.8, (x, yy, z) => ((x + yy + z) % 2 ? M.lamp : M.bronze)); b.fill(K0 + 28, y + 9, KZ0 + 28, K0 + 29, y + 11, KZ0 + 29, M.bronze);
      } else if (f === 1) {
        // armurerie
        for (let x = K0 + 16; x < K1 - 4; x += 6) { b.fill(x, y, KZ0 + 2, x + 4, y + 6, KZ0 + 3, M.woodD); for (let k = 0; k < 4; k++) b.fill(x + k, y + 1, KZ0 + 3, x + k + 1, y + 5, KZ0 + 4, M.steel); }
        for (let z = KZ0 + 10; z < KZ1 - 6; z += 8) { b.fill(K1 - 2, y + 2, z - 1, K1 - 1, y + 6, z + 2, M.awnR); b.set(K1 - 3, y + 4, z, M.gold); }
      } else if (f === 2) {
        // chambres
        for (let x = K0 + 16; x < K1 - 10; x += 14) { b.fill(x, y, KZ0 + 4, x + 7, y + 1, KZ0 + 12, M.woodD); b.fill(x, y + 1, KZ0 + 4, x + 7, y + 2, KZ0 + 12, M.carpetR); b.fill(x, y + 1, KZ0 + 4, x + 7, y + 3, KZ0 + 5, M.plasticW); for (const [dx, dz] of [[0, 4], [6, 4], [0, 11], [6, 11]]) b.fill(x + dx, y, KZ0 + dz, x + dx + 1, y + 7, KZ0 + dz + 1, M.woodD); b.fill(x, y + 7, KZ0 + 4, x + 7, y + 8, KZ0 + 12, M.banner); }
      } else {
        // le trésor
        for (let x = K0 + 16; x < K1 - 6; x += 7) for (let z = KZ0 + 10; z < KZ1 - 8; z += 9) { b.fill(x, y, z, x + 4, y + 3, z + 3, M.woodD); b.fill(x, y + 3, z, x + 4, y + 4, z + 3, R() < 0.5 ? M.gold : M.bronze); }
      }
    } });
  // créneaux, tourelles d'angle, bannière sur le donjon
  const KT = KF * KH;
  b.text('BOURRINFORT', 150, KT - 9, KZ1, 'S', M.gold);
  b.walls(K0, KZ0, K1, KZ1, KT + 1, KT + 2, M.stoneG);
  b.fill(K0, KT + 2, KZ0, K1, KT + 3, KZ1, (x, y, z) => ((x === K0 || x === K1 - 1 || z === KZ0 || z === KZ1 - 1) && merlon(x, z) ? M.stoneG : -1));
  for (const [x, z] of [[K0 + 2, KZ0 + 2], [K1 - 3, KZ0 + 2], [K0 + 2, KZ1 - 3], [K1 - 3, KZ1 - 3]]) tower(x, z, 4.5, KT + 8, M.slate);
  b.fill(150, KT + 1, 116, 151, KT + 16, 117, M.steel); b.fill(151, KT + 10, 116, 161, KT + 16, 117, M.banner);

  // ---------- la cour : puits, écuries, forge, chapelle, charrettes
  b.cyl(150, 190, 3.5, 0, 3, M.stoneD, 1.3); b.cyl(150, 190, 2.2, -12, 3, 0);
  b.fill(147, 3, 190, 148, 8, 191, M.woodD); b.fill(152, 3, 190, 153, 8, 191, M.woodD); b.fill(147, 8, 190, 153, 9, 191, M.woodD); b.fill(147, 9, 189, 153, 10, 192, M.tile);
  b.building({ x0: 80, z0: 176, x1: 122, z1: 200, floors: 1, fh: 9, wall: M.wood, slab: M.plank, roof: M.plank, parapet: 0,
    facade: (u, yl, f, side) => (side === 0 && u % 7 > 1 && u % 7 < 6 && yl < 7) ? 0 : (u % 4 === 0 ? M.woodD : M.wood),
    interior: (f, y) => { for (let x = 83; x < 120; x += 7) { b.fill(x, y, 190, x + 1, y + 4, 199, M.woodD); b.sphere(x + 3.5, y + 1, 195, 2.2, M.hay, true); } } });
  b.gable(80, 176, 122, 200, 10, M.thatch, M.wood, 'x');
  b.building({ x0: 180, z0: 176, x1: 206, z1: 200, floors: 1, fh: 10, wall: M.stoneD, roof: M.stoneD, parapet: 0,
    facade: (u, yl, f, side) => (side === 0 && u >= 8 && u < 16 && yl < 7) ? 0 : M.stoneD,
    interior: (f, y) => { b.fill(186, y, 190, 194, y + 3, 197, M.brick); b.fill(188, y + 3, 192, 192, y + 4, 195, M.lamp); b.fill(197, y, 185, 200, y + 2, 187, M.steel); b.fill(189, y + 4, 193, 191, y + 12, 195, M.brick); } });
  b.gable(180, 176, 206, 200, 11, M.slate, M.stoneD, 'x');
  b.building({ x0: 186, z0: 82, x1: 214, z1: 118, floors: 1, fh: 16, wall: M.stone, roof: M.stone, parapet: 0,
    facade: (u, yl, f, side) => (side === 1 && u >= 12 && u < 16 && yl < 8) ? 0 : (side >= 2 && u % 6 === 3 && yl > 4 && yl < 13) ? (yl > 9 ? M.glassB : M.glassG) : M.stone,
    interior: (f, y) => { for (let z = 88; z < 110; z += 3) { b.fill(189, y, z, 198, y + 2, z + 1, M.wood); b.fill(202, y, z, 211, y + 2, z + 1, M.wood); } b.fill(195, y, 84, 205, y + 3, 86, M.marble); b.set(197, y + 3, 85, M.lamp); b.set(203, y + 3, 85, M.lamp); } });
  b.gable(186, 82, 214, 118, 17, M.tile, M.stone, 'z');
  b.fill(198, 26, 112, 203, 36, 118, M.stone); b.sphere(200.5, 32, 118.6, 1.4, M.bronze);
  for (const [x, z, rot] of [[110, 150, 0], [196, 150, 1], [100, 214, 0]]) {
    const o = b.local(x, z, rot);
    o.fill(0, 1, 0, 9, 2, 5, M.plank); o.fill(0, 2, 0, 9, 4, 1, M.plank); o.fill(0, 2, 4, 9, 4, 5, M.plank);
    for (const [u, v] of [[1, -1], [7, -1], [1, 5], [7, 5]]) o.fill(u, 0, v, u + 2, 2, v + 1, M.woodD);
    o.fill(1, 2, 1, 8, 4, 4, () => R.pick([M.hay, M.fruitR, M.fruitO, M.hay]));
  }
  for (let i = 0; i < 14; i++) { const x = R.int(80, 220), z = R.int(154, 218); if (b.get(x, 0, z) || b.get(x + 1, 0, z + 1)) continue; b.cyl(x, z, 1.4, 0, 3, (xx, y) => (y === 1 ? M.steel : M.wood)); }
  for (const [x, z] of [[92, 156], [206, 210], [140, 212], [168, 162]]) b.sphere(x, 1.5, z, 3, M.hay, true);
  for (const [x, z] of [[90, 100], [100, 130], [205, 140], [215, 160]]) b.tree(x, z, 10, 3.6);

  // ---------- le village, hors les murs
  const HOUSES = [[20, 14, 44, 34], [54, 12, 78, 32], [96, 16, 120, 36], [178, 14, 204, 34], [214, 18, 238, 38], [20, 262, 44, 282], [250, 262, 274, 282]];
  for (const [x0, z0, x1, z1] of HOUSES) {
    b.building({ x0, z0, x1, z1, floors: 2, fh: 8, wall: M.plasterC, slab: M.plank, roof: M.plank, parapet: 0,
      facade: (u, yl, f, side, len) => (u % 5 === 0 || yl === 1 || yl === 7 || u === len - 1) ? M.woodD : (yl >= 3 && yl < 6 && u % 5 === 2) ? M.glass : (u % 5 === 2 || u % 5 === 3) && ((yl + u) % 3 === 0) ? M.woodD : M.plasterC,
      doors: [{ side: z0 < 150 ? 1 : 0, u: (x1 - x0) >> 1, w: 3, h: 6 }],
      interior: (f, y) => { b.table(x0 + 4, z0 + 4, M.woodD, M.wood); b.fill(x1 - 5, y, z0 + 2, x1 - 2, y + 3, z0 + 5, M.stoneD); } });
    b.gable(x0, z0, x1, z1, 17, M.tile, M.plasterC, 'x');
  }
  // moulin à vent
  b.cyl(272, 40, 6, 0, 26, (x, y) => (y % 7 === 0 ? M.woodD : M.plasterW), 1.5);
  b.cyl(272, 40, 6.5, 26, 27, M.woodD);
  for (let k = 0; k < 7; k++) b.cyl(272, 40, 6 - k * 0.8, 27 + k, 28 + k, M.thatch);
  b.fill(272, 22, 33, 273, 23, 35, M.woodD);
  b.fill(271, 21, 32, 274, 24, 33, M.woodD);
  for (let s = 0; s < 4; s++) {
    const a = s * Math.PI / 2 + 0.4;
    b.line(272, 22, 32, 272 + Math.cos(a) * 16, 22 + Math.sin(a) * 16, 32, M.woodD);
    // toile en éventail depuis le moyeu : tout reste attaché
    for (let j = 1; j <= 3; j++) b.line(272, 22, 32, 272 + Math.cos(a) * 16 - Math.sin(a) * j, 22 + Math.sin(a) * 16 + Math.cos(a) * j, 32, M.plank);
  }
  b.fill(270, 0, 33, 275, 6, 34, 0);
  for (let i = 0; i < 40; i++) { const x = R.int(4, 296), z = R.int(4, 296); if ((x > 46 && x < 254 && z > 46 && z < 254) || b.get(x, 0, z) || b.get(x, 3, z)) continue; b.tree(x, z, R.int(8, 12), R.range(3, 4.2)); }
  for (let z = 252; z < 300; z += 10) { b.lamp(144, z, 8, 2); b.lamp(156, z + 5, 8, 0); }

  return {
    spawn: { x: 150, z: 268, yaw: 0 },
    cam: { x: 260, y: 55, z: 290, tx: 150, ty: 14, tz: 150 },
  };
}

// ======================================================================== LA CENTRALE NUCLÉAIRE
function centrale(W) {
  const b = new Builder(W), R = rng(1986);
  const RIV = 262;
  baseGround(W, (x, z) => {
    if (z >= RIV) return [3, M.wetsand];
    if (z >= RIV - 4) return [8, M.rock];
    if ((x >= 182 && x < 192) || (z >= 8 && z < 16) || (z >= 226 && z < 234 && x > 40)) return [9, M.asphalt];
    if (x > 250 && z > 18 && z < 92) return [9, (x % 12 === 0 && z % 30 > 4) ? M.lineW : M.asphalt];
    if (x > 34 && x < 318 && z > 20 && z < 256) return [9, M.tarmac];
    return [9, M.grass];
  });
  const steam = [];

  // ---------- les deux tours de refroidissement (hyperboloïdes)
  const coolingTower = (cx, cz) => {
    const H = 110, yw = 79, rw = 17, rb = 26, c = yw / Math.sqrt((rb / rw) ** 2 - 1);
    const rAt = (y) => rw * Math.sqrt(1 + ((y - yw) / c) ** 2);
    // pieds en V et ceinture de base
    const rTop = rAt(6) - 0.9;
    for (let k = 0; k < 36; k++) {
      const a = k / 36 * Math.PI * 2, x = cx + Math.cos(a) * (rb - 0.5), z = cz + Math.sin(a) * (rb - 0.5);
      b.line(x, 0, z, cx + Math.cos(a + 0.09) * rTop, 6, cz + Math.sin(a + 0.09) * rTop, M.concrete);
      b.line(x, 0, z, cx + Math.cos(a - 0.09) * rTop, 6, cz + Math.sin(a - 0.09) * rTop, M.concrete);
    }
    for (let y = 6; y < H; y++) b.cyl(cx, cz, rAt(y), y, y + 1, (xx, yy) => (yy === 7 || yy === H - 1 || yy === H - 12 ? M.concreteD : M.concrete), 1.7);
    // bassin d'eau et garnissage au pied
    b.cyl(cx, cz, rb - 1, -1, 0, M.concrete); b.cyl(cx, cz, rb - 2, 0, 1, M.water);
    const R8 = rAt(8) - 1.2;
    for (let x = Math.ceil(cx - R8); x <= cx + R8; x += 3) { const h = Math.floor(Math.sqrt(Math.max(0, R8 * R8 - (x + 0.5 - cx) ** 2))); b.fill(x, 8, cz - h, x + 1, 9, cz + h + 1, M.steel); }
    // on accroche le garnissage à la coque
    b.cyl(cx, cz, rAt(8) + 0.2, 8, 9, M.steel, 2.5);
    const rt = rAt(H - 1);
    steam.push({ x: cx + 0.5, y: H + 1, z: cz + 0.5, r: rt * 0.8, anchor: [Math.round(cx + rt - 0.8), H - 1, cz] });
  };
  coolingTower(70, 82); coolingTower(70, 196);

  // ---------- les deux bâtiments réacteurs (enceintes à dôme)
  const reactor = (cx, cz, n) => {
    b.cyl(cx, cz, 16, 0, 30, (x, y) => (y < 3 ? M.concreteD : M.concrete), 1.6);
    b.sphere(cx, 29.5, cz, 16, (x, y, z) => (y < 30 || Math.hypot(x + 0.5 - cx, y + 0.5 - 29.5, z + 0.5 - cz) < 14.4 ? -1 : M.concrete));
    b.cyl(cx, cz, 15, 0, 1, M.concrete);
    // piscine bleue de Tcherenkov, cuve, barres de combustible
    b.cyl(cx, cz, 7, 1, 7, M.steel, 1.2); b.cyl(cx, cz, 6, 1, 6, M.cherenkov);
    b.cyl(cx, cz, 3.2, 1, 11, M.coolant, 1); b.cyl(cx, cz, 3.2, 11, 12, M.coolant);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; b.fill(cx + Math.round(Math.cos(a) * 4.5), 1, cz + Math.round(Math.sin(a) * 4.5), cx + Math.round(Math.cos(a) * 4.5) + 1, 5, cz + Math.round(Math.sin(a) * 4.5) + 1, M.rod); }
    for (const [dx, dz] of [[-10, -5], [10, -5], [-10, 6], [10, 6]]) { b.cyl(cx + dx, cz + dz, 2.2, 1, 22, M.steel, 1); b.cyl(cx + dx, cz + dz, 2.4, 22, 23, M.steel); b.fill(cx + dx, 22, cz + dz, cx + (dx > 0 ? 15 : -14), 23, cz + dz + 1, M.steel); }
    b.cyl(cx, cz, 14.8, 26, 27, M.craneY, 1.5); b.fill(cx - 14, 26, cz - 1, cx + 15, 27, cz + 2, M.craneY);
    // sas d'équipement vers la salle des machines
    b.fill(cx + 13, 1, cz - 3, cx + 17, 8, cz + 4, 0);
    b.text(String(n), cx, 17, cz + 16, 'S', M.plasticR);
  };
  reactor(160, 102, 1); reactor(160, 168, 2);

  // ---------- salle des machines : deux lignes de turbines, pont roulant
  const T0 = 200, T1 = 300, TZ0 = 96, TZ1 = 174;
  b.building({ x0: T0, z0: TZ0, x1: T1, z1: TZ1, floors: 1, fh: 30, wall: M.zinc, roof: M.steelB, floor0: M.concrete, parapet: 0,
    facade: (u, yl, f, side) => (yl >= 20 && yl < 26 && u % 6 > 1) ? M.glassB : yl < 3 ? M.concreteD : (u % 4 === 0 ? M.steel : M.zinc) });
  for (const [z0, z1] of [[98, 108], [162, 172]]) b.fill(175, 1, z0, T0 + 1, 9, z1, (x, y, z) => (y === 1 || y === 8 || z === z0 || z === z1 - 1) ? M.concrete : 0);
  for (const zc of [120, 150]) {
    for (let x = T0 + 8; x < T1 - 20; x++) for (let y = 1; y < 14; y++) for (let z = zc - 7; z <= zc + 7; z++) {
      const seg = Math.floor((x - T0 - 8) / 14), r = seg % 2 ? 6.2 : 4.6;
      if (Math.hypot(y + 0.5 - 7, z + 0.5 - zc) > r) continue;
      b.set(x, y, z, (x - T0) % 14 === 0 ? M.steel : seg === 5 ? M.bronze : M.planeG);
    }
    b.fill(T1 - 20, 1, zc - 6, T1 - 6, 13, zc + 7, (x, y) => (y % 3 === 0 ? M.steel : M.trainB));
  }
  for (const z of [TZ0 + 2, TZ1 - 3]) b.fill(T0 + 1, 24, z, T1 - 1, 25, z + 1, M.steel);
  b.fill(T0 + 40, 25, TZ0 + 2, T0 + 44, 27, TZ1 - 2, M.craneY);
  b.text('TURBINES', 250, 30, TZ1, 'S', M.lineW);

  // ---------- cheminée de rejet
  b.cyl(120, 135, 4, 0, 1, M.concrete);
  b.cyl(120, 135, 3.2, 1, 100, (x, y) => (y > 80 && Math.floor(y / 5) % 2 ? M.plasticR : M.plasticW), 1.2);
  b.fill(123, 1, 135, 124, 96, 136, M.steel);

  // ---------- bâtiment de contrôle
  b.building({ x0: 200, z0: 24, x1: 248, z1: 64, floors: 3, fh: 10, wall: M.plasterW, parapet: 1, stairs: { x: 204, z: 28 },
    win: { period: 6, ww: 4, sill: 3, wh: 4, off: 1 }, doors: [{ side: 1, u: 22, w: 4 }],
    interior: (f, y) => {
      if (f !== 0) { for (let x = 212; x < 244; x += 7) for (let z = 36; z < 60; z += 8) b.desk(x, z, 0); return; }
      b.fill(212, y + 2, 25, 246, y + 8, 26, M.board);
      for (let k = 0; k < 7; k++) { const x = 213 + k * 4; b.fill(x, y, 34, x + 3, y + 2, 37, M.plasticG); b.fill(x, y + 2, 34, x + 3, y + 3, 35, M.screen); }
      for (let k = 0; k < 5; k++) { const x = 215 + k * 5; b.fill(x, y, 44, x + 3, y + 2, 46, M.plasticG); b.set(x + 1, y + 2, 44, M.screen); b.set(x + 1, y, 48, M.leather); }
      b.fill(234, y, 50, 240, y + 3, 56, M.plasticR);
    } });
  b.text('CONTROLE', 224, 22, 64, 'S', M.signB);

  // ---------- poste électrique, transformateurs, pylônes et lignes
  const trafo = (x, z) => {
    b.fill(x, 0, z, x + 8, 7, z + 6, (xx, y, zz) => (xx % 2 === 0 && (zz === z || zz === z + 5) ? M.zinc : M.steel));
    for (let k = 0; k < 3; k++) { b.fill(x + 1 + k * 3, 7, z + 2, x + 2 + k * 3, 11, z + 3, M.bronze); b.set(x + 1 + k * 3, 11, z + 2, M.plasticW); }
  };
  for (const x of [256, 272, 288, 304]) { trafo(x, 204); trafo(x, 240 - 22); }
  // pylône en treillis : quatre montants pleins qui se resserrent, croisillons qui passent par les montants
  const pylon = (x, z) => {
    const leg = (s, y) => Math.round(s * 4 * (1 - 0.72 * y / 34));
    for (let y = 0; y < 35; y++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.fill(x + leg(sx, y), y, z + leg(sz, y), x + leg(sx, y) + 2, y + 1, z + leg(sz, y) + 2, M.steel);
    for (let y = 5; y < 34; y += 6) {
      const a = leg(-1, y), c = leg(1, y) + 1;
      b.fill(x + a, y, z + a, x + c + 1, y + 1, z + a + 1, M.steel); b.fill(x + a, y, z + c, x + c + 1, y + 1, z + c + 1, M.steel);
      b.fill(x + a, y, z + a, x + a + 1, y + 1, z + c + 1, M.steel); b.fill(x + c, y, z + a, x + c + 1, y + 1, z + c + 1, M.steel);
    }
    b.fill(x - 10, 30, z - 1, x + 12, 31, z + 3, M.steel); b.fill(x - 1, 34, z - 1, x + 3, 41, z + 3, M.steel);
    for (const dx of [-9, 0, 9]) b.fill(x + dx, 27, z, x + dx + 1, 30, z + 1, M.plasticW);
  };
  const PYL = [[270, 236], [300, 236]];
  for (const [x, z] of PYL) pylon(x, z);
  for (const dx of [-9, 9]) {
    const [a, c] = PYL; let px = a[0] + dx, py = 27;
    for (let t = 1; t <= 30; t++) { const x = a[0] + dx + (c[0] - a[0]) * t / 30, y = 27 - 5 * Math.sin(Math.PI * t / 30); b.line(px, Math.round(py), a[1], x, Math.round(y), a[1], M.steel); px = x; py = y; }
  }

  // ---------- déchets : fûts jaunes, zone clôturée
  b.fill(96, -1, 222, 146, 0, 254, M.concreteD);
  for (let x = 100; x < 142; x += 4) for (let z = 226; z < 250; z += 4) { if (R() < 0.15) continue; b.cyl(x, z, 1.4, 0, 3, (xx, y) => (y === 1 ? M.plasticK : M.waste)); if (R() < 0.4) b.cyl(x, z, 1.4, 3, 6, (xx, y) => (y === 4 ? M.plasticK : M.waste)); }
  for (let x = 96; x <= 146; x += 5) b.fill(x, 0, 222, x + 1, 5, 223, M.steel);
  b.fill(96, 4, 222, 147, 5, 223, M.steel); b.fill(96, 1, 222, 147, 2, 223, M.steel);
  b.fill(106, 0, 221, 136, 7, 222, M.lineY); b.text('DANGER', 121, 1, 220, 'N', M.plasticK);

  // ---------- station de pompage sur le fleuve, canalisations vers les réacteurs
  b.building({ x0: 148, z0: 236, x1: 176, z1: 258, floors: 1, fh: 10, wall: M.concrete, parapet: 1, win: { period: 5, ww: 2, sill: 5, wh: 3 } });
  for (const x of [154, 166]) for (let z = 184; z < 237; z++) for (let y = 1; y < 6; y++) for (let xx = x - 2; xx <= x + 2; xx++) if (Math.hypot(y + 0.5 - 3.5, xx + 0.5 - x) <= 2.2) b.set(xx, y, z, M.steelB);
  for (const x of [154, 166]) for (let z = 190; z < 236; z += 9) b.fill(x - 1, 0, z, x + 1, 1, z + 1, M.concrete);
  b.fill(146, -6, RIV - 4, 178, 0, RIV, M.concrete);

  // ---------- clôture, parking, lampadaires
  for (let x = 36; x < 318; x += 10) for (const z of [20, 256]) { if (z === 20 && x > 176 && x < 196) continue; b.fill(x, 0, z, x + 1, 5, z + 1, M.steel); }
  for (const z of [20, 256]) b.fill(36, 4, z, 318, 5, z + 1, (x) => (z === 20 && x > 176 && x < 196 ? -1 : M.steel));
  for (let x = 254; x < 316; x += 12) for (const z of [24, 58]) if (R() < 0.75) b.car(x + 8, z, 1, R.pick(CARS));
  for (let z = 30; z < 250; z += 26) { b.lamp(180, z, 12, 0); b.lamp(193, z + 13, 12, 2); }
  for (let i = 0; i < 26; i++) { const x = R.int(4, 316), z = R.int(4, 18); if (b.get(x, 0, z)) continue; b.tree(x, z, R.int(8, 11), 3.4); }
  b.fill(58, 0, 20, 164, 8, 21, M.plasterW);
  b.text('CENTRALE DE BOURRINVILLE', 110, 2, 19, 'N', M.signB);

  return {
    spawn: { x: 186, z: 30, yaw: Math.PI * 0.9 },
    cam: { x: 300, y: 60, z: 10, tx: 130, ty: 20, tz: 140 },
    steam,
  };
}

export const LEVELS2 = [
  {
    id: 'port', name: 'La Zone Portuaire', sub: 'Port autonome · Quai 7', build: port, sx: 360, sy: 128, sz: 300, outerTop: portOuter,
    desc: 'Trois portiques géants, un porte-conteneurs à quai, des piles de conteneurs, des entrepôts et des cuves de carburant. Le fret est en retard, et il le restera.',
    tags: ['Portiques', 'Cargo', 'Conteneurs'], fragile: 3,
    sky: 0xa9bccb, fogNear: 110, fogFar: 380, sun: 0xfff0dc, sunI: 2.3, hemi: [0xdce8f4, 0x5a5a58, 1.25], sunPos: [-70, 90, 60],
    outer: 'sea', groundColor: 0x8c8b86,
  },
  {
    id: 'centre', name: 'Le Centre Commercial', sub: 'Bourrin Shopping · Niveaux 0 et 1', build: mall, sx: 320, sy: 80, sz: 300,
    desc: 'Deux étages de boutiques autour d\'une galerie vitrée, escalators, fontaine, restauration, et des centaines de voitures sur le parking. Les soldes commencent maintenant.',
    tags: ['Boutiques', 'Galerie', 'Parking'], fragile: 5,
    sky: 0x8fc2ea, fogNear: 100, fogFar: 360, sun: 0xfff6e0, sunI: 2.5, hemi: [0xd6ebff, 0x6a6456, 1.3], sunPos: [50, 100, 70],
    outer: 'city', groundColor: 0x6d6c68,
  },
  {
    id: 'chateau', name: 'Le Château', sub: 'Château de Bourrinfort · XIIIᵉ siècle', build: chateau, sx: 300, sy: 96, sz: 300,
    desc: 'Remparts crénelés, tours à poivrière, douves en eau, pont-levis, donjon et son trésor, écuries, forge, chapelle et le village au pied des murs. Huit siècles de résistance. Enfin, jusqu\'à aujourd\'hui.',
    tags: ['Donjon', 'Remparts', 'Douves'], fragile: 2,
    sky: 0xa8cbe8, fogNear: 110, fogFar: 380, sun: 0xfff0d4, sunI: 2.4, hemi: [0xe0eeff, 0x5d6a48, 1.25], sunPos: [-60, 80, 50],
    outer: 'field', groundColor: 0x5f8a3c, nappeY: 2.6,
  },
  {
    id: 'centrale', name: 'La Centrale Nucléaire', sub: 'Centrale de Bourrinville · Réacteurs 1 et 2', build: centrale, sx: 320, sy: 128, sz: 300,
    desc: 'Deux tours de refroidissement de 44 m qui fument, deux réacteurs sous dôme avec leur piscine bleue, la salle des turbines, le poste électrique et les fûts jaunes. Ne touchez à rien. Enfin, si.',
    tags: ['Tours de refroidissement', 'Réacteurs', 'Turbines'], fragile: 2,
    sky: 0xb4c2cc, fogNear: 120, fogFar: 400, sun: 0xfff2e0, sunI: 2.2, hemi: [0xe2ecf4, 0x5a6050, 1.25], sunPos: [70, 90, 60],
    outer: 'field', groundColor: 0x6a8a48, nappeY: 2.6,
  },
  {
    id: 'lune', name: 'La Base Lunaire', sub: 'Mer de la Tranquillité · Secteur 7', build: moon, sx: 300, sy: 80, sz: 300,
    desc: 'Un dôme de verre, des modules, des panneaux solaires, un module lunaire et une fusée prête au départ. Gravité : un sixième. Les débris retombent… lentement.',
    tags: ['Gravité ×0,17', 'Dôme', 'Fusée'], fragile: 4,
    sky: 0x000000, skyTop: 0x000004, skyBot: 0x05060a, fogColor: 0x000000, fogNear: 250, fogFar: 700,
    sun: 0xffffff, sunI: 3.2, hemi: [0x8090a0, 0x303030, 0.35], ambient: 0.12, sunPos: [80, 45, -30],
    outer: 'moon', groundColor: 0x85837e, gravity: 0.165, nappe: false,
  },
];
