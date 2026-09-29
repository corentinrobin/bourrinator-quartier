// Le bulldozer : on le conduit en vue arrière, la lame rabote tout ce qu'elle rencontre (et creuse si on la baisse).
import * as THREE from 'three';
import { VS, HARDQ } from './voxel.js';

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const std = (color, rough = 0.6, metal = 0, map = null) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, map });

let TRACK = null;
function trackTex() {
  if (TRACK) return TRACK;
  const c = document.createElement('canvas'); c.width = 64; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#1d1d1f'; g.fillRect(0, 0, 64, 256);
  for (let y = 0; y < 256; y += 16) { g.fillStyle = '#3a3a3e'; g.fillRect(0, y, 64, 9); g.fillStyle = '#0d0d0e'; g.fillRect(0, y + 9, 64, 2); }
  TRACK = new THREE.CanvasTexture(c); TRACK.colorSpace = THREE.SRGBColorSpace; TRACK.wrapS = TRACK.wrapT = THREE.RepeatWrapping; TRACK.repeat.set(1, 3);
  return TRACK;
}

// modèle en mètres ; l'avant est vers -z, le sol à y = 0
export function buildDozer() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const add = (geo, mat, x, y, z, parent = body, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const yellow = std(0xf0b418, 0.5, 0.15), dark = std(0x26272a, 0.7, 0.3), steel = std(0x8a8f95, 0.35, 0.85), black = std(0x141414, 0.8);
  const glass = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.55 });
  const track = std(0xffffff, 0.9, 0.2, trackTex());
  // chenilles
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(0.72, 0.9, 5.0), track, s * 1.36, 0.45, 0);
    for (const z of [-2.35, 2.35]) add(new THREE.CylinderGeometry(0.46, 0.46, 0.74, 18), track, s * 1.36, 0.46, z, body, 0, 0, Math.PI / 2);
    for (let k = -1; k <= 1; k++) add(new THREE.CylinderGeometry(0.2, 0.2, 0.76, 12), dark, s * 1.36, 0.3, k * 1.2, body, 0, 0, Math.PI / 2);
    add(new THREE.BoxGeometry(0.1, 0.25, 4.2), yellow, s * 1.74, 0.72, 0);
  }
  // châssis, capot moteur, cabine
  add(new THREE.BoxGeometry(2.1, 0.9, 4.4), yellow, 0, 1.3, 0.2);
  add(new THREE.BoxGeometry(1.7, 0.9, 2.3), yellow, 0, 2.15, -0.95);
  for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(1.5, 0.05, 0.08), dark, 0, 2.62, -1.8 + k * 0.3);
  add(new THREE.BoxGeometry(1.4, 0.7, 0.06), dark, 0, 2.05, -2.12);
  add(new THREE.BoxGeometry(2.0, 0.12, 1.9), yellow, 0, 3.72, 0.95);
  for (const [x, z] of [[-0.92, 0.08], [0.92, 0.08], [-0.92, 1.82], [0.92, 1.82]]) add(new THREE.BoxGeometry(0.12, 1.9, 0.12), yellow, x, 2.75, z);
  add(new THREE.BoxGeometry(1.75, 1.8, 1.65), glass, 0, 2.72, 0.95);
  add(new THREE.BoxGeometry(0.5, 0.5, 0.4), black, 0.2, 2.1, 1.1);
  add(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 10), black, 0.55, 3.05, -1.6);
  add(new THREE.CylinderGeometry(0.11, 0.08, 0.1, 10), black, 0.55, 3.62, -1.6);
  const beacon = add(new THREE.CylinderGeometry(0.1, 0.12, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xff8a1a, emissive: 0xff6a00, emissiveIntensity: 2 }), -0.6, 3.87, 1.4);
  for (const x of [-0.6, 0.6]) add(new THREE.BoxGeometry(0.28, 0.16, 0.12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 1.6 }), x, 3.66, -0.05);
  // défonceuse arrière
  add(new THREE.BoxGeometry(1.2, 0.2, 0.8), dark, 0, 1.1, 2.7);
  add(new THREE.BoxGeometry(0.16, 1.2, 0.2), steel, 0, 0.6, 3.0, body, 0.3, 0, 0);
  // lame et bras de poussée (groupe mobile)
  const blade = new THREE.Group(); blade.position.set(0, 0, -3.1); body.add(blade);
  // versoir concave côté avant, bord tranchant en bas et en avant
  const mold = new THREE.Group(); mold.scale.set(1, -1, -1); mold.position.y = 1.9; blade.add(mold);
  const bm = add(new THREE.CylinderGeometry(1.9, 1.9, 4.0, 24, 1, true, Math.PI * 0.62, Math.PI * 0.4), yellow, 0, 0.95, 1.55, mold, 0, 0, Math.PI / 2);
  bm.material = bm.material.clone(); bm.material.side = THREE.DoubleSide;
  // on cale le versoir : bord bas au ras du sol, juste derrière le tranchant
  root.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(mold);
  mold.position.y += 0.08 - bb.min.y;
  add(new THREE.BoxGeometry(4.0, 0.12, 0.3), steel, 0, 0.06, -0.78, blade);
  // joues latérales triangulaires qui suivent le profil de la lame
  const cheek = new THREE.Shape([new THREE.Vector2(-0.8, 0.08), new THREE.Vector2(0.4, 0.08), new THREE.Vector2(0.4, 1.95), new THREE.Vector2(0.1, 1.95)]);
  const cg = new THREE.ExtrudeGeometry(cheek, { depth: 0.1, bevelEnabled: false });
  for (const x of [-1.9, 2.0]) add(cg, yellow, x, 0, 0, blade, 0, -Math.PI / 2, 0);
  for (const x of [-1.2, 0, 1.2]) add(new THREE.BoxGeometry(0.08, 1.2, 0.3), dark, x, 0.85, 0.55, blade);
  for (const x of [-1.36, 1.36]) add(new THREE.BoxGeometry(0.22, 0.26, 2.2), yellow, x, 0.62, 1.2, blade);
  for (const x of [-0.7, 0.7]) add(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 10), steel, x, 1.6, 1.1, blade, -1.1, 0, 0);
  root.userData = { body, blade, beacon };
  return root;
}

