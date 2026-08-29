# Codex visual-review handoff

Target: this `/baticon/` site. Do not redesign from scratch.

Read in order:

1. `DESIGN_RONDO.md`
2. `index.html`
3. `review/desktop.png` and `review/mobile.png` if present

Run `python tests/visual_smoke.py` first.

Review categories:

- MUST: broken interaction, overflow, unreadable contrast, factual mismatch, keyboard failure
- SHOULD: hierarchy, mobile density, section rhythm, meaningful motion
- IMO: optional polish only
- NIT: tiny cleanup
- Q: missing decision; do not guess

Hard boundaries:

- Preserve the selected “Kumasan Industrial Field Board” concept.
- Do not introduce generic glassmorphism, SaaS cards, pastel gradients, or a component-library look.
- Do not import Nintendo logos, screenshots, characters, or other copyrighted image assets.
- Keep 30-second usability and reduced-motion behavior.
- 250 is a strategy target, not a guaranteed gold cutoff.

Deliver:

1. concise review with evidence
2. targeted patch
3. desktop + 390px screenshots
4. test results
