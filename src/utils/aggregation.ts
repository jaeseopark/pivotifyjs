import {
    SUM_KEYWORD,
    AVG_KEYWORD,
    MIN_KEYWORD,
    MAX_KEYWORD,
    MEDIAN_KEYWORD,
    FIRST_KEYWORD,
    COMPUTE_KEYWORD
} from "@/constants.js";

type CellValue = string | number;
type Aggregation = {
    handler: (values: CellValue[]) => number | string;
}

const AGGREGATIONS = {
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
            return sorted.length % 2 === 1
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
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

function getAggregations(text: string) {
    return {
        sumCols: getColumns(text, SUM_KEYWORD),
        avgCols: getColumns(text, AVG_KEYWORD),
        minCols: getColumns(text, MIN_KEYWORD),
        maxCols: getColumns(text, MAX_KEYWORD),
        medianCols: getColumns(text, MEDIAN_KEYWORD),
        firstCols: getColumns(text, FIRST_KEYWORD)
    };
}

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
        // Implementation for appending a summary row
    }

    aggregate() {
        if (this.groups.length > 0) {
            // If there are groups, we are in collapsed mode
            this.collapseTable();
        } else {
            // If there are no groups, we are in append mode
            this.appendSummaryRow();
        }
    }
}

export const aggregateTable = (table: HTMLTableElement, text: string) => {
    const coordinator = new AggregationCoordinator(table, text);
    coordinator.aggregate();
};
