# PivotifyJS

**PivotifyJS** brings spreadsheet-like pivot table features to plain HTML tables. It’s lightweight, dependency-free, and works right in the browser.

---

## 🚀 Getting Started

1. **Include the script**
    ```html
    <script src="https://cdn.jsdelivr.net/npm/pivotifyjs/dist/pivotifyjs.min.js"></script>
    ```

2. **Add a keyword block below your table**
    ```html
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Annual Cost</th>
            <th>Last Checked</th>
            <th>Business Use?</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Amazon Prime</td><td>120</td><td>2025</td><td>No</td></tr>
          <tr><td>Apple Music</td><td>204</td><td>2025</td><td>No</td></tr>
          <tr><td>AWS</td><td>25</td><td>2025</td><td>Yes</td></tr>
        </tbody>
      </table>
    </div>

    <p>
      PIVOTIFYJS_SUM:["Annual Cost"]<br>
      PIVOTIFYJS_AVERAGE:["Annual Cost"]<br>
      PIVOTIFYJS_MIN:["Annual Cost"]
    </p>
    ```
3. **The script does the rest**

You will see a new row added to the bottom of the table, with cell values like:  
`Sum: 349, Avg: 116.33, Min: 25`

---

## ✨ New Features

### 1. More Aggregation Operators
- **Supported:** `SUM`, `AVERAGE`, `MIN`, `MAX`, `MEDIAN`
- **Example:**
    ```html
    <p>
      PIVOTIFYJS_SUM:["Qty"]<br>
      PIVOTIFYJS_MIN:["Annual Cost"]<br>
      PIVOTIFYJS_MEDIAN:["Annual Cost"]
    </p>
    ```

### 2. Variable References in Computed Columns
- Reference other columns using `${Column Name}` syntax.
- **Example:**
    ```html
    <p>
      PIVOTIFYJS_COMPUTE:"Subtotal"="${Unit Cost} * ${Qty}"
    </p>
    ```
- Default values can be provided: `${Qty:1}`

### 3. Global Summary Aggregation
- If no group is specified, summary rows are added for the entire table.
- **Example:**
    ```html
    <p>
      PIVOTIFYJS_SUMMARY_SUM:["Annual Cost"]<br>
      PIVOTIFYJS_SUMMARY_AVERAGE:["Annual Cost"]
    </p>
    ```

### 4. Support for Merged Cells (`rowspan`/`colspan`)
- Tables with merged cells are automatically normalized.
- Column and row references work correctly even with merged cells.

### 5. Arithmetic Expressions in Cell Values
- Cells can contain arithmetic expressions (e.g., `0.50/2`), which are evaluated automatically.
- **Example:**
    ```html
    <td>0.50/2</td> <!-- Treated as 0.25 in calculations -->
    ```

---

## 🛡️ Input Validation & Precedence

- **Aggregation vs. Computation:**  
  Computed columns are processed before aggregation.  
  If both are specified, computed fields are available for aggregation.
- **Conflicting Instructions:**  
  If conflicting or duplicate instructions are given, the first valid instruction for each column/operator is used.
- **Variable References:**  
  If a referenced column does not exist, the value is treated as empty.
- **Merged Cells:**  
  All cells are expanded before any computation or aggregation, ensuring consistent behavior.

---

## Supported Keywords

See [`constants.ts`](src/constants.ts) for the full list.

---

## Example: Grocery Table with Expressions

```html
<table>
  <thead>
    <tr>
      <th>Item</th>
      <th>Unit Cost</th>
      <th>Quantity</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>onion</td>
      <td>0.58</td>
      <td>3</td>
      <td></td>
    </tr>
    <tr>
      <td>banana</td>
      <td>0.50/2</td>
      <td>5</td>
      <td></td>
    </tr>
  </tbody>
</table>
<p>
  PIVOTIFYJS_COMPUTE:"Subtotal"="${Unit Cost} * ${Quantity}"<br>
  PIVOTIFYJS_SUMMARY_AVERAGE:["Unit Cost"]
</p>
```

---

## 📚 More Examples

See the [`test/data`](test/data) folder for more sample tables and keyword blocks.
