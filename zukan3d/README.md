# 立体図鑑 / zukan3d

駒・素材の3D図鑑。単一HTML + `<model-viewer>` + GitHub Pages（ゼロコスト・ゼロメンテ）。
Live: https://osakenpiro.github.io/zukan3d/

## 1点ふやす（drop-in）
1. GLB を `models/` に置く  2. `models/manifest.json` の `models[]` に1行追加。
`{ "id":"uma","name":"成桂・馬","src":"models/uma.glb","category":"駒 / 本番","float":0.7 }`

## フィールド
id(必須)/name(必須)/src(必須)/yomi/category/float(0-1ゲージ)/poster(無→金駒SVG)/note

## GLBの作法
Draco圧縮推奨（16MB級は重い→Blender decimate→Draco で1/5〜1/20）。model-viewerがdecoderを自動取得し展開。KTX2も自動。

## パイプライン
image→TRELLIS.2-4B→Blender(decimate+Draco)→models/*.glb + manifest 1行→deploy(Git Data API 単一commit)。正本は上流 PIPELINE.md。

## 設計
配色/タイポは v2/colors_and_type.css（SoT）の :root を inline ミラー。void+星+金箔、単一暖色 gold。
