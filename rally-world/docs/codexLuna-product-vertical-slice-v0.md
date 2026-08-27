# codexLuna Product Vertical Slice v0

Status: GO / playable travel slice with authored assets, traversable high-relief terrain, normals-based lighting, speed presentation, ghost replay, drift, jump, and vehicle-pose logic verified
Artifact class: product-development brief, not the competition QA contract

## Objective

Build a ten-second playable slice that communicates a premium stylized road-trip rally game at a Steam store-image level:

1. Enter one original vehicle from the canonical five-vehicle roster.
2. Drive through a readable countryside route.
3. See a destination, landmark, and road continuation.
4. Feel acceleration, grip, deliberate clutch drift, tire contact, and camera distance.
5. Stop on a frame that could become a store screenshot.

## Scope boundary

The existing `codexLuna-v0_1-3d.html` remains the frozen competition and machine-QA artifact. This product slice is a separate art and packaging track. It does not change the competition score axes, `TRACK_SEGS`, `window.__RW`, NUT rules, or the non-deployment rule.

## Canonical product roster

The product roster is `KART-01`, `PLANE-01`, `TRUCK-01`, `BOAT-01`, and `TRAIN-01`. The competition contract still uses one vehicle for its comparable vertical slice; the roster is a product-track expansion and must not be used to rewrite the competition QA scope. See `codexLuna-product-vehicle-roster-v0.md` for terrain roles, feel targets, and asset gates.

## Art direction lock

The approved impression is a premium handcrafted miniature road-trip world: warm cream and burnt-orange field-scout wagon, charcoal protection and tires, deep teal glass, restrained gold details, soft late-afternoon light, long contact shadows, and a wide road leading toward a lived-in horizon.

Primary concept references:

- `codexLuna-product-key-art-v0.png`
- `codexLuna-product-vehicle-turnaround-v0.png`

These are visual direction references, not production meshes and not a license to copy any existing vehicle.

## Vertical-slice content

- One original hero vehicle selected from the canonical roster. `FIELD SCOUT // FS-01` remains a preserved earlier art-direction experiment, not a canonical roster entry yet.
- One 500–800m travel route with a 0–30m authored elevation profile, start overlook, village edge, roadside rest stop, and visible distant destination.
- Three authored landmarks: route marker, rest structure, and destination silhouette.
- One chase camera, one photo camera, and continuous 14–58m distance control.
- Throttle, steering, brake, deliberate clutch drift, reset, one collectible loop, and a player-triggered route jump (`J`) with fixed gravity / landing. A ramp amplifies a jump the player chose; it never launches the vehicle automatically. Airborne steering supports pitch, yaw, and roll and spends fuel.
- Product feedback motion: visible drift tire marks and dust, velocity-based slip angle, body roll, squash on drift/impact, and stretch while airborne.
- Minimal HUD with speed, time, drift state, assets, camera distance, and restart.
- Engine, tire, drift, pickup, and UI confirmation sounds before a product-quality claim.

## Product quality gates

| Gate | Pass condition |
| --- | --- |
| V1 silhouette | The car is identifiable at thumbnail size from front three-quarter and side views. |
| V2 body integrity | No disconnected cabin, floating roof parts, embedded wheels, or visible primitive assembly. |
| V3 contact | All four tires have readable sidewalls, hubs, wheel wells, and believable road contact in chase and photo views. |
| V4 material | Paint, glass, rubber, protection, metal, and lamps read as different materials under the same light. |
| V5 world | No debug beams or placeholder props in the hero camera; every large object has a travel or navigation role. |
| V6 feel | Acceleration, grip, drift entry/recovery, jump launch/landing, vehicle pose, camera distance, and reset are understandable without explanation. |
| V7 capture | Three clean screenshots and one short capture communicate the game without QA HUD or debug text. |
| V8 runtime | Product build has no console errors, stable frame pacing on target hardware, and a reproducible offline build. |

## Workflow

1. Freeze the key-art and turnaround direction.
2. Author the original vehicle in a real 3D package and export GLB.
3. Integrate the GLB without changing the physics contract.
4. Replace placeholder environment pieces with authored landmarks.
5. Add materials, lighting, sound, camera composition, and capture mode.
6. Run independent art review and machine regression.
7. Human gate: the owner decides whether the result is interesting enough to continue.

## Current status

Blender 5.1.2 is available and the canonical five-vehicle roster now has authored GLB LOD0/1/2 files plus editable .blend sources. codexLuna-product-garage-v0.html loads all five LOD0 assets locally. codexLuna-product-travel-v0.html mounts KART-01_LOD0.glb and OPEN-FIELD-SCENERY-01_LOD0.glb into the open-field route, with procedural fallback while assets load. The renderer now expands face normals for both GLB and procedural meshes, applies a warm directional/cel light, blends contact shadows correctly, and preserves transparent ghost replay. The product pass adds a 0–30m closed elevation profile, a 56×56 traversable terrain mesh, elevated road ribbons, and one shared drive-surface function for the car, camera, NUTs, drift marks, off-road dust, and ghost replay. The rejected first drift presentation has been replaced by restrained chassis roll, named-node front-wheel steering, velocity-framed chase camera, continuous twin tire paths, edge-only speed streaks, and no paved-road dust spheres. Terrain and road shaders now carry deterministic material variation; conical placeholder mountains were removed; roadside reflectors, mixed broadleaf/conifer forms, house doors/windows, and compound rocks improve travel density. Route map, HUD-free capture mode, 14–58m camera range, offline Web Audio, clutch-latched drift, deterministic jump, vehicle slip, and restrained squash/stretch remain active.

