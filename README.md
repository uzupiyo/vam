# RIN SURVIVORS UI + Asset Integrated Prototype

この版は、UI書き換え版に以下の画像素材を実際に反映した実装版です。

## 反映済み素材

- Rin通常 idle 4フレーム
- 実装済み敵4体
  - slime
  - bat
  - golem
  - boss
- アイテム4種
  - magnet
  - heal_cross
  - barrier_shield
  - rin_dual_pistols
- 現代都市公園風の背景

## 実行方法

```text
index.html をブラウザで開く
```

## 主な変更点

- `game.js` に画像アセットローダーを追加
- `drawBackground()` を背景画像描画に変更
- `drawPlayer()` をRinスプライト描画に変更
- `drawEnemies()` を敵スプライト描画に変更
- `drawItems()` をアイテムPNG描画に変更
- 影は素材に焼き込まず、Canvas側で楕円影を描画
- 画像が読み込めない場合は旧図形描画へフォールバック

## 画像サイズ調整ポイント

`game.js` 内の `SPRITE_SIZES` を調整してください。

```js
const SPRITE_SIZES = {
  player: { w: 54, h: 72 },
  enemies: {
    slime: { w: 42, h: 34 },
    bat: { w: 58, h: 46 },
    golem: { w: 92, h: 92 },
    boss: { w: 150, h: 150 },
  },
};
```


## v2 修正

前回版で「反映されていない」ように見える問題を避けるため、以下を追加しました。

- `asset_preview.html` を追加し、画像素材が読み込めるか単独確認可能にしました
- ゲーム画面左下に `ASSETS OK` 表示を追加しました
- スプライト表示サイズを少し大きめにして、反映が分かりやすいように調整しました
- Canvas左下に武器アイコンの確認表示を追加しました

まず `asset_preview.html` を開くと、画像素材の配置確認ができます。
次に `index.html` を開いてください。
