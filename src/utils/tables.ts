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

/**
 * Adds a blank row to the table body.
 * The number of cells in the row matches the number of header columns.
 * Throws an error if the table does not have any headers.
 *
 * @param table - The HTMLTableElement to add the row to.
 */
export const addBlankRow = (table: HTMLTableElement): void => {
    const columnCount = table.querySelectorAll("thead th").length;
    if (columnCount === 0) {
        throw new Error("Table must have headers before adding rows.");
    }

    // Append a new blank row
    const tbody = table.querySelector("tbody");
    const newRow = document.createElement("tr");
    newRow.append(...Array.from({ length: columnCount }, () => document.createElement("td")));
    tbody?.appendChild(newRow);
};
