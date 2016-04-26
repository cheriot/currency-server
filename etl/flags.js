'use strict';

const fs = require('fs');
const unzip = require('unzip');
const executive = require('executive');
const etlCommon = require('./common');

function readDirFactory(path) {
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

function filterFlags(files) {
  // The file names are <country code>.svg.
  const filesNeeded = [];
  const countryCodes = files.map((file) => /([a-z]+).svg$/g.exec(file)[1]);

  return etlCommon.readGenerated('currencies.json')
    .then((currencies) => {
      console.log('Filter flags for ' + currencies.length + ' currencies.');

      // Only process flags that correspond to a currency.
      for(const currency of currencies) {
        const i = countryCodes.indexOf(currency.issuingCountryCode.toLowerCase());
        const expectedFile = `${currency.issuingCountryCode.toLowerCase()}.svg`
        let foundFile = null;

        for(const file of files) {
          if(file === expectedFile) {
            foundFile = file;
            break;
          }
        }

        if(foundFile) {
          filesNeeded.push(foundFile);
        } else {
          // Verify that every currency has a flag.
          throw `Error ${currency.code} ${currency.name} has no flag.`;
        }
      }
      console.log(`All ${filesNeeded.length} currencies have flags.`);

      return filesNeeded;
    });
}

function processFlagsFromSource(flagSourceBasePath, sizes, groupTag, flagDestBaseDir) {
  return readDirFactory(flagSourceBasePath)
    .then((files) => filterFlags(files))
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
          const filename = 'flag_' + groupTag + '_' + file.replace('-', '_').replace(/svg/, 'png');
          const dest = flagDestBaseDir + s.dir + filename;
          // Do these flags need more processing to look good in the app?
          // http://www.fmwconcepts.com/imagemagick/
          // http://www.imagemagick.org/Usage/thumbnails/#button
          const c = `convert ${src} -resize ${s.w}x${s.h} ${dest}`;
          commands.push(c);
        }
      }
      console.log('For', files.length, 'files, run', commands.length, 'commands.');
      return executive(commands);
    });
}

module.exports = function() {
  // Here's the plan:
  // 1. Download zip.
  const downloadUri = 'https://github.com/lipis/flag-icon-css/archive/master.zip';
  const zipPath = etlCommon.downloadsDir + 'flag-icon-css.zip';

  // 2. Unzip to intermediate dir.
  const unzipPath = etlCommon.intermediateDir + 'flag-icon-css-master/';
  const squareFlagBasePath = unzipPath + 'flags/1x1/';
  const rectangleFlagBasePath = unzipPath + 'flags/4x3/';

  // 3. Verify that all currencies have a flag.
  // 4. Convert to the right sizes, add any effects, and drop in the generated dir.
  const flagDestBaseDir = etlCommon.generatedDir
  const sizesSquare = [
    {dir: 'drawable-mdpi/',    w: 48,  h: 48},
    {dir: 'drawable-hdpi/',    w: 72,  h: 72},
    {dir: 'drawable-xhdpi/',   w: 96,  h: 96},
    {dir: 'drawable-xxhdpi/',  w: 144, h: 144},
    {dir: 'drawable-xxxhdpi/', w: 192, h: 192},
  ];
  const sizesFull = [
    {dir: 'drawable-mdpi/',    w: 48,  h: 36},
    {dir: 'drawable-hdpi/',    w: 72,  h: 54},
    {dir: 'drawable-xhdpi/',   w: 96,  h: 72},
    {dir: 'drawable-xxhdpi/',  w: 144, h: 108},
    {dir: 'drawable-xxxhdpi/', w: 192, h: 144},
  ];

  // return executive(`curl -L ${downloadUri} > ${zipPath}`)
    // .then(() => {
    //  return executive(`unzip -q -o ${zipPath} -d ${etlCommon.intermediateDir}`);
    // })
   return executive(`unzip -q -o ${zipPath} -d ${etlCommon.intermediateDir}`)
    .then(() => processFlagsFromSource(squareFlagBasePath, sizesSquare, '1x1', flagDestBaseDir))
    .then(() => processFlagsFromSource(rectangleFlagBasePath, sizesFull, '4x3', flagDestBaseDir))
    .catch((err) => console.log('Error', err, err.stack));
}
