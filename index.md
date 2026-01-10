---
layout: default
title: KLINE ODYSSEY
description: 花果山台灣・質量宇宙官方白皮書（Genesis Edition）
image: https://klineodyssey.github.io/kline-odyssey/assets/og-cover.jpg
---

<!-- 首頁封面圖（同 OG） -->
![K線西遊記・花果山台灣・質量宇宙](assets/og-cover.jpg)

---

<!-- 置頂影片（你要放哪支就換 embed id） -->
<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:14px;">
  <iframe
    src="https://www.youtube.com/embed/95LccqD_MsE"
    title="KLINE ODYSSEY"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;">
  </iframe>
</div>

---

<!-- ✅ 下面開始：直接把 README.md 整份當官網內容顯示（不再半套） -->
{% capture md %}{% include_relative README.md %}{% endcapture %}
{{ md | markdownify }}
