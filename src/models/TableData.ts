import { CellValue } from "@/types";

type ExtendedCellValueProps = { resolvedValue: CellValue } | { unresolvedValue: string, substitute: () => string }

export class ExtendedCellValue {
    private value: CellValue;
    private isResolved: boolean;
    private substitute?: () => string;

    constructor(props: ExtendedCellValueProps) {
        if ('resolvedValue' in props) {
            this.value = props.resolvedValue;
            this.isResolved = true;
        } else {
            var { unresolvedValue, substitute } = props;
            this.value = unresolvedValue;
            this.isResolved = false;
            this.substitute = substitute;
        }

    }

    /**
     * Resolves the cell value by substituting variable references and evaluating expressions.
     * Assumption: this method is called only if the value is not yet resolved, which implies that the substitute function is defined.
     * @returns The resolved cell value as a string or number.
     */
    private resolve(): CellValue {
        let val = this.value as string; // unresolved value is always a string
        if (val.match(/\$\{[^}]+\}/)) {
            val = this.substitute?.() as string;
        }

        try {
            // unresolved value could be a string representation of a numeric expression.
            val = eval(val);
        } catch (e) {
            // swallow
        }

        return val;
    }

    /**
     * Returns the resolved value, substituting variable references and caching the result.
     */
    getValue(): CellValue {
        if (!this.isResolved) {
            this.value = this.resolve();
            this.isResolved = true;
        }
        return this.value;
    }
}

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

            this.rows = Array.from(table.querySelectorAll("tbody tr")).map((row, rowIdx) =>
                Array.from(row.querySelectorAll("td")).map((td, colIdx, arr) => {
                    // Provide a substitute function for variable references
                    return new ExtendedCellValue({
                        unresolvedValue: td.textContent?.trim() ?? "",
                        substitute: () => {
                            let val = td.textContent?.trim() ?? "";
                            val = val.replace(/\$\{([^}]+)\}/g, (_, columnName) => {
                                const colIdx = this.columns[columnName.trim()]!;
                                if (colIdx === undefined) {
                                    console.debug(`Column '${columnName}' not found for substitution.`);
                                    return "";
                                }

                                return String(this.getValue({ cell: this.getCell({ rowIdx, col: colIdx }) }));
                            });
                            return val;
                        }
                    });
                })
            );
        }
    }

    getCell({ rowIdx, col }: { rowIdx: number, col: string | number }): ExtendedCellValue {
        const row = this.rows[rowIdx]!;
        const colIdx = typeof col === "string" ? this.columns[col] : col;
        return row[colIdx!]!;
    }

    getValue({ cell }: { cell: ExtendedCellValue }): CellValue {
        return cell.getValue();
    }

    getValues(props: { rowIdx: number } | { colIdx: number }): CellValue[] {
        if ("rowIdx" in props) {
            return this.rows[props.rowIdx]!.map(cell => cell.getValue());
        } else {
            return this.rows.map(row => row[props.colIdx]!.getValue());
        }
    }

    clone(): TableData {
        return new TableData(this.getHtmlTableElement());
    }

    createRow() {
        const newRow: ExtendedCellValue[] = [];
        this.rows.push(newRow);
        return newRow;
    }

    getHtmlTableElement(): HTMLTableElement {
        const thead = `<thead><tr>${Object.keys(this.columns).map(col => `<th>${col}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${this.rows.map(row => `<tr>${row.map(cell => `<td>${cell.getValue()}</td>`).join("")}</tr>`).join("")}</tbody>`;

        const table = document.createElement("table");
        table.innerHTML = thead + tbody;
        return table;
    }
}
