'use strict';

const executive = require('executive');

const drawableTypes = [
  'drawable-mdpi',
  'drawable-hdpi',
  'drawable-xhdpi',
  'drawable-xxhdpi',
  'drawable-xxxhdpi'
];

function execute(dest) {
  const resDir = dest + 'app/src/main/res/';
  const srcDir = __dirname + '/data/generated/';
  for(const drawableType of drawableTypes) {
    executive(`cp ${srcDir}${drawableType}/* ${resDir}${drawableType}/`);
  }
  executive(`cp ${srcDir}currencies.json ${resDir}raw/currencies_meta.json`);
}

module.exports = {
  execute: execute
}
