// Le quartier en petits cubes de 40 cm : tout se casse, jusqu'au sous-sol.
// Monde en tableau d'octets, maillé par blocs de 32³ ; ce qui ne tient plus à la roche tombe d'un bloc.
import * as THREE from 'three';

export const VS = 0.4;          // arête d'un cube, en mètres
export const GROUND = 10;       // première couche au-dessus du sol (le dessus du sol est à 4 m)

// ------------------------------------------------------------------ matières
// [clé, couleur, dureté (points), valeur €/cube, catégorie, son, options]
// options : g = sol (ne compte pas dans le % de démolition), t = transparent, e = lueur, v = variation de teinte
const DEFS = [
  ['air', 0x000000, 0, 0, '', ''],
  ['bedrock', 0x26221f, 255, 0, 'Terrassement', 'plaster', { g: 1 }],
  ['rock', 0x6d6860, 9, 1, 'Terrassement', 'plaster', { g: 1, v: 0.1 }],
  ['clay', 0x8a5a3a, 3, 0.6, 'Terrassement', 'soft', { g: 1, v: 0.08 }],
  ['dirt', 0x6b4a2f, 2, 0.5, 'Terrassement', 'soft', { g: 1, v: 0.1 }],
  ['sand', 0xe2cf98, 1, 0.4, 'Terrassement', 'soft', { g: 1, v: 0.06 }],
  ['wetsand', 0xb9a473, 2, 0.4, 'Terrassement', 'soft', { g: 1, v: 0.06 }],
  ['grass', 0x5c8f37, 2, 1, 'Espaces verts', 'soft', { g: 1, v: 0.1 }],
  ['asphalt', 0x3a3b3d, 5, 6, 'Voirie', 'plaster', { g: 1, v: 0.05 }],
  ['lineW', 0xe8e6de, 5, 8, 'Voirie', 'plaster', { g: 1 }],
  ['lineY', 0xe0b12e, 5, 8, 'Voirie', 'plaster', { g: 1 }],
  ['sidewalk', 0xa9a59b, 5, 7, 'Voirie', 'plaster', { g: 1, v: 0.06 }],
  ['curb', 0xc9c5ba, 6, 9, 'Voirie', 'plaster', { g: 1 }],
  ['tarmac', 0x8c8b86, 6, 7, 'Voirie', 'plaster', { g: 1, v: 0.04 }],
  ['ballast', 0x75716a, 3, 3, 'Ferroviaire', 'plaster', { g: 1, v: 0.14 }],
  ['path', 0xa88a5c, 2, 1, 'Espaces verts', 'soft', { g: 1, v: 0.1 }],
  ['concrete', 0xa7a498, 8, 14, 'Maçonnerie', 'plaster', { v: 0.04 }],
  ['concreteD', 0x6f6e69, 8, 14, 'Maçonnerie', 'plaster', { v: 0.04 }],
  ['brick', 0x9a4b35, 5, 12, 'Maçonnerie', 'plaster', { v: 0.1 }],
  ['plasterW', 0xefebe0, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['plasterC', 0xe6d6b2, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['plasterO', 0xd9a35a, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['plasterP', 0xe79aa6, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['plasterB', 0x7fb6d8, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['plasterG', 0x97cf9d, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['plasterY', 0xf1d46a, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['plasterR', 0xc8503c, 3, 9, 'Maçonnerie', 'plaster', { v: 0.03 }],
  ['stone', 0xd8ccab, 7, 18, 'Maçonnerie', 'plaster', { v: 0.05 }],
  ['marble', 0xece9e2, 6, 40, 'Décoration', 'ceramic', { v: 0.03 }],
  ['marbleK', 0x2a2a2d, 6, 40, 'Décoration', 'ceramic', { v: 0.04 }],
  ['granite', 0xa98a80, 7, 25, 'Maçonnerie', 'plaster', { v: 0.06 }],
  ['glass', 0xbfe0ea, 1, 40, 'Vitrerie', 'glass', { t: 1 }],
  ['glassB', 0x4f86b8, 1, 45, 'Vitrerie', 'glass', { t: 1 }],
  ['glassG', 0x6fb39a, 1, 45, 'Vitrerie', 'glass', { t: 1 }],
  ['water', 0x3b8fb5, 1, 2, 'Décoration', 'splat', { t: 1 }],
  ['steel', 0x55595e, 12, 30, 'Métallerie', 'metal', { v: 0.04 }],
  ['steelB', 0x2f4f6f, 12, 30, 'Métallerie', 'metal', { v: 0.03 }],
  ['alu', 0xc4c8cc, 6, 25, 'Métallerie', 'metal', { v: 0.02 }],
  ['wood', 0x8a5c34, 3, 10, 'Charpente', 'wood', { v: 0.08 }],
  ['woodD', 0x4d3220, 3, 12, 'Charpente', 'wood', { v: 0.08 }],
  ['plank', 0xc39a62, 3, 10, 'Charpente', 'wood', { v: 0.1 }],
  ['bamboo', 0xc9b26a, 2, 6, 'Charpente', 'wood', { v: 0.1 }],
  ['thatch', 0xb3924f, 1, 4, 'Toiture', 'soft', { v: 0.1 }],
  ['tile', 0xa6482f, 3, 9, 'Toiture', 'ceramic', { v: 0.08 }],
  ['slate', 0x4a525c, 4, 11, 'Toiture', 'ceramic', { v: 0.05 }],
  ['zinc', 0x8d949b, 4, 10, 'Toiture', 'metal', { v: 0.04 }],
  ['leaves', 0x3f7a2a, 1, 3, 'Espaces verts', 'soft', { v: 0.14 }],
  ['palm', 0x4f9a32, 1, 4, 'Espaces verts', 'soft', { v: 0.14 }],
  ['trunk', 0x5a3d24, 3, 6, 'Espaces verts', 'wood', { v: 0.08 }],
  ['palmTrunk', 0x8d7050, 3, 6, 'Espaces verts', 'wood', { v: 0.1 }],
  ['hedge', 0x2f6a2a, 1, 3, 'Espaces verts', 'soft', { v: 0.12 }],
  ['flowerR', 0xd8344a, 1, 6, 'Espaces verts', 'soft', { v: 0.1 }],
  ['flowerY', 0xf2c230, 1, 6, 'Espaces verts', 'soft', { v: 0.1 }],
  ['flowerP', 0xd565b8, 1, 6, 'Espaces verts', 'soft', { v: 0.1 }],
  ['gold', 0xe8b534, 6, 2500, 'Coffre-fort', 'metal', { e: 0.25 }],
  ['bills', 0x7fa36a, 1, 600, 'Coffre-fort', 'paper', { v: 0.08 }],
  ['vault', 0x5d6168, 30, 200, 'Coffre-fort', 'metal', { v: 0.02 }],
  ['carpetR', 0x8e2130, 2, 12, 'Mobilier', 'soft', { v: 0.04 }],
  ['carpetB', 0x23406e, 2, 12, 'Mobilier', 'soft', { v: 0.04 }],
  ['carpetG', 0x6c6e70, 2, 12, 'Mobilier', 'soft', { v: 0.04 }],
  ['seatB', 0x2d5fa8, 2, 30, 'Mobilier', 'soft', { v: 0.04 }],
  ['seatO', 0xe07a24, 2, 30, 'Mobilier', 'soft', { v: 0.04 }],
  ['leather', 0x2b211b, 2, 60, 'Mobilier', 'soft', { v: 0.04 }],
  ['plasticW', 0xe9e9e4, 2, 15, 'Mobilier', 'plastic', { v: 0.03 }],
  ['plasticK', 0x232427, 2, 15, 'Mobilier', 'plastic', { v: 0.03 }],
  ['plasticR', 0xc02a26, 2, 15, 'Mobilier', 'plastic', { v: 0.03 }],
  ['plasticG', 0x8d9296, 2, 15, 'Mobilier', 'plastic', { v: 0.03 }],
  ['screen', 0x3d7fc4, 1, 350, 'Électronique', 'electric', { e: 0.9 }],
  ['board', 0xf0a020, 1, 400, 'Électronique', 'electric', { e: 1.0, v: 0.2 }],
  ['neonP', 0xff4fa8, 1, 120, 'Enseignes', 'glass', { e: 1.6 }],
  ['neonB', 0x3fb8ff, 1, 120, 'Enseignes', 'glass', { e: 1.6 }],
  ['neonY', 0xffd64a, 1, 120, 'Enseignes', 'glass', { e: 1.6 }],
  ['neonG', 0x5cff8a, 1, 120, 'Enseignes', 'glass', { e: 1.6 }],
  ['lamp', 0xfff0c8, 1, 80, 'Enseignes', 'glass', { e: 1.3 }],
  ['signR', 0xc8242c, 2, 60, 'Enseignes', 'plastic', { e: 0.35 }],
  ['signB', 0x1f5fb8, 2, 60, 'Enseignes', 'plastic', { e: 0.35 }],
  ['signG', 0x1f8a4c, 2, 60, 'Enseignes', 'plastic', { e: 0.35 }],
  ['awnR', 0xc0392b, 1, 20, 'Décoration', 'soft', { v: 0.05 }],
  ['awnG', 0x2e7d4f, 1, 20, 'Décoration', 'soft', { v: 0.05 }],
  ['awnB', 0x2a6fb0, 1, 20, 'Décoration', 'soft', { v: 0.05 }],
  ['awnW', 0xf2efe6, 1, 20, 'Décoration', 'soft', { v: 0.03 }],
  ['goodsR', 0xd0453a, 1, 45, 'Marchandise', 'plastic', { v: 0.2 }],
  ['goodsB', 0x3f7ad0, 1, 45, 'Marchandise', 'plastic', { v: 0.2 }],
  ['goodsY', 0xf0c040, 1, 45, 'Marchandise', 'plastic', { v: 0.2 }],
  ['goodsG', 0x55b060, 1, 45, 'Marchandise', 'plastic', { v: 0.2 }],
  ['bottle', 0x3f8a4a, 1, 60, 'Marchandise', 'glass', { t: 1 }],
  ['fruitO', 0xf08a1c, 1, 12, 'Marchandise', 'splat', { v: 0.12 }],
  ['fruitY', 0xf4d03f, 1, 12, 'Marchandise', 'splat', { v: 0.12 }],
  ['fruitR', 0xc8281e, 1, 12, 'Marchandise', 'splat', { v: 0.12 }],
  ['coco', 0x6b4a2a, 2, 12, 'Marchandise', 'wood', { v: 0.1 }],
  ['bagR', 0xb22d2d, 2, 80, 'Bagages', 'soft', { v: 0.1 }],
  ['bagB', 0x2d4fb2, 2, 80, 'Bagages', 'soft', { v: 0.1 }],
  ['bagK', 0x2a2a2a, 2, 80, 'Bagages', 'soft', { v: 0.1 }],
  ['bagY', 0xd9a520, 2, 80, 'Bagages', 'soft', { v: 0.1 }],
  ['carR', 0xb3202a, 6, 180, 'Véhicules', 'metal', { v: 0.02 }],
  ['carB', 0x1f4f9a, 6, 180, 'Véhicules', 'metal', { v: 0.02 }],
  ['carW', 0xeeeeea, 6, 180, 'Véhicules', 'metal', { v: 0.02 }],
  ['carY', 0xf2c21a, 6, 180, 'Véhicules', 'metal', { v: 0.02 }],
  ['carK', 0x1e2024, 6, 180, 'Véhicules', 'metal', { v: 0.02 }],
  ['carG', 0x3f7a55, 6, 180, 'Véhicules', 'metal', { v: 0.02 }],
  ['tire', 0x1a1a1a, 4, 60, 'Véhicules', 'soft', { v: 0.02 }],
  ['planeW', 0xf2f3f5, 6, 400, 'Aéronautique', 'metal', { v: 0.01 }],
  ['planeB', 0x1c3f94, 6, 400, 'Aéronautique', 'metal', { v: 0.01 }],
  ['planeR', 0xd22630, 6, 400, 'Aéronautique', 'metal', { v: 0.01 }],
  ['planeG', 0x9aa1a8, 8, 600, 'Aéronautique', 'metal', { v: 0.02 }],
  ['trainW', 0xf0f1f2, 6, 300, 'Ferroviaire', 'metal', { v: 0.01 }],
  ['trainB', 0x23386e, 6, 300, 'Ferroviaire', 'metal', { v: 0.01 }],
  ['trainR', 0xb81f2e, 6, 300, 'Ferroviaire', 'metal', { v: 0.01 }],
  ['trainY', 0xf1c21b, 6, 300, 'Ferroviaire', 'metal', { v: 0.01 }],
  ['trainG', 0x4b5058, 6, 300, 'Ferroviaire', 'metal', { v: 0.02 }],
  ['rail', 0x6a625a, 10, 40, 'Ferroviaire', 'metal', { v: 0.03 }],
  ['sleeper', 0x9c978c, 6, 20, 'Ferroviaire', 'plaster', { v: 0.05 }],
  ['clock', 0xfaf6e8, 2, 300, 'Décoration', 'glass', { e: 0.8 }],
  ['bronze', 0x9a6b2f, 8, 300, 'Décoration', 'metal', { v: 0.04 }],
  ['belt', 0x2c2c2c, 3, 50, 'Électronique', 'plastic', { v: 0.02 }],
  ['boatW', 0xf4f1e8, 3, 40, 'Charpente', 'wood', { v: 0.04 }],
  ['boatB', 0x2b77b8, 3, 40, 'Charpente', 'wood', { v: 0.04 }],
  ['boatR', 0xc6402f, 3, 40, 'Charpente', 'wood', { v: 0.04 }],
  ['boatY', 0xf0c23a, 3, 40, 'Charpente', 'wood', { v: 0.04 }],
  // port
  ['contR', 0xb8362a, 5, 90, 'Conteneurs', 'metal', { v: 0.05 }],
  ['contB', 0x1f5a9e, 5, 90, 'Conteneurs', 'metal', { v: 0.05 }],
  ['contG', 0x2f7d4a, 5, 90, 'Conteneurs', 'metal', { v: 0.05 }],
  ['contO', 0xe07b1f, 5, 90, 'Conteneurs', 'metal', { v: 0.05 }],
  ['contW', 0xdedcd4, 5, 90, 'Conteneurs', 'metal', { v: 0.05 }],
  ['hullR', 0x9e2c24, 10, 120, 'Navires', 'metal', { v: 0.03 }],
  ['hullK', 0x2a3140, 10, 120, 'Navires', 'metal', { v: 0.03 }],
  ['hullW', 0xf0efe9, 8, 120, 'Navires', 'metal', { v: 0.02 }],
  ['craneY', 0xe8b020, 12, 60, 'Grues', 'metal', { v: 0.03 }],
  ['bollard', 0x2b2b2b, 12, 30, 'Métallerie', 'metal', { v: 0.02 }],
  // centre commercial
  ['floorTile', 0xdcd6ca, 5, 16, 'Maçonnerie', 'ceramic', { v: 0.04 }],
  ['toy', 0xe84a8a, 1, 35, 'Marchandise', 'plastic', { v: 0.3 }],
  ['perfume', 0xd9a0e0, 1, 150, 'Marchandise', 'glass', { t: 1 }],
  // château
  ['stoneG', 0x9a948a, 8, 20, 'Maçonnerie', 'plaster', { v: 0.09 }],
  ['stoneD', 0x6f6a62, 9, 20, 'Maçonnerie', 'plaster', { v: 0.08 }],
  ['hay', 0xd9b84a, 1, 3, 'Espaces verts', 'soft', { v: 0.12 }],
  ['banner', 0x8e1d24, 1, 60, 'Décoration', 'soft', { v: 0.04 }],
  // centrale nucléaire
  ['cherenkov', 0x3fa9ff, 1, 800, 'Réacteur', 'glass', { t: 1, e: 1.6 }],
  ['rod', 0x9aa0a8, 10, 2000, 'Réacteur', 'metal', { e: 0.1, v: 0.03 }],
  ['waste', 0xe5c21c, 3, 500, 'Déchets radioactifs', 'metal', { e: 0.15, v: 0.06 }],
  ['coolant', 0x6f7a80, 10, 80, 'Réacteur', 'metal', { v: 0.03 }],
  // lune
  ['regolith', 0x9a9892, 2, 0.5, 'Terrassement', 'soft', { g: 1, v: 0.1 }],
  ['regolithD', 0x6f6d69, 3, 0.5, 'Terrassement', 'soft', { g: 1, v: 0.1 }],
  ['moonrock', 0x55534f, 9, 1, 'Terrassement', 'plaster', { g: 1, v: 0.12 }],
  ['hull', 0xe6e9ec, 8, 220, 'Modules spatiaux', 'metal', { v: 0.02 }],
  ['hullStripe', 0xd24a1e, 8, 220, 'Modules spatiaux', 'metal', { v: 0.02 }],
  ['foil', 0xd9a638, 3, 300, 'Modules spatiaux', 'metal', { e: 0.2, v: 0.15 }],
  ['solar', 0x1d3f7a, 1, 250, 'Panneaux solaires', 'glass', { e: 0.15, v: 0.06 }],
  ['moonGlass', 0x9fd6ff, 1, 90, 'Vitrerie', 'glass', { t: 1 }],
];

export const M = {};
export const N = DEFS.length;
export const HARDQ = new Uint8Array(N);   // dureté en quarts de point (255 = indestructible)
export const VAL = new Float32Array(N);
export const GROUNDM = new Uint8Array(N);
export const TRANS = new Uint8Array(N);
export const OPQ = new Uint8Array(N);
export const GLOW = new Uint8Array(N);
export const VARY = new Float32Array(N);
export const CAT = [], SND = [], MAT_HEX = [];
export const MAT_COL = new Float32Array(N * 3);
{
  const c = new THREE.Color();
  DEFS.forEach(([k, col, hard, val, cat, snd, o = {}], i) => {
    M[k] = i;
    HARDQ[i] = hard >= 255 ? 255 : Math.min(250, hard * 4);
    VAL[i] = val; GROUNDM[i] = o.g ? 1 : 0; TRANS[i] = o.t ? 1 : 0;
    OPQ[i] = i && !o.t ? 1 : 0;
    GLOW[i] = Math.round(Math.min(1, (o.e || 0) / 2) * 255);
    VARY[i] = o.v ?? 0.03;
    CAT[i] = cat; SND[i] = snd; MAT_HEX[i] = col;
    c.setHex(col); MAT_COL[i * 3] = c.r; MAT_COL[i * 3 + 1] = c.g; MAT_COL[i * 3 + 2] = c.b;
  });
}
export const hardOf = (m) => HARDQ[m] / 4;

// ------------------------------------------------------------------ maillage
const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], s: 0.88 },
  { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], s: 0.8 },
  { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], s: 1.0 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: 0.58 },
  { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], s: 0.94 },
  { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], s: 0.76 },
];
for (const F of FACES) {
  const a = F.n[0] ? 0 : F.n[1] ? 1 : 2;
  const b = (a + 1) % 3, c2 = (a + 2) % 3;
  F.ao = F.c.map((corner) => {
    const du = corner[b] * 2 - 1, dv = corner[c2] * 2 - 1;
    const s1 = [0, 0, 0], s2 = [0, 0, 0], s3 = [0, 0, 0];
    s1[b] = du; s2[c2] = dv; s3[b] = du; s3[c2] = dv;
    return [...s1, ...s2, ...s3];
  });
}
const AOL = [0.52, 0.7, 0.85, 1.0];

