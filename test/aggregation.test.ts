import { aggregateTable, getAggregations } from "@/utils/aggregation";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

function loadTableFromHtml(htmlFile = "subscriptions.simple.html") {
    const htmlPath = path.resolve(
        fileURLToPath(import.meta.url),
        `../../test/data/${htmlFile}`
    );
    const html = fs.readFileSync(htmlPath, "utf8");
    document.body.innerHTML = html;
    return document.querySelector("table") as HTMLTableElement;
}

describe("getAggregations", () => {
    it("parses aggregation keywords and columns from text", () => {
        const text = `
            PIVOTIFYJS_SUM:["Annual Cost", "Unit Cost", "Qty"]
            PIVOTIFYJS_AVERAGE:["Annual Cost"]
            PIVOTIFYJS_MIN:    ["Qty"]
        `;
        const result = getAggregations(text);

        expect(result.aggregations["Annual Cost"]).toEqual(["PIVOTIFYJS_SUM", "PIVOTIFYJS_AVERAGE"]);
        expect(result.aggregations["Unit Cost"]).toEqual(["PIVOTIFYJS_SUM"]);
        expect(result.aggregations["Qty"]).toEqual(["PIVOTIFYJS_SUM", "PIVOTIFYJS_MIN"]);
    });
});

describe("aggregateTable", () => {
    it("adds summary row with average and sum when no groups are specified", () => {
        const table = loadTableFromHtml();
        const text = `
      PIVOTIFYJS_SUM:["Annual Cost"]
      PIVOTIFYJS_AVERAGE:["Annual Cost"]
    `;
        const rowCountBefore = table.querySelectorAll("tbody tr").length;
        aggregateTable(table, text);
        const rowCountAfter = table.querySelectorAll("tbody tr").length;

        expect(rowCountAfter).toBe(rowCountBefore + 1); // One additional summary row

        const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent?.trim());
        const annualCostIdx = headers.indexOf("Annual Cost");
        expect(annualCostIdx).toBeGreaterThan(-1);

        const rows = Array.from(table.querySelectorAll("tbody tr"));
        const summaryRow = rows[rows.length - 1]!;
        const summaryCell = summaryRow.querySelectorAll("td")[annualCostIdx];

        expect(summaryCell).toBeDefined();
        // Should contain both "Sum:" and "Avg:" in the cell text
        expect(summaryCell?.textContent).toEqual("Sum: 349, Avg: 116.33");
    });
});
