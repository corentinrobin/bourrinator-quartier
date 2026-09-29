// Déplacement à la première personne dans le monde en cubes : ZQSD / WASD, saut, sprint, marches automatiques.
import { VS } from './voxel.js';

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

export class Player {
  constructor() {
    this.pos = { x: 0, y: 0, z: 0 };
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = 0; this.pitch = 0;
    this.onGround = true;
    this.keys = new Set();
    this.sens = 1; this.invertY = false;
    this.r = 0.3; this.h = 1.72; this.eyeH = 1.6;
    this.eyeY = 1.6; this.bobT = 0; this.bobAmt = 0; this.land = 0; this.speed = 0;
    this.sea = null; this.nappe = null; this.inWater = false; this.waterY = 0; this.touchWall = false; this.groundY = 4;
    this.climbTool = false; this.clinging = false; this.climbStep = 0;
  }

  reset(sp) {
    this.pos.x = sp.x; this.pos.y = sp.y; this.pos.z = sp.z;
    this.vel.x = this.vel.y = this.vel.z = 0;
    this.yaw = sp.yaw || 0; this.pitch = -0.05;
    this.eyeY = sp.y + this.eyeH; this.keys.clear();
  }

  look(dx, dy) {
    const k = 0.0022 * this.sens;
    this.yaw -= dx * k;
    this.pitch -= dy * k * (this.invertY ? -1 : 1);
    this.pitch = clamp(this.pitch, -1.54, 1.54);
  }

  push(x, y, z) { this.vel.x += x; this.vel.y += y; this.vel.z += z; if (y > 0) this.onGround = false; }

  _hits(W, x, y, z) { const r = this.r; return W.boxHits(x - r, y, z - r, x + r, y + this.h, z + r); }

