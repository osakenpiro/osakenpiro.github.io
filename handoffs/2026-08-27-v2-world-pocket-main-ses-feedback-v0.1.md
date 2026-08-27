# osakenpiro.github.io V2 / WORLD–POCKET — Main SES Feedback Pack v0.1

**Status:** READY FOR MAIN SES INGESTION  
**Date:** 2026-08-27  
**Source branch:** `v2-central-feedback-2026-08-27`  
**Observed base:** `main@36cf4498dddce942633703b6cf66a2675768ba26`  
**Parent tracking:** GitHub Issue #1 `[V2] osakenpiro.github.io — WORLD / POCKET 大改修プロジェクト`  
**Authority:** candidate feedback only. This pack does **not** mutate Canonical, SoT, production URL structure, or public deployment.

---

## 0. Trigger / purpose

The sub-SES was asked to advance a major V2 redesign of `osakenpiro.github.io`, focusing on:

- public / private boundaries
- extensibility
- updateability
- readability
- HTML expression
- graphics / visual system
- mobile / personal-use access

Initial working hypothesis in Issue #1 proposed:

- `WORLD` = public-facing surface
- `POCKET` = personal/daily-use surface
- a new Registry-first architecture
- a new `/v2/`-oriented implementation direction
- Astro + TypeScript + Vite as first stack candidate

Repository archaeology materially changed that hypothesis. The main feedback is therefore a **design correction / dedup result**, not merely a new idea.

---

# 1. CURRENT CHECK

## 1.1 Purpose

Determine whether V2 requires a new architecture, or whether the requested capabilities should be expressed as extensions / views over the existing Visionium / Re:DeSign ecosystem.

## 1.2 Current observed state

The repository is not a single monolithic website. It is already a large artifact ecosystem with multiple generated views and prior Re:DeSign work.

Observed components include:

- current root `index.html` (`全部がぼく`)
- `works/` complete catalog
- `dd/` Design Dashboard
- `re-design/queue-dashboard.html`
- `tanaoroshi/` inventory / reconciliation view
- `ecosystem/` and `ecosystem/topology.html`
- `status/`
- `sitemap.xml` / `robots.txt`
- legacy / prior `v2/` lineage
- many independent app / work / experiment directories
- `_proto`, `_tmp`, `atelier`, lane artifacts, etc.

The strongest architectural observation is that an existing artifact database (`成果物DB / ありか台帳`) already functions as a SoT for generated presentation layers.

## 1.3 What changed during this sub-SES

### Previous working claim

> V2 should create a new Registry and make WORLD / POCKET consume it.

### Evidence-bearing correction

> A new Registry would duplicate the existing `ありか台帳` SoT. V2 should instead propose a **schema / contract extension over the existing SoT**, with WORLD / POCKET implemented as derived surfaces.

### Previous working claim

> V2 can occupy `/v2/` as its natural implementation namespace.

### Evidence-bearing correction

> `/v2/` already contains a prior LP / design-system lineage (`colors_and_type.css`, `lp/`, variants). The namespace is already historically meaningful and must not be silently overwritten.

### Previous working claim

> `public / unlisted / private` is a sufficient visibility model.

### Evidence-bearing correction

> Existing design intentionally exposes some `本人用` instruments publicly while lowering their entry-point rank. Therefore **intended audience, access boundary, and discoverability are separate dimensions**. `personal-use != private`; `unlisted != private`.

## 1.4 Progress

- Repository-level archaeology: sufficient for architecture feedback.
- Existing SoT / derived-view pattern: confirmed.
- Existing V2 namespace collision: confirmed.
- Existing design-token lineage: confirmed.
- Existing public/internal reconciliation lineage: confirmed.
- Existing duplicate / multi-surface artifact cases: confirmed.
- Candidate diffs suitable for Central Selection: identified below.

## 1.5 Blockers / unknowns

1. The actual Notion `成果物DB / ありか台帳` property schema was not directly inspected in this sub-SES. Generated projections reveal some fields/semantics, but exact property names and existing relation fields must be verified before any schema mutation.
2. No framework comparison prototype has yet demonstrated that Astro (or another build layer) improves the system without duplicating SoT or breaking stable URLs.
3. Existing global relation schemas outside this repo must be deduplicated before introducing an artifact-specific relation vocabulary.
4. `POCKET` is already used as a visual metaphor in the current root UI, so naming must be selected deliberately before it becomes an architecture term.

## 1.6 Drift check

