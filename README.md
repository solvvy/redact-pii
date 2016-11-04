# redact-pii
[![NPM Package](https://badge.fury.io/js/redact-pii.svg)](https://www.npmjs.com/package/redact-pii)
[![Build Status](https://travis-ci.org/solvvy/redact-pii.svg?branch=master)](https://travis-ci.org/solvvy/redact-pii)
[![Coverage Status](https://coveralls.io/repos/github/solvvy/redact-pii/badge.svg?branch=master)](https://coveralls.io/github/solvvy/redact-pii?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Dependencies](https://david-dm.org/solvvy/redact-pii.svg)](https://david-dm.org/solvvy/redact-pii)

Remove personally identifiable information from text.

## Usage
```
npm install redact-pii
```

```js
var redactor = require('redact-pii')();
var redacted = redactor.redact('Hey it\'s David Johnson with ACME Corp. Give me a call at 555-555-5555');
// Hey it's NAME with COMPANY. Give me a call at PHONE_NUMBER
```

## API

### Redactor(options)
* `options` {Object}
  * `replace` {String|Function} If a string, the value will be used as the replacement for all identified patterns. If a function, the function will be called with the name of each pattern to determine the replacement value for the pattern.
  * `*` {RegExp|`false`} Any other key in options will be treated as a regular expression to use for replacing matches, `false` if no replacement is desired for a particular pattern. The following patterns are enabled by default.
    * company
    * credentials
    * creditCardNumber
    * emailAddress
    * ipAddress
    * name
    * password
    * phoneNumber
    * salutation
    * streetAddress
    * username
    * valediction
    * zipcode

### redactor.redact(text)
* `text` {String} The text which contains PII to redact
* *returns {String}* The text with PII redacted

## Customization

### Replacement Values
```js
var redactor = require('redact-pii')({replace: 'TOP_SECRET'});
redactor.redact('David Johnson lives at 42 Wallaby Way');
// TOP_SECRET lives at TOP_SECRET

var redactor = require('redact-pii')({
  replace: function (name, defaultReplacement) {
    if (name === 'creditCardNumber') {
      return value => 'XXXXXXXXXXXX' + value.slice(12);
    } else {
      return defaultReplacement;
    }
  }
});
redactor.redact('my CC is 1234567812345678');
// my CC is XXXXXXXXXXXX5678
```

### Patterns
```js
var redactor = require('redact-pii')({name: false});
redactor.redact('David Johnson lives at 42 Wallaby Way');
// David Johnson lives at STREET_ADDRESS


var redactor = require('redact-pii')({animal: /\b(cat|dog|cow)s?\b/gi});
redactor.redact('I love cats, dogs, and cows');
// I love ANIMAL, ANIMAL, and ANIMAL
```