  update(dt, W, active) {
    const k = this.keys, p = this.pos;
    let fx = 0, fz = 0;
    if (active) {
      if (k.has('KeyW') || k.has('ArrowUp')) fz -= 1;
      if (k.has('KeyS') || k.has('ArrowDown')) fz += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) fx -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) fx += 1;
    }
    // piolets en main et un mur devant soi : on s'accroche
    const g = W.g ?? 1;
    const fwx = -Math.sin(this.yaw), fwz = -Math.cos(this.yaw);
    const wallAt = (h0, h1) => { const cx = p.x + fwx * (this.r + 0.2), cz = p.z + fwz * (this.r + 0.2); return W.boxHits(cx - 0.12, p.y + h0, cz - 0.12, cx + 0.12, p.y + h1, cz + 0.12); };
    const wasCling = this.clinging;
    this.clinging = this.climbTool && active && !this.onGround && !this.inWater && wallAt(0.5, 1.6);
    if (this.climbTool && active && this.onGround && k.has('KeyW') && wallAt(0.5, 1.6)) { this.clinging = true; this.onGround = false; }
    if (this.clinging) {
      const up = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      const side = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
      this.vel.y = up * 3.4;
      // on reste plaqué au mur, on peut se décaler sur le côté
      this.vel.x = fwx * 1.2 + rx * side * 2.4; this.vel.z = fwz * 1.2 + rz * side * 2.4;
      this.climbStep += dt * (Math.abs(up) + Math.abs(side) * 0.7) * 3.2;
      if (!wasCling) this.grab = true;
      if (active && k.has('Space')) { this.clinging = false; this.vel.y = g < 0.5 ? 3.5 : 5; this.vel.x = -fwx * 4; this.vel.z = -fwz * 4; }
      // en haut du mur : on se hisse dessus
      if (up > 0 && !wallAt(1.0, 1.9) && wallAt(0.0, 1.0)) { this.vel.y = 6.2 * Math.sqrt(g); this.vel.x = fwx * 3; this.vel.z = fwz * 3; this.clinging = false; this.mantle = 0.5 / Math.sqrt(g); }
    }
    if (this.mantle > 0) { this.mantle -= dt; this.vel.x = fwx * 3; this.vel.z = fwz * 3; }
    const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    const maxS = (sprint ? 8.5 : 5) * (this.inWater ? 0.55 : 1);
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    let wx = fx * cy + fz * sy, wz = -fx * sy + fz * cy;
    const len = Math.hypot(wx, wz);
    if (len > 0) { wx /= len; wz /= len; }
    const acc = (this.onGround || this.inWater ? 50 : 12) * dt;
    if (!this.clinging && !(this.mantle > 0)) {
      this.vel.x += clamp(wx * maxS - this.vel.x, -acc, acc);
      this.vel.z += clamp(wz * maxS - this.vel.z, -acc, acc);
    }
    if (active && k.has('Space') && this.onGround) { this.vel.y = g < 0.5 ? 4.6 : 6.2; this.onGround = false; }
    if (!this.clinging) this.vel.y -= 18 * g * dt;

    // coincé dans des cubes (effondrement, atterrissage) : on remonte
    if (this._hits(W, p.x, p.y, p.z)) {
      for (let i = 0; i < 80; i++) { p.y = (Math.floor(p.y / VS) + 1) * VS; if (!this._hits(W, p.x, p.y, p.z)) break; }
      this.vel.y = Math.max(0, this.vel.y);
    }

    const n = Math.max(1, Math.ceil(Math.max(Math.abs(this.vel.x), Math.abs(this.vel.z), Math.abs(this.vel.y)) * dt / 0.08));
    const h = dt / n;
    let wasGround = this.onGround;
    this.touchWall = false;
    for (let s = 0; s < n; s++) {
      for (const ax of ['x', 'z']) {
        const d = this.vel[ax] * h;
        if (!d) continue;
        const nx = ax === 'x' ? p.x + d : p.x, nz = ax === 'z' ? p.z + d : p.z;
        if (!this._hits(W, nx, p.y, nz)) { p.x = nx; p.z = nz; continue; }
        // marche : un cube (et un peu plus) se franchit sans sauter
        const up = (Math.floor(p.y / VS + 0.001) + 1) * VS;
        if ((wasGround || this.inWater) && up - p.y <= VS + 0.05 && !this._hits(W, nx, up + 0.001, nz) && !this._hits(W, p.x, up + 0.001, p.z)) {
          p.x = nx; p.z = nz; p.y = up + 0.001; this.stepped = 0.12;
          continue;
        }
        this.vel[ax] = 0; this.touchWall = true;
      }
      const dy = this.vel.y * h;
      if (!this._hits(W, p.x, p.y + dy, p.z)) { p.y += dy; this.onGround = false; }
      else {
        if (dy < 0) {
          if (!wasGround && this.vel.y < -6) this.land = Math.min(1, -this.vel.y / 14);
          p.y = Math.floor((p.y + dy) / VS + 1) * VS; if (this._hits(W, p.x, p.y, p.z)) p.y += 0.001;
          this.onGround = true;
        } else {
          p.y = Math.floor((p.y + dy + this.h) / VS) * VS - this.h - 0.001;
        }
        this.vel.y = 0;
      }
      wasGround = this.onGround;
    }
    // collé au sol si on descend une petite marche
    if (!this.onGround && this.vel.y <= 0 && this.vel.y > -3 && this._hits(W, p.x, p.y - 0.06, p.z)) this.onGround = true;

    // la mer : on flotte, Espace pour remonter
    // la mer, ou la nappe phréatique au fond des trous
    const S = this.sea;
    const inSea = !!S && p.z > S.z && p.y + 0.9 < S.y, inNappe = this.nappe !== null && p.y + 0.6 < this.nappe;
    this.inWater = inSea || inNappe;
    this.waterY = inSea ? S.y : this.nappe ?? 0;
    this.wet = (S && p.z > S.z && p.y + this.eyeH < S.y) || (this.nappe !== null && p.y + this.eyeH < this.nappe);
    if (this.inWater) {
      this.vel.y += 20 * dt;
      const kk = Math.max(0, 1 - 3 * dt);
      this.vel.x *= kk; this.vel.z *= kk; this.vel.y *= kk;
      if (active && k.has('Space')) this.vel.y = Math.min(3.2, this.vel.y + 24 * dt);
    }
    // au fond d'un trou : Espace contre la paroi pour grimper
    if (active && k.has('Space') && this.touchWall && p.y < this.groundY - 0.2) this.vel.y = Math.max(this.vel.y, 3.4);
    const B = W.bounds;
    p.x = clamp(p.x, B.x0 + 0.5, B.x1 - 0.5); p.z = clamp(p.z, B.z0 + 0.5, B.z1 - 0.5);
    if (p.y < -2) { p.y = W.groundBelow(p.x, p.z, 60); this.vel.y = 0; }

    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround) this.bobT += dt * this.speed * 1.7;
    this.bobAmt += ((this.onGround ? Math.min(1, this.speed / 5) : 0) - this.bobAmt) * Math.min(1, dt * 10);
    this.land = Math.max(0, this.land - dt * 3);
    const te = p.y + this.eyeH;
    this.eyeY += (te - this.eyeY) * Math.min(1, dt * 16);
    if (Math.abs(te - this.eyeY) > 0.8) this.eyeY = te;
  }

  apply(cam, sh) {
    const b = this.bobAmt;
    const side = Math.sin(this.bobT) * 0.025 * b;
    cam.position.set(this.pos.x + Math.cos(this.yaw) * side, this.eyeY + Math.abs(Math.cos(this.bobT)) * 0.045 * b - this.land * 0.14, this.pos.z - Math.sin(this.yaw) * side);
    cam.rotation.set(this.pitch + sh.x, this.yaw + sh.y, sh.z, 'YXZ');
  }
}
