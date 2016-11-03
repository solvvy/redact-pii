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

  it('should replace names', function () {
    redactor.redact('Michael Johnson ran').should.equal('NAME ran');
    redactor.redact('and David Beckham kicked').should.equal('and NAME kicked');
    redactor.redact('George said to Michelle Johnson, "totes"').should.equal('NAME said to NAME, "totes"');
    redactor.redact('Simon Ross, Rachel Todd, and Joesph Bennett went to the store').should.equal('NAME, NAME, and NAME went to the store');
  });

  it('should replace credit card numbers', function () {
    redactor.redact('my card: 1234 5678 8765 4321.').should.equal('my card: CREDIT_CARD_NUMBER.');
    redactor.redact('my 2nd card: 1234-5678-8765-4321.').should.equal('my 2nd card: CREDIT_CARD_NUMBER.');
    redactor.redact('my 3rd card: 1234567887654321.').should.equal('my 3rd card: CREDIT_CARD_NUMBER.');
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

  it('should replace usernames and passwords', function () {
    redactor.redact('here is my username: foobar and my password: baz123').should.equal('here is my USERNAME and my PASSWORD');
    redactor.redact('here is the login info: foobar\npassword').should.equal('here is the CREDENTIALS');
    redactor.redact('user: thislibrary\npass: 1$d0P3!').should.equal('USERNAME\nPASSWORD');
  });

  it('should replace companies', function () {
    redactor.redact('my account is for Cool Beans Inc.').should.equal('my account is for COMPANY');
    redactor.redact('i represent Mumford & Sons Co.').should.equal('i represent COMPANY');
    redactor.redact('I work for Johnson & Johnson LLC').should.equal('I work for COMPANY');
  });

  it('should replace salutations', function () {
    redactor.redact(`Dear Mr. Jones,
      Thank you for reading this message!
    `).should.equal(`SALUTATION
      Thank you for reading this message!
    `);

    redactor.redact(`Hi John, Jessie, and Jacob,
      I had a quick question...
    `).should.equal(`SALUTATION
      I had a quick question...
    `);
  });

  it('should not replace salutation words in context', function () {
    verify([
      'hi there how do i change my name?',
      'so then I said hello to my friend, Jimothy',
    ]);
  });

  it('should replace valedictions', function () {
    redactor.redact('Are we there yet?\nThanks,\nPatrick').should.equal('Are we there yet?\nVALEDICTION');
    redactor.redact('Hello?\nBest,\nJustin & The Solvvy Team').should.equal('Hello?\nVALEDICTION');
  });

  it('should not replace valediction words in context', function () {
    verify([
      'they have the best pizza!',
      'thanks for doing that bro',
      'I sincerely thank you for doing the best yours truly.',
    ])
  });

  it('should respect a custom string replacement', function () {
    redactor = Redactor({replace: 'REDACTED'});
    redactor.redact('my ip: 10.1.1.235.').should.equal('my ip: REDACTED.');
    redactor.redact('my ip: 10.1.1.235.').should.equal('my ip: REDACTED.');
  });
});
