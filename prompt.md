# Prompt for complex table

**Role:** You are an expert frontend web developer.

**Task:** Create a structural skeleton for a Teacher's Gradebook (tabular data grid) to replace legacy code. Use strictly native HTML, CSS, and Vanilla JavaScript. No external frameworks or libraries.

**CSS Architecture & Styling (Crucial):**
- I already have a design system. Your CSS must be structurally sound but visually basic.
- **Use CSS Variables (`:root`):** Define all cosmetic properties (colors, fonts, borders, paddings) AND structural sizing variables at the very top of the `<style>` block.
- **Required Structural Variables:** Include `--col-width-default: 100px;`, `--row-height-1line: 40px;`, and `--row-height-2lines: 60px;`.
- Clearly separate the structural CSS (Flexbox, sticky positioning, scrollbars) from the cosmetic CSS.

**Design Philosophy & Layout:**
- The page must take exact viewport height (`100vh`) using CSS Flexbox (`display: flex; flex-direction: column;`).
- Fixed `<header>` at the top, fixed `<footer>` at the bottom.
- Main content:
  1. Custom Top Scrollbar container (for horizontal scroll only).
  2. Table Container (`flex-grow: 1; overflow-y: auto; overflow-x: auto;`).
- **Scrollbar Strategy:** Hide the Table Container's bottom horizontal scrollbar using modern CSS (`scrollbar-width: none` for Firefox and `::-webkit-scrollbar { display: none; }` for Chrome/Safari), but keep the right vertical scrollbar visible. This creates a cleaner UX where users scroll horizontally via the top scrollbar only.

**Table Structure & Simplified "Sticky" Logic (No DOM Measurement!):**
- Use semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`).
- Set table `border-collapse: separate;` and `border-spacing: 0;` so sticky borders work correctly.
- **Left Column (Fixed):** There is strictly ONE fixed left column (Student Name).
  - Apply `left: 0; position: sticky;` via CSS class.
  - Use `white-space: nowrap;` to prevent wrapping.
  - Width adapts to content naturally (no `max-content` needed in width, just let it size naturally).
- **Right Columns (Fixed):** All columns designated as "fixed right" strictly use `var(--col-width-default)` width.
  - JS calculates `right` offset: first column is `right: 0`, second is `right: calc(1 * var(--col-width-default))`, third is `right: calc(2 * var(--col-width-default))`, etc.
  - Apply `position: sticky;` via CSS class.
- **Scrolling Columns:** All non-fixed columns use `var(--col-width-default)` width.
- **Top Rows (Fixed):** Header row heights are determined by config.
  - If config specifies `{ lines: 1 }`, apply `height: var(--row-height-1line);`
  - If config specifies `{ lines: 2 }`, apply `height: var(--row-height-2lines);`
  - Calculate `top` offset: Row 1 is `top: 0;`. Row 2 is `top: var(--row-height-1line);` (if Row 1 was 1-line) or cumulative based on previous row heights.
  - Apply `position: sticky;` via CSS class.
- **Z-Index Strategy:**
  - Scrolling cells: `z-index: 1;`
  - Sticky left column (non-header): `z-index: 2;`
  - Sticky top rows (non-left-column): `z-index: 2;`
  - Sticky right columns (non-header): `z-index: 2;`
  - Top-left corner (sticky + sticky): `z-index: 3;`
  - Top-right corners (sticky header + sticky right col): `z-index: 3;`

**Dynamic Data Generation:**
- Create a mock JS config object:
  ```javascript
  const config = {
    topRows: [
      { lines: 1 },  // First header row: 1 line tall
      { lines: 2 }   // Second header row: 2 lines tall
    ],
    fixedRightCols: 2  // Number of columns sticky on the right
  };
  ```
- Generate dummy data for 150 student rows and 25 total columns.
- JavaScript should:
  1. Read the config object
  2. Build the table HTML (string concatenation or DOM manipulation)
  3. Apply calculated inline styles for `top`, `right`, and `height` directly to `<th>`/`<td>` elements
  4. Example: For the 2nd fixed-right column, set `style="right: calc(1 * var(--col-width-default)); position: sticky;"`

**Top Scrollbar Synchronization & Resize Handling:**
- The Top Scrollbar container must contain a dummy `<div>` with no content.
- Use a `ResizeObserver` attached to the `<table>` element:
  - Measure the table's `scrollWidth`
  - Apply that width to the dummy `<div>` so both scrollbars show the same scrollable width
- Synchronize `scrollLeft` between Top Scrollbar container and Table Container:
  - Listen to `scroll` events on both containers
  - Use a flag (`let isSyncing = false;`) to prevent infinite scroll event loops
  - When one scrolls, set flag to `true`, update the other's `scrollLeft`, then set flag back to `false`

**Additional Requirements:**
- Add clear comments in JavaScript explaining the sticky math calculations
- Include a brief comment at the top explaining the "no measurement" philosophy
- Ensure all code fits in a single `index.html` file
- Use consistent indentation and formatting