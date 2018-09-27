const omit = require('lodash/omit');
const assign = require('lodash/assign');
const forEach = require('lodash/forEach');
const mapValues = require('lodash/mapValues');
const snakeCase = require('lodash/snakeCase');
const identity = require('lodash/identity');
const patterns = require('./patterns.js');
const DlpWrapper = require('./gcp-dlp-wrapper.js');

function defaultReplace(name) {
  return name === 'names' ? '$1PERSON_NAME' : name === 'greetOrClose' ? 'PERSON_NAME' : snakeCase(name).toUpperCase();
}

function determineReplace(options) {
  if (typeof options.replace === 'function') {
    return function(name) {
      return options.replace(name, defaultReplace(name));
    };
  } else if (typeof options.replace === 'string') {
    return function() {
      return options.replace;
    };
  } else {
    return defaultReplace;
  }
}

function Redactor(userOpts) {
  let patternsToUse = assign({}, patterns, omit(userOpts, ['replace']));
  let replace = determineReplace(userOpts || {});
  let dlpRedactor = userOpts.enableGoogleCloudDLP ? new DlpWrapper(userOpts.googleCloudDLPOptions) : null;
  let replacements = mapValues(patternsToUse, function(v, name) {
    return replace(name);
  });

  return {
    redact: function(text) {
      if (typeof text !== 'string') {
        return Promise.resolve(text);
      }

      return Promise.resolve(text)
        .then(redactedText => {
          forEach(patternsToUse, function(pattern, name) {
            if (pattern === false || name === 'nameGeneric') {
              return;
            }

            if (name === 'greetOrClose') {
              let pattern2 = patterns.nameGeneric;
              pattern.lastIndex = 0;
              pattern2.lastIndex = 0;
              let mtch = pattern.exec(redactedText);
              while (mtch !== null) {
                pattern2.lastIndex = pattern.lastIndex;
                let mtch2 = pattern2.exec(redactedText);
                if (mtch2 !== null && mtch2.index === pattern.lastIndex) {
                  let suffix = mtch2[5] === null ? '' : mtch2[5];
                  redactedText =
                    redactedText.slice(0, mtch2.index) +
                    replacements[name] +
                    suffix +
                    redactedText.slice(mtch2.index + mtch2[0].length);
                }
                mtch = pattern.exec(redactedText);
              }
            } else {
              redactedText = redactedText.replace(pattern, replacements[name]);
            }
          });
          return redactedText;
        })
        .then(userOpts && userOpts.enableGoogleCloudDLP ? dlpRedactor.redactText : identity);
    }
  };
}

assign(Redactor, { patterns: patterns });
module.exports = Redactor;
