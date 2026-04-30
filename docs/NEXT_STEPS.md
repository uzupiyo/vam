# Next Steps

## 次にやると良い作業

1. `assets/player/rin/` にRinの正式スプライトを配置
2. `assets/enemies/` に4敵の最終GIFまたはPNGを配置
3. `assets/items/` に中心配置済みアイテムPNGを配置
4. `game.js` の図形描画を `drawImage()` に置き換え
5. DOM UIとCanvas描画をさらに分離

## 推奨assets構成

```text
assets/
  player/
    rin/
      idle.gif
      idle_sheet.png
  enemies/
    slime/
    bat/
    golem/
    boss/
  items/
    magnet.png
    heal_cross.png
    barrier_shield.png
    rin_dual_pistols.png
  backgrounds/
    rin_city_plaza_field.png
  ui/
    portraits/
    mockups/
```
