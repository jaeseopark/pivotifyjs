import {
    SUM_KEYWORD,
    AVG_KEYWORD,
    MIN_KEYWORD,
    MAX_KEYWORD,
    MEDIAN_KEYWORD,
    FIRST_KEYWORD,
    COMPUTE_KEYWORD
} from "./constants.js";

const AGGREGATIONS = {
    [SUM_KEYWORD]: {
        handler: (values) => values.reduce((a, b) => a + b, 0),
        label: "Sum"
    },
    [AVG_KEYWORD]: {
        handler: (values) => values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        label: "Avg"
    },
    [MIN_KEYWORD]: {
        handler: (values) => Math.min(...values),
        label: "Min"
    },
    [MAX_KEYWORD]: {
        handler: (values) => Math.max(...values),
        label: "Max"
    },
    [MEDIAN_KEYWORD]: {
        handler: (values) => {
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
        handler: (values, rawCells) => {
            // rawCells is an array of cell elements for the column
            if (rawCells && rawCells.length > 0) {
                return rawCells[0].textContent.trim();
            }
            return "";
        },
        label: "First"
    }
};

function getColumns(text, keyword) {
    const match = text.match(new RegExp(`${keyword}:\\s*(\\[[^\\]]*\\])`));
    return match ? JSON.parse(match[1]) : [];
}

export function getGroups(text) {
    const match = text.match(/PIVOTIFYJS_GROUPS:\s*(\[[^\]]*\])/);
    return match ? JSON.parse(match[1]) : [];
}

export function getAggregations(text) {
    return {
        sumCols: getColumns(text, SUM_KEYWORD),
        avgCols: getColumns(text, AVG_KEYWORD),
        minCols: getColumns(text, MIN_KEYWORD),
        maxCols: getColumns(text, MAX_KEYWORD),
        medianCols: getColumns(text, MEDIAN_KEYWORD),
        firstCols: getColumns(text, FIRST_KEYWORD)
    };
}
