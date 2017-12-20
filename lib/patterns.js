var names = require('./names.json').sort().reverse();

var aptRegex = /(apt|bldg|dept|fl|hngr|lot|pier|rm|ste|slip|trlr|unit|#)\.? *[a-z0-9-]+\b/gi;
var poBoxRegex = /P\.? ?O\.? *Box +\d+/gi;
var roadRegex = /(street|st|road|rd|avenue|ave|drive|dr|loop|court|ct|circle|cir|lane|ln|boulevard|blvd|way)\.?\b/gi;
var greetingRegex = /(^|\.\s+)(dear|hi|hello|greetings|hey|hey there)/gi;
var closingRegex = /(thx|thanks|thank you|regards|best|[a-z]+ly|[a-z]+ regards|all the best|happy [a-z]+ing|take care|have a [a-z]+ (weekend|night|day))/gi;
var newlineRegex = /([\n\f\r-]+\s*)/gi;

module.exports = {
  greetOrClose: new RegExp(`(((${greetingRegex.source})|(${closingRegex.source}[,.!]?))[\\s-]+)`, 'gi'),
  nameGeneric: new RegExp(`( ?(([A-Z][a-z]+)|([A-Z]\\.)))+([,.]|[,.]?$)`, 'gm'),
  names: new RegExp(`${newlineRegex.source}( ?(${names.join('|')}))+`, 'gi'),
  creditCardNumber: /\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}|\d{4}[ -]?\d{6}[ -]?\d{4}\d?/g,
  streetAddress: new RegExp(`(\\d+\\s*(\\w+ ){1,2}${roadRegex.source}(\\s+${aptRegex.source})?)|(${poBoxRegex.source})`, 'gi'),
  zipcode: /\b\d{5}\b(-\d{4})?\b/g,
  phoneNumber: /(\(?\+?[0-9]{1,2}\)?[-. ]?)?(\(?[0-9]{3}\)?|[0-9]{3})[-. ]?([0-9]{3}[-. ]?[0-9]{4}|\b[A-Z0-9]{7}\b)/g,
  ipAddress: /(\d{1,3}(\.\d{1,3}){3}|[0-9A-F]{4}(:[0-9A-F]{4}){5}(::|(:0000)+))/gi,
  ssn: /\b\d{3}[ -.]?\d{2}[ -.]?\d{4}\b/g,
  emailAddress: /([a-z0-9_\-.+]+)@\w+(\.\w+)*/gi,
  username: /(user( ?name)?|login): \S+/gi,
  password: /(pass(word|phrase)?|secret): \S+/gi,
  credentials: /(login( cred(ential)?s| info(rmation)?)?|cred(ential)?s) ?:\s*\S+\s+\/?\s*\S+/gi,
  digits: /\b\d{4,}\b/g,
  url: /([^\s:/?#]+):\/\/([^/?#\s]*)([^?#\s]*)(\?([^#\s]*))?(#([^\s]*))?/g
};
