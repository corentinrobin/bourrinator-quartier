// Effets : fumée, flammes, poussière, débris cubiques, onde de choc et champignon atomique.
import * as THREE from 'three';
import { VS, MAT_COL } from './voxel.js';

const rand = (a, b) => a + Math.random() * (b - a);

class Particles {
  constructor(max, additive) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.maxLife = new Float32Array(max);
    this.s0 = new Float32Array(max); this.s1 = new Float32Array(max);
    this.c0 = new Float32Array(max * 4); this.c1 = new Float32Array(max * 4);
    this.grav = new Float32Array(max); this.drag = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos); g.setAttribute('pcolor', this.aCol); g.setAttribute('size', this.aSize);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    const mat = new THREE.ShaderMaterial({
      vertexShader: `attribute float size; attribute vec4 pcolor; uniform float uScale; varying vec4 vC;
        #include <fog_pars_vertex>
        void main(){ vec4 mvPosition = modelViewMatrix*vec4(position,1.0); gl_PointSize = min(2048.0, size*uScale/max(0.1,-mvPosition.z)); gl_Position = projectionMatrix*mvPosition; vC = pcolor;
        #include <fog_vertex>
        }`,
      fragmentShader: `varying vec4 vC;
        #include <fog_pars_fragment>
        void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); if(d>0.5) discard; float a = vC.a*smoothstep(0.5,0.12,d); gl_FragColor = vec4(vC.rgb, a);
        #include <fog_fragment>
        }`,
      transparent: true, depthWrite: false, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uScale: { value: 500 } }]),
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.uniforms = mat.uniforms;
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 4 : 3;
    g.setDrawRange(0, 0);
  }
  add(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, grav = 0, drag = 0) {
    let i = this.n;
    if (i >= this.max) i = Math.floor(Math.random() * this.max); else this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = 0; this.maxLife[i] = life; this.s0[i] = s0; this.s1[i] = s1;
    for (let k = 0; k < 4; k++) { this.c0[i * 4 + k] = c0[k]; this.c1[i * 4 + k] = c1[k]; }
    this.grav[i] = grav; this.drag[i] = drag;
    this.size[i] = s0;
  }
  update(dt) {
    let i = 0;
    while (i < this.n) {
      this.life[i] += dt;
      if (this.life[i] >= this.maxLife[i]) { const j = --this.n; if (i !== j) this.copy(j, i); continue; }
      const t = this.life[i] / this.maxLife[i], dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt; this.vel[i * 3 + 2] *= dr;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * t;
      for (let k = 0; k < 4; k++) this.col[i * 4 + k] = this.c0[i * 4 + k] + (this.c1[i * 4 + k] - this.c0[i * 4 + k]) * t;
      i++;
    }
    this.points.geometry.setDrawRange(0, this.n);
    this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.aSize.needsUpdate = true;
  }
  copy(a, b) {
    for (let k = 0; k < 3; k++) { this.pos[b * 3 + k] = this.pos[a * 3 + k]; this.vel[b * 3 + k] = this.vel[a * 3 + k]; }
    for (let k = 0; k < 4; k++) { this.col[b * 4 + k] = this.col[a * 4 + k]; this.c0[b * 4 + k] = this.c0[a * 4 + k]; this.c1[b * 4 + k] = this.c1[a * 4 + k]; }
    this.size[b] = this.size[a]; this.life[b] = this.life[a]; this.maxLife[b] = this.maxLife[a];
    this.s0[b] = this.s0[a]; this.s1[b] = this.s1[a]; this.grav[b] = this.grav[a]; this.drag[b] = this.drag[a];
  }
  clear() { this.n = 0; this.points.geometry.setDrawRange(0, 0); }
}

