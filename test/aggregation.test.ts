import { aggregate, getAggregateInstructions } from "@/aggregation";
import { processAllTables } from "@/pivotifyjs";
import { loadHtml, loadTableFromHtml } from "./testUtils";


describe("getAggregations", () => {
    it("parses aggregation keywords and columns from text", () => {
        const text = `
            PIVOTIFYJS_SUM:["Annual Cost", "Unit Cost", "Qty"]
            PIVOTIFYJS_AVERAGE:["Annual Cost"]
            PIVOTIFYJS_MIN:    ["Qty"]
        `;
        const result = getAggregateInstructions(text);

        expect(result).toHaveLength(5);
        expect(result).toContainEqual({ aggregator: "PIVOTIFYJS_SUM", column: "Annual Cost" });
        expect(result).toContainEqual({ aggregator: "PIVOTIFYJS_SUM", column: "Unit Cost" });
        expect(result).toContainEqual({ aggregator: "PIVOTIFYJS_SUM", column: "Qty" });
        expect(result).toContainEqual({ aggregator: "PIVOTIFYJS_AVERAGE", column: "Annual Cost" });
        expect(result).toContainEqual({ aggregator: "PIVOTIFYJS_MIN", column: "Qty" });
    });
});

describe("aggregateTable", () => {
    it("adds summary row with average and sum when no groups are specified", () => {
        const table = loadTableFromHtml("subscriptions.simple.html");
        const rowCountBefore = table.querySelectorAll("tbody tr").length;

        aggregate(table, [], getAggregateInstructions(`
            PIVOTIFYJS_SUM:["Annual Cost"]
            PIVOTIFYJS_AVERAGE:["Annual Cost"]
        `));
        
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

describe("aggregateTable with groups", () => {
    it("adds subtotal rows for each group and a grand total row", () => {
        loadHtml("subscriptions.complex.html");

        const table = document.querySelector("table")!;
        expect(table).toBeDefined();

        const p = document.createElement("p");
        p.innerHTML = `
            PIVOTIFYJS_GROUPS:["Last Checked"]<br>
            PIVOTIFYJS_SUM:["Annual Cost"]<br>
            PIVOTIFYJS_AVERAGE:["Annual Cost"]
        `;
        table.parentNode?.insertBefore(p, table.nextSibling);

        const rowCountBefore = document.querySelectorAll("tbody tr").length;
        expect(rowCountBefore).toBe(9);

        processAllTables();

        const rowCountAfter = document.querySelectorAll("tbody tr").length;
        // There are 3 groups, so we expect to see 3 rows after transformation.
        expect(rowCountAfter).toEqual(3);
    });
});
