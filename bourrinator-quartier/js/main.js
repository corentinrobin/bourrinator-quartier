import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { World, VS, GROUND, VAL, CAT, N } from './voxel.js';
import { LEVELS, tropOuter } from './levels.js';
import { Dozer } from './dozer.js';
import { FX } from './fx.js';
import { Audio } from './audio.js';
import { Player } from './player.js';
import { WEAPONS, WeaponSystem, buildModel } from './weapons.js';
import { Q, pick } from './quotes.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fmt = (n) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const setLoad = (p, t) => { $('#load-fill').style.width = (p * 100) + '%'; if (t) $('#load-text').textContent = t; };
const CHRONO = 300;

// ------------------------------------------------------------------ réglages
const DEF = { sens: 1, fov: 80, sfx: 0.8, music: 0.45, quality: 'haute', voice: false, invertY: false };
const S = { ...DEF };
try { Object.assign(S, JSON.parse(localStorage.getItem('bourrinator-quartier.settings') || '{}')); } catch (e) { /* stockage indisponible */ }
const saveSettings = () => { try { localStorage.setItem('bourrinator-quartier.settings', JSON.stringify(S)); } catch (e) { /* ignoré */ } };

// ------------------------------------------------------------------ rendu
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
$('#game').appendChild(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(S.fov, innerWidth / innerHeight, 0.05, 1500);
camera.rotation.order = 'YXZ';
const vmScene = new THREE.Scene();
const vmCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 10);
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
vmScene.environment = envTex; vmScene.environmentIntensity = 0.8;
vmScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.3));
const vmSun = new THREE.DirectionalLight(0xffffff, 1.8); vmSun.position.set(2, 3, 1); vmScene.add(vmSun);

const hemi = new THREE.HemisphereLight(0xffffff, 0x555555, 1); scene.add(hemi);
const ambient = new THREE.AmbientLight(0xffffff, 0.45); scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true; sun.shadow.autoUpdate = false; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
scene.add(sun); scene.add(sun.target);

// ciel en dégradé
const skyU = { top: { value: new THREE.Color(0x3a78c0) }, bot: { value: new THREE.Color(0xcfe4f4) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bot, top, pow(max(h, 0.0), 0.55)), 1.0); }',
}));
sky.renderOrder = -10; scene.add(sky);
const skyExtras = new THREE.Group(); skyExtras.visible = false; scene.add(skyExtras);
{
  const n = 2500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, r = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * r * 1000; pos[i * 3 + 1] = Math.abs(u) * 1000 - 40; pos[i * 3 + 2] = Math.sin(a) * r * 1000; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, depthWrite: false }));
  stars.renderOrder = -9; skyExtras.add(stars);
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#1b4f9c'; x.fillRect(0, 0, 512, 256);
  for (let k = 0; k < 40; k++) { x.fillStyle = k % 3 ? '#3f7a3a' : '#b99b62'; x.beginPath(); x.ellipse(Math.random() * 512, 40 + Math.random() * 176, 20 + Math.random() * 50, 10 + Math.random() * 30, Math.random() * 3, 0, 7); x.fill(); }
  for (let k = 0; k < 60; k++) { x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 40, 3 + Math.random() * 8, 0, 0, 7); x.fill(); }
  x.fillStyle = '#eef3f8'; x.fillRect(0, 0, 512, 14); x.fillRect(0, 242, 512, 14);
  const et = new THREE.CanvasTexture(c); et.colorSpace = THREE.SRGBColorSpace;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(55, 40, 24), new THREE.MeshLambertMaterial({ map: et, fog: false, emissive: 0x0a1a30 }));
  earth.position.set(-380, 420, -700); earth.rotation.set(0.4, 2, 0.2); skyExtras.add(earth);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(58, 40, 24), new THREE.MeshBasicMaterial({ color: 0x5aa0ff, transparent: true, opacity: 0.18, fog: false, side: THREE.BackSide, depthWrite: false }));
  halo.position.copy(earth.position); skyExtras.add(halo);
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const vmPass = new RenderPass(vmScene, vmCam); vmPass.clear = false; vmPass.clearDepth = true;
composer.addPass(vmPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.38, 0.35, 0.95);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function applyQuality() {
  const q = S.quality;
  renderer.setPixelRatio(Math.min(devicePixelRatio, q === 'haute' ? 1.5 : q === 'moyenne' ? 1.0 : 0.75));
  renderer.shadowMap.enabled = q !== 'basse';
  sun.castShadow = q !== 'basse';
  const ms = q === 'haute' ? 4096 : 2048;
  if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  if (world) world.setShadows(q !== 'basse');
  onResize();
  scene.traverse((o) => { if (o.material && o.isMesh) o.material.needsUpdate = true; });
}
function onResize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); composer.setSize(w, h);
  camera.aspect = vmCam.aspect = w / h; camera.fov = S.fov;
  camera.updateProjectionMatrix(); vmCam.updateProjectionMatrix();
  fx.setScale(h * renderer.getPixelRatio(), S.fov);
}
addEventListener('resize', onResize);

// ------------------------------------------------------------------ systèmes
const audio = new Audio();
audio.setVolumes(S.sfx, S.music);
const fx = new FX(scene);
let world = null;
const player = new Player();
player.sens = S.sens; player.invertY = S.invertY;

const G = {
  state: 'loading', env: LEVELS[0].id, weapon: 0, mode: 'chrono', time: CHRONO, elapsed: 0,
  score: 0, shown: 0, raw: 0, combo: 0, comboT: 0, comboTick: 0, bestMult: 1, nukeT: 0, cats: {},
  shots: 0, hits: 0, voxels: 0, quoteCD: 0, idle: 0, milestones: new Set(), firsts: new Set(),
  timeScale: 1, slowT: 0, stop: 0, gainAcc: 0, gainT: 0, feed: new Map(),
  locked: false, spawn: null, dozer: null, driving: false, lastWeapon: 0, menuT: 0, attractT: 3, info: null, L: null, loading: false, lastCollapse: 0,
};

const weapons = new WeaponSystem({
  fx, audio, camera, scene, vmScene,
  onShot: () => { G.shots++; },
  onHit: (hit) => { if (hit) { G.hits++; hitmarker(); } },
  onSwitch: (w, instant) => { if (w.kind === 'dozer') enterDozer(); else { G.lastWeapon = weapons.cur; if (G.driving) exitDozer(); } hudWeapon(); if (!instant && G.state === 'playing' && !G.firsts.has('w_' + w.id)) { G.firsts.add('w_' + w.id); say(Q.weapon[w.id]); } },
  hitstop: (t) => { G.stop = Math.max(G.stop, t); },
  onBombWait: (cd) => { if (G.state === 'playing') say('La bombe suivante est en fabrication. Encore ' + Math.ceil(cd) + ' secondes. La fission, ça ne se bâcle pas.', true); },
  onBombReady: () => { if (G.state === 'playing') announce('Bombe atomique', 'prête à servir'); },
  onBombArmed: () => { if (G.state === 'playing') { say(pick(Q.nukeArmed), true); announce('6 secondes', 'Courez'); } },
  onDozerClick: () => { if (!G.dozer || !G.driving) return; G.dozer.bladeDown = !G.dozer.bladeDown; audio.play('reload', G.dozer.pos, 1.2); },
  onMineMax: () => { if (G.state === 'playing') say(pick(Q.mineMax), true); },
  onExplosion: (n, p, w) => {
    if (G.state !== 'playing') return;
    if (n > 0) { G.hits++; hitmarker(); }
    const d = camera.position.distanceTo(p);
    if (d < w.radius + 1) {
      const k = (1 - d / (w.radius + 1)) * 10;
      const dir = new THREE.Vector3(player.pos.x - p.x, 0, player.pos.z - p.z).normalize();
      player.push(dir.x * k, k * 0.6, dir.z * k);
    }
    if (d < 12 && w.kind !== 'water') flash();
    if (n >= 200 && w.kind !== 'water') { G.slowT = 0.6; $('#slowmo').classList.add('on'); }
    if (n >= 120 && performance.now() - (G.lastBoom || 0) > 9000) { G.lastBoom = performance.now(); say(pick(Q.explosion)); }
  },
  onNuke: (p, R) => {
    G.nukeT = 12; G.combo = 0;
    const nf = $('#nukeflash'); nf.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => nf.classList.remove('on')));
    announce('☢', 'Un tiers du quartier en moins', 2600);
    G.slowT = 1.4; $('#slowmo').classList.add('on');
    const d = Math.hypot(player.pos.x - p.x, player.pos.z - p.z);
    if (d < R * 1.3) { const dir = new THREE.Vector3(player.pos.x - p.x, 0, player.pos.z - p.z).normalize(); const k = 26 * (1 - d / (R * 1.3)) + 6; player.push(dir.x * k, 9 + k * 0.4, dir.z * k); }
  },
  onNukeDone: () => { if (G.state === 'playing') setTimeout(() => say(pick(Q.nuke), true), 400); },
});

