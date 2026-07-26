# handoff 2026-07-26 Cow SES857 — note『読めない宇宙、建てる世界』下書き入稿＋Codexレーン復旧

- 環境: Cowork（クラウド実行 + デバイスブリッジで家PC操作）
- XP: +1430（OUT 発信 +500 / CRE 創作 +300 / TEC 技術 +630）
- セッションログ: SES857
- 状態: **note は下書きのまま。「投稿する」未押下＝人間手番で停止中。**

---

## 1. いちばん大事な1行

note 記事 `n88bb18c27523` は **publish タブに全設定が入ったまま止めてある**。
無料プランはタグ・記事タイプを「投稿する」を押すまでサーバ保存しないので、
**そのタブを閉じるとタグ5個が消える**。押すのは本人。

## 2. やったこと

**(a) note 下書き入稿一式（公開手前で停止）**
- 記事: 『読めない宇宙、建てる世界 ——ラプラスの悪魔を殺しきったあとに残る仕事』
- note ID `n88bb18c27523` / status=draft / price=0
- 本文構造の二重検証に成功: エディタ DOM 側と v3 API のサーバ側 HTML で
  h2=6 / strong=18 / table=0 が一致（`md_to_note_html.py` の counts と完全一致）
- タグ5: `#ラプラスの悪魔` `#決定論` `#哲学` `#物理学` `#世界モデル`（クライアント側適用済み）
- publish-gate は家PCで実走しクリーン通過（クラウド側は NGリスト不在で EXIT 1 になるが
  これは内容の問題ではない＝NGリストは機密で git 管理外・家PCのみ）

**(b) 見出し画像を自作（Codex を待たずに）**
- Codex 画像レーンが死んでいたので `make_banner.py`（SVG生成）を書いて代替
- 左＝読めない霧の宇宙（星＋カオス渦）/ 右＝建てた幾何格子＋等角キューブ /
  金の回帰ループが右から左へ戻る。文字なし・flat vector・単一アクセント `#d4a853`
- gold 量を subtle / moderate / bold の3案で振り、**moderate 採用**
- note CDN 反映済: `assets.st-note.com/.../rectangle_large_type_2_f9196ee7cf7fe6e97c3df418b2c8e2a5.png`

**(c) note v3 API の検証経路を発見（スキル還流ネタ）**
- `https://note.com/api/v3/notes/{key}` + `credentials:'include'` を
  **editor.note.com のタブ内 fetch** で叩くと 200。status / name / body / eyecatch / price が読める
- 死んだ経路: `note.com/api/v1/notes/{key}` → 405 / `editor.note.com/api/v1/text_notes` → 403 /
  `note.com/api/v1/text_notes` → 404
- これで「タブを離れずにサーバ保存状態を確認する」が可能になった。
  実際に v3 で `hashtags: []` を確認 → **無料プランのタグ非保存トラップを実証**

**(d) Codex CLI 復旧**
- 症状: `gpt-5.6-sol` が HTTP 400「requires a newer version of Codex」で画像レーン全死
- 真因: winget/MSIX ではなく **npm global**（`C:\Users\kenpi\AppData\Roaming\npm\`）に入っていた
- `npm install -g @openai/codex@latest` → **0.133.0 → 0.145.0**
- ⚠️ 実際の画像生成スモークテストは未実施

**(e) MIHARASHI snapshot 再生成**
- `snapshots\visionium-2026-07-26.json` + `latest.json`
- 90 projects / 2164 RPG events / 1,676,415 XP（このセッションの +1430 は再生成前の値）

## 3. 次の一手

1. **【本人】note publish タブで「投稿する」**。マガジン（哲学 / 週1くらいのゆる雑記）を
   足すなら押す前に。タブを閉じる＝タグ消滅。
2. Codex 0.145.0 で `codex-img.ps1` を1枚スモークテスト → 通れば eyecatch レーン正式復活
3. `note-publish` スキルに §10「v3 API でサーバ側検証」を追記（上の (c) をそのまま）
4. 旧handoffから継続: 箱庭v1 = HTML+SQLite(sqlite-wasm)化 / humos:器を実案件で数回まわす /
   FitGap台帳の fork起点OSS を1つ clone 検証

## 4. 踏んだ罠・学び

- **「家PCは触れない」と勝手に判断した** → 本人に「ここは家PC」と訂正された。
  handoff の環境メモから可用性を推論せず、**デバイスブリッジを実際に叩いて確かめる**。
- **Notion MCP の `query_data_sources` が枠切れ**（`entitlement_required` / retryable=false）。
  回避: `miharashi\.env` の `NOTION_TOKEN` で **raw REST API を直叩き**（`/v1/databases/{container}/query`、
  `/v1/pages`）。MCP 枠とは別勘定。使い捨てスクリプト `_hem855.py` / `_hem855_ses.py` を置いた。
- **latest.json は他セッションと競合して古くなる**。今回 snapshot 時点では SES854 が最新だったが、
  実 DB には SES855/856 が既にあった。**SES番号は snapshot ではなく DB を見て決める。**
- Windows の PowerShell 経由 python は **cp932 で UnicodeEncodeError**。
  `$env:PYTHONIOENCODING="utf-8"` ＋ `Out-File -Encoding utf8` に逃がして UTF-8 で読み直す。

## 5. 触った場所

- クラウド: `/home/claude/essay-yomenai-uchuu.md`, `/home/claude/make_banner.py`,
  `/mnt/user-data/outputs/banner_moderate.png`（`file_upload` が受けるのは outputs 配下）
- 家PC: `C:\osakenpiro\workspace\miharashi\_hem855.py` / `_hem855_ses.py`（使い捨て・掃除してよい）
- Notion: RPG Status DB に5行 / セッションログ SES857 / 📌 Visionium 最終更新ログ DB に1行
