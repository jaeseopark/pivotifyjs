// Summarization is a special type of aggregation that summarizes data without grouping (collapsing).

import { TableData } from "@/models/TableData";
import { ExtendedCellValue } from "@/models/ExtendedCellValue";
import { SummarizeInstruction } from "@/types";
import { groupInstructionsByColumn } from "./instructions";
import { AGGREGATION_SIGNATURE_MAP, assertNumericArray } from "@/aggregation/handlers";
import { formatNumericCellValue } from "@/utils";

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
    const groupedInstructions = groupInstructionsByColumn(summarizeInstructions);

    const missingColumns = Object.keys(groupedInstructions).filter(column => !(column in tableData.columns));
    if (missingColumns.length > 0) {
        throw new Error(
            `The following columns specified in summarization instructions do not exist in the table: '${missingColumns.join(", ")}'. Did you forget to include them in the GROUPS clause?`
        );
    }

    const summaryRow: ExtendedCellValue[] = [];

    const cells: ExtendedCellValue[] = Object.entries(tableData.columns).map(([columnName, colIdx]) => {
        if (columnName in groupedInstructions) {
            const instructions = groupedInstructions[columnName]!;
            const columnValues = tableData.getValues({ column: colIdx });

            assertNumericArray(columnValues, (details) => `Cannot summarize column '${columnName}' because it contains non-numeric values: ${details}.`);

            const summaryResults = instructions.map(instr => {
                const aggregator = AGGREGATION_SIGNATURE_MAP[instr];
                const aggResult = aggregator.handler(columnValues as number[]);
                return formatNumericCellValue({
                    value: aggResult, operator: instr, options: {
                        showOperatorLabel: true
                    }
                });
            }).filter(Boolean).join(", ");
            return new ExtendedCellValue({ resolvedValue: summaryResults });
        } else {
            return new ExtendedCellValue({ resolvedValue: "" });
        }
    });

    summaryRow.push(...cells);
    tableData.rows.push(summaryRow);

    table.innerHTML = tableData.getHtmlTableElement().innerHTML;
};
