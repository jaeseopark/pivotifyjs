import {
    AggregatorEnum,
} from "@/constants.js";

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

function getColumns(text: string, keyword: string): string[] {
    const match = text.match(new RegExp(`\\s*${keyword}:\\s*(\\[[^\\]]*\\])`));
    return match ? JSON.parse(match[1]!) : [];
}

function getGroups(text: string) {
    const match = text.match(/\s*PIVOTIFYJS_GROUPS:\s*(\[[^\]]*\])/);
    return match ? JSON.parse(match[1]!) : [];
}

type GetAggregationsReturnType = {
    aggregations: { [column: string]: AggregatorEnum[] },
    uniqueAggregatorEnums: Set<AggregatorEnum>
}

const getGroupIdGenerator = (groups: string[], columnReverseMap: Map<string, number>) => {
    return (cellValues: CellValue[]) => {
        return groups.map(group => {
            const colIdx = columnReverseMap.get(group);
            return colIdx !== undefined ? cellValues[colIdx] : "";
        }).join("||");
    };
};

export const getAggregations = (text: string): GetAggregationsReturnType => {
    return Object.values(AggregatorEnum).reduce((acc, aggregatorEnum) => {
        const cols = getColumns(text, aggregatorEnum);

        cols.forEach(col => {
            acc.aggregations[col] = acc.aggregations[col] || [];
            acc.aggregations[col].push(aggregatorEnum);

            acc.uniqueAggregatorEnums.add(aggregatorEnum);
        });

        return acc;
    }, {
        aggregations: {},
        uniqueAggregatorEnums: new Set()
    } as GetAggregationsReturnType);
};

/**
 * Constructs a new table element with <thead> and <tbody> sections.
 * All headers should be populated, but no rows are added yet.
 * @returns {HTMLTableElement} A blank HTML table element.
 */
export const getBlankTable = (): HTMLTableElement => {
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
};


/**
 * Populates the table header row with the given column names.
 * @param table - The HTMLTableElement to populate.
 * @param columns - Array of column names to use as headers.
 */
export const populateHeaders = (table: HTMLTableElement, columns: string[]) => {
    const thead = table.querySelector("thead");
    if (!thead) return;
    // Remove any existing header rows
    thead.innerHTML = "";
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
};


class AggregationCoordinator {
    table: HTMLTableElement;
    groups: string[];
    aggregations: ReturnType<typeof getAggregations>["aggregations"];

    constructor(table: HTMLTableElement, text: string) {
        this.table = table;
        this.groups = getGroups(text);
        const { aggregations, uniqueAggregatorEnums } = getAggregations(text);
        this.aggregations = aggregations;

        if (this.groups.length === 0 && uniqueAggregatorEnums.has(AggregatorEnum.FIRST)) {
            throw new Error("Aggregator 'FIRST' can only be used when grouping is enabled.");
        }
    }

    collapseTable() {
        const rows = Array.from(this.table.querySelectorAll("tbody tr")) as HTMLTableRowElement[];
        // Fix: use "th" not "td" for header cells
        const columnReverseMap = new Map(
            Array.from(this.table.querySelectorAll("thead th")).map((th, idx) => [th.textContent?.trim() ?? "", idx])
        );
        const groupIdGenerator = getGroupIdGenerator(this.groups, columnReverseMap);

        // Group rows by the groupId
        const groupedRows = rows.reduce((acc, row) => {
            const cells = row.querySelectorAll("td");
            const cellValues = Array.from(cells).map(td => td.textContent?.trim() ?? "");
            const groupId = groupIdGenerator(cellValues);

            acc[groupId] = acc[groupId] || { cellValues, rows: [] };
            acc[groupId].rows.push(row);
            return acc;
        }, {} as {
            [groupId: string]: {
                cellValues: CellValue[],
                rows: HTMLTableRowElement[],
            }
        });

        // construct a new table with grouped rows and aggregation results.
        const columns = [
            ...this.groups,
            ...Object.keys(this.aggregations)
        ]
        const newTable = getBlankTable();
        populateHeaders(newTable, columns);

        Object.values(groupedRows).forEach(({ cellValues: staticCellValues, rows }) => {
            const newRow = document.createElement("tr");
            const cellValues = [
                ...staticCellValues,
                // placeholder for aggregation results
            ]

            cellValues.forEach((value) => {
                const td = document.createElement("td");
                td.textContent = String(value);
                newRow.appendChild(td);
            });
        });

        this.table.replaceWith(newTable);
    }

    appendSummaryRow() {
        const columns = Array.from(this.table.querySelectorAll("thead th")).map(th => th.textContent?.trim() ?? "");
        const rows = Array.from(this.table.querySelectorAll("tbody tr"));

        // Start by adding the summary row to the bottom
        const tbody = this.table.querySelector("tbody");
        const summaryRow = document.createElement("tr");
        columns.forEach(() => {
            summaryRow.appendChild(document.createElement("td"));
        });
        tbody?.appendChild(summaryRow);

        columns.forEach((column, colIdx) => {
            const aggregatorEnums = this.aggregations[column];
            if (!aggregatorEnums || aggregatorEnums.length === 0) return;

            // Gather values for this column
            const values = rows.map(row => {
                const cell = row.querySelectorAll("td")[colIdx];
                if (!cell) return "";
                const val = cell.textContent?.trim() ?? "";
                return isNaN(Number(val)) || val === "" ? val : Number(val);
            });

            // Apply all aggregation handlers and format output
            const aggResults = aggregatorEnums.map((aggregatorEnum: AggregatorEnum) => {
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
            });

            // Output the resulting values by joining with commas
            const summaryCell = summaryRow.querySelectorAll("td")[colIdx];
            if (summaryCell) {
                summaryCell.textContent = aggResults.join(", ");
            }
        });
    }

    aggregate() {
        if (this.groups.length > 0) {
            this.collapseTable();
        } else {
            this.appendSummaryRow();
        }
    }
}

export const aggregateTable = (table: HTMLTableElement, text: string) => {
    const coordinator = new AggregationCoordinator(table, text);
    coordinator.aggregate();
};
