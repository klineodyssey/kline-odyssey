import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../../", import.meta.url);
const text = (path) => readFile(new URL(path, root), "utf8");
const json = async (path) => JSON.parse(await text(path));

const apiNames = [
  "species", "organism", "state", "events",
  "civilization", "population", "listing", "rights"
];

test("official homepage exposes K280 in navigation, product content, and footer", async () => {
  const html = await text("index.html");
  assert.match(html, /href="\.\/world-viewer\/k280\/".*K280 世界.*K280 數位生命世界/);
  assert.match(html, /id="k280-world"/);
  assert.match(html, />進入 K280 World Viewer</);
  assert.match(html, />查看數位生命資料</);
  assert.match(html, /KAIOS-RAPTOR-K280-001/);
  assert.match(html, />K280 World Viewer<\/a>/);
});

test("canonical Viewer route uses shared assets and GitHub Pages-safe paths", async () => {
  const html = await text("world-viewer/k280/index.html");
  assert.match(html, /href="\.\.\/\.\.\/">返回官方首頁/);
  assert.match(html, /src="\.\.\/\.\.\/KGEN-KAIOS\/world-viewer\/k280\/k280-viewer\.js"/);
  assert.match(html, /href="\.\.\/\.\.\/KGEN-KAIOS\/world-viewer\/k280\/styles\.css"/);
  assert.match(html, /https:\/\/klineodyssey\.github\.io\/kline-odyssey\/world-viewer\/k280\//);
  assert.match(html, /正在載入 K280 數位生命資料/);
  assert.match(html, /id="retry-button"/);
  assert.doesNotMatch(html, /(?:localhost|127\.0\.0\.1|file:\/\/|[A-Z]:\\)/i);
});

test("shared Viewer loads every public API and fails without an unhandled throw", async () => {
  const script = await text("KGEN-KAIOS/world-viewer/k280/k280-viewer.js");
  for (const name of apiNames) assert.match(script, new RegExp(`"${name}"`));
  assert.match(script, /Promise\.allSettled/);
  assert.match(script, /K280 資料載入失敗/);
  assert.match(script, /K280 數位生命資料已載入/);
  assert.doesNotMatch(script, /throw error/);
});

test("API index links every valid K280 JSON export", async () => {
  const html = await text("api/kaios/k280/index.html");
  for (const name of apiNames) {
    assert.match(html, new RegExp(`href="${name}\\.json"`));
    await json(`api/kaios/k280/${name}.json`);
  }
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/world-viewer\/k280\/"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/"/);
});

test("canonical content and simulation metrics match PR 59 exports", async () => {
  const identity = await json("KAIOS/life/organisms/KAIOS-RAPTOR-K280-001/identity.json");
  const population = await json("api/kaios/k280/population.json");
  assert.equal(identity.life_id, "LIFE-KAIOS-RAPTOR-K280-001");
  assert.equal(identity.genome_id, "GENOME-KAIOS-RAPTOR-K280-001-G0");
  assert.equal(identity.embodiment_id, "EMBODIMENT-KAIOS-RAPTOR-K280-001-DIGITAL");
  assert.deepEqual(
    [
      population.total_births,
      population.total_deaths,
      population.surviving_population,
      population.generation_count,
      population.mutation_count,
      population.branch_count
    ],
    [31, 6, 25, 5, 38, 1]
  );
});

test("changed public content keeps terminology and authority boundaries", async () => {
  const prohibitedChinese = String.fromCodePoint(0x795e, 0x9650, 0x6587, 0x660e);
  const prohibitedCode = ["DIVINE", "LIMIT"].join("_");
  const paths = [
    "index.html",
    "world-viewer/k280/index.html",
    "api/kaios/k280/index.html",
    "KGEN-KAIOS/world-viewer/k280/index.html",
    "KGEN-KAIOS/world-viewer/k280/k280-viewer.js"
  ];
  for (const path of paths) {
    const content = await text(path);
    assert.equal(content.includes(prohibitedChinese), false);
    assert.equal(content.includes(prohibitedCode), false);
    assert.doesNotMatch(content, /wallet-connect|Production Runtime activation/i);
  }
});