## High-relief terrain verification — 2026-08-26

- `verify_travel_elevation.js` PASS: closed and continuous 0–30m route profile, 6,272 terrain triangles, 256 road triangles, and 160 stripe triangles.
- The same harness checks the rendered terrain mesh rather than only the height formula. Across 5,120 road samples, clearance is 0.023–1.119m, so the road no longer clips through the triangulated ground.
- Car, camera target, collectibles, ghost, drift marks, and dust use `surfaceHeight`; scenery and the terrain mesh use `terrainHeight`. This separation fixes the prior wheel/item sinking risk on the raised road.
- Deterministic `simDrive`, tap non-entry, deliberate drift entry/recovery, player-triggered jump/landing, held-key edge gating, airborne fuel consumption, and NUT non-respawn all pass.
- Blender 5.1.2 verification scripts for KART-01, OPEN-FIELD-SCENERY-01, and the remaining canonical vehicles all exit 0.
- The earlier local-browser reload blocker was cleared on 2026-08-27; current visual, WebGL-error, and T5 evidence is recorded in the following rebuild section.

## Drift and visual-language rebuild — 2026-08-27

- Owner review rejected the previous drift as visually cheap. The independent screenshot review agreed: excessive roll, spherical dust clumps, central radial streaks, single-color terrain, and giant pyramid/cone silhouettes were the dominant causes.
- KART-01 GLB node names now drive the two front tire/hub assemblies independently. Steering is limited to a restrained 0.27rad maximum while the whole vehicle remains on one coherent pose root.
- Drift marks are connected from prior to current rear-wheel contact points instead of stamped as unrelated bars. Paved-road particle spheres were removed; warm dust remains off-road only.
- The camera follows a bounded blend of heading and velocity during drift, with at most 0.022rad screen roll. The vehicle body roll is capped at 0.045rad.
- Fresh browser evidence on the final pass: T1-T7 PASS; live display 60 FPS, 16.9ms worst frame, zero frames over 33ms; synchronous regression bench PASS at 1135.72 simulated FPS, 3.4ms maximum, zero frames over 33ms; no console warnings or errors.
- Visual verdict: materially cleaner and more coherent than the rejected pass, but still a polished prototype rather than Steam-ready art. Production vegetation/architecture meshes, authored terrain materials, sky/weather, final lighting, and stronger destination composition remain required.

## Manual jump and Blender coordinate correction — 2026-08-27

- The broader RALLY WORLD project brief, especially document 49, is authoritative for product control design: jump is a deliberate player choice that spends time to pursue assets; a ramp presents a chain-or-trick decision. The narrower competition v0 did not specify jumping and is not the product-design ceiling.
- `J` and the visible `JUMP` action now trigger a rising-edge jump. Holding the input cannot retrigger it. Crossing a ramp without jump input remains grounded; choosing jump on a ramp multiplies the launch by 1.22.
- Default launch velocity is 7.4m/s, gravity is 16m/s², and airborne control is 0.75. `A/D` yaw, `W/S` pitch, and `Space + A/D` roll; active air control consumes fuel at 2.4%/s. No landing reward or NUT rule was invented.
- The pure Node regression records automatic ramp launch `false`, manual jump `true`, 1.65m peak, 18.180m distance at 20m/s, one landing, 2.2% air fuel spent, deterministic replay, zero prop/road overlaps, and NUT non-respawn.
- The Blender scenery exporter previously confused game Y-up coordinates with Blender Z-up coordinates. Authored world positions and dimensions are now converted explicitly, removing floating/crossing structures. Giant start beams were replaced by low roadside pylons, and cone mountains by irregular terraced ridges.
- The quality target is first-impression and control-readability parity with Mario Kart World, while preserving RALLY WORLD's own open-world travel, asynchronous traces, and time-versus-assets thesis. The current browser slice is not at that parity and is not Steam-ready: production terrain/vegetation/architecture, sky/weather, texture/material, lighting/post-processing, sound, rival staging, and a native-PC rendering tier remain blocking work.

## Rondo visual benchmark pass — 2026-08-26

The comparison surface was the user's own Raindrop `ゲーム用` collection. The selected rally-direction bookmark demonstrated five principles acting together: one coherent cel-art language, strong terrain relief, persistent velocity communication, visible race context, and HUD treatment as part of the artwork. This pass transfers those principles only; it does not reuse the reference's meshes, colors, UI, names, code, or other protected identity.

The product build is materially closer, but it is not yet approved as Steam-ready or as the final “おおおおおお” gate. The remaining largest gaps are authored terrain/vegetation/architecture materials and meshes, production sky/weather and lighting, production audio/music, rival staging beyond one ghost replay, and a final store-capture/art-direction pass across multiple biomes.

## Reference principles

The design borrows principles, not protected identity: front-face grammar and wheel-arch readability from compact off-road products; functional fender and vent language from rally sedans; high-sidewall stance, protective sills, towing points, and disciplined two-tone accents from rally-raid products.
