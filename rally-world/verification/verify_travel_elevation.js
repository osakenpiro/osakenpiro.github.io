const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const physicsSource = html.slice(
  html.indexOf('const FIXED_DT='),
  html.indexOf('// Minimal matrix helpers'),
);
const geometrySource = html.slice(
  html.indexOf('function terrainVertices'),
  html.indexOf('function discVertices'),
);
const source = physicsSource + '\n' + geometrySource;

const tests = `
let cameraRig = null;
function updateReadouts() {}

const heights = Array.from(
  { length: 2049 },
  (_, i) => routeElevation(totalLength * i / 2048),
);
const deltas = heights.slice(1).map((value, i) => Math.abs(value - heights[i]));

if (Math.abs(heights[0] - heights.at(-1)) > 1e-9) {
  throw new Error('elevation loop is not closed');
}
if (Math.max(...deltas) > 0.2) {
  throw new Error('elevation profile has a discontinuity');
}

for (let i = 0; i < 128; i++) {
  const s = totalLength * i / 128;
  const point = pointAtS(s);
  const mismatch = Math.abs(
    terrainHeight(point.x, point.z) - (routeElevation(s) - 0.36),
  );
  if (mismatch > 1e-6) {
    throw new Error('road/terrain mismatch at sample ' + i + ': ' + mismatch);
  }
  const surfaceMismatch = Math.abs(
    surfaceHeight(point.x, point.z) - (routeElevation(s) + 0.08),
  );
  if (surfaceMismatch > 1e-6) {
    throw new Error('road/surface mismatch at sample ' + i + ': ' + surfaceMismatch);
  }
}

const terrain = terrainVertices();
const road = ribbonVertices(
  TRACK_PATH,
  ROAD_WIDTH,
  (x, z, s) => routeElevation(s) + 0.08,
);
const stripes = stripeVertices(TRACK_SEGS);
for (const [name, data] of [
  ['terrain', terrain],
  ['road', road],
  ['stripes', stripes],
]) {
  if (!data.length || data.some((value) => !Number.isFinite(value))) {
    throw new Error(name + ' mesh is invalid');
  }
}

function sampleTerrainMeshY(x, z, cells = 56) {
  const size = WORLD.max - WORLD.min;
  const step = size / cells;
  const ix = Math.min(cells - 1, Math.max(0, Math.floor((x - WORLD.min) / step)));
  const iz = Math.min(cells - 1, Math.max(0, Math.floor((z - WORLD.min) / step)));
  const x0 = WORLD.min + ix * step;
  const z0 = WORLD.min + iz * step;
  const u = clamp((x - x0) / step, 0, 1);
  const v = clamp((z - z0) / step, 0, 1);
  const y00 = terrainHeight(x0, z0);
  const y10 = terrainHeight(x0 + step, z0);
  const y01 = terrainHeight(x0, z0 + step);
  const y11 = terrainHeight(x0 + step, z0 + step);
  return u >= v
    ? y00 + (y10 - y00) * u + (y11 - y10) * v
    : y00 + (y01 - y00) * v + (y11 - y01) * u;
}

function roadClearancesFor(cells) {
  const values = [];
  const normalAt = index => {
    const prev = TRACK_PATH[(index + TRACK_PATH.length - 1) % TRACK_PATH.length];
    const next = TRACK_PATH[(index + 1) % TRACK_PATH.length];
    const tx = next[0] - prev[0];
    const tz = next[1] - prev[1];
    const length = Math.hypot(tx, tz) || 1;
    return { x: -tz / length, z: tx / length };
  };
  for (let sample = 0; sample < TRACK_PATH.length * 8; sample++) {
    const routeIndex = sample / 8;
    const i = Math.floor(routeIndex) % TRACK_PATH.length;
    const j = (i + 1) % TRACK_PATH.length;
    const t = routeIndex - Math.floor(routeIndex);
    const p = TRACK_PATH[i];
    const q = TRACK_PATH[j];
    const pn = normalAt(i);
    const qn = normalAt(j);
    const roadY = lerp(routeElevation(p[2]), routeElevation(q[2]), t) + 0.08;
    for (const ratio of [-1, -0.5, 0, 0.5, 1]) {
      const offset = ratio * ROAD_WIDTH / 2;
      const x = lerp(p[0] + pn.x * offset, q[0] + qn.x * offset, t);
      const z = lerp(p[1] + pn.z * offset, q[1] + qn.z * offset, t);
      values.push(roadY - sampleTerrainMeshY(x, z, cells));
    }
  }
  return values;
}
const roadClearanceCandidates = Object.fromEntries(
  [42, 56, 64, 72].map(cells => {
    const values = roadClearancesFor(cells);
    return [cells, { min: Math.min(...values), max: Math.max(...values) }];
  }),
);
const roadClearances = roadClearancesFor(56);
if (Math.min(...roadClearances) < 0) {
  throw new Error('road clips through rendered terrain: ' + JSON.stringify(roadClearanceCandidates));
}
if (Math.max(...roadClearances) > 1.15) {
  throw new Error('road floats too far above rendered terrain');
}

const first = simDrive(defaultDriveScript(360)).snapshot;
const second = simDrive(defaultDriveScript(360)).snapshot;
if (stableStringify(first) !== stableStringify(second)) {
  throw new Error('simDrive is not deterministic');
}

resetState();
applyInput({ throttle: 1, steer: 1, drift: 0 });
for (let i = 0; i < 8; i++) stepPhysics();
if (state.drift.entries !== 0) throw new Error('tap entered drift');

resetState();
for (let i = 0; i < 70; i++) {
  applyInput({ throttle: 1, steer: 0.8, drift: 1 });
  stepPhysics();
}
if (state.drift.entries < 1) throw new Error('drift did not enter');
const driftEntries = state.drift.entries;
for (let i = 0; i < 40; i++) {
  applyInput({ throttle: 1, steer: 0, drift: 0 });
  stepPhysics();
}
if (state.drift.phase === 'drifting') throw new Error('drift did not recover');

resetState();
const preJump = pointAtS(JUMP_S - 0.1);
state.car.x = preJump.x;
state.car.y = surfaceHeight(preJump.x, preJump.z);
state.car.z = preJump.z;
state.car.yaw = preJump.heading;
state.car.vx = Math.cos(preJump.heading) * 30;
state.car.vz = Math.sin(preJump.heading) * 30;
state.car.speed = 30;
state.lastTrackS = JUMP_S - 0.1;
applyInput({ throttle: 1, steer: 0, drift: 0, jump: 0 });
for (let i = 0; i < 8; i++) stepPhysics();
if (state.vertical.jumps !== 0 || !state.vertical.grounded) {
  throw new Error('route ramp auto-launched without player input');
}

resetState();
state.car.vx = Math.cos(state.car.yaw) * 20;
state.car.vz = Math.sin(state.car.yaw) * 20;
state.car.speed = 20;
const fuelBeforeJump = state.fuel;
applyInput({ throttle: 1, steer: 0.55, drift: 0, jump: 1 });
stepPhysics();
if (state.vertical.jumps !== 1 || state.vertical.grounded) {
  throw new Error('manual J input did not launch');
}
applyInput({ throttle: 1, steer: 0.55, drift: 0, jump: 1 });
let jumpPeak = state.vertical.y;
for (let i = 0; i < 120; i++) {
  stepPhysics();
  jumpPeak = Math.max(jumpPeak, state.vertical.y);
  if (state.vertical.grounded) break;
}
if (state.vertical.landings !== 1 || !state.vertical.grounded) {
  throw new Error('manual jump did not land');
}
for (let i = 0; i < 8; i++) stepPhysics();
if (state.vertical.jumps !== 1) {
  throw new Error('held jump retriggered without a new press edge');
}
if (!(state.vertical.airFuelUsed > 0 && state.fuel < fuelBeforeJump)) {
  throw new Error('air control did not spend fuel');
}
const jumpLandings = state.vertical.landings;
const jumpDistance = state.vertical.lastDistance;
const airFuelUsed = state.vertical.airFuelUsed;

resetState();
const overlappingProps = checkPropOverlap();
if (overlappingProps.length) {
  throw new Error('props overlap the road: ' + overlappingProps.join(','));
}

const item = state.items[0];
state.car.x = item.x;
state.car.z = item.z;
stepPhysics();
const nuts = state.nuts;
for (let i = 0; i < 20; i++) stepPhysics();
if (state.nuts !== nuts) throw new Error('NUT respawned');

console.log(JSON.stringify({
  pass: true,
  elevationMin: Math.min(...heights),
  elevationMax: Math.max(...heights),
  maxSampleStep: Math.max(...deltas),
  jumpElevation: routeElevation(JUMP_S),
  terrainTriangles: terrain.length / 9,
  roadTriangles: road.length / 9,
  stripeTriangles: stripes.length / 9,
  roadClearanceMin: Math.min(...roadClearances),
  roadClearanceMax: Math.max(...roadClearances),
  roadClearanceCandidates,
  deterministic: true,
  driftEntries,
  manualJump: true,
  automaticRampLaunch: false,
  jumpPeak,
  jumpDistance,
  jumpLandings,
  airFuelUsed,
  overlappingProps: overlappingProps.length,
  nuts,
}, null, 2));
`;

new vm.Script(source + '\n' + tests, {
  filename: 'travel-elevation-harness.js',
}).runInNewContext({
  console,
  performance: { now: () => 0 },
  URLSearchParams,
  location: { search: '' },
  window: {},
});
