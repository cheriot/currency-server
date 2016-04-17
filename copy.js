'use strict';

const executive = require('executive');

const mipmapTypes = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi'
];

function execute(dest) {
  const resDir = dest + 'app/src/main/res/';
  const srcDir = __dirname + '/data/generated/';
  for(const mipmapType of mipmapTypes) {
    executive(`cp ${srcDir}${mipmapType}/* ${resDir}${mipmapType}/`);
  }
  executive(`cp ${srcDir}currencies.json ${resDir}raw/currencies_meta.json`);
}

module.exports = {
  execute: execute
}
