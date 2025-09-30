# PivotifyJS

**PivotifyJS** adds spreadsheet-like pivot table features directly to plain HTML tables. It’s lightweight, dependency-free, and works right in the browser.

---

## 🚀 Getting Started

1. Include the script
  ```html
  <script src="https://cdn.jsdelivr.net/npm/pivotifyjs/dist/pivotify.min.js"></script>
  ```

1. Add a keyword block below your table

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
    PIVOTIFYJS_AVG:["Annual Cost"]
  </p>
  ```
1. The script does the rest

You will see a new row get added to the bottom of the table, with the cell value of: "Sum: 349, Avg: 116.33"

---

## Supported Keywords

* `PIVOTIFYJS_SUM`
* `PIVOTIFYJS_AVG`
