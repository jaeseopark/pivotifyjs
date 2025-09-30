import {
    SUM_KEYWORD,
    AVG_KEYWORD,
    MIN_KEYWORD,
    MAX_KEYWORD,
    MEDIAN_KEYWORD,
    FIRST_KEYWORD,
} from "@/constants.js";

type CellValue = string | number;

type AggregationSignature = {
    handler: ((values: CellValue[]) => CellValue) | ((values: number[]) => number);
    label: string; // what gets output in the individual cells
};

const AGGREGATION_SIGNATURE_MAP: { [keyword: string]: AggregationSignature } = {
    [SUM_KEYWORD]: {
        handler: (values: number[]) => values.reduce((a, b) => a + b, 0),
        label: "Sum"
    },
    [AVG_KEYWORD]: {
        handler: (values: number[]) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        label: "Avg"
    },
    [MIN_KEYWORD]: {
        handler: (values: number[]) => Math.min(...values),
        label: "Min"
    },
    [MAX_KEYWORD]: {
        handler: (values: number[]) => Math.max(...values),
        label: "Max"
    },
    [MEDIAN_KEYWORD]: {
        handler: (values: number[]) => {
            if (values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            // Split the array in halves and return the first item within the second array
            // TODO: make this logic more robust (null handling, etc.)
            return sorted.slice(mid)[0] as number;
        },
        label: "Median"
    },
    [FIRST_KEYWORD]: {
        handler: (values: CellValue[]) => {
            return values[0] ?? "";
        },
        label: "First"
    }
};

function getColumns(text: string, keyword: string): string[] {
    const match = text.match(new RegExp(`${keyword}:\\s*(\\[[^\\]]*\\])`));
    return match ? JSON.parse(match[1]!) : [];
}

function getGroups(text: string) {
    const match = text.match(/PIVOTIFYJS_GROUPS:\s*(\[[^\]]*\])/);
    return match ? JSON.parse(match[1]!) : [];
}

const getAggregations = (text: string): { [column: string]: AggregationSignature[] } => {
    return Object.entries(AGGREGATION_SIGNATURE_MAP).reduce((acc, [keyword, agg]) => {
        const cols = getColumns(text, keyword);
        cols.forEach(col => {
            acc[col] = acc[col] || [];
            acc[col].push(agg);
        });
        return acc;
    }, {} as { [column: string]: AggregationSignature[] });
};

class AggregationCoordinator {
    table: HTMLTableElement;
    groups: string[];
    aggregations: ReturnType<typeof getAggregations>;

    constructor(table: HTMLTableElement, text: string) {
        this.table = table;
        this.groups = getGroups(text);
        this.aggregations = getAggregations(text);
    }

    collapseTable() {
        // Implementation for building a collapsed table based on groups
    }

    appendSummaryRow() {
        const headers = Array.from(this.table.querySelectorAll("thead th")).map(th => th.textContent?.trim() ?? "");
        const rows = Array.from(this.table.querySelectorAll("tbody tr"));

        // Start by adding the summary row to the bottom
        const tbody = this.table.querySelector("tbody");
        const summaryRow = document.createElement("tr");
        headers.forEach(() => {
            summaryRow.appendChild(document.createElement("td"));
        });
        tbody?.appendChild(summaryRow);

        headers.forEach((header, colIdx) => {
            const aggSignatures = this.aggregations[header];
            if (!aggSignatures || aggSignatures.length === 0) return;

            // Gather values for this column
            const values = rows.map(row => {
                const cell = row.querySelectorAll("td")[colIdx];
                if (!cell) return "";
                const val = cell.textContent?.trim() ?? "";
                return isNaN(Number(val)) || val === "" ? val : Number(val);
            });

            // Apply all aggregation handlers and format output
            const aggResults = aggSignatures.map(signature => {
                const value = signature.handler(values as any);
                return `${signature.label}: ${value}`;
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
        }
        this.appendSummaryRow();
    }
}

export const aggregateTable = (table: HTMLTableElement, text: string) => {
    const coordinator = new AggregationCoordinator(table, text);
    coordinator.aggregate();
};
