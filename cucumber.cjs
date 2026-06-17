// Override invalid/forward-looking tsconfig values (e.g. ignoreDeprecations
// targeting a TypeScript release newer than what's installed) without
// requiring tsconfig.json itself to be edited.
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ ignoreDeprecations: '5.0' });

require('ts-node/register');
require('tsconfig-paths/register');

module.exports = require('./cucumber.config.ts');
