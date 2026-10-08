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
