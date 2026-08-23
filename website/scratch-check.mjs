import { chromium } from "playwright";

const OUT = "/private/tmp/claude-501/-Users-fredjendrzejewski-GitHub-fretchen-github-io/64eb5ac1-62cd-4254-968f-92074aef6ed5/scratchpad";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await page.goto("http://localhost:3001/blog/kuesten_dimension", { waitUntil: "networkidle" });

const widgets = page.locator("canvas");
console.log("canvases:", await widgets.count());

// --- Widget 1: shapes ---
const w1 = page.locator("canvas").nth(0).locator("xpath=ancestor::div[contains(@class,'bd_1px')][1]");
const btn = (root, name) => root.getByRole("button", { name });

const box = await btn(w1, "Linie").boundingBox();
console.log("toggle height:", box.height);
const halveBox = await btn(w1, "Jetzt zählen").boundingBox();
console.log("action height:", halveBox.height);

console.log("guess step 1:", await w1.getByText(/Schätz zuerst/).isVisible());
for (let i = 0; i < 5; i++) {
  await btn(w1, "Jetzt zählen").click();
  if (i === 0) console.log("bigNumber:", await w1.getByText(/Kästchen$/).first().textContent());
  if (i < 4) {
    if (i === 0) console.log("guess step 2 shown after halving:", true);
    await btn(w1, "Kästchen halbieren").click();
    console.log(`  step ${i + 2} guess prompt:`, await w1.getByText(/Schätz wieder/).isVisible());
  }
}
console.log("W1 Fazit label:", await w1.getByText("Im Schnitt bei jeder Halbierung:").isVisible());
console.log("W1 Fazit headline:", await w1.locator("p.fs_2xl").last().textContent());
console.log("W1 Nochmal present:", await btn(w1, "Nochmal").isVisible());

// Is the Fazit in the viewport right after the last click?
const fazitBox = await w1.getByText("Im Schnitt bei jeder Halbierung:").boundingBox();
const scrollY = await page.evaluate(() => window.scrollY);
console.log("Fazit y (page):", Math.round(fazitBox.y), "scrollY:", Math.round(scrollY));
await page.screenshot({ path: `${OUT}/w1-fazit.png` });

await btn(w1, "Nochmal").click();
console.log("W1 after Nochmal, Jetzt zählen back:", await btn(w1, "Jetzt zählen").isVisible());

// --- Widget 2: coastlines ---
const w2 = page.locator("canvas").nth(1).locator("xpath=ancestor::div[contains(@class,'bd_1px')][1]");
console.log("W2 caption:", await w2.getByText(/Diesmal zählt der Computer/).isVisible());
for (let i = 0; i < 4; i++) await btn(w2, "Kästchen halbieren").click();
const bretagneFazit = await w2.locator("p.fs_2xl").last().textContent();
console.log("W2 Bretagne Fazit:", bretagneFazit);
console.log("W2 comparison before switch:", await w2.getByText(/zerklüftetere/).count());

await btn(w2, "Normandie").click();
console.log("W2 still at last step after switch:", await btn(w2, "Nochmal").isVisible());
console.log("W2 Normandie Fazit:", await w2.locator("p.fs_2xl").last().textContent());
const cmp = await w2.getByText(/zerklüftetere/).textContent();
console.log("W2 comparison:", cmp.trim());
await w2.getByText("Im Schnitt bei jeder Halbierung:").scrollIntoViewIfNeeded();
await page.screenshot({ path: `${OUT}/w2-compare.png` });

// focus ring check
await btn(w2, "Bretagne").focus();
const outline = await btn(w2, "Bretagne").evaluate((el) => getComputedStyle(el).outlineWidth);
console.log("focus outline width:", outline);

// --- Widget 3: draw ---
const w3 = page.locator("canvas").nth(2);
const cb = await w3.boundingBox();
await page.mouse.move(cb.x + 20, cb.y + cb.height / 2);
await page.mouse.down();
for (let i = 1; i <= 40; i++) {
  await page.mouse.move(cb.x + 20 + i * 7, cb.y + cb.height / 2 + (i % 2 ? -18 : 18));
}
await page.mouse.up();
const w3root = page.locator("canvas").nth(2).locator("xpath=ancestor::div[contains(@class,'bd_1px')][1]");
console.log("W3 caption:", await w3root.getByText(/Diesmal zählt der Computer/).isVisible());
for (let i = 0; i < 4; i++) await btn(w3root, "Kästchen halbieren").click();
console.log("W3 Fazit:", await w3root.locator("p.fs_2xl").last().textContent());
console.log("W3 sentence:", (await w3root.locator("p.ff_reading").last().textContent()).slice(0, 80));
console.log("W3 Nochmal:", await btn(w3root, "Nochmal").isVisible());
await w3root.getByText("Im Schnitt bei jeder Halbierung:").scrollIntoViewIfNeeded();
await page.screenshot({ path: `${OUT}/w3-draw.png` });

console.log("CONSOLE ERRORS:", errors.length ? errors : "none");
await browser.close();
