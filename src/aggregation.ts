import {
    AggregateInstruction,
    AggregatorEnum,
    CellValue
} from "@/types";
import { getAggregatedColumns } from "@/utils";
import { ExtendedCellValue, TableData } from "@/models/TableData";
import { AGGREGATION_SIGNATURE_MAP } from "@/declarations";

// TODO: be able to customize this.
const DEFAULT_DECIMAL_PLACES = 2;

type GetPivotIdReturnType = (allCellValues: CellValue[]) => {
    pivotId: string,
    distinctCellValues: CellValue[]
};

const getPivotIdGenerator = (pivots: string[], columnReverseMap: { [column: string]: number }): GetPivotIdReturnType => {
    return (allCellValues: CellValue[]) => {
        const distinctCellValues = pivots.map(pivot => {
            const colIdx = columnReverseMap[pivot];
            if (colIdx === undefined) {
                return "";
            }
            return allCellValues[colIdx] as CellValue;
        });

        const pivotId = distinctCellValues.join("||");

        return {
            pivotId,
            distinctCellValues
        }
    };
};

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

const getAggregatedCellValue = (aggregatorEnum: AggregatorEnum, values: CellValue[]) => {
    let aggResult: CellValue;
    if (aggregatorEnum === AggregatorEnum.FIRST) {
        aggResult = AGGREGATION_SIGNATURE_MAP[aggregatorEnum].handler(values);
    } else {
        aggResult = AGGREGATION_SIGNATURE_MAP[aggregatorEnum].handler(values as number[]);
    }

    let stringifiedResult: string;
    if (typeof aggResult === "number") {
        stringifiedResult = aggResult.toFixed(DEFAULT_DECIMAL_PLACES);
        if (stringifiedResult.endsWith(".00")) {
            stringifiedResult = stringifiedResult.slice(0, -3);
        }
    } else {
        stringifiedResult = String(aggResult);
    }

    return `${AGGREGATION_SIGNATURE_MAP[aggregatorEnum].label}: ${stringifiedResult}`;
}

const populateCell = (row: HTMLTableRowElement, values: CellValue[], aggregatorEnums: AggregatorEnum[], targetColIdx: number) => {
    if (!aggregatorEnums || aggregatorEnums.length === 0) return;

    // Apply all aggregation handlers and format output
    const aggResults = aggregatorEnums.map(aggregatorEnum => getAggregatedCellValue(aggregatorEnum, values));

    // Output the resulting values by joining with commas
    const summaryCell = row.querySelectorAll("td")[targetColIdx];
    if (summaryCell) {
        summaryCell.textContent = aggResults.join(", ");
    }
};

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

    /**
     * Collapses the table by the specified group columns and returns a new TableData object.
     * The original TableData object remains unchanged.
     * Each group is aggregated according to the aggregation instructions.
     *
     * @param tableData - The source TableData object to collapse.
     * @returns {TableData} A new TableData object representing the grouped and aggregated table.
     */
    collapseTable(tableData: TableData): TableData {
        const columns = [...this.groups, ...Object.keys(this.aggregations)];
        const columnReverseMap = tableData.columns;
        const getPivotId = getPivotIdGenerator(this.groups, columnReverseMap);

        const grouped = tableData.rows.reduce((acc, row, rowIdx) => {
            const cellValues = tableData.getValues({ rowIdx });
            const { pivotId, distinctCellValues } = getPivotId(cellValues);
            if (!acc[pivotId]) {
                acc[pivotId] = { cellValues: distinctCellValues, rowIndices: [] };
            }
            acc[pivotId].rowIndices.push(rowIdx);
            return acc;
        }, {} as { [pivotId: string]: { cellValues: CellValue[], rowIndices: number[] } });

        const newRows: CellValue[][] = [];

        Object.values(grouped).forEach(({ cellValues, rowIndices }) => {
            const row: CellValue[] = [];
            cellValues.forEach((val) => {
                row.push(val);
            });
            Object.keys(this.aggregations).forEach((column) => {
                const values = rowIndices.map(rowIdx => tableData.getCell({ rowIdx, col: column }).getValue());
                const aggResults = (this.aggregations[column] || []).map(aggregatorEnum => getAggregatedCellValue(aggregatorEnum, values));
                row.push(aggResults.join(", "));
            });
            newRows.push(row);
        });

        const newTableData = new TableData();
        newTableData.columns = columns.reduce((acc, name, idx) => {
            acc[name] = idx;
            return acc;
        }, {} as { [name: string]: number });
        newTableData.rows = newRows.map(rowArr =>
            rowArr.map(val => new ExtendedCellValue({ unresolvedValue: String(val) }))
        );

        return newTableData;
    }

    aggregate() {
        if (Object.keys(this.aggregations).length === 0) {
            return;
        }

        let tableData = this.tableData;

        if (this.groups.length > 0) {
            tableData = this.collapseTable(tableData);
        }

        if (this.summaryInstructions.length > 0) {
            // TODO implement
            tableData.createSummaryRow([]);
        }

        this.table.innerHTML = tableData.getInnerHtml();
    }
}

export const aggregate = (table: HTMLTableElement, groups: string[], aggregateInstructions: AggregateInstruction[]) => {
    const coordinator = new AggregationCoordinator(table, aggregateInstructions, groups);
    coordinator.aggregate();
};
