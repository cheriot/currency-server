#!/usr/bin/env node
'use strict';

let thisPackage = require('./package.json');
let etl = require('./etl');

function etlOpts(yargs) {
  return yargs
    .option('stage', {
      alias: 's',
      'default': etl.allowedStages,
      describe: 'The ETL stage(s) to run. There is one stage per data source.',
      array: true,
      choices: etl.allowedStages,
      requiresArg: true
    })
    .fail(failHandler);
}

function etlCommand(argv) {
  console.log('Begin ETL of ' + argv.stage.join(', ') + '.');
  etl.execute(argv.stage);
}

function serveOpts() {
  return yargs;
}

function serveCommand(argv) {
  console.log('serve has not been implemented yet.', argv);
}

function failHandler(msg, err) {
  // preserve the stacktrace
  if(err) throw err;
  console.error('Error:', msg)
  process.exit(1)
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
  .fail(failHandler)
  .argv
