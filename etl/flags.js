'use strict';

const fs = require('fs');
const unzip = require('unzip');
const executive = require('executive');
const etlCommon = require('./common');

module.exports = function() {
  const zipPath = etlCommon.downloadsDir + 'flag-icon-css.zip';
  const unzipPath = etlCommon.intermediateDir + 'flag-icon-css-master';
  const generatedFlagPath = etlCommon.generatedDir + 'flags/1x1/';
  console.log('zipPath', zipPath);
  console.log('unzipPath', unzipPath);
  return executive(`curl -L https://github.com/lipis/flag-icon-css/archive/master.zip > ${zipPath}`)
    .then(() => {
      return executive(`unzip -o ${zipPath} -d ${etlCommon.intermediateDir}`);
    })
    .then(() => {
      return executive(`cp ${unzipPath}/flags/1x1/* ${generatedFlagPath}`);
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        fs.readdir(generatedFlagPath, (err, files) => {
          if(err) {
            reject(err);
          } else {
            resolve(files);
          }
        });
      });
    })
    .then((files) => {
      // The file names are <country code>.svg.
      const countryCodes = files.map((file) => /([a-z]+).svg$/g.exec(file)[1]);
      console.log('flags for', countryCodes);

      return etlCommon.readGenerated('currencies.json')
        .then((currencies) => {
          for(const currency of currencies) {
            const i = countryCodes.indexOf(currency.issuingCountryCode.toLowerCase());
            if(i < 0) {
              throw `Error ${currency.code} ${currency.name} has no flag.`;
            } else {
              console.log('Good', currency.code, currency.name);
            }
          }
        });
    })
    .catch((err) => console.log('Error', err, err.stack));
}
