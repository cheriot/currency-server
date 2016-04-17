'use strict';

const fs = require('fs');
const unzip = require('unzip');
const executive = require('executive');
const etlCommon = require('./common');

function readDirFactory(path) {
  return () => {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (err, files) => {
        if(err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }
}

function verifyFlagCoverage(files) {
  // The file names are <country code>.svg.
  const countryCodes = files.map((file) => /([a-z]+).svg$/g.exec(file)[1]);
  let currencyCount = 0;

  return etlCommon.readGenerated('currencies.json')
    .then((currencies) => {

      for(const currency of currencies) {
        // Verify that every currency has a flag.
        const i = countryCodes.indexOf(currency.issuingCountryCode.toLowerCase());
        if(i < 0) {
          throw `Error ${currency.code} ${currency.name} has no flag.`;
        } else {
          currencyCount = currencyCount + 1;
        }
      }
      console.log(`All ${currencyCount} currencies have flags.`);

      return files;
    });
}

module.exports = function() {
  // Here's the plan:
  // 1. Download zip.
  const downloadUri = 'https://github.com/lipis/flag-icon-css/archive/master.zip';
  const zipPath = etlCommon.downloadsDir + 'flag-icon-css.zip';
  // 2. Unzip to intermediate dir.
  const unzipPath = etlCommon.intermediateDir + 'flag-icon-css-master/';
  const flagSourceBasePath = unzipPath + 'flags/1x1/';
  // 3. Verify that all currencies have a flag.
  // 4. Convert to the right sizes, add any effects, and drop in the generated dir.
  const flagDestBaseDir = etlCommon.generatedDir
  const sizes = [
    {dir: 'mipmap-mdpi/',    dim: 48},
    {dir: 'mipmap-hdpi/',    dim: 72},
    {dir: 'mipmap-xhdpi/',   dim: 96},
    {dir: 'mipmap-xxhdpi/',  dim: 144},
    {dir: 'mipmap-xxxhdpi/', dim: 192},
  ];

  return executive(`curl -L ${downloadUri} > ${zipPath}`)
    .then(() => {
      return executive(`unzip -q -o ${zipPath} -d ${etlCommon.intermediateDir}`);
    })
    .then(readDirFactory(flagSourceBasePath))
    .then((files) => verifyFlagCoverage(files))
    .then((files) => {
      const commands = [];
      for(const file of files) {
        for(const s of sizes) {
          const src = flagSourceBasePath + file;
          // Android resource directories cannot
          // 1. Have subdirectories.
          // 2. Contain files that have the same name as java keywords.
          // 3. Contain - or any other non alphanumeric_ character.
          // ie the flag_ prefix is important.
          const filename = 'flag_' + file.replace('-', '_').replace(/svg/, 'png');
          const dest = flagDestBaseDir + s.dir + filename;
          // Do these flags need more processing to look good in the app?
          // http://www.fmwconcepts.com/imagemagick/
          // http://www.imagemagick.org/Usage/thumbnails/#button
          const c = `convert ${src} -resize ${s.dim}x${s.dim}! ${dest}`;
          commands.push(c);
        }
      }
      console.log('For', files.length, 'files, run', commands.length, 'commands.');
      return executive(commands);
    })
    .catch((err) => console.log('Error', err, err.stack));
}
