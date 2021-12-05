const fs = require('fs');
const path = require('path');

const projectDir = __dirname;

if (!fs.existsSync(path.join(projectDir, 'node_modules'))) {
  console.error('invalid project directory');
  process.exit(1);
}

const realPrismaSchemaDir = fs.realpathSync(
  path.join(__dirname, 'node_modules/.prisma')
);
const badPrismaSchemaDir = path.join(
  fs.realpathSync(path.join(__dirname, 'node_modules/@prisma/client')),
  '../../.prisma'
);

if (realPrismaSchemaDir === badPrismaSchemaDir) {
  console.log('nothing to do');
  process.exit(0);
}

if (!fs.existsSync(badPrismaSchemaDir)) {
  console.log('already deleted');
  process.exit(0);
}

fs.rmdirSync(badPrismaSchemaDir, { recursive: true });

console.log('deleted bad prisma schema');
