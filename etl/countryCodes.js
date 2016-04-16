// Etl country code to country name mapping:
// ISO 3166-1 alpha-2, ISO 3166-1 alpha-3, ISO 3166-1 numeric, names...
// http://opengeocode.org/download/countrynames.txt
'use strict';

let csv = require('csv');
let _ = require('lodash');
let strScore = require('string-score');
let levenshtein = require('fast-levenshtein');
let etlCommon = require('./common');

function csvToObj(text) {
  return new Promise((resolve, reject) => {
    csv.parse(text, {delimiter: ';', comment: '#', trim: true}, (err, rows) => {
      let currencyCodes = rows.reduce((hash, row) => {
        let code2 = row[0],
            code3 = row[1],
            codeNum = row[2],
            names = row.slice(3);
        // Many of the names are in non-english languages. No conflicts, though.
        names.forEach((name) => {
          if (!name) return hash; // Lots of empty data.
          if (hash[name] && hash[name] != code2) {
            throw `Country name conflict on ${name}: ${hash[name]} and ${code2}.`
          }
          hash[name] = code2;
        });
        return hash;
      }, {});

      resolve(currencyCodes);
    });
  });
}

function normalize(name) {
  return _.deburr(name)
    .toLowerCase()
    .replace(/[\W]/g, ' ')
    .replace(/\sthe\s/, '')
    .replace(/[\s]/g, '')
}

function matchCountryByName(countryName, countryCodeDoc) {
  var bestMatch = {codes: [], names: [], score: Number.MAX_SAFE_INTEGER};
  for(let knownCountryName of Object.keys(countryCodeDoc)) {
    // We can normalize whitespace, case, and diacritics (_.deburr), but
    // the ISO can't even be that consistent. Use levenshtein.

    let code = countryCodeDoc[knownCountryName];
    let score = levenshtein.get(normalize(countryName), normalize(knownCountryName));
    if(score < bestMatch.score) {
      bestMatch = {codes: [code], score: score, names: [knownCountryName]};
    } else if(score == bestMatch.score && bestMatch.codes.indexOf(code) == -1) {
      bestMatch.codes.push(code);
      bestMatch.names.push(knownCountryName);
    }
  }

  if(bestMatch.codes.length > 1) {
    // console.log(`Too many matches for ${countryName} ${normalize(countryName)} ${bestMatch.score}: ${bestMatch.codes.join(',')}.`);
    return undefined;
  } else if(bestMatch.score > 1) {
    // console.log(`Low quality match for ${bestMatch.score} ${countryName} ${normalize(countryName)} ${bestMatch.codes} ${bestMatch.names}`);
    return undefined;
  } else {
    // console.log(`Good match for ${bestMatch.score} ${countryName} ${bestMatch.codes} ${bestMatch.names}`);
    return bestMatch.codes[0];
  }
}

function convertAndFilter(countryCodeDoc) {
  return etlCommon.readGenerated('currencies.json')
    .then((currenciesDoc) => {
      // Modify currenciesDoc so that country objects have a code property.

      var fails = [];
      currenciesDoc.forEach((currency) => {
        currency.countries.forEach((country) => {
          let countryCode = matchCountryByName(country.name, countryCodeDoc);
          if (countryCode) {
            country.code = countryCode;
          } else {
            fails.push(country.name);
          }
        });
      });

      console.log('Failed to match', fails.length, 'countries.', fails);

      return currenciesDoc;
    });
}

module.exports = function() {
  return etlCommon.download('http://opengeocode.org/download/countrynames.txt')
    .then(etlCommon.saveToDownloadsFactory('country-codes.txt'))
    .then(csvToObj)
    .then(etlCommon.saveToIntermediateFactory('country-codes.json', etlCommon.jsonStringify))
    .then(etlCommon.mergeManualEntriesFactory('country-codes.json'))
    .then(convertAndFilter)
    .then(etlCommon.saveToIntermediateFactory('currencies-with-country-codes.json'))
    // For now, this is the final product.
    .then(etlCommon.saveToGeneratedFactory('currencies.json'))
    .catch((err) => console.log('Error', err, err.stack));
}