No Canonical integration was performed. No production page was replaced. No SoT was created. No existing data was migrated. The early Issue #1 charter remains preserved as the previous hypothesis.

## 1.7 Next gate

Central SES should run:

`Recovery → Classification → Dedup → Boundary / Conflict Review → Selection → Inheritance`

on the candidate diffs below.

---

# 2. OBSERVATION / SOURCE LEDGER

This section intentionally separates observation from interpretation.

## O-01 — Existing SoT-driven queue view

**Source:** `re-design/queue-dashboard.html`

Observed text:

- `成果物DB(ありか台帳)→自動生成(ζ型)`
- `gen_queue.py · DB=正本/本頁=表示層`
- generated 2026-08-27 07:20 JST
- Live 180 / rated 51 / unrated 129 / unpromoted 169 / WIP 2 / other 2

The page also exposes generated columns such as pillar, type, state, completion Float, edit-neglect and promotion state.

## O-02 — Complete catalog is already a generated view

**Source:** `works/index.html`

Observed description:

- `全成果物184点の完全索引。玄関は精選、ここは全部。`

The page groups artifacts using the existing pillar taxonomy rather than a simple URL-directory taxonomy.

## O-03 — SoT / view separation is an explicit architectural principle

**Source:** `ecosystem/topology.html`

Observed architecture:

- gold-framed items = SoT-class
- italic items = display layer
- `情報は一箇所に1つ、各層は様式を変えて取り出す`

This is an explicit existing contract, not a new V2 invention.

## O-04 — DD is another generated presentation surface

**Source:** `dd/index.html`, `dd/data.js`

Observed text:

- tools are generated from `成果物DB＝正本`
- root / works / DD are already treated as multiple presentation levels
- `dd/data.js` itself warns that generated tool data should be edited at the DB side, not by hand in the derived file

## O-05 — Prior Re:DeSign inventory already reconciles internal vs public

**Source:** `tanaoroshi/index.html`

Observed:

- `ReDes v1 · 2026-07-18`
- reconciles internal projects vs public HTTP entities
- explicitly says internal-only is not automatically an orphan
- identifies existing duplicates / polyhedra such as:
  - `/bakuun/` vs `/bakuun-scouter/`
  - multiple surfaces of the materials project
  - parent/child relation around `zukan3d`
  - duplicate exposure of cosmos / note
- states `非破壊の観測。公開デプロイは本人GATE。`

## O-06 — Discovery rank already exists

**Source:** `sitemap.xml`

Observed hierarchy:

- 1.0 L0 front door
- 0.9 L1 complete works catalog
- 0.8–0.7 L2 bundles
- 0.6 L3 outward windows
- 0.5 individual works
- 0.4 works manuals
- 0.1 instruments / self-use surfaces

The file explicitly preserves URLs rather than deleting them.

## O-07 — Personal-use does not mean private

**Source:** `robots.txt`

Observed policy:

- all paths are allowed
- self-use instruments remain public
- they are demoted as entry points rather than removed from search

Therefore use-purpose and confidentiality are demonstrably different dimensions in the current ecosystem.

## O-08 — Existing `/v2/` lineage

**Source:** `v2/`

Observed:

- `v2/colors_and_type.css`
- `v2/lp/`
- `data.js`
- several LP style / JSX variants

The design-token file identifies itself as an extracted `osakenpiro Design System` from 2026-04.

## O-09 — Current root already uses the `Pocket` metaphor

**Source:** root `index.html`

Observed:

- fixed `.pocket-cluster`
- Pocket button
- file-stack navigation inside the Pocket UI

Thus “POCKET” already has an established UI meaning before V2 uses it as a broader personal surface architecture term.

## O-10 — Multiple active visual lineages already coexist

**Sources:** root `index.html`, `v2/colors_and_type.css`, `works/index.html`

Observed examples:

- current root: light paper / grid / Mincho, coral–teal–purple–blue–gold
- prior V2 tokens: dark void / warm parchment / gold / celestial aura
- works: dark space / gold plus pillar mineral colors

V2 design work is therefore a lineage-reconciliation problem, not a blank-slate token-creation problem.

---

# 3. CLASSIFICATION

