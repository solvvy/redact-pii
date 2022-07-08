import { ISyncRedactor } from '../types';
import { snakeCase } from 'lodash';

export class SimpleRegexpRedactor implements ISyncRedactor {
  regexpMatcher: RegExp;
  replaceWith: string;

  constructor({
    replaceWith = snakeCase().toUpperCase(),
    regexpPattern: regexpMatcher,
  }: {
    replaceWith: string;
    regexpPattern: RegExp;
  }) {
    this.replaceWith = replaceWith;
    this.regexpMatcher = regexpMatcher;
  }

  redact(textToRedact: string) {
    return textToRedact.replace(this.regexpMatcher, this.replaceWith);
  }
}
