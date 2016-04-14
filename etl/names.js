// Etl currency attributes:
// Currency Code, Currency Name, Country Name, Iso's ID
// http://www.currency-iso.org/dam/downloads/lists/list_one.xml
'use strict';

let superagent = require('superagent');
let xml2js = require('xml2js');
let fs = require('fs');
let _ = require('lodash');

let root_dir = __dirname + '/../';
let data_dir = root_dir + 'data/';
let downloads_dir = data_dir + 'downloads/';
let intermediate_dir = data_dir + 'intermediate/';

function download() {
  return new Promise(function(resolve, reject) {
    superagent
      .get('http://www.currency-iso.org/dam/downloads/lists/list_one.xml')
      .set('From', 'cheriot@gmail.com')
      .set('User-Agent', 'Christopher Heriot <cheriot@gmail.com>')
      .buffer(true)
      .end(function(err, res) {
        if(200 == res.status) {
          resolve(res.text);
        } else {
          let msg = `Error: ${err.status} ${err.response}`;
          console.error(msg);
          reject(msg);
        }
      });
  });
}

function saveToDownloadsFactory(name) {
  console.log('saveToDownloadsFactory');
  return function(doc) {
    console.log('saveToDownloads');
    let path = downloads_dir + name;
    return new Promise(function(resolve, reject) {
      fs.writeFile(path, doc, function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`Saved ${path}`);
          resolve(doc);
        }
      });
    });
  }
}

function saveToPartialsFactory(name) {
  return function(doc) {
    // save to data/partials/name
    console.log('save to data/partials/name here');
    return doc;
  }
}

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
        isoId: entry.CcyNbr,
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
      countries: codeCountries.map((country) => _.pick(country, ['name', 'isoId']))
    };
  })

  console.log('Currencies extracted', currencies.length);

  return currencies;
}

module.exports = function() {
  download()
    .then(saveToDownloadsFactory('names-source.xml'))
    .then(xmlToObj)
    .then(convertAndFilter)
    .then(saveToPartialsFactory('names.json'))
    .catch((err) => console.log('Error', err));
}
