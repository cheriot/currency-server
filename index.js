#!/usr/bin/env node

var thisPackage = require('./package.json');
// For running bash well: https://www.npmjs.com/package/executive

// currency etl
// One --stage per data source.
// currency etl --stage names
// currency etl --stage rates
// currency etl --stage flags
// currency etl --stage locales
// currency serve

function etlOpts(yargs) {
  return yargs
    .option('stage', {
      alias: 's',
      'default': 'all',
      describe: 'The ETL stage to run.'
    })
    .array('stage')
    .choices('stage', ['foo', 'bar', 'baz'])
    .requiresArg('stage');
}

function etlCommand(argv) {
  console.log('etl has not been implemented yet. Stage:', argv.stage);
}

function serveOpts() {
  return yargs;
}

function serveCommand(argv) {
  console.log('serve has not been implemented yet.', argv);
}

require('yargs')
  .usage('git [--version] [--help] <command> [<args>]')
  .version(thisPackage.version)
  .help()
  .epilogue('See the the README for more details.')
  .strict()
  .command('etl', 'Extract, transform, and load datasets depended on by the currency calculator.', etlOpts, etlCommand)
  .command('serve', 'Serve API requests.', serveOpts, serveCommand)
  .demand(1, 'No command specified.')
  .argv
