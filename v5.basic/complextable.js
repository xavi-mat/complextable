class ComplexTable {
    constructor(data) {
        this.box = data.box;
        this.headers = data.headers;
        this.groups = data.groups;
        this.render();
    }
    render() {
        let inn = "<table>";

        // Headers
        inn += "<tr>";
        this.headers.forEach(header => {
            inn += `<th>${header.content}</th>`;
        });
        inn += "</tr>";

        // Groups
        this.groups.forEach(group => {
            // Group rows
            group.forEach(row => {
                inn += "<tr>";
                row.forEach((cell, index) => {
                    let classes ="";
                    if (index === 0) { classes = "left"; }
                    else if (index === row.length - 1 || index === row.length - 2) { classes = "right"; }
                    else { classes = "center"; }
                    inn += `<td class="${classes}">${cell.content}</td>`;
                });
                inn += "</tr>";
            });
        });

        inn += "</table>";
        this.box.innerHTML = `<div id="table-container">${inn}</div>`;
    }
}