class Buf {
  constructor() { this.P = new Float32Array(1 << 15); this.Nm = new Int8Array(1 << 15); this.C = new Uint8Array(1 << 15); this.G = new Uint8Array(1 << 13); this.I = new Uint32Array(1 << 14); this.nv = 0; this.ni = 0; }
  ensure(nv, ni) {
    if (nv * 3 > this.P.length) {
      let L = this.P.length; while (nv * 3 > L) L *= 2;
      const a = new Float32Array(L); a.set(this.P); this.P = a;
      const b = new Int8Array(L); b.set(this.Nm); this.Nm = b;
      const c = new Uint8Array(L); c.set(this.C); this.C = c;
    }
    if (nv > this.G.length) { let L = this.G.length; while (nv > L) L *= 2; const g = new Uint8Array(L); g.set(this.G); this.G = g; }
    if (ni > this.I.length) { let L = this.I.length; while (ni > L) L *= 2; const i2 = new Uint32Array(L); i2.set(this.I); this.I = i2; }
  }
  geometry() {
    if (!this.nv) return null;
    const { nv, ni } = this;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.P.slice(0, nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.Nm.slice(0, nv * 3), 3, true));
    g.setAttribute('color', new THREE.BufferAttribute(this.C.slice(0, nv * 3), 3, true));
    g.setAttribute('glow', new THREE.BufferAttribute(this.G.slice(0, nv), 1, true));
    g.setIndex(new THREE.BufferAttribute(nv < 65536 ? new Uint16Array(this.I.subarray(0, ni)) : this.I.slice(0, ni), 1));
    g.computeBoundingSphere();
    return g;
  }
}
const BO = new Buf(), BT = new Buf();

