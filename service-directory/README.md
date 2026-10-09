# osakenpiro サービス名鑑 — 試刊号

サービス版「電話帳 × 四季報」。公開Webサービスを用途で探し、活動状態と沿革を残す小さな索引。

- 公開候補URL: https://osakenpiro.github.io/service-directory/
- JSON配信: https://osakenpiro.github.io/service-directory/catalog.json
- 企画・検証記録: https://github.com/osakenpiro/claude-shared/issues/491
- /works/ は全成果物。こちらは「今使える公開Webサービス」を対象にする。

## 掲載基準 v0.1

1. osakenpiro が管理する第一者の公開ページである。
2. URLが https://osakenpiro.github.io/<slug>/ に一致し、同じレポジトリ内に <slug>/index.html がある。
3. HTMLタイトルがあり、robots=noindex が指定されていない。
4. 名前、用途説明、分野、収益関係（none / affiliate / sponsored）を持つ。
5. HTTP 200が取得できれば active。失敗が連続1〜2回なら watch、3回で hidden。復旧で active に戻す。
6. retired は運営者が明示的に終了を申告したときだけ。HTTP失敗から「正式終了」を推定しない。
7. 登録・掲載終了後の記録は消さず、全履歴ビューに残す。機械判定は利用可能性の一部しか見ない。
8. 掲載は品質保証・中立な推薦・利用者への勧誘とは異なる。

## 自動登録

同じリポジトリの公開ページと同階層に、次のような service-entry.json を設置する。

    {
      "id": "sample-tool",
      "name": "サンプルツール",
      "description": "毎日の作業を少し便利にする道具です。",
      "category": "その他",
      "tags": ["便利"],
      "url": "https://osakenpiro.github.io/sample-tool/",
      "commercial_relation": "none"
    }

上記のファイルは sample-tool/service-entry.json として置き、sample-tool/index.html の存在が必要。

試刊号は公開ページを確認した9件を service-directory/seed.json に収録。新規ページの全探索・無差別掲載はしない。自動登録の対象は manifest を自分で公開した第一者サービスのみ。事実上、掲載オプトインの仕組み。manifest が消えた場合は非掲載にして履歴を維持する。

## 運用・検証

ワークフローは毎日08:21 JSTごろ（GitHub Actionsの遅延はあり得る）に動作予定。CLI:

    python service-directory/sync.py --dry-run --no-network
    python service-directory/sync.py

CIの成功・実際のURL確認・自動コミットの実行については、GitHub Actionsの実行ログで確認するまで完了扱いしない。HTTP応答を確認できても、ページ内部の使いやすさやサービスとしての機能は保証できない。

## 3Sとの境界

元の着想は、3Sで本人のステータスに講評やおすすめを表示し、収益を生み出す可能性を考えたこと。ただしこの名鑑は公開サービスの事実だけを扱い、個人ステータスを取得・共有・分析しない。

将来3Sから推奨する場合、本人による目的別の明示同意、推薦理由の説明、スポンサー・アフィリエイトの開示、講評の独立性が必要。支払いによる評価操作は禁止。3Sの既存MVP優先順位は変更しない。

3S参照: #294 Product / #305 Business / #312 Idea Box / #320 HQ。名鑑の進捗は #491 に記録。

## 世界版へ進む条件

第三者登録を始める前に、ドメイン・運営主体の検証、変更/削除の訂正依頼、苦情・通報、著作権・商標、掲載責任、広告表示、データ再利用ライセンス、オープンスキーマを設計する。現段階では世界のサービスを勝手にクロールして登録しない。


## 外部辞書の参照（2026-10-09 / v0.2）

- **Wikidata 接続実装**: /service-directory/ 下部の「外部辞書を引く」欄から公開 API `wbsearchentities` をユーザーの検索操作時に呼び出す。
- 入力した検索語句以外は送らない。3S/UUU の個人 status、閲覧履歴、ID、認証情報などを送信しない。Cookie 付き認証はしない。
- `origin=*` を付けた Wikimedia Action API の公開CORSを利用。秘密鍵・OAuth・有料API・外部プロキシは不要。
- 返却された Wikidata Q-ID と表示名・説明のみ取り扱い、リンクは安全な Wikidata のURLをQ-IDから構築する。
- 辞書のヒットは**未審査の参照候補**。サービスでもない一般項目が含まれ得るし、HTTP動作確認・推薦・公式サイト認証・広告掲載を意味しない。
- 第一者 `seed.json` / `catalog.json` の自動更新ロジックは変更しない。外部辞書検索の結果はこの台帳に勝手に追加・永続保存しない。
- 出典を常時表示し、Wikidata項目へ直接移動可能。Wikidataの構造化データはCC0。外部辞書の可用性は保証しない。
- 利用者がフォームを送信した時だけ API 呼び出し。ページを開くだけ・サンプル語を選択するだけでは外部通信しない。検索失敗時は Wikidata 自身の検索へ誘導。

### 辞書アダプター契約

`dictionary-providers.mjs` が辞書のURL構築・取得・正規化を提供し、`dictionary-ui.mjs` が表示を担当する。将来のアダプターも同じルールを満たすこと。

| フィールド | 内容 |
| --- | --- |
| `provider`, `sourceId`, `referenceURL` | 必須の出典識別子と原典リンク |
| `name`, `description` | プレーンテキスト（HTML/任意URLを信用せず表示） |
| `provenance` | `external-dictionary` 固定。自前審査済みレコードと分離 |
| `verified` | デフォルト false（辞書への掲載 != 運営確認） |
| `contentLicense` | データ利用条件と帰属を明示 |

**将来の複数辞書**:
- Product Hunt: GraphQL API / API Key。公式ドキュメントが商用利用を原則禁止しているため、事業用は許諾取得まで接続しない。 https://www.producthunt.com/v2/docs
- G2: 公式APIとDeveloper Portalあり、権限・価格・利用規約・収益関連の条件を別途確認。 https://partner.g2.com/developer
- App Store: Apple Search APIはアプリ専用の候補。公式APIの呼び出し上限や表示規約、静的ページからのCORS制約を先に調べる。無許可のJSONPスクリプト実行やプロキシを避け、必要になれば鍵やログの扱いを設計した安全な中継を審査する。 https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
- AlternativeTo: 一般公開APIの利用可能性は未確認。スクレイピングや丸写しはしない。

辞書ごとの検索意味・収録範囲・更新頻度・ライセンスは異なるので、複数辞書の件数を合算して「世界の全サービス数」とはしない。将来の3S推薦は本人の明示同意と推薦根拠・収益開示を独立ゲートにする。
