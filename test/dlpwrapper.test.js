const NUM_DEFAULT_INFO_TYPES = 78;

defineTest('gcp-dlp-wrapper.js', function() {
  const assert = require('chai').assert;
  let rewire = require('rewire');
  let DlpWrapper = rewire('../lib/gcp-dlp-wrapper.js');

  it('should return non-strings', function(done) {
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

  it('should not treat input as regex', function(done) {
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

  it('should prefer more likely matches', function(done) {
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

  it('should use fallback redaction if an error is thrown', function(done) {
    this.timeout(2000);

    let original = "Hey it's David Johnson with ACME Corp. I live in Utah";
    let dlpRedactor = DlpWrapper();

    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: () => Promise.reject('error happened')
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.equal(res, original);
        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should throw the error if fallback redaction is turned off and an error is thrown', function(done) {
    this.timeout(2000);

    let original = "Hey it's David Johnson with ACME Corp. My SSN is 123-45-6789.";
    let dlpRedactor = DlpWrapper({ googleCloudDLPOptions: { disableFallbackRedaction: true } });

    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: () => Promise.reject('error happened')
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.fail('Promise should have rejected.');
        done();
      })
      .catch(e => {
        assert.equal(e, 'error happened');
        done();
      });
  });

  it('should allow including additional info types using includeInfoTypes option', function(done) {
    this.timeout(2000);

    let original = 'My name is John';
    let expected = 'My name is NAME';
    let dlpRedactor = DlpWrapper({
      googleCloudDLPOptions: {
        inspectOverrides: {
          includeInfoTypes: ['ADDITIONAL_DLP_INFO_TYPE1', 'ADDITIONAL_DLP_INFO_TYPE2']
        }
      }
    });

    let inspectContentCallOptions = null;
    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: options => {
        inspectContentCallOptions = options;
        return Promise.resolve([
          {
            result: {
              findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
            }
          }
        ]);
      }
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.equal(res, expected);

        const actualInfoTypes = inspectContentCallOptions.inspectConfig.infoTypes;
        assert.equal(actualInfoTypes.length, NUM_DEFAULT_INFO_TYPES + 2);
        assert.isOk(actualInfoTypes.find(infoType => infoType.name === 'ADDITIONAL_DLP_INFO_TYPE1'));
        assert.isOk(actualInfoTypes.find(infoType => infoType.name === 'ADDITIONAL_DLP_INFO_TYPE2'));

        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should allow excluding info types from default set using excludeInfoTypes option', function(done) {
    this.timeout(2000);

    let original = 'My name is John';
    let expected = 'My name is NAME';
    let dlpRedactor = DlpWrapper({
      googleCloudDLPOptions: {
        inspectOverrides: {
          excludeInfoTypes: ['CANADA_PASSPORT', 'FRANCE_PASSPORT']
        }
      }
    });

    let inspectContentCallOptions = null;
    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: options => {
        inspectContentCallOptions = options;
        return Promise.resolve([
          {
            result: {
              findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
            }
          }
        ]);
      }
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.equal(res, expected);

        const actualInfoTypes = inspectContentCallOptions.inspectConfig.infoTypes;
        assert.equal(actualInfoTypes.length, NUM_DEFAULT_INFO_TYPES - 2);
        assert.isNotOk(actualInfoTypes.find(infoType => infoType.name === 'CANADA_PASSPORT'));
        assert.isNotOk(actualInfoTypes.find(infoType => infoType.name === 'FRANCE_PASSPORT'));

        done();
      })
      .catch(e => {
        done(e);
      });
  });

  it('should allow overriding default inspectConfig options', function(done) {
    this.timeout(2000);

    const customInfoType = {
      infoType: { name: 'FOO' },
      regex: { pattern: 'foo' }
    };

    let original = 'My name is John';
    let expected = 'My name is NAME';
    let dlpRedactor = DlpWrapper({
      googleCloudDLPOptions: {
        inspectOverrides: {
          inspectConfig: {
            customInfoTypes: [customInfoType]
          }
        }
      }
    });

    let inspectContentCallOptions = null;
    DlpWrapper.__set__('dlp', {
      getProjectId: () => Promise.resolve('mock-project'),
      projectPath: () => 'projects/mock-project',
      inspectContent: options => {
        inspectContentCallOptions = options;
        return Promise.resolve([
          {
            result: {
              findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
            }
          }
        ]);
      }
    });

    dlpRedactor
      .redactText(original)
      .then(res => {
        assert.equal(res, expected);

        const customInfoTypes = inspectContentCallOptions.inspectConfig.customInfoTypes;
        assert.equal(customInfoTypes.length, 1);
        assert.deepEqual(customInfoTypes, [customInfoType]);

        done();
      })
      .catch(e => {
        done(e);
      });
  });
});
