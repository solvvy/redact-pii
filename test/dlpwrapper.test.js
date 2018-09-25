defineTest('dlpwrapper.js', function () {
  const assert = require('chai').assert;
  let rewire = require('rewire');
  let dlpWrapper = rewire('../lib/dlpwrapper.js');

  it('should return non-strings', function () {
    let original = 'Hey it\'s David Johnson with ACME Corp. My SSN is 123-45-6789.';
    let expected = 'Hey it\'s PERSON_NAME with ACME Corp. My SSN is US_SOCIAL_SECURITY_NUMBER.';
    dlpWrapper.__set__('dlp', {
      projectPath: () => 'mock-project',
      inspectContent: () => Promise.resolve([
        {
          result: {
            findings: [
              {quote: "David Johnson", infoType: {name: "PERSON_NAME"}},
              {quote: "David", infoType: {name: "FIRST_NAME"}},
              {quote: "Johnson", infoType: {name: "LAST_NAME"}},
              {quote: "David Johnson", infoType: {name: "MALE_NAME"}},
              {quote: "123-45-6789", infoType: {name: "US_SOCIAL_SECURITY_NUMBER"}},
            ]
          }
        }
      ])
    });
    dlpWrapper.redactText({originalText : original}).then(res => {
      assert.equal(res, expected);
    })
  });
});
