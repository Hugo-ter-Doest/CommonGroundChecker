const { checkChangelog } = require('./src/lib/checkers/changelog');
const result = checkChangelog(['README.md', 'CHANGELOG.md', 'src/index.ts']);
console.log(JSON.stringify(result, null, 2));
