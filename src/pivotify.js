import { aggregateColumn } from "./utils.js";
import { PIVOTIFYJS_SUM_KEYWORD, PIVOTIFYJS_AVG_KEYWORD } from "./constants.js";

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("p").forEach(p => {
        const text = p.innerHTML;

        const sumMatch = text.match(new RegExp(`${PIVOTIFYJS_SUM_KEYWORD}:\\s*(\\[[^\\]]*\\])`));
        const avgMatch = text.match(new RegExp(`${PIVOTIFYJS_AVG_KEYWORD}:\\s*(\\[[^\\]]*\\])`));

        const sumCols = sumMatch ? JSON.parse(sumMatch[1]) : [];
        const avgCols = avgMatch ? JSON.parse(avgMatch[1]) : [];

        if (sumCols.length === 0 && avgCols.length === 0) return;

        let table = p.previousElementSibling;
        while (table && table.tagName.toLowerCase() !== "table") {
            table = table.querySelector("table") || table.previousElementSibling;
        }
        if (!table) return;

        const headers = Array.from(table.querySelectorAll("thead th")).map(th =>
            th.textContent.trim()
        );

        const newRow = document.createElement("tr");
        headers.forEach((header, colIndex) => {
            const td = document.createElement("td");
            let parts = [];

            if (sumCols.includes(header)) {
                const { sum } = aggregateColumn(table, colIndex);
                parts.push(`Sum=${sum}`);
            }
            if (avgCols.includes(header)) {
                const { avg } = aggregateColumn(table, colIndex);
                parts.push(`Avg=${avg.toFixed(2)}`);
            }

            td.textContent = parts.join(", ");
            newRow.appendChild(td);
        });

        table.querySelector("tbody").appendChild(newRow);

        // 🔹 Cleanup: remove the keywords from the document
        p.remove();
    });
});
