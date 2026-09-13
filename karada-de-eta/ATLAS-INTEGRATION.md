# Body Atlas integration — first slice

Extends the existing `karada-de-eta/index.html`, preserving the kata layer and original exercise route. New entry: `atlas.html`.

## Experience

- Existing 467-structure muscle model and optional skeleton are embedded, with region selection and muscle-name return.
- Eight navigation topics connect structural context, primary-source knowledge cards, and optional personal records.
- Organ and nerve geometry is NOT present. Topic highlighting only indicates a muscle region and never a disease location.
- The public bundle contains no personal records. A local JSON is read into memory. No upload, storage or automatic hospital access. Parent CSP disallows connections; only topic group IDs go to the model frame. Clear and pagehide remove personal records.
- Records retain provenance, evidence status, date, units and multiple observations. Missing data stays explicit. No health score, inferred diagnosis or treatment recommendation.

## Record contract

`schema: body-records/v1`, `records` array (max 1000, max file 2 MiB).
Each record requires unique string `id`, `title`, `date`, `source`, `evidence`, nonempty `topics` array.
Topics: `all`, `nervous`, `circulation`, `metabolism`, `kidney`, `movement`, `immune`, `eye`.
Optional `note` string; `series` array (max 100) with string `date`, `value`, `unit`.
Unknown dates may be labelled as such and appear after dated records. Topic assignment is navigational, not causal attribution.
No file URLs in imported content are automatically followed; text is rendered with textContent.

## Existing sources and limits

- Canonical code: osakenpiro/osakenpiro.github.io / karada-de-eta; not a separate karada repo.
- Historical verification: claude-shared/handoffs/2026-08-02-cow-karada-kata-layer.md.
- Human Body Atlas: osakenpiro/claude-shared issue #233. Public knowledge and personal observation remain separate source types, joined only in the display.
- BODY-CAPITAL continuation exists in the user's task system; this document does not replace it.
- Mechanism sources: OpenStax Anatomy and Physiology 2e §1.5; NIH/NIDDK Your Kidneys & How They Work; NIH/NIDDK Your Digestive System & How it Works. Short original summaries, sources linked in UI; no extracted figures.
- Existing BodyParts3D / Z-Anatomy / BodyExplorer attribution remains in the frame.

## Remaining scope

Authenticated cross-device record storage, full organ meshes, a richer atlas specimen catalogue and automated clinical record collection are future tranches. The present JSON can be re-opened on another device but is not synchronized by this viewer.
