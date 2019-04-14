import { ISyncRedactor } from '../types';
import { snakeCase } from 'lodash';

export class SimpleRegexpRedactor implements ISyncRedactor {
  regexpMatcher: RegExp;
  replaceWith: string;

  constructor({
    replacementValue = snakeCase(name).toUpperCase(),
    regexpPattern: regexpMatcher
  }: {
    replacementValue: string;
    regexpPattern: RegExp;
  }) {
    this.replaceWith = replacementValue;
    this.regexpMatcher = regexpMatcher;
  }

  redact(textToRedact: string) {
    return textToRedact.replace(this.regexpMatcher, this.replaceWith);
  }
}
