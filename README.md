# RIN SURVIVORS UI Rewrite

このフォルダは、試作ゲーム4ファイルをベースに、タイトル画面・HUD・レベルアップUIを
Rin素材やこれまでのイラストに合う方向へ書き換えた実装版です。

## 実行方法

```text
index.html をブラウザで開く
```

## 変更内容

- タイトル画面を「RIN SURVIVORS」風に変更
- Rin用のプレイヤーパネルを追加
- タイマー・Kills・Gold・Missionパネルを追加
- EXPバーとスキルスロット風UIを追加
- Level Up画面をカードUI風に調整
- 背景描画を現代の都市公園・広場っぽい雰囲気に変更
- 既存ゲームロジックは大きく壊さず維持

## 今後の差し替えポイント

- `drawPlayer()` をRinスプライト描画に差し替え
- `drawEnemies()` を敵GIF/PNG描画に差し替え
- `drawItems()` をアイテムPNG描画に差し替え
- UIポートレートを正式立ち絵・顔画像に差し替え
