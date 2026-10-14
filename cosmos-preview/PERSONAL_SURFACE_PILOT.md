# 僕の惑星 Personal Surface — bounded pilot

This branch is a **candidate-only pilot** for Issue #1.

## Goal

Prove that URLs born in repos / RETURNs / deploys can become retrievable without creating a second Registry or changing canonical URLs.

## Truth boundary

- 成果物DB / ありか台帳 remains SoT.
- `discovery-candidates.json` is not canonical.
- Candidate detection does not promote, publish, migrate, merge, or delete anything.
- Public/private/unlisted boundaries remain unchanged.
- Production `/cosmos/` and root `/` are untouched.

## Pilot fixtures

FINEPLAY, Okinawa Mahjong launcher/learn/helper, mahjong-keikoba, MH fatalis-roadmap/hunting-dictionary/equipment-wishlist, STORIES.

## Personal state contract

Browser-local only:

- recent: last opened candidate IDs
- favorite: user-selected candidate IDs
- pin: user-selected IDs for quick access

These are personal UI preferences, not artifact status and not SoT.

## Acceptance

1. Candidate URL can be found without returning to chat history.
2. Search can find both existing catalogue items and discovery candidates.
3. Recent/favorite/pin do not mutate canonical metadata.
4. Deep links remain distinguishable from canonical candidates.
5. Mobile retrieval is 1–2 taps after entering the Personal Surface.
6. No production URL replacement or bulk migration.

## Current tranche

This commit only introduces the bounded discovery fixture and contract. UI wiring is the next finite implementation step on this branch.
