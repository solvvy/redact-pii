import { ISyncRedactor } from '../types';
import * as _wellKnownNames from './well-known-names.json';

const greetingRegex = /(^|\.\s+)(dear|hi|hello|greetings|hey|hey there)/gi;
const closingRegex =
  /(thx|thanks|thank you|regards|best|[a-z]+ly|[a-z]+ regards|all the best|happy [a-z]+ing|take care|have a [a-z]+ (weekend|night|day))/gi;

const greetingOrClosing = new RegExp(
  '(((' + greetingRegex.source + ')|(' + closingRegex.source + '\\s*[,.!]*))[\\s-]*)',
  'gi'
);
const genericName = new RegExp('( ?(([A-Z][a-z]+)|([A-Z]\\.)))+([,.]|[,.]?$)', 'gm');

const wellKnownNames = new RegExp('\\b(\\s*)(\\s*(' + _wellKnownNames.join('|') + '))+\\b', 'gim');

export class NameRedactor implements ISyncRedactor {
  constructor(private replaceWith = 'PERSON_NAME') {}

  redact(textToRedact: string) {
    greetingOrClosing.lastIndex = 0;
    genericName.lastIndex = 0;
    let greetingOrClosingMatch = greetingOrClosing.exec(textToRedact);
    while (greetingOrClosingMatch !== null) {
      genericName.lastIndex = greetingOrClosing.lastIndex;
      let genericNameMatch = genericName.exec(textToRedact);
      if (genericNameMatch !== null && genericNameMatch.index === greetingOrClosing.lastIndex) {
        let suffix = genericNameMatch[5] === null ? '' : genericNameMatch[5];
        textToRedact =
          textToRedact.slice(0, genericNameMatch.index) +
          this.replaceWith +
          suffix +
          textToRedact.slice(genericNameMatch.index + genericNameMatch[0].length);
      }
      greetingOrClosingMatch = greetingOrClosing.exec(textToRedact);
    }

    textToRedact = textToRedact.replace(wellKnownNames, '$1' + this.replaceWith);

    return textToRedact;
  }
}
