var omit = require('lodash/omit');
var forEach = require('lodash/forEach');
var mapValues = require('lodash/mapValues');
var snakeCase = require('lodash/snakeCase');
var patterns = require('./patterns.js');

function defaultReplace(name) {
  return name === 'names' ? '$1NAME' :
      name === 'greetOrClose' ? 'NAME' :
          snakeCase(name).toUpperCase();
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
        if (pattern === false || name === 'nameGeneric') {
          return;
        }

        if (name === 'greetOrClose') {
          var pattern2 = patterns.nameGeneric;
          pattern.lastIndex = 0;
          pattern2.lastIndex = 0;
          var mtch = pattern.exec(text);
          while (mtch !== null) {
            pattern2.lastIndex = pattern.lastIndex;
            var mtch2 = pattern2.exec(text);
            if (mtch2 !== null && mtch2.index === pattern.lastIndex) {
              var suffix = mtch2[5] === null ? '' : mtch2[5];
              text = text.slice(0, mtch2.index) + replacements[name] + suffix +
                  text.slice(mtch2.index + mtch2[0].length);
            }
            mtch = pattern.exec(text);
          }
        } else {
          text = text.replace(pattern, replacements[name]);
        }
      });

      return text;
    }
  };
}

Object.assign(Redactor, {patterns});
module.exports = Redactor;
