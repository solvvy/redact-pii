This repository has moved to [gitlab](https://gitlab.com/solvvy/redact-pii).
Please clone and fork from there. All future work will occur in gitlab and
will be mirrored here.

# redact-pii
[![NPM Package](https://badge.fury.io/js/redact-pii.svg)](https://www.npmjs.com/package/redact-pii)
[![Build Status](https://travis-ci.org/solvvy/redact-pii.svg?branch=master)](https://travis-ci.org/solvvy/redact-pii)
[![Coverage Status](https://coveralls.io/repos/github/solvvy/redact-pii/badge.svg?branch=master)](https://coveralls.io/github/solvvy/redact-pii?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Dependencies](https://david-dm.org/solvvy/redact-pii.svg)](https://david-dm.org/solvvy/redact-pii)

Remove personally identifiable information from text.  This library should work on server or in browser (at least ie11+ compatibility).

## Usage
```
npm install redact-pii
```

```js
var redactor = require('redact-pii')();
redactor.redact('Hi David Johnson, Please give me a call at 555-555-5555').then(res => {
    console.log(res);
    // Hi NAME, Please give me a call at PHONE_NUMBER
});
```

There is also an option to forward the requests to use Google's [Data Loss Prevention API](https://cloud.google.com/dlp/). To enable this option, replace client email and private key with the values from the service account with dlp permission in the below example and pass the option in the constructor i.e

```js
var redactor = require('redact-pii')({enableOnline : true, gauth_credentials : {client_email: 'client_email', private_key: 'api_key'}});
redactor.redact('我的卡号是1234-5678-9876-5432').then(res => {
    console.log(res);
    //我的卡号是CREDIT_CARD_NUMBER
});
```
This redacts of an exhaustive list of languages (Chinese, German,etc) and exhaustive list of [PII fields](https://cloud.google.com/dlp/docs/infotypes-reference)

## API

### Redactor(options)
* `options` {Object}
  * `replace` {String|Function} If a string, the value will be used as the replacement for all identified patterns. If a function, the function will be called with the name of each pattern to determine the replacement value for the pattern.
  * `*` {RegExp|`false`} Any other key in options will be treated as a regular expression to use for replacing matches, `false` if no replacement is desired for a particular pattern. The following patterns are enabled by default.
    * credentials
    * creditCardNumber
    * emailAddress
    * ipAddress
    * name
    * password
    * phoneNumber
    * streetAddress
    * username
    * usSocialSecurityNumber
    * zipcode
    * url
    * digits

### redactor.redact(text)
* `text` {String} The text which contains PII to redact
* *returns {String}* The text with PII redacted

## Customization

### Replacement Values
```js
var redactor = require('redact-pii')({replace: 'TOP_SECRET'});
redactor.redact('Dear David Johnson, I live at 42 Wallaby Way');
// Dear TOP_SECRET, I live at TOP_SECRET

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
redactor.redact('Dear David Johnson, I live at 42 Wallaby Way');
// Dear David Johnson, I live at STREET_ADDRESS


var redactor = require('redact-pii')({animal: /\b(cat|dog|cow)s?\b/gi});
redactor.redact('I love cats, dogs, and cows');
// I love ANIMAL, ANIMAL, and ANIMAL
```


### Additional Redaction with Google's Data Loss Prevention API

In addition to custom redaction, the request is also forwarded to Google's Redactor a.k.a [Data Loss Prevention API](https://cloud.google.com/dlp/). To enable redaction by Google's API, in `dlpwrapper.js`, set the option enable to `true`(defaulted to false) and assign gauth_credentials(client_email and private key) The same would be available in the service account key file. You can set the option to timeout (defaulted to 1.5s) to bypass through the google API in case the service is too slow for your needs.

To generate the key file, navigate to https://console.cloud.google.com/home/dashboard and select your appropriate project(make sure the name of the project is same as in `dlpwrapper.js`).

Then in API's and Services > Library, search for Data Loss Prevention API and enable it for your project.

To generate the key file, navigate to API's and Services > Credentials, Click "Create Credentials" and choose a service account; Create a new service account(or use any unused service account if you have one) and type=json and create the key. Place the contents of this key in `~/.redact-pii/google-account-placeholder-key.json` OR place your key in `~/.redact-pii/<your-key>` and update the name in `dlpwrapper.js` to `your-key`.

### Debug
To run the test cases in Intellij, add this to the run configuration  
Working directory: ~/Work/Code/redact-pii/  
Javascript file: node_modules/mocha/bin/mocha  
Application parameters: xo ./lib/**/*.js && mocha -s 20 --timeout 10000 --reporter spec --require test/bootstrap test/*.test.js test/**/*.test.js

Application parameters: xo --inspect-brk ./lib/**/*.js && mocha -s 20 --timeout 10000 --reporter spec --require test/bootstrap test/*.test.js test/**/*.test.js