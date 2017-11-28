var names = require('./names.json').sort().reverse();

var aptRegex = /(apt|bldg|dept|fl|hngr|lot|pier|rm|ste|slip|trlr|unit|#)\.? *[a-z0-9-]+\b/gi;
var poBoxRegex = /P\.? ?O\.? *Box +\d+/gi;
var roadRegex = /(street|st|road|rd|avenue|ave|drive|dr|loop|court|ct|circle|cir|lane|ln|boulevard|blvd|way)\.?\b/gi;
var greetOrCloseRegex = /((((dear|hi|hello|greetings)|((thanks|thank you|regards|best|sincerely|best regards|warm regards|warmest regards|warmly|all the best)[,.]?))\s+)|([\n\f\r]\s*))/gi;

module.exports = {
  name: new RegExp(`${greetOrCloseRegex.source}((${names.join('|')}) ?)+`, 'gi'),
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