// ------------------------------------------------------------------ textures du décor
function windowsTexture(dusk) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = dusk ? '#4a4450' : '#8f97a0'; g.fillRect(0, 0, 128, 256);
  for (let y = 8; y < 256; y += 24) for (let x = 8; x < 128; x += 20) {
    const lit = Math.random() < (dusk ? 0.4 : 0.08);
    g.fillStyle = lit ? (dusk ? '#ffd58a' : '#dfe7ef') : (dusk ? '#1c1d24' : '#5b6572');
    g.fillRect(x, y, 12, 14);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function waterTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#8fd0dc'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.25})`; g.lineWidth = 1 + Math.random() * 2;
    const x = Math.random() * 128, y = Math.random() * 128;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 4, x + 16 + Math.random() * 10, y); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function disposeTree(o) {
  o.traverse((n) => {
    if (n.geometry) n.geometry.dispose();
    if (n.material) { const ms = Array.isArray(n.material) ? n.material : [n.material]; for (const m of ms) { if (m.map) m.map.dispose(); if (m.emissiveMap) m.emissiveMap.dispose(); m.dispose(); } }
  });
}

let envRoot = null, water = null, nappe = null;
let NAPPE_Y = 1.3; // nappe phréatique : juste au-dessus de la roche-mère (plus haute sous le château)
function buildScenery(L, info) {
  if (envRoot) { scene.remove(envRoot); disposeTree(envRoot); }
  envRoot = new THREE.Group(); scene.add(envRoot); water = null;
  NAPPE_Y = L.nappeY ?? 1.3;
  const B = world.bounds, gy = GROUND * VS - 0.02;
  // la nappe, invisible sous le sol : elle n'apparaît qu'au fond des trous
  const nm = new THREE.MeshStandardMaterial({ color: 0x2c6f82, map: waterTexture(), transparent: true, opacity: 0.85, roughness: 0.06, metalness: 0.2, emissive: 0x06222b, depthWrite: false });
  nm.map.repeat.set((B.x1 - B.x0) / 4, (B.z1 - B.z0) / 4);
  nappe = new THREE.Mesh(new THREE.PlaneGeometry(B.x1 - B.x0, B.z1 - B.z0), nm);
  nappe.rotation.x = -Math.PI / 2; nappe.position.y = NAPPE_Y; nappe.renderOrder = 1; envRoot.add(nappe);
  const rng = (a, b) => a + Math.random() * (b - a);
  // sol extérieur, percé à l'emplacement du quartier
  const land = (x0, z0, x1, z1, color, y = gy) => {
    const shape = new THREE.Shape([new THREE.Vector2(x0, -z0), new THREE.Vector2(x1, -z0), new THREE.Vector2(x1, -z1), new THREE.Vector2(x0, -z1)]);
    const hx0 = Math.max(x0, B.x0), hx1 = Math.min(x1, B.x1), hz0 = Math.max(z0, B.z0), hz1 = Math.min(z1, B.z1);
    if (hx1 > hx0 && hz1 > hz0) shape.holes.push(new THREE.Path([new THREE.Vector2(hx0, -hz0), new THREE.Vector2(hx0, -hz1), new THREE.Vector2(hx1, -hz1), new THREE.Vector2(hx1, -hz0)]));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshLambertMaterial({ color }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; envRoot.add(m);
    return m;
  };
  const box = (x, y, z, w, h, d, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); envRoot.add(m); return m; };
  const outsideGrid = (x, z, m = 6) => x < B.x0 - m || x > B.x1 + m || z < B.z0 - m || z > B.z1 + m;
  if (L.outer === 'sea') {
    const shore = world.wz(info.sea.shore ?? 176);
    land(-1500, -1500, 1500, shore, L.groundColor);
    const wm = new THREE.MeshStandardMaterial({ color: 0x1f8fb0, map: waterTexture(), transparent: true, opacity: 0.8, roughness: 0.08, metalness: 0.1, emissive: 0x05303a, depthWrite: false });
    wm.map.repeat.set(160, 120);
    water = new THREE.Mesh(new THREE.PlaneGeometry(3000, 1500), wm);
    water.rotation.x = -Math.PI / 2; water.position.set(0, info.sea.y, world.wz(info.sea.z0) + 750); water.renderOrder = 1; envRoot.add(water);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(3000, 1500), new THREE.MeshLambertMaterial({ color: 0xc9b27a }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.8, shore + 750); envRoot.add(sand);
    const hillM = new THREE.MeshLambertMaterial({ color: 0x3f7a30 });
    for (let i = 0; i < 16; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(rng(40, 90), 16, 10), hillM); h.scale.y = rng(0.3, 0.6); h.position.set(rng(-400, 400), 0, B.z0 - rng(120, 320)); envRoot.add(h); }
    const trunk = new THREE.MeshLambertMaterial({ color: 0x8d7050 }), leaf = new THREE.MeshLambertMaterial({ color: 0x4f9a32 });
    for (let i = 0; i < 70; i++) {
      const x = rng(-300, 300), z = rng(B.z0 - 100, shore + 6);
      if (!outsideGrid(x, z)) continue;
      const h = rng(5, 9);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, h, 6), trunk); t.position.set(x, gy + h / 2, z); envRoot.add(t);
      const l = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 7), leaf); l.position.set(x, gy + h, z); envRoot.add(l);
    }
  } else {
    land(-1500, -1500, 1500, 1500, L.groundColor);
  }
  if (L.outer === 'moon') {
    const hm = new THREE.MeshLambertMaterial({ color: 0x7c7a75 });
    for (let i = 0; i < 26; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(rng(40, 130), 18, 10), hm); h.scale.y = rng(0.12, 0.4); const a = rng(0, 6.28), r = rng(260, 700); h.position.set(Math.cos(a) * r, gy - 2, Math.sin(a) * r); envRoot.add(h); }
    const rm = new THREE.MeshLambertMaterial({ color: 0x6a6864 });
    for (let i = 0; i < 12; i++) { const a = rng(0, 6.28), r = rng(200, 500), R0 = rng(15, 40); const ring = new THREE.Mesh(new THREE.TorusGeometry(R0, R0 * 0.12, 6, 30), rm); ring.rotation.x = Math.PI / 2; ring.scale.z = 0.5; ring.position.set(Math.cos(a) * r, gy, Math.sin(a) * r); envRoot.add(ring); }
  }
  if (L.outer === 'city') {
    const dusk = L.id === 'gare';
    const tex = windowsTexture(dusk);
    const mats = [0xb8b2a6, 0x9aa3ad, 0xc9b79a, 0x8a8f96].map((c) => new THREE.MeshLambertMaterial({ color: c, map: tex, emissive: dusk ? 0xffffff : 0x000000, emissiveMap: dusk ? tex : null, emissiveIntensity: dusk ? 0.3 : 0 }));
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, r = rng(Math.max(B.x1, B.z1) + 20, Math.max(B.x1, B.z1) + 200);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (!outsideGrid(x, z, 16)) continue;
      const w = rng(10, 26), d = rng(10, 26), h = rng(12, 70);
      box(x, gy, z, w, h, d, pick(mats));
    }
  } else if (L.outer === 'field') {
    const hillM = new THREE.MeshLambertMaterial({ color: 0x6d8a48 });
    for (let i = 0; i < 18; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(rng(60, 140), 16, 10), hillM); h.scale.y = rng(0.15, 0.35); const a = rng(0, 6.28); h.position.set(Math.cos(a) * rng(380, 700), 0, Math.sin(a) * rng(380, 700)); envRoot.add(h); }
    if (L.id === 'aeroport') {
      // la piste se prolonge hors de la carte, jamais par-dessus les cubes (sinon ça scintille)
      const sm = new THREE.MeshLambertMaterial({ color: 0x3a3b3d });
      for (const [x0, x1] of [[-1500, B.x0], [B.x1, 1500]]) {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 14.4), sm);
        strip.rotation.x = -Math.PI / 2; strip.position.set((x0 + x1) / 2, gy + 0.01, world.wz(298)); envRoot.add(strip);
      }
      const hm = new THREE.MeshLambertMaterial({ color: 0x9aa0a6 });
      for (let i = 0; i < 6; i++) box(B.x1 + rng(40, 200), gy, rng(-60, 60), rng(30, 50), rng(10, 16), rng(30, 45), hm);
    }
  }
}

