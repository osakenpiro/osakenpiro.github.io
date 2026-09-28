# FINEPLAY LP→Tutorial R2 — introduction without a briefing

## Delivered

- Share entry: https://osakenpiro.github.io/fineplay/home/
- Questioner practice: https://osakenpiro.github.io/fineplay/?demo=1&role=asker
- Presenter practice: https://osakenpiro.github.io/fineplay/?demo=1&role=genie
- Real-room entry: https://osakenpiro.github.io/fineplay/

The introduction message is optional. The LP itself explains the game, both roles, practice versus real play, group setup, room invitation and the host-tab limitation. Creator-only checks and the copyable introduction are folded below the audience's primary path.

## BEFORE → AFTER

| Surface | Before | After |
|---|---|---|
| LP | Several role/test links and creator-release explanation mixed into onboarding | Primary questioner practice, explicit role explanation, real group setup and a separate folded creator check |
| Questioner demo | Player submits a question, then must switch into the answering role | A clearly labelled scripted partner answers practice questions; the player can declare an answer, recover from a wrong answer and reach a result |
| Presenter demo | Repeated sample questions with result reached through a separate control | Three scripted questions lead to an answer declaration and actual correct/incorrect judgement |
| Result | Demo controls do not finish the audience's next step | Real-room entry, other-role practice and group setup are directly linked |
| Guide | Teaches manual role switching for the role demo | Describes the current guided flow; the original free sandbox is separately labelled |

Practice deliberately uses sample questions and a scripted partner, not AI interpretation of arbitrary text. Real play retains human free questions and human responses; question memos are optional. The original free role-switching sandbox remains available for self-checks.

## Code and publication

Release snapshot: `3e12dbfac11650335ff3ab277bcc993280dbb864`.
GitHub Pages run **36416570843**: completed / success.
Deployed artifact **10967595940** was downloaded through the GitHub connector and its FINEPLAY files were checked against the tested files.

Changes:
- tutorial.js: `12c8852bf8d02a56371f0badf16dbf03b851a281`
- tutorial.css: `0c757bf34461d716bd433fa55df7ea9e0e242d08`
- app entry activation: `f6d229f832cb863e1313a670150711a050bf6810`
- LP: `4d8452dab01222479bd8d67f77d401b1e0886b60`
- guide: `6abdf2f2b0a1e161848098ea4ac72d2fbb98f819`

The downloaded deployment has the same tutorial.js, tutorial.css, entry HTML and LP bytes as the tested local files. The guide was rechecked from the final deployed artifact. The original engine.js, play.js, turn-ui.js, landing.css, play.css and turn-ui.css are byte-identical to baseline `cececa6c1915e40715918661c717d8e276beca82`. Approved illustrations are reused; only tutorial-scoped styling is new.

## Verification — exact boundary

**PASS: isolated Chromium interaction.** Actual code and assets rendered offline with URL query inputs supplied by the harness; no HTTP navigation or multiplayer transport is implied.

At 320×740, 390×844, 414×896 and 1366×900, both roles passed (8 role/width paths): question→answer→result, incorrect-answer recovery, role-preserving restart, pending timer cancellation on restart, result links and no horizontal overflow or page errors. Questioner FinePlay toggle and sample-labelled result-copy preview were checked. Controller is inert on the real entry, the original free sandbox and the legacy direct-result demo.

The final deployed LP and guide were rendered at all four widths: no horizontal overflow or page errors. Original deterministic rule tests: **30/30 PASS**.

**Public content:** the updated LP was returned by read-only public fetching. Tutorial URLs resolve, but the read-only extractor returned incomplete text and one scoped selector check did not match; do not promote this to live tutorial interaction acceptance. GitHub's successful deployment and offline interaction are separate evidence.

**OPEN:** public URL click-through on an unrestricted browser, physical-phone behavior and first-time friend comprehension/actual adoption. No live multiplayer regression was newly claimed in R2. No Discord message was posted. No recurring/background worker was created.

Remote script write was rejected and that path was stopped. A proposed extra LP stylesheet was rejected and dropped; existing LP CSS was reused. Tests used the isolated browser without changing its network policy. Paid browser automation was not started.

## Reusable connection

The owner explicitly requires shared products to work without the sender's explanatory message. This is an acceptance requirement, not a new empirical two-specimen result.

- Contract: [Product entry check](../../../output-pack/product-entry-check.md)
- Existing manifest: [Output Pack template](../../../output-pack/template.yaml)
- Implementation/research homes: claude-shared #381 / #446; package owner: #423.

The contract is proportional: no obligatory LP/tutorial for every utility or prototype, no retroactive all-product migration, no new lifecycle or registry.

## Optional friend introduction

> 人間アキネーター「FINEPLAY」、遊びやすく更新した！
> いい質問に拍手しながら、みんなで答えを当てるやつ。
> 遊び方も、一人で試せるチュートリアルもここにまとめた。今度通話しながらやろう！
> https://osakenpiro.github.io/fineplay/home/
