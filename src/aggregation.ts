import {
    AggregateInstruction,
    AggregatorEnum,
} from "@/types";
import { addBlankRow, getAggregatedColumns, getBlankTable, populateHeaders } from "@/utils";

type CellValue = string | number;

// TODO: be able to customize this.
const DEFAULT_DECIMAL_PLACES = 2;

const AGGREGATION_SIGNATURE_MAP: {
    [key in Exclude<AggregatorEnum, AggregatorEnum.FIRST>]: {
        handler: (values: number[]) => number;
        label: string;
    };
} & {
    [AggregatorEnum.FIRST]: {
        handler: (values: CellValue[]) => CellValue;
        label: string;
    };
} = {
    [AggregatorEnum.SUM]: {
        handler: (values: number[]) => values.reduce((a, b) => a + b, 0),
        label: "Sum"
    },
    [AggregatorEnum.AVERAGE]: {
        handler: (values: number[]) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        label: "Avg"
    },
    [AggregatorEnum.MIN]: {
        handler: (values: number[]) => Math.min(...values),
        label: "Min"
    },
    [AggregatorEnum.MAX]: {
        handler: (values: number[]) => Math.max(...values),
        label: "Max"
    },
    [AggregatorEnum.MEDIAN]: {
        handler: (values: number[]) => {
            if (values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.slice(mid)[0] as number;
        },
        label: "Median"
    },
    [AggregatorEnum.FIRST]: {
        handler: (values: CellValue[]) => {
            return values[0] ?? "";
        },
        label: "First"
    }
};

type GetPivotIdReturnType = (allCellValues: CellValue[]) => {
    pivotId: string,
    distinctCellValues: CellValue[]
};

const getPivotIdGenerator = (pivots: string[], columnReverseMap: Map<string, number>): GetPivotIdReturnType => {
    return (allCellValues: CellValue[]) => {
        const distinctCellValues = pivots.map(pivot => {
            const colIdx = columnReverseMap.get(pivot);
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

const populateCell = (row: HTMLTableRowElement, column: { name: string, index: number }, rows: HTMLTableRowElement[], aggregations: {
    [column: string]: AggregatorEnum[]
}) => {
    const values = rows.map(row => {
        const cell = row.querySelectorAll("td")[column.index];
        if (!cell) return "";
        const val = cell.textContent?.trim() ?? "";
        return isNaN(Number(val)) || val === "" ? val : Number(val);
    });

    const aggregatorEnums = aggregations[column.name];
    if (!aggregatorEnums || aggregatorEnums.length === 0) return;

    // Apply all aggregation handlers and format output
    const aggResults = aggregatorEnums.map(aggregatorEnum => getAggregatedCellValue(aggregatorEnum, values));

    // Output the resulting values by joining with commas
    const summaryCell = row.querySelectorAll("td")[column.index];
    if (summaryCell) {
        summaryCell.textContent = aggResults.join(", ");
        console.debug(`Populated row["${column.name}"] with: ${summaryCell.textContent}`);
    }
};

class AggregationCoordinator {
    table: HTMLTableElement;
    aggregations: ReturnType<typeof groupInstructionsByColumn>;
    groups: string[];

    constructor(table: HTMLTableElement, instructions: AggregateInstruction[], pivotingGroups: string[]) {
        this.table = table;
        this.aggregations = groupInstructionsByColumn(instructions);
        this.groups = pivotingGroups;
    }

    collapseTable() {
        console.debug("collapsing table...");
        const rows = Array.from(this.table.querySelectorAll("tbody tr")) as HTMLTableRowElement[];
        const columnReverseMap = new Map(
            Array.from(this.table.querySelectorAll("thead th")).map((th, idx) => [th.textContent?.trim() ?? "", idx])
        );
        const getPivotId = getPivotIdGenerator(this.groups, columnReverseMap);

        // Group rows by the pivotId
        const groupedRows = rows.reduce((acc, row) => {
            const cells = row.querySelectorAll("td");
            const allCellValues = Array.from(cells).map(td => td.textContent?.trim() ?? "");
            const { pivotId, distinctCellValues } = getPivotId(allCellValues);

            acc[pivotId] = acc[pivotId] || { cellValues: distinctCellValues, rows: [] };
            acc[pivotId].rows.push(row);
            return acc;
        }, {} as {
            [pivotId: string]: {
                cellValues: CellValue[],
                rows: HTMLTableRowElement[],
            }
        });

        console.debug("Grouped Rows:", groupedRows);

        // construct a new table with grouped rows and aggregation results.
        const columns = [
            ...this.groups,
            ...Object.keys(this.aggregations)
        ]

        const newTable = getBlankTable();
        populateHeaders(newTable, columns);
        Object.values(groupedRows).forEach(({ cellValues: staticCellValues, rows }) => {
            addBlankRow(newTable);
            const newRow = newTable.querySelector("tbody tr:last-child")! as HTMLTableRowElement;

            // add static cell values (first few)
            console.log("Static Cell Values:", staticCellValues, "Number of rows in group:", rows.length);
            staticCellValues.forEach((val, idx) => {
                const cell = newRow.querySelectorAll("td")[idx];
                if (cell) {
                    cell.textContent = String(val);
                }
            });

            // Add aggregated cell values (remaining)
            Object.keys(this.aggregations).forEach((column, colIndexOffset) => {
                populateCell(newRow, { name: column, index: staticCellValues.length + colIndexOffset }, rows, this.aggregations);
            });
        });

        console.debug("New Table Constructed. New row count:", newTable.querySelectorAll("tbody tr").length);
        this.table.innerHTML = newTable.innerHTML;
    }

    appendSummaryRow() {
        const columns = Array.from(this.table.querySelectorAll("thead th")).map(th => th.textContent?.trim() ?? "");
        const rows = Array.from(this.table.querySelectorAll("tbody tr")) as HTMLTableRowElement[];

        // Start by adding the summary row to the bottom
        addBlankRow(this.table);

        // populate the row
        const summaryRow = this.table.querySelector("tbody tr:last-child")! as HTMLTableRowElement;
        columns.forEach((column, colIdx) => {
            populateCell(summaryRow, { name: column, index: colIdx }, rows, this.aggregations);
        });
    }

    aggregate() {
        if (Object.keys(this.aggregations).length === 0) {
            return;
        }

        if (this.groups.length > 0) {
            this.collapseTable();
        } else {
            this.appendSummaryRow();
        }
    }
}

export const aggregate = (table: HTMLTableElement, groups: string[], aggregateInstructions: AggregateInstruction[]) => {
    const coordinator = new AggregationCoordinator(table, aggregateInstructions, groups);
    coordinator.aggregate();
};
