import { aggregateTable, appendComputedColumns } from "@/utils";


const processTable = (table: HTMLTableElement, p: HTMLParagraphElement): HTMLTableElement => {
    const text = p.innerHTML;

    const newTable = table.cloneNode(true) as HTMLTableElement;

    appendComputedColumns(newTable, text);
    aggregateTable(newTable, text);

    return newTable;
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

        // Replace the original table with the processed one.
        const processedTable = processTable(table, p);
        table.parentNode?.replaceChild(processedTable, table);

        // Remove the paragraph after processing.
        p.remove();
    });
}

document.addEventListener("DOMContentLoaded", processAllTables);
