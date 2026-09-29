// L'arsenal : masse, club de golf, lance-roquettes, bombe atomique, pelle, mine.
import * as THREE from 'three';
import { VS, GROUND, VAL, GROUNDM, TRANS, SND, M } from './voxel.js';
import { buildDozer } from './dozer.js';

const rand = (a, b) => a + Math.random() * (b - a);
const CAT_VEH = (m) => m >= M.carR && m <= M.tire;
const isSoil = (m) => GROUNDM[m] && (m === M.dirt || m === M.sand || m === M.wetsand || m === M.clay || m === M.grass || m === M.path || m === M.ballast);

export const WEAPONS = [
  { id: 'masse', name: 'La Masse', nick: '« L\'argument massue »', kind: 'melee', power: 15, radius: 1.15, range: 3.2, rate: 0.85, hitDelay: 0.25, shake: 0.5, ch: 'melee',
    mul: (m) => (TRANS[m] ? 3 : isSoil(m) ? 0.6 : 1),
    desc: 'Six kilos d\'acier au bout d\'un manche. Ça ne rate jamais, ça ne recharge jamais, et ça fait comprendre les choses aux murs porteurs.',
    stats: { deg: 3, cad: 2, por: 1, bor: 3 } },
  { id: 'golf', name: 'Le Club de Golf', nick: '« Le swing du dimanche »', kind: 'golf', power: 10, radius: 0.8, range: 3.1, rate: 0.5, hitDelay: 0.19, shake: 0.28, ch: 'melee', fling: 11,
    mul: (m) => (TRANS[m] ? 4 : CAT_VEH(m) ? 1.4 : 1),
    desc: 'Un fer 7 en acier forgé et un swing de compétition. Plus léger que la masse, plus rapide, et ce qu\'il frappe part loin. Fore !',
    stats: { deg: 2, cad: 4, por: 2, bor: 3 } },
  { id: 'roquette', name: 'Le Lance-Roquettes', nick: '« Le point final »', kind: 'rocket', power: 34, radius: 3.5, rate: 0.3, mag: 1, reload: 1.1, speed: 40, shake: 0.45, ch: 'rocket',
    desc: 'Une roquette, un trou de sept mètres. Recharge en une seconde. Les façades de verre n\'ont aucune chance, le béton non plus.',
    stats: { deg: 5, cad: 2, por: 5, bor: 5 } },
  { id: 'bombe', name: 'La Bombe Atomique', nick: '« Le grand ménage »', kind: 'nuke', rate: 1, fuse: 6, cooldown: 50, share: 1 / 3, range: 4.5, shake: 1.5, ch: 'drill',
    desc: 'Posez-la, reculez, bouchez-vous les oreilles. Un tiers du quartier part en fumée, cratère compris. Rechargement : cinquante secondes.',
    stats: { deg: 5, cad: 1, por: 5, bor: 5 } },
  { id: 'pelle', name: 'La Pelle', nick: '« La terrassière »', kind: 'dig', power: 6, radius: 0.9, range: 3.0, rate: 0.4, hitDelay: 0.16, shake: 0.18, ch: 'melee',
    mul: (m) => (isSoil(m) ? 5 : GROUNDM[m] ? 1.4 : TRANS[m] ? 2 : 0.45),
    desc: 'Pour creuser. La terre, le sable, le bitume : tout y passe. Sapez les fondations et regardez le bâtiment tomber dans son propre trou.',
    stats: { deg: 1, cad: 4, por: 1, bor: 2 } },
  { id: 'mine', name: 'La Mine', nick: '« Le compte à rebours »', kind: 'mine', power: 38, radius: 4, fuse: 3.5, rate: 0.45, max: 8, range: 4.5, shake: 0.5, ch: 'drill',
    desc: 'On la colle où on veut : mur, pilier, fuselage, plancher. Trois secondes et demie plus tard, il n\'y a plus de mur, de pilier ni de plancher.',
    stats: { deg: 5, cad: 3, por: 1, bor: 4 } },
  { id: 'piolet', name: 'Les Piolets', nick: '« L\'alpiniste urbain »', kind: 'climb', climb: true, rate: 0.5, ch: 'melee',
    desc: 'Deux piolets d\'alpinisme, pour grimper, pas pour casser. Face à un mur, on s\'accroche : Z pour monter, S pour descendre, Q/D pour se décaler, Espace pour sauter. Arrivé en haut, on se hisse tout seul.',
    stats: { deg: 0, cad: 0, por: 1, bor: 0 } },
  { id: 'pistoleau', name: 'Le Pistolet à Eau', nick: '« Le Splash Junior 3000 »', kind: 'water', power: 340, radius: 5.5, boom: 0.8, rate: 0.07, auto: true, mag: 90, reload: 1.8, speed: 55, shake: 0.18, ch: 'gun',
    desc: 'Vert pomme, réservoir transparent, gâchette jaune : un jouet de piscine, garanti sans danger dès 3 ans. En pratique : 14 giclées par seconde, et chacune frappe dix fois plus fort qu\'une roquette, avec un petit champignon en prime. Maintenez le clic.',
    stats: { deg: 5, cad: 5, por: 4, bor: 5 } },
  { id: 'bulldozer', name: 'Le Bulldozer', nick: '« Le terrassier en chef »', kind: 'dozer', rate: 0.35, ch: 'none',
    desc: 'Vingt tonnes, une lame de quatre mètres. On le conduit en vue arrière (ZQSD, Maj pour pousser le moteur) ; clic pour baisser la lame et creuser. Il passe à travers les murs, pas au-dessus. E pour descendre.',
    stats: { deg: 4, cad: 5, por: 1, bor: 5 } },
];

// ------------------------------------------------------------------ modèles
const std = (color, rough = 0.6, metal = 0, map = null) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map });

