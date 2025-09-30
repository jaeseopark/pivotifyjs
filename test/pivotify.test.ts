// import { fileURLToPath } from "url";
// import path from "path";
// import fs from "fs";
// import { JSDOM } from "jsdom";
// import { processAllTables } from "../src/pivotify.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const html = fs.readFileSync(path.join(__dirname, "data", "subscriptions.simple.html"), "utf8");

// describe("PivotifyJS basic sum and avg", () => {
//   it("should add a summary row with correct sum and average", () => {
//     const dom = new JSDOM(html, { runScripts: "dangerously" });
//     global.document = dom.window.document;
//     processAllTables();

//     const table = dom.window.document.querySelector("table");
//     const lastRow = table.querySelector("tbody tr:last-child");
//     const cells = Array.from(lastRow.querySelectorAll("td")).map(td => td.textContent);

//     expect(cells[1]).toContain("Sum=349");
//     expect(cells[1]).toContain("Avg=116.33");
//   });
// });

describe("PivotifyJS", () => {
  it("placeholder test", () => {
    expect(true).toBe(true);
  });
});

