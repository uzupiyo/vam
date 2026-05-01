# RIN SURVIVORS - Character Select Test Version

GitHub Pages用のフラット構成です。

## 追加内容

- キャラクター選択画面を追加
- 3x3の9マス選択グリッドを追加
- 現時点ではRinのみ選択可能
- 未実装枠は `?` 表示
- 右側にRinの立ち絵表示
- 選択マスにはRinのドット絵を表示

## 配置

```text
index.html
style.css
game.js
assets/
  characters/rin/portrait.png
  characters/rin/dot.png
  player/rin/idle/frame_01.png
```

## 確認

1. `index.html` を開く
2. タイトル画面の Start Game を押す
3. CHARACTER SELECT 画面へ移動
4. Rinを選択したまま Start でゲーム開始

## GitHub Pages

このZIPの中身をリポジトリ直下に置いてください。


## Effects update

炎・雷・銃撃・アイテム取得エフェクトを追加しました。

- Fire Aura: 炎リング + 炎粒子
- Lightning: 分岐付き落雷 + 着弾リング
- Bullet: トレイル + マズルフラッシュ + ヒットスパーク
- Damage: ダメージ数値
- Items: グロー + 取得バースト

詳細は `docs/EFFECTS.md` を確認してください。


## 2026-05-01 修正メモ

- 画面遷移・UI・キャラクター選択画面は `final_game_files_latest.zip` のまま維持。
- 変更箇所は `game.js` の主人公描画のみ。
- 主人公は `assets/player/rin/idle/frame_01.png`〜`frame_04.png` を6fpsで表示。
- ブラウザキャッシュ対策として `index.html` の `game.js` 読み込みにバージョンを付与。
