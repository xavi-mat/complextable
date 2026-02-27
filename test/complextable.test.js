/**
 * @jest-environment jsdom
 */
'use strict';

const ComplexTable = require('../src/complextable');

/* jsdom does not implement requestAnimationFrame — provide a synchronous stub */
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

/* ── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Create a rows×cols data array.
 * Cell type defaults to the library's built-in fallback (no explicit type set)
 * so we can test that default behaviour.
 */
function makeData(rows, cols) {
  return Array.from({ length: rows }, function (_, r) {
    return Array.from({ length: cols }, function (_, c) {
      return { content: 'R' + r + 'C' + c };
    });
  });
}

/* ── Tests ──────────────────────────────────────────────────────────────── */

describe('ComplexTable', function () {
  let container;

  beforeEach(function () {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  /* ── Initialisation ───────────────────────────────────────────────────── */

  describe('Initialisation', function () {
    it('adds ct-container class to the container element', function () {
      new ComplexTable(container, { data: makeData(3, 5) });
      expect(container.classList.contains('ct-container')).toBe(true);
    });

    it('accepts a CSS selector string', function () {
      container.id = 'sel-test';
      expect(() => new ComplexTable('#sel-test', { data: [] })).not.toThrow();
    });

    it('throws when the selector matches nothing', function () {
      expect(() => new ComplexTable('#does-not-exist', {})).toThrow();
    });

    it('works when called as a plain function (without new)', function () {
      const t = ComplexTable(container, { data: makeData(2, 3) });
      expect(t).toBeInstanceOf(ComplexTable);
    });

    it('uses sensible defaults (fixedLeft=1, fixedRight=0, fixedTop=1)', function () {
      const t = new ComplexTable(container, { data: makeData(3, 4) });
      expect(t.config.fixedLeft).toBe(1);
      expect(t.config.fixedRight).toBe(0);
      expect(t.config.fixedTop).toBe(1);
    });
  });

  /* ── DOM structure ────────────────────────────────────────────────────── */

  describe('DOM structure', function () {
    it('creates .ct-scroll-top with .ct-scroll-top-inner inside', function () {
      new ComplexTable(container, { data: makeData(3, 5) });
      const st = container.querySelector('.ct-scroll-top');
      expect(st).not.toBeNull();
      expect(st.querySelector('.ct-scroll-top-inner')).not.toBeNull();
    });

    it('creates .ct-body-wrapper containing .ct-scroll-body', function () {
      new ComplexTable(container, { data: makeData(3, 5) });
      const bw = container.querySelector('.ct-body-wrapper');
      expect(bw).not.toBeNull();
      expect(bw.querySelector('.ct-scroll-body')).not.toBeNull();
    });

    it('places .ct-table inside .ct-scroll-body', function () {
      new ComplexTable(container, { data: makeData(3, 5) });
      const sb = container.querySelector('.ct-scroll-body');
      expect(sb.querySelector('.ct-table')).not.toBeNull();
    });

    it('puts fixedTop rows in <thead>', function () {
      new ComplexTable(container, { fixedTop: 2, data: makeData(5, 4) });
      const thead = container.querySelector('thead');
      expect(thead).not.toBeNull();
      expect(thead.querySelectorAll('tr').length).toBe(2);
    });

    it('puts remaining rows in <tbody>', function () {
      new ComplexTable(container, { fixedTop: 1, data: makeData(5, 4) });
      const tbody = container.querySelector('tbody');
      expect(tbody).not.toBeNull();
      expect(tbody.querySelectorAll('tr').length).toBe(4);
    });

    it('creates the correct number of cells per row', function () {
      new ComplexTable(container, { data: makeData(4, 6) });
      container.querySelectorAll('tr').forEach(function (row) {
        expect(row.querySelectorAll('td, th').length).toBe(6);
      });
    });

    it('handles empty data without throwing', function () {
      expect(() => new ComplexTable(container, { data: [] })).not.toThrow();
      expect(container.querySelector('.ct-table')).not.toBeNull();
    });

    it('puts all rows in <tbody> when fixedTop is 0', function () {
      new ComplexTable(container, { fixedTop: 0, data: makeData(3, 4) });
      expect(container.querySelector('thead')).toBeNull();
      expect(container.querySelector('tbody').querySelectorAll('tr').length).toBe(3);
    });

    it('marks .ct-scroll-top as aria-hidden', function () {
      new ComplexTable(container, { data: makeData(2, 3) });
      expect(container.querySelector('.ct-scroll-top').getAttribute('aria-hidden')).toBe('true');
    });
  });

  /* ── Cell types ───────────────────────────────────────────────────────── */

  describe('Cell types', function () {
    it('defaults header-row cells to <th>', function () {
      new ComplexTable(container, { fixedTop: 1, data: makeData(3, 5) });
      expect(container.querySelector('thead tr').querySelectorAll('th').length).toBe(5);
    });

    it('defaults body-row cells to <td>', function () {
      new ComplexTable(container, { fixedTop: 1, data: makeData(3, 5) });
      expect(container.querySelector('tbody tr').querySelectorAll('td').length).toBe(5);
    });

    it('respects an explicit type set in the cell data', function () {
      const data = [[
        { type: 'td', content: 'A' },
        { type: 'th', content: 'B' }
      ]];
      new ComplexTable(container, { fixedTop: 0, data });
      const cells = container.querySelector('tbody tr').querySelectorAll('td, th');
      expect(cells[0].tagName).toBe('TD');
      expect(cells[1].tagName).toBe('TH');
    });
  });

  /* ── Fixed classes ────────────────────────────────────────────────────── */

  describe('Fixed classes', function () {
    it('adds ct-fixed-top to every cell in fixed header rows', function () {
      new ComplexTable(container, { fixedTop: 1, data: makeData(4, 5) });
      container.querySelectorAll('thead tr td, thead tr th').forEach(function (cell) {
        expect(cell.classList.contains('ct-fixed-top')).toBe(true);
      });
    });

    it('adds ct-fixed-left to cells in the fixed left column(s)', function () {
      new ComplexTable(container, { fixedLeft: 1, data: makeData(5, 5) });
      container.querySelectorAll('tr').forEach(function (row) {
        const cells = row.querySelectorAll('td, th');
        expect(cells[0].classList.contains('ct-fixed-left')).toBe(true);
        expect(cells[1].classList.contains('ct-fixed-left')).toBe(false);
      });
    });

    it('adds ct-fixed-right to cells in the fixed right column(s)', function () {
      new ComplexTable(container, { fixedRight: 1, data: makeData(5, 5) });
      container.querySelectorAll('tr').forEach(function (row) {
        const cells = row.querySelectorAll('td, th');
        expect(cells[4].classList.contains('ct-fixed-right')).toBe(true);
        expect(cells[3].classList.contains('ct-fixed-right')).toBe(false);
      });
    });

    it('adds both ct-fixed-top and ct-fixed-left to the top-left corner', function () {
      new ComplexTable(container, { fixedLeft: 1, fixedTop: 1, data: makeData(4, 5) });
      const corner = container.querySelector('thead tr :first-child');
      expect(corner.classList.contains('ct-fixed-top')).toBe(true);
      expect(corner.classList.contains('ct-fixed-left')).toBe(true);
    });

    it('adds both ct-fixed-top and ct-fixed-right to the top-right corner', function () {
      new ComplexTable(container, { fixedRight: 1, fixedTop: 1, data: makeData(4, 5) });
      const corner = container.querySelector('thead tr :last-child');
      expect(corner.classList.contains('ct-fixed-top')).toBe(true);
      expect(corner.classList.contains('ct-fixed-right')).toBe(true);
    });

    it('does not add ct-fixed-left when fixedLeft is 0', function () {
      new ComplexTable(container, { fixedLeft: 0, data: makeData(4, 5) });
      container.querySelectorAll('td, th').forEach(function (cell) {
        expect(cell.classList.contains('ct-fixed-left')).toBe(false);
      });
    });

    it('does not add ct-fixed-right when fixedRight is 0', function () {
      new ComplexTable(container, { fixedRight: 0, data: makeData(4, 5) });
      container.querySelectorAll('td, th').forEach(function (cell) {
        expect(cell.classList.contains('ct-fixed-right')).toBe(false);
      });
    });

    it('supports multiple (2) fixed left columns', function () {
      new ComplexTable(container, { fixedLeft: 2, data: makeData(4, 6) });
      container.querySelectorAll('tr').forEach(function (row) {
        const cells = row.querySelectorAll('td, th');
        expect(cells[0].classList.contains('ct-fixed-left')).toBe(true);
        expect(cells[1].classList.contains('ct-fixed-left')).toBe(true);
        expect(cells[2].classList.contains('ct-fixed-left')).toBe(false);
      });
    });

    it('supports multiple (2) fixed right columns', function () {
      new ComplexTable(container, { fixedRight: 2, data: makeData(4, 6) });
      container.querySelectorAll('tr').forEach(function (row) {
        const cells = row.querySelectorAll('td, th');
        expect(cells[4].classList.contains('ct-fixed-right')).toBe(true);
        expect(cells[5].classList.contains('ct-fixed-right')).toBe(true);
        expect(cells[3].classList.contains('ct-fixed-right')).toBe(false);
      });
    });
  });

  /* ── Cell attributes ──────────────────────────────────────────────────── */

  describe('Cell attributes', function () {
    it('applies the id attribute', function () {
      const data = [[{ type: 'td', id: 'my-cell', content: 'X' }]];
      new ComplexTable(container, { fixedTop: 0, data });
      expect(document.getElementById('my-cell')).not.toBeNull();
    });

    it('applies user-supplied CSS classes', function () {
      const data = [[{ type: 'td', classes: ['cls-a', 'cls-b'], content: 'X' }]];
      new ComplexTable(container, { fixedTop: 0, data });
      const cell = container.querySelector('td');
      expect(cell.classList.contains('cls-a')).toBe(true);
      expect(cell.classList.contains('cls-b')).toBe(true);
    });

    it('sets innerHTML from the content property', function () {
      const data = [[{ type: 'td', content: '<strong>Bold</strong>' }]];
      new ComplexTable(container, { fixedTop: 0, data });
      expect(container.querySelector('td').innerHTML).toBe('<strong>Bold</strong>');
    });

    it('applies colspan', function () {
      const data = [[{ type: 'td', content: 'Wide', colspan: 3 }]];
      new ComplexTable(container, { fixedTop: 0, data });
      expect(container.querySelector('td').colSpan).toBe(3);
    });

    it('applies rowspan', function () {
      const data = [[{ type: 'td', content: 'Tall', rowspan: 2 }]];
      new ComplexTable(container, { fixedTop: 0, data });
      expect(container.querySelector('td').rowSpan).toBe(2);
    });

    it('applies custom attrs (data-* and aria-*)', function () {
      const data = [[{
        type: 'td',
        content: 'Cell',
        attrs: { 'data-value': '42', 'aria-label': 'value cell' }
      }]];
      new ComplexTable(container, { fixedTop: 0, data });
      const cell = container.querySelector('td');
      expect(cell.getAttribute('data-value')).toBe('42');
      expect(cell.getAttribute('aria-label')).toBe('value cell');
    });

    it('preserves user classes alongside ct-fixed-* classes', function () {
      const data = [[{ classes: ['my-class'], content: 'H' }]];
      new ComplexTable(container, { fixedLeft: 1, fixedTop: 1, data });
      const cell = container.querySelector('thead tr :first-child');
      expect(cell.classList.contains('my-class')).toBe(true);
      expect(cell.classList.contains('ct-fixed-top')).toBe(true);
      expect(cell.classList.contains('ct-fixed-left')).toBe(true);
    });

    it('leaves content empty when content is not provided', function () {
      const data = [[{ type: 'td' }]];
      new ComplexTable(container, { fixedTop: 0, data });
      expect(container.querySelector('td').innerHTML).toBe('');
    });
  });

  /* ── update() ─────────────────────────────────────────────────────────── */

  describe('update()', function () {
    it('re-renders the table with new data', function () {
      const t = new ComplexTable(container, { data: makeData(3, 5) });
      // 3 rows total, 1 in thead → 2 in tbody
      expect(container.querySelectorAll('tbody tr').length).toBe(2);

      t.update({ data: makeData(7, 5) });
      // 7 rows total, 1 in thead → 6 in tbody
      expect(container.querySelectorAll('tbody tr').length).toBe(6);
    });

    it('preserves existing config options not included in the update', function () {
      const t = new ComplexTable(container, { fixedLeft: 2, data: makeData(3, 5) });
      t.update({ data: makeData(4, 5) });
      expect(t.config.fixedLeft).toBe(2);
    });
  });

  /* ── destroy() ────────────────────────────────────────────────────────── */

  describe('destroy()', function () {
    it('clears the container innerHTML', function () {
      const t = new ComplexTable(container, { data: makeData(3, 5) });
      t.destroy();
      expect(container.innerHTML).toBe('');
    });

    it('removes the ct-container class', function () {
      const t = new ComplexTable(container, { data: makeData(3, 5) });
      t.destroy();
      expect(container.classList.contains('ct-container')).toBe(false);
    });

    it('can be called more than once without throwing', function () {
      const t = new ComplexTable(container, { data: makeData(3, 5) });
      expect(() => { t.destroy(); t.destroy(); }).not.toThrow();
    });
  });
});
