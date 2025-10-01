import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";
import { processAllTables } from "@/pivotifyjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("PivotifyJS", () => {
  it("processes subscriptions.simple.html through pivotify", () => {
    const html = fs.readFileSync(path.join(__dirname, "data", "subscriptions.simple.html"), "utf8");
    const dom = new JSDOM(html, { runScripts: "dangerously" });
    global.document = dom.window.document;

    processAllTables();

    // Example assertion: check that a summary row was added
    const table = dom.window.document.querySelector("table") as HTMLTableElement;
    expect(table).not.toBeNull();
    const lastRow = table.querySelector("tbody tr:last-child");
    expect(lastRow).not.toBeNull();
    // You can add more assertions based on expected output
  });
});