| ID | Finding | Classification |
|---|---|---|
| C-01 | New Registry concept overlaps `ありか台帳` | Dedup / Architecture correction |
| C-02 | WORLD / POCKET can be generated from SoT | Reusable Pattern candidate |
| C-03 | Audience, access, discovery are distinct | Reusable Schema / Rule candidate |
| C-04 | `/v2/` already occupied | Boundary conflict |
| C-05 | `POCKET` already a UI metaphor | Naming / semantic conflict |
| C-06 | New design-token work overlaps prior token systems | Dedup / inheritance candidate |
| C-07 | New inventory generator overlaps existing generated views | Dedup / implementation correction |
| C-08 | URL-directory IA could overwrite pillar + L-tier classifications | Boundary / taxonomy conflict |
| C-09 | Astro stack has no local proof yet | Experiment candidate, not Selection-ready architecture |
| C-10 | Duplicate / multi-surface artifacts need explicit relations | Schema candidate, pending global dedup |

---

# 4. DEDUP RECORDS

## DEDUP-01 — New Registry vs `ありか台帳`

**Initial:** create `/registry/` and make it the new artifact index.  
**Existing:** `成果物DB / ありか台帳` is already SoT; queue, works and DD are derived views.  
**Recommendation:** **MERGE / SUPERSEDE initial claim.** No second registry SoT.

## DEDUP-02 — New inventory system vs Re:DeSign views

**Initial:** build repo inventory generator, orphan detector and duplicate detector as V2 foundation.  
**Existing:** `tanaoroshi`, `works`, `queue-dashboard`, sitemap generation and existing DB-derived views already cover substantial inventory duties.  
**Recommendation:** **EXTEND existing generator / audit pipeline**, do not create another independent catalog.

## DEDUP-03 — New design system vs existing tokens

**Initial:** create V2 design tokens from scratch.  
**Existing:** prior `v2/colors_and_type.css`, current-root tokens, and works/pillar visual grammar exist.  
**Recommendation:** **INHERIT + reconcile lineage.** New work should define a semantic layer / theme relationship only after visual comparison.

## DEDUP-04 — Public/private model vs prior internal/public reconciliation

**Initial:** public / unlisted / private enum.  
**Existing:** ReDes already distinguishes internal-only from public entities; robots/sitemap distinguish self-use from entrance rank.  
**Recommendation:** **REFINE**, not replace. Split dimensions rather than adding another Boolean-like field.

---

# 5. BOUNDARY / CONFLICT REVIEW

## BC-01 — `/v2/` namespace collision

`/v2/` is a prior design / LP lineage. Reusing the path for the new architecture would erase trajectory and make old V2 artifacts ambiguous.

**Boundary:** new architecture name/version may not silently claim `/v2/`.

## BC-02 — `POCKET` semantic collision

Current root already uses Pocket as a compact navigation UI. The new proposal uses POCKET to mean a personal / daily-use surface.

**Boundary:** Central must decide whether this is intentional inheritance or whether architecture should use a distinct internal name such as `personal_surface` while preserving “Pocket” as the user-facing metaphor.

## BC-03 — Directory taxonomy vs existing ontology

The early charter proposed `/apps/`, `/games/`, `/research/`, `/works/`, etc. But current classification already uses pillar taxonomy, type, state, and L0–L3 discovery rank across stable URLs.

**Boundary:** directory path must not become the new authority for classification. URL location and conceptual classification should remain separable.

## BC-04 — Private data on GitHub Pages

A GitHub Pages path is not private merely because navigation omits it. Robots and sitemap are discovery mechanisms, not access control.

**Boundary:** restricted/private bytes must remain outside the public bundle or use a genuinely authenticated origin. `unlisted != private`.

## BC-05 — Personal-use vs confidential

Current self-use instruments are intentionally public and indexed at a low entry rank.

**Boundary:** `audience=self` must not imply `access=private`.

## BC-06 — Derived view authority

WORLD, POCKET, WORKS, DD, queue, sitemap, status, etc. are or can become generated views.

**Boundary:** aggregation / visualization must not silently become SoT merely because it is the easiest place to edit.

---

# 6. CANDIDATE DIFFS FOR CENTRAL SELECTION

## V2-D01 — Existing-SoT Extension, not New Registry

**Type:** Architecture correction / reusable rule  
**Recommendation:** **SELECT**

Proposed invariant:

> V2 SHALL NOT introduce a second artifact registry when `ありか台帳` already serves as SoT. WORLD / POCKET / WORKS / DD / queue / sitemap are derived surfaces or projections.

Expected implementation consequence:

- extend source schema only where necessary
- generate presentation surfaces from source data
- derived pages remain replaceable

## V2-D02 — Audience / Access / Discovery Separation

