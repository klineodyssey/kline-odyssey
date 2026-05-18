# PROGRAM HISTORY｜KGEN 12345

## V10.41.1_RESTORE_GOLDEN_LAYOUT_NO_DEMOLITION

- Base: V10.40.5_MIRROR_CENTER_BULLBEAR_RESTORE。
- 原則：保留既有招牌、中央悟空主圖、MOVE、WARP、錢包流程與神殿面板。
- 修正前一版錯誤方向：不再做大幅 UI 拆屋、不再將正式神殿改成空洞鬼城。
- 僅做版本治理、檔案清潔、GitHub 上傳規則整理。
- 正式層禁止版本化執行檔名與 RELEASE_NOTES。

## Next Rule

下一版若要調整畫面，只能在 V10.40.5 視覺母版上做小幅修正：

1. 不動招牌主結構。
2. 不清空中央主圖。
3. 不重排整個 layout。
4. 不新增 patch/temp/final 執行檔。
5. 所有版本只寫入 VERSION / CHANGELOG / VERSION_GOVERNANCE。
