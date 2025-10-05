import { CellValue } from "@/types";
import { ExtendedCellValue } from "@/models";

export class TableData {
    columns: { [name: string]: number } = {};
    rows: ExtendedCellValue[][] = [];

    constructor(table?: HTMLTableElement) {
        if (table) {
            this.columns = Array.from(table.querySelectorAll("thead th"))
                .map(th => th.textContent?.trim() ?? "")
                .reduce((acc, name, idx) => {
                    acc[name] = idx;
                    return acc;
                }, {} as { [name: string]: number });

            this.rows = Array.from(table.querySelectorAll("tbody tr")).map((row, rowIdx) => {
                const getSubstituteFunction = (unresolvedValue: string) => () => {
                    let val = unresolvedValue;
                    val = val.replace(/\$\{([^}]+)\}/g, (_, columnName) => {
                        const colIdx = this.columns[columnName.trim()]!;
                        if (colIdx === undefined) {
                            console.debug(`Column '${columnName}' not found for substitution.`);
                            return "";
                        }

                        return String(this.getCell({ rowIdx, col: colIdx }).getValue());
                    });
                    return val;
                }

                // firstFew: create ExtendedCellValue objects for each <td> in the row, with substitution logic
                const firstFew = Array.from(row.querySelectorAll("td")).map((td) => {
                    const unresolvedValue = td.textContent?.trim() ?? "";
                    return new ExtendedCellValue({
                        unresolvedValue,
                        substitute: getSubstituteFunction(unresolvedValue)
                    });
                });

                // Ensure each row has the same number of cells as columns; fill missing cells with empty ExtendedCellValue
                const filled = Array.from({ length: Object.keys(this.columns).length })
                    .map((_, colIdx) => firstFew[colIdx] ?? new ExtendedCellValue(
                        {
                            unresolvedValue: "",
                            substitute: getSubstituteFunction("")
                        }));

                return filled;
            });
        }
    }

    private getCell({ rowIdx, col }: { rowIdx: number, col: string | number }): ExtendedCellValue {
        const row = this.rows[rowIdx]!;
        const colIdx = typeof col === "string" ? this.columns[col] : col;
        return row[colIdx!]!;
    }

    getValue({ row, col }: { row: ExtendedCellValue[] | number, col: string | number }): CellValue {
        // Resolve row index and column index
        const rowArr = Array.isArray(row) ? row : this.rows[row]!;
        const colIdx = typeof col === "string" ? this.columns[col] : col;
        return rowArr[colIdx!]!.getValue();
    }

    getValues(props: { row: ExtendedCellValue[] | number } | { column: string | number }): CellValue[] {
        if ("row" in props) {
            const cells = Array.isArray(props.row) ? props.row : this.rows[props.row]!;
            return cells.map(cell => cell.getValue());
        } else {
            return this.rows.map((row) => {
                const colIdx = typeof props.column === "string" ? this.columns[props.column] : props.column;
                return row[colIdx!]!.getValue();
            });
        }
    }

    clone(): TableData {
        return new TableData(this.getHtmlTableElement());
    }

    getHtmlTableElement(): HTMLTableElement {
        const thead = `<thead><tr>${Object.keys(this.columns).map(col => `<th>${col}</th>`).join("")}</tr></thead>`;
        // Note: should have to put || "" after calling getValue() here. probably a bug somewhere.
        const tbody = `<tbody>${this.rows.map(row => `<tr>${row.map(cell => `<td>${cell.getValue() || ""}</td>`).join("")}</tr>`).join("")}</tbody>`;

        const table = document.createElement("table");
        table.innerHTML = thead + tbody;
        return table;
    }
}
