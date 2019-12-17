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

  it('should automatically batch content over size limit', async function() {
    const dlpRedactor = new GoogleDLPRedactor({
      // disableAutoBatchWhenContentSizeExceedsLimit: false,
      maxContentSizeForBatch: 10
    });
    mockDlpProject(dlpRedactor);

    let inspectContentCalls = [];
    dlpRedactor.dlpClient.inspectContent = options => {
      inspectContentCalls.push(options);
      return Promise.resolve([
        {
          result: {
            findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
          }
        }
      ]);
    };

    const original = 'Name is John. Name is John';
    // first occurrence of John should be missed because its on the batch boundary
    const expected = 'Name is John. Name is NAME';

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);

    expect(inspectContentCalls.length).toBe(3);
  });

  it('should not automatically batch content over size limit when disabled', async function() {
    const dlpRedactor = new GoogleDLPRedactor({
      disableAutoBatchWhenContentSizeExceedsLimit: true,
      maxContentSizeForBatch: 10
    });
    mockDlpProject(dlpRedactor);

    let inspectContentCalls = [];
    dlpRedactor.dlpClient.inspectContent = options => {
      inspectContentCalls.push(options);
      return Promise.resolve([
        {
          result: {
            findings: [{ quote: 'John', infoType: { name: 'NAME' } }]
          }
        }
      ]);
    };

    const original = 'Name is John. Name is John';
    const expected = 'Name is NAME. Name is NAME';

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);

    expect(inspectContentCalls.length).toBe(1);
  });

  it('should not replace tokens for overlapping findings', async function() {
    const original = 'My name is John SON.';
    const expected = 'My name is PERSON_NAME.';

    dlpRedactor.dlpClient.inspectContent = () =>
      Promise.resolve([
        {
          result: {
            findings: [
              {
                quote: 'John SON',
                infoType: { name: 'PERSON_NAME' },
                location: { byteRange: { start: '11', end: '19' } }
              },
              { quote: 'John', infoType: { name: 'FIRST_NAME' }, location: { byteRange: { start: '11', end: '15' } } },
              { quote: 'SON', infoType: { name: 'LAST_NAME' }, location: { byteRange: { start: '15', end: '19' } } }
            ]
          }
        }
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });

  it('should prefer higher likelihood when removing overlapping findings', async function() {
    const original = 'My name is John SON.';
    const expected = 'My name is LIKELY_NAME.';

    dlpRedactor.dlpClient.inspectContent = () =>
      Promise.resolve([
        {
          result: {
            findings: [
              {
                quote: 'John',
                infoType: { name: 'FIRST_NAME' },
                location: { byteRange: { start: '11', end: '15' } },
                likelihood: 'POSSIBLE'
              },
              {
                quote: 'SON',
                infoType: { name: 'LAST_NAME' },
                location: { byteRange: { start: '15', end: '19' } },
                likelihood: 'POSSIBLE'
              },
              {
                quote: 'John SON',
                infoType: { name: 'POSSIBLE_NAME' },
                location: { byteRange: { start: '11', end: '19' } },
                likelihood: 'POSSIBLE'
              },
              {
                quote: 'John SON',
                infoType: { name: 'LIKELY_NAME' },
                location: { byteRange: { start: '11', end: '19' } },
                likelihood: 'LIKELY'
              }
            ]
          }
        }
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });

  it('should remove overlapping findings where a finding is completely contained inside another finding', async function() {
    const original = 'My name is John Francis Doe.';
    const expected = 'My name is FULL_NAME.';

    dlpRedactor.dlpClient.inspectContent = () =>
      Promise.resolve([
        {
          result: {
            findings: [
              {
                quote: 'Francis',
                infoType: { name: 'MIDDLE_NAME' },
                location: { byteRange: { start: '16', end: '23' } },
                likelihood: 'POSSIBLE'
              },
              {
                quote: 'John Francis Doe',
                infoType: { name: 'FULL_NAME' },
                location: { byteRange: { start: '11', end: '27' } },
                likelihood: 'POSSIBLE'
              }
            ]
          }
        }
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });

  it('should remove overlapping findings where a finding is completely contained inside another finding and respect likelihood', async function() {
    const original = 'My name is John Francis Doe.';
    const expected = 'My name is John MIDDLE_NAME Doe.';

    dlpRedactor.dlpClient.inspectContent = () =>
      Promise.resolve([
        {
          result: {
            findings: [
              {
                quote: 'Francis',
                infoType: { name: 'MIDDLE_NAME' },
                location: { byteRange: { start: '16', end: '23' } },
                likelihood: 'LIKELY'
              },
              {
                quote: 'John Francis Doe',
                infoType: { name: 'FULL_NAME' },
                location: { byteRange: { start: '11', end: '27' } },
                likelihood: 'POSSIBLE'
              }
            ]
          }
        }
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });

  it('should not replace tokens for findings quotes that are too small', async function() {
    const original = 'My name is John S and I like Snow.';
    const expected = 'My name is FIRST_NAME S and I like Snow.';

    dlpRedactor.dlpClient.inspectContent = () =>
      Promise.resolve([
        {
          result: {
            findings: [
              { quote: 'John', infoType: { name: 'FIRST_NAME' }, location: { byteRange: { start: '11', end: '15' } } },
              { quote: 'S', infoType: { name: 'LAST_NAME' }, location: { byteRange: { start: '16', end: '17' } } }
            ]
          }
        }
      ]);

    await expect(dlpRedactor.redactAsync(original)).resolves.toBe(expected);
  });
});
