// Etl currency attributes:
// Currency Code, Currency Name, Country Name, Iso's ID
// http://www.currency-iso.org/dam/downloads/lists/list_one.xml
'use strict';

let xml2js = require('xml2js');
let _ = require('lodash');
let etlCommon = require('./common');

function xmlToObj(text) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(text, {explicitArray: false}, function(err, obj) {
      if (err) {
        reject(err);
      } else {
        resolve(obj);
      }
    });
  });
}

function convertAndFilter(doc) {
  let countries = doc.ISO_4217.CcyTbl.CcyNtry
    // <CcyNm IsFund="true">A Name</CcyNm> puts the attribute in $.
    // Ignore funds.
    .filter((entry) => !entry.CcyNm.$)
    // <CcyMnrUnts>N.A.</CcyMnrUnts> is only used by funds, metals, and other unuseful things.
    .filter((entry) => entry.CcyMnrUnts != 'N.A.')
    // Antarctica has no currency. Ignore.
    .filter((entry) => entry.Ccy)
    .map((entry) => {
      return {
        name: entry.CtryNm,
        currencyCode: entry.Ccy,
        currencyName: entry.CcyNm,
        iso4217Id: entry.CcyNbr,
        minorUnits: entry.CcyMnrUnts
      };
    });

  console.log('Countries associated with a currency:', countries.length);

  let byCode = _.groupBy(countries, (country) => country.currencyCode);
  let currencies = _.keys(byCode).map((code) => {
    let codeCountries = byCode[code];
    let first = codeCountries[0];
    return {
      code: code,
      name: first.currencyName,
      minorUnits: first.minorUnits,
      countries: codeCountries.map((country) => _.pick(country, ['name', 'iso4217Id']))
    };
  })

  console.log('Currencies extracted', currencies.length);

  return currencies;
}

function mergeNamePrefixes(currencies, prefixes) {
  currencies.forEach((currency) => {
    if(prefixes[currency.code]) {
      currency.name = prefixes[currency.code] + ' ' + currency.name;
      console.log(currency.code, currency.name);
    }
  });
  return currencies;
}

function friendlyNames(currencies) {
  // The official currency name is the Tugrik, but show Mongolian Tugrik.
  return etlCommon.readManualEntries('name-prefixes.json')
    .then((prefixes) => mergeNamePrefixes(currencies, prefixes));
}

module.exports = function() {
  return etlCommon.download('http://www.currency-iso.org/dam/downloads/lists/list_one.xml')
    .then(etlCommon.saveToDownloadsFactory('currency-names.xml'))
    .then(xmlToObj)
    .then(convertAndFilter)
    .then(friendlyNames)
    .then(etlCommon.saveToIntermediateFactory('currency-names.json'))
    .catch((err) => console.log('Error', err, err.stack));
}