// textures dessinées une fois pour toutes
const TEX = {};
function ctex(key, w, h, draw, rx = 1, ry = 1) {
  if (TEX[key]) return TEX[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
  return (TEX[key] = t);
}
const noise = (g, w, h, n, a) => { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
const woodTex = () => ctex('wood', 128, 512, (g, w, h) => {
  g.fillStyle = '#b07a44'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * w, d = Math.random() < 0.5;
    g.strokeStyle = d ? `rgba(90,50,20,${0.15 + Math.random() * 0.3})` : `rgba(230,180,120,${0.1 + Math.random() * 0.2})`;
    g.lineWidth = 0.5 + Math.random() * 2; g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * 0.02 + i) * 3, y);
    g.stroke();
  }
  for (let k = 0; k < 3; k++) { const x = Math.random() * w, y = Math.random() * h; g.fillStyle = 'rgba(80,40,15,.35)'; g.beginPath(); g.ellipse(x, y, 4, 12, 0, 0, 7); g.fill(); }
  noise(g, w, h, 1500, 0.08);
});
const gripTex = () => ctex('grip', 64, 128, (g, w, h) => {
  g.fillStyle = '#1c1c1e'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) { g.fillStyle = '#2d2d31'; g.fillRect(0, y, w, 3); g.fillStyle = '#111'; g.fillRect(0, y + 5, w, 1); }
  noise(g, w, h, 400, 0.15);
}, 3, 1);
const oliveTex = () => ctex('olive', 256, 256, (g, w, h) => {
  g.fillStyle = '#56643c'; g.fillRect(0, 0, w, h);
  noise(g, w, h, 5000, 0.12);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(200,200,170,${Math.random() * 0.25})`; g.lineWidth = 0.6; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 8); g.stroke(); }
});
const steelTex = () => ctex('steel', 256, 256, (g, w, h) => {
  g.fillStyle = '#8a8e93'; g.fillRect(0, 0, w, h);
  noise(g, w, h, 6000, 0.14);
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(255,255,255,${Math.random() * 0.3})`; g.lineWidth = 0.5; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40); g.stroke(); }
});
const hazardTex = () => ctex('hazard', 256, 32, (g, w, h) => {
  g.fillStyle = '#e0b21e'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#161616';
  for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.fill(); }
}, 2, 1);
const cyl = (rt, rb, h, seg = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);

