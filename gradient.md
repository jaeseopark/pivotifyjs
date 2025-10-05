## 🎨 Conditional Formatting: Color Gradients (Google Sheets Inspiration)

PivotifyJS is inspired by spreadsheet features like Google Sheets' conditional formatting with color gradients. Below is a detailed breakdown of how this feature works in Google Sheets and how it can enhance data visualization.

---

### 1. What is Color Gradient Conditional Formatting?

Color gradient conditional formatting allows you to visually highlight data trends by applying a spectrum of colors to cell backgrounds or text, based on the relative values of the cells. This technique helps users quickly identify patterns, outliers, and ranges in their data.

---

### 2. Step-by-Step: How It Works in Google Sheets (with Pseudo TypeScript)

#### Step 1: Select Your Data Range

Choose the cells you want to apply the color gradient to.

```typescript
// Select all cells in column "Sales"
const cells = getColumnCells("Sales");
```

#### Step 2: Open Conditional Formatting

Open the formatting dialog (in code, this would be configuring the formatting parameters).

```typescript
const formattingParams = {
  style: "colorScale", // or "background" | "text"
  range: cells
};
```

#### Step 3: Choose "Color Scale" Formatting

Specify that you want to use a color scale.

```typescript
formattingParams.type = "colorScale";
```

#### Step 4: Configure the Color Scale

Set up your gradient by specifying minimum, midpoint, and maximum values and their colors.

```typescript
formattingParams.stops = [
  { value: 0, color: "#ff0000" },    // Min: red
  { value: 50, color: "#ffff00" },   // Mid: yellow
  { value: 100, color: "#00ff00" }   // Max: green
];
```

#### Step 5: Set Value Types

Choose how each stop value is interpreted.

```typescript
formattingParams.stops = [
  { value: 0, color: "#ff0000", type: "number" },
  { value: 50, color: "#ffff00", type: "percentile" },
  { value: 100, color: "#00ff00", type: "number" }
];
```

#### Step 6: Choose Format Style

Decide whether the gradient applies to the cell background or the text color.

```typescript
formattingParams.style = "background"; // or "text"
```

#### Step 7: Apply and Review

Apply the formatting to the selected cells.

```typescript
applyColorGradient(formattingParams);
```

---

### 3. Example Use Case

Suppose you have a table of sales figures. Applying a color gradient to the "Sales" column can help you instantly see which months had the highest and lowest sales, with colors smoothly transitioning between your chosen minimum and maximum.

```typescript
const salesCells = getColumnCells("Sales");
applyColorGradient({
  range: salesCells,
  stops: [
    { value: 0, color: "#ff0000" },
    { value: 50, color: "#ffff00" },
    { value: 100, color: "#00ff00" }
  ],
  style: "background"
});
```

---

### 4. Result

Cells are colored according to their values, making it easy to spot patterns, outliers, and trends at a glance.

```typescript
salesCells.forEach(cell => {
  // cell.style.backgroundColor is now set based on its value
});
```

---

### 5. Implementation Pseudo-code

---

### 6. PivotifyJS and Color Gradients

> *Note: PivotifyJS does not currently support color scale formatting, but its aggregation and computation features are designed to complement visual analysis workflows inspired by spreadsheet tools like Google Sheets.*

---

### 7. Why Use Color Gradients?

- **Visual Clarity:** Instantly see data distribution and trends.
- **Highlight Outliers:** Easily spot unusually high or low values.
- **Data Storytelling:** Make tables more informative and engaging for viewers.

---

### Plaintext Gradient Styling Instructions

PivotifyJS now supports specifying both a `from` color and a `to` color for gradients, as well as explicit keys for each parameter. The sort direction and target (text or background) must also be specified using their respective keys.

**Instruction format:**
```
PIVOTIFYJS_STYLE_GRADIENT:"Col1"="from:#ff0000;to:#00ff00;sort:ascending;target:bg"
```

#### Breakdown of Parameters

- **Column Name:**  
  `"Col1"` — The column to which the gradient styling will be applied.

- **Right Side of Equation:**  
  The value consists of key-value pairs separated by semicolons (`;`).  
  All keys must be explicitly specified.

  1. **from:**  
     The starting color of the gradient (e.g., `from:#ff0000`).

  2. **to:**  
     The ending color of the gradient (e.g., `to:#00ff00`).

  3. **sort:**  
     `"ascending"` or `"descending"`  
     Specifies the sort direction for the gradient.  
     - `sort:ascending` means `from` is applied to the lowest value and `to` to the highest.
     - `sort:descending` means `from` is applied to the highest value and `to` to the lowest.

  4. **target:**  
     `"bg"` for background or `"text"` for text color.

#### Examples

- Apply a gradient from red to green on the background of the "Col1" column, ascending sort:
  ```
  PIVOTIFYJS_STYLE_GRADIENT:"Col1"="from:#ff0000;to:#00ff00;sort:ascending;target:bg"
  ```

- Apply a gradient from blue to yellow on the text of the "Sales" column, descending sort:
  ```
  PIVOTIFYJS_STYLE_GRADIENT:"Sales"="from:#0000ff;to:#ffff00;sort:descending;target:text"
  ```

#### Notes

- At least one of `from` and `to` colors are required.
- Multiple gradient instructions can be provided for different columns.

---

### Implementation Details for Developers

For developers looking to implement or understand the underlying mechanics of color gradient application, here is the detailed pseudo-code.

**Extended Pseudo-code for Applying Gradient:**

```typescript
function applyColorGradient(params: {
  values: ExtendedCellValue[],
  from: string,
  to: string,
  target: "background" | "text"
}) {
  // 1. Extract numeric values
  const numericValues = params.values.map(cell => parseFloat(cell.value as string));
  const minValue = Math.min(...numericValues);
  const maxValue = Math.max(...numericValues);

  // 2. For each cell, compute its position in the gradient and apply the color
  params.values.forEach(cell => {
    const value = parseFloat(cell.value as string);
    const color = getInterpolatedColor(
      value,
      minValue,
      maxValue,
      params.from,
      params.to
    );
    if (params.target === "background") {
      cell.cssStyle = `background-color: ${color};`;
    } else {
      cell.cssStyle = `color: ${color};`;
    }
  });
}

function getInterpolatedColor(
  value: number,
  minValue: number,
  maxValue: number,
  fromColor: string,
  toColor: string
): string {
  // Clamp value between min and max
  const ratio = minValue === maxValue
    ? 0
    : (value - minValue) / (maxValue - minValue);

  // Parse colors to RGBA
  const fromRGBA = hexToRgba(fromColor);
  const toRGBA = hexToRgba(toColor);

  // Interpolate each channel
  const r = Math.round(fromRGBA.r + (toRGBA.r - fromRGBA.r) * ratio);
  const g = Math.round(fromRGBA.g + (toRGBA.g - fromRGBA.g) * ratio);
  const b = Math.round(fromRGBA.b + (toRGBA.b - fromRGBA.b) * ratio);
  const a = fromRGBA.a + (toRGBA.a - fromRGBA.a) * ratio;

  return `rgba(${r},${g},${b},${a})`;
}

// Helper to convert hex color to RGBA
function hexToRgba(hex: string): { r: number, g: number, b: number, a: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);
  let a = 1;
  if (c.length === 8) {
    a = parseInt(c.substring(6, 8), 16) / 255;
  }
  return { r, g, b, a };
}
```

---
