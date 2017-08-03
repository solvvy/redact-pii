var firstNames = require('./firstNames.json');
var lastNames = require('./lastNames.json');

var aptRegex = /(apt|bldg|dept|fl|hngr|lot|pier|rm|ste|slip|trlr|unit|#)\.? *[a-z0-9-]+\b/gi;
var poBoxRegex = /P\.? ?O\.? *Box +\d+/gi;
var roadRegex = /(street|st|road|rd|avenue|ave|drive|dr|loop|court|ct|circle|cir|lane|ln|boulevard|blvd|way)\.?\b/gi;

module.exports = {
  name: new RegExp(`\\b(${firstNames.join('|')}|${lastNames.join('|')})\\b`, 'gi'),
  creditCardNumber: /\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}|\d{4}[ -]?\d{6}[ -]?\d{4}\d?/g,
  streetAddress: new RegExp(`(\\d+\\s*(\\w+ ){1,2}${roadRegex.source}(\\s+${aptRegex.source})?)|(${poBoxRegex.source})`, 'gi'),
  zipcode: /\b\d{5}\b(-\d{4})?\b/gi,
  phoneNumber: /(\(?\+?[0-9]{1,2}\)?[-. ]?)?(\(?[0-9]{3}\)?|[0-9]{3})[-. ]?([0-9]{3}[-. ]?[0-9]{4}|\b[A-Z0-9]{7}\b)/g,
  ipAddress: /(\d{1,3}(\.\d{1,3}){3}|[0-9A-F]{4}(:[0-9A-F]{4}){5}(::|(:0000)+))/gi,
  ssn: /\d{3}[ -.]?\d{2}[ -.]?\d{4}/g,
  emailAddress: /([a-z0-9_\-.+]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-z0-9-]+\.?)+))([a-z]{2,4}|[0-9]{1,3})(]?)/gi,
  username: /(user( ?name)?|login): \S+/gi,
  password: /(pass(word|phrase)?|secret): \S+/gi,
  credentials: /(login( cred(ential)?s| info(rmation)?)?|cred(ential)?s) ?:\s*\S+\s+\/?\s*\S+/gi,
  company: /([A-Z&][\w,]* )+(I[Nn][Cc](orporated)?|C[Oo](rp(oration)?)?|LLP|llc|LLC|plc|gmbh)\.?(\b|$)/g,
  salutation: /(^|\n(\s+)?)(dear|hi|hey|hello|greetings) ([^,:;\s]+(,? )?){1,5}[,;\n]/gi,
  valediction: /([Tt]hank(s| you)( for [^!,.]+| again)?|[Cc]heers|[Ss]incerely|[Rr]egards|[Rr]espectfully|[Bb]est|[Bb]est regards|[Yy]ours truly)\s*[!,.]?\s*([A-Z&]([\w&]+)?\.?( )?)+[^a-z]*$/g,
  digits: /\d+/g,
  url: /([^\s:/?#]+):\/\/([^/?#\s]*)([^?#\s]*)(\?([^#\s]*))?(#([^\s]*))?/
};
