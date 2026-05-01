# Effects Added

追加したCanvas描画エフェクトです。

## 炎
- Fire Aura を炎リング + 小さな炎粒子で表示
- `useFireAura()` で発生
- `game.player.fireLevel > 0` のとき発動

## 雷
- 画面上から敵へ落ちる稲妻
- 分岐付きの稲妻線と着弾リング
- `useLightning()` で発生
- `game.player.lightningLevel > 0` のとき発動

## 銃撃
- 弾のピンク系トレイル
- 発射時のマズルフラッシュ
- 命中時のスパーク
- ダメージ数値表示

## アイテム
- アイテムの周囲に種類別グロー
- 取得時にバーストリング

## プレビュー
`game.js` の以下を true にすると、開始直後から炎と雷を確認できます。

```js
const EFFECT_PREVIEW_MODE = true;
```
