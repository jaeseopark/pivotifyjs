import { aggregateTable, appendComputedColumns } from "@/utils";


/**
 * Populates computed fields and aggregates the data.
 * Returns a new table DOM after processing. Returns undefined if no relevant instructions are found.
 *
 * @param table - The HTMLTableElement to process.
 * @param p - The HTMLParagraphElement containing instructions.
 * @returns {HTMLTableElement | undefined} The processed table element, or undefined if no instructions are found.
 */
const processTable = (table: HTMLTableElement, p: HTMLParagraphElement): HTMLTableElement | undefined => {
    const text = p.innerHTML;

    const newTable = table.cloneNode(true) as HTMLTableElement;

    const { canCompute, compute } = appendComputedColumns(newTable, text);
    const { canAggregate, aggregate } = aggregateTable(newTable, text);

    if (canCompute || canAggregate) {
        compute();
        aggregate();
        return newTable;
    }
};

const getSiblingParagraph = (table: HTMLTableElement): HTMLParagraphElement | null => {
    const candidates = [
        // <p> could be right next to the table or could be in the parent container.
        (table.parentNode as Element | null)?.nextElementSibling,
        table.nextElementSibling
    ]
    return candidates.find(candidate => candidate && candidate.tagName.toLowerCase() === "p") as HTMLParagraphElement | null;
};

export function processAllTables() {
    document.querySelectorAll("table").forEach(table => {
        const p = getSiblingParagraph(table);
        if (!p) {
            return;
        }

        const processedTable = processTable(table, p);
        if (processedTable) {
            table.replaceWith(processedTable);
            p.remove();
        }
    });
}

document.addEventListener("DOMContentLoaded", processAllTables);