export class Dozer {
  constructor(scene, world, fx, audio) {
    this.scene = scene; this.world = world; this.fx = fx; this.audio = audio;
    this.mesh = buildDozer(); scene.add(this.mesh);
    this.pos = new THREE.Vector3(); this.yaw = 0; this.speed = 0; this.vy = 0;
    this.bladeDown = false; this.bladeY = 0.45; this.pitch = 0; this.roll = 0;
    this.camYaw = 0; this.camPitch = 0.38; this.camPos = new THREE.Vector3(); this.camInit = false;
    this.rpm = 0; this.bump = 0; this.broke = 0;
  }
  dispose() { this.scene.remove(this.mesh); this.mesh.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  place(x, z, yaw) {
    this.pos.set(x, this.world.groundBelow(x, z, 60), z); this.yaw = yaw; this.speed = 0; this.vy = 0; this.camInit = false;
    this._sync();
  }
  fwd() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
  right() { return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)); }

  // hauteur d'appui sous un point, en tolérant une marche de 0,9 m
  _ground(x, z, y) { return this.world.groundBelow(x, z, y + 0.95); }
  _support(p, yaw) {
    const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    let best = -99; const pts = {};
    for (const u of [-2.3, -1.1, 0, 1.1, 2.3]) for (const v of [-1.5, 0, 1.5]) {
      const h = this._ground(p.x + f.x * u + r.x * v, p.z + f.z * u + r.z * v, p.y);
      pts[u + ':' + v] = h; if (h > best) best = h;
    }
    return { best, pts };
  }
  // la carrosserie touche-t-elle quelque chose ?
  _blocked(p, yaw, out = null) {
    const W = this.world, f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), r = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    let hit = false;
    for (let u = -2.4; u <= 2.41; u += 0.6) for (let v = -1.6; v <= 1.61; v += 0.8) for (let y = 1.0; y <= 3.6; y += 0.4) {
      const x = p.x + f.x * u + r.x * v, yy = p.y + y, z = p.z + f.z * u + r.z * v;
      if (!W.solidAt(x, yy, z)) continue;
      if (!out) return true;
      hit = true; out.push(W.vx(x), W.vy(yy), W.vz(z));
    }
    return hit;
  }
  // vingt tonnes lancées : ce qui touche la carrosserie finit par céder
  _ram(cells, dt) {
    const W = this.world, pts = (14 + Math.abs(this.speed) * 4) * dt * 10;
    let broke = 0, hard = 0;
    for (let k = 0; k < cells.length; k += 3) {
      const m = W.get(cells[k], cells[k + 1], cells[k + 2]);
      if (!m) continue;
      if (HARDQ[m] === 255 || !W.inside(cells[k], cells[k + 1], cells[k + 2])) { hard++; continue; }
      if (W.hitVoxel(cells[k], cells[k + 1], cells[k + 2], pts, Math.random() < 0.5)) broke++;
    }
    if (broke) { const f = this.fwd(); W.lastBlast = { x: this.pos.x - f.x, y: this.pos.y + 1, z: this.pos.z - f.z, force: 4 + Math.abs(this.speed) }; }
    return { broke, hard };
  }

  update(dt, keys, active) {
    const W = this.world, g = W.g ?? 1;
    let thr = 0, turn = 0;
    if (active) {
      if (keys.has('KeyW') || keys.has('ArrowUp')) thr += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) thr -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) turn += 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) turn -= 1;
    }
    const turbo = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const vmax = thr > 0 ? (turbo ? 8.5 : 5.5) : 3;
    const target = thr * vmax;
    this.speed += clamp(target - this.speed, -7 * dt, (thr ? 4 : 7) * dt);
    this.rpm += ((Math.abs(thr) * (turbo ? 1 : 0.75) + Math.abs(turn) * 0.35 + 0.25) - this.rpm) * Math.min(1, dt * 3);

    // la lame d'abord : elle casse ce qui est devant, et freine sur le dur
    this.bladeY += ((this.bladeDown ? -0.42 : 0.45) - this.bladeY) * Math.min(1, dt * 5);
    if (this.speed > 0.2) this._plow(dt);

    // avance
    const f = this.fwd();
    const np = this.pos.clone().addScaledVector(f, this.speed * dt);
    const cells = [];
    if (!this._blocked(np, this.yaw, cells)) { this.pos.copy(np); this.stuck = 0; }
    else if (thr !== 0) {
      // on force : la carrosserie défonce ce qui la gêne, le moteur peine un peu
      const R = this._ram(cells, dt);
      this.speed *= R.broke ? 0.85 : 0.5;
      if (!R.broke) this.stuck = (this.stuck || 0) + dt;
      if (R.hard && this.stuck > 0.4) { this.speed = -this.speed * 0.2; this.stuck = 0; }
      if (Math.random() < 0.1) this.audio.play('thump', this.pos, 0.6);
      this.fx.shake(0.12);
    } else this.speed *= 0.3;
    // rotation sur place ou en roulant (chenilles)
    const ny = this.yaw + turn * (0.85 + Math.abs(this.speed) * 0.05) * dt * (this.speed < -0.1 ? -1 : 1);
    if (turn) { const c2 = []; if (!this._blocked(this.pos, ny, c2)) this.yaw = ny; else this._ram(c2, dt * 0.6); }
    // appui et gravité
    const S = this._support(this.pos, this.yaw);
    if (S.best > this.pos.y) { this.pos.y = Math.min(S.best, this.pos.y + 3.5 * dt); this.vy = 0; }
    else {
      this.vy -= 18 * g * dt; this.pos.y += this.vy * dt;
      if (this.pos.y <= S.best) { if (this.vy < -7) { this.fx.shake(Math.min(1, -this.vy / 20)); this.audio.play('thump', this.pos, 1.2); } this.pos.y = S.best; this.vy = 0; }
    }
    // coincé dans des cubes (un bloc lui est tombé dessus) : on remonte
    for (let k = 0; k < 10 && this._blocked(this.pos, this.yaw); k++) this.pos.y += VS;
    // assiette
    const P = S.pts, front = Math.max(P['2.3:-1.5'], P['2.3:0'], P['2.3:1.5']), back = Math.max(P['-2.3:-1.5'], P['-2.3:0'], P['-2.3:1.5']);
    const left = Math.max(P['-1.1:-1.5'], P['1.1:-1.5']), rightH = Math.max(P['-1.1:1.5'], P['1.1:1.5']);
    this.pitch += (clamp(Math.atan2(front - back, 4.6), -0.35, 0.35) - this.pitch) * Math.min(1, dt * 6);
    this.roll += (clamp(Math.atan2(rightH - left, 3), -0.3, 0.3) - this.roll) * Math.min(1, dt * 6);
    // bord de la carte
    const B = W.bounds;
    this.pos.x = clamp(this.pos.x, B.x0 + 3, B.x1 - 3); this.pos.z = clamp(this.pos.z, B.z0 + 3, B.z1 - 3);
    if (this.pos.y < 0) this.pos.y = 0;
    this._sync();
    this.audio.engine(this.rpm);
    // gaz d'échappement
    if (Math.random() < 0.3 + this.rpm * 0.5) {
      const e = new THREE.Vector3(0.55, 3.7, -1.6).applyEuler(this.mesh.rotation).add(this.pos);
      const k = 0.15 + this.rpm * 0.3;
      this.fx.smoke.add(e.x, e.y, e.z, (Math.random() - 0.5) * 0.4, 1.5 + this.rpm * 2, (Math.random() - 0.5) * 0.4, 1.2, 0.2, 1.2, [0.12, 0.12, 0.12, k], [0.3, 0.3, 0.3, 0], -0.3, 0.8);
    }
  }

  _plow(dt) {
    const W = this.world, f = this.fwd(), r = this.right();
    const pts = (12 + this.speed * 3.5) * dt * 10;
    const seen = new Set();
    let resist = 0, broke = 0;
    const base = this.pos.y + this.bladeY - 0.1;
    for (const u of [2.5, 2.9, 3.3, 3.75]) for (let v = -1.95; v <= 1.96; v += 0.3) for (let y = 0; y <= 4.0; y += 0.35) {
      const x = this.pos.x + f.x * u + r.x * v, z = this.pos.z + f.z * u + r.z * v, yy = base + y;
      const X = W.vx(x), Y = W.vy(yy), Z = W.vz(z);
      const k = X + ',' + Y + ',' + Z;
      if (seen.has(k)) continue; seen.add(k);
      const m = W.get(X, Y, Z);
      if (!m) continue;
      if (HARDQ[m] === 255 || !W.inside(X, Y, Z)) { resist += 3; continue; }
      if (W.hitVoxel(X, Y, Z, pts, Math.random() < 0.6)) broke++;
      else resist += HARDQ[m] / 40;
    }
    if (broke) {
      W.lastBlast = { x: this.pos.x + f.x * 1.2, y: this.pos.y + 0.4, z: this.pos.z + f.z * 1.2, force: 3 + this.speed * 0.8 };
      this.broke += broke;
      if (Math.random() < 0.35) this.fx.dust(this.pos.x + f.x * 3.4, base + 0.3, this.pos.z + f.z * 3.4, 1.2, 2);
    }
    this.speed *= Math.max(0.5, 1 - resist * 0.005);
  }

  _sync() {
    const m = this.mesh;
    m.position.copy(this.pos);
    m.rotation.set(0, this.yaw, 0, 'YXZ');
    m.userData.body.rotation.set(-this.pitch, 0, -this.roll);
    m.userData.blade.position.y = this.bladeY;
    m.userData.beacon.material.emissiveIntensity = Math.sin(performance.now() / 90) > 0 ? 3 : 0.3;
  }

  // caméra de poursuite ; lx, ly : déplacement souris accumulé
  camera(cam, dt, lx, ly) {
    this.camYaw -= lx * 0.004; this.camPitch = clamp(this.camPitch + ly * 0.003, 0.08, 1.2);
    if (Math.abs(this.speed) > 1 && !lx) this.camYaw *= Math.exp(-dt * 0.9);
    const a = this.yaw + this.camYaw, dist = 12;
    const tgt = new THREE.Vector3(this.pos.x, this.pos.y + 2.6, this.pos.z);
    const want = new THREE.Vector3(tgt.x + Math.sin(a) * Math.cos(this.camPitch) * dist, tgt.y + Math.sin(this.camPitch) * dist, tgt.z + Math.cos(a) * Math.cos(this.camPitch) * dist);
    // on ne passe pas à travers les murs
    const d = want.clone().sub(tgt), L = d.length(); d.divideScalar(L);
    const h = this.world.raycast(tgt.x, tgt.y, tgt.z, d.x, d.y, d.z, L, true);
    if (h) want.copy(tgt).addScaledVector(d, Math.max(1.5, h.dist - 0.4));
    if (!this.camInit) { this.camPos.copy(want); this.camInit = true; }
    this.camPos.lerp(want, Math.min(1, dt * 8));
    cam.position.copy(this.camPos);
    cam.lookAt(tgt);
  }
}
