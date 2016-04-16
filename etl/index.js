'use strict';

let _ = require('lodash');

// In order that they should be run.
let allowedStages = ['names', 'countryCodes'];

function execute(requestedStages) {
  // Maybe use NoFlo, node-datapumps, jake to manage stage dependencies. KIS for now.
  _.intersection(allowedStages, requestedStages)
   .forEach((stage) => {
     require(`./${stage}`)();
   });
}

module.exports = {
  allowedStages: allowedStages, // rates, flags, locales
  execute: execute
}
