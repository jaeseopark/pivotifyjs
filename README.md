# PivotifyJS

**PivotifyJS** adds spreadsheet-like pivot table features directly to plain HTML tables. It’s lightweight, dependency-free, and works right in the browser.

---

## ✨ Features

- Works on existing HTML `<table>` elements — no special markup required.
- Add sums, averages, or both with a simple keyword next to your table.
- Automatically aligns results with the correct columns.
- Multiple tables on the same page supported.
- No build tools or frameworks needed — just drop in the script.

---

## 🚀 Getting Started

### 1. Include the script

```html
<script src="pivotify.min.js"></script>
```

### 2. Add a keyword block below your table

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

### 3. The script does the rest

---

## Supported Keywords

```
PIVOTIFYJS_SUM:["Column Name 1","Column Name 2"]
PIVOTIFYJS_AVG:["Column Name 1"]
```

---

## 📌 Roadmap

- Support min / max / median
- Group by column values (like spreadsheet pivot tables)
- Optional styling for summary rows

------

## 🤝 Contributing

Pull requests and issues are welcome!  
Please open an issue first if you’d like to discuss adding a major feature.

---