export function buildModel(id) {
  const root = new THREE.Group();
  if (id === 'bulldozer') { const d = buildDozer(); d.scale.setScalar(0.12); d.rotation.y = -2.4; root.add(d); return { root, flash: null }; }
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, parent = root) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; };
  const wood = std(0xffffff, 0.62, 0, woodTex()), grip = std(0xffffff, 0.9, 0, gripTex());
  const forged = std(0x4a4e54, 0.5, 0.85, steelTex()), polished = std(0xd5d8dc, 0.18, 1), chrome = std(0xeef1f4, 0.1, 1);
  const black = std(0x1b1b1d, 0.5), red = std(0xc0202a, 0.45);
  let flash = null;
  if (id === 'masse') {
    // manche en frêne, poignée caoutchouc, tête de 6 kg dans l'axe de frappe (face avant vers -z)
    add(cyl(0.027, 0.032, 0.86, 16), wood, 0, 0.48, 0);
    add(cyl(0.036, 0.035, 0.22, 16), grip, 0, 0.13, 0);
    add(cyl(0.04, 0.037, 0.025, 16), black, 0, 0.012, 0);
    const hy = 0.94;
    add(new THREE.BoxGeometry(0.115, 0.115, 0.2), forged, 0, hy, 0);
    add(new THREE.BoxGeometry(0.125, 0.03, 0.06), forged, 0, hy - 0.06, 0);
    for (const s of [-1, 1]) {
      add(cyl(0.058, 0.068, 0.035, 8), forged, 0, hy, s * 0.1175, s * Math.PI / 2, 0, 0).rotation.y = Math.PI / 8;
      add(cyl(0.057, 0.058, 0.012, 8), polished, 0, hy, s * 0.141, s * Math.PI / 2, 0, 0).rotation.y = Math.PI / 8;
    }
    add(new THREE.BoxGeometry(0.02, 0.008, 0.07), wood, 0, hy + 0.06, 0);
    add(new THREE.BoxGeometry(0.004, 0.009, 0.075), forged, 0, hy + 0.062, 0);
  } else if (id === 'golf') {
    // fer 7 : poignée à l'origine, tige vers -y, face de frappe côté +z
    add(cyl(0.021, 0.017, 0.27, 16), grip, 0, -0.135, 0);
    add(cyl(0.022, 0.022, 0.012, 16), black, 0, -0.004, 0);
    add(cyl(0.0098, 0.0072, 0.75, 12), std(0xa9aeb4, 0.32, 0.9), 0, -0.645, 0);
    for (let k = 0; k < 5; k++) add(cyl(0.0102 - k * 0.0005, 0.0102 - k * 0.0005, 0.004, 12), polished, 0, -0.33 - k * 0.1, 0);
    add(cyl(0.01, 0.012, 0.05, 12), black, 0, -1.02, 0);
    const club = new THREE.Group(); club.position.set(0, -0.985, 0); club.scale.setScalar(1.5); root.add(club);
    const addC = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => add(geo, mat, x, y, z, rx, ry, rz, club);
    const iron = std(0xb4b9bf, 0.3, 0.95, steelTex());
    addC(cyl(0.012, 0.015, 0.05, 12), iron, 0.01, -0.055, 0, 0, 0, -0.35);
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0.068, -0.006); sh.quadraticCurveTo(0.094, -0.004, 0.094, 0.022); sh.quadraticCurveTo(0.092, 0.05, 0.07, 0.054); sh.lineTo(0.012, 0.03); sh.lineTo(0, 0.02); sh.closePath();
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2, curveSegments: 10 });
    hg.translate(0, 0, -0.007);
    addC(hg, iron, 0.012, -0.085, 0);
    for (let k = 0; k < 6; k++) addC(new THREE.BoxGeometry(0.058, 0.0022, 0.002), black, 0.052, -0.078 + k * 0.0075, 0.0115);
    addC(new THREE.BoxGeometry(0.034, 0.02, 0.003), red, 0.058, -0.062, -0.0115);
    addC(new THREE.BoxGeometry(0.02, 0.006, 0.0032), std(0xd6a534, 0.3, 1), 0.058, -0.062, -0.0118);
  } else if (id === 'pelle') {
    add(cyl(0.023, 0.026, 0.86, 16), wood, 0, 0.5, 0);
    // poignée en D
    const pm = std(0x1e1f22, 0.55);
    add(new THREE.TorusGeometry(0.058, 0.012, 8, 20, Math.PI), pm, 0, 1.0, 0);
    add(cyl(0.014, 0.014, 0.116, 12), pm, 0, 1.0, 0, 0, 0, Math.PI / 2);
    for (const s of [-1, 1]) add(cyl(0.011, 0.013, 0.09, 10), pm, s * 0.032, 0.955, 0, 0, 0, -s * 0.62);
    // douille peinte et lame emboutie
    const paint = std(0x9a2a20, 0.55, 0.3);
    add(cyl(0.027, 0.036, 0.16, 16), paint, 0, 0.02, 0);
    add(cyl(0.029, 0.029, 0.01, 16), forged, 0, 0.095, 0);
    const bs = new THREE.Shape();
    bs.moveTo(-0.118, 0); bs.lineTo(0.118, 0); bs.lineTo(0.112, -0.17); bs.quadraticCurveTo(0.095, -0.265, 0, -0.305); bs.quadraticCurveTo(-0.095, -0.265, -0.112, -0.17); bs.closePath();
    const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 12 });
    const pa = bg.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setZ(i, pa.getZ(i) - 0.0025 + pa.getX(i) * pa.getX(i) * 1.4);
    bg.computeVertexNormals();
    add(bg, std(0x7d8288, 0.4, 0.85, steelTex()), 0, -0.055, 0, 0.12, 0, 0);
    add(new THREE.BoxGeometry(0.24, 0.012, 0.028), paint, 0, -0.052, 0.006);
  } else if (id === 'roquette') {
    const olive = std(0xffffff, 0.72, 0.1, oliveTex()), dark = std(0x2a2d24, 0.6, 0.3), rubber = std(0x19191a, 0.9);
    add(cyl(0.062, 0.062, 1.0, 28), olive, 0, 0, 0, Math.PI / 2, 0, 0);
    add(cyl(0.069, 0.069, 0.05, 28), dark, 0, 0, -0.5, Math.PI / 2, 0, 0);
    add(cyl(0.056, 0.056, 0.052, 28, true), black, 0, 0, -0.5, Math.PI / 2, 0, 0);
    add(cyl(0.1, 0.064, 0.16, 28, true), dark, 0, 0, 0.57, Math.PI / 2, 0, 0).material.side = THREE.DoubleSide;
    add(cyl(0.0635, 0.0635, 0.035, 28), std(0xd9b31d, 0.5), 0, 0, -0.33, Math.PI / 2, 0, 0);
    add(cyl(0.0635, 0.0635, 0.012, 28), std(0xd9b31d, 0.5), 0, 0, 0.36, Math.PI / 2, 0, 0);
    add(new THREE.BoxGeometry(0.11, 0.035, 0.26), rubber, 0, -0.07, 0.26);
    add(new THREE.BoxGeometry(0.036, 0.13, 0.055), rubber, 0, -0.13, 0.08, 0.28, 0, 0);
    add(new THREE.TorusGeometry(0.03, 0.005, 6, 14, Math.PI), dark, 0, -0.07, 0.02, 0, Math.PI / 2, Math.PI);
    add(new THREE.BoxGeometry(0.008, 0.03, 0.01), black, 0, -0.08, 0.025, 0.4, 0, 0);
    add(new THREE.BoxGeometry(0.034, 0.11, 0.045), rubber, 0, -0.115, -0.2, 0.15, 0, 0);
    // viseur optique
    add(new THREE.BoxGeometry(0.02, 0.03, 0.04), dark, -0.045, 0.06, 0.02);
    add(cyl(0.022, 0.022, 0.13, 16), black, -0.062, 0.085, 0.02, Math.PI / 2, 0, 0);
    add(new THREE.CircleGeometry(0.018, 16), new THREE.MeshBasicMaterial({ color: 0x4fb0e0 }), -0.062, 0.085, 0.0855);
    add(new THREE.CircleGeometry(0.019, 16), new THREE.MeshStandardMaterial({ color: 0x223a50, roughness: 0.05, metalness: 0.8 }), -0.062, 0.085, -0.0455, 0, Math.PI, 0);
    for (const z of [-0.12, 0.2]) add(cyl(0.064, 0.064, 0.02, 28), dark, 0, 0, z, Math.PI / 2, 0, 0);
    // la roquette chargée : ogive, corps, ailettes repliées
    flash = new THREE.Group(); root.add(flash);
    const war = std(0x4d5a34, 0.6, 0.2);
    add(cyl(0.045, 0.045, 0.1, 20), war, 0, 0, -0.56, Math.PI / 2, 0, 0, flash);
    add(cyl(0.085, 0.045, 0.12, 24), war, 0, 0, -0.67, Math.PI / 2, 0, 0, flash);
    add(cyl(0.085, 0.085, 0.07, 24), war, 0, 0, -0.765, Math.PI / 2, 0, 0, flash);
    add(new THREE.ConeGeometry(0.085, 0.2, 24), war, 0, 0, -0.9, -Math.PI / 2, 0, 0, flash);
    add(cyl(0.012, 0.012, 0.06, 10), red, 0, 0, -1.02, Math.PI / 2, 0, 0, flash);
    add(cyl(0.0855, 0.0855, 0.015, 24), std(0xc0202a, 0.5), 0, 0, -0.73, Math.PI / 2, 0, 0, flash);
  } else if (id === 'bombe') {
    add(new THREE.CapsuleGeometry(0.17, 0.32, 8, 20), std(0xe8c22a, 0.45, 0.2), 0, 0, 0, Math.PI / 2, 0, 0);
    for (const z of [-0.12, 0.12]) add(new THREE.CylinderGeometry(0.175, 0.175, 0.05, 20), black, 0, 0, z, Math.PI / 2, 0, 0);
    for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.01, 0.22, 0.16), black, 0, 0, 0.36, 0, 0, k * Math.PI / 4 + Math.PI / 4);
    // trèfle
    for (let k = 0; k < 3; k++) { const m = add(new THREE.CircleGeometry(0.07, 3, k * 2.094 - 0.35, 0.7), black, 0, 0.176, 0, -Math.PI / 2, 0, 0); m.position.y = 0.177; }
    flash = add(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020 }), 0, 0.17, -0.2);
  } else if (id === 'piolet') {
    // piolet technique : manche courbé gainé, lame dentée, panne, dragonne
    const shaft = std(0x1f5fa8, 0.4, 0.5), orange = std(0xe8641a, 0.6), pick = std(0x9aa0a6, 0.25, 0.95, steelTex());
    const two = (ox, oz, rz, sc) => {
      const g = new THREE.Group(); g.position.set(ox, 0, oz); g.rotation.z = rz; g.scale.setScalar(sc); root.add(g);
      const a = (geo, mat, x, y, z, rx = 0, ry = 0, r2 = 0) => add(geo, mat, x, y, z, rx, ry, r2, g);
      a(cyl(0.016, 0.018, 0.3, 12), shaft, 0, 0.15, 0);
      a(cyl(0.016, 0.016, 0.22, 12), shaft, 0.018, 0.4, 0, 0, 0, -0.18);
      a(cyl(0.02, 0.02, 0.16, 12), grip, 0, 0.02, 0);
      a(cyl(0.024, 0.02, 0.03, 12), orange, 0, -0.07, 0);
      a(new THREE.BoxGeometry(0.035, 0.05, 0.03), pick, 0.035, 0.52, 0);
      const bs = new THREE.Shape();
      bs.moveTo(0, 0.012); bs.quadraticCurveTo(-0.1, 0.0, -0.2, -0.07); bs.lineTo(-0.19, -0.085); bs.quadraticCurveTo(-0.1, -0.03, 0, -0.012); bs.closePath();
      const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.006, bevelEnabled: false }); bg.translate(0, 0, -0.003);
      a(bg, pick, 0.02, 0.52, 0);
      for (let k = 0; k < 4; k++) a(new THREE.BoxGeometry(0.008, 0.01, 0.007), pick, -0.11 - k * 0.025, 0.487 - k * 0.013, 0);
      a(new THREE.BoxGeometry(0.06, 0.018, 0.028), pick, 0.08, 0.525, 0);
      a(new THREE.TorusGeometry(0.035, 0.005, 6, 14), orange, 0, -0.04, 0.02, 0.3, 0, 0);
      return g;
    };
    const R0 = two(0, 0, 0, 0.52), L0 = two(-0.4, 0, 0, 0.52);
    L0.scale.x = -1;
    root.userData.axes = [L0, R0];
  } else if (id === 'pistoleau') {
    // jouet en plastique brillant, couleurs acidulées ; l'avant est vers -z
    const toy = (c) => std(c, 0.28, 0.05);
    const lime = toy(0x7ed321), orange = toy(0xff8a1c), pink = toy(0xff4fa3), yel = toy(0xffd21f), purple = toy(0x8c5cff);
    const water = new THREE.MeshStandardMaterial({ color: 0x5ec8ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55, emissive: 0x0a3a5a });
    const tank = new THREE.MeshStandardMaterial({ color: 0xcfefff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.35 });
    add(new THREE.CapsuleGeometry(0.055, 0.34, 8, 18), lime, 0, 0, -0.05, Math.PI / 2, 0, 0);
    add(new THREE.CylinderGeometry(0.03, 0.04, 0.16, 16), lime, 0, 0.005, -0.3, Math.PI / 2, 0, 0);
    add(new THREE.CylinderGeometry(0.022, 0.032, 0.07, 16), pink, 0, 0.005, -0.41, Math.PI / 2, 0, 0);
    add(new THREE.TorusGeometry(0.026, 0.008, 8, 18), yel, 0, 0.005, -0.445);
    add(new THREE.CapsuleGeometry(0.045, 0.2, 8, 16), tank, 0, 0.1, 0.0, Math.PI / 2, 0, 0);
    add(new THREE.CapsuleGeometry(0.036, 0.17, 8, 16), water, 0, 0.09, 0.0, Math.PI / 2, 0, 0);
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12), orange, 0, 0.16, 0.11);
    add(new THREE.BoxGeometry(0.05, 0.15, 0.075), orange, 0, -0.1, 0.12, 0.3, 0, 0);
    for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.052, 0.012, 0.078), yel, 0, -0.06 - k * 0.04, 0.12 + k * 0.012, 0.3, 0, 0);
    add(new THREE.TorusGeometry(0.03, 0.007, 8, 16, Math.PI), yel, 0, -0.055, 0.03, 0, Math.PI / 2, Math.PI);
    add(new THREE.BoxGeometry(0.012, 0.035, 0.018), yel, 0, -0.065, 0.035, 0.35, 0, 0);
    add(new THREE.CapsuleGeometry(0.032, 0.12, 6, 14), purple, 0, -0.055, -0.2, Math.PI / 2, 0, 0);
    for (let k = 0; k < 4; k++) add(new THREE.TorusGeometry(0.033, 0.005, 6, 14), pink, 0, -0.055, -0.25 + k * 0.035);
    // autocollants : étoile et petit soleil
    const star = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, r = k % 2 ? 0.012 : 0.028; star[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
    for (const s of [-1, 1]) {
      add(new THREE.ShapeGeometry(star), yel, s * 0.056, 0.005, -0.06, 0, s * Math.PI / 2, 0);
      add(new THREE.CircleGeometry(0.014, 16), pink, s * 0.056, 0.02, 0.07, 0, s * Math.PI / 2, 0);
    }
    flash = add(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0.8 }), 0, 0.005, -0.48);
    flash.visible = false;
    root.scale.setScalar(0.68);
  } else if (id === 'mine') {
    const olive = std(0xffffff, 0.75, 0.1, oliveTex());
    const prof = [[0, 0], [0.148, 0], [0.16, 0.01], [0.162, 0.05], [0.15, 0.068], [0.07, 0.074], [0, 0.074]].map(([x, y]) => new THREE.Vector2(x, y));
    add(new THREE.LatheGeometry(prof, 40), olive, 0, -0.035, 0);
    add(cyl(0.1625, 0.1625, 0.022, 40, true), std(0xffffff, 0.6, 0, hazardTex()), 0, -0.005, 0).material.side = THREE.DoubleSide;
    add(cyl(0.058, 0.064, 0.022, 28), forged, 0, 0.048, 0);
    for (const r of [0.02, 0.04]) add(new THREE.TorusGeometry(r, 0.0035, 6, 24), forged, 0, 0.059, 0, Math.PI / 2, 0, 0);
    add(new THREE.BoxGeometry(0.052, 0.012, 0.03), black, 0.1, 0.037, 0);
    add(new THREE.BoxGeometry(0.038, 0.004, 0.018), new THREE.MeshBasicMaterial({ color: 0xff3a1a }), 0.1, 0.044, 0);
    for (const a of [0, 2.1, 4.2]) add(new THREE.BoxGeometry(0.02, 0.012, 0.012), forged, Math.cos(a) * 0.155, 0.02, Math.sin(a) * 0.155, 0, -a, 0);
    flash = add(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020 }), 0.1, 0.04, 0.03);
  }
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, flash };
}