// ------------------------------------------------------------------ chargement d'un quartier
async function loadEnv(id, onProgress) {
  G.loading = true;
  const L = LEVELS.find((e) => e.id === id);
  weapons.clearAll(); fx.clear();
  if (world) { scene.remove(world.group); world.dispose(); world = null; }
  if (G.dozer) { G.dozer.dispose(); G.dozer = null; G.driving = false; audio.engine(0); }
  const W = new World(L.sx, L.sy, L.sz, L.outerTop || (L.id === 'tropiques' ? tropOuter : null));
  const info = L.build(W);
  W.tally();
  W.g = L.gravity ?? 1;
  W.setShadows(S.quality !== 'basse');
  sun.shadow.needsUpdate = true;
  await W.buildAll(onProgress);
  world = W;
  scene.add(W.group);
  weapons.setWorld(W);
  W.onDetach = (b) => {
    if (G.state !== 'playing') return;
    if (b.count > 400) {
      audio.play('collapse', { x: W.wx(b.ox + b.w / 2), y: b.oy * VS, z: W.wz(b.oz + b.d / 2) }, Math.min(1.6, b.count / 2000));
      if (performance.now() - G.lastCollapse > 12000) { G.lastCollapse = performance.now(); setTimeout(() => say(pick(Q.collapse)), 600); }
    }
  };
  buildScenery(L, info);
  player.sea = info.sea ? { y: info.sea.y, z: W.wz(info.sea.z0) } : null;
  player.nappe = L.nappe === false ? null : NAPPE_Y;
  if (L.nappe === false && nappe) { envRoot.remove(nappe); nappe = null; }
  ambient.intensity = L.ambient ?? 0.45;
  skyExtras.visible = L.outer === 'moon';
  player.groundY = GROUND * VS;
  // ciel, lumières, brouillard
  skyU.top.value.set(L.sky).offsetHSL(0, 0.1, -0.22); skyU.bot.value.set(L.sky).offsetHSL(0, -0.05, 0.1);
  if (L.skyTop !== undefined) { skyU.top.value.set(L.skyTop); skyU.bot.value.set(L.skyBot); }
  scene.fog = new THREE.Fog(L.fogColor !== undefined ? new THREE.Color(L.fogColor) : new THREE.Color(L.sky).offsetHSL(0, -0.05, 0.06), L.fogNear, L.fogFar);
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  sun.color.set(L.sun); sun.intensity = L.sunI;
  sun.position.set(...L.sunPos).normalize().multiplyScalar(200); sun.target.position.set(0, 0, 0);
  const sc = sun.shadow.camera, ext = Math.max(L.sx, L.sz) * VS / 2 + 6;
  sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 10; sc.far = 450; sc.updateProjectionMatrix();
  renderer.toneMappingExposure = L.id === 'gare' ? 1.05 : 1.0;
  const sx = W.wx(info.spawn.x + 0.5), sz = W.wz(info.spawn.z + 0.5);
  G.spawn = { x: sx, z: sz, y: W.groundBelow(sx, sz, GROUND * VS + 1.5), yaw: info.spawn.yaw };
  const c = info.cam;
  G.cam = { x: W.wx(c.x), y: (c.y + GROUND) * VS, z: W.wz(c.z), tx: W.wx(c.tx), ty: (c.ty + GROUND) * VS, tz: W.wz(c.tz) };
  G.env = id; G.builtEnv = id; G.info = info; G.L = L;
  levelEmitters();
  G.loading = false;
  return L;
}

// panaches permanents du niveau (vapeur des tours de refroidissement)
function levelEmitters() {
  if (!world || !G.info || !G.info.steam) return;
  for (const s of G.info.steam) fx.addEmitter(world.wx(s.x), (s.y + GROUND) * VS, world.wz(s.z), Infinity, 'steam', { r: s.r * VS, anchor: [s.anchor[0], s.anchor[1] + GROUND, s.anchor[2]] });
}

// ------------------------------------------------------------------ captures pour les menus
function snapshot(sc, cam, w, h, fmtType = 'image/jpeg') {
  const pr = renderer.getPixelRatio(), ow = innerWidth, oh = innerHeight;
  renderer.setPixelRatio(1); renderer.setSize(w, h, false);
  cam.aspect = w / h; cam.updateProjectionMatrix();
  renderer.render(sc, cam);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(canvas, 0, 0, w, h);
  renderer.setPixelRatio(pr); renderer.setSize(ow, oh, false);
  return c.toDataURL(fmtType, 0.86);
}
const THUMBS = { env: {}, weapon: {} };
function makeWeaponThumbs() {
  const sc = new THREE.Scene();
  sc.environment = envTex; sc.environmentIntensity = 1;
  sc.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.4));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(1, 2, 3); sc.add(d);
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 20);
  renderer.setClearColor(0x000000, 0);
  for (const w of WEAPONS) {
    const g = buildModel(w.id).root;
    if (w.id === 'masse' || w.id === 'golf' || w.id === 'pelle') g.rotation.set(0, 0, -1.25);
    else if (w.id === 'mine') g.rotation.set(0.55, 0.3, 0);
    else if (w.id === 'bombe') g.rotation.set(0.25, -0.6, 0);
    else if (w.id === 'piolet') g.rotation.set(0, 0.4, -0.9);
    else g.rotation.set(0, -Math.PI / 2, 0);
    sc.add(g);
    const box = new THREE.Box3().setFromObject(g);
    const ctr = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.y / 0.5625) * 0.5;
    const dist = r / Math.tan(THREE.MathUtils.degToRad(15)) * 0.72;
    cam.position.set(ctr.x + dist * 0.12, ctr.y + dist * 0.18, ctr.z + dist); cam.lookAt(ctr);
    THUMBS.weapon[w.id] = snapshot(sc, cam, 480, 270, 'image/png');
    sc.remove(g);
  }
  renderer.setClearColor(0x000000, 1);
}
function makeEnvThumb(L) {
  const c = G.cam;
  const cam = new THREE.PerspectiveCamera(62, 1.6, 0.05, 1500);
  cam.position.set(c.x, c.y, c.z); cam.lookAt(c.tx, c.ty, c.tz);
  sky.position.copy(cam.position);
  THUMBS.env[L.id] = snapshot(scene, cam, 640, 400);
}

