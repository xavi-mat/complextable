class GradebookTable extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    loadData(data) {
        this._data = data;
        this.render();
    }

    render() {
        if (!this._data) {
            return;
        }
        const { headers, groups } = this._data;
        const table = [];
        // Header
        const headerRow = []
        headers.forEach(({content, pos}) => {
            headerRow.push(`<th><div class="${pos}">${content}</div></th>`);
        });
        table.push(`<tr>${headerRow.join('')}</tr>`);


        this.shadowRoot.innerHTML = `
        <link rel="stylesheet" href="./complextable.css">
        <table>${table.join('')}</table>
        `;
    }
}

customElements.define('gradebook-table', GradebookTable);
