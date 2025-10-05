// Summarization is a special type of aggregation that summarizes data without grouping (collapsing).

import { TableData } from "@/models/TableData";
import { SummarizeInstruction } from "@/types";

/**
 * Summarizes the data in the provided HTMLTableElement using the given summarize instructions.
 * Appends a summary row to the table based on the instructions.
 * The provided table element will be mutated to reflect the summary row.
 *
 * @param table - The HTMLTableElement to summarize.
 * @param summarizeInstructions - Array of summarization instructions. Assumed to be non-empty.
 */
export const summarize = (table: HTMLTableElement, summarizeInstructions: SummarizeInstruction[]) => {
    const tableData = new TableData(table);
    tableData.createSummaryRow(summarizeInstructions);
    table.innerHTML = tableData.getHtmlTableElement().innerHTML;
};