**Type:** Reusable Schema / Rule candidate  
**Recommendation:** **SELECT concept; field names require parent-schema check**

Proposed invariant:

> `intended audience`, `access boundary`, and `discoverability / entry rank` are orthogonal properties.

Why:

- a self-use instrument can be public
- an unlisted public URL is not private
- a public work can be excluded from the front door without becoming restricted

Candidate conceptual dimensions:

```yaml
audience:        # who the surface is designed for
access_boundary: # whether bytes may exist in public web bundle
discovery:       # front-door/catalog/deep/unlisted/index policy
```

Do **not** freeze these field names or enum values until the existing `ありか台帳` schema is recovered and deduplicated.

## V2-D03 — View-first WORLD / POCKET Architecture

**Type:** Reusable Pattern  
**Recommendation:** **SELECT**

Proposed pattern:

> WORLD and POCKET are views over the same governed artifact ecosystem, not competing databases and not necessarily new physical directory trees.

- WORLD optimizes public narrative / expression / discovery.
- POCKET optimizes self-use speed / recency / favorites / operational access.
- Both inherit SoT identity and lifecycle state.
- Existing stable artifact URLs remain canonical unless a separate migration decision is made.

## V2-D04 — Stable URL, Mutable View

**Type:** Reusable Rule  
**Recommendation:** **SELECT**

Proposed invariant:

> Reclassification or redesign should change how an artifact is surfaced before changing where it lives.

Rationale:

- existing sitemap explicitly preserves URLs
- current ecosystem already supports multiple views over the same artifacts
- path migration creates unnecessary breakage and authority ambiguity

## V2-D05 — Existing Generator Inheritance

**Type:** Implementation architecture correction  
**Recommendation:** **SELECT**

V2 foundation should extend the existing generation family rather than starting a parallel inventory stack.

Candidate outputs from the same SoT:

- WORLD index
- POCKET index
- WORKS
- DD
- queue
- sitemap
- policy / lint report

A new generator is acceptable only as an adapter in the same lineage, not as a second manually maintained truth.

## V2-D06 — Publication Boundary Guard

**Type:** Reusable Rule / lint candidate  
**Recommendation:** **SELECT**

Proposed invariant:

> Any artifact or metadata classified as restricted/private must be absent from the public GitHub Pages bundle. Hiding links, lowering sitemap priority, or robots directives are not access control.

Potential lint:

- fail build if restricted item is emitted into public output
- fail if a derived public metadata file contains fields not approved for its publication policy

## V2-D07 — Visual Lineage Reconciliation

**Type:** Design inheritance / experiment  
**Recommendation:** **PILOT, not Canonical yet**

Instead of inventing a blank-slate design system:

- recover current light-paper language
- recover prior dark/celestial token language
- recover pillar mineral accents
- classify tokens as semantic primitives vs surface themes
- prototype WORLD and POCKET with shared semantics but intentionally different density / atmosphere

Success criterion: recognizably one ecosystem without forcing every work to use one skin.

## V2-D08 — Build Layer Adapter Experiment

**Type:** Testable hypothesis  
**Recommendation:** **EXPERIMENT**

Hypothesis:

> A static build layer can generate WORLD / POCKET and policy reports from the existing SoT without migrating canonical content URLs or introducing duplicate data entry.

Astro + TypeScript + Vite remains one candidate, not a selected architecture.

Acceptance tests:

1. generated output remains static-first
2. no second source of artifact metadata
3. existing canonical work URLs need not move
4. one source edit updates multiple surfaces
5. policy lint can prevent restricted→public leakage
6. broken-link / orphan detection can run in CI
7. JS is optional for primary readable content

## V2-D09 — Artifact Relations Instead of Destructive Dedup

**Type:** Schema candidate  
**Recommendation:** **HOLD for Central/global relation-schema dedup**

Observed multi-surface cases show that duplicates are not always duplicates; some are variants, bundles, parent/child artifacts, external publications, or successor surfaces.

Candidate requirement:

> model artifact relationships before deleting / moving entities.

Potential relation semantics include variant / parent / published-as / supersedes / alias, but vocabulary must be deduplicated against any existing global relation schema before adoption.

---

# 7. SELECTION RECOMMENDATION

## SELECT

- V2-D01 Existing-SoT Extension
- V2-D02 Audience / Access / Discovery Separation — concept only
- V2-D03 View-first WORLD / POCKET
- V2-D04 Stable URL, Mutable View
- V2-D05 Existing Generator Inheritance
- V2-D06 Publication Boundary Guard

