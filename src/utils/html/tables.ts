/**
 * Expands colspan and rowspan attributes in an HTML table so that column and row references work correctly.
 * After expansion, all cells are represented explicitly, and colspan/rowspan attributes are removed.
 *
 * @param table - The HTMLTableElement to sanitize.
 */
export function expandColspanRowspan(table: HTMLTableElement): void {
    const rows = Array.from(table.querySelectorAll("tr"));
    const matrix: HTMLTableCellElement[][] = [];

    rows.forEach((row, rowIdx) => {
        const cells = Array.from(row.children) as HTMLTableCellElement[];
        let colIdx = 0;
        matrix[rowIdx] = matrix[rowIdx] || [];
        cells.forEach(cell => {
            while (matrix[rowIdx][colIdx]) colIdx++;
            const colspan = Number(cell.getAttribute("colspan") || 1);
            const rowspan = Number(cell.getAttribute("rowspan") || 1);

            for (let r = 0; r < rowspan; r++) {
                for (let c = 0; c < colspan; c++) {
                    const targetRow = rowIdx + r;
                    const targetCol = colIdx + c;
                    matrix[targetRow] = matrix[targetRow] || [];
                    matrix[targetRow][targetCol] = cell;
                }
            }
            colIdx += colspan;
        });
    });

    matrix.forEach((rowCells, rowIdx) => {
        const row = rows[rowIdx];
        while (row.firstChild) row.removeChild(row.firstChild);
        rowCells.forEach(cell => {
            // Only append the first occurrence of each cell
            if (cell.parentElement !== row) {
                row.appendChild(cell.cloneNode(true));
            }
        });
    });
}
