import { DEFAULT_DECIMAL_PLACES } from "@/constants";
import { AGGREGATION_SIGNATURE_MAP } from "@/declarations";
import { TableData, ExtendedCellValue } from "@/models/TableData";
import { AggregatorEnum, CellValue } from "@/types";


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


const getAggregatedCellValue = (aggregatorEnum: AggregatorEnum, values: CellValue[]) => {
    const validValues = values.filter(v => typeof v === "number" && !isNaN(v)) as number[];
    if (validValues.length === 0) {
        return `${AGGREGATION_SIGNATURE_MAP[aggregatorEnum].label}: N/A`;
    }

    let aggResult: CellValue = AGGREGATION_SIGNATURE_MAP[aggregatorEnum].handler(validValues);

    let stringifiedResult: string;
    if (typeof aggResult === "number") {
        // TODO: be able to customize decimal places.
        stringifiedResult = aggResult.toFixed(DEFAULT_DECIMAL_PLACES);
        if (stringifiedResult.endsWith(".00")) {
            stringifiedResult = stringifiedResult.slice(0, -3);
        }
    } else {
        stringifiedResult = String(aggResult);
    }

    return `${AGGREGATION_SIGNATURE_MAP[aggregatorEnum].label}: ${stringifiedResult}`;
}


/**
 * Collapses the table by the specified group columns and returns a new TableData object.
 * The original TableData object remains unchanged.
 * Each group is aggregated according to the aggregation instructions.
 *
 * @param tableData - The source TableData object to collapse.
 * @returns {TableData} A new TableData object representing the grouped and aggregated table.
 */
export function collapseTable(tableData: TableData, groups: string[], aggregations: { [column: string]: AggregatorEnum[] }): TableData {
    const columns = [...groups, ...Object.keys(aggregations)];
    const columnReverseMap = tableData.columns;
    const getPivotId = getPivotIdGenerator(groups, columnReverseMap);

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
        Object.keys(aggregations).forEach((column) => {
            const values = rowIndices.map(rowIdx => tableData.getCell({ rowIdx, col: column }).getValue());
            const aggResults = (aggregations[column] || []).map(aggregatorEnum => getAggregatedCellValue(aggregatorEnum, values));
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