// poses de repos (espace caméra de l'arme)
const REST = {
  masse: { p: [0.26, -0.66, -0.88], r: [0.12, 0.35, -0.12] },
  golf: { p: [0.3, -0.42, -0.58], r: [2.6, 0, -0.35] },
  pelle: { p: [0.24, -0.3, -1.08], r: [1.42, 0.12, 0] },
  roquette: { p: [0.22, -0.18, -0.5], r: [0.02, 0.05, 0] },
  pistoleau: { p: [0.17, -0.17, -0.5], r: [0.03, 0.05, 0] },
  bombe: { p: [0.3, -0.32, -0.95], r: [0.2, 0.6, 0] },
  mine: { p: [0.2, -0.26, -0.8], r: [0.55, 0, 0.2] },
  bulldozer: { p: [0, -5, 0], r: [0, 0, 0] },
  piolet: { p: [0.2, -0.27, -0.62], r: [0.3, 0, 0] },
};

// ------------------------------------------------------------------ système
export class WeaponSystem {
  constructor(o) {
    Object.assign(this, o);
    this.models = WEAPONS.map((w) => { const m = buildModel(w.id); m.root.visible = false; this.vmScene.add(m.root); return m; });
    this.cur = 0; this.cool = 0; this.anim = 1; this.animKind = ''; this.hitT = -1; this.firing = false;
    this.ammo = WEAPONS.map((w) => w.mag ?? Infinity); this.reloadT = -1;
    this.projs = []; this.mines = []; this.bomb = null; this.bombCD = 0; this.nukeS = null;
    this.switchT = 0; this.recoil = 0; this.spreadK = 0;
    this._d = new THREE.Vector3();
    const wg = new THREE.SphereGeometry(0.11, 10, 8), wm = new THREE.MeshStandardMaterial({ color: 0x6fd0ff, roughness: 0.05, transparent: true, opacity: 0.75, emissive: 0x0b4a70 });
    this.mkDrop = () => { const m = new THREE.Mesh(wg, wm); m.scale.set(1, 1, 2.2); return m; };
    this.mkRocket = () => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 10), std(0x5b6a3a)); b.rotation.x = Math.PI / 2; g.add(b); const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 10), std(0xc0202a)); c.rotation.x = -Math.PI / 2; c.position.z = -0.36; g.add(c); return g; };
  }
  get w() { return WEAPONS[this.cur]; }
  setWorld(world) { this.world = world; this.clearAll(); }
  clearAll() {
    for (const p of this.projs) this.scene.remove(p.mesh);
    for (const m of this.mines) this.scene.remove(m.mesh);
    if (this.bomb) this.scene.remove(this.bomb.mesh);
    this.projs = []; this.mines = []; this.bomb = null; this.bombCD = 0; this.nukeS = null;
  }
  resetAmmo() { this.ammo = WEAPONS.map((w) => w.mag ?? Infinity); this.reloadT = -1; this.cool = 0; this.anim = 1; }
  select(i, instant = false) {
    if (i === this.cur && !instant) return;
    this.cur = i; this.anim = 1; this.hitT = -1; this.reloadT = -1; this.switchT = instant ? 0 : 0.25; this.cool = Math.max(this.cool, instant ? 0 : 0.2);
    this.models.forEach((m, k) => { m.root.visible = k === i; });
    if (!instant) this.audio.play('switch');
    if (this.onSwitch) this.onSwitch(this.w, instant);
    if (this.ammo[i] <= 0) this.reload();
  }
  trigger(on) { this.firing = on; }
  reload() {
    const w = this.w;
    if (!w.mag || this.reloadT >= 0 || this.ammo[this.cur] >= w.mag) return;
    this.reloadT = 0; this.audio.play('reload');
  }

  _camRay() {
    const d = this._d.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    return { o: this.camera.position, d };
  }

  // coup de mêlée
  _strike(w) {
    const { o, d } = this._camRay();
    const W = this.world;
    const h = W.raycast(o.x, o.y, o.z, d.x, d.y, d.z, w.range);
    if (!h) { this.onHit && this.onHit(false); return false; }
    const c = new THREE.Vector3(h.px + d.x * 0.15, h.py + d.y * 0.15, h.pz + d.z * 0.15);
    const r = W.blast(c.x, c.y, c.z, w.radius, w.power, w.mul);
    this.lastBlast(c, w.fling ?? (w.kind === 'dig' ? 3 : 5));
    this.audio.impact(SND[h.m] || 'plaster', c, w.kind === 'dig' ? 0.7 : 1);
    if (w.kind === 'dig') this.audio.play('dig', c);
    else this.audio.play('thump', c, 0.8);
    this.fx.puff(c.x, c.y, c.z, 4, [0.62, 0.58, 0.5], 0.4, 1);
    this.fx.shake(w.shake);
    if (this.hitstop && r.n) this.hitstop(0.04);
    this.onHit && this.onHit(r.n > 0, h.m);
    return true;
  }

  _fire(w) {
    const { o, d } = this._camRay();
    const W = this.world;
    if (w.kind === 'melee' || w.kind === 'dig') {
      this.anim = 0; this.animKind = 'swing'; this.hitT = w.hitDelay; this.cool = w.rate;
      this.audio.play(w.id === 'masse' ? 'swingHeavy' : 'swing');
      this.onShot && this.onShot();
    } else if (w.kind === 'golf') {
      this.anim = 0; this.animKind = 'golf'; this.hitT = w.hitDelay; this.cool = w.rate;
      this.audio.play('swing');
      this.onShot && this.onShot();
    } else if (w.kind === 'rocket') {
      if (this.ammo[this.cur] <= 0) { this.reload(); return; }
      this.ammo[this.cur]--; this.cool = w.rate; this.recoil = 1;
      const mesh = this.mkRocket();
      const p = o.clone().addScaledVector(d, 0.8); p.y -= 0.12;
      mesh.position.copy(p); mesh.lookAt(p.clone().sub(d)); this.scene.add(mesh);
      this.projs.push({ kind: 'rocket', mesh, pos: p, vel: d.clone().multiplyScalar(w.speed), t: 0, w });
      this.audio.play('rocket', p);
      this.fx.puff(p.x, p.y, p.z, 8, [0.8, 0.78, 0.75], 0.5, 1.5);
      this.fx.shake(0.25);
      this.onShot && this.onShot();
      if (this.ammo[this.cur] <= 0) setTimeout(() => this.reload(), 150);
    } else if (w.kind === 'water') {
      if (this.ammo[this.cur] <= 0) { this.reload(); return; }
      this.ammo[this.cur]--; this.cool = w.rate; this.recoil = Math.min(1, this.recoil + 0.25);
      const s = 0.012;
      const dd = d.clone().add(new THREE.Vector3(rand(-s, s), rand(-s, s), rand(-s, s))).normalize();
      const p = o.clone().addScaledVector(dd, 0.6); p.y -= 0.12;
      const mesh = this.mkDrop(); mesh.position.copy(p); mesh.lookAt(p.clone().add(dd)); this.scene.add(mesh);
      this.projs.push({ kind: 'water', mesh, pos: p, vel: dd.multiplyScalar(w.speed), t: 0, w });
      this.audio.play('squirt', p, 1.1);
      this.fx.smoke.add(p.x, p.y, p.z, dd.x * 2, dd.y * 2, dd.z * 2, 0.25, 0.08, 0.3, [0.75, 0.92, 1, 0.8], [0.8, 0.95, 1, 0], 4, 1);
      this.muzzleT = 0.04;
      this.onShot && this.onShot();
      if (this.ammo[this.cur] <= 0) setTimeout(() => this.reload(), 100);
    } else if (w.kind === 'climb') {
      this.cool = w.rate;   // les piolets ne cassent rien
    } else if (w.kind === 'dozer') {
      this.cool = w.rate; this.firing = false;
      this.onDozerClick && this.onDozerClick();
    } else if (w.kind === 'mine' || w.kind === 'nuke') {
      if (w.kind === 'nuke') {
        if (this.bomb || this.nukeS) return;
        if (this.bombCD > 0) { this.cool = 0.8; this.onBombWait && this.onBombWait(this.bombCD); return; }
      }
      if (w.kind === 'mine' && this.mines.length >= w.max) { this.cool = 0.4; this.onMineMax && this.onMineMax(); return; }
      const h = W.raycast(o.x, o.y, o.z, d.x, d.y, d.z, w.range);
      let pos, n;
      if (h) { pos = new THREE.Vector3(h.px, h.py, h.pz); n = new THREE.Vector3(h.nx, h.ny, h.nz); }
      else { pos = new THREE.Vector3(o.x + d.x * 1.2, 0, o.z + d.z * 1.2); pos.y = W.groundBelow(pos.x, pos.z, o.y); n = new THREE.Vector3(0, 1, 0); }
      const m = buildModel(w.id);
      const mesh = m.root;
      if (w.kind === 'nuke') { mesh.scale.setScalar(3.2); mesh.rotation.y = rand(0, 6); pos.addScaledVector(n, 0.55); }
      else { mesh.scale.setScalar(1.6); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); pos.addScaledVector(n, 0.06); }
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.anim = 0; this.animKind = 'place'; this.cool = w.rate;
      this.audio.play('mine_arm', pos);
      if (w.kind === 'mine') this.mines.push({ mesh, flash: m.flash, pos, n, t: w.fuse, beep: 0, w });
      else { this.bomb = { mesh, flash: m.flash, pos, t: w.fuse, beep: 0, w }; this.onBombArmed && this.onBombArmed(); }
    }
  }

  _golfHit(w) {
    const hit = this._strike(w);
    this.audio.play(hit ? 'golf' : 'swing', this.camera.position, hit ? 1 : 0.5);
  }

  _explode(pos, w, dir = null) {
    const W = this.world;
    const c = pos.clone();
    if (dir) c.addScaledVector(dir, 0.3);
    const r = W.blast(c.x, c.y, c.z, w.radius, w.power, null, w.kind === 'mine' ? 0.7 : 1);
    this.lastBlast(c, 14);
    this.fx.explosion(c.x, c.y, c.z, w.radius * 0.7);
    if (w.kind === 'water') { this.fx.splash(c.x, c.y, c.z, 2); this.fx.miniMushroom(c.x, c.y, c.z, w.radius * 0.6); }
    this.fx.dust(c.x, c.y - 0.5, c.z, w.radius * 0.6, 14);
    // la giclée « nucléaire » : le grondement de la grosse bombe, en plus court et moins fort
    if (w.boom) { this.audio.play('miniNuke', c, w.boom); this.audio.play('explosion', c, 1.2); }
    else this.audio.play('explosion', c, 1.3);
    this.fx.shake(w.shake * Math.max(0.3, 1 - this.camera.position.distanceTo(c) / 40));
    if (this.hitstop && r.n > 30 && w.kind !== 'water') this.hitstop(0.06);
    this.onExplosion && this.onExplosion(r.n, c, w);
  }

  // ------------------------------------------------------------ la bombe
  _nukeStart(pos, w) {
    const W = this.world;
    const cx = (pos.x - W.ox) / VS, cz = (pos.z - W.oz) / VS;
    const { sx, sz, sy, sxz, data, dmg } = W;
    const colV = new Float32Array(sx * sz);
    for (let y = GROUND; y < sy; y++) {
      const off = y * sxz;
      for (let i = 0; i < sxz; i++) {
        const m = data[off + i];
        if (m && !GROUNDM[m] && !(dmg[off + i] & 128)) colV[i] += VAL[m];
      }
    }
    const idx = [], dist = [];
    for (let z = 0; z < sz; z++) for (let x = 0; x < sx; x++) { idx.push(x + z * sx); dist.push(Math.hypot(x + 0.5 - cx, z + 0.5 - cz)); }
    const order = idx.map((_, k) => k).sort((a, b) => dist[a] - dist[b]);
    const remaining = W.pctTotal - W.destroyedPct;
    const target = Math.min(remaining, W.pctTotal * w.share);
    let acc = 0, R = 0;
    for (const k of order) { acc += colV[idx[k]]; R = dist[k]; if (acc >= target) break; }
    R = Math.max(28, Math.min(Math.max(sx, sz) * 0.8, R + 2));
    const list = order.filter((k) => dist[k] <= R);
    this.nukeS = { cx, cz, R, list, idx, dist, n: 0, r: 0, speed: R / 1.25, pos: pos.clone() };
    const Rm = R * VS;
    this.fx.nuke(pos.x, pos.y, pos.z, Rm);
    this.lastBlast(pos, 30);
    this.audio.play('bigboom', null, 1.6); this.audio.play('nuke');
    this.fx.shake(1.6);
    this.onNuke && this.onNuke(pos, Rm);
  }
  _nukeStep(dt) {
    const S = this.nukeS, W = this.world;
    S.r += S.speed * dt;
    const depth = 8;
    while (S.n < S.list.length) {
      const k = S.list[S.n], d = S.dist[k];
      if (d > S.r) break;
      S.n++;
      const i = S.idx[k], x = i % W.sx, z = (i / W.sx) | 0, t = d / S.R;
      let yb;
      if (t < 0.82) yb = Math.max(1, GROUND - Math.round(depth * (1 - (t / 0.82) ** 2)));
      else yb = GROUND + Math.floor(((t - 0.82) / 0.18) ** 1.6 * (30 + Math.random() * 40));
      W.razeColumn(x, z, yb, t > 0.7 ? 0.05 : 0.004);
    }
    if (S.n >= S.list.length) {
      // le pourtour : ce qui ne tient plus tombe
      const R2 = S.R + 3;
      for (let z = Math.max(0, Math.floor(S.cz - R2)); z < Math.min(W.sz, Math.ceil(S.cz + R2)); z++) for (let x = Math.max(0, Math.floor(S.cx - R2)); x < Math.min(W.sx, Math.ceil(S.cx + R2)); x++) {
        const d = Math.hypot(x + 0.5 - S.cx, z + 0.5 - S.cz);
        if (d < S.R * 0.8 || d > R2) continue;
        for (let y = GROUND; y < W.sy; y += 2) { const j = x + z * W.sx + y * W.sxz; if (W.data[j]) W.seeds.push(j); }
      }
      this.nukeS = null;
      this.bombCD = WEAPONS.find((w) => w.kind === 'nuke').cooldown;
      this.onNukeDone && this.onNukeDone();
    }
  }

  // ------------------------------------------------------------ boucle
  update(dt, player) {
    const w = this.w, W = this.world;
    this.cool -= dt; this.switchT = Math.max(0, this.switchT - dt);
    if (this.bombCD > 0 && !this.bomb && !this.nukeS) { this.bombCD -= dt; if (this.bombCD <= 0) { this.bombCD = 0; this.onBombReady && this.onBombReady(); } }
    if (this.reloadT >= 0) {
      this.reloadT += dt;
      if (this.reloadT >= w.reload) { this.ammo[this.cur] = w.mag; this.reloadT = -1; }
    } else if (this.firing && this.cool <= 0 && this.switchT <= 0) {
      this._fire(w);
      if (w.kind !== 'rocket') this.firing = this.firing && (w.kind === 'melee' || w.kind === 'dig' || w.kind === 'golf' || w.kind === 'water');
    }
    if (this.hitT >= 0) { this.hitT -= dt; if (this.hitT < 0) { if (w.kind === 'golf') this._golfHit(w); else this._strike(w); } }

    // roquettes et giclées d'eau
    for (let k = this.projs.length - 1; k >= 0; k--) {
      const p = this.projs[k];
      p.t += dt;
      if (p.kind === 'water') p.vel.y -= 5 * (W.g ?? 1) * dt;
      const sp = p.vel.length(), step = sp * dt;
      const d = p.vel.clone().divideScalar(sp || 1);
      const h = W.raycast(p.pos.x, p.pos.y, p.pos.z, d.x, d.y, d.z, step + 0.05);
      let dead = p.t > 5;
      if (h) { this._explode(new THREE.Vector3(h.px, h.py, h.pz), p.w, d); dead = true; }
      else p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
      if (p.kind === 'water') { if (Math.random() < 0.6) this.fx.smoke.add(p.pos.x, p.pos.y, p.pos.z, rand(-0.3, 0.3), rand(-0.5, 0.2), rand(-0.3, 0.3), 0.35, 0.07, 0.02, [0.6, 0.85, 1, 0.8], [0.7, 0.9, 1, 0], 9, 0.5); }
      else this.fx.trail(p.pos.x, p.pos.y, p.pos.z);
      if (dead) {
        if (!h) { if (p.kind === 'rocket') this._explode(p.pos, p.w); else this.fx.splash(p.pos.x, p.pos.y, p.pos.z, 0.5); }
        this.scene.remove(p.mesh); this.projs.splice(k, 1);
      }
    }
    // mines
    for (let k = this.mines.length - 1; k >= 0; k--) {
      const m = this.mines[k];
      m.t -= dt; m.beep -= dt;
      const rate = m.t < 1 ? 0.1 : m.t < 2 ? 0.25 : 0.5;
      if (m.beep <= 0) { m.beep = rate; this.audio.play('beep', m.pos, 0.7); if (m.flash) m.flash.visible = true; }
      else if (m.flash && m.beep < rate * 0.5) m.flash.visible = false;
      if (m.t <= 0) { this.scene.remove(m.mesh); this.mines.splice(k, 1); this._explode(m.pos.clone().addScaledVector(m.n, -0.4), m.w); }
    }
    // la bombe
    if (this.bomb) {
      const B = this.bomb;
      B.t -= dt; B.beep -= dt;
      const rate = B.t < 1.5 ? 0.12 : B.t < 3 ? 0.3 : 0.6;
      if (B.beep <= 0) { B.beep = rate; this.audio.play('beep', B.pos, 1); this.audio.play('siren', null, 0.5); if (B.flash) B.flash.visible = true; }
      else if (B.flash && B.beep < rate * 0.5) B.flash.visible = false;
      if (B.t <= 0) { this.scene.remove(B.mesh); this.bomb = null; this._nukeStart(B.pos, B.w); }
    }
    if (this.nukeS) this._nukeStep(dt);
    this._animate(dt, player);
  }

  lastBlast(c, force) { this.world.lastBlast = { x: c.x, y: c.y, z: c.z, force }; }

  _animate(dt, player) {
    const w = this.w, m = this.models[this.cur], R = REST[w.id];
    if (!m) return;
    const g = m.root;
    this.anim = Math.min(1, this.anim + dt / Math.max(0.25, w.rate || 0.5));
    this.recoil = Math.max(0, this.recoil - dt * 4);
    const t = this.anim;
    let px = R.p[0], py = R.p[1], pz = R.p[2], rx = R.r[0], ry = R.r[1], rz = R.r[2];
    const bob = player ? player.bobAmt : 0, bt = player ? player.bobT : 0;
    px += Math.sin(bt) * 0.012 * bob; py += Math.abs(Math.cos(bt)) * 0.012 * bob;
    if (this.animKind === 'swing' && w.id === 'pelle' && t < 1) {
      if (t < 0.35) { const k = t / 0.35; pz -= 0.3 * k; py -= 0.06 * k; }
      else { const k = (t - 0.35) / 0.65, e = Math.sin(k * Math.PI); pz -= 0.3 * (1 - k); rx -= 0.5 * e; py += 0.12 * e; }
    } else if (this.animKind === 'swing' && t < 1) {
      if (t < 0.28) { const k = t / 0.28; rx += 1.0 * k; py += 0.18 * k; pz += 0.1 * k; }
      else if (t < 0.4) { const k = (t - 0.28) / 0.12; rx += 1.0 - 2.35 * k; py += 0.18 - 0.26 * k; pz += 0.1 - 0.24 * k; }
      else { const k = (t - 0.4) / 0.6; rx += -1.35 * (1 - k); py += -0.08 * (1 - k); pz += -0.14 * (1 - k); }
    } else if (this.animKind === 'golf' && t < 1) {
      // montée, puis le swing descend devant soi et finit à gauche
      if (t < 0.28) { const k = t / 0.28; rx += 0.4 * k; rz -= 0.25 * k; px += 0.05 * k; py += 0.06 * k; }
      else if (t < 0.46) { const k = (t - 0.28) / 0.18; rx += 0.4 - 2.4 * k; rz += -0.25 + 0.55 * k; px += 0.05 - 0.3 * k; py += 0.06 - 0.16 * k; pz -= 0.15 * k; }
      else { const k = (t - 0.46) / 0.54; rx += -2.0 * (1 - k); rz += 0.3 * (1 - k); px += -0.25 * (1 - k); py += -0.1 * (1 - k); pz -= 0.15 * (1 - k); }
    } else if (this.animKind === 'place' && t < 1) {
      const k = Math.sin(t * Math.PI); py -= 0.25 * k; pz -= 0.25 * k; rx += 0.5 * k;
    }
    if (this.reloadT >= 0) { const k = Math.sin(Math.min(1, this.reloadT / w.reload) * Math.PI); py -= 0.25 * k; rx -= 0.6 * k; }
    // les deux piolets frappent le mur l'un après l'autre
    const axes = g.userData.axes;
    if (axes) {
      const cl = player && player.clinging, ph = player ? player.climbStep * Math.PI : 0;
      axes.forEach((a, k) => {
        const s = cl ? Math.sin(ph + k * Math.PI) : 0;
        a.rotation.x = cl ? -0.9 - 0.6 * Math.max(0, s) : 0;
        a.position.y = cl ? 0.18 + 0.14 * s : 0;
        a.position.z = cl ? -0.12 : 0;
      });
    }
    if (this.switchT > 0) py -= this.switchT * 1.6;
    pz += this.recoil * 0.12; rx += this.recoil * 0.12;
    g.position.set(px, py, pz); g.rotation.set(rx, ry, rz);
    // roquette chargée ou non, bombe indisponible
    if (w.id === 'pistoleau' && m.flash) { this.muzzleT = Math.max(0, (this.muzzleT || 0) - dt); m.flash.visible = this.muzzleT > 0; m.flash.scale.setScalar(0.7 + Math.random() * 0.8); }
    if (w.id === 'roquette' && m.flash) m.flash.visible = this.ammo[this.cur] > 0 && this.reloadT < 0;
    if (w.id === 'bombe') g.visible = !this.bomb && !this.nukeS && this.bombCD <= 0;
    if (w.id === 'mine' && m.flash) m.flash.visible = Math.sin(performance.now() / 150) > 0;
  }
}
