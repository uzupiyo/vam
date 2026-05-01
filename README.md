# ヴァンサバ風 2Dアクション試作品 v2

## 追加内容

以下を追加しました。

```text
・経験値吸収アイテム
・HP回復アイテム
・一定時間バリアアイテム
```

## 追加アイテム

### 経験値吸収アイテム

青い磁石の見た目のアイテムです。

```text
落ちている経験値をすべて回収する
画面外や遠くに落ちた経験値もまとめて取得する
```

### HP回復アイテム

赤い十字の見た目のアイテムです。

```text
HPを30回復する
最大HPを超えては回復しない
```

### バリアアイテム

紫の盾の見た目のアイテムです。

```text
8秒間、敵との接触ダメージを無効化する
バリア中はプレイヤーの周囲に紫の円が表示される
```

## 実行方法

```text
1. ZIPを展開
2. index.html をブラウザで開く
3. ゲーム開始
```

## 調整する場所

### ドロップ率

`game.js` の `ITEM_TYPES` を変更します。

```js
const ITEM_TYPES = {
  magnet: { dropRate: 0.035 },
  heal: { dropRate: 0.06 },
  barrier: { dropRate: 0.04 },
};
```

### 回復量

```js
healAmount: 30
```

### バリア時間

```js
duration: 8
```

### アイテムが消えるまでの時間

```js
life: 60
```

不要なら `Infinity` にしてもOKです。


## 画像組み込み版の追加内容

このZIPでは、既存の試作ゲーム4ファイルを基準に、以下の画像素材を `assets/` から読み込むようにしました。

- `assets/player/rin_spritesheet.png` : ゲーム内Rinドット絵 4フレーム
- `assets/player/rin_portrait.png` : タイトル画面用Rin公式透過立ち絵
- `assets/enemies/*_spritesheet.png` : slime / bat / golem / boss の2フレーム敵素材
- `assets/items/magnet.png` : 青い磁石 = 経験値全吸収
- `assets/items/heal_cross.png` : 赤い十字 = HP回復
- `assets/items/barrier.png` : 紫の盾 = 一定時間バリア
- `assets/items/gem.png` : 経験値ジェム表示用
- `assets/ui/icon_*.png` : HP / EXP / 武器 / 炎 / 雷のUIアイコン
- `assets/background/grid_tile.png` : 背景グリッドタイル

確認キー：`T` でアイテム3種をプレイヤー近くに出し、`Y` で炎・雷エフェクトを出します。

素材仕様：透過PNG、中心配置、素材自体には床影を焼き込まず、ゲーム描画側で楕円影を表示しています。
