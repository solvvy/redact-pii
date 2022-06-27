import { GoogleDLPRedactor, AsyncRedactor, SyncRedactor } from '../src';

const redactor = new SyncRedactor();
const compositeRedactorWithDLP = new AsyncRedactor({
  builtInRedactors: {
    zipcode: {
      enabled: false,
    },
    digits: {
      enabled: false,
    },
  },
  customRedactors: {
    before: [
      {
        regexpPattern: /(banana|apple|orange)/,
        replaceWith: 'FOOD',
      },
    ],
    after: [new GoogleDLPRedactor()],
  },
});

describe('index.js', function () {
  const runGoogleDLPTests = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

  type InputAssertionTuple = [string, string, string?];

  function TestCase(description: string, thingsToTest: Array<InputAssertionTuple>) {
    it(description, async () => {
      for (const [input, syncOutput, googleDLPOutput] of thingsToTest) {
        expect(redactor.redact(input)).toBe(syncOutput);
        if (runGoogleDLPTests && googleDLPOutput) {
          await expect(compositeRedactorWithDLP.redactAsync(input)).resolves.toBe(googleDLPOutput);
        }
      }
    });
  }

  TestCase.only = function (description: string, thingsToTest: Array<InputAssertionTuple>) {
    it.only(description, async () => {
      for (const [input, syncOutput, googleDLPOutput] of thingsToTest) {
        expect(redactor.redact(input)).toBe(syncOutput);
        if (googleDLPOutput) {
          await expect(compositeRedactorWithDLP.redactAsync(input)).resolves.toBe(googleDLPOutput);
        }
      }
    });
  };

  TestCase('should redact PII', [["Hey it's David Johnson with 1234", "Hey it's PERSON_NAME with DIGITS"]]);

  runGoogleDLPTests &&
    it('[integration] should redact non english text', async function () {
      jest.setTimeout(7000);
      await expect(compositeRedactorWithDLP.redactAsync('我的名字是王')).resolves.toBe('我的名字是王');
      await expect(compositeRedactorWithDLP.redactAsync('我的卡号是 1234')).resolves.toBe('PERSON_NAME是 1234');
      await expect(compositeRedactorWithDLP.redactAsync('我的电话是 444-3332-343')).resolves.toBe(
        '我的电话是 PHONE_NUMBER'
      );
      await expect(compositeRedactorWithDLP.redactAsync("Hey it's David Johnson with 1234")).resolves.toBe(
        "Hey it's LAST_NAME with 1234"
      );
      await expect(
        compositeRedactorWithDLP.redactAsync(
          'Hi banana, my credit card is 4111111111111111 and I need help. Thanks, John'
        )
      ).resolves.toBe('Hi FOOD, my credit card is CREDIT_CARD_NUMBER and I need help. Thanks, LAST_NAME');
    });
});
