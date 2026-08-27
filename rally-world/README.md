# RALLY WORLD — codexLuna product travel slice

Published product-development prototype for the RALLY WORLD lane.

## Play

Open `index.html` through GitHub Pages. The runtime is an original direct-WebGL implementation and loads the two local GLB files beside it.

Controls:

- `WASD` / arrow keys: drive
- `Space`: deliberate clutch drift
- `J` or the on-screen `JUMP` button: player-triggered jump
- Airborne `W/S`: pitch
- Airborne `A/D`: yaw
- Airborne `Space + A/D`: roll
- `Z/X` or mouse wheel: camera distance
- `C`: photo orbit

The route ramp amplifies only a jump chosen by the player. It never launches the vehicle automatically. Active air control consumes fuel.

## Status

This is a verified product-development prototype, not a Steam-ready build and not a claim of parity with Mario Kart World. The frozen competition artifact is not included or modified by this release.

## Verification

- Fixed 60 Hz simulation
- T1–T7 self-QA from the page controls
- `?bench=1` deterministic benchmark
- `verification/verify_travel_elevation.js` for terrain, drift, manual jump, air-fuel, overlap, and non-respawning NUT checks
- Blender verification scripts for the authored KART and scenery GLBs

See `PROVENANCE.md`, `docs/`, and `source/` for provenance, design boundaries, and editable source artifacts.

## License

Original runtime code is released under the included MIT license. Asset provenance and reference-only sources are recorded in `PROVENANCE.md`.
