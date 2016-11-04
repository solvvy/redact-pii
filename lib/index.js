var omit = require('lodash/omit');
var forEach = require('lodash/forEach');
var mapValues = require('lodash/mapValues');
var snakeCase = require('lodash/snakeCase');
var patterns = require('./patterns.js');

function defaultReplace(name) {
  return snakeCase(name).toUpperCase();
}

function determineReplace(options) {
  if (typeof options.replace === 'function') {
    return name => options.replace(name, defaultReplace(name));
  } else if (typeof options.replace === 'string') {
    return () => options.replace;
  } else {
    return defaultReplace;
  }
}

function Redactor(userOpts) {
  var patternsToUse = Object.assign({}, patterns, omit(userOpts, ['replace']));
  var replace = determineReplace(userOpts || {});
  var replacements = mapValues(patternsToUse, (v, name) => replace(name));

  return {
    redact(text) {
      if (typeof text !== 'string') {
        return text;
      }

      forEach(patternsToUse, function (pattern, name) {
        if (pattern === false) {
          return;
        }

        text = text.replace(pattern, replacements[name]);
      });

      return text;
    }
  };
}

Object.assign(Redactor, {patterns});
module.exports = Redactor;
