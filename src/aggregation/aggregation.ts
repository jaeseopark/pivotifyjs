import {
    AggregateInstruction,
    AggregateOperator
} from "@/types";
import { SUMMARY_PREFIX } from "@/constants";
import { getAggregatedColumns } from "@/utils";
import { TableData } from "@/models/TableData";
import { collapseTable } from "@/aggregation/collapse";
import { groupInstructionsByColumn } from "@/aggregation/instructions";

export const getAggregateInstructions = (text: string, {
    isSummary = false
}): AggregateInstruction[] => {
    return Object.values(AggregateOperator).reduce((acc, aggregatorEnum) => {
        getAggregatedColumns(text, aggregatorEnum, {
            isSummary
        }).forEach(column => {
            acc.push({ column, operator: aggregatorEnum });
        });

        return acc;
    }, [] as AggregateInstruction[]);
};

/**
 * Aggregates the given HTMLTableElement by the specified groups and instructions.
 * Mutates the table's HTML to reflect the aggregated result.
 * Throws if no groups are specified.
 *
 * @param table - The HTMLTableElement to aggregate.
 * @param groups - Array of column names to group by.
 * @param aggregateInstructions - Array of aggregation instructions.
 */
export const aggregate = (
    table: HTMLTableElement,
    groups: string[],
    aggregateInstructions: AggregateInstruction[]
) => {
    const tableData = new TableData(table);
    const aggregations = groupInstructionsByColumn(aggregateInstructions);

    if (Object.keys(aggregations).length === 0) {
        return;
    }

    if (groups.length === 0) {
        throw new Error(`At least one pivoting group must be specified for aggregation. If you want just the summary row, use ${SUMMARY_PREFIX}_* instructions instead.`);
    }

    const newTableData = collapseTable(tableData, groups, aggregations);
    table.innerHTML = newTableData.getHtmlTableElement().innerHTML;
};
