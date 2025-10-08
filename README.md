# PivotifyJS

**PivotifyJS** brings spreadsheet-like pivot table features to plain HTML tables.

---

## 🚀 Getting Started

1. **Include the script**
    ```html
    <script src="https://cdn.jsdelivr.net/npm/pivotifyjs/dist/pivotifyjs.min.js"></script>
    ```

2. **Add an instruction block below your table**

    ### Example: Grocery Table with Grouping and Expressions

    ```html
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Item</th>
          <th>Unit Cost</th>
          <th>Quantity</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Produce</td>
          <td>onion</td>
          <td>0.58</td>
          <td>3</td>
          <td></td>
        </tr>
        <tr>
          <td>Produce</td>
          <td>banana</td>
          <td>0.50/2</td>
          <td>5</td>
          <td></td>
        </tr>
        <tr>
          <td>Dairy</td>
          <td>milk</td>
          <td>2.99</td>
          <td>1</td>
          <td></td>
        </tr>
        <tr>
          <td>Dairy</td>
          <td>cheese</td>
          <td>4.50</td>
          <td>2</td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <p>
      PIVOTIFYJS_COMPUTE:"Subtotal"="${Unit Cost} * ${Quantity}"<br>
      PIVOTIFYJS_GROUPS:["Category"]<br>
      PIVOTIFYJS_SUM:["Subtotal"]<br>
      PIVOTIFYJS_SUMMARY_SUM:["Subtotal"]
    </p>
    ```

3. **Script does the rest**

You will see summary rows added for each group and the grand total row at the bottom of the table:

**Sample Output:**

|Category|Subtotal|
|---|---|
| Produce |2.99
| Dairy | 11.99
| | **Sum: 14.98**

---

## 🗂️ Terminologies

- **Instructions Block:**  
  The text block below your table containing special keywords (e.g., `PIVOTIFYJS_SUM`, `PIVOTIFYJS_COMPUTE`).  
  This block tells PivotifyJS how to process your table.

- **Instruction Types:**  
  1. **Compute Instructions:**  
     Create new columns by performing calculations or referencing other columns (e.g., `PIVOTIFYJS_COMPUTE:"Subtotal"="${Unit Cost} * ${Qty}"`).
  2. **Aggregate Instructions (Group-level):**  
     Summarize data within groups (e.g., `PIVOTIFYJS_GROUPS:["Category"]` and `PIVOTIFYJS_SUM:["Subtotal"]`).
  3. **Styling Instructions:**  
     Apply styles such as color gradients to table cells based on their values (see below).
  4. **Global Summary Instructions:**  
     Add summary rows to the bottom of the table, often for grand totals or overall statistics (e.g., `PIVOTIFYJS_SUMMARY_SUM:["Subtotal"]`).  
     These work similarly to aggregate instructions but apply to the whole table.

---

## 📝 Syntax

All instructions must be placed directly below the table to be processed.

### 1. Compute Instructions

- **Syntax:**  
  ```
  PIVOTIFYJS_COMPUTE:"NewField"="Equation"
  ```
  - `"NewField"`: The name of the new computed column (in quotes).
  - `"Equation"`: The formula or expression to compute (in quotes).
  - Reference other columns using `${ColumnName}` syntax.
  - Arithmetic operations (e.g., `+`, `-`, `*`, `/`) are supported.
  - Simple string manipulations (e.g., concatenation) are also supported:  
    ```
    PIVOTIFYJS_COMPUTE:"Full Name"="${First} ${Last}"
    ```
  - Multiple compute instructions can be provided.  
    If there is interdependency between computed fields, the order of instructions matters.

### 2. Aggregation Instructions

- **Grouping Clause:**  
  Aggregation requires both a group clause and one or more operator clauses.
  - **Syntax:**  
    ```
    PIVOTIFYJS_GROUPS:["Col1", "Col2"]
    ```
    - List all column names to group by, as a JavaScript-style array of strings.
    - Only one group clause can be supplied.
    - All rows sharing the same values for the listed columns will be grouped together.

- **Operator Clauses:**  
  For each aggregation operator, specify the columns to aggregate.
  - **Syntax:**  
    ```
    PIVOTIFYJS_SUM:["Subtotal"]
    PIVOTIFYJS_MIN:["Unit Cost"]
    PIVOTIFYJS_MAX:["Quantity"]
    ```
    - Each operator (e.g., `SUM`, `MIN`, `MAX`, `AVERAGE`, `MEDIAN`) is specified on its own line.
    - Multiple operator instructions can be provided.

### 3. Gradient Styling Instructions

- **Syntax:**  
  ```
  PIVOTIFYJS_STYLE_GRADIENT:"ColumnName"="from:color1;to:color2;target:bg"
  ```
  - `"ColumnName"`: The column to apply the gradient to (in quotes).
  - `from`: The color for the lowest value (any valid CSS color).
  - `to`: The color for the highest value (any valid CSS color).
  - `target`: `"bg"`/`"background"` for background color, `"text"` for text color (optional, default is `"background"`).

  Note only one of `from` and `to` is required. The other will default to `transparent`.

  **Example:**
  ```html
  <p>
    PIVOTIFYJS_STYLE_GRADIENT:"Cost"="from:green;to:red"
  </p>
  ```

  This will color the cells in the "Cost" column from green (lowest value) to red (highest value).

  **Result:**
  ```html
  <td style="background-color: rgb(0, 128, 0);">25</td>
  <td style="background-color: rgb(135, 60, 0);">120</td>
  <td style="background-color: rgb(255, 0, 0);">204</td>
  ```

### 4. Summary Instructions

- **Syntax:**  
  ```
  PIVOTIFYJS_SUMMARY_SUM:["Subtotal"]
  PIVOTIFYJS_SUMMARY_AVERAGE:["Unit Cost"]
  ```
  - Similar to aggregation instructions, but summary rows are added to the bottom of the table.
  - Multiple summary operators can be provided.

---

## 🧩 Additional Features

- **Support for Merged Cells:**  
  Tables using `rowspan` and `colspan` are automatically normalized.  
  Column and row references work correctly, even with merged cells.
