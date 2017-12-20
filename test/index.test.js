defineTest('index.js', function (Redactor) {
  var redactor = Redactor();

  function verify(items) {
    items.forEach(function (item) {
      redactor.redact(item).should.equal(item);
    });
  }

  it('should return non-strings', function () {
    var obj = {foo: 'bar'};
    (typeof redactor.redact(undefined)).should.equal('undefined');
    (typeof redactor.redact(null)).should.equal('object');
    redactor.redact(obj).should.equal(obj);
    redactor.redact(true).should.equal(true);
    redactor.redact(1234).should.equal(1234);
  });

  it('should be speedy', function () {
    this.timeout(100);
    for(var i = 0; i < 100; i++) {
      redactor.redact('hi I had a quick question about using the service');
    }
  });

  it('should redact PII', function () {
    var original = 'Hey it\'s David Johnson with ACME Corp. Give me a call at 555-555-5555';
    var expected = 'Hey it\'s David Johnson with ACME Corp. Give me a call at PHONE_NUMBER';
    redactor.redact(original).should.equal(expected);
  });

  it('should replace names', function () {
    redactor.redact('here\'s my Cliff. blah blah').should.equal('here\'s my Cliff. blah blah');
    redactor.redact('here\'s my Clifford. blah blah').should.equal('here\'s my Clifford. blah blah');
    redactor.redact('Dear Clifford,\n blah blah').should.equal('Dear NAME,\n blah blah');
    redactor.redact('blah blah\n\n\nthanks,\nAnna\n blah blah').should.equal('blah blah\n\n\nthanks,\nNAME\n blah blah');
    redactor.redact('blah blah\n\n\nAnna\n blah blah').should.equal('blah blah\n\n\nNAME\n blah blah');
    redactor.redact('blah blah\n\n\nAcme Support\n blah blah').should.equal('blah blah\n\n\nAcme Support\n blah blah');
    redactor.redact('blah blah\n\n\n   Joshua\n blah blah').should.equal('blah blah\n\n\n   NAME\n blah blah');
    redactor.redact('blah blah\n\n\nAll the best,\n\n-Acme Support\n\nfoo bar').should.equal('blah blah\n\n\nAll the best,\n\n-NAME\n\nfoo bar');
    redactor.redact('blah blah\n\n\nAll the best,\n\n--Meg C.\n\nAcme Support').should.equal('blah blah\n\n\nAll the best,\n\n--NAME\n\nAcme Support');
    redactor.redact('blah blah\n\n\nAll the best,\n\n-John\n\nAcme Support').should.equal('blah blah\n\n\nAll the best,\n\n-NAME\n\nAcme Support');
    redactor.redact('blah blah\nthanks Joshua.\n blah blah').should.equal('blah blah\nthanks NAME.\n blah blah');
    redactor.redact('Hi David Johnson,\nHow are you?\n\nthanks Joshua.\n blah blah').should.equal('Hi NAME,\nHow are you?\n\nthanks NAME.\n blah blah');;
    redactor.redact('Subject. Hi David Johnson.').should.equal('Subject. Hi NAME.');;
  });

  it('should replace credit card numbers', function () {
    redactor.redact('my card: 1234 5678 8765 4321.').should.equal('my card: CREDIT_CARD_NUMBER.');
    redactor.redact('my 2nd card: 1234-5678-8765-4321.').should.equal('my 2nd card: CREDIT_CARD_NUMBER.');
    redactor.redact('my 3rd card: 1234567887654321.').should.equal('my 3rd card: CREDIT_CARD_NUMBER.');

    redactor.redact('my AMEX card: 1234 567890 12345.').should.equal('my AMEX card: CREDIT_CARD_NUMBER.');
    redactor.redact('my AMEX 2nd card: 1234-567890-12345.').should.equal('my AMEX 2nd card: CREDIT_CARD_NUMBER.');
    redactor.redact('my AMEX 3rd card: 123456789012345.').should.equal('my AMEX 3rd card: CREDIT_CARD_NUMBER.');
    
    redactor.redact('my DINERS card: 1234 567890 1234.').should.equal('my DINERS card: CREDIT_CARD_NUMBER.');
    redactor.redact('my DINERS 2nd card: 1234-567890-1234.').should.equal('my DINERS 2nd card: CREDIT_CARD_NUMBER.');
    redactor.redact('my DINERS 3rd card: 12345678901234.').should.equal('my DINERS 3rd card: CREDIT_CARD_NUMBER.');
  });

  it('should replace ssn', function () {
    redactor.redact('my ssn: 123 45 6789.').should.equal('my ssn: SSN.');
    redactor.redact('my ssn: 123-45-6789.').should.equal('my ssn: SSN.');
    redactor.redact('my ssn: 123.45.6789.').should.equal('my ssn: SSN.');
    redactor.redact('my ssn: 123456789.').should.equal('my ssn: SSN.');
  });

  it('should replace phone numbers', function () {
    redactor.redact('my phone: (+44) (555)123-1234.').should.equal('my phone: PHONE_NUMBER.');
    redactor.redact('my phone: 1-555-123-1234.').should.equal('my phone: PHONE_NUMBER.');
    redactor.redact('my phone: 555.123.1234.').should.equal('my phone: PHONE_NUMBER.');
    redactor.redact('my phone: 5551231234.').should.equal('my phone: PHONE_NUMBER.');
  });

  it('should replace ip addresses', function () {
    redactor.redact('my ip: 10.1.1.235.').should.equal('my ip: IP_ADDRESS.');
    redactor.redact('my ip: 1234:ABCD:23AF:1111:2222:3333:0000:0000:0000.').should.equal('my ip: IP_ADDRESS.');
    redactor.redact('my ip: 1234:ABCD:23AF:1111:2222:3333::!').should.equal('my ip: IP_ADDRESS!');
  });

  it('should replace email addresses', function () {
    redactor.redact('my email: joe123@solvvy.co.uk.').should.equal('my email: EMAIL_ADDRESS.');
    redactor.redact('my email is other+foobar@t.co.').should.equal('my email is EMAIL_ADDRESS.');
  });

  it('should replace street addresses', function () {
    redactor.redact('I live at 123 Park Ave Apt 123 New York City, NY 10002').should.equal('I live at STREET_ADDRESS New York City, NY ZIPCODE');
    redactor.redact('my address is 56 N First St CA 90210').should.equal('my address is STREET_ADDRESS CA ZIPCODE');
  });

  it('should not replace street words in context', function () {
    verify([
      'Oh no worries I live right down the street and up the boulevard',
      'There is no way that I will pay for that circle in court',
      'I have thought of many ways to finish that drive',
    ]);
  });

  it('should replace usernames and passwords', function () {
    redactor.redact('here is my username: foobar and my password: baz123').should.equal('here is my USERNAME and my PASSWORD');
    redactor.redact('here is the login info: foobar\npassword').should.equal('here is the CREDENTIALS');
    redactor.redact('user: thislibrary\npass: 1$d0P3!').should.equal('USERNAME\nPASSWORD');
  });

  it('should respect a custom string replacement', function () {
    redactor = Redactor({replace: 'REDACTED'});
    redactor.redact('my ip: 10.1.1.235.').should.equal('my ip: REDACTED.');
    redactor.redact('my ip: 10.1.1.235.').should.equal('my ip: REDACTED.');
  });

  it('should respect a custom function replacement', function () {
    redactor = Redactor({
      replace: function (name, defaultReplacement) {
        if (name === 'creditCardNumber') {
          return value => 'XXXXXXXXXXXX' + value.slice(12);
        } else if (name === 'greetOrClose') {
          return 'FULL_NAME';
        } else {
          return defaultReplacement;
        }
      }
    });

    redactor.redact('my CC is 1234567812345678').should.equal('my CC is XXXXXXXXXXXX5678');
    redactor.redact('Dear David Johnson, he lives in 90210').should.equal('Dear FULL_NAME, he lives in ZIPCODE');
  });

  it('should accept new patterns', function () {
    var redactor = Redactor({animal: /\b(cat|dog|cow)s?\b/gi});
    redactor.redact('I love cats, dogs, and cows').should.equal('I love ANIMAL, ANIMAL, and ANIMAL');
  });

  it('should replace digits', function () {
    redactor.redact('codeA: 123, codeB: 6789').should.equal('codeA: 123, codeB: DIGITS');
  });

  it('should replace URLs', function () {
    redactor.redact('My homepage is http://example.com').should.equal('My homepage is URL');
    redactor.redact('ip http://127.0.0.1/example.html test').should.equal('ip URL test');
    redactor.redact('custom protocol myapp://example.com').should.equal('custom protocol URL');
    redactor.redact('Reset password url is https://example.com/reset/password/12345').should.equal('Reset password url is URL');
    redactor.redact('complex http://user@pass:example.com:8080/reset/password/12345?foo=bar&hi=there#/app works?').should.equal('complex URL works?');
    redactor.redact('before http://www.example.com after').should.equal('before URL after');
    redactor.redact('before http://www.example.com:123 after').should.equal('before URL after');
    redactor.redact('before http://www.example.com/foo after').should.equal('before URL after');
    redactor.redact('before http://www.example.com/foo/bar after').should.equal('before URL after');
    redactor.redact('before http://www.example.com/foo/bar?foo=bar after').should.equal('before URL after');
    redactor.redact('before http://www.example.com/foo/bar?foo=bar#/foo/bar after').should.equal('before URL after');
    redactor.redact('before http://www.example.com/sub/dir/ after').should.equal('before URL after');
    redactor.redact('My homepage is http://example.com\nAnd that is that.').should.equal('My homepage is URL\nAnd that is that.');
  });

});
