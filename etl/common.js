// Common functions used by all steps
'use strict';

let superagent = require('superagent');
let fs = require('fs');

let root_dir = __dirname + '/../';
let data_dir = root_dir + 'data/';
let downloads_dir = data_dir + 'downloads/';
let intermediate_dir = data_dir + 'intermediate/';
let generated_dir = data_dir + 'generated/';

function download(url) {
  return new Promise(function(resolve, reject) {
    superagent
      .get(url)
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

function writeFile(dir, name, doc, serializer) {
  let path = dir + name;
  let text = serializer ? serializer(doc) : doc;
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, text, function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`Wrote ${path}`);
        resolve(doc);
      }
    });
  });
}

function jsonStringify(obj) {
  // Pretty print our data files.
  return JSON.stringify(obj, null, 4);
}

function saveToDownloadsFactory(name) {
  return (text) => writeFile(downloads_dir, name, text)
}

function saveToIntermediateFactory(name, serializer) {
  return (doc) => writeFile(intermediate_dir, name, doc, serializer)
}

function saveToGeneratedFactory(name, serializer) {
  return (doc) => writeFile(generated_dir, name, doc, serializer)
}

module.exports = {
  download: download,
  jsonStringify: jsonStringify,
  saveToDownloadsFactory: saveToDownloadsFactory,
  saveToIntermediateFactory: saveToIntermediateFactory,
  saveToGeneratedFactory: saveToGeneratedFactory
}
