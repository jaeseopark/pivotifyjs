export function aggregateColumn(table, colIndex) {
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const values = rows.map(row => {
        const cell = row.querySelectorAll("td")[colIndex];
        return parseFloat(cell.textContent.trim()) || 0;
    });
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    return { sum, avg };
}
