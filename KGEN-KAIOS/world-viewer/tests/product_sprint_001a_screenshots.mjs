import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT = path.join("/workspace", "assets", "product-sprint-001a-evidence");
const BASE = "http://127.0.0.1:8765/index.html";

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dpage = await desktop.newPage();
  await dpage.goto(BASE, { waitUntil: "networkidle" });
  await shot(dpage, "desktop-1440-hero.png");
  await dpage.click('a[data-product-section="kaios-world"]');
  await dpage.waitForTimeout(600);
  await shot(dpage, "desktop-1440-world-nav.png");
  results.push({ viewport: "desktop-1440", pass: true });
  await desktop.close();

  const tablet = await browser.newContext({ viewport: { width: 834, height: 1112 } });
  const tpage = await tablet.newPage();
  await tpage.goto(BASE, { waitUntil: "networkidle" });
  await shot(tpage, "tablet-834-portrait.png");
  results.push({ viewport: "tablet-834-portrait", pass: true });
  await tablet.close();

  const iphone = devices["iPhone 14 Pro"];
  const mobile = await browser.newContext({
    ...iphone,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE, { waitUntil: "networkidle" });
  await shot(mpage, "mobile-390-portrait-hero.png");
  await mpage.click("#product-nav-next");
  await mpage.waitForTimeout(500);
  await shot(mpage, "mobile-390-portrait-nav.png");
  results.push({ viewport: "mobile-390-portrait", pass: true });

  await mpage.setViewportSize({ width: 844, height: 390 });
  await mpage.goto(BASE, { waitUntil: "networkidle" });
  await shot(mpage, "mobile-844-landscape.png");
  results.push({ viewport: "mobile-844-landscape", pass: true });
  await mobile.close();

  const safe = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    extraHTTPHeaders: {}
  });
  await safe.addInitScript(() => {
    Object.defineProperty(window, "visualViewport", {
      value: {
        height: 780,
        width: 390,
        offsetTop: 44,
        offsetLeft: 0,
        addEventListener: () => {},
        removeEventListener: () => {}
      },
      configurable: true
    });
  });
  const spage = await safe.newPage();
  await spage.goto(BASE, { waitUntil: "networkidle" });
  await shot(spage, "mobile-safe-area-simulated.png");
  results.push({ viewport: "mobile-safe-area-simulated", pass: true });
  await safe.close();

  await browser.close();
  fs.writeFileSync(path.join(OUT, "screenshot-manifest.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ ok: true, count: results.length, out: OUT }));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
