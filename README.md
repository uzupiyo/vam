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


## 今回の更新：主人公Rin idleモーション反映

- 主人公のゲーム内表示は `assets/player/rin/idle/frame_01.png` ～ `frame_04.png` を使用します。
- `game.js` の `ASSET_PATHS.player.idle` で4枚を読み込み、`drawPlayer()` 内で待機モーションとしてアニメーション表示します。
- Rinの正規デザインと透過PNG仕様を維持しています。