function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// get(x,y,z) → matière ; dmgK(x,y,z) → 0..1 d'usure (optionnel). Sortie en unités VS depuis (ox,oy,oz).
export function meshRegion(get, x0, y0, z0, x1, y1, z1, ox, oy, oz, hx = 0, hy = 0, hz = 0, dmgK = null) {
  BO.nv = BO.ni = 0; BT.nv = BT.ni = 0;
  const ao = [0, 0, 0, 0];
  for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
    const m = get(x, y, z);
    if (!m) continue;
    const tr = TRANS[m];
    let vr = 0;
    for (let f = 0; f < 6; f++) {
      const F = FACES[f];
      const nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
      const nb = get(nx, ny, nz);
      if (tr ? nb !== 0 : OPQ[nb]) continue;
      const B = tr ? BT : BO;
      B.ensure(B.nv + 4, B.ni + 6);
      if (!vr) {
        const va = VARY[m];
        vr = 1 - va + 2 * va * hash3(x + hx, y + hy, z + hz);
        if (dmgK) vr *= 1 - 0.45 * dmgK(x, y, z);
      }
      let cr = MAT_COL[m * 3], cg = MAT_COL[m * 3 + 1], cb = MAT_COL[m * 3 + 2];
      if (m === M.grass && f !== 2) { cr = 0.42; cg = 0.29; cb = 0.18; }
      const gl = GLOW[m];
      for (let k = 0; k < 4; k++) {
        let a = 3;
        if (!tr) {
          const o = F.ao[k];
          const s1 = OPQ[get(nx + o[0], ny + o[1], nz + o[2])];
          const s2 = OPQ[get(nx + o[3], ny + o[4], nz + o[5])];
          const s3 = OPQ[get(nx + o[6], ny + o[7], nz + o[8])];
          a = s1 && s2 ? 0 : 3 - (s1 + s2 + s3);
        }
        ao[k] = a;
        const c = F.c[k], p = B.nv * 3;
        B.P[p] = (x + c[0] - ox) * VS; B.P[p + 1] = (y + c[1] - oy) * VS; B.P[p + 2] = (z + c[2] - oz) * VS;
        B.Nm[p] = F.n[0] * 127; B.Nm[p + 1] = F.n[1] * 127; B.Nm[p + 2] = F.n[2] * 127;
        const l = (gl ? Math.max(AOL[a] * F.s, 0.85) : AOL[a] * F.s) * vr;
        B.C[p] = Math.min(255, cr * l * 255 + 0.5); B.C[p + 1] = Math.min(255, cg * l * 255 + 0.5); B.C[p + 2] = Math.min(255, cb * l * 255 + 0.5);
        B.G[B.nv] = gl;
        B.nv++;
      }
      const b = B.nv - 4, I = B.I;
      if (ao[0] + ao[2] > ao[1] + ao[3]) { I[B.ni++] = b; I[B.ni++] = b + 1; I[B.ni++] = b + 2; I[B.ni++] = b; I[B.ni++] = b + 2; I[B.ni++] = b + 3; }
      else { I[B.ni++] = b; I[B.ni++] = b + 1; I[B.ni++] = b + 3; I[B.ni++] = b + 1; I[B.ni++] = b + 2; I[B.ni++] = b + 3; }
    }
  }
  return { solid: BO.geometry(), glass: BT.geometry() };
}

