defineTest('index.js', function(Redactor) {
  // to use the google API, there needs a key to be present at ~/.redact-pii/google-account-placeholder-key.json
  let useGoogleApi = false;
  // process.env.GOOGLE_APPLICATION_CREDENTIALS = "/home/user/Downloads/[FILE_NAME].json";
  let redactor = Redactor({ enableGoogleCloudDLP: useGoogleApi });
  const assert = require('chai').assert;
  const dlpWrapper = require('../lib/gcp-dlp-wrapper.js');

  function verify(items) {
    items.forEach(function(item) {
      return redactor.redact(item).then(res => {
        assert.equal(res, item);
      });
    });
  }

  it('should return non-strings', function() {
    let obj = { foo: 'bar' };
    return redactor
      .redact(undefined)
      .then(res => {
        assert.equal(typeof res, 'undefined');
      })
      .then(() => {
        return redactor.redact(null).then(res => {
          assert.equal(typeof res, 'object');
        });
      })
      .then(() => {
        return redactor.redact(obj).then(res => {
          assert.equal(res, obj);
        });
      })
      .then(() => {
        return redactor.redact(true).then(res => {
          assert.equal(res, true);
        });
      })
      .then(() => {
        return redactor.redact(1234).then(res => {
          assert.equal(res, 1234);
        });
      });
  });

  it('should be speedy', function() {
    this.timeout(100);
    for (let i = 0; i < 100; i++) {
      redactor.redact('hi I had a quick question about using the service');
    }
  });

  it('should be speedy even with lots of newlines', function(done) {
    this.timeout(100);

    let text =
      'foo\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nbar';
    redactor.redact(text).then(function(res) {
      assert.equal(res, text);
      done();
    });
  });

  it('should redact PII', function() {
    let original = "Hey it's David Johnson with ACME Corp. Give me a call at 555-555-5555";
    return redactor.redact(original).then(res => {
      useGoogleApi
        ? assert.equal(res, "Hey it's PERSON_NAME with ACME Corp. Give me a call at PHONE_NUMBER")
        : assert.equal(res, "Hey it's PERSON_NAME with ACME Corp. Give me a call at PHONE_NUMBER");
    });
  });

  it('should replace names', function() {
    return redactor
      .redact('blah blah\nThis is very important.')
      .then(res => {
        assert.equal(res, 'blah blah\nThis is very important.');
      })
      .then(() => {
        return redactor.redact('blah blah\n\nThank you ..Risemamy McCrubben').then(res => {
          assert.equal(res, 'blah blah\n\nThank you ..PERSON_NAME');
        });
      })
      .then(() => {
        return redactor.redact('blah blah. Thanks -Jon').then(res => {
          assert.equal(res, 'blah blah. Thanks -PERSON_NAME');
        });
      })
      .then(() => {
        return redactor.redact("here's my Cliff. blah blah").then(res => {
          useGoogleApi
            ? assert.equal(res, "here's my PERSON_NAME. blah blah")
            : assert.equal(res, "here's my Cliff. blah blah");
        });
      })
      .then(() => {
        return redactor.redact("here's my Clifford. blah blah").then(res => {
          useGoogleApi
            ? assert.equal(res, "here's my PERSON_NAME. blah blah")
            : assert.equal(res, "here's my PERSON_NAME. blah blah");
        });
      })
      .then(() => {
        return redactor.redact('Dear Clifford,\n blah blah').then(res => {
          assert.equal(res, 'Dear PERSON_NAME,\n blah blah');
        });
      })
      .then(() => {
        return redactor.redact('blah blah\n\n\nthanks,\nAnna\n blah blah').then(res => {
          assert.equal(res, 'blah blah\n\n\nthanks,\nPERSON_NAME\n blah blah');
        });
      })
      .then(() => {
        return redactor.redact('blah blah\n\n\nAnna\n blah blah').then(res => {
          assert.equal(res, 'blah blah\n\n\nPERSON_NAME\n blah blah');
        });
      })
      .then(() => {
        return redactor.redact('blah blah\n\n\nAcme Support\n blah blah').then(res => {
          assert.equal(res, 'blah blah\n\n\nAcme Support\n blah blah');
        });
      })
      .then(() => {
        return redactor.redact('blah blah\n\n\n   Joshua\n blah blah').then(res => {
          assert.equal(res, 'blah blah\n\n\n   PERSON_NAME\n blah blah');
        });
      })
      .then(() => {
        // Failing ; Acme Support is still recognized as a name and gets replaced
        // return redactor.redact('blah blah\n\n\nAll the best,\n\n-Acme Support\n\nfoo bar').then(res => {
        //   assert.equal(res, 'blah blah\n\n\nAll the best,\n\n-Acme Support\n\nfoo bar');
        // });
      })
      .then(() => {
        return redactor.redact('blah blah\n\n\nAll the best,\n\n--Meg C.\n\nAcme Support').then(res => {
          assert.equal(res, 'blah blah\n\n\nAll the best,\n\n--PERSON_NAME\n\nAcme Support');
        });
      })
      .then(() => {
        return redactor.redact('blah blah\n\n\nAll the best,\n\n-John\n\nAcme Support').then(res => {
          assert.equal(res, 'blah blah\n\n\nAll the best,\n\n-PERSON_NAME\n\nAcme Support');
        });
      })
      .then(() => {
        return redactor.redact('blah blah\nthanks Joshua.\n blah blah').then(res => {
          assert.equal(res, 'blah blah\nthanks PERSON_NAME.\n blah blah');
        });
      })
      .then(() => {
        return redactor.redact('Hi David Johnson,\nHow are you?\n\nthanks Joshua.\n blah blah').then(res => {
          assert.equal(res, 'Hi PERSON_NAME,\nHow are you?\n\nthanks PERSON_NAME.\n blah blah');
        });
      })
      .then(() => {
        return redactor.redact('Subject. Hi David Johnson.').then(res => {
          assert.equal(res, 'Subject. Hi PERSON_NAME.');
        });
      })
      .then(() => {
        return redactor
          .redact('to hearing from you.\n\nAll the best,\n\nAngel\nCustomer Experience\nwww.foo.com')
          .then(res => {
            assert.equal(res, 'to hearing from you.\n\nAll the best,\n\nPERSON_NAME\nCustomer Experience\nwww.foo.com');
          });
      })
      .then(() => {
        return redactor
          .redact('getting this sorted out.\n\nKindest regards,\n\nFoo Bar\nCustomer Experience')
          .then(res => {
            assert.equal(res, 'getting this sorted out.\n\nKindest regards,\n\nPERSON_NAME\nCustomer Experience');
          });
      })
      .then(() => {
        return redactor.redact('blah.\n\nAffectionately,\n\nFoo Bar\nblah').then(res => {
          assert.equal(res, 'blah.\n\nAffectionately,\n\nPERSON_NAME\nblah');
        });
      })
      .then(() => {
        return redactor.redact('blah.\n\nHappy Meditating!\n\nFoo Bar\nblah').then(res => {
          assert.equal(res, 'blah.\n\nHappy Meditating!\n\nPERSON_NAME\nblah');
        });
      })
      .then(() => {
        return redactor.redact('blah.\n\nTake care!\n\nFoo Bar\nblah').then(res => {
          assert.equal(res, 'blah.\n\nTake care!\n\nPERSON_NAME\nblah');
        });
      })
      .then(() => {
        return redactor.redact('blah.\n\nHave a wonderful weekend.\n\nFoo Bar\nblah').then(res => {
          assert.equal(res, 'blah.\n\nHave a wonderful weekend.\n\nPERSON_NAME\nblah');
        });
      })
      .then(() => {
        return redactor.redact('blah blah. Thanks -Jon').then(res => {
          assert.equal(res, 'blah blah. Thanks -PERSON_NAME');
        });
      });
  });

  it('should replace credit card numbers', function() {
    return redactor
      .redact('my card: 1234 5678 8765 4321.')
      .then(res => {
        assert.equal(res, 'my card: CREDIT_CARD_NUMBER.');
      })
      .then(() => {
        return redactor.redact('my 2nd card: 1234-5678-8765-4321.').then(res => {
          assert.equal(res, 'my 2nd card: CREDIT_CARD_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my 3rd card: 1234 5678 8765 4321.').then(res => {
          assert.equal(res, 'my 3rd card: CREDIT_CARD_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my AMEX card: 1234 567890 12345.').then(res => {
          assert.equal(res, 'my AMEX card: CREDIT_CARD_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my AMEX 2nd card: 1234-567890-12345.').then(res => {
          assert.equal(res, 'my AMEX 2nd card: CREDIT_CARD_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my AMEX 3rd card: 123456789012345.').then(res => {
          assert.equal(res, 'my AMEX 3rd card: CREDIT_CARD_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my DINERS card: 1234 567890 1234.').then(res => {
          assert.equal(res, 'my DINERS card: CREDIT_CARD_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my DINERS 2nd card: 1234-567890-1234.').then(res => {
          assert.equal(res, 'my DINERS 2nd card: CREDIT_CARD_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my DINERS 3rd card: 12345678901234.').then(res => {
          assert.equal(res, 'my DINERS 3rd card: CREDIT_CARD_NUMBER.');
        });
      });
  });

  it('should replace ssn', function() {
    return redactor
      .redact('my ssn: 123 45 6789.')
      .then(res => {
        assert.equal(res, 'my ssn: US_SOCIAL_SECURITY_NUMBER.');
      })
      .then(() => {
        return redactor.redact('my ssn: 123-45-6789.').then(res => {
          assert.equal(res, 'my ssn: US_SOCIAL_SECURITY_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my ssn: 123.45.6789.').then(res => {
          assert.equal(res, 'my ssn: US_SOCIAL_SECURITY_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my ssn: 123456789.').then(res => {
          assert.equal(res, 'my ssn: US_SOCIAL_SECURITY_NUMBER.');
        });
      });
  });

  it('should replace phone numbers', function() {
    return redactor
      .redact('my phone: (+44) (555)123-1234.')
      .then(res => {
        assert.equal(res, 'my phone: PHONE_NUMBER.');
      })
      .then(() => {
        return redactor.redact('my phone: 1-555-123-1234.').then(res => {
          assert.equal(res, 'my phone: PHONE_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my phone: 555.123.1234.').then(res => {
          assert.equal(res, 'my phone: PHONE_NUMBER.');
        });
      })
      .then(() => {
        return redactor.redact('my phone: 5551231234.').then(res => {
          assert.equal(res, 'my phone: PHONE_NUMBER.');
        });
      });
  });

  it('should replace ip addresses', function() {
    return redactor
      .redact('my ip: 10.1.1.235.')
      .then(res => {
        assert.equal(res, 'my ip: IP_ADDRESS.');
      })
      .then(() => {
        return redactor.redact('my ip: 1234:ABCD:23AF:1111:2222:3333:0000:0000:0000.').then(res => {
          assert.equal(res, 'my ip: IP_ADDRESS.');
        });
      })
      .then(() => {
        return redactor.redact('my ip: 1234:ABCD:23AF:1111:2222:3333::!').then(res => {
          assert.equal(res, 'my ip: IP_ADDRESS!');
        });
      });
  });

  it('should replace email addresses', function() {
    return redactor
      .redact('my email: joe123@solvvy.co.uk.')
      .then(res => {
        assert.equal(res, 'my email: EMAIL_ADDRESS.');
      })
      .then(() => {
        return redactor.redact('my email is other+foobar@t.co.').then(res => {
          assert.equal(res, 'my email is EMAIL_ADDRESS.');
        });
      });
  });

  it('should replace street addresses', function() {
    return redactor
      .redact('I live at 123 Park Ave Apt 123 New York City, NY 10002')
      .then(res => {
        useGoogleApi
          ? assert.equal(res, 'I live at STREET_ADDRESS US_STATE City, LOCATION ZIPCODE')
          : assert.equal(res, 'I live at STREET_ADDRESS New York City, NY ZIPCODE');
      })
      .then(() => {
        return redactor.redact('my address is 56 N First St CA 90210').then(res => {
          useGoogleApi
            ? assert.equal(res, 'my address is STREET_ADDRESS LOCATION ZIPCODE')
            : assert.equal(res, 'my address is STREET_ADDRESS CA ZIPCODE');
        });
      });
  });

  it('should not replace street words in context', function() {
    verify([
      'Oh no worries I live right down the street and up the boulevard',
      'There is no way that I will pay for that circle in court',
      'I have thought of many ways to finish that drive'
    ]);
  });

  it('should replace usernames and passwords', function() {
    return redactor
      .redact('here is my username: foobar and my password: baz123')
      .then(res => {
        assert.equal(res, 'here is my USERNAME and my PASSWORD');
      })
      .then(() => {
        return redactor.redact('here is the login info: foobar\npassword').then(res => {
          assert.equal(res, 'here is the CREDENTIALS');
        });
      })
      .then(() => {
        return redactor.redact('user: thislibrary\npass: 1$d0P3!').then(res => {
          assert.equal(res, 'USERNAME\nPASSWORD');
        });
      });
  });

  it('should respect a custom string replacement', function() {
    let customRedactor = Redactor({ replace: 'REDACTED', enableGoogleCloudDLP: false });
    return customRedactor.redact('my ip: 10.1.1.235.').then(res => {
      assert.equal(res, 'my ip: REDACTED.');
    });
  });

  it('should respect a custom function replacement', function() {
    let customRedactor = Redactor({
      replace: function(name, defaultReplacement) {
        if (name === 'creditCardNumber') {
          return value => 'XXXXXXXXXXXX' + value.slice(12);
        } else if (name === 'greetOrClose') {
          return 'FULL_NAME';
        } else {
          return defaultReplacement;
        }
      },
      enableGoogleCloudDLP: false
    });

    return customRedactor
      .redact('my CC is 1234567812345678')
      .then(res => {
        assert.equal(res, 'my CC is XXXXXXXXXXXX5678');
      })
      .then(() => {
        return customRedactor.redact('Dear David Johnson, he lives in 90210').then(res => {
          assert.equal(res, 'Dear FULL_NAME, he lives in ZIPCODE');
        });
      });
  });

  it('should accept new patterns', function() {
    let redactor = Redactor({ animal: /\b(cat|dog|cow)s?\b/gi });
    return redactor.redact('I love cats, dogs, and cows').then(res => {
      assert.equal(res, 'I love ANIMAL, ANIMAL, and ANIMAL');
    });
  });

  it('should replace digits', function() {
    return redactor.redact('codeA: 123, codeB: 6789').then(res => {
      assert.equal(res, 'codeA: 123, codeB: DIGITS');
    });
  });

  it('should replace URLs', function() {
    return redactor
      .redact('My homepage is http://example.com')
      .then(res => {
        assert.equal(res, 'My homepage is URL');
      })
      .then(() => {
        return redactor.redact('ip http://127.0.0.1/example.html test').then(res => {
          assert.equal(res, 'ip URL test');
        });
      })
      .then(() => {
        return redactor.redact('custom protocol myapp://example.com').then(res => {
          assert.equal(res, 'custom protocol URL');
        });
      })
      .then(() => {
        return redactor.redact('Reset password url is https://example.com/reset/password/12345').then(res => {
          assert.equal(res, 'Reset password url is URL');
        });
      })
      .then(() => {
        return redactor
          .redact('complex http://user@pass:example.com:8080/reset/password/12345?foo=bar&hi=there#/app works?')
          .then(res => {
            assert.equal(res, 'complex URL works?');
          });
      })
      .then(() => {
        return redactor.redact('before http://www.example.com after').then(res => {
          assert.equal(res, 'before URL after');
        });
      })
      .then(() => {
        return redactor.redact('before http://www.example.com:123 after').then(res => {
          assert.equal(res, 'before URL after');
        });
      })
      .then(() => {
        return redactor.redact('before http://www.example.com/foo after').then(res => {
          assert.equal(res, 'before URL after');
        });
      })
      .then(() => {
        return redactor.redact('before http://www.example.com/foo/bar after').then(res => {
          assert.equal(res, 'before URL after');
        });
      })
      .then(() => {
        return redactor.redact('before http://www.example.com/foo/bar?foo=bar after').then(res => {
          assert.equal(res, 'before URL after');
        });
      })
      .then(() => {
        return redactor.redact('before http://www.example.com/foo/bar?foo=bar#/foo/bar after').then(res => {
          assert.equal(res, 'before URL after');
        });
      })
      .then(() => {
        return redactor.redact('My homepage is http://example.com\nAnd that is that.').then(res => {
          assert.equal(res, 'My homepage is URL\nAnd that is that.');
        });
      });
  });

  it('should redact non english text(only online mode)', function() {
    if (dlpWrapper.enable) {
      return redactor
        .redact('我的名字是王')
        .then(res => {
          assert.equal(res, '我的名字是王');
        })
        .then(() => {
          return redactor.redact('我的卡号是1234-5678-9876-5432').then(res => {
            assert.equal(res, '我的卡号是CREDIT_CARD_NUMBER');
          });
        })
        .then(() => {
          return redactor.redact('我的电话是 4443332343').then(res => {
            assert.equal(res, '我的电话是 PHONE_NUMBER');
          });
        });
    } else return Promise.resolve(true);
  });
});
