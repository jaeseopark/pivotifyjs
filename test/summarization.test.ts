

import { getAggregateInstructions } from "@/aggregation";
import { loadTableFromHtml } from "./testUtils";
import { summarize } from "@/aggregation/summarization";
import { TableData } from "@/models/TableData";


describe("aggregateTable", () => {
    it("should add summary row with average and sum when no groups are specified", () => {
        const table = loadTableFromHtml("subscriptions.simple.html");
        const instructions = getAggregateInstructions(`
            PIVOTIFYJS_SUMMARY_SUM:["Annual Cost"]
            PIVOTIFYJS_SUMMARY_AVERAGE:["Annual Cost"]
        `, {
            isSummary: true
        });
        expect(instructions).toHaveLength(2);

        const rowCountBefore = table.querySelectorAll("tbody tr").length;

        summarize(table, instructions);

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


describe("summarizeTable", () => {
    it("should add summary row with average unit cost, handling arithmetic expressions", () => {
        const table = loadTableFromHtml("grocery.arithmetic.html");
        const instructions = getAggregateInstructions(`
            PIVOTIFYJS_SUMMARY_AVERAGE:["Unit Cost"]
        `, { isSummary: true });

        summarize(table, instructions);

        const tableData = new TableData(table);
        const unitCostIdx = tableData.columns["Unit Cost"];
        expect(unitCostIdx).toBeGreaterThan(-1);

        // The summary row should be the last row in tableData.rows
        const summaryRow = tableData.rows[tableData.rows.length - 1];
        const summaryCellValue = summaryRow[unitCostIdx].getValue();

        // 0.58 (onion) and 0.5/2 = 0.25 (banana), average = (0.58 + 0.25) / 2 = 0.415, keeping 2 decimal places = 0.42
        // since there is only 1 aggregation operator, the word "avg" will be omitted.
        expect(Number(summaryCellValue)).toBeCloseTo(0.42, 1);
    });
});
