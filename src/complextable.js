/**
 * complextable.js
 *
 * Build a complex HTML table from a JS object.
 *
 * Features:
 *   - One or more fixed columns on the left
 *   - One or more fixed columns on the right
 *   - One or more fixed rows on the top (sticky header)
 *   - Horizontal scrollbar shown on TOP of the scrollable area
 *   - Vertical scrollbar on the right
 *
 * Cell object format (all properties optional except content):
 * {
 *   type    : 'td' | 'th'         // element type; defaults to 'th' in header rows, 'td' elsewhere
 *   id      : string              // id attribute
 *   classes : string[]            // extra CSS classes
 *   attrs   : { key: value, … }   // non-standard / data-* attributes
 *   content : string              // innerHTML (may contain HTML)
 *   colspan : number              // colspan attribute
 *   rowspan : number              // rowspan attribute
 * }
 *
 * Usage:
 *   const table = new ComplexTable('#my-div', {
 *     fixedLeft  : 1,
 *     fixedRight : 1,
 *     fixedTop   : 1,
 *     data       : [ [cellObj, …], … ]   // array of rows × cols
 *   });
 */
(function (root, factory) {
  /* UMD wrapper — works as CommonJS module (Node / Jest) or browser global */
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.ComplexTable = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ── Constructor ──────────────────────────────────────────────────────── */

  /**
   * @param {HTMLElement|string} container  Target element or CSS selector.
   * @param {Object}             config     Configuration (see file header).
   */
  function ComplexTable(container, config) {
    if (!(this instanceof ComplexTable)) {
      return new ComplexTable(container, config);
    }

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) {
      throw new Error('ComplexTable: container element not found');
    }

    this.container = container;
    this.config = _mergeConfig({}, config);

    this._scrollTop     = null;
    this._scrollTopInner = null;
    this._bodyWrapper   = null;
    this._scrollBody    = null;
    this._table         = null;
    this._syncHandlers  = null;

    this._render();
  }

  /* ── Defaults ─────────────────────────────────────────────────────────── */

  var DEFAULTS = {
    fixedLeft  : 1,
    fixedRight : 0,
    fixedTop   : 1,
    data       : []
  };

  function _mergeConfig(target, source) {
    var result = {};
    var keys = Object.keys(DEFAULTS);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      result[k] = (source && source[k] !== undefined) ? source[k] : DEFAULTS[k];
    }
    return result;
  }

  /* ── Render ───────────────────────────────────────────────────────────── */

  ComplexTable.prototype._render = function () {
    var self      = this;
    var container = this.container;

    container.innerHTML = '';
    container.classList.add('ct-container');

    /* Top scrollbar mirror */
    var scrollTop = document.createElement('div');
    scrollTop.className = 'ct-scroll-top';
    scrollTop.setAttribute('aria-hidden', 'true');
    var scrollTopInner = document.createElement('div');
    scrollTopInner.className = 'ct-scroll-top-inner';
    scrollTop.appendChild(scrollTopInner);

    /* Body wrapper — clips the native bottom horizontal scrollbar */
    var bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'ct-body-wrapper';

    /* Scroll body */
    var scrollBody = document.createElement('div');
    scrollBody.className = 'ct-scroll-body';

    /* Table */
    var table = this._buildTable();
    scrollBody.appendChild(table);
    bodyWrapper.appendChild(scrollBody);

    container.appendChild(scrollTop);
    container.appendChild(bodyWrapper);

    this._scrollTop      = scrollTop;
    this._scrollTopInner = scrollTopInner;
    this._bodyWrapper    = bodyWrapper;
    this._scrollBody     = scrollBody;
    this._table          = table;

    /* After layout is ready: sync widths, fix sticky positions, wire scrollbars */
    requestAnimationFrame(function () {
      self._afterRender();
    });
  };

  ComplexTable.prototype._afterRender = function () {
    this._scrollTopInner.style.width = this._table.offsetWidth + 'px';
    this._fixStickyPositions();
    this._setupScrollSync();
  };

  /* ── Build table DOM ──────────────────────────────────────────────────── */

  ComplexTable.prototype._buildTable = function () {
    var config   = this.config;
    var data     = config.data;
    var fixedTop = config.fixedTop;

    var table = document.createElement('table');
    table.className = 'ct-table';

    if (fixedTop > 0 && data.length > 0) {
      var thead = document.createElement('thead');
      for (var r = 0; r < fixedTop && r < data.length; r++) {
        thead.appendChild(this._buildRow(data[r], true));
      }
      table.appendChild(thead);
    }

    var tbody = document.createElement('tbody');
    var bodyStart = Math.max(0, fixedTop);
    for (var r = bodyStart; r < data.length; r++) {
      tbody.appendChild(this._buildRow(data[r], false));
    }
    table.appendChild(tbody);

    return table;
  };

  ComplexTable.prototype._buildRow = function (rowData, isHeader) {
    var tr = document.createElement('tr');
    for (var c = 0; c < rowData.length; c++) {
      tr.appendChild(this._buildCell(rowData[c], c, isHeader, rowData.length));
    }
    return tr;
  };

  ComplexTable.prototype._buildCell = function (cellData, colIndex, isHeader, totalCols) {
    var config     = this.config;
    var fixedLeft  = config.fixedLeft;
    var fixedRight = config.fixedRight;

    /* Element type */
    var type = cellData.type || (isHeader ? 'th' : 'td');
    var el   = document.createElement(type);

    /* id */
    if (cellData.id) {
      el.id = cellData.id;
    }

    /* CSS classes — user classes first, then ct-fixed-* helpers */
    var classes = cellData.classes ? cellData.classes.slice() : [];
    if (isHeader) {
      classes.push('ct-fixed-top');
    }
    if (colIndex < fixedLeft) {
      classes.push('ct-fixed-left');
      el.style.left = '0px'; /* corrected by _fixStickyPositions for >1 cols */
    }
    if (fixedRight > 0 && colIndex >= totalCols - fixedRight) {
      classes.push('ct-fixed-right');
      el.style.right = '0px'; /* corrected by _fixStickyPositions for >1 cols */
    }
    if (classes.length > 0) {
      el.className = classes.join(' ');
    }

    /* colspan / rowspan */
    if (cellData.colspan) { el.colSpan = cellData.colspan; }
    if (cellData.rowspan) { el.rowSpan = cellData.rowspan; }

    /* Non-standard / data-* attributes */
    if (cellData.attrs) {
      var attrs = cellData.attrs;
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, attrs[key]);
      });
    }

    /* HTML content */
    if (cellData.content !== undefined) {
      el.innerHTML = cellData.content;
    }

    return el;
  };

  /* ── Sticky position corrections ──────────────────────────────────────── */
  /*
   * CSS sticky requires explicit left/right/top values.
   * For a single fixed column left: 0 and right: 0 (set inline above) work.
   * For multiple fixed columns each cell needs an accumulated offset.
   * Similarly, multi-row headers each need a cumulative top offset.
   */
  ComplexTable.prototype._fixStickyPositions = function () {
    var config     = this.config;
    var fixedLeft  = config.fixedLeft;
    var fixedRight = config.fixedRight;
    var fixedTop   = config.fixedTop;
    var table      = this._table;
    var allRows    = table.querySelectorAll('tr');

    if (allRows.length === 0) { return; }

    /* ── Multiple fixed header rows: cumulative top offsets ── */
    if (fixedTop > 1) {
      var headerRows = table.querySelectorAll('thead tr');
      var topOffset  = 0;
      for (var r = 0; r < headerRows.length; r++) {
        var hCells = headerRows[r].querySelectorAll('td, th');
        for (var c = 0; c < hCells.length; c++) {
          hCells[c].style.top = topOffset + 'px';
        }
        topOffset += headerRows[r].offsetHeight;
      }
    }

    /* ── Multiple fixed left/right columns: cumulative offsets ── */
    if (fixedLeft <= 1 && fixedRight <= 1) { return; }

    /* Measure column widths from the first row */
    var firstRowCells = allRows[0].querySelectorAll('td, th');
    var totalCols     = firstRowCells.length;

    /* Build cumulative left offsets */
    var leftOffsets = [];
    var acc = 0;
    for (var i = 0; i < Math.min(fixedLeft, totalCols); i++) {
      leftOffsets.push(acc);
      acc += firstRowCells[i].offsetWidth;
    }

    /* Build cumulative right offsets */
    var rightOffsets = [];
    acc = 0;
    for (var i = totalCols - 1; i >= Math.max(0, totalCols - fixedRight); i--) {
      rightOffsets.unshift(acc);
      acc += firstRowCells[i].offsetWidth;
    }

    /* Apply to every row */
    for (var r = 0; r < allRows.length; r++) {
      var rowCells = allRows[r].querySelectorAll('td, th');
      for (var c = 0; c < Math.min(fixedLeft, rowCells.length); c++) {
        rowCells[c].style.left = leftOffsets[c] + 'px';
      }
      for (var c = 0; c < Math.min(fixedRight, rowCells.length); c++) {
        var cellIdx = rowCells.length - fixedRight + c;
        if (cellIdx >= 0 && cellIdx < rowCells.length) {
          rowCells[cellIdx].style.right = rightOffsets[c] + 'px';
        }
      }
    }
  };

  /* ── Scroll synchronisation ───────────────────────────────────────────── */

  ComplexTable.prototype._setupScrollSync = function () {
    var scrollTop  = this._scrollTop;
    var scrollBody = this._scrollBody;
    var syncing    = false;

    function onScrollTop() {
      if (syncing) { return; }
      syncing = true;
      scrollBody.scrollLeft = scrollTop.scrollLeft;
      syncing = false;
    }

    function onScrollBody() {
      if (syncing) { return; }
      syncing = true;
      scrollTop.scrollLeft = scrollBody.scrollLeft;
      syncing = false;
    }

    scrollTop.addEventListener('scroll', onScrollTop);
    scrollBody.addEventListener('scroll', onScrollBody);

    this._syncHandlers = { scrollTop: onScrollTop, scrollBody: onScrollBody };
  };

  /* ── Public API ───────────────────────────────────────────────────────── */

  /**
   * Re-render the table with new (merged) configuration.
   * @param {Object} config  Partial config to merge into the current config.
   */
  ComplexTable.prototype.update = function (config) {
    /* Tear down existing DOM + listeners without removing the container */
    this._teardown();
    Object.assign(this.config, config);
    this._render();
  };

  /**
   * Destroy the table, clean up event listeners, and optionally clear the DOM.
   * @param {boolean} [keepDOM=false]  When true the container element is kept
   *                                   but its content is removed — useful when
   *                                   called internally before a re-render.
   */
  ComplexTable.prototype.destroy = function (keepDOM) {
    this._teardown();
    if (!keepDOM) {
      this.container.innerHTML = '';
      this.container.classList.remove('ct-container');
    }
  };

  /* ── Internal helpers ─────────────────────────────────────────────────── */

  /** Remove event listeners and null out references (keeps container intact). */
  ComplexTable.prototype._teardown = function () {
    if (this._syncHandlers) {
      if (this._scrollTop) {
        this._scrollTop.removeEventListener('scroll', this._syncHandlers.scrollTop);
      }
      if (this._scrollBody) {
        this._scrollBody.removeEventListener('scroll', this._syncHandlers.scrollBody);
      }
      this._syncHandlers = null;
    }
    this._scrollTop      = null;
    this._scrollTopInner = null;
    this._bodyWrapper    = null;
    this._scrollBody     = null;
    this._table          = null;
  };

  return ComplexTable;
}));
