import { GoogleDLPRedactor, defaultInfoTypes } from '../src/custom/GoogleDLPRedactor';

function mockDlpProject(dlpRedactor: GoogleDLPRedactor) {
  Object.assign(dlpRedactor.dlpClient, {
    getProjectId: () => Promise.resolve('mock-project'),
    projectPath: () => 'projects/mock-project'
  });
}

describe(GoogleDLPRedactor.name, function() {
  const dlpRedactor = new GoogleDLPRedactor();

  mockDlpProject(dlpRedactor);

  it('can do basic redaction', async function() {
    const original = "Hey it's David Johnson with ACME Corp. My SSN is 123-45-6789.";
    const expected = "Hey it's PERSON_NAME with ACME Corp. My SSN is US_SOCIAL_SECURITY_NUMBER.";

    dlpRedactor.dlpClient.inspectContent = () =>
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
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });

  it('should not treat input as regex', async function() {
    const original = 'Just call (446) 856-1234 or (524) 123-3666 or (718) 213-8812.';
    const expected = 'Just call PHONE_NUMBER or PHONE_NUMBER or PHONE_NUMBER.';

    dlpRedactor.dlpClient.inspectContent = () =>
      Promise.resolve([
        {
          result: {
            findings: [
              { quote: '(446) 856-1234', infoType: { name: 'PHONE_NUMBER' } },
              { quote: '(524) 123-3666', infoType: { name: 'PHONE_NUMBER' } },
              { quote: '(718) 213-8812', infoType: { name: 'PHONE_NUMBER' } }
            ]
          }
        }
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });

  it('should prefer more likely matches', async function() {
    const original = 'Just call (646) 846-FOOD or (646) 846-3663.';
    const expected = 'Just call PHONE_NUMBER or PHONE_NUMBER.';

    dlpRedactor.dlpClient.inspectContent = () =>
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
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });

  it('should allow including additional info types using includeInfoTypes option', async function() {
    const original = 'My name is John';
    const expected = 'My name is NAME';
    const dlpRedactor = new GoogleDLPRedactor({
      includeInfoTypes: ['ADDITIONAL_DLP_INFO_TYPE1', 'ADDITIONAL_DLP_INFO_TYPE2']
    });

    mockDlpProject(dlpRedactor);

    let inspectContentCallOptions = null;
    dlpRedactor.dlpClient.inspectContent = options => {
      inspectContentCallOptions = options;
      return Promise.resolve([
        {
          result: {
            findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
          }
        }
      ]);
    };

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);

    const actualInfoTypes = inspectContentCallOptions.inspectConfig.infoTypes.map(infoType => infoType.name);
    expect(actualInfoTypes).toHaveLength(defaultInfoTypes.length + 2);
    expect(actualInfoTypes).toContain('ADDITIONAL_DLP_INFO_TYPE1');
    expect(actualInfoTypes).toContain('ADDITIONAL_DLP_INFO_TYPE2');
  });

  it('should allow excluding info types from default set using excludeInfoTypes option', async function() {
    const original = 'My name is John';
    const expected = 'My name is NAME';
    const dlpRedactor = new GoogleDLPRedactor({
      excludeInfoTypes: ['CANADA_PASSPORT', 'FRANCE_PASSPORT']
    });

    mockDlpProject(dlpRedactor);

    let inspectContentCallOptions = null;
    dlpRedactor.dlpClient.inspectContent = options => {
      inspectContentCallOptions = options;
      return Promise.resolve([
        {
          result: {
            findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
          }
        }
      ]);
    };

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);

    const actualInfoTypes = inspectContentCallOptions.inspectConfig.infoTypes.map(infoType => infoType.name);
    expect(actualInfoTypes).toHaveLength(defaultInfoTypes.length - 2);
    expect(actualInfoTypes).not.toContain('ADDITIONAL_DLP_INFO_TYPE1');
    expect(actualInfoTypes).not.toContain('ADDITIONAL_DLP_INFO_TYPE2');
  });

  it('should allow overriding default inspectConfig options', async function() {
    const customInfoType = {
      infoType: { name: 'FOO' },
      regex: { pattern: 'foo' }
    };

    const original = 'My name is John';
    const expected = 'My name is NAME';
    const dlpRedactor = new GoogleDLPRedactor({
      inspectConfig: {
        customInfoTypes: [customInfoType]
      }
    });

    mockDlpProject(dlpRedactor);

    let inspectContentCallOptions = null;
    dlpRedactor.dlpClient.inspectContent = options => {
      inspectContentCallOptions = options;
      return Promise.resolve([
        {
          result: {
            findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
          }
        }
      ]);
    };

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);

    const customInfoTypes = inspectContentCallOptions.inspectConfig.customInfoTypes;
    expect(customInfoTypes).toHaveLength(1);
    expect(customInfoTypes).toEqual([customInfoType]);
  });
});
