# KGEN 12345 Asset Manifest｜V10.20

路徑：`/K線西遊記/temples/12345/assets/`

必備資產：

```text
bull-front.png   # 多方靜止圖
bear-rear.png    # 空方靜止圖
heart.png        # 轉動 / 移動 / 曲速啟動中的悟空心臟圖
warp-core.png    # 右下曲速引擎核心圖
```

禁止再新增或改名：

```text
heart.png
warp-universe.png
xxx-final.png
xxx-new.png
```

如果缺檔，`kgen-12345-install-check.js` 必須顯示警告並語音提示，不得當作正常啟動。


---

# V10.20 FIX NOTES

- BASE_FROM remains V10.12_MOTION_CONTROL_PATCH.
- Do not rewrite rotation math.
- Static state must show bull-front.png or bear-rear.png.
- Any active rotation or MOVE/WARP movement temporarily shows heart.png.
- Left MOVE Y links the right WARP vertical rail display.
- WARP 0x = bottom floor, 20x = neutral aesthetic floor, 300x = ceiling / highest parallel universe floor.
- warp-core.png stays inside the right WARP engine rail and never replaces the main image.
- Right-side rule panel size is matched to the Wukong Heart panel.
- Countdown flicker is guarded by stable minute-only updates and no animation.
- Holy Cup remains front-end ritual gate: press three Holy Cup buttons to pass; actual fortuneClaim still depends on Heart contract rules.