## PILOT / EXPERIMENT

- V2-D07 Visual Lineage Reconciliation
- V2-D08 Build Layer Adapter Experiment

## HOLD / DEDUP FIRST

- V2-D09 Artifact Relations vocabulary
- final names / enum values for publication schema fields
- final architecture codename / path namespace
- whether `Pocket` remains the architecture name or only UI metaphor

---

# 8. REJECTED / SUPERSEDED / DOWNGRADED CLAIMS

Preserve these as trajectory; do not silently delete them from Issue #1.

## SUPERSEDED

### S-01
`Create a new Registry as V2 SoT.`

→ superseded by existing `ありか台帳` SoT evidence.

### S-02
`Use /registry/ as a primary V2 architecture component.`

→ no longer recommended as a new authority. A derived registry/API projection may still exist if useful.

### S-03
`public / unlisted / private is the primary one-dimensional visibility model.`

→ superseded by orthogonal audience/access/discovery model.

## DOWNGRADED TO EXPERIMENT

### S-04
`Astro + TypeScript + Vite is the V2 technical direction.`

→ framework choice is not yet evidence-backed. Keep as adapter prototype candidate.

### S-05
`Create new V2 design tokens.`

→ existing token lineages must be inherited / reconciled first.

## CONFLICT / UNRESOLVED

### S-06
`Use /v2/ namespace for new implementation.`

→ conflicts with prior V2 lineage.

### S-07
`POCKET is an unambiguous new architecture term.`

→ collides with existing Pocket UI metaphor.

### S-08
`Move artifacts into /apps/, /games/, /research/, etc.`

→ risks coupling URL structure to classification and overwriting existing pillar / L-tier ontology. No migration recommendation at this stage.

---

# 9. INHERITANCE TARGETS

If selected by Central SES:

## Existing SoT / generators

Inherit into:

- artifact source schema / `ありか台帳`
- generators that already derive WORKS / DD / queue / sitemap
- future WORLD / POCKET generators

## Publication boundary rule

Potentially reusable beyond this website wherever a system distinguishes:

- designed audience
- access control
- discoverability

## Stable URL / mutable view rule

Reusable for other static-site / knowledge-base migrations where classification evolves faster than storage paths.

## Visual lineage result

Inherit only after pilot evidence. Do not freeze a single aesthetic prematurely.

---

# 10. NON-INHERITANCE / WHY

Do not inherit yet:

- Astro as mandatory stack — no local comparative proof
- new `/v2/` namespace — existing lineage conflict
- exact relation vocabulary — global dedup required
- exact schema field names — existing SoT schema not directly recovered
- bulk URL migration — no demonstrated necessity
- a second registry / second inventory truth — violates existing SoT contract

---

# 11. PROPOSED NEXT GATE AFTER CENTRAL SELECTION

If D01–D06 are selected, return to sub-SES with a bounded **Foundation Pilot**:

1. recover exact current `ありか台帳` schema
2. produce a schema-diff proposal only
3. select 5–10 representative artifacts covering:
   - public audience / public access
   - self-use / public access
   - internal-only
   - duplicate / variant
   - external publication
4. generate a minimal WORLD view and personal-surface view from the same source export
5. run publication-boundary lint
6. verify no existing URL migration is needed
7. compare visual inheritance options
8. return pilot evidence to Central SES before any architecture FREEZE

Suggested pilot success statement:

> One governed artifact record can drive multiple public/personal presentation surfaces without duplicating truth, confusing access with discoverability, or breaking stable URLs.

---

# 12. HANDOFF SUMMARY

The V2 exploration produced a material architecture correction:

> **The missing layer is not another website registry. It is a stronger contract between the existing SoT and multiple surfaces.**

A useful compression is:

```text
ありか台帳 / existing SoT
        │
        ├── identity / lifecycle / relations
        ├── audience / access / discovery policy
        │
        └── generated projections
              ├── WORLD      public narrative surface
              ├── POCKET     personal-use surface
              ├── WORKS      complete catalog
              ├── DD         designed dashboard
              ├── QUEUE      operational maintenance view
              └── SITEMAP    discovery projection
```

The key reusable rule candidate is:

> **Audience != Access != Discoverability.**

The key architecture correction is:

> **WORLD / POCKET should be views over the existing source of truth, not new sources of truth.**

**READY FOR MAIN SES INGESTION.**