// débris : petits cubes aux couleurs de la matière, qui rebondissent sur les cubes du monde
const MAXD = 2400;
class Debris {
  constructor() {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), MAXD);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true; this.mesh.frustumCulled = false; this.mesh.count = 0;
    this.items = [];
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.s = new THREE.Vector3(); this.p = new THREE.Vector3();
    this.color = new THREE.Color();
    this.mesh.setColorAt(0, this.color);
  }
  add(x, y, z, vx, vy, vz, m, size, life) {
    if (this.items.length >= MAXD) this.items.shift();
    this.items.push({ x, y, z, vx, vy, vz, rx: rand(0, 6), ry: rand(0, 6), wx: rand(-9, 9), wy: rand(-9, 9), size, life, t: 0, m, rest: false });
  }
  update(dt, world) {
    const it = this.items;
    let w = 0;
    for (let i = 0; i < it.length; i++) {
      const d = it[i];
      d.t += dt;
      if (d.t >= d.life) continue;
      if (!d.rest) {
        d.vy -= 20 * (world.g ?? 1) * dt;
        const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt, nz = d.z + d.vz * dt;
        if (world.solidAt(nx, ny, nz)) {
          if (!world.solidAt(d.x, ny, d.z)) { d.vx *= -0.3; d.vz *= 0.6; }
          else if (!world.solidAt(nx, d.y, d.z)) { d.vy *= -0.25; d.vx *= 0.6; d.vz *= 0.6; }
          else { d.vy *= -0.3; d.vx *= -0.3; d.vz *= -0.3; }
          if (Math.abs(d.vy) < 1.2 && world.solidAt(d.x, d.y - 0.12, d.z)) { d.rest = true; d.vy = 0; }
          d.wx *= 0.5; d.wy *= 0.5;
        } else { d.x = nx; d.y = ny; d.z = nz; }
        if (d.y < -5) d.t = d.life;
        d.rx += d.wx * dt; d.ry += d.wy * dt;
      } else if (!world.solidAt(d.x, d.y - 0.12, d.z)) d.rest = false;
      it[w++] = d;
    }
    it.length = w;
    for (let i = 0; i < w; i++) {
      const d = it[i];
      const k = Math.min(1, (d.life - d.t) / 0.6);
      this.e.set(d.rx, d.ry, 0); this.q.setFromEuler(this.e);
      this.s.setScalar(d.size * k); this.p.set(d.x, d.y, d.z);
      this.m4.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m4);
      const m = d.m;
      this.color.setRGB(MAT_COL[m * 3] * 0.9, MAT_COL[m * 3 + 1] * 0.9, MAT_COL[m * 3 + 2] * 0.9);
      this.mesh.setColorAt(i, this.color);
    }
    this.mesh.count = w;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
  clear() { this.items.length = 0; this.mesh.count = 0; }
}

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.smoke = new Particles(5000, false);
    this.fire = new Particles(3000, true);
    this.debris = new Debris();
    scene.add(this.smoke.points, this.fire.points, this.debris.mesh);
    this.lights = [];
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffaa55, 0, 40, 1.6); l.userData.t = 0; scene.add(l); this.lights.push(l); }
    this.shakeAmt = 0;
    this.emitters = [];
    // onde de choc au sol (bombe)
    const rg = new THREE.RingGeometry(0.9, 1, 96, 1); rg.rotateX(-Math.PI / 2);
    this.ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.ring.visible = false; this.ring.renderOrder = 5; scene.add(this.ring);
    this.fireball = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.fireball.visible = false; this.fireball.renderOrder = 5; scene.add(this.fireball);
    this.nukeFx = null;
  }
  setScale(h, fov) { const s = h / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2)); this.smoke.uniforms.uScale.value = s; this.fire.uniforms.uScale.value = s; }
  clear() {
    this.smoke.clear(); this.fire.clear(); this.debris.clear(); this.emitters.length = 0; this.nukeFx = null;
    this.ring.visible = false; this.fireball.visible = false;
    for (const l of this.lights) { l.intensity = 0; l.userData.t = 0; }
  }
  shake(a) { this.shakeAmt = Math.min(1.6, Math.max(this.shakeAmt, a)); }
  shakeOffset(t) {
    const s = this.shakeAmt * this.shakeAmt * 0.05;
    return { x: Math.sin(t * 91) * s, y: Math.sin(t * 73 + 1) * s, z: Math.sin(t * 57 + 2) * s * 0.5 };
  }
  flash(x, y, z, power = 30, color = 0xffaa55, dur = 0.25, dist = 40) {
    const l = this.lights.find((a) => a.userData.t <= 0) || this.lights.reduce((a, b) => (a.userData.t < b.userData.t ? a : b));
    l.color.setHex(color); l.position.set(x, y, z); l.distance = dist; l.userData.p = power; l.userData.t = dur; l.userData.d = dur; l.intensity = power;
  }
  puff(x, y, z, n = 6, color = [0.7, 0.68, 0.62], size = 0.5, spread = 1.2) {
    for (let i = 0; i < n; i++) {
      this.smoke.add(x, y, z, rand(-spread, spread), rand(0, spread * 1.2), rand(-spread, spread), rand(0.6, 1.3), size * 0.6, size * 2.4,
        [color[0], color[1], color[2], 0.75], [color[0], color[1], color[2], 0], -0.4, 2.2);
    }
  }
  sparks(x, y, z, n = 6) {
    for (let i = 0; i < n; i++) this.fire.add(x, y, z, rand(-4, 4), rand(1, 6), rand(-4, 4), rand(0.15, 0.45), 0.1, 0.02, [1, 0.8, 0.3, 1], [1, 0.3, 0.05, 0], 14, 1);
  }
  trail(x, y, z) {
    this.smoke.add(x, y, z, rand(-0.3, 0.3), rand(0, 0.5), rand(-0.3, 0.3), rand(0.8, 1.6), 0.3, 1.4, [0.8, 0.78, 0.75, 0.6], [0.6, 0.6, 0.6, 0], -0.2, 1.2);
    this.fire.add(x, y, z, 0, 0, 0, 0.08, 0.35, 0.1, [1, 0.8, 0.4, 1], [1, 0.4, 0.1, 0]);
  }
  explosion(x, y, z, r) {
    const n = Math.min(120, 26 + r * 18);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), e = rand(-0.2, 1), s = rand(2, 7) * r * 0.6;
      this.fire.add(x, y, z, Math.cos(a) * s * (1 - e * 0.5), e * s, Math.sin(a) * s * (1 - e * 0.5), rand(0.25, 0.65), r * 0.8, r * 1.6, [1, 0.75, 0.3, 1], [0.9, 0.2, 0.02, 0], -2, 4);
    }
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), s = rand(0.5, 3) * r * 0.5, g = rand(0.14, 0.3);
      this.smoke.add(x + rand(-r, r) * 0.4, y + rand(0, r) * 0.4, z + rand(-r, r) * 0.4, Math.cos(a) * s, rand(1, 4), Math.sin(a) * s, rand(1.8, 4), r * 0.9, r * 3.2,
        [g, g * 0.95, g * 0.9, 0.85], [0.35, 0.34, 0.33, 0], -1.2, 1.2);
    }
    this.sparks(x, y, z, 20);
    this.flash(x, y + 1, z, 80 * Math.min(2, r / 2), 0xffa050, 0.4);
  }
  // petit champignon (pistolet à eau) : colonne et chapeau, quelques particules seulement
  miniMushroom(x, y, z, r) {
    const top = y + r * 2.2;
    for (let i = 0; i < 10; i++) {
      const g = rand(0.3, 0.45);
      this.smoke.add(x + rand(-0.4, 0.4), y + rand(0, r), z + rand(-0.4, 0.4), rand(-0.3, 0.3), rand(3, 5.5), rand(-0.3, 0.3), rand(1.6, 2.4), r * 0.25, r * 0.5,
        [g + 0.25, g + 0.1, g, 0.75], [0.35, 0.33, 0.32, 0], 0, 0.6);
    }
    for (let i = 0; i < 14; i++) {
      const a = rand(0, 6.283), rc = rand(0, r * 0.7);
      this.smoke.add(x + Math.cos(a) * rc, top + rand(-0.5, 0.8), z + Math.sin(a) * rc, Math.cos(a) * rand(0.8, 2.2), rand(0.6, 1.6), Math.sin(a) * rand(0.8, 2.2), rand(2, 3.2), r * 0.35, r * 0.75,
        [0.95, rand(0.5, 0.65), 0.3, 0.8], [0.33, 0.31, 0.3, 0], -0.4, 0.5);
    }
    this.fire.add(x, y + 0.5, z, 0, 2, 0, 0.35, r * 1.4, r * 0.6, [1, 0.95, 0.8, 1], [1, 0.5, 0.1, 0]);
  }
  dust(x, y, z, w, n = 20, col = [0.62, 0.58, 0.5]) {
    for (let i = 0; i < n; i++) {
      this.smoke.add(x + rand(-w, w), y + rand(0, 1), z + rand(-w, w), rand(-2.5, 2.5), rand(0.5, 2.5), rand(-2.5, 2.5), rand(1.8, 3.6), 1.2, 4.5,
        [col[0], col[1], col[2], 0.7], [col[0], col[1], col[2], 0], -0.3, 1.4);
    }
  }
  splash(x, y, z, k = 1) {
    for (let i = 0; i < 14 * k; i++) this.smoke.add(x, y, z, rand(-2, 2), rand(3, 7), rand(-2, 2), rand(0.5, 1), 0.3, 0.8, [0.85, 0.95, 1, 0.8], [0.8, 0.9, 1, 0], 14, 0.5);
  }
  // cubes arrachés au monde : un petit cube qui vole par cube cassé (échantillonné)
  chunks(list, cx, cy, cz, force, world) {
    const n = list.length / 4;
    if (!n) return;
    const keep = Math.min(1, 380 / n);
    for (let k = 0; k < list.length; k += 4) {
      if (Math.random() > keep) continue;
      const x = world.wx(list[k] + 0.5), y = (list[k + 1] + 0.5) * VS, z = world.wz(list[k + 2] + 0.5), m = list[k + 3];
      let dx = x - cx, dy = y - cy + 0.3, dz = z - cz;
      const d = Math.hypot(dx, dy, dz) + 0.1;
      const s = force * rand(0.4, 1.1) / (0.6 + d * 0.35);
      dx /= d; dy /= d; dz /= d;
      this.debris.add(x, y, z, dx * s + rand(-1, 1), dy * s + rand(0.5, 3), dz * s + rand(-1, 1), m, VS * rand(0.35, 0.8), rand(2.5, 5));
    }
  }
  addEmitter(x, y, z, dur, kind = 'fire', extra = {}) { this.emitters.push({ x, y, z, t: dur, kind, acc: 0, ...extra }); }

  // la bombe : boule de feu, anneau, champignon
  nuke(x, y, z, R) {
    this.nukeFx = { x, y, z, R, t: 0 };
    this.fireball.visible = true; this.fireball.position.set(x, y, z);
    this.ring.visible = true; this.ring.position.set(x, y + 0.2, z);
    this.flash(x, y + 10, z, 400, 0xfff0d0, 2.5, R * 4);
  }
  _nukeStep(dt) {
    const N = this.nukeFx;
    N.t += dt;
    const t = N.t, R = N.R;
    const fb = Math.min(1, t / 0.5);
    this.fireball.scale.setScalar(R * (0.15 + 0.35 * fb) * (t < 3 ? 1 : Math.max(0.01, 1 - (t - 3) / 3)));
    this.fireball.position.y = N.y + Math.min(R * 0.8, t * R * 0.12);
    this.fireball.material.opacity = t < 3 ? 0.85 : Math.max(0, 0.85 - (t - 3) / 3);
    this.fireball.material.color.setRGB(1, Math.max(0.35, 0.9 - t * 0.12), Math.max(0.1, 0.7 - t * 0.2));
    const rr = Math.min(R * 1.6, t * R / 1.3);
    this.ring.scale.setScalar(rr);
    this.ring.material.opacity = Math.max(0, 0.7 - t * 0.25);
    const top = N.y + Math.min(R * 1.1, t * R * 0.25);
    // colonne et chapeau du champignon
    if (t < 9) {
      for (let i = 0; i < 6; i++) {
        const a = rand(0, 6.283), rc = rand(0, R * 0.12);
        const g = rand(0.25, 0.45);
        this.smoke.add(N.x + Math.cos(a) * rc, N.y + rand(0, top - N.y), N.z + Math.sin(a) * rc, Math.cos(a), rand(4, 8), Math.sin(a), rand(3, 5), R * 0.12, R * 0.3,
          [g + 0.3, g + 0.12, g, 0.8], [0.3, 0.28, 0.27, 0], 0, 0.3);
        const ac = rand(0, 6.283), rcap = rand(0, R * 0.45);
        this.smoke.add(N.x + Math.cos(ac) * rcap, top + rand(-R * 0.08, R * 0.12), N.z + Math.sin(ac) * rcap, Math.cos(ac) * rand(1, 4), rand(0, 2), Math.sin(ac) * rand(1, 4), rand(4, 7), R * 0.2, R * 0.5,
          [0.9, rand(0.45, 0.6), 0.3, t < 2 ? 0.9 : 0.7], [0.32, 0.3, 0.3, 0], -0.5, 0.2);
      }
      if (t < 1.6) for (let i = 0; i < 20; i++) {
        const a = rand(0, 6.283);
        this.smoke.add(N.x + Math.cos(a) * rr * 0.9, N.y + rand(0, 3), N.z + Math.sin(a) * rr * 0.9, Math.cos(a) * rand(4, 12), rand(1, 4), Math.sin(a) * rand(4, 12), rand(2, 4), 3, 9,
          [0.72, 0.66, 0.56, 0.7], [0.6, 0.56, 0.5, 0], -0.2, 0.6);
      }
    }
    if (t > 10) { this.nukeFx = null; this.ring.visible = false; this.fireball.visible = false; }
  }

  update(dt, world) {
    this.smoke.update(dt); this.fire.update(dt); this.debris.update(dt, world);
    if (this.nukeFx) this._nukeStep(dt);
    for (const l of this.lights) {
      if (l.userData.t > 0) { l.userData.t -= dt; l.intensity = Math.max(0, l.userData.p * (l.userData.t / l.userData.d)); if (l.userData.t <= 0) l.intensity = 0; }
    }
    this.emitters = this.emitters.filter((e) => {
      e.t -= dt; e.acc += dt;
      while (e.acc > 0.05) {
        e.acc -= 0.05;
        if (e.kind === 'steam') {
          // panache de vapeur des tours de refroidissement ; il s'arrête si la tour est détruite
          if (e.anchor && world && !world.get(e.anchor[0], e.anchor[1], e.anchor[2])) { e.t = 0; break; }
          if (Math.random() < 0.5) continue;
          const a = rand(0, 6.283), rr = rand(0, e.r);
          this.smoke.add(e.x + Math.cos(a) * rr, e.y, e.z + Math.sin(a) * rr, rand(-0.6, 0.6) + 0.8, rand(3, 5), rand(-0.6, 0.6), rand(6, 9), e.r * 0.5, e.r * 1.6,
            [0.95, 0.96, 0.97, 0.55], [0.9, 0.9, 0.92, 0], -0.15, 0.25);
          continue;
        }
        if (e.kind === 'fire') this.fire.add(e.x + rand(-0.6, 0.6), e.y, e.z + rand(-0.6, 0.6), rand(-0.3, 0.3), rand(1.5, 3), rand(-0.3, 0.3), rand(0.3, 0.7), 0.9, 0.2, [1, 0.6, 0.2, 0.9], [0.8, 0.15, 0.02, 0]);
        this.smoke.add(e.x + rand(-0.5, 0.5), e.y + 0.5, e.z + rand(-0.5, 0.5), rand(-0.4, 0.4), rand(1.5, 3), rand(-0.4, 0.4), rand(2, 4), 0.9, 3.6, [0.12, 0.11, 0.1, 0.7], [0.3, 0.3, 0.3, 0], -0.4, 0.3);
      }
      return e.t > 0;
    });
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.6);
  }
}