function glowify(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = 'attribute float glow;\nvarying float vGlow;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = 'varying float vGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor * vGlow * 1.5;');
  };
  mat.customProgramCacheKey = () => 'glow';
  return mat;
}
export const solidMat = glowify(new THREE.MeshLambertMaterial({ vertexColors: true }));
export const glassMat = glowify(new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false }));

// ------------------------------------------------------------------ monde
const CS = 32;
const FLOOD_LIMIT = 260000;
const NB6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

export class World {
  // outerTop(x, z) : indice du dernier cube plein hors de la carte (le terrain continue au-delà)
  constructor(sx, sy, sz, outerTop) {
    this.sx = sx; this.sy = sy; this.sz = sz; this.sxz = sx * sz;
    const n = sx * sy * sz;
    this.data = new Uint8Array(n);
    this.dmg = new Uint8Array(n);     // bits 0-6 : usure (quarts de point) · bit 7 : déjà facturé
    this.mark = new Uint32Array(n);
    this.gen = 1;
    this.outerTop = outerTop || (() => GROUND - 1);
    this.ox = -sx * VS / 2; this.oz = -sz * VS / 2;
    this.bounds = { x0: this.ox, x1: -this.ox, z0: this.oz, z1: -this.oz };
    this.ncx = Math.ceil(sx / CS); this.ncy = Math.ceil(sy / CS); this.ncz = Math.ceil(sz / CS);
    this.chunks = new Array(this.ncx * this.ncy * this.ncz).fill(null);
    this.dirty = new Set();
    this.group = new THREE.Group(); this.group.position.set(this.ox, 0, this.oz);
    this.seeds = [];
    this.bodies = [];
    this.stack = new Int32Array(FLOOD_LIMIT * 6 + 16);
    this.vis = new Int32Array(FLOOD_LIMIT + 8);
    this.getBound = this.get.bind(this);
    this.dmgBound = (x, y, z) => {
      if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) return 0;
      const i = x + z * sx + y * this.sxz, raw = this.dmg[i];
      if (!raw) return 0;
      return Math.min(1, (raw & 127) / HARDQ[this.data[i]] + (raw & 128 ? 0.35 : 0));
    };
    this.shadows = true;
    this.totalValue = 0; this.pctTotal = 0;
    this.destroyed = 0; this.destroyedPct = 0;
    this.paid = new Float64Array(N); this.paidAny = false;
    this.removedFx = [];   // échantillon de cubes détruits (pour les débris)
    this.landings = [];
    this.g = 1;         // gravité relative (la Lune : 0,17)
  }

  // ---------- accès
  get(x, y, z) {
    if (y < 0) return 1;
    if (y >= this.sy) return 0;
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz) return y <= this.outerTop(x, z) ? 1 : 0;
    return this.data[x + z * this.sx + y * this.sxz];
  }
  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz; }
  put(x, y, z, m) {
    if (x < 0 || y < 0 || z < 0 || x >= this.sx || y >= this.sy || z >= this.sz) return;
    this.data[x + z * this.sx + y * this.sxz] = m;
  }
  vx(wx) { return Math.floor((wx - this.ox) / VS); }
  vy(wy) { return Math.floor(wy / VS); }
  vz(wz) { return Math.floor((wz - this.oz) / VS); }
  wx(x) { return x * VS + this.ox; }
  wz(z) { return z * VS + this.oz; }
  solidAt(wx, wy, wz) { return this.get(this.vx(wx), this.vy(wy), this.vz(wz)) !== 0; }
  matAt(wx, wy, wz) { return this.get(this.vx(wx), this.vy(wy), this.vz(wz)); }
  // une boîte (en mètres) touche-t-elle un cube plein ?
  boxHits(x0, y0, z0, x1, y1, z1) {
    const a = this.vx(x0), b = this.vx(x1 - 1e-6), c = this.vy(y0), d = this.vy(y1 - 1e-6), e = this.vz(z0), f = this.vz(z1 - 1e-6);
    for (let y = c; y <= d; y++) for (let z = e; z <= f; z++) for (let x = a; x <= b; x++) if (this.get(x, y, z)) return true;
    return false;
  }
  groundBelow(wx, wz, fromY) {
    const x = this.vx(wx), z = this.vz(wz);
    for (let y = Math.min(this.sy - 1, this.vy(fromY)); y >= 0; y--) if (this.get(x, y, z)) return (y + 1) * VS;
    return 0;
  }

  // compte ce qui est en jeu (après construction)
  tally() {
    let t = 0, p = 0;
    const cnt = new Float64Array(N);
    for (let i = 0; i < this.data.length; i++) cnt[this.data[i]]++;
    for (let m = 1; m < N; m++) { t += cnt[m] * VAL[m]; if (!GROUNDM[m]) p += cnt[m] * VAL[m]; }
    this.totalValue = t; this.pctTotal = p; this.counts = cnt;
  }
  get pct() { return this.pctTotal ? this.destroyedPct / this.pctTotal : 0; }

  // ---------- chunks
  ck(cx, cy, cz) { return cx + cz * this.ncx + cy * this.ncx * this.ncz; }
  markDirty(x, y, z) {
    const cx = (x / CS) | 0, cy = (y / CS) | 0, cz = (z / CS) | 0;
    this.dirty.add(this.ck(cx, cy, cz));
    const lx = x % CS, ly = y % CS, lz = z % CS;
    if (lx === 0 && cx > 0) this.dirty.add(this.ck(cx - 1, cy, cz));
    if (lx === CS - 1 && cx < this.ncx - 1) this.dirty.add(this.ck(cx + 1, cy, cz));
    if (ly === 0 && cy > 0) this.dirty.add(this.ck(cx, cy - 1, cz));
    if (ly === CS - 1 && cy < this.ncy - 1) this.dirty.add(this.ck(cx, cy + 1, cz));
    if (lz === 0 && cz > 0) this.dirty.add(this.ck(cx, cy, cz - 1));
    if (lz === CS - 1 && cz < this.ncz - 1) this.dirty.add(this.ck(cx, cy, cz + 1));
  }
  buildChunk(key) {
    const cx = key % this.ncx, cz = Math.floor(key / this.ncx) % this.ncz, cy = Math.floor(key / (this.ncx * this.ncz));
    const old = this.chunks[key];
    if (old) { for (const m of old) { this.group.remove(m); m.geometry.dispose(); } this.chunks[key] = null; }
    const x0 = cx * CS, y0 = cy * CS, z0 = cz * CS;
    const r = meshRegion(this.getBound, x0, y0, z0, Math.min(x0 + CS, this.sx), Math.min(y0 + CS, this.sy), Math.min(z0 + CS, this.sz), 0, 0, 0, 0, 0, 0, this.dmgBound);
    const list = [];
    if (r.solid) {
      const m = new THREE.Mesh(r.solid, solidMat);
      m.castShadow = this.shadows; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
      list.push(m); this.group.add(m);
    }
    if (r.glass) {
      const m = new THREE.Mesh(r.glass, glassMat);
      m.renderOrder = 2; m.matrixAutoUpdate = false; m.updateMatrix();
      list.push(m); this.group.add(m);
    }
    this.chunks[key] = list.length ? list : null;
  }
  // construction initiale, par tranches (pour la barre de chargement)
  async buildAll(onProgress) {
    const n = this.chunks.length;
    let t0 = performance.now();
    for (let k = 0; k < n; k++) {
      this.buildChunk(k);
      if (performance.now() - t0 > 40) { if (onProgress) onProgress(k / n); await new Promise((r) => setTimeout(r, 0)); t0 = performance.now(); }
    }
    this.dirty.clear();
  }
  setShadows(on) { this.shadows = on; for (const c of this.chunks) if (c) for (const m of c) if (m.material === solidMat) m.castShadow = on; }
  dispose() {
    for (const c of this.chunks) if (c) for (const m of c) m.geometry.dispose();
    this.chunks.fill(null); this.group.clear();
    for (const b of this.bodies) b.dispose();
    this.bodies.length = 0;
  }

  // ---------- facturation
  _pay(i, m) {
    if (this.dmg[i] & 128) return;
    const v = VAL[m];
    this.destroyed += v; if (!GROUNDM[m]) this.destroyedPct += v;
    this.paid[m]++; this.paidAny = true;
  }
  takePaid() {
    if (!this.paidAny) return null;
    const out = this.paid; this.paid = new Float64Array(N); this.paidAny = false;
    return out;
  }
  _removeIdx(i, x, y, z, m, fx) {
    this._pay(i, m);
    this.data[i] = 0; this.dmg[i] = 0;
    this.markDirty(x, y, z);
    if (fx && this.removedFx.length < 4000) this.removedFx.push(x, y, z, m);
  }
  _seedsAround(x, y, z) {
    for (const d of NB6) {
      const a = x + d[0], b = y + d[1], c = z + d[2];
      if (this.inside(a, b, c)) { const j = a + c * this.sx + b * this.sxz; if (this.data[j]) this.seeds.push(j); }
    }
  }

  // un cube encaisse « pts » points ; renvoie la matière s'il cède
  hitVoxel(x, y, z, pts, fx = true) {
    if (!this.inside(x, y, z)) return 0;
    const i = x + z * this.sx + y * this.sxz, m = this.data[i];
    if (!m || HARDQ[m] === 255) return 0;
    const d = (this.dmg[i] & 127) + pts * 4;
    if (d >= HARDQ[m]) { this._removeIdx(i, x, y, z, m, fx); this._seedsAround(x, y, z); return m; }
    const nd = Math.min(127, Math.round(d));
    if ((this.dmg[i] & 127) !== nd) { this.dmg[i] = (this.dmg[i] & 128) | nd; this.markDirty(x, y, z); }
    return 0;
  }

  // souffle sphérique (mètres) ; mul(m) module selon la matière. Renvoie { n, value }
  blast(wx, wy, wz, r, power, mul = null, falloff = 1) {
    const cx = (wx - this.ox) / VS, cy = wy / VS, cz = (wz - this.oz) / VS, rv = r / VS;
    const x0 = Math.max(0, Math.floor(cx - rv)), x1 = Math.min(this.sx - 1, Math.ceil(cx + rv));
    const y0 = Math.max(1, Math.floor(cy - rv)), y1 = Math.min(this.sy - 1, Math.ceil(cy + rv));
    const z0 = Math.max(0, Math.floor(cz - rv)), z1 = Math.min(this.sz - 1, Math.ceil(cz + rv));
    const { data, dmg, sx, sxz } = this;
    let n = 0; const v0 = this.destroyed;
    const g = this.gen & 1023;
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const i = x + z * sx + y * sxz, m = data[i];
      if (!m) continue;
      const hq = HARDQ[m];
      if (hq === 255) continue;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dz = z + 0.5 - cz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > rv * rv) continue;
      const k = 1 - Math.sqrt(d2) / rv;
      let pts = power * (falloff === 1 ? k : Math.pow(k, falloff)) * (0.75 + 0.5 * hash3(x, y, z + g));
      if (mul) pts *= mul(m);
      if (pts <= 0) continue;
      const d = (dmg[i] & 127) + pts * 4;
      if (d >= hq) { this._removeIdx(i, x, y, z, m, true); n++; }
      else {
        const nd = Math.min(127, Math.round(d));
        if ((dmg[i] & 127) !== nd) { dmg[i] = (dmg[i] & 128) | nd; this.markDirty(x, y, z); }
      }
    }
    // coquille autour : on vérifie ce qui tient encore
    if (n) {
      const s = Math.max(1, Math.round(rv / 3));
      for (let y = y0 - 1; y <= y1 + 1; y += 1) for (let z = z0 - 1; z <= z1 + 1; z += s) for (let x = x0 - 1; x <= x1 + 1; x += s) {
        if (!this.inside(x, y, z)) continue;
        const i = x + z * sx + y * sxz;
        if (data[i]) this.seeds.push(i);
      }
    }
    this.gen++;
    return { n, value: this.destroyed - v0 };
  }

  // colonne rasée (bombe) : tout ce qui est au-dessus de yb disparaît
  razeColumn(x, z, yb, fx) {
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz) return 0;
    const { data, sx, sxz } = this;
    let n = 0;
    for (let y = Math.max(1, yb); y < this.sy; y++) {
      const i = x + z * sx + y * sxz, m = data[i];
      if (!m) continue;
      this._pay(i, m); data[i] = 0; this.dmg[i] = 0; n++;
      if (fx && Math.random() < fx) this.removedFx.push(x, y, z, m);
    }
    if (n) {
      for (let cy = 0; cy < this.ncy; cy++) this.dirty.add(this.ck((x / CS) | 0, cy, (z / CS) | 0));
      if (x % CS === 0 && x > 0) for (let cy = 0; cy < this.ncy; cy++) this.dirty.add(this.ck(((x / CS) | 0) - 1, cy, (z / CS) | 0));
      if (x % CS === CS - 1) for (let cy = 0; cy < this.ncy; cy++) this.dirty.add(this.ck(Math.min(this.ncx - 1, ((x / CS) | 0) + 1), cy, (z / CS) | 0));
      if (z % CS === 0 && z > 0) for (let cy = 0; cy < this.ncy; cy++) this.dirty.add(this.ck((x / CS) | 0, cy, ((z / CS) | 0) - 1));
      if (z % CS === CS - 1) for (let cy = 0; cy < this.ncy; cy++) this.dirty.add(this.ck((x / CS) | 0, cy, Math.min(this.ncz - 1, ((z / CS) | 0) + 1)));
    }
    return n;
  }
  topOf(x, z) {
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz) return this.outerTop(x, z);
    for (let y = this.sy - 1; y >= 0; y--) if (this.data[x + z * this.sx + y * this.sxz]) return y;
    return -1;
  }

  // ---------- rayon (Amanatides & Woo), en mètres, direction normée
  raycast(ox, oy, oz, dx, dy, dz, maxDist, skipTrans = false) {
    const px = (ox - this.ox) / VS, py = oy / VS, pz = (oz - this.oz) / VS, maxT = maxDist / VS;
    let x = Math.floor(px), y = Math.floor(py), z = Math.floor(pz);
    const sx = dx > 0 ? 1 : dx < 0 ? -1 : 0, sy = dy > 0 ? 1 : dy < 0 ? -1 : 0, sz = dz > 0 ? 1 : dz < 0 ? -1 : 0;
    const tdx = sx ? Math.abs(1 / dx) : Infinity, tdy = sy ? Math.abs(1 / dy) : Infinity, tdz = sz ? Math.abs(1 / dz) : Infinity;
    let tmx = sx > 0 ? (x + 1 - px) * tdx : sx < 0 ? (px - x) * tdx : Infinity;
    let tmy = sy > 0 ? (y + 1 - py) * tdy : sy < 0 ? (py - y) * tdy : Infinity;
    let tmz = sz > 0 ? (z + 1 - pz) * tdz : sz < 0 ? (pz - z) * tdz : Infinity;
    const hit = (t, face) => {
      const d = t * VS;
      return { x, y, z, m: this.get(x, y, z), dist: d, nx: face === 0 ? -sx : 0, ny: face === 1 ? -sy : 0, nz: face === 2 ? -sz : 0,
        px: ox + dx * d, py: oy + dy * d, pz: oz + dz * d };
    };
    let m0 = this.get(x, y, z);
    if (m0 && !(skipTrans && TRANS[m0])) return hit(0, 1);
    let t = 0, face = 0;
    for (let it = 0; it < 4000; it++) {
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; face = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; face = 1; }
      else { z += sz; t = tmz; tmz += tdz; face = 2; }
      if (t > maxT) return null;
      if (y >= this.sy && sy >= 0) return null;
      const m = this.get(x, y, z);
      if (m && !(skipTrans && TRANS[m])) return hit(t, face);
    }
    return null;
  }

  // ---------- effondrements
  processCollapse() {
    if (!this.seeds.length) return;
    const G = ++this.gen;
    const seeds = this.seeds; this.seeds = [];
    const { data, mark, sx, sxz, sy, sz } = this;
    for (const s of seeds) {
      if (data[s] === 0 || mark[s] === G) continue;
      const D = ++this.gen;
      const stack = this.stack, vis = this.vis;
      let sp = 0, nv = 0, grounded = false, overflow = false;
      stack[sp++] = s; mark[s] = D;
      while (sp > 0) {
        const i = stack[--sp];
        if (nv >= FLOOD_LIMIT) { overflow = true; break; }
        vis[nv++] = i;
        const y = (i / sxz) | 0;
        if (y === 0) { grounded = true; break; }
        const rem = i - y * sxz, z = (rem / sx) | 0, x = rem - z * sx;
        // ordre d'empilement : le bas en dernier, donc exploré en premier
        for (let k = 0; k < 6; k++) {
          let a = x, b = y, c = z;
          if (k === 0) b++; else if (k === 1) a++; else if (k === 2) a--; else if (k === 3) c++; else if (k === 4) c--; else b--;
          if (a < 0 || c < 0 || a >= sx || c >= sz || b >= sy) {
            if (b < sy && this.get(a, b, c)) { grounded = true; break; }
            continue;
          }
          const j = a + c * sx + b * sxz;
          if (data[j] === 0) continue;
          if (mark[j] === G) { grounded = true; break; }
          if (mark[j] === D) continue;
          mark[j] = D; stack[sp++] = j;
        }
        if (grounded) break;
      }
      if (grounded || overflow) { for (let k = 0; k < nv; k++) mark[vis[k]] = G; continue; }
      this._detach(vis, nv);
    }
  }

  _detach(vis, nv) {
    const { sx, sxz } = this;
    // les miettes ne tombent pas en bloc : elles partent en débris
    if (nv <= 6 || this.bodies.length > 60) {
      for (let k = 0; k < nv; k++) {
        const i = vis[k], y = (i / sxz) | 0, rem = i - y * sxz, z = (rem / sx) | 0, x = rem - z * sx;
        this._removeIdx(i, x, y, z, this.data[i], true);
      }
      return;
    }
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1, y1 = -1, z1 = -1;
    for (let k = 0; k < nv; k++) {
      const i = vis[k], y = (i / sxz) | 0, rem = i - y * sxz, z = (rem / sx) | 0, x = rem - z * sx;
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (z < z0) z0 = z;
      if (x > x1) x1 = x; if (y > y1) y1 = y; if (z > z1) z1 = z;
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, d = z1 - z0 + 1;
    const grid = new Uint8Array(w * h * d);
    let value = 0;
    for (let k = 0; k < nv; k++) {
      const i = vis[k], y = (i / sxz) | 0, rem = i - y * sxz, z = (rem / sx) | 0, x = rem - z * sx;
      const m = this.data[i];
      grid[(x - x0) + (z - z0) * w + (y - y0) * w * d] = m;
      this._pay(i, m); value += VAL[m];
      this.data[i] = 0; this.dmg[i] = 0;
      this.markDirty(x, y, z);
    }
    const b = new FallingBody(this, { grid, w, h, d, ox: x0, oy: y0, oz: z0, count: nv, value });
    this.bodies.push(b);
    this.group.add(b.group);
    if (this.onDetach) this.onDetach(b);
  }

  _updateBodies(dt) {
    for (let k = this.bodies.length - 1; k >= 0; k--) {
      const b = this.bodies[k];
      if (b.update(dt)) {
        this._place(b);
        b.dispose(); this.group.remove(b.group);
        this.bodies.splice(k, 1);
      }
    }
  }

  // un bloc tombé se pose : une partie part en miettes selon la violence du choc
  _place(b) {
    const { grid, w, h, d } = b;
    const sp = b.impact;
    // les étages du bas s'écrasent (d'autant plus que le bloc est lourd) : le reste retombera dessus
    const crushH = Math.min(h, Math.floor(Math.max(0, sp - 5) * 0.6 * Math.min(2.5, b.massK / 1.6)));
    const base = Math.max(0, Math.min(0.6, (sp - 5) / 20)) * 0.4;
    const Y = Math.round(b.y);
    let broken = 0;
    const fxRate = Math.min(1, 600 / b.count);
    for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
      const m = grid[x + z * w + y * w * d];
      if (!m) continue;
      const X = b.ox + x, YY = Y + y, Z = b.oz + z;
      const brk = y < crushH ? 1 : TRANS[m] ? (sp > 3 ? 1 : 0.3) : base * (1 - Math.min(0.8, HARDQ[m] / 60));
      if (!this.inside(X, YY, Z) || this.data[X + Z * this.sx + YY * this.sxz] || Math.random() < brk) {
        broken++;
        if (Math.random() < fxRate && this.removedFx.length < 4000) this.removedFx.push(X, YY, Z, m);
        continue;
      }
      const i = X + Z * this.sx + YY * this.sxz;
      this.data[i] = m; this.dmg[i] = 128;
      this.markDirty(X, YY, Z);
      if (y === crushH || Math.random() < 0.02) this.seeds.push(i);
    }
    this.landings.push({ x: this.wx(b.ox + w / 2), y: Y * VS, z: this.wz(b.oz + d / 2), w: w * VS, d: d * VS, count: b.count, broken, speed: sp });
  }

  // ---------- boucle
  update(dt, budgetMs = 9, cam = null) {
    this.processCollapse();
    this._updateBodies(dt);
    if (this.dirty.size) {
      const t0 = performance.now();
      let keys = [...this.dirty];
      if (cam && keys.length > 4) {
        const cx = (cam.x - this.ox) / VS / CS, cz = (cam.z - this.oz) / VS / CS;
        const dist = (k) => { const x = k % this.ncx, z = Math.floor(k / this.ncx) % this.ncz; return (x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2; };
        keys.sort((a, b) => dist(a) - dist(b));
      }
      this.changed = true;
      for (const k of keys) {
        this.buildChunk(k); this.dirty.delete(k);
        if (performance.now() - t0 > budgetMs) break;
      }
    }
  }
}

