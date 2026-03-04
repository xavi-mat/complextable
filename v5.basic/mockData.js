/* ==============================================================
   NAME POOLS
   ============================================================== */
var FIRST_NAMES = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
    'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
    'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
    'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery',
    'Jackson', 'Ella', 'Sebastian', 'Scarlett', 'Aiden', 'Grace', 'Matthew',
    'Victoria', 'Samuel', 'Riley', 'David', 'Aria', 'Joseph', 'Lily',
    'Carter', 'Aurora', 'Owen', 'Chloe', 'Wyatt', 'Penelope', 'John',
    'Layla'
];

var LAST_NAMES = [
    'Smith', 'Johnson', 'Williams-Martínez Gutiérres-López', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
    'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
    'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts'
];

function randInt(n) { return Math.floor(Math.random() * n); }
function randNum(min, max) { return min + randInt(max - min + 1); }
function randItem(arr) { return arr[randInt(arr.length)]; }
function getGrade() {
    const option = randItem(['grade', '-', '?']);
    if (option === 'grade') { return `${randNum(40, 100)}%`; }
    else { return option; }
}

function getName() {
    return randItem(LAST_NAMES) + ', ' + randItem(FIRST_NAMES);
}


function getHeaders(numAssignments) {
      const headers = [];
      // First column, button
      headers.push({
        pos: 'left',
        content: "<button>Seleccionar grupos</button>"
      });
      // Assignment columns
      for (var a = 0; a < numAssignments; a++) {
        headers.push({
          pos: 'center',
          content: `<img src="../imgs/icon.svg" alt="Icon"><p>Unidad ${a + 1}</p>`
        });
      }
      // Two average columns
      headers.push({
        pos: 'right',
        content: '<p>Media</p>'
      });
      headers.push({
        pos: 'right',
        content: '<p>Media ponderada<sup>*</sup></p>'
      });

      return headers;
    }

    function getGroup(groupIndex, numAssignments, numStudentsPerGroup) {
      const group = [];
      // Group first row: group name + empty cells
      const groupName = 'Grupo ' + (groupIndex + 1);
      const groupHeader = [{pos: 'left', content: groupName}];
      for (let i = 1; i < numAssignments; i++) {
        groupHeader.push({pos: 'center', content: ''});
      }
      groupHeader.push({pos: 'right', content: ''});
      groupHeader.push({pos: 'right', content: ''});

      group.push(groupHeader);

      // First column: names
      // Columns 2-ASSIGNMENTS+1: scores
      // Last two columns: average and Weighted average

      for (let i = 0; i < numStudentsPerGroup; i++) {
        const student = [];
        student.push({
          pos: 'left',
          content: getName(i)
        });
        for (let j = 0; j < numAssignments; j++) {
          student.push({
            pos: 'center',
            content: getGrade()
          });
        }
        student.push({pos: 'right', content: getGrade()});
        student.push({pos: 'right', content: getGrade()});
        group.push(student);
      }
      return group;
    }

    function getGroups(numAssignments, numStudentsPerGroup, numGroups) {
      const groups = [];
      for (let g = 0; g < numGroups; g++) {
        groups.push(getGroup(g, numAssignments, numStudentsPerGroup));
      }
      return groups;
    }


function getMockData(options = {
    groups: 2,
    students: 20,
    assignments: 25
}) {
    const {
        groups: numGroups,
        students: numStudentsPerGroup,
        assignments: numAssignments
    } = options;

    return {
        headers: getHeaders(numAssignments),
        groups: getGroups(numAssignments, numStudentsPerGroup, numGroups)
    };
}
