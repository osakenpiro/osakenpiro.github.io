# Product entry check — a shared link must stand on its own

An introduction message may invite someone. It must not supply missing operating instructions.

For a product being introduced or re-introduced to other people, test the shared entry with **no chat history, no invitation prose and no verbal briefing**. Preserve the product's visual identity while removing the dependency on its sender.

## Acceptance

| Check | Required evidence |
|---|---|
| Understand | The entry explains what the product is for, who does what and what the primary action does. |
| Start | Prerequisites and important limitations appear before they matter. No unmentioned account, role change or setup is needed. |
| Try when needed | An existing tutorial/demo reaches a meaningful result rather than stopping at a screen preview. It clearly distinguishes practice behavior from real use. |
| Continue | The result leads to the real task, replay or the appropriate next action. The sender does not have to provide a hidden link. |
| Recover | Wrong input, cancellation and restart have a visible recovery route. |
| Stay current | App, entry, demo and the instructions that teach changed behavior agree on labels, paths and limitations. |

The test is a **cold entry**, not a tap-count target. Keep inputs and confirmations that are necessary for correctness, privacy or consent. Do not remove required facts to claim fewer taps.

## Proportionality

This is not a mandatory seven-page package. A direct utility can explain itself in the tool; a game may need a playable tutorial; a private prototype may not need a public LP. Include only the surfaces needed for the intended audience and release stage. Do not require a tutorial for every tool or retrofit all old projects automatically.

Creator checks and audience onboarding may reuse the same demo, but their explanations should not be mixed. A creator-only check can be folded away below the audience's primary path.

## Minimal record

Use the existing Creative Output Pack manifest as an index. Add optional pointers to this contract and the work's evidence; do not create another lifecycle, queue or status registry.

```yaml
entry_contract_ref: /output-pack/product-entry-check.md
entry_acceptance_ref: <work-local report with exact tested version>
```

A work's evidence should name: audience, shared URL, expected task, affected surfaces, version, test environment, tested paths, result and remaining checks. Distinguish source-only inspection, offline UI interaction, public rendering, live interaction and real-user adoption. A deployment receipt is not an interaction test.

## First implementation specimen: FINEPLAY

The friend-facing entry contains the value, roles, practice links, group setup and host-tab limitation. Existing questioner and presenter demos now use a scripted partner, let the player reach an answer/result and provide an exit to the real-room entry. Practice explicitly says that real play uses human questions and answers. The original free role-switching sandbox remains available as a creator check.

- Entry: https://osakenpiro.github.io/fineplay/home/
- Questioner: https://osakenpiro.github.io/fineplay/?demo=1&role=asker
- Presenter: https://osakenpiro.github.io/fineplay/?demo=1&role=genie

This contract is an owner-requested acceptance requirement. It is **not** a claim that a controlled cross-product study has proved improved retention, nor that every existing product has already passed it.