// ------------------------------------------------------------------ blocs qui tombent
export class FallingBody {
  constructor(world, desc) {
    Object.assign(this, desc);
    this.world = world;
    const { grid, w, h, d } = this;
    const get = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= d) ? 0 : grid[x + z * w + y * w * d];
    const r = meshRegion(get, 0, 0, 0, w, h, d, 0, 0, 0, this.ox, this.oy, this.oz);
    this.group = new THREE.Group();
    if (r.solid) { const m = new THREE.Mesh(r.solid, solidMat); m.castShadow = true; m.receiveShadow = true; this.group.add(m); }
    if (r.glass) { const m = new THREE.Mesh(r.glass, glassMat); m.renderOrder = 2; this.group.add(m); }
    this.y = this.oy; this.vy = 0; this.impact = 0;
    this.bottoms = [];
    for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
      if (grid[x + z * w + y * w * d] && (y === 0 || !grid[x + z * w + (y - 1) * w * d])) this.bottoms.push(x, y, z);
    }
    this.massK = Math.min(4, 0.6 + Math.sqrt(this.count) / 25);
    this.group.position.set(this.ox * VS, this.y * VS, this.oz * VS);
  }
  _hits(ny) {
    const W = this.world, B = this.bottoms, fy = Math.floor(ny);
    for (let k = 0; k < B.length; k += 3) if (W.get(this.ox + B[k], fy + B[k + 1], this.oz + B[k + 2])) return true;
    return false;
  }
  // le poids du bloc écrase ce qu'il y a dessous ; renvoie vrai si quelque chose résiste
  _crush(ny, speed) {
    const W = this.world, B = this.bottoms, fy = Math.floor(ny);
    const pts = speed * 0.55 * this.massK;
    let resist = false;
    for (let k = 0; k < B.length; k += 3) {
      const X = this.ox + B[k], Y = fy + B[k + 1], Z = this.oz + B[k + 2];
      if (!W.get(X, Y, Z)) continue;
      if (!W.inside(X, Y, Z) || !W.hitVoxel(X, Y, Z, pts, Math.random() < 0.3)) resist = true;
    }
    return resist;
  }
  update(dt) {
    this.vy = Math.max(this.vy - 22 * (this.world.g ?? 1) * dt, -60);
    let move = this.vy * dt / VS;
    while (move < 0) {
      const st = Math.max(move, -0.45);
      const ny = this.y + st;
      if (ny < 1) { this.impact = -this.vy; this.y = 1; return true; }
      if (this._hits(ny)) {
        const sp = -this.vy;
        if (sp > 7 && !this._crush(ny, sp)) { this.vy *= 0.8; continue; }
        this.impact = sp;
        this.y = Math.floor(ny) + 1;
        return true;
      }
      this.y = ny; move -= st;
    }
    this.group.position.y = this.y * VS;
    return false;
  }
  dispose() { this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
}
