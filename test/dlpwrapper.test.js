defineTest('gcp-dlp-wrapper.js', function() {
  const assert = require('chai').assert;
  let rewire = require('rewire');
  let DlpWrapper = rewire('../lib/gcp-dlp-wrapper.js');

  it('[integration] should return non-strings', function(done) {
    this.timeout(2000);

    let original = "Hey it's David Johnson with ACME Corp. My SSN is 123-45-6789.";
    let expected = "Hey it's PERSON_NAME with ACME Corp. My SSN is US_SOCIAL_SECURITY_NUMBER.";
    let dlpRedactor = DlpWrapper();

    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: () =>
        Promise.resolve([
          {
            result: {
              findings: [
                { quote: 'David Johnson', infoType: { name: 'PERSON_NAME' } },
                { quote: 'David', infoType: { name: 'FIRST_NAME' } },
                { quote: 'Johnson', infoType: { name: 'LAST_NAME' } },
                { quote: 'David Johnson', infoType: { name: 'MALE_NAME' } },
                { quote: '123-45-6789', infoType: { name: 'US_SOCIAL_SECURITY_NUMBER' } }
              ]
            }
          }
        ])
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.equal(res, expected);
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('[integration] should not treat input as regex', function(done) {
    this.timeout(2000);

    let original = 'Just call (646) 846-1111 or (646) 846-3663 or (646) 846-3663.';
    let expected = 'Just call PHONE_NUMBER or PHONE_NUMBER or PHONE_NUMBER.';
    let dlpRedactor = DlpWrapper();

    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: () =>
        Promise.resolve([
          {
            result: {
              findings: [
                { quote: '(646) 846-1111', infoType: { name: 'PHONE_NUMBER' } },
                { quote: '(646) 846-3663', infoType: { name: 'PHONE_NUMBER' } },
                { quote: '(646) 846-3663', infoType: { name: 'PHONE_NUMBER' } }
              ]
            }
          }
        ])
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.equal(res, expected);
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('[integration] should prefer more likely matches', function(done) {
    this.timeout(2000);

    let original = 'Just call (646) 846-FOOD or (646) 846-3663.';
    let expected = 'Just call PHONE_NUMBER or PHONE_NUMBER.';
    let dlpRedactor = DlpWrapper();

    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: () =>
        Promise.resolve([
          {
            result: {
              findings: [
                { likelihood: 'POSSIBLE', quote: '(646) 846-FOOD', infoType: { name: 'LOCATION' } },
                { likelihood: 'VERY_LIKELY', quote: '(646) 846-FOOD', infoType: { name: 'PHONE_NUMBER' } },
                { likelihood: 'VERY_LIKELY', quote: '(646) 846-3663', infoType: { name: 'PHONE_NUMBER' } },
                { likelihood: 'POSSIBLE', quote: '(646) 846-3663', infoType: { name: 'LOCATION' } }
              ]
            }
          }
        ])
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.equal(res, expected);
        done();
      })
      .catch(e => {
        done(e);
      });
  });
});