// ------------------------------------------------------------------ écrans
function show(id) { for (const s of $$('.screen')) s.classList.toggle('active', s.id === id); }
function setHud(on) { $('#hud').classList.toggle('active', on); }

function buildEnvCards() {
  const box = $('#env-cards'); box.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const el = document.createElement('button');
    el.className = 'env-card' + (L.id === G.env ? ' sel' : '');
    el.dataset.id = L.id;
    el.innerHTML = `<div class="shot" style="background-image:url(${THUMBS.env[L.id]})"><span class="num">0${i + 1}</span><span class="sel-badge">Sélectionné</span><h3>${L.name}</h3></div>
      <div class="body"><div class="sub">${L.sub}</div><p>${L.desc}</p>
      <div class="tags">${L.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      <div class="fragile">Fragilité <b>${'■'.repeat(L.fragile)}${'□'.repeat(5 - L.fragile)}</b></div>
      <div class="size">${Math.round(L.sx * VS)} × ${Math.round(L.sz * VS)} m</div></div>`;
    el.addEventListener('mouseenter', () => audio.play('ui_hover'));
    el.addEventListener('click', async () => {
      audio.play('ui_click');
      $$('.env-card').forEach((c) => c.classList.toggle('sel', c.dataset.id === L.id));
      if (G.env !== L.id || G.builtEnv !== L.id) { G.env = L.id; await loadEnv(L.id); G.menuT = 0; }
    });
    el.addEventListener('dblclick', () => goWeapon());
    box.appendChild(el);
  });
}
function buildWeaponCards() {
  const box = $('#weapon-cards'); box.innerHTML = '';
  WEAPONS.forEach((w, i) => {
    const el = document.createElement('button');
    el.className = 'w-card' + (i === G.weapon ? ' sel' : '');
    el.innerHTML = `<span class="k">${i + 1}</span><img src="${THUMBS.weapon[w.id]}" alt=""><h4>${w.name}</h4><small>${w.nick}</small>`;
    el.addEventListener('mouseenter', () => { audio.play('ui_hover'); weaponDetail(i); });
    el.addEventListener('mouseleave', () => weaponDetail(G.weapon));
    el.addEventListener('click', () => { audio.play('ui_click'); G.weapon = i; $$('.w-card').forEach((c, k) => c.classList.toggle('sel', k === i)); weaponDetail(i); });
    el.addEventListener('dblclick', () => startGame());
    box.appendChild(el);
  });
  weaponDetail(G.weapon);
}
function weaponDetail(i) {
  const w = WEAPONS[i];
  const bar = (n) => `<div class="bar">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? 'on' : ''} ${k <= n && n >= 5 ? 'hot' : ''}"></i>`).join('')}</div>`;
  $('#weapon-detail').innerHTML = `<div class="step">Arme ${i + 1}</div><h3>${w.name}</h3><div class="nick">${w.nick}</div>
    <p class="desc">${w.desc}</p>
    <div class="stat"><span>Dégâts</span>${bar(w.stats.deg)}</div>
    <div class="stat"><span>Cadence</span>${bar(w.stats.cad)}</div>
    <div class="stat"><span>Portée</span>${bar(w.stats.por)}</div>
    <div class="stat"><span>Bordel</span>${bar(w.stats.bor)}</div>
    <blockquote>${Q.weapon[w.id]}</blockquote>`;
}

const SETTINGS_UI = [
  { k: 'sens', label: 'Sensibilité souris', type: 'range', min: 0.2, max: 3, step: 0.05, f: (v) => v.toFixed(2) },
  { k: 'fov', label: 'Champ de vision', type: 'range', min: 60, max: 105, step: 1, f: (v) => v + '°' },
  { k: 'sfx', label: 'Volume des effets', type: 'range', min: 0, max: 1, step: 0.05, f: (v) => Math.round(v * 100) },
  { k: 'music', label: 'Volume de la musique', type: 'range', min: 0, max: 1, step: 0.05, f: (v) => Math.round(v * 100) },
  { k: 'quality', label: 'Qualité graphique', sub: 'Haute : halo lumineux, ombres fines · Moyenne : ombres · Basse : ni l\'un ni l\'autre', type: 'seg', opts: [['basse', 'Basse'], ['moyenne', 'Moyenne'], ['haute', 'Haute']] },
  { k: 'voice', label: 'Voix du narrateur', sub: 'Synthèse vocale du navigateur', type: 'seg', opts: [[false, 'Non'], [true, 'Oui']] },
  { k: 'invertY', label: 'Inverser la souris', type: 'seg', opts: [[false, 'Non'], [true, 'Oui']] },
];
function buildSettings() {
  const box = $('#settings'); box.innerHTML = '';
  for (const d of SETTINGS_UI) {
    const row = document.createElement('div'); row.className = 'set-row';
    row.innerHTML = `<label>${d.label}${d.sub ? `<small>${d.sub}</small>` : ''}</label>`;
    if (d.type === 'range') {
      const inp = document.createElement('input'); inp.type = 'range'; inp.min = d.min; inp.max = d.max; inp.step = d.step; inp.value = S[d.k];
      const out = document.createElement('output'); out.textContent = d.f(S[d.k]);
      inp.addEventListener('input', () => { S[d.k] = parseFloat(inp.value); out.textContent = d.f(S[d.k]); applySettings(); });
      row.append(inp, out);
    } else {
      const seg = document.createElement('div'); seg.className = 'seg';
      for (const [v, l] of d.opts) {
        const bt = document.createElement('button'); bt.textContent = l; bt.classList.toggle('on', S[d.k] === v);
        bt.addEventListener('click', () => { S[d.k] = v; [...seg.children].forEach((c) => c.classList.toggle('on', c === bt)); audio.play('ui_click'); applySettings(d.k === 'quality'); });
        seg.appendChild(bt);
      }
      row.appendChild(seg);
    }
    box.appendChild(row);
  }
}
function applySettings(quality) {
  player.sens = S.sens; player.invertY = S.invertY;
  audio.setVolumes(S.sfx, S.music);
  camera.fov = S.fov; camera.updateProjectionMatrix(); fx.setScale(innerHeight * renderer.getPixelRatio(), S.fov);
  if (quality) applyQuality();
  if (!S.voice && window.speechSynthesis) speechSynthesis.cancel();
  saveSettings();
}

// ------------------------------------------------------------------ navigation
let settingsReturn = 'scr-menu';
function goTitle() { G.state = 'title'; show('scr-title'); $('#title-tagline').textContent = pick(Q.taglines); }
function goMenu() {
  G.state = 'menu'; show('scr-menu'); setHud(false); lockHint(false);
  $('#menu-quote').textContent = pick(Q.taglines);
  audio.intensity = 0; audio.startMusic();
}
async function goEnv() {
  G.state = 'env'; show('scr-env'); buildEnvCards();
  if (world && world.destroyed > 0) await loadEnv(G.env);
}
function goWeapon() { audio.play('ui_click'); G.state = 'weapon'; show('scr-weapon'); buildWeaponCards(); }
function goSettings(from) { settingsReturn = from; G.state = 'settings'; show('scr-settings'); buildSettings(); }

async function startGame() {
  if (G.loading) return;
  audio.play('whoosh');
  if (!(G.builtEnv === G.env && world && world.destroyed === 0 && !world.bodies.length)) {
    show('scr-loading'); setLoad(0, 'Reconstruction du quartier…');
    await loadEnv(G.env, (p) => setLoad(p));
  }
  fx.clear(); weapons.clearAll(); levelEmitters();
  if (G.dozer) { G.dozer.dispose(); G.dozer = null; } G.driving = false; audio.engine(0);
  player.reset(G.spawn);
  weapons.resetAmmo();
  weapons.select(G.weapon, true);
  Object.assign(G, {
    state: 'playing', time: G.mode === 'chrono' ? CHRONO : Infinity, elapsed: 0, score: 0, shown: 0, raw: 0, combo: 0, comboT: 0, comboTick: 0,
    bestMult: 1, nukeT: 0, cats: {}, shots: 0, hits: 0, voxels: 0, quoteCD: 0, idle: 0, timeScale: 1, slowT: 0, stop: 0,
  });
  world.destroyed = 0; world.destroyedPct = 0; world.takePaid();
  G.milestones = new Set(); G.firsts = new Set(['w_' + WEAPONS[G.weapon].id]);
  G.feed.clear(); $('#hud-feed').innerHTML = ''; $('#popups').innerHTML = '';
  show(''); setHud(true); hudWeapon(); hudSlots();
  setText('#hud-score', '0 €');
  $('#hud-env').textContent = G.L.name + ' · ' + (G.mode === 'chrono' ? 'Chrono' : 'Défouloir libre');
  audio.intensity = 1;
  requestLock();
  setTimeout(() => { if (G.state === 'playing') say(pick(Q.intro[G.env]), true); }, 700);
  setTimeout(() => { if (G.state === 'playing') announce(G.L.name, 'Tout doit disparaître'); }, 150);
}
function pauseGame() {
  if (G.state !== 'playing') return;
  G.state = 'paused'; show('scr-pause'); lockHint(false);
  weapons.trigger(false); player.keys.clear(); audio.engine(0);
  $('#pause-quote').textContent = '« ' + pick([...Q.combo, ...Q.idle]) + ' »';
}
function resumeGame() {
  if (G.state !== 'paused' && G.state !== 'settings') return;
  G.state = 'playing'; show(''); setHud(true);
  if (G.driving) audio.engine(0.25);
  requestLock();
}
function endGame(reason) {
  if (G.state !== 'playing' && G.state !== 'paused') return;
  G.state = 'results';
  weapons.trigger(false); audio.engine(0);
  if (document.pointerLockElement) document.exitPointerLock();
  lockHint(false);
  if (reason === 'time') { say(pick(Q.timeUp), true); announce('Terminé', 'L\'addition arrive'); }
  setTimeout(() => showResults(), reason === 'time' ? 1800 : 100);
}

function requestLock() {
  try {
    const p = canvas.requestPointerLock({ unadjustedMovement: true });
    if (p && p.catch) p.catch(() => { try { const p2 = canvas.requestPointerLock(); if (p2 && p2.catch) p2.catch(() => lockHint(true)); } catch (e) { lockHint(true); } });
  } catch (e) { lockHint(true); }
}
function lockHint(on) { $('#lock-hint').classList.toggle('on', on && G.state === 'playing'); }
document.addEventListener('pointerlockchange', () => {
  G.locked = document.pointerLockElement === canvas;
  if (G.locked) lockHint(false);
  else if (G.state === 'playing') pauseGame();
});
$('#lock-hint').addEventListener('click', () => { if (G.state === 'playing') requestLock(); });

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act],[data-mode]');
  if (!b) return;
  if (b.dataset.mode) {
    G.mode = b.dataset.mode; audio.play('ui_click');
    $$('.toggle').forEach((t) => t.classList.toggle('on', t === b));
    return;
  }
  const a = b.dataset.act;
  const scr = b.closest('.screen')?.id;
  if (a !== 'back') audio.play('ui_click'); else audio.play('ui_back');
  switch (a) {
    case 'play': goEnv(); break;
    case 'settings': goSettings(scr === 'scr-pause' ? 'scr-pause' : 'scr-menu'); break;
    case 'howto': G.state = 'howto'; show('scr-howto'); break;
    case 'credits': G.state = 'credits'; show('scr-credits'); break;
    case 'next': goWeapon(); break;
    case 'start': startGame(); break;
    case 'back':
      if (scr === 'scr-weapon') goEnv();
      else if (scr === 'scr-settings' && settingsReturn === 'scr-pause') { G.state = 'paused'; show('scr-pause'); }
      else goMenu();
      break;
    case 'resume': resumeGame(); break;
    case 'restart': G.builtEnv = null; startGame(); break;
    case 'finish': G.state = 'playing'; endGame('quit'); break;
    case 'quit': setHud(false); goMenu(); break;
    case 'again': G.builtEnv = null; startGame(); break;
    case 'other': setHud(false); goEnv(); break;
    case 'menu': setHud(false); goMenu(); break;
  }
});
document.addEventListener('mouseover', (e) => { const b = e.target.closest('.menu button, .btn, .toggle'); if (b && !b.contains(e.relatedTarget)) audio.play('ui_hover'); });

// ------------------------------------------------------------------ entrées
addEventListener('keydown', (e) => {
  audio.init();
  if (G.state === 'title') { goMenu(); return; }
  if (G.state === 'playing') {
    player.keys.add(e.code);
    if (e.code === 'KeyE' && G.driving) { weapons.select(G.lastWeapon); hudSlots(); }
    if (e.code.startsWith('Digit')) { const n = parseInt(e.code.slice(5), 10) - 1; if (n >= 0 && n < WEAPONS.length) { weapons.select(n); hudSlots(); } }
    if (e.code === 'KeyR') weapons.reload();
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.code === 'KeyP' || (e.code === 'Escape' && !G.locked)) pauseGame();
  } else if (e.code === 'Escape') {
    if (G.state === 'paused') resumeGame();
    else if (['env', 'howto', 'credits'].includes(G.state)) goMenu();
    else if (G.state === 'weapon') goEnv();
    else if (G.state === 'settings') { if (settingsReturn === 'scr-pause') { G.state = 'paused'; show('scr-pause'); } else goMenu(); }
  } else if (e.code === 'Enter') {
    if (G.state === 'env') goWeapon(); else if (G.state === 'weapon') startGame();
  }
});
addEventListener('keyup', (e) => player.keys.delete(e.code));
addEventListener('mousedown', (e) => {
  audio.init();
  if (G.state === 'title') { goMenu(); return; }
  if (G.state !== 'playing') return;
  if (!G.locked) { requestLock(); return; }
  if (e.button === 0) weapons.trigger(true);
});
addEventListener('mouseup', (e) => { if (e.button === 0) weapons.trigger(false); });
const look = { x: 0, y: 0 };
addEventListener('mousemove', (e) => {
  if (G.state !== 'playing' || !G.locked) return;
  if (G.driving) { look.x += e.movementX; look.y += e.movementY; }
  else player.look(e.movementX, e.movementY);
});
addEventListener('wheel', (e) => {
  if (G.state !== 'playing') return;
  const n = (weapons.cur + (e.deltaY > 0 ? 1 : -1) + WEAPONS.length) % WEAPONS.length;
  weapons.select(n); hudSlots();
}, { passive: true });
addEventListener('blur', () => { player.keys.clear(); weapons.trigger(false); });
addEventListener('contextmenu', (e) => e.preventDefault());

// ------------------------------------------------------------------ score, combos, répliques
function mult() { return Math.min(10, 1 + Math.floor(Math.sqrt(G.combo / 3))); }
function collect() {
  const paid = world.takePaid();
  if (!paid || G.state !== 'playing') return;
  const nuke = G.nukeT > 0;
  let raw = 0, n = 0;
  const byCat = {};
  for (let m = 1; m < N; m++) {
    const c = paid[m];
    if (!c) continue;
    const v = c * VAL[m], cat = CAT[m];
    raw += v; n += c;
    const e = byCat[cat] || (byCat[cat] = { n: 0, v: 0 }); e.n += c; e.v += v;
  }
  if (!n) return;
  const before = mult();
  if (!nuke && G.comboTick <= 0) { G.combo++; G.comboTick = 0.15; }
  if (!nuke) G.comboT = 2.6;
  const m = nuke ? 1 : mult();
  G.score += raw * m; G.raw += raw; G.voxels += n; G.idle = 0;
  const after = mult();
  if (after > before && !nuke) {
    G.bestMult = Math.max(G.bestMult, after);
    audio.play('combo', null, after);
    if (after >= 4) announce('×' + after, Q.comboLabels[after]);
    if ((after === 5 || after === 8 || after === 10) && Math.random() < 0.8) say(pick(Q.combo));
  }
  G.gainAcc += raw * m;
  for (const [cat, e] of Object.entries(byCat)) {
    const c = G.cats[cat] || (G.cats[cat] = { n: 0, v: 0 }); c.n += e.n; c.v += e.v;
    const f = G.feed.get(cat);
    if (f) { f.n += e.n; f.v += e.v * m; f.t = 1.8; f.dirty = true; } else G.feed.set(cat, { n: e.n, v: e.v * m, t: 1.8, dirty: true, el: null });
    if (!G.firsts.has('c_' + cat) && Q.first[cat] && e.v > 50) {
      G.firsts.add('c_' + cat);
      if (cat !== 'Terrassement' || G.cats[cat].n > 30) setTimeout(() => say(pick(Q.first[cat])), 250);
      if (cat === 'Coffre-fort') { audio.play('cash'); announce('Le coffre', 'est ouvert'); }
    }
  }
}

let typeTimer = null;
function say(text, force) {
  if (!text) return;
  if (G.quoteCD > 0 && !force) return;
  G.quoteCD = 7;
  const box = $('#hud-quote'), el = $('#q-text');
  box.classList.add('on');
  clearInterval(typeTimer);
  let i = 0; el.textContent = '';
  typeTimer = setInterval(() => {
    i += 2; el.textContent = text.slice(0, i);
    if (i % 6 === 0) audio.play('type');
    if (i >= text.length) { clearInterval(typeTimer); el.textContent = text; }
  }, 22);
  clearTimeout(say.hide); say.hide = setTimeout(() => box.classList.remove('on'), 4200 + text.length * 30);
  if (S.voice && window.speechSynthesis) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = 0.98; u.pitch = 0.75;
      const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.startsWith('fr'));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* voix indisponible */ }
  }
}
function announce(big, small, hold = 0) {
  if (performance.now() < (announce.lock || 0) && !hold) return;
  if (hold) announce.lock = performance.now() + hold;
  $('#announce').innerHTML = `<div class="a">${big}${small ? `<small>${small}</small>` : ''}</div>`;
  audio.play('announce');
}
function flash() { $('#flash').classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => $('#flash').classList.remove('on'))); }
function hitmarker() { const h = $('#hitmarker'); h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); }
function popup(text, big) {
  const el = document.createElement('div');
  el.className = 'pop' + (big ? ' big' : '');
  el.textContent = text;
  el.style.left = (Math.random() * 120 - 60) + 'px';
  el.style.top = (-40 - Math.random() * 40) + 'px';
  $('#popups').appendChild(el);
  setTimeout(() => el.remove(), 950);
}

// ------------------------------------------------------------------ HUD
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function hudWeapon() {
  const w = weapons.w;
  setText('#w-name', w.name); setText('#w-nick', w.nick);
  $('#crosshair').className = 'ch-' + w.ch;
  hudSlots();
}
function hudSlots() { $('#w-slots').innerHTML = WEAPONS.map((w, i) => `<div class="w-slot ${i === weapons.cur ? 'on' : ''}">${i + 1}</div>`).join(''); }
function updateHud(dt) {
  const t = G.time !== Infinity ? Math.max(0, G.time) : G.elapsed, m = Math.floor(t / 60), s = Math.floor(t % 60);
  setText('#hud-timer', `${m}:${String(s).padStart(2, '0')}`);
  $('#hud-timer').classList.toggle('low', G.time !== Infinity && t < 20);
  const prev = Math.round(G.shown);
  G.shown += (G.score - G.shown) * Math.min(1, dt * 7);
  if (G.score - G.shown < 1) G.shown = G.score;
  const cur = Math.round(G.shown);
  if (cur !== prev) setText('#hud-score', fmt(cur) + ' €');
  const pct = Math.min(100, world.pct * 100);
  setText('#hud-pct', Math.floor(pct) + ' %');
  $('#hud-pctbar').style.width = pct + '%';
  for (const ms of [25, 50, 75, 90]) {
    if (pct >= ms && !G.milestones.has(ms)) {
      G.milestones.add(ms);
      announce(ms + ' %', ms === 90 ? 'Presque rasé' : ms === 75 ? 'Chantier avancé' : ms === 50 ? 'À moitié rasé' : 'Ça commence');
      setTimeout(() => say(Q.milestone[ms], true), G.nukeT > 0 ? 5000 : 0);
    }
  }
  const mm = mult();
  $('#hud-combo').classList.toggle('on', G.combo >= 3);
  setText('#combo-mult', '×' + mm);
  setText('#combo-label', Q.comboLabels[mm] || '');
  $('#combo-fill').style.width = (Math.max(0, G.comboT) / 2.6 * 100) + '%';
  G.gainT -= dt;
  if (G.gainAcc > 0 && G.gainT <= 0) {
    popup('+' + fmt(G.gainAcc) + ' €', G.gainAcc > 5000);
    const sc = $('#hud-score'); sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
    G.gainAcc = 0; G.gainT = 0.16;
  }
  const feed = $('#hud-feed');
  for (const [cat, f] of G.feed) {
    f.t -= dt;
    if (!f.el) { f.el = document.createElement('div'); f.el.className = 'feed-item'; feed.prepend(f.el); }
    if (f.dirty) { f.el.innerHTML = `<span>${cat} ×${fmt(f.n)}</span><b>+${fmt(f.v)} €</b>`; f.dirty = false; }
    if (f.t <= 0) { const el = f.el; el.classList.add('out'); setTimeout(() => el.remove(), 400); G.feed.delete(cat); }
  }
  while (feed.children.length > 6) feed.lastChild.remove();
  const w = weapons.w, rl = $('#w-reload');
  if (w.kind === 'nuke') {
    const busy = weapons.bomb || weapons.nukeS;
    if (weapons.bombCD > 0) {
      setText('#w-ammo', Math.ceil(weapons.bombCD) + ' s'); setText('#w-reserve', '');
      rl.classList.add('on'); setText('#w-reload span', 'Fabrication de la bombe');
      rl.style.setProperty('--p', ((1 - weapons.bombCD / w.cooldown) * 100) + '%');
    } else { setText('#w-ammo', busy ? '☢' : '1'); setText('#w-reserve', busy ? ' armée' : ''); rl.classList.remove('on'); }
  } else if (w.kind === 'climb') {
    setText('#w-ammo', player.clinging ? '▲' : '—'); setText('#w-reserve', player.clinging ? ' accroché' : ' escalade'); rl.classList.remove('on');
  } else if (w.kind === 'dozer') {
    setText('#w-ammo', G.dozer && G.dozer.bladeDown ? '▼' : '▲'); setText('#w-reserve', G.dozer && G.dozer.bladeDown ? ' lame basse' : ' lame haute'); rl.classList.remove('on');
  } else if (w.kind === 'mine') {
    setText('#w-ammo', String(w.max - weapons.mines.length)); setText('#w-reserve', '/ ' + w.max); rl.classList.remove('on');
  } else if (w.mag) {
    setText('#w-ammo', String(weapons.ammo[weapons.cur])); setText('#w-reserve', '/ ' + w.mag);
    rl.classList.toggle('on', weapons.reloadT >= 0); setText('#w-reload span', 'Rechargement');
    if (weapons.reloadT >= 0) rl.style.setProperty('--p', (weapons.reloadT / w.reload * 100) + '%');
  } else { setText('#w-ammo', '∞'); setText('#w-reserve', ''); rl.classList.remove('on'); }
  $('#w-ammo').classList.toggle('low', w.kind === 'rocket' && weapons.ammo[weapons.cur] === 0);
  $('#crosshair').style.setProperty('--g', (6 + weapons.recoil * 8) + 'px');
}

// ------------------------------------------------------------------ résultats
function showResults() {
  show('scr-results'); setHud(false);
  audio.intensity = 0;
  const rank = [...Q.ranks].reverse().find((r) => G.score >= r.min) || Q.ranks[0];
  $('#res-rank').textContent = rank.title;
  $('#res-quote').textContent = '« ' + rank.quote + ' »';
  const acc = G.shots ? Math.round(G.hits / G.shots * 100) : 0;
  const dur = G.elapsed, m = Math.floor(dur / 60), s = Math.floor(dur % 60);
  $('#res-stats').innerHTML = `<div><small>Démoli</small><b>${Math.floor(world.pct * 100)} %</b></div>
    <div><small>Cubes</small><b>${fmt(G.voxels)}</b></div>
    <div><small>Meilleur combo</small><b>×${G.bestMult}</b></div>
    <div><small>Précision</small><b>${Math.min(100, acc)} %</b></div>`;
  const cats = Object.entries(G.cats).sort((a, b) => b[1].v - a[1].v);
  const now = new Date();
  const d = now.toLocaleDateString('fr-FR'), h = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const bonus = G.score - G.raw, tva = G.score * 0.2;
  let delay = 0.3;
  const line = (a, b, cls = '') => { delay += 0.07; return `<div class="ln ${cls}" style="animation-delay:${delay.toFixed(2)}s"><span>${a}</span><span>${b}</span></div>`; };
  let html = `<h4>${G.L.sub.toUpperCase()}</h4>
    <div class="c">${G.L.name} — Devis n° ${String(Math.floor(Math.random() * 90000) + 10000)}<br>${d} · ${h} · Durée ${m} min ${String(s).padStart(2, '0')} s<br>Chantier 01 · Conducteur : LE BOURRIN</div><hr>`;
  if (!cats.length) html += line('Rien. Absolument rien.', '0 €');
  for (const [cat, c] of cats) html += line(`${cat} ×${fmt(c.n)}`, fmt(c.v) + ' €');
  html += '<hr>' + line('Sous-total', fmt(G.raw) + ' €') + line(`Prime de style (combo ×${G.bestMult})`, fmt(bonus) + ' €');
  html += line('T.V.A. (Taxe sur la Voirie Anéantie) 20 %', fmt(tva) + ' €');
  html += line('TOTAL TTC', fmt(G.score + tva) + ' €', 'tot');
  html += `<hr><div class="c">Gravats non repris.<br>Merci de votre visite. La mairie vous écrira.</div><div class="barcode"></div>
    <div class="stamp" style="--d:${(delay + 0.4).toFixed(2)}s">${rank.title}</div>`;
  $('#receipt').innerHTML = html;
  audio.play('cash');
  setTimeout(() => audio.play('stamp'), (delay + 0.4) * 1000);
}

// ------------------------------------------------------------------ bulldozer
function enterDozer() {
  if (!world) return;
  const f = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  if (G.dozer) G.dozer.dispose();
  G.dozer = new Dozer(scene, world, fx, audio);
  G.dozer.place(player.pos.x + f.x * 6, player.pos.z + f.z * 6, player.yaw);
  G.dozer.camInit = false; G.dozer.camYaw = 0;
  G.driving = true; G.firsts.has('dozer') || (G.firsts.add('dozer'), setTimeout(() => say(pick(Q.dozer), true), 400));
  audio.engine(0.3); audio.play('whoosh');
}
function exitDozer() {
  G.driving = false; audio.engine(0);
  const D = G.dozer; if (!D) return;
  const r = D.right();
  const x = D.pos.x + r.x * 3.2, z = D.pos.z + r.z * 3.2;
  player.pos.x = x; player.pos.z = z; player.pos.y = world.groundBelow(x, z, D.pos.y + 2.5);
  player.vel.x = player.vel.y = player.vel.z = 0; player.yaw = D.yaw; player.pitch = -0.1;
  player.eyeY = player.pos.y + player.eyeH;
  D.dispose(); G.dozer = null;
}

// ------------------------------------------------------------------ boucle
let last = performance.now();
const clock = { t: 0 };
function worldStep(dt) {
  world.update(dt, weapons.nukeS || world.dirty.size > 60 ? 28 : 9, camera.position);
  // on a percé jusqu'à la nappe : gerbes d'eau
  if (world.removedFx.length) {
    const l = world.removedFx, lim = nappe ? NAPPE_Y / VS : -1;
    let n = 0;
    for (let k = 0; k < l.length && n < 4; k += 4) {
      if (l[k + 1] > lim) continue;
      const x = world.wx(l[k] + 0.5), z = world.wz(l[k + 2] + 0.5);
      if (Math.random() < 0.5) fx.splash(x, NAPPE_Y, z, 0.8);
      n++;
      if (n === 1) audio.play('splash', { x, y: NAPPE_Y, z }, 0.8);
      if (G.state === 'playing' && !G.firsts.has('nappe')) { G.firsts.add('nappe'); setTimeout(() => say(pick(Q.nappe), true), 300); }
    }
  }
  // débris des cubes cassés
  if (world.removedFx.length) {
    let B = world.lastBlast;
    if (!B) { const l = world.removedFx; B = { x: world.wx(l[0]), y: l[1] * VS, z: world.wz(l[2]), force: 2 }; }
    fx.chunks(world.removedFx, B.x, B.y, B.z, B.force, world);
    world.removedFx = []; world.lastBlast = null;
  }
  // blocs qui touchent le sol
  for (const L of world.landings) {
    const k = Math.min(1, L.count / 3000);
    fx.dust(L.x, L.y, L.z, Math.min(10, Math.max(L.w, L.d) / 2), Math.round(6 + 40 * k));
    if (nappe && L.y < NAPPE_Y + 0.4) { fx.splash(L.x, NAPPE_Y, L.z, 1 + k * 2); audio.play('splash', { x: L.x, y: NAPPE_Y, z: L.z }, 0.6 + k); }
    if (L.count > 60) {
      audio.play('collapse', { x: L.x, y: L.y, z: L.z }, 0.4 + k);
      const dd = camera.position.distanceTo(new THREE.Vector3(L.x, L.y, L.z));
      fx.shake(Math.min(1.2, (0.2 + k) * Math.max(0, 1 - dd / 70)));
    }
  }
  world.landings.length = 0;
}
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  clock.t += dt;
  step(dt);
  render(dt);
}
function step(dt) {
  if (!world || G.loading) return;
  if (G.state === 'playing') {
    if (G.stop > 0) { G.stop -= dt; dt *= 0.1; }
    if (G.slowT > 0) { G.slowT -= dt; G.timeScale += (0.35 - G.timeScale) * Math.min(1, dt * 12); if (G.slowT <= 0) $('#slowmo').classList.remove('on'); }
    else G.timeScale += (1 - G.timeScale) * Math.min(1, dt * 4);
    const sdt = dt * G.timeScale;
    G.elapsed += dt;
    if (G.time !== Infinity) { G.time -= dt; if (G.time <= 0) { G.time = 0; endGame('time'); } }
    G.comboT -= sdt; G.comboTick -= sdt; if (G.comboT <= 0) G.combo = 0;
    if (G.nukeT > 0) G.nukeT -= dt;
    G.quoteCD -= dt;
    G.idle += dt; if (G.idle > 16) { G.idle = 0; say(pick(Q.idle)); }
    player.climbTool = !!weapons.w.climb;
    if (G.driving) {
      G.dozer.update(sdt, player.keys, true);
      G.dozer.camera(camera, dt, look.x, look.y);
      const sh = fx.shakeOffset(clock.t); camera.rotation.x += sh.x; camera.rotation.y += sh.y;
      player.pos.x = G.dozer.pos.x; player.pos.y = G.dozer.pos.y + 1.2; player.pos.z = G.dozer.pos.z; player.yaw = G.dozer.yaw; player.vel.x = player.vel.y = player.vel.z = 0;
    } else {
      player.update(dt, world, true);
      player.apply(camera, fx.shakeOffset(clock.t));
    }
    look.x = 0; look.y = 0;
    weapons.update(sdt, player);
    worldStep(sdt);
    collect();
    fx.update(sdt, world);
    audio.listener(camera.position, player.yaw);
    if (player.grab) { player.grab = false; audio.play('imp_metal', camera.position, 0.5); }
    if (player.clinging && Math.floor(player.climbStep) !== G.lastStep) { G.lastStep = Math.floor(player.climbStep); audio.play('imp_metal', camera.position, 0.35); fx.puff(camera.position.x - Math.sin(player.yaw) * 0.5, camera.position.y + 0.3, camera.position.z - Math.cos(player.yaw) * 0.5, 2, [0.6, 0.58, 0.52], 0.15, 0.4); }
    if (player.inWater && player.sea && player.waterY === player.sea.y && !G.firsts.has('water')) { G.firsts.add('water'); say(pick(Q.water)); }
    updateHud(dt);
  } else if (G.state === 'paused' || (G.state === 'settings' && settingsReturn === 'scr-pause')) {
    fx.update(dt * 0.3, world);
  } else if (G.state === 'results') {
    worldStep(dt); fx.update(dt, world); menuCamera(dt, 0.4);
  } else if (G.state !== 'loading') {
    menuCamera(dt, 1);
    weapons.update(dt, null);
    worldStep(dt);
    fx.update(dt, world);
    if (G.state === 'title' || G.state === 'menu') attract(dt);
  }
}
function render(dt) {
  // ombres recalculées seulement quand quelque chose bouge
  if (world && (world.changed || world.bodies.length || fx.debris.items.length || weapons.projs.length || weapons.mines.length || weapons.bomb || G.state !== 'playing' || G.shadowT > 0)) {
    sun.shadow.needsUpdate = true; world.changed = false;
  }
  if (nappe) { nappe.material.map.offset.set(clock.t * 0.012, clock.t * 0.008); nappe.position.y = NAPPE_Y + Math.sin(clock.t * 1.3) * 0.015; }
  if (water) { water.material.map.offset.set(clock.t * 0.01, clock.t * 0.006); water.position.y = G.info.sea.y + Math.sin(clock.t * 1.1) * 0.03; }
  sky.position.copy(camera.position); skyExtras.position.copy(camera.position);
  $('#underwater').classList.toggle('on', G.state === 'playing' && player.wet);
  const inGame = G.state === 'playing' || G.state === 'paused';
  const handsFree = G.driving;
  for (const m of weapons.models) if (!inGame || handsFree) m.root.visible = false; else m.root.visible = m === weapons.models[weapons.cur] && weapons.w.kind !== 'dozer' && (weapons.w.id !== 'bombe' || (!weapons.bomb && !weapons.nukeS && weapons.bombCD <= 0));
  $('#crosshair').style.display = handsFree ? 'none' : '';
  if (S.quality !== 'haute') {
    renderer.autoClear = false; renderer.clear();
    renderer.render(scene, camera);
    if (inGame) { renderer.clearDepth(); renderer.render(vmScene, vmCam); }
    renderer.autoClear = true;
  } else {
    vmPass.enabled = inGame;
    composer.render(dt);
  }
}

function menuCamera(dt, speed) {
  if (!G.cam) return;
  G.menuT += dt * 0.04 * speed;
  const c = G.cam;
  const a = Math.sin(G.menuT) * 0.6;
  const cx = c.tx + (c.x - c.tx) * Math.cos(a) - (c.z - c.tz) * Math.sin(a);
  const cz = c.tz + (c.x - c.tx) * Math.sin(a) + (c.z - c.tz) * Math.cos(a);
  camera.position.set(cx, c.y + Math.sin(G.menuT * 1.7) * 0.6, cz);
  camera.lookAt(c.tx, c.ty, c.tz);
  const sh = fx.shakeOffset(clock.t);
  camera.rotation.x += sh.x; camera.rotation.y += sh.y;
}

// démo en fond de menu : une roquette de temps en temps
function attract(dt) {
  G.attractT -= dt;
  if (G.attractT > 0) return;
  G.attractT = 3.5 + Math.random() * 3;
  if (world.destroyed > 1500000) return;
  const c = G.cam;
  for (let tries = 0; tries < 20; tries++) {
    const x = c.tx + (Math.random() - 0.5) * 60, z = c.tz + (Math.random() - 0.5) * 60;
    const y = world.groundBelow(x, z, 60);
    if (y <= GROUND * VS + 0.5) continue;
    const p = new THREE.Vector3(x, Math.max(GROUND * VS + 1, y - Math.random() * 6), z);
    const r = world.blast(p.x, p.y, p.z, 3.2, 30);
    world.lastBlast = { x: p.x, y: p.y, z: p.z, force: 12 };
    fx.explosion(p.x, p.y, p.z, 2.2);
    audio.play('explosion', null, 0.15);
    fx.shake(0.15);
    if (r.n) break;
  }
}

// ------------------------------------------------------------------ démarrage
async function boot() {
  try {
    setLoad(0.03, 'Coulage du béton…');
    applyQuality();
    await wait(30);
    setLoad(0.08, 'Affûtage des arguments…');
    makeWeaponThumbs();
    const msgs = ['Érection des tours de verre…', 'Remplissage des réservoirs de kérosène…', 'Plantation des cocotiers…', 'Pose des rails…', 'Empilage des conteneurs…', 'Mise en rayon…', 'Hissage du pont-levis…', 'Chargement des barres de combustible…', 'Mise en orbite…'];
    for (let i = 0; i < LEVELS.length; i++) {
      const L = LEVELS[i];
      setLoad(0.06 + i * 0.095, msgs[i]);
      await loadEnv(L.id, (p) => setLoad(0.06 + (i + p) * 0.095));
      renderer.compile(scene, camera);
      makeEnvThumb(L);
    }
    setLoad(0.95, 'Presque prêt à tout raser…');
    await loadEnv(LEVELS[0].id);
    G.env = LEVELS[0].id;
    await wait(80);
    setLoad(1, 'C\'est prêt.');
    await wait(250);
    goTitle();
    requestAnimationFrame(frame);
  } catch (e) {
    console.error(e);
    setLoad(1, 'Erreur au chargement : ' + e.message);
  }
}

window.__BQ = { G, S, get world() { return world; }, player, weapons, fx, audio, camera, scene, renderer, loadEnv, startGame, endGame, goMenu, step, render, collect };
boot();
