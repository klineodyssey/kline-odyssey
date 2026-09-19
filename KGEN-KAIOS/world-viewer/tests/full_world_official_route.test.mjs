import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("official homepage exposes distinct Full World and K280 routes", async () => {
  const homepage = await read("../../../index.html");
  assert.match(homepage, /id="kaios-world"/);
  assert.match(homepage, /href="\.\/world-viewer\/">進入 KAIOS World Viewer/);
  assert.match(homepage, /href="\.\/world-viewer\/k280\/">進入 K280 數位生命世界/);
  assert.match(homepage, /desktop-nav-label">KAIOS 世界/);
  assert.match(homepage, /mobile-nav-label">KAIOS 完整世界/);
});

test("public adapter reuses the canonical Full Viewer runtime", async () => {
  const adapter = await read("../../../world-viewer/index.html");
  assert.match(adapter, /\.\.\/KGEN-KAIOS\/world-viewer\/index\.html/);
  assert.match(adapter, /\.\.\/KGEN-KAIOS\/world-viewer\/ui\/styles\.css/);
  assert.match(adapter, /\.\.\/KGEN-KAIOS\/world-viewer\/app\.js/);
  assert.match(adapter, /重新載入/);
  assert.doesNotMatch(adapter, /localhost|127\.0\.0\.1|file:\/\/|C:\\|Desktop\\/);
});

test("canonical Viewer exposes hierarchy, navigation, and honest catalog states", async () => {
  const viewer = await read("../index.html");
  for (const marker of ["KAIOS 完整世界", "返回官方首頁", "觀看第一隻 KAIOS 數位恐龍", "LAND_PARCEL", "FISHPOND", "FARM", "HOUSE", "SHOPPING_MALL", "FACTORY", "TECHNOLOGY_BUILDING"]) {
    assert.match(viewer, new RegExp(marker));
  }
  assert.match(viewer, /FISHPOND[\s\S]*RUNTIME V1 \/ SIMULATION ONLY/);
  assert.match(viewer, /world-viewer\/aquaculture-v1\//);
  assert.match(viewer, /SHOPPING_MALL[\s\S]*MISSING/);
  assert.match(viewer, /TECHNOLOGY_BUILDING[\s\S]*MISSING/);
  const prohibitedTerms = [
    ["神限", "文明"].join(""),
    ["DIVINE", "LIMIT"].join("_"),
  ];
  assert.equal(prohibitedTerms.some((term) => viewer.includes(term)), false);
});

test("offline mobile player receives a clear start action instead of unusable controls", async () => {
  const [viewer, shell, styles] = await Promise.all([
    read("../index.html"),
    read("../ui/shell.js"),
    read("../ui/styles.css")
  ]);
  assert.match(viewer, /id="session-start-button"[\s\S]*開始遊戲/);
  assert.match(shell, /listen\("session-start-button", "click", \(\) => callbacks\.onLogin\?\.\(\)\)/);
  assert.match(shell, /elements\.sessionStart\.disabled = !ready/);
  assert.match(styles, /data-session="inactive"\][^\n]*player-action-toolbar[^\n]*display:\s*none/);
  assert.match(styles, /login-button::after\s*\{\s*content:\s*"開始"/);
});

test("capability audit preserves static simulation boundaries", async () => {
  const audit = await read("../FULL_WORLD_VIEWER_CAPABILITY_AUDIT.md");
  assert.match(audit, /FISHPOND[\s\S]*IMPLEMENTED_INTERACTIVE/);
  assert.match(audit, /no real property, water right, food certification, wallet, KGEN, or production authority/i);
  assert.match(audit, /LOCAL_SIMULATION_ONLY/);
  assert.match(audit, /Production Runtime authority: `false`/);
  assert.match(audit, /KAIOS_LAND_BUILDING_CONSTRUCTION_SYSTEM|construction workline/i);
});
