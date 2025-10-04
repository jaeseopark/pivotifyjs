import {
    AggregateInstruction,
    AggregatorEnum
} from "@/types";
import { getAggregatedColumns } from "@/utils";
import { TableData } from "@/models/TableData";
import { collapseTable } from "@/aggregation/collapse";

export const getAggregateInstructions = (text: string): AggregateInstruction[] => {
    return Object.values(AggregatorEnum).reduce((acc, aggregatorEnum) => {
        getAggregatedColumns(text, aggregatorEnum).forEach(column => {
            acc.push({ column, aggregator: aggregatorEnum });
        });

        return acc;
    }, [] as AggregateInstruction[]);
};

export const groupInstructionsByColumn = (instructions: AggregateInstruction[]): {
    [column: string]: AggregatorEnum[]
} => {
    return instructions.reduce((acc, instr) => {
        acc[instr.column] = acc[instr.column] || [];
        if (!acc[instr.column]!.includes(instr.aggregator)) {
            acc[instr.column]!.push(instr.aggregator);
        }
        return acc;
    }, {} as { [column: string]: AggregatorEnum[] });
}


class AggregationCoordinator {
    table: HTMLTableElement;
    aggregations: ReturnType<typeof groupInstructionsByColumn>;
    summaryInstructions: number[] = []; // TODO implement
    groups: string[];
    tableData: TableData;

    constructor(table: HTMLTableElement, instructions: AggregateInstruction[], pivotingGroups: string[]) {
        this.table = table;
        this.tableData = new TableData(table);
        this.aggregations = groupInstructionsByColumn(instructions);
        this.groups = pivotingGroups;
    }


    aggregate() {
        if (Object.keys(this.aggregations).length === 0) {
            return;
        }

        let tableData = this.tableData;

        if (this.groups.length > 0) {
            tableData = collapseTable(tableData, this.groups, this.aggregations);
        }

        if (this.summaryInstructions.length > 0) {
            // TODO implement
            tableData.createSummaryRow([]);
        }

        this.table.innerHTML = tableData.getHtmlTableElement().innerHTML;
    }
}

export const aggregate = (table: HTMLTableElement, groups: string[], aggregateInstructions: AggregateInstruction[]) => {
    const coordinator = new AggregationCoordinator(table, aggregateInstructions, groups);
    coordinator.aggregate();
};